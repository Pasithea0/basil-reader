/**
 * Library management utilities
 * High-level API for managing the user's book library
 */

import {
	getAllBooks,
	getBookData,
	saveBookData,
	deleteBookData,
	clearAllBooks,
	getStorageEstimate,
	type StoredBookData
} from './storage';

export interface StoredBook {
	id: string;
	title: string;
	author: string;
	coverUrl?: string;
	fileName: string;
	fileType: string;
	fileSize: number;
	addedAt: number;
}

export interface StorageInfo {
	used: number;
	total: number;
	available: number;
	usedPercent: number;
}

/**
 * Gets all books in the library
 */
export async function getLibrary(): Promise<StoredBook[]> {
	try {
		const bookDataList = await getAllBooks();

		return bookDataList
			.map((bookData) => convertToStoredBook(bookData))
			.sort((a, b) => b.addedAt - a.addedAt);
	} catch (e) {
		console.error('Failed to load library:', e);
		return [];
	}
}

/**
 * Gets a single book file by ID
 */
export async function getBookById(bookId: string): Promise<File | null> {
	try {
		const bookData = await getBookData(bookId);
		if (!bookData) return null;

		return new File([bookData.file], bookData.fileName, {
			type: bookData.fileType
		});
	} catch (e) {
		console.error('Failed to get book:', e);
		return null;
	}
}

/**
 * Adds a book to the library
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

	// Save to storage
	await saveBookData(bookData);

	// Return converted book
	return convertToStoredBook(bookData);
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
 * Gets storage information
 */
export async function getStorageInfo(): Promise<StorageInfo> {
	return await getStorageEstimate();
}

/**
 * Formats bytes into human-readable format
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper functions

/**
 * Generates a unique ID for a book
 */
function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Converts StoredBookData to StoredBook with object URLs
 */
function convertToStoredBook(bookData: StoredBookData): StoredBook {
	let coverUrl: string | undefined;

	// Safely create object URL for cover
	try {
		if (bookData.cover) {
			const blob =
				bookData.cover instanceof Blob
					? bookData.cover
					: new Blob([bookData.cover]);
			coverUrl = URL.createObjectURL(blob);
		}
	} catch (e) {
		// Silently fail - book will show without cover
		console.warn('Failed to create cover URL:', e);
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
}
