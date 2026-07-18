// IndexedDB 최소 keyval 래퍼 — 의존성 없음 (plan 003)
const DB_NAME = "planner-offline";
const STORE = "keyval";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        t.oncomplete = () => {
          db.close();
          resolve(req.result);
        };
        t.onerror = () => {
          db.close();
          reject(t.error);
        };
      }),
  );
}

export const idbGet = <T>(key: string): Promise<T | undefined> =>
  tx("readonly", (s) => s.get(key) as IDBRequest<T | undefined>);

export const idbSet = (key: string, value: unknown): Promise<unknown> =>
  tx("readwrite", (s) => s.put(value, key));

export const idbDel = (key: string): Promise<unknown> =>
  tx("readwrite", (s) => s.delete(key));
