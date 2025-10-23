/**
 * File handling utilities for managing book file uploads and drag-and-drop
 */

/**
 * Extracts a file from a drag event
 */
export function getFileFromDragEvent(e: DragEvent): File | null {
	const item = Array.from(e.dataTransfer?.items || []).find((item) => item.kind === 'file');
	if (item) {
		return item.getAsFile();
	}
	return null;
}

/**
 * Triggers a file input element click
 */
export function triggerFileInput(inputId: string): void {
	const input = document.getElementById(inputId) as HTMLInputElement;
	input?.click();
}

/**
 * Gets file from an input change event
 */
export function getFileFromInputEvent(e: Event): File | null {
	const target = e.target as HTMLInputElement;
	return target.files?.[0] || null;
}

/**
 * Validates if a file is a supported book format
 */
export function isValidBookFile(file: File): boolean {
	const validExtensions = ['.epub', '.mobi', '.azw', '.azw3', '.fb2', '.cbz', '.pdf'];
	const fileName = file.name.toLowerCase();
	return validExtensions.some(ext => fileName.endsWith(ext));
}

/**
 * Book file formats supported by the reader
 */
export const SUPPORTED_BOOK_FORMATS = '.epub,.mobi,.azw,.azw3,.fb2,.cbz,.pdf';
