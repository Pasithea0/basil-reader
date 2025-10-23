// Legacy library utility - now forwards to bookManager and storage
// This file is kept for backward compatibility
// New code should import directly from bookManager.ts and storage.ts

export {
	getLibrary,
	getBookById,
	addBookToLibrary,
	removeBookFromLibrary,
	clearLibrary,
	getStorageInfo,
	formatBytes,
	type StoredBook,
	type StorageInfo
} from './bookManager';

export type { BookData } from './storage';
