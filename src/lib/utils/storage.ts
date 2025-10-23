// IndexedDB storage utility
// Handles low-level database operations for book storage

const DB_NAME = 'basil-reader-db';
const DB_VERSION = 1;
const STORE_NAME = 'books';

export interface BookData {
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
 * Opens a connection to the IndexedDB database
 * Creates the object store if it doesn't exist
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
 * Retrieves all books from the database
 */
export async function getAllBooks(): Promise<BookData[]> {
	const db = await openDB();
	const transaction = db.transaction(STORE_NAME, 'readonly');
	const store = transaction.objectStore(STORE_NAME);
	
	return new Promise((resolve, reject) => {
		const request = store.getAll();
		request.onsuccess = () => resolve(request.result as BookData[]);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Retrieves a single book by ID
 */
export async function getBookData(bookId: string): Promise<BookData | null> {
	const db = await openDB();
	const transaction = db.transaction(STORE_NAME, 'readonly');
	const store = transaction.objectStore(STORE_NAME);
	
	return new Promise((resolve, reject) => {
		const request = store.get(bookId);
		request.onsuccess = () => {
			const bookData = request.result as BookData | undefined;
			resolve(bookData || null);
		};
		request.onerror = () => reject(request.error);
	});
}

/**
 * Saves a book to the database
 * Throws QuotaExceededError if storage is full
 */
export async function saveBookData(bookData: BookData): Promise<void> {
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
 * Deletes a book from the database
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
 * Clears all books from the database
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
 * Gets storage quota information using the Storage Manager API
 */
export async function getStorageQuota(): Promise<{
	used: number;
	total: number;
	available: number;
	usedPercent: number;
}> {
	try {
		// Use Storage Manager API if available
		if ('storage' in navigator && 'estimate' in navigator.storage) {
			const estimate = await navigator.storage.estimate();
			const used = estimate.usage || 0;
			const total = estimate.quota || 0;
			const available = Math.max(0, total - used);
			const usedPercent = total > 0 ? (used / total) * 100 : 0;

			return { used, total, available, usedPercent };
		}

		// Fallback for browsers without Storage Manager API
		return {
			used: 0,
			total: 50 * 1024 * 1024 * 1024, // Estimate 50GB
			available: 50 * 1024 * 1024 * 1024,
			usedPercent: 0
		};
	} catch (e) {
		return {
			used: 0,
			total: 50 * 1024 * 1024 * 1024,
			available: 50 * 1024 * 1024 * 1024,
			usedPercent: 0
		};
	}
}
