import { doc, getDoc, setDoc, getDocFromServer, onSnapshot, Unsubscribe } from 'firebase/firestore';
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
    const docRef = doc(db, 'templates', 'global');
    // Use standard getDoc with offline persistence so it does not trigger 10s timeout warnings in restricted or slow networks
    await getDoc(docRef);
    console.log("Firestore connection test verified successfully.");
    return true;
  } catch (error: any) {
    if (isOfflineError(error)) {
      console.warn("Firestore client operating in offline mode with cached storage.");
    } else {
      console.warn("Firestore connection check info:", error?.message || error);
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
 * Fetch global templates from backend server /api/templates, with Firestore fallback.
 */
export async function fetchGlobalTemplates(): Promise<GlobalTemplatesData | null> {
  try {
    const res = await fetch('/api/templates');
    if (res.ok) {
      const data = await res.json();
      if (data && (data.cardTemplates || data.wheelTemplates)) {
        return {
          cardTemplates: data.cardTemplates || [],
          wheelTemplates: data.wheelTemplates || [],
          riddles: data.riddles || [],
          spellings: data.spellings || []
        };
      }
    }
  } catch (apiErr) {
    console.warn("API /api/templates fetch failed, trying Firestore fallback:", apiErr);
  }

  // Fallback to Firestore
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
    return null;
  }
}

/**
 * Save global templates to backend server /api/templates and Firestore.
 */
export async function saveGlobalTemplates(data: GlobalTemplatesData): Promise<void> {
  let savedToApi = false;
  try {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      savedToApi = true;
      console.log("Successfully saved global templates to backend API /api/templates");
    }
  } catch (apiErr) {
    console.warn("Could not save to /api/templates:", apiErr);
  }

  // Also sync to Firestore
  const path = 'templates/global';
  try {
    const docRef = doc(db, 'templates', 'global');
    await setDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    console.log("Successfully saved global templates to Firestore.");
  } catch (error) {
    if (!savedToApi) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } else {
      console.warn("Firestore save warning (API save succeeded):", error);
    }
  }
}

/**
 * Subscribe to real-time updates for global shared templates.
 * Listens to Firestore onSnapshot AND polls /api/templates so all users receive updates immediately.
 */
export function subscribeToGlobalTemplates(
  onUpdate: (data: GlobalTemplatesData) => void,
  onError?: (error: any) => void
): Unsubscribe {
  let lastJson = '';

  const checkApi = async () => {
    try {
      const data = await fetchGlobalTemplates();
      if (data) {
        const jsonStr = JSON.stringify(data);
        if (jsonStr !== lastJson) {
          lastJson = jsonStr;
          onUpdate(data);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  // Immediate initial load
  checkApi();

  // Periodic poll every 3 seconds for zero-delay synchronization across all guest/student devices
  const intervalId = setInterval(checkApi, 3000);

  // Firestore listener
  let unsubscribeFirestore: Unsubscribe = () => {};
  try {
    const docRef = doc(db, 'templates', 'global');
    unsubscribeFirestore = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const parsed: GlobalTemplatesData = {
            cardTemplates: data.cardTemplates || [],
            wheelTemplates: data.wheelTemplates || [],
            riddles: data.riddles || [],
            spellings: data.spellings || []
          };
          const jsonStr = JSON.stringify(parsed);
          if (jsonStr !== lastJson) {
            lastJson = jsonStr;
            onUpdate(parsed);
          }
        }
      },
      (error) => {
        if (isOfflineError(error)) {
          console.warn("Firestore listener operating offline.");
        }
        if (onError) onError(error);
      }
    );
  } catch (e) {
    console.warn("Firestore listener setup error:", e);
  }

  return () => {
    clearInterval(intervalId);
    unsubscribeFirestore();
  };
}

