// Library storage utility using IndexedDB for efficient blob storage

export interface StoredBook {
	id: string;
	title: string;
	author: string;
	coverUrl?: string; // Object URL for cover (generated on load)
	fileName: string;
	fileType: string;
	fileSize: number;
	addedAt: number;
}

interface StoredBookData {
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

export interface StorageInfo {
	used: number; // bytes used
	total: number; // total bytes available
	available: number; // bytes available
	usedPercent: number; // percentage used (0-100)
}

const DB_NAME = 'basil-reader-db';
const DB_VERSION = 1;
const STORE_NAME = 'books';

// Initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
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

export async function getLibrary(): Promise<StoredBook[]> {
	try {
		const db = await openDB();
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		
		return new Promise((resolve, reject) => {
			const request = store.getAll();
			request.onsuccess = () => {
				const bookDataList = request.result as StoredBookData[];
				
				const books: StoredBook[] = bookDataList
					.map(bookData => {
						let coverUrl: string | undefined = undefined;
						
						// Safely create object URL for cover
						try {
							// Check if cover exists and is a valid Blob
							if (bookData.cover) {
								// Convert to Blob if needed
								const blob = bookData.cover instanceof Blob 
									? bookData.cover 
									: new Blob([bookData.cover]);
								coverUrl = URL.createObjectURL(blob);
							}
						} catch (e) {
							// Silently fail - book will show without cover
						}
						
						return {
							id: bookData.id,
							title: bookData.title,
							author: bookData.author,
							coverUrl,
							fileName: bookData.fileName,
							fileType: bookData.fileType,
							fileSize: bookData.fileSize,
							addedAt: bookData.addedAt
						};
					})
					.sort((a, b) => b.addedAt - a.addedAt); // Sort by date, newest first
				
				resolve(books);
			};
			request.onerror = () => {
				reject(request.error);
			};
		});
	} catch (e) {
		console.error('Failed to load library:', e);
		return [];
	}
}

async function saveBook(bookData: StoredBookData): Promise<void> {
	const db = await openDB();
	const transaction = db.transaction(STORE_NAME, 'readwrite');
	const store = transaction.objectStore(STORE_NAME);
	
		return new Promise((resolve, reject) => {
			const request = store.put(bookData);
			request.onsuccess = () => {
				resolve();
			};
			request.onerror = () => {
				if (request.error?.name === 'QuotaExceededError') {
					reject(new Error('Storage quota exceeded. Not enough space to save this book.'));
				} else {
					reject(request.error);
				}
			};
		});
}

export async function addBookToLibrary(
	file: File,
	metadata: { title: string; author: string; cover?: Blob }
): Promise<StoredBook> {
	try {
		// Check storage quota before saving
		const storageInfo = await getStorageInfo();
		const estimatedSize = file.size + (metadata.cover?.size || 0);
		
		if (estimatedSize > storageInfo.available) {
			throw new Error(
				`Not enough storage space. Need ${formatBytes(estimatedSize)}, ` +
				`but only ${formatBytes(storageInfo.available)} available.`
			);
		}

		// Create book data
		const bookData: StoredBookData = {
			id: generateId(),
			title: metadata.title,
			author: metadata.author,
			cover: metadata.cover,
			file: file,
			fileName: file.name,
			fileType: file.type,
			fileSize: file.size,
			addedAt: Date.now()
		};

		// Save to IndexedDB
		await saveBook(bookData);

		// Return book metadata
		return {
			id: bookData.id,
			title: bookData.title,
			author: bookData.author,
			coverUrl: bookData.cover ? URL.createObjectURL(bookData.cover) : undefined,
			fileName: bookData.fileName,
			fileType: bookData.fileType,
			fileSize: bookData.fileSize,
			addedAt: bookData.addedAt
		};
	} catch (e) {
		throw e;
	}
}

export async function removeBookFromLibrary(bookId: string): Promise<void> {
	try {
		const db = await openDB();
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		
		return new Promise((resolve, reject) => {
			const request = store.delete(bookId);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	} catch (e) {
		console.error('Failed to remove book:', e);
		throw e;
	}
}

export async function getBookById(bookId: string): Promise<File | null> {
	try {
		const db = await openDB();
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		
		return new Promise((resolve, reject) => {
			const request = store.get(bookId);
			request.onsuccess = () => {
				const bookData = request.result as StoredBookData | undefined;
				if (bookData) {
					resolve(new File([bookData.file], bookData.fileName, { type: bookData.fileType }));
				} else {
					resolve(null);
				}
			};
			request.onerror = () => reject(request.error);
		});
	} catch (e) {
		console.error('Failed to get book:', e);
		return null;
	}
}

export async function clearLibrary(): Promise<void> {
	try {
		const db = await openDB();
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		
		return new Promise((resolve, reject) => {
			const request = store.clear();
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	} catch (e) {
		console.error('Failed to clear library:', e);
	}
}

// Helper functions
function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

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
		return {
			used: 0,
			total: 50 * 1024 * 1024 * 1024,
			available: 50 * 1024 * 1024 * 1024,
			usedPercent: 0
		};
	}
}

export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

