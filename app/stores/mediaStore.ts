import { MediaDownloadOptions, MediaHandlers } from "~/types";
import { defineStore } from "pinia";

const DB_NAME = "ChatFileCache";
const STORE_NAME = "files";

const getDB = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const useMediaStore = defineStore("media", () => {
  let handlers: MediaHandlers;

  function setHandlers(val: MediaHandlers) {
    handlers = val;
  }

  const getCachedBlob = async (url: string): Promise<Blob | null> => {
    try {
      const db = await getDB();
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const result = await new Promise<Blob | undefined>((res) => {
        store.get(url).onsuccess = (e: any) => res(e.target.result);
      });
      return result ?? null;
    } catch {
      return null;
    }
  };

  const putCachedBlob = async (url: string, blob: Blob): Promise<void> => {
    try {
      const db = await getDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(blob, url);
    } catch {
      // cache is best-effort; ignore write failures
    }
  };

  const fetchFileSize = (url: string): Promise<number | null> =>
    handlers.getFileSize(url);

  const download = async (
    url: string,
    opts?: MediaDownloadOptions,
  ): Promise<Blob> => {
    const cached = await getCachedBlob(url);
    if (cached) {
      opts?.onProgress?.(100);
      return cached;
    }
    const blob = await handlers.download(url, opts);
    await putCachedBlob(url, blob);
    return blob;
  };

  return {
    setHandlers,
    fetchFileSize,
    getCachedBlob,
    download,
  };
});
