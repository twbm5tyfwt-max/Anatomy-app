import { useState } from "react";
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  const update = (v: T | ((old: T) => T)) => {
    setValue((old) => {
      const next = typeof v === "function" ? (v as (old: T) => T)(old) : v;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        window.dispatchEvent(new CustomEvent("forma-storage-error"));
      }
      return next;
    });
  };
  return [value, update] as const;
}
export async function storeFile(file: File, id: string) {
  return new Promise<void>((resolve, reject) => {
    const req = indexedDB.open("forma-files", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("files");
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(file, id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };
  });
}
export async function getFile(id: string) {
  return new Promise<File | undefined>((resolve, reject) => {
    const req = indexedDB.open("forma-files", 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("files")) {
        db.close();
        resolve(undefined);
        return;
      }
      const tx = db.transaction("files");
      const read = tx.objectStore("files").get(id);
      read.onsuccess = () => {
        db.close();
        resolve(read.result);
      };
      read.onerror = () => reject(read.error);
    };
  });
}
export async function deleteFile(id: string) {
  return new Promise<void>((resolve, reject) => {
    const req = indexedDB.open("forma-files", 1);
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("files")) {
        db.close();
        resolve();
        return;
      }
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}
