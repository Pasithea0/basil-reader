/**
 * Library storage management using IndexedDB
 * Handles book storage, retrieval, and quota management
 */

const DB_NAME = 'foliate-library';
const DB_VERSION = 1;
const STORE_NAME = 'books';

export interface StoredBook {
	id: string;
	title: string;
	author: string;
	cover?: string; // base64 or blob URL
	addedAt: number;
	file: File;
	size: number;
}

export interface StorageInfo {
	used: number;
	total: number;
	available: number;
	usedPercent: number;
}

/**
 * Initialize the IndexedDB database
 */
function getDB(): Promise<IDBDatabase> {
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
 * Get all books from the library
 */
export async function getLibrary(): Promise<StoredBook[]> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.getAll();

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Get a specific book by ID
 */
export async function getBookById(id: string): Promise<File | null> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.get(id);

		request.onsuccess = () => {
			const book = request.result as StoredBook | undefined;
			resolve(book?.file || null);
		};
		request.onerror = () => reject(request.error);
	});
}

/**
 * Add a book to the library
 */
export async function addBookToLibrary(
	file: File,
	metadata: { title: string; author: string; cover?: Blob }
): Promise<void> {
	// Check storage quota before adding
	const storageInfo = await getStorageInfo();
	if (storageInfo.available < file.size) {
		throw new Error(
			`Not enough storage space. Need ${formatBytes(file.size)} but only ${formatBytes(storageInfo.available)} available.`
		);
	}

	const id = generateBookId(file);
	const coverUrl = metadata.cover ? URL.createObjectURL(metadata.cover) : undefined;

	const book: StoredBook = {
		id,
		title: metadata.title,
		author: metadata.author,
		cover: coverUrl,
		addedAt: Date.now(),
		file,
		size: file.size
	};

	const db = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.put(book);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

/**
 * Remove a book from the library
 */
export async function removeBookFromLibrary(id: string): Promise<void> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.delete(id);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

/**
 * Clear all books from the library
 */
export async function clearLibrary(): Promise<void> {
	const db = await getDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.clear();

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

/**
 * Get storage quota information
 */
export async function getStorageInfo(): Promise<StorageInfo> {
	if (!navigator.storage?.estimate) {
		return { used: 0, total: 0, available: 0, usedPercent: 0 };
	}

	try {
		const estimate = await navigator.storage.estimate();
		const used = estimate.usage || 0;
		const total = estimate.quota || 0;
		const available = total - used;
		const usedPercent = total > 0 ? (used / total) * 100 : 0;

		return { used, total, available, usedPercent };
	} catch (error) {
		console.error('Failed to get storage info:', error);
		return { used: 0, total: 0, available: 0, usedPercent: 0 };
	}
}

/**
 * Generate a unique ID for a book based on file properties
 */
function generateBookId(file: File): string {
	return `${file.name}-${file.size}-${file.lastModified}`;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';

	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
