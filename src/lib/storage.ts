import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadChatFile(
  chatId: string,
  file: File,
  userId: string
): Promise<{ url: string; path: string }> {
  try {
    const timeId = new Date().getTime();
    // Path structure: chats/{chatId}/{userId}_{timestamp}_{filename}
    // E.g. chats/chat123/user456_1680000_image.png
    const filePath = `chats/${chatId}/${userId}_${timeId}_${file.name}`;
    const fileRef = ref(storage, filePath);

    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    return { url, path: filePath };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}
