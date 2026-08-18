import { CardTemplate, WheelTemplate, RiddleTemplate, SpellingTemplate, DEFAULT_CARD_TEMPLATES, DEFAULT_WHEEL_TEMPLATES, DEFAULT_RIDDLES, DEFAULT_SPELLINGS } from '../data/initialTemplates';

export interface GlobalTemplatesData {
  cardTemplates: CardTemplate[];
  wheelTemplates: WheelTemplate[];
  riddles: RiddleTemplate[];
  spellings: SpellingTemplate[];
  updatedAt?: string;
}

export type Unsubscribe = () => void;

/**
 * Fetch global templates from backend server /api/templates
 */
export async function fetchGlobalTemplates(): Promise<GlobalTemplatesData | null> {
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
        return {
          cardTemplates: Array.isArray(data.cardTemplates) ? data.cardTemplates : DEFAULT_CARD_TEMPLATES,
          wheelTemplates: Array.isArray(data.wheelTemplates) ? data.wheelTemplates : DEFAULT_WHEEL_TEMPLATES,
          riddles: Array.isArray(data.riddles) ? data.riddles : DEFAULT_RIDDLES,
          spellings: Array.isArray(data.spellings) ? data.spellings : DEFAULT_SPELLINGS,
          updatedAt: data.updatedAt
        };
      }
    }
  } catch (apiErr) {
    console.warn("API /api/templates fetch error:", apiErr);
  }
  return null;
}

/**
 * Save global templates to backend server /api/templates.
 * This directly updates the persistent database on the server.
 */
export async function saveGlobalTemplates(data: GlobalTemplatesData): Promise<void> {
  try {
    const payload = {
      cardTemplates: data.cardTemplates || [],
      wheelTemplates: data.wheelTemplates || [],
      riddles: data.riddles || [],
      spellings: data.spellings || [],
      updatedAt: new Date().toISOString()
    };

    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Failed to save templates: HTTP ${res.status}`);
    }
    console.log("Successfully saved templates to server persistent store.");
  } catch (err) {
    console.error("Error in saveGlobalTemplates:", err);
    throw err;
  }
}

/**
 * Subscribe to real-time updates for global shared templates.
 * Regularly synchronizes with /api/templates so all users, students, and guests
 * see changes made by the Admin within 1.5 seconds without needing to refresh.
 */
export function subscribeToGlobalTemplates(
  onUpdate: (data: GlobalTemplatesData) => void,
  onError?: (error: any) => void
): Unsubscribe {
  let lastJson = '';
  let isChecking = false;

  const checkApi = async () => {
    if (isChecking) return;
    isChecking = true;
    try {
      const data = await fetchGlobalTemplates();
      if (data) {
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
      }
    } catch (e) {
      if (onError) onError(e);
    } finally {
      isChecking = false;
    }
  };

  // Immediate initial fetch
  checkApi();

  // Fast background synchronization interval (every 1.5s for instant real-time sync)
  const intervalId = setInterval(checkApi, 1500);

  return () => {
    clearInterval(intervalId);
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
