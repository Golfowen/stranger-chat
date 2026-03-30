import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

// No-op unsubscribe for error cases
const noopUnsub: Unsubscribe = () => {};

// ==================== USER OPERATIONS ====================

export async function updateUserProfile(uid: string, data: Record<string, unknown>) {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, { ...data, lastSeen: serverTimestamp() });
}

export async function getUserProfile(uid: string) {
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  } catch (error: any) {
    console.warn('[Firestore] getUserProfile error:', error?.message);
    return null;
  }
}

// ==================== MATCHING SYSTEM ====================

export async function joinWaitingQueue(
  userId: string,
  mode: 'anonymous' | 'revealed',
  interests: string[]
) {
  try {
    const docRef = await addDoc(collection(db, 'waitingQueue'), {
      userId,
      mode,
      interests,
      joinedAt: serverTimestamp(),
      randomSeed: Math.random(),
    });
    return docRef.id;
  } catch (error: any) {
    console.warn('[Firestore] joinWaitingQueue error:', error?.message);
    return null;
  }
}

export async function leaveWaitingQueue(docId: string) {
  try {
    await deleteDoc(doc(db, 'waitingQueue', docId));
  } catch (error: any) {
    console.warn('[Firestore] leaveWaitingQueue error:', error?.message);
  }
}

export async function findMatch(
  currentUserId: string,
  mode: 'anonymous' | 'revealed',
  interests: string[]
): Promise<{ chatId: string; partnerId: string } | null> {
  try {
    const result = await runTransaction(db, async (transaction) => {
      const q = query(
        collection(db, 'waitingQueue'),
        where('mode', '==', mode),
        limit(20)
      );
      const snapshot = await getDocs(q);

      let bestMatch: { id: string; userId: string; interests: string[] } | null = null;
      let bestScore = -1;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.userId !== currentUserId) {
          const commonInterests = interests.filter((i) =>
            data.interests?.includes(i)
          );
          const score = commonInterests.length;
          if (score > bestScore || (score === bestScore && Math.random() > 0.5)) {
            bestScore = score;
            bestMatch = {
              id: docSnap.id,
              userId: data.userId,
              interests: data.interests || [],
            };
          }
        }
      });

      if (!bestMatch) return null;

      const matched = bestMatch as { id: string; userId: string; interests: string[] };

      const chatRef = doc(collection(db, 'chats'));
      transaction.set(chatRef, {
        members: [currentUserId, matched.userId],
        mode,
        isActive: true,
        commonInterests: interests.filter((i) =>
          matched.interests.includes(i)
        ),
        createdAt: serverTimestamp(),
        lastMessage: null,
        typingUsers: [],
        revealRequests: [],
        revealed: false,
      });

      transaction.delete(doc(db, 'waitingQueue', matched.id));

      const notifRef = doc(collection(db, 'notifications'));
      transaction.set(notifRef, {
        userId: matched.userId,
        type: 'match_found',
        chatId: chatRef.id,
        mode,
        message: mode === 'anonymous' ? 'New anonymous chat match!' : 'New revealed chat match!',
        read: false,
        createdAt: serverTimestamp(),
      });

      return { chatId: chatRef.id, partnerId: matched.userId };
    });

    return result;
  } catch (error: any) {
    console.warn('[Firestore] findMatch error:', error?.message);
    return null;
  }
}

export function listenToWaitingQueue(
  userId: string,
  callback: (matched: { chatId: string } | null) => void
): Unsubscribe {
  const q = query(
    collection(db, 'chats'),
    where('members', 'array-contains', userId),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc'),
    limit(1)
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        callback({ chatId: change.doc.id });
      }
    });
  }, () => {
    // Silently handle listener errors
  });
}

// ==================== CHAT OPERATIONS ====================

export async function sendMessage(
  chatId: string,
  senderId: string,
  text: string
) {
  try {
    const msgRef = await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId,
      text,
      type: 'text',
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: {
        text,
        senderId,
        createdAt: Timestamp.now(),
      },
    });

    return msgRef.id;
  } catch (error: any) {
    console.warn('[Firestore] sendMessage error:', error?.message);
    return null;
  }
}

export function listenToMessages(
  chatId: string,
  callback: (messages: Array<{ id: string; [key: string]: unknown }>) => void
): Unsubscribe {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(messages);
  }, () => {
    callback([]);
  });
}

export function listenToChat(
  chatId: string,
  callback: (chat: Record<string, unknown> | null) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'chats', chatId),
    (snap) => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    },
    () => {
      callback(null);
    }
  );
}

export async function endChat(chatId: string) {
  try {
    await updateDoc(doc(db, 'chats', chatId), {
      isActive: false,
      endedAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId: 'system',
      text: 'Chat has ended',
      type: 'system',
      createdAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.warn('[Firestore] endChat error:', error?.message);
  }
}

export async function setTyping(chatId: string, userId: string, isTyping: boolean) {
  try {
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    if (chatSnap.exists()) {
      const data = chatSnap.data();
      let typingUsers: string[] = data.typingUsers || [];
      if (isTyping && !typingUsers.includes(userId)) {
        typingUsers = [...typingUsers, userId];
      } else if (!isTyping) {
        typingUsers = typingUsers.filter((id: string) => id !== userId);
      }
      await updateDoc(chatRef, { typingUsers });
    }
  } catch {
    // Silently ignore typing errors
  }
}

export async function requestReveal(chatId: string, userId: string) {
  try {
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    if (chatSnap.exists()) {
      const data = chatSnap.data();
      const revealRequests: string[] = data.revealRequests || [];
      if (!revealRequests.includes(userId)) {
        revealRequests.push(userId);
        const updates: Record<string, unknown> = { revealRequests };
        if (revealRequests.length >= 2) {
          updates.revealed = true;
        }
        await updateDoc(chatRef, updates);
      }
    }
  } catch (error: any) {
    console.warn('[Firestore] requestReveal error:', error?.message);
  }
}

// ==================== NOTIFICATION OPERATIONS ====================

export function listenToNotifications(
  userId: string,
  callback: (notifications: Array<{ id: string; [key: string]: unknown }>) => void
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    callback(notifications);
  }, () => {
    callback([]);
  });
}

export async function markNotificationRead(notifId: string) {
  try {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  } catch (error: any) {
    console.warn('[Firestore] markNotificationRead error:', error?.message);
  }
}

export async function markAllNotificationsRead(userId: string) {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map((d) =>
      updateDoc(doc(db, 'notifications', d.id), { read: true })
    );
    await Promise.all(promises);
  } catch (error: any) {
    console.warn('[Firestore] markAllNotificationsRead error:', error?.message);
  }
}

// ==================== CHAT HISTORY ====================

export async function getUserChats(userId: string) {
  try {
    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error: any) {
    console.warn('[Firestore] getUserChats error:', error?.message);
    return [];
  }
}

// ==================== BLOCK SYSTEM ====================

export async function blockUser(currentUserId: string, blockedUserId: string) {
  try {
    await setDoc(doc(db, 'users', currentUserId, 'blocked', blockedUserId), {
      blockedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.warn('[Firestore] blockUser error:', error?.message);
  }
}

export async function unblockUser(currentUserId: string, blockedUserId: string) {
  try {
    await deleteDoc(doc(db, 'users', currentUserId, 'blocked', blockedUserId));
  } catch (error: any) {
    console.warn('[Firestore] unblockUser error:', error?.message);
  }
}

export async function getBlockedUsers(userId: string) {
  try {
    const snapshot = await getDocs(collection(db, 'users', userId, 'blocked'));
    return snapshot.docs.map((d) => d.id);
  } catch (error: any) {
    console.warn('[Firestore] getBlockedUsers error:', error?.message);
    return [];
  }
}

// ==================== ONLINE COUNTER ====================

export function listenToOnlineCount(callback: (count: number) => void): Unsubscribe {
  const q = query(collection(db, 'waitingQueue'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  }, () => {
    callback(0);
  });
}
