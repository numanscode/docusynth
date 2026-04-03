
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  deleteDoc,
  getDocFromServer
} from 'firebase/firestore';
import { db as firestore } from '../firebase';
import { AccessKey, HistoryEntry } from '../types';

/**
 * AUTH SERVICE: LICENSE-KEY ARCHITECTURE
 */

const compressImage = (base64Str: string, maxWidth = 800, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const db = {
  async getSettings(id: string): Promise<string> {
    try {
      const docRef = doc(firestore, 'settings', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data().value : '';
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `settings/${id}`);
      return '';
    }
  },

  async setSettings(id: string, value: string): Promise<void> {
    try {
      const docRef = doc(firestore, 'settings', id);
      await setDoc(docRef, { id, value, updatedAt: Date.now() }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `settings/${id}`);
    }
  },

  async getKeys(): Promise<AccessKey[]> {
    try {
      const q = query(collection(firestore, 'access_keys'));
      const querySnapshot = await getDocs(q);
      const keys = querySnapshot.docs.map(doc => doc.data() as AccessKey);
      return keys.sort((a, b) => b.createdAt - a.createdAt);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'access_keys');
      return [];
    }
  },

  async updateKey(key: AccessKey): Promise<void> {
    try {
      const docRef = doc(firestore, 'access_keys', key.id);
      await updateDoc(docRef, { ...key });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `access_keys/${key.id}`);
    }
  },

  async getHistory(keyId?: string): Promise<HistoryEntry[]> {
    try {
      let q = query(collection(firestore, 'history'));
      if (keyId) q = query(q, where('keyId', '==', keyId));
      
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => doc.data() as HistoryEntry);
      return history.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'history');
      return [];
    }
  },

  async saveHistory(entry: HistoryEntry): Promise<void> {
    try {
      // Compress image if it's potentially too large for Firestore (1MB limit)
      if (entry.imageUrl && entry.imageUrl.length > 500000) {
        entry.imageUrl = await compressImage(entry.imageUrl);
      }
      const docRef = doc(firestore, 'history', entry.id);
      await setDoc(docRef, entry);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `history/${entry.id}`);
    }
  }
};

export const validateKey = async (keyString: string): Promise<AccessKey | null> => {
  try {
    // Master Key Check
    if (keyString === 'ADMINDS1') {
      return {
        id: 'admin',
        key: 'ADMINDS1',
        duration: '30day',
        durationMs: 2592000000,
        createdAt: Date.now(),
        activatedAt: Date.now(),
        expiresAt: Date.now() + 2592000000,
        revoked: false
      };
    }

    const q = query(
      collection(firestore, 'access_keys'), 
      where('key', '==', keyString), 
      where('revoked', '==', false),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    const data = querySnapshot.docs[0].data() as AccessKey;
    const key = { ...data };

    if (key.expiresAt && Date.now() > key.expiresAt) return null;

    if (!key.activatedAt) {
      key.activatedAt = Date.now();
      key.expiresAt = Date.now() + (key.durationMs || 1800000);
      await db.updateKey(key);
    }

    return key;
  } catch (e) {
    console.error("Validation Error:", e);
    return null;
  }
};

export const generateKey = async (duration: AccessKey['duration']): Promise<AccessKey | null> => {
  const durations = { 
    '30min': 1800000,
    '7day': 604800000, 
    '14day': 1209600000, 
    '30day': 2592000000 
  };
  const id = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  const newKeyData: AccessKey = {
    id,
    key: `DS-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    duration,
    durationMs: durations[duration],
    createdAt: Date.now(),
    revoked: false
  };

  try {
    const docRef = doc(firestore, 'access_keys', id);
    await setDoc(docRef, newKeyData);
    return newKeyData;
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `access_keys/${id}`);
    return null;
  }
};

export const revokeKey = async (id: string): Promise<void> => {
  try {
    const docRef = doc(firestore, 'access_keys', id);
    await updateDoc(docRef, { revoked: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `access_keys/${id}`);
  }
};

export const formatTimeRemaining = (expiresAt?: number): string => {
  if (!expiresAt) return "PENDING ACTIVATION";
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "SIGNAL TERMINATED";
  
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}M ${secs}S REMAINING`;
  }
  
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return hours > 24 ? `${Math.floor(hours/24)}D ${hours%24}H REMAINING` : `${hours}H ${mins}M REMAINING`;
};

export const cleanupExpiredData = async () => {
  try {
    const q = query(collection(firestore, 'access_keys'), where('expiresAt', '<', Date.now()));
    const querySnapshot = await getDocs(q);
    for (const d of querySnapshot.docs) {
      const historyQ = query(collection(firestore, 'history'), where('keyId', '==', d.id));
      const historySnap = await getDocs(historyQ);
      for (const h of historySnap.docs) {
        await deleteDoc(doc(firestore, 'history', h.id));
      }
    }
  } catch (e) {
    console.warn("Cleanup cycle skipped:", e);
  }
};
