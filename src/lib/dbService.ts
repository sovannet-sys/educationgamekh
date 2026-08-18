import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { 
  CardTemplate, WheelTemplate, RiddleTemplate, SpellingTemplate, 
  DEFAULT_CARD_TEMPLATES, DEFAULT_WHEEL_TEMPLATES, DEFAULT_RIDDLES, DEFAULT_SPELLINGS 
} from '../data/initialTemplates';

export interface GlobalTemplatesData {
  cardTemplates: CardTemplate[];
  wheelTemplates: WheelTemplate[];
  riddles: RiddleTemplate[];
  spellings: SpellingTemplate[];
  updatedAt?: string;
}

export type Unsubscribe = () => void;

const TEMPLATES_DOC_PATH = 'templates';
const GLOBAL_DOC_ID = 'global';

/**
 * Fetch global templates from Firebase Firestore first, fallback to Express /api/templates
 */
export async function fetchGlobalTemplates(): Promise<GlobalTemplatesData | null> {
  // 1. Try Firebase Firestore (Universal Real-time Cloud DB across all devices)
  try {
    const docRef = doc(db, TEMPLATES_DOC_PATH, GLOBAL_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && (Array.isArray(data.cardTemplates) || Array.isArray(data.wheelTemplates))) {
        return {
          cardTemplates: Array.isArray(data.cardTemplates) ? data.cardTemplates : DEFAULT_CARD_TEMPLATES,
          wheelTemplates: Array.isArray(data.wheelTemplates) ? data.wheelTemplates : DEFAULT_WHEEL_TEMPLATES,
          riddles: Array.isArray(data.riddles) ? data.riddles : DEFAULT_RIDDLES,
          spellings: Array.isArray(data.spellings) ? data.spellings : DEFAULT_SPELLINGS,
          updatedAt: data.updatedAt
        };
      }
    }
  } catch (firestoreErr) {
    console.warn("Firestore fetch error/offline, trying server API:", firestoreErr);
  }

  // 2. Fallback to Express backend /api/templates
  try {
    const res = await fetch(`/api/templates?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && (Array.isArray(data.cardTemplates) || Array.isArray(data.wheelTemplates))) {
        const result: GlobalTemplatesData = {
          cardTemplates: Array.isArray(data.cardTemplates) ? data.cardTemplates : DEFAULT_CARD_TEMPLATES,
          wheelTemplates: Array.isArray(data.wheelTemplates) ? data.wheelTemplates : DEFAULT_WHEEL_TEMPLATES,
          riddles: Array.isArray(data.riddles) ? data.riddles : DEFAULT_RIDDLES,
          spellings: Array.isArray(data.spellings) ? data.spellings : DEFAULT_SPELLINGS,
          updatedAt: data.updatedAt || new Date().toISOString()
        };
        // Auto-seed to Firestore if possible so mobile/tablets immediately get it
        try {
          const docRef = doc(db, TEMPLATES_DOC_PATH, GLOBAL_DOC_ID);
          setDoc(docRef, result, { merge: true }).catch(() => {});
        } catch {}
        return result;
      }
    }
  } catch (apiErr) {
    console.warn("API /api/templates fetch error:", apiErr);
  }

  return {
    cardTemplates: DEFAULT_CARD_TEMPLATES,
    wheelTemplates: DEFAULT_WHEEL_TEMPLATES,
    riddles: DEFAULT_RIDDLES,
    spellings: DEFAULT_SPELLINGS,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Save global templates to both Firebase Firestore and Express /api/templates
 * This guarantees that mobile phones, tablets, student accounts, and web clients
 * receive the updated templates immediately in real time.
 */
export async function saveGlobalTemplates(data: GlobalTemplatesData): Promise<{ firestore: boolean; api: boolean }> {
  const payload = {
    cardTemplates: data.cardTemplates || [],
    wheelTemplates: data.wheelTemplates || [],
    riddles: data.riddles || [],
    spellings: data.spellings || [],
    updatedAt: new Date().toISOString()
  };

  let firestoreSuccess = false;
  let apiSuccess = false;

  // 1. Save to Cloud Firestore
  try {
    const docRef = doc(db, TEMPLATES_DOC_PATH, GLOBAL_DOC_ID);
    await setDoc(docRef, payload, { merge: true });
    firestoreSuccess = true;
    console.log("Templates successfully synchronized to Cloud Firestore! ☁️");
  } catch (firestoreErr) {
    console.warn("Warning writing to Firestore /templates/global:", firestoreErr);
  }

  // 2. Save to Express server API
  try {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      apiSuccess = true;
      console.log("Templates successfully synchronized to Server API! 🚀");
    }
  } catch (apiErr) {
    console.warn("Warning writing to server /api/templates:", apiErr);
  }

  return { firestore: firestoreSuccess, api: apiSuccess };
}

/**
 * Subscribe to real-time updates for global shared templates.
 * Uses Firebase Firestore onSnapshot listener for instant cross-device updates (Mobile/Tablet/PC)
 * with an auxiliary background refresh and tab-focus listener.
 */
export function subscribeToGlobalTemplates(
  onUpdate: (data: GlobalTemplatesData) => void,
  onError?: (error: any) => void
): Unsubscribe {
  let isSubscribed = true;
  let lastJson = '';

  const processUpdate = (data: GlobalTemplatesData) => {
    if (!data) return;
    const jsonStr = JSON.stringify({
      cards: data.cardTemplates,
      wheels: data.wheelTemplates,
      riddles: data.riddles,
      spellings: data.spellings
    });
    if (jsonStr !== lastJson) {
      lastJson = jsonStr;
      onUpdate(data);
    }
  };

  // Immediate initial load
  fetchGlobalTemplates().then(data => {
    if (isSubscribed && data) {
      processUpdate(data);
    }
  }).catch(console.warn);

  // 1. Firestore real-time listener (Instant push to all connected mobiles/tablets/desktops)
  let unsubscribeFirestore: (() => void) | null = null;
  try {
    const docRef = doc(db, TEMPLATES_DOC_PATH, GLOBAL_DOC_ID);
    unsubscribeFirestore = onSnapshot(
      docRef,
      (docSnap) => {
        if (!isSubscribed) return;
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && (Array.isArray(data.cardTemplates) || Array.isArray(data.wheelTemplates))) {
            processUpdate({
              cardTemplates: Array.isArray(data.cardTemplates) ? data.cardTemplates : DEFAULT_CARD_TEMPLATES,
              wheelTemplates: Array.isArray(data.wheelTemplates) ? data.wheelTemplates : DEFAULT_WHEEL_TEMPLATES,
              riddles: Array.isArray(data.riddles) ? data.riddles : DEFAULT_RIDDLES,
              spellings: Array.isArray(data.spellings) ? data.spellings : DEFAULT_SPELLINGS,
              updatedAt: data.updatedAt
            });
          }
        } else {
          // Document does not exist in Firestore yet, fetch from /api/templates and seed Firestore
          fetchGlobalTemplates().then((apiData) => {
            if (isSubscribed && apiData) {
              processUpdate(apiData);
            }
          }).catch(console.warn);
        }
      },
      (error) => {
        console.warn("Firestore onSnapshot error, maintaining API sync:", error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn("Error setting up Firestore snapshot listener:", err);
  }

  // 2. Polling fallback to keep mobile/tablets synchronized even if WebSocket sleeps
  const pollInterval = setInterval(async () => {
    if (!isSubscribed) return;
    try {
      const data = await fetchGlobalTemplates();
      if (data && isSubscribed) {
        processUpdate(data);
      }
    } catch {}
  }, 2500);

  // 3. Tab visibility / device wake-up sync
  const handleVisibilityOrOnline = () => {
    if (!isSubscribed) return;
    fetchGlobalTemplates().then(data => {
      if (isSubscribed && data) {
        processUpdate(data);
      }
    }).catch(console.warn);
  };

  window.addEventListener('visibilitychange', handleVisibilityOrOnline);
  window.addEventListener('focus', handleVisibilityOrOnline);
  window.addEventListener('online', handleVisibilityOrOnline);

  return () => {
    isSubscribed = false;
    clearInterval(pollInterval);
    window.removeEventListener('visibilitychange', handleVisibilityOrOnline);
    window.removeEventListener('focus', handleVisibilityOrOnline);
    window.removeEventListener('online', handleVisibilityOrOnline);
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}

/**
 * Validates connection to server API.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    return res.ok;
  } catch {
    return false;
  }
}
