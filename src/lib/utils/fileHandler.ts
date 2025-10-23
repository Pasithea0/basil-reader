/**
 * File handling and validation utilities
 * Handles file input, drag-and-drop, and format validation
 */

// Supported book formats (excluding PDF as it's incompatible with IndexedDB blob storage)
export const SUPPORTED_FORMATS = {
	EPUB: '.epub',
	MOBI: '.mobi',
	AZW: '.azw',
	AZW3: '.azw3',
	FB2: '.fb2',
	CBZ: '.cbz'
} as const;

export const SUPPORTED_BOOK_FORMATS = Object.values(SUPPORTED_FORMATS).join(',');

export const SUPPORTED_MIME_TYPES = [
	'application/epub+zip',
	'application/x-mobipocket-ebook',
	'application/vnd.amazon.ebook',
	'application/x-fictionbook+xml',
	'application/x-cbz'
];

/**
 * Validates if a file is a supported book format
 */
export function isSupportedFormat(file: File): boolean {
	const extension = '.' + file.name.split('.').pop()?.toLowerCase();
	return Object.values(SUPPORTED_FORMATS).includes(extension as any);
}

/**
 * Gets a user-friendly error message for unsupported formats
 */
export function getUnsupportedFormatMessage(fileName: string): string {
	const extension = fileName.split('.').pop()?.toLowerCase();
	
	if (extension === 'pdf') {
		return 'PDF files are not supported. The new storage system is incompatible with PDF.js. Please use EPUB, MOBI, AZW3, FB2, or CBZ formats.';
	}
	
	return `Unsupported file format: .${extension}. Please use EPUB, MOBI, AZW3, FB2, or CBZ formats.`;
}

/**
 * Extracts file from drag event
 */
export async function getFileFromDragEvent(event: DragEvent): Promise<File | null> {
	const item = Array.from(event.dataTransfer?.items || []).find(
		(item) => item.kind === 'file'
	);
	
	if (!item) return null;

	// Try to get FileSystemHandle for better directory support
	if ('getAsFileSystemHandle' in item && typeof item.getAsFileSystemHandle === 'function') {
		try {
			const handle = await item.getAsFileSystemHandle();
			if (handle.kind === 'file') {
				return await (handle as FileSystemFileHandle).getFile();
			}
		} catch (e) {
			// Fall through to getAsFile
		}
	}

	return item.getAsFile();
}

/**
 * Extracts file from input event
 */
export function getFileFromInputEvent(event: Event): File | null {
	const target = event.target as HTMLInputElement;
	return target.files?.[0] || null;
}

/**
 * Triggers a file input element by ID
 */
export function triggerFileInput(inputId: string): void {
	const input = document.getElementById(inputId) as HTMLInputElement;
	input?.click();
}

/**
 * Validates and returns file, showing error if invalid
 */
export function validateFile(file: File | null): File | null {
	if (!file) return null;
	
	if (!isSupportedFormat(file)) {
		alert(getUnsupportedFormatMessage(file.name));
		return null;
	}
	
	return file;
}
