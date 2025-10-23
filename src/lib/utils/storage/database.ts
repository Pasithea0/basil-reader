// IndexedDB database operations

import { DB_NAME, DB_VERSION, STORE_NAME } from './constants';
import type { StoredBookData } from './types';

/**
 * Opens a connection to the IndexedDB database
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
 * Gets all books from the database
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
 * Gets a single book by ID from the database
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
 * Saves a book to the database
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
