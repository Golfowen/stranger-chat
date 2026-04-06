import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, doc, getDoc, updateDoc, onSnapshot, addDoc, deleteDoc, getDocs, Unsubscribe
} from 'firebase/firestore';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTC(chatId: string, currentUserId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connected' | 'ended'>('idle');
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [callerId, setCallerId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callTimer, setCallTimer] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Store listener unsubscribers to prevent memory leaks
  const listenersRef = useRef<Unsubscribe[]>([]);

  // Cleanup all Firestore listeners created during a call
  const cleanupListeners = useCallback(() => {
    listenersRef.current.forEach(unsub => {
      try { unsub(); } catch {}
    });
    listenersRef.current = [];
  }, []);

  // Timer logic
  useEffect(() => {
    if (callStatus === 'connected') {
      setCallTimer(0);
      const interval = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
      timerRef.current = interval;
      return () => clearInterval(interval);
    } else {
      if (callStatus === 'idle') setCallTimer(0);
    }
  }, [callStatus]);

  const formattedTimer = useCallback(() => {
    const mins = Math.floor(callTimer / 60);
    const secs = callTimer % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [callTimer]);

  // Listen for incoming calls (this one is properly cleaned up by useEffect)
  useEffect(() => {
    if (!chatId || !currentUserId) return;
    const unsub = onSnapshot(doc(db, 'chats', chatId), (snapshot) => {
      const data = snapshot.data();
      if (data?.call) {
        const newStatus = data.call.status;
        setCallType(data.call.type);
        setCallerId(data.call.callerId);
        
        if (newStatus === 'ended') {
          // Don't call hangup recursively — just clean up local state
          cleanupLocalState();
        } else {
          setCallStatus(newStatus);
        }
      } else {
        // Call data was removed, clean up
        if (callStatus !== 'idle') {
          cleanupLocalState();
        }
      }
    }, (error) => {
      console.warn('[WebRTC] Chat listener error:', error);
    });
    return () => unsub();
  }, [chatId, currentUserId]);

  const cleanupLocalState = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    setLocalStream(prev => {
      prev?.getTracks().forEach(track => track.stop());
      return null;
    });
    setRemoteStream(prev => {
      prev?.getTracks().forEach(track => track.stop());
      return null;
    });
    
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    
    cleanupListeners();
    setCallStatus('idle');
    setIsMuted(false);
    setIsVideoEnabled(true);
  }, [cleanupListeners]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupLocalState();
    };
  }, []);

  const initPC = useCallback(() => {
    const pc = new RTCPeerConnection(servers);
    
    pc.ontrack = (event) => {
      const stream = new MediaStream();
      event.streams[0].getTracks().forEach((track) => stream.addTrack(track));
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    // Monitor connection state to detect dropped connections
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.warn('[WebRTC] Connection lost:', pc.connectionState);
        hangup();
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        console.warn('[WebRTC] ICE connection failed');
        hangup();
      }
    };
    
    pcRef.current = pc;
    return pc;
  }, []);

  const getMedia = async (isVideo: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo ? { facingMode: 'user' } : false,
        audio: true,
      });
      setLocalStream(stream);
      setIsVideoEnabled(isVideo);
      setIsMuted(false);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      console.error('[WebRTC] Failed to get media:', err);
      throw new Error('Could not access camera/microphone. Please check permissions.');
    }
  };

  const toggleAudio = useCallback(() => {
    setLocalStream(stream => {
      if (stream) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !audioTrack.enabled;
          setIsMuted(!audioTrack.enabled);
        }
      }
      return stream;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setLocalStream(stream => {
      if (stream && callType === 'video') {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !videoTrack.enabled;
          setIsVideoEnabled(videoTrack.enabled);
        }
      }
      return stream;
    });
  }, [callType]);

  const startCall = async (isVideo: boolean) => {
    try {
      setCallType(isVideo ? 'video' : 'audio');
      setCallStatus('ringing');
      const pc = initPC();
      const stream = await getMedia(isVideo);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const callerCandidatesCollection = collection(db, 'chats', chatId, 'callerCandidates');
      pc.onicecandidate = event => {
        event.candidate && addDoc(callerCandidatesCollection, event.candidate.toJSON());
      };

      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      const callInfo = {
        offer: { type: offerDescription.type, sdp: offerDescription.sdp },
        callerId: currentUserId,
        type: isVideo ? 'video' : 'audio',
        status: 'ringing'
      };
      
      await updateDoc(doc(db, 'chats', chatId), { call: callInfo });

      // Listen for Answer — store unsubscribe!
      const unsubAnswer = onSnapshot(doc(db, 'chats', chatId), (snapshot) => {
        const data = snapshot.data();
        if (!pc.currentRemoteDescription && data?.call?.answer) {
          const answerDescription = new RTCSessionDescription(data.call.answer);
          pc.setRemoteDescription(answerDescription).catch(console.error);
        }
      });
      listenersRef.current.push(unsubAnswer);

      // Listen for Callee ICE Candidates — store unsubscribe!
      const unsubCandidates = onSnapshot(collection(db, 'chats', chatId, 'calleeCandidates'), snapshot => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.addIceCandidate(candidate).catch(console.error);
          }
        });
      });
      listenersRef.current.push(unsubCandidates);
    } catch (error: any) {
      console.error('[WebRTC] startCall error:', error);
      cleanupLocalState();
      throw error;
    }
  };

  const answerCall = async () => {
    try {
      const pc = initPC();
      const isVideo = callType === 'video';
      const stream = await getMedia(isVideo);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const calleeCandidatesCollection = collection(db, 'chats', chatId, 'calleeCandidates');
      pc.onicecandidate = event => {
        event.candidate && addDoc(calleeCandidatesCollection, event.candidate.toJSON());
      };

      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      const callData = chatDoc.data()?.call;
      
      if (callData?.offer) {
        const offerDescription = new RTCSessionDescription(callData.offer);
        await pc.setRemoteDescription(offerDescription);

        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        await updateDoc(doc(db, 'chats', chatId), {
          'call.answer': { type: answerDescription.type, sdp: answerDescription.sdp },
          'call.status': 'connected'
        });
      }

      // Listen for Caller ICE Candidates — store unsubscribe!
      const unsubCandidates = onSnapshot(collection(db, 'chats', chatId, 'callerCandidates'), snapshot => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.addIceCandidate(candidate).catch(console.error);
          }
        });
      });
      listenersRef.current.push(unsubCandidates);
    } catch (error: any) {
      console.error('[WebRTC] answerCall error:', error);
      cleanupLocalState();
      throw error;
    }
  };

  const hangup = useCallback(async () => {
    // Close peer connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    // Stop all media tracks
    setLocalStream(prev => {
      prev?.getTracks().forEach(track => track.stop());
      return null;
    });
    setRemoteStream(prev => {
      prev?.getTracks().forEach(track => track.stop());
      return null;
    });
    
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    // Cleanup all Firestore listeners from the call
    cleanupListeners();

    try {
      const chatRef = doc(db, 'chats', chatId);
      const docSnap = await getDoc(chatRef);
      if (docSnap.exists() && docSnap.data().call) {
        await updateDoc(chatRef, { 'call.status': 'ended' });
        setTimeout(async () => {
          try {
            await updateDoc(chatRef, { call: null });
          } catch {}
          
          // Cleanup ICE candidate subcollections
          const cleanCol = async (colStr: string) => {
            try {
              const colRef = collection(db, 'chats', chatId, colStr);
              const sn = await getDocs(colRef);
              const deletePromises = sn.docs.map(d => deleteDoc(d.ref));
              await Promise.all(deletePromises);
            } catch {}
          };
          await cleanCol('callerCandidates');
          await cleanCol('calleeCandidates');
        }, 1500);
      }
    } catch (e) {
      console.warn('[WebRTC] hangup cleanup error:', e);
    }
    
    setCallStatus('idle');
    setIsMuted(false);
    setIsVideoEnabled(true);
  }, [chatId, cleanupListeners]);

  return {
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
    callStatus,
    callType,
    callerId,
    isMuted,
    isVideoEnabled,
    formattedTimer: formattedTimer(),
    startCall,
    answerCall,
    toggleAudio,
    toggleVideo,
    hangup
  };
}
