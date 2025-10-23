// Library storage utility for managing books in browser localStorage

export interface StoredBook {
	id: string;
	title: string;
	author: string;
	cover: string; // base64 or blob URL
	fileData: string; // base64 encoded file data
	fileName: string;
	fileType: string;
	addedAt: number;
}

export interface StorageInfo {
	used: number; // bytes used
	total: number; // total bytes available
	available: number; // bytes available
	usedPercent: number; // percentage used (0-100)
}

const LIBRARY_KEY = 'basil-reader-library';

export function getLibrary(): StoredBook[] {
	try {
		const data = localStorage.getItem(LIBRARY_KEY);
		return data ? JSON.parse(data) : [];
	} catch (e) {
		console.error('Failed to load library:', e);
		return [];
	}
}

export function saveLibrary(books: StoredBook[]): void {
	try {
		const data = JSON.stringify(books);
		localStorage.setItem(LIBRARY_KEY, data);
	} catch (e) {
		console.error('Failed to save library:', e);
		if (e instanceof DOMException && e.name === 'QuotaExceededError') {
			throw new Error('Storage quota exceeded. Not enough space to save this book.');
		}
		throw new Error('Failed to save library. Storage quota may be exceeded.');
	}
}

export async function addBookToLibrary(
	file: File,
	metadata: { title: string; author: string; cover?: Blob }
): Promise<StoredBook> {
	// Get current library and save original state
	const library = getLibrary();
	const originalLibraryData = localStorage.getItem(LIBRARY_KEY);

	try {
		// Convert file to base64
		const fileData = await fileToBase64(file);

		// Convert cover to base64 if available
		let coverData = '';
		if (metadata.cover) {
			coverData = await blobToBase64(metadata.cover);
		}

		// Create book entry
		const book: StoredBook = {
			id: generateId(),
			title: metadata.title,
			author: metadata.author,
			cover: coverData,
			fileData,
			fileName: file.name,
			fileType: file.type,
			addedAt: Date.now()
		};

		// Estimate the size of new data
		const newLibrary = [book, ...library];
		const estimatedSize = JSON.stringify(newLibrary).length * 2; // UTF-16 = 2 bytes per char
		const storageInfo = getStorageInfo();
		
		// Check if we have enough space (with 10% buffer for safety)
		if (estimatedSize > storageInfo.total * 0.9) {
			throw new Error(
				`Book is too large. Estimated size: ${formatBytes(estimatedSize)}, ` +
				`Available space: ${formatBytes(storageInfo.available)}`
			);
		}

		// Try to save to localStorage
		saveLibrary(newLibrary);

		return book;
	} catch (e) {
		// Restore original state if something went wrong
		if (originalLibraryData !== null) {
			try {
				localStorage.setItem(LIBRARY_KEY, originalLibraryData);
			} catch (restoreError) {
				console.error('Failed to restore library after error:', restoreError);
				// If we can't restore, clear the potentially corrupted data
				localStorage.removeItem(LIBRARY_KEY);
			}
		}
		throw e;
	}
}

export function removeBookFromLibrary(bookId: string): void {
	const library = getLibrary();
	const filtered = library.filter((book) => book.id !== bookId);
	saveLibrary(filtered);
}

export function getBookById(bookId: string): StoredBook | undefined {
	const library = getLibrary();
	return library.find((book) => book.id === bookId);
}

export async function base64ToFile(base64: string, fileName: string, fileType: string): Promise<File> {
	const response = await fetch(base64);
	const blob = await response.blob();
	return new File([blob], fileName, { type: fileType });
}

// Helper functions
function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

async function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

async function blobToBase64(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

export function getStorageInfo(): StorageInfo {
	// Calculate used space by measuring all localStorage items
	let used = 0;
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key) {
			const value = localStorage.getItem(key);
			if (value) {
				// Each character in localStorage is 2 bytes (UTF-16)
				used += key.length * 2 + value.length * 2;
			}
		}
	}

	// Most browsers have a 5-10MB limit for localStorage
	// Default to 10MB, but adjust if we're already using more
	let total = 10 * 1024 * 1024; // 10MB in bytes
	
	// If we're using more than our estimate, the limit must be higher
	if (used > total) {
		total = used + 1024 * 1024; // Add 1MB buffer to current usage
	}

	const available = Math.max(0, total - used);
	const usedPercent = (used / total) * 100;

	return {
		used,
		total,
		available,
		usedPercent
	};
}

export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function clearLibrary(): void {
	try {
		localStorage.removeItem(LIBRARY_KEY);
	} catch (e) {
		console.error('Failed to clear library:', e);
	}
}

