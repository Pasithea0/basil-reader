/**
 * Storage utility for managing IndexedDB operations
 * Handles low-level database interactions for book storage
 */

const DB_NAME = 'basil-reader-db';
const DB_VERSION = 2;
const STORE_NAME = 'books';
const PROGRESS_STORE_NAME = 'progress';

export interface StorageInfo {
	used: number; // bytes used
	total: number; // total bytes available
	available: number; // bytes available
	usedPercent: number; // percentage used (0-100)
}

/**
 * Opens the IndexedDB database
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
			if (!db.objectStoreNames.contains(PROGRESS_STORE_NAME)) {
				db.createObjectStore(PROGRESS_STORE_NAME, { keyPath: 'id' });
			}
		};
	});
}

/**
 * Gets all records from the books store
 */
export async function getAllRecords<T>(): Promise<T[]> {
	try {
		const db = await openDB();
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);

		return new Promise((resolve, reject) => {
			const request = store.getAll();
			request.onsuccess = () => resolve(request.result as T[]);
			request.onerror = () => reject(request.error);
		});
	} catch (e) {
		console.error('Failed to get records:', e);
		return [];
	}
}

/**
 * Gets a single record by ID
 */
export async function getRecord<T>(id: string): Promise<T | null> {
	try {
		const db = await openDB();
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);

		return new Promise((resolve, reject) => {
			const request = store.get(id);
			request.onsuccess = () => resolve(request.result as T | null);
			request.onerror = () => reject(request.error);
		});
	} catch (e) {
		console.error('Failed to get record:', e);
		return null;
	}
}

/**
 * Saves a record to the store
 */
export async function saveRecord<T>(record: T): Promise<void> {
	const db = await openDB();
	const transaction = db.transaction(STORE_NAME, 'readwrite');
	const store = transaction.objectStore(STORE_NAME);

	return new Promise((resolve, reject) => {
		const request = store.put(record);
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
 * Deletes a record by ID
 */
export async function deleteRecord(id: string): Promise<void> {
	try {
		const db = await openDB();
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);

		return new Promise((resolve, reject) => {
			const request = store.delete(id);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	} catch (e) {
		console.error('Failed to delete record:', e);
		throw e;
	}
}

/**
 * Clears all records from the store
 */
export async function clearAllRecords(): Promise<void> {
	try {
		const db = await openDB();
		const transaction = db.transaction([STORE_NAME, PROGRESS_STORE_NAME], 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const progressStore = transaction.objectStore(PROGRESS_STORE_NAME);

		return new Promise((resolve, reject) => {
			const request = store.clear();
			request.onsuccess = () => {
				const r2 = progressStore.clear();
				r2.onsuccess = () => resolve();
				r2.onerror = () => reject(r2.error);
			};
			request.onerror = () => reject(request.error);
		});
	} catch (e) {
		console.error('Failed to clear records:', e);
	}
}

// Progress sub-store helpers
export async function saveProgress<T extends { id: string }>(record: T): Promise<void> {
	const db = await openDB();
	const transaction = db.transaction(PROGRESS_STORE_NAME, 'readwrite');
	const store = transaction.objectStore(PROGRESS_STORE_NAME);

	return new Promise((resolve, reject) => {
		const request = store.put(record);
		request.onsuccess = () => {
			// console.log('IndexedDB write successful for:', record.id);
			resolve();
		};
		request.onerror = () => {
			console.error('IndexedDB write failed:', request.error);
			reject(request.error);
		};
	});
}

export async function getProgress<T>(id: string): Promise<T | null> {
	try {
		const db = await openDB();
		const transaction = db.transaction(PROGRESS_STORE_NAME, 'readonly');
		const store = transaction.objectStore(PROGRESS_STORE_NAME);

		return new Promise((resolve, reject) => {
			const request = store.get(id);
			request.onsuccess = () => {
				const result = (request.result as T) ?? null;
				// console.log('IndexedDB read successful for:', id, '- Data:', result);
				resolve(result);
			};
			request.onerror = () => {
				console.error('IndexedDB read failed:', request.error);
				reject(request.error);
			};
		});
	} catch (e) {
		console.error('Failed to get progress:', e);
		return null;
	}
}

/**
 * Gets storage information using the Storage Manager API
 */
export async function getStorageInfo(): Promise<StorageInfo> {
	try {
		// Use Storage Manager API if available
		if ('storage' in navigator && 'estimate' in navigator.storage) {
			const estimate = await navigator.storage.estimate();
			const used = estimate.usage || 0;
			const total = estimate.quota || 0;
			const available = Math.max(0, total - used);
			const usedPercent = total > 0 ? (used / total) * 100 : 0;

			return {
				used,
				total,
				available,
				usedPercent
			};
		}

		// Fallback for browsers without Storage Manager API
		return {
			used: 0,
			total: 50 * 1024 * 1024 * 1024, // Estimate 50GB
			available: 50 * 1024 * 1024 * 1024,
			usedPercent: 0
		};
	} catch (e) {
		console.error('Failed to get storage info:', e);
		return {
			used: 0,
			total: 50 * 1024 * 1024 * 1024,
			available: 50 * 1024 * 1024 * 1024,
			usedPercent: 0
		};
	}
}

/**
 * Formats bytes into human-readable string
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generates a unique ID for records
 */
export function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
