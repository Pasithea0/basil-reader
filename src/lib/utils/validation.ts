// File validation utilities

import { ALLOWED_FILE_TYPES } from './storage';

/**
 * Checks if a file type is supported
 */
export function isFileTypeSupported(fileName: string): boolean {
	const extension = fileName.toLowerCase().match(/\.[^.]+$/)?.[0];
	if (!extension) return false;
	return ALLOWED_FILE_TYPES.includes(extension as any);
}

/**
 * Gets the file extension from a filename
 */
export function getFileExtension(fileName: string): string | null {
	const match = fileName.toLowerCase().match(/\.[^.]+$/);
	return match ? match[0] : null;
}

/**
 * Validates a file for book import
 */
export function validateBookFile(file: File): { valid: boolean; error?: string } {
	// Check if file exists
	if (!file) {
		return { valid: false, error: 'No file provided' };
	}

	// Check file size (max 100MB)
	const maxSize = 100 * 1024 * 1024; // 100MB
	if (file.size > maxSize) {
		return { 
			valid: false, 
			error: `File is too large. Maximum size is 100MB, but file is ${(file.size / 1024 / 1024).toFixed(2)}MB` 
		};
	}

	// Check file type
	if (!isFileTypeSupported(file.name)) {
		const ext = getFileExtension(file.name);
		return { 
			valid: false, 
			error: `Unsupported file type: ${ext}. Supported formats: ${ALLOWED_FILE_TYPES.join(', ')}` 
		};
	}

	return { valid: true };
}
