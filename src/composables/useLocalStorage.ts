import { ref, watch } from "vue";

export function useLocalStorage<T>(key: string, defaultValue: T | null = null) {
  const storedValue = localStorage.getItem(key);

  const data = ref<T | null>(
    storedValue ? JSON.parse(storedValue) : defaultValue,
  );

  const saveToStorage = (newValue: T | null) => {
    if (newValue === null || newValue === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(newValue));
    }
  };

  watch(() => data.value, saveToStorage, { deep: true });

  return data;
}
