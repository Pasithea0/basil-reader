// Storage type definitions

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

export interface StoredBookData {
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

export interface BookMetadata {
	title: string;
	author: string;
	cover?: Blob;
}
