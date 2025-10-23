// Book management operations

import { getAllBooks, getBookData, saveBookData, deleteBookData, clearAllBooks } from './database';
import { getStorageInfo, formatBytes, getStorageErrorMessage } from './quota';
import type { StoredBook, StoredBookData, BookMetadata } from './types';

/**
 * Generates a unique ID for a book
 */
function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Converts StoredBookData to StoredBook with cover URL
 */
function dataToBook(bookData: StoredBookData): StoredBook {
	let coverUrl: string | undefined = undefined;
	
	// Safely create object URL for cover
	try {
		if (bookData.cover) {
			const blob = bookData.cover instanceof Blob 
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

/**
 * Gets all books from the library, sorted by date (newest first)
 */
export async function getLibrary(): Promise<StoredBook[]> {
	try {
		const bookDataList = await getAllBooks();
		return bookDataList
			.map(dataToBook)
			.sort((a, b) => b.addedAt - a.addedAt);
	} catch (e) {
		console.error('Failed to load library:', e);
		return [];
	}
}

/**
 * Gets a book file by ID
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
 * Adds a book to the library
 */
export async function addBookToLibrary(
	file: File,
	metadata: BookMetadata
): Promise<StoredBook> {
	// Check storage quota before saving
	const storageInfo = await getStorageInfo();
	const estimatedSize = file.size + (metadata.cover?.size || 0);
	
	if (estimatedSize > storageInfo.available) {
		throw new Error(getStorageErrorMessage(estimatedSize, storageInfo.available));
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
	await saveBookData(bookData);

	// Return book metadata
	return dataToBook(bookData);
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
