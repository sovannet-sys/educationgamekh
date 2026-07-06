import { doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import { db, auth } from './firebase';
import { CardTemplate, WheelTemplate, RiddleTemplate, SpellingTemplate } from '../data/initialTemplates';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function isOfflineError(error: any): boolean {
  if (!error) return false;
  const msg = String(error.message || error).toLowerCase();
  return (
    msg.includes('offline') ||
    msg.includes('network') ||
    msg.includes('unavailable') ||
    msg.includes('failed to get document') ||
    error.code === 'unavailable' ||
    error.code === 'failed-precondition'
  );
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const isOffline = isOfflineError(error);
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  if (isOffline) {
    console.warn('Firestore Offline Notice (Normal when offline): ', JSON.stringify(errInfo));
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to Firestore when the application initially boots.
 */
export async function testConnection(): Promise<boolean> {
  const path = 'templates/global';
  try {
    // Attempt to test the server connection as requested by guidelines
    await getDocFromServer(doc(db, 'templates', 'global'));
    console.log("Firestore connection test passed successfully.");
    return true;
  } catch (error: any) {
    if (isOfflineError(error)) {
      console.warn("Firestore client is offline. Please check your Firebase configuration or internet connection.");
    } else {
      console.warn("Firestore connection test failed/bypassed (expected in clean initial database states):", error);
    }
    return false;
  }
}

export interface GlobalTemplatesData {
  cardTemplates: CardTemplate[];
  wheelTemplates: WheelTemplate[];
  riddles: RiddleTemplate[];
  spellings: SpellingTemplate[];
}

/**
 * Fetch global templates from Firestore.
 */
export async function fetchGlobalTemplates(): Promise<GlobalTemplatesData | null> {
  const path = 'templates/global';
  try {
    const docRef = doc(db, 'templates', 'global');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        cardTemplates: data.cardTemplates || [],
        wheelTemplates: data.wheelTemplates || [],
        riddles: data.riddles || [],
        spellings: data.spellings || []
      };
    }
    return null;
  } catch (error: any) {
    if (isOfflineError(error)) {
      console.warn("Firestore is offline or unreachable. Falling back to local cache gracefully.");
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Save global templates to Firestore.
 */
export async function saveGlobalTemplates(data: GlobalTemplatesData): Promise<void> {
  const path = 'templates/global';
  try {
    const docRef = doc(db, 'templates', 'global');
    await setDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    console.log("Successfully saved global templates to Firestore.");
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
