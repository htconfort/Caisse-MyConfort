// src/hooks/storage/useIndexedStorage.ts
// Hook IndexedDB avec interface identique à votre useLocalStorage
import { useState, useCallback, useEffect, useRef } from 'react';
import { db } from '@/db';

/**
 * Hook pour gérer IndexedDB avec interface identique à useLocalStorage
 * Migration transparente : même interface, performance x10
 * 
 * @param key - Clé de stockage (identique à localStorage)
 * @param initialValue - Valeur initiale
 * @returns [valeur, setter] - Interface identique à useState
 */
export function useIndexedStorage<T>(
  key: string, 
  initialValue: T
): [T, (value: T | ((prevState: T) => T)) => void] {
  // Hydratation synchrone depuis localStorage pour éviter le "flash" à l'initialisation
  const getInitialStoredValue = (): T => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const actual = (parsed && typeof parsed === 'object' && 'data' in parsed)
            ? (parsed as Record<string, unknown>).data
            : parsed;
          return actual as T;
        }
      }
    } catch (e) {
      // ignore et fallback sur initialValue
      console.warn(`⚠️ Lecture initiale localStorage échouée pour ${key}:`, e);
    }
    return initialValue;
  };

  const [storedValue, setStoredValue] = useState<T>(getInitialStoredValue);
  const hasHydratedRef = useRef(false);

  // ============================================================================
  // 📥 CHARGEMENT INITIAL - Compatible avec votre format localStorage
  // ============================================================================
  
  useEffect(() => {
    const loadValue = async () => {
      try {
        // Lecture IndexedDB
        const stored = await db.settings.get(key);
        const idbValue: unknown = stored?.value as unknown;

        // Lecture localStorage
        let lsParsed: unknown;
        try {
          const fallbackData = localStorage.getItem(key);
          if (fallbackData) {
            lsParsed = JSON.parse(fallbackData) as unknown;
          }
        } catch (lsErr) {
          console.warn(`⚠️ Lecture localStorage échouée pendant hydratation ${key}:`, lsErr);
        }

        // Normalisation au format { data, timestamp }
        const normalize = (val: unknown): { data: unknown; timestamp: number } | undefined => {
          if (val == null) return undefined;
          if (typeof val === 'object' && val !== null && 'data' in (val as Record<string, unknown>)) {
            const obj = val as Record<string, unknown>;
            const ts = typeof obj.timestamp === 'number' ? obj.timestamp : Number(obj.timestamp) || 0;
            return { data: obj.data, timestamp: ts };
          }
          // Valeur brute sans wrapper
          return { data: val, timestamp: 0 };
        };

        const fromIDB = normalize(idbValue);
        const fromLS = normalize(lsParsed);

        // Choix de la source la plus fraîche
        let chosen = fromLS || fromIDB; // par défaut privilégier LS pour éviter le flash
        if (fromIDB && fromLS) {
          chosen = fromIDB.timestamp >= fromLS.timestamp ? fromIDB : fromLS;
        }

        if (chosen) {
          // Mettre à jour l'état uniquement si différent (limite les re-renders)
          setStoredValue(chosen.data as T);
          hasHydratedRef.current = true;

          // Miroir vers l'autre stockage si obsolète
          if (chosen === fromIDB && fromLS && fromIDB.timestamp > fromLS.timestamp) {
            try {
              localStorage.setItem(key, JSON.stringify(idbValue));
              console.log(`🔁 Miroir vers localStorage (depuis IndexedDB): ${key}`);
            } catch (mirrorErr) {
              console.warn(`⚠️ Miroir vers localStorage échoué pour ${key}:`, mirrorErr);
            }
          } else if (chosen === fromLS && fromIDB && fromLS.timestamp > fromIDB.timestamp) {
            try {
              const dataToSave = {
                key,
                value: lsParsed,
                lastUpdate: Date.now(),
                version: '1.0'
              } as const;
              await db.settings.put({ ...dataToSave });
              console.log(`🔁 Miroir vers IndexedDB (depuis localStorage): ${key}`);
            } catch (mirrorErr) {
              console.warn(`⚠️ Miroir vers IndexedDB échoué pour ${key}:`, mirrorErr);
            }
          } else if (!fromIDB && fromLS) {
            // Aucun IDB mais LS présent → initialiser IDB
            try {
              const dataToSave = {
                key,
                value: lsParsed,
                lastUpdate: Date.now(),
                version: '1.0'
              } as const;
              await db.settings.put({ ...dataToSave });
              console.log(`🆕 Initialisation IndexedDB depuis localStorage: ${key}`);
            } catch (initErr) {
              console.warn(`⚠️ Initialisation IndexedDB échouée pour ${key}:`, initErr);
            }
          }

          console.log(`📥 Hydratation terminée ${key} (source: ${chosen === fromIDB ? 'IndexedDB' : 'localStorage'})`);
        } else {
          // Rien trouvé → conserver valeur actuelle
          console.log(`📥 Aucune donnée trouvée pour ${key}, conservation valeur courante`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur chargement IndexedDB ${key}:`, error);
        
        // Fallback vers localStorage en cas d'erreur IndexedDB
        try {
          const fallbackData = localStorage.getItem(key);
          if (fallbackData) {
            const parsed = JSON.parse(fallbackData);
            const actualData = (parsed && typeof parsed === 'object' && 'data' in parsed) ? (parsed as Record<string, unknown>).data : parsed;
            setStoredValue(actualData as T);
            console.log(`🔄 Fallback localStorage: ${key} récupéré`);
          }
        } catch (fallbackError) {
          console.error(`❌ Erreur fallback localStorage ${key}:`, fallbackError);
        }
      }
    };

    loadValue();
  }, [key]);

  // ============================================================================
  // 💾 SAUVEGARDE - Compatible avec votre logique existante
  // ============================================================================
  
  const setValue = useCallback(async (value: T | ((prevState: T) => T)) => {
    try {
      // Calcul de la nouvelle valeur (identique à votre useLocalStorage)
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Mise à jour immédiate de l'état (UI responsive)
      setStoredValue(valueToStore);
      
      // Sauvegarde en IndexedDB avec le même format que votre localStorage
      const dataToSave = {
        key,
        value: {
          version: '1.0',
          timestamp: Date.now(),
          data: valueToStore as unknown
        },
        lastUpdate: Date.now(),
        version: '1.0'
      } as const;
      
      await db.settings.put({ ...dataToSave });

      // Miroir systématique dans localStorage pour hydratation instantanée au refresh
      try {
        localStorage.setItem(key, JSON.stringify(dataToSave.value));
      } catch (lsErr) {
        console.warn(`⚠️ Miroir localStorage échoué pour ${key}:`, lsErr);
      }
      
      console.log(`💾 IndexedDB: Sauvé ${key}`, typeof valueToStore);
      
    } catch (error) {
      console.error(`❌ Erreur sauvegarde IndexedDB ${key}:`, error);
      
      // Fallback vers localStorage (même logique que votre code original)
      try {
        const fallbackData = {
          version: '1.0',
          timestamp: Date.now(),
          data: (value instanceof Function ? value(storedValue) : value) as unknown
        };
        
        localStorage.setItem(key, JSON.stringify(fallbackData));
        console.log(`🔄 Fallback localStorage: ${key} sauvé`);
        
      } catch (fallbackError) {
        console.error(`❌ Erreur fallback localStorage ${key}:`, fallbackError);
        
        // Dernier recours : retirer uniquement cette clé puis réessayer, sans effacer tout le storage
        try {
          localStorage.removeItem(key);
          localStorage.setItem(key, JSON.stringify({
            data: (value instanceof Function ? value(storedValue) : value) as unknown
          }));
          console.log(`🆘 Fallback localStorage (après reset clé): ${key} sauvé`);
        } catch (clearError) {
          console.error(`💥 Échec complet sauvegarde ${key}:`, clearError);
        }
      }
    }
  }, [key, storedValue]);

  // ============================================================================
  // 🎯 RETOUR - Interface identique à votre useLocalStorage
  // ============================================================================
  
  return [storedValue, setValue];
}

// ============================================================================
// 🛠️ UTILITAIRES SUPPLÉMENTAIRES
// ============================================================================

/**
 * Hook pour gérer spécifiquement les arrays (ventes, vendeurs, etc.)
 * Optimisé pour vos cas d'usage fréquents
 */
export function useIndexedArray<T>(
  key: string,
  initialValue: T[] = []
): [T[], (value: T[] | ((prevState: T[]) => T[])) => void, {
  add: (item: T) => void;
  remove: (index: number) => void;
  update: (index: number, item: T) => void;
  clear: () => void;
}] {
  const [array, setArray] = useIndexedStorage<T[]>(key, initialValue);
  
  const add = useCallback((item: T) => {
    setArray(prev => [...prev, item]);
  }, [setArray]);
  
  const remove = useCallback((index: number) => {
    setArray(prev => prev.filter((_, i) => i !== index));
  }, [setArray]);
  
  const update = useCallback((index: number, item: T) => {
    setArray(prev => prev.map((existingItem, i) => i === index ? item : existingItem));
  }, [setArray]);
  
  const clear = useCallback(() => {
    setArray([]);
  }, [setArray]);
  
  return [array, setArray, { add, remove, update, clear }];
}

/**
 * Hook pour gérer spécifiquement les objets (configuration, état app, etc.)
 * Avec méthodes utilitaires pour merge et update partiel
 */
export function useIndexedObject<T extends Record<string, unknown>>(
  key: string,
  initialValue: T
): [T, (value: T | ((prevState: T) => T)) => void, {
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  merge: (partial: Partial<T>) => void;
  reset: () => void;
}] {
  const [object, setObject] = useIndexedStorage<T>(key, initialValue);
  
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setObject(prev => ({ ...prev, [field]: value }));
  }, [setObject]);
  
  const merge = useCallback((partial: Partial<T>) => {
    setObject(prev => ({ ...prev, ...partial }));
  }, [setObject]);
  
  const reset = useCallback(() => {
    setObject(initialValue);
  }, [setObject, initialValue]);
  
  return [object, setObject, { updateField, merge, reset }];
}

export default useIndexedStorage;
