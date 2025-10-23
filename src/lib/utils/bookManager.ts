// Book management utility
// Handles high-level book operations and metadata

import {
	getAllBooks,
	getBookData,
	saveBookData,
	deleteBookData,
	clearAllBooks,
	getStorageQuota,
	type BookData
} from './storage';

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

export interface StorageInfo {
	used: number; // bytes used
	total: number; // total bytes available
	available: number; // bytes available
	usedPercent: number; // percentage used (0-100)
}

/**
 * Generates a unique ID for a book
 */
function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Safely creates an object URL from a Blob
 * Returns undefined if the blob is invalid
 */
function createSafeBlobUrl(blob: Blob | undefined): string | undefined {
	if (!blob) return undefined;
	
	try {
		// Convert to Blob if needed
		const blobObj = blob instanceof Blob ? blob : new Blob([blob]);
		return URL.createObjectURL(blobObj);
	} catch (e) {
		console.warn('Failed to create blob URL:', e);
		return undefined;
	}
}

/**
 * Converts BookData to StoredBook for UI display
 */
function bookDataToStoredBook(bookData: BookData): StoredBook {
	return {
		id: bookData.id,
		title: bookData.title,
		author: bookData.author,
		coverUrl: createSafeBlobUrl(bookData.cover),
		fileName: bookData.fileName,
		fileType: bookData.fileType,
		fileSize: bookData.fileSize,
		addedAt: bookData.addedAt
	};
}

/**
 * Gets all books from the library
 * Returns books sorted by date (newest first)
 */
export async function getLibrary(): Promise<StoredBook[]> {
	try {
		const bookDataList = await getAllBooks();
		
		const books = bookDataList
			.map(bookDataToStoredBook)
			.sort((a, b) => b.addedAt - a.addedAt); // Sort by date, newest first
		
		return books;
	} catch (e) {
		console.error('Failed to load library:', e);
		return [];
	}
}

/**
 * Gets a specific book by ID and returns it as a File object
 */
export async function getBookById(bookId: string): Promise<File | null> {
	try {
		const bookData = await getBookData(bookId);
		if (bookData) {
			return new File([bookData.file], bookData.fileName, { type: bookData.fileType });
		}
		return null;
	} catch (e) {
		console.error('Failed to get book:', e);
		return null;
	}
}

/**
 * Adds a new book to the library
 * Checks storage quota before saving
 * Throws an error if there's not enough space
 */
export async function addBookToLibrary(
	file: File,
	metadata: { title: string; author: string; cover?: Blob }
): Promise<StoredBook> {
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
	const bookData: BookData = {
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
	await saveBookData(bookData);

	// Return book metadata
	return bookDataToStoredBook(bookData);
}

/**
 * Removes a book from the library
 */
export async function removeBookFromLibrary(bookId: string): Promise<void> {
	try {
		await deleteBookData(bookId);
	} catch (e) {
		console.error('Failed to remove book:', e);
		throw e;
	}
}

/**
 * Clears all books from the library
 */
export async function clearLibrary(): Promise<void> {
	try {
		await clearAllBooks();
	} catch (e) {
		console.error('Failed to clear library:', e);
		throw e;
	}
}

/**
 * Gets current storage information
 */
export async function getStorageInfo(): Promise<StorageInfo> {
	return getStorageQuota();
}

/**
 * Formats bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
