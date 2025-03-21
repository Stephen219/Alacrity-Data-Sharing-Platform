import { useState, useCallback } from "react";

/**
 * Custom React hook to manage localStorage with error handling and SSR safety.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  
  // Initialise state with the value from localStorage (if available)
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue; // Prevent SSR issues
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`[useLocalStorage] Failed to read key "${key}" from localStorage:`, error);
      return initialValue;
    }
  });

  /**
   * Update localStorage when state changes.
   * We use the functional updater form of setStoredValue so that
   * we don't need to list storedValue as a dependency.
   */
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prevValue) => {
      const newValue = value instanceof Function ? value(prevValue) : value;
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(newValue));
        }
      } catch (error) {
        console.warn(`[useLocalStorage] Failed to write key "${key}" to localStorage:`, error);
      }
      return newValue;
    });
  }, [key]);

  return [storedValue, setValue];
}
