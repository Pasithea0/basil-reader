// Storage and file type constants

// Supported file types (PDF removed due to indexedDB blob storage incompatibility)
export const ALLOWED_FILE_TYPES = [
	'.epub',
	'.mobi',
	'.azw',
	'.azw3',
	'.fb2',
	'.cbz'
] as const;

export const ALLOWED_FILE_TYPES_STRING = ALLOWED_FILE_TYPES.join(',');

export const FILE_TYPE_NAMES: Record<string, string> = {
	'.epub': 'EPUB',
	'.mobi': 'MOBI',
	'.azw': 'AZW',
	'.azw3': 'AZW3',
	'.fb2': 'FB2',
	'.cbz': 'CBZ'
};

// IndexedDB configuration
export const DB_NAME = 'basil-reader-db';
export const DB_VERSION = 1;
export const STORE_NAME = 'books';

// Storage defaults
export const DEFAULT_STORAGE_ESTIMATE = 50 * 1024 * 1024 * 1024; // 50GB fallback
