import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, doc, getDoc, updateDoc, onSnapshot, addDoc, serverTimestamp, setDoc, deleteDoc, getDocs 
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

  // Timer logic
  useEffect(() => {
    if (callStatus === 'connected') {
      const interval = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
      timerRef.current = interval;
      return () => clearInterval(interval);
    } else {
      setCallTimer(0);
    }
  }, [callStatus]);

  const formattedTimer = () => {
    const mins = Math.floor(callTimer / 60);
    const secs = callTimer % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Listen for incoming calls
  useEffect(() => {
    if (!chatId) return;
    const unsub = onSnapshot(doc(db, 'chats', chatId), (snapshot) => {
      const data = snapshot.data();
      if (data?.call) {
        setCallStatus(data.call.status);
        setCallType(data.call.type);
        setCallerId(data.call.callerId);
        
        if (data.call.status === 'ended') {
           hangup();
        }
      } else {
        setCallStatus('idle');
      }
    });
    return () => unsub();
  }, [chatId]);

  const initPC = () => {
    const pc = new RTCPeerConnection(servers);
    
    // Remote tracks
    pc.ontrack = (event) => {
      const stream = new MediaStream();
      event.streams[0].getTracks().forEach((track) => stream.addTrack(track));
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };
    
    pcRef.current = pc;
    return pc;
  };

  const getMedia = async (isVideo: boolean) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: isVideo ? { facingMode: 'user' } : false,
      audio: true,
    });
    setLocalStream(stream);
    setIsVideoEnabled(isVideo);
    setIsMuted(false);
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream && callType === 'video') {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const startCall = async (isVideo: boolean) => {
    setCallType(isVideo ? 'video' : 'audio');
    const pc = initPC();
    const stream = await getMedia(isVideo);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Caller ICE Candidates
    const callerCandidatesCollection = collection(db, 'chats', chatId, 'callerCandidates');
    pc.onicecandidate = event => {
      event.candidate && addDoc(callerCandidatesCollection, event.candidate.toJSON());
    };

    // Create Offer
    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const callInfo = {
      offer: { type: offerDescription.type, sdp: offerDescription.sdp },
      callerId: currentUserId,
      type: isVideo ? 'video' : 'audio',
      status: 'ringing'
    };
    
    // Write call to chat doc
    await updateDoc(doc(db, 'chats', chatId), { call: callInfo });

    // Listen for Answer
    onSnapshot(doc(db, 'chats', chatId), (snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.call?.answer) {
        const answerDescription = new RTCSessionDescription(data.call.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    // Listen for Callee ICE Candidates
    onSnapshot(collection(db, 'chats', chatId, 'calleeCandidates'), snapshot => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });
  };

  const answerCall = async () => {
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

    // Listen for Caller ICE Candidates
    onSnapshot(collection(db, 'chats', chatId, 'callerCandidates'), snapshot => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });
  };

  const hangup = async () => {
     if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
     }
     localStream?.getTracks().forEach(track => track.stop());
     remoteStream?.getTracks().forEach(track => track.stop());
     setLocalStream(null);
     setRemoteStream(null);
     
     if (localVideoRef.current) localVideoRef.current.srcObject = null;
     if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

     try {
       // Reset call info in firestore
       const chatRef = doc(db, 'chats', chatId);
       const docSnap = await getDoc(chatRef);
       if (docSnap.exists() && docSnap.data().call?.status !== 'idle') {
          await updateDoc(chatRef, { 'call.status': 'ended' });
          setTimeout(() => {
             updateDoc(chatRef, { call: null }); // clear after short delay
          }, 1000);
          
          // Cleanup ICE candidate collections
          const cleanCol = async (colStr: string) => {
            const colRef = collection(db, 'chats', chatId, colStr);
            const sn = await getDocs(colRef);
            sn.forEach(d => deleteDoc(d.ref));
          };
          await cleanCol('callerCandidates');
          await cleanCol('calleeCandidates');
       }
     } catch(e) {}
     
     setCallStatus('idle');
  };

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
