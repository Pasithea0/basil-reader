/**
 * Library management utility for handling book CRUD operations
 * Uses the storage utility for low-level IndexedDB operations
 */

import {
	getAllRecords,
	getRecord,
	saveRecord,
	deleteRecord,
	clearAllRecords,
	getStorageInfo as getStorageInfoFromStorage,
	formatBytes as formatBytesFromStorage,
	generateId,
	saveProgress,
	getProgress
} from './storage';
import type { StorageInfo } from './storage';

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

export interface BookProgress {
	page?: number;
	totalPages?: number;
	fraction?: number; // 0..1 across the whole book
	href?: string; // last TOC href if available
	cfi?: string; // EPUB CFI location if available
	pageLabel?: string; // Exact page label from pageItem (e.g., "12", "i", "xii")
	location?: {
		current: number;
		total: number;
	}; // Location numbers from foliate-js
	sectionIndex?: number; // Current section/chapter index
	sectionFraction?: number; // Fraction within current section (0..1)
	updatedAt: number;
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

/**
 * Gets all books from the library
 */
export async function getLibrary(): Promise<StoredBook[]> {
	const bookDataList = await getAllRecords<StoredBookData>();

	const books: StoredBook[] = bookDataList
		.map((bookData) => {
			let coverUrl: string | undefined = undefined;

			// Safely create object URL for cover
			try {
				if (bookData.cover) {
					const blob = bookData.cover instanceof Blob ? bookData.cover : new Blob([bookData.cover]);
					coverUrl = URL.createObjectURL(blob);
				}
			} catch (e) {
				console.log('No cover found for book:', bookData.title, e);
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

	return books;
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

	// Save to IndexedDB
	await saveRecord(bookData);

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
}

/**
 * Removes a book from the library
 */
export async function removeBookFromLibrary(bookId: string): Promise<void> {
	await deleteRecord(bookId);
}

/**
 * Gets a book file by ID
 */
export async function getBookById(bookId: string): Promise<File | null> {
	const bookData = await getRecord<StoredBookData>(bookId);

	if (bookData) {
		return new File([bookData.file], bookData.fileName, { type: bookData.fileType });
	}

	return null;
}

/**
 * Persists reading progress for a given book
 */
export async function saveBookProgress(bookId: string, progress: BookProgress): Promise<void> {
	const prev = await getProgress<BookProgress & { id: string }>(bookId);
	const changed =
		!prev ||
		prev.page !== progress.page ||
		prev.totalPages !== progress.totalPages ||
		prev.href !== progress.href ||
		prev.cfi !== progress.cfi ||
		prev.pageLabel !== progress.pageLabel ||
		prev.location?.current !== progress.location?.current ||
		prev.location?.total !== progress.location?.total ||
		prev.sectionIndex !== progress.sectionIndex ||
		prev.sectionFraction !== progress.sectionFraction ||
		(typeof progress.fraction === 'number' && progress.fraction !== prev.fraction);
	if (!changed && prev && progress.updatedAt <= prev.updatedAt) return;
	const dataToSave = { id: bookId, ...progress };
	console.log('Writing to IndexedDB:', dataToSave);
	await saveProgress(dataToSave);
}

/**
 * Returns persisted reading progress for a given book, if any
 */
export async function getBookProgress(bookId: string): Promise<BookProgress | null> {
	const progress = await getProgress<BookProgress & { id: string }>(bookId);
	if (!progress) return null;
	console.log('Raw progress from IndexedDB:', progress);
	const {
		updatedAt,
		page,
		totalPages,
		fraction,
		href,
		cfi,
		pageLabel,
		location,
		sectionIndex,
		sectionFraction
	} = progress;
	const result = {
		updatedAt,
		page,
		totalPages,
		fraction,
		href,
		cfi,
		pageLabel,
		location,
		sectionIndex,
		sectionFraction
	};
	console.log('Returning progress:', result);
	return result;
}

/**
 * Clears all books from the library
 */
export async function clearLibrary(): Promise<void> {
	await clearAllRecords();
}

/**
 * Re-export storage info functions
 */
export async function getStorageInfo(): Promise<StorageInfo> {
	return getStorageInfoFromStorage();
}

export function formatBytes(bytes: number): string {
	return formatBytesFromStorage(bytes);
}

export type { StorageInfo };
