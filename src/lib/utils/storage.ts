/**
 * IndexedDB storage utilities
 * Handles low-level database operations for storing book files and metadata
 */

const DB_NAME = 'basil-reader-db';
const DB_VERSION = 1;
const STORE_NAME = 'books';

export interface StoredBookData {
	id: string;
	title: string;
	author: string;
	cover?: Blob;
	file: Blob;
	fileName: string;
	fileType: string;
	fileSize: number;
	addedAt: number;
}

/**
 * Opens IndexedDB connection
 */
export function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: 'id' });
			}
		};
	});
}

/**
 * Gets all books from storage
 */
export async function getAllBooks(): Promise<StoredBookData[]> {
	const db = await openDB();
	const transaction = db.transaction(STORE_NAME, 'readonly');
	const store = transaction.objectStore(STORE_NAME);

	return new Promise((resolve, reject) => {
		const request = store.getAll();
		request.onsuccess = () => resolve(request.result as StoredBookData[]);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Gets a single book by ID
 */
export async function getBookData(bookId: string): Promise<StoredBookData | null> {
	const db = await openDB();
	const transaction = db.transaction(STORE_NAME, 'readonly');
	const store = transaction.objectStore(STORE_NAME);

	return new Promise((resolve, reject) => {
		const request = store.get(bookId);
		request.onsuccess = () => resolve(request.result || null);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Saves a book to storage
 */
export async function saveBookData(bookData: StoredBookData): Promise<void> {
	const db = await openDB();
	const transaction = db.transaction(STORE_NAME, 'readwrite');
	const store = transaction.objectStore(STORE_NAME);

	return new Promise((resolve, reject) => {
		const request = store.put(bookData);
		request.onsuccess = () => resolve();
		request.onerror = () => {
			if (request.error?.name === 'QuotaExceededError') {
				reject(new Error('Storage quota exceeded. Not enough space to save this book.'));
			} else {
				reject(request.error);
			}
		};
	});
}

/**
 * Deletes a book from storage
 */
export async function deleteBookData(bookId: string): Promise<void> {
	const db = await openDB();
	const transaction = db.transaction(STORE_NAME, 'readwrite');
	const store = transaction.objectStore(STORE_NAME);

	return new Promise((resolve, reject) => {
		const request = store.delete(bookId);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

/**
 * Clears all books from storage
 */
export async function clearAllBooks(): Promise<void> {
	const db = await openDB();
	const transaction = db.transaction(STORE_NAME, 'readwrite');
	const store = transaction.objectStore(STORE_NAME);

	return new Promise((resolve, reject) => {
		const request = store.clear();
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

/**
 * Gets storage usage information
 */
export async function getStorageEstimate(): Promise<{
	used: number;
	total: number;
	available: number;
	usedPercent: number;
}> {
	try {
		if ('storage' in navigator && 'estimate' in navigator.storage) {
			const estimate = await navigator.storage.estimate();
			const used = estimate.usage || 0;
			const total = estimate.quota || 0;
			const available = Math.max(0, total - used);
			const usedPercent = total > 0 ? (used / total) * 100 : 0;

			return { used, total, available, usedPercent };
		}

		// Fallback for browsers without Storage Manager API
		const fallbackTotal = 50 * 1024 * 1024 * 1024; // 50GB estimate
		return {
			used: 0,
			total: fallbackTotal,
			available: fallbackTotal,
			usedPercent: 0
		};
	} catch (e) {
		const fallbackTotal = 50 * 1024 * 1024 * 1024;
		return {
			used: 0,
			total: fallbackTotal,
			available: fallbackTotal,
			usedPercent: 0
		};
	}
}
