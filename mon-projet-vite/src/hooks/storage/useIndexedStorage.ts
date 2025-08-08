// src/hooks/storage/useIndexedStorage.ts
// Hook IndexedDB avec interface identique à votre useLocalStorage
import { useState, useCallback, useEffect } from 'react';
import { db } from '../../db/schema';

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
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // ============================================================================
  // 📥 CHARGEMENT INITIAL - Compatible avec votre format localStorage
  // ============================================================================
  
  useEffect(() => {
    const loadValue = async () => {
      try {
        // Chargement depuis IndexedDB
        const stored = await db.settings.get(key);
        
        if (stored && stored.value !== undefined) {
          // Support du format de votre useLocalStorage original
          let parsedValue = stored.value;
          
          // Si c'est un objet avec .data (format de votre localStorage)
          if (typeof parsedValue === 'object' && parsedValue !== null && 'data' in parsedValue) {
            const dataWrapper = parsedValue as Record<string, unknown>;
            parsedValue = dataWrapper.data as typeof stored.value;
          }
          
          setStoredValue(parsedValue as T);
          console.log(`📥 IndexedDB: Chargé ${key}`, typeof parsedValue);
        } else {
          // Pas de données → utiliser la valeur initiale
          console.log(`📥 IndexedDB: ${key} non trouvé, utilisation valeur initiale`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur chargement IndexedDB ${key}:`, error);
        
        // Fallback vers localStorage en cas d'erreur IndexedDB
        try {
          const fallbackData = localStorage.getItem(key);
          if (fallbackData) {
            const parsed = JSON.parse(fallbackData);
            const actualData = parsed.data || parsed;
            setStoredValue(actualData);
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
          data: valueToStore
        },
        lastUpdate: Date.now(),
        version: '1.0'
      };
      
      await db.settings.put(dataToSave);
      
      console.log(`💾 IndexedDB: Sauvé ${key}`, typeof valueToStore);
      
    } catch (error) {
      console.error(`❌ Erreur sauvegarde IndexedDB ${key}:`, error);
      
      // Fallback vers localStorage (même logique que votre code original)
      try {
        const fallbackData = {
          version: '1.0',
          timestamp: Date.now(),
          data: value instanceof Function ? value(storedValue) : value
        };
        
        localStorage.setItem(key, JSON.stringify(fallbackData));
        console.log(`🔄 Fallback localStorage: ${key} sauvé`);
        
      } catch (fallbackError) {
        console.error(`❌ Erreur fallback localStorage ${key}:`, fallbackError);
        
        // Dernier recours : clear et retry (comme votre code original)
        try {
          localStorage.clear();
          localStorage.setItem(key, JSON.stringify({
            data: value instanceof Function ? value(storedValue) : value
          }));
          console.log(`🆘 Fallback localStorage (après clear): ${key} sauvé`);
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
