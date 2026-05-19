import { db } from './db';

const HANDLE_KEY = 'backupDirectoryHandle';

export async function saveBackupDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  await db.meta.put({ key: HANDLE_KEY, value: handle });
}

export async function loadBackupDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  const entry = await db.meta.get(HANDLE_KEY);
  return (entry?.value as FileSystemDirectoryHandle | undefined) ?? null;
}

export async function clearBackupDirectoryHandle(): Promise<void> {
  await db.meta.delete(HANDLE_KEY);
}
