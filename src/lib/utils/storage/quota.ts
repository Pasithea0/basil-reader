// Storage quota management

import { DEFAULT_STORAGE_ESTIMATE } from './constants';
import type { StorageInfo } from './types';

/**
 * Gets current storage usage information
 */
export async function getStorageInfo(): Promise<StorageInfo> {
	try {
		// Use Storage Manager API if available
		if ('storage' in navigator && 'estimate' in navigator.storage) {
			const estimate = await navigator.storage.estimate();
			const used = estimate.usage || 0;
			const total = estimate.quota || 0;
			const available = Math.max(0, total - used);
			const usedPercent = total > 0 ? (used / total) * 100 : 0;

			return {
				used,
				total,
				available,
				usedPercent
			};
		}

		// Fallback for browsers without Storage Manager API
		return {
			used: 0,
			total: DEFAULT_STORAGE_ESTIMATE,
			available: DEFAULT_STORAGE_ESTIMATE,
			usedPercent: 0
		};
	} catch (e) {
		return {
			used: 0,
			total: DEFAULT_STORAGE_ESTIMATE,
			available: DEFAULT_STORAGE_ESTIMATE,
			usedPercent: 0
		};
	}
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

/**
 * Checks if there's enough storage space for a given size
 */
export async function hasEnoughSpace(requiredBytes: number): Promise<boolean> {
	const storageInfo = await getStorageInfo();
	return requiredBytes <= storageInfo.available;
}

/**
 * Gets a formatted storage error message
 */
export function getStorageErrorMessage(
	requiredBytes: number,
	availableBytes: number
): string {
	return (
		`Not enough storage space. Need ${formatBytes(requiredBytes)}, ` +
		`but only ${formatBytes(availableBytes)} available.`
	);
}
