/**
 * Book loading and metadata extraction utilities
 * Handles integration with foliate-js for book rendering
 */

import type { FoliateView } from '$lib/types/foliate';
import { formatLanguageMap, formatContributor } from './format';
import { SvelteMap } from 'svelte/reactivity';

export interface TOCItem {
	label: string;
	href: string;
	subitems?: TOCItem[];
}

export interface BookMetadata {
	title: string;
	author: string;
	cover?: Blob;
	dir: 'ltr' | 'rtl';
	toc?: TOCItem[];
}

/**
 * Creates and initializes a foliate view component
 */
export async function createFoliateView(
	container: HTMLElement,
	file: File | FileSystemDirectoryHandle
): Promise<FoliateView> {
	const view = document.createElement('foliate-view') as FoliateView;
	container.appendChild(view);
	await view.open(file);
	return view;
}

/**
 * Extracts metadata from a loaded foliate view
 */
export async function extractBookMetadata(view: FoliateView): Promise<BookMetadata> {
	const metadata = view.book?.metadata || {};
	const rendition = view.book?.rendition || {};
	
	// Extract title
	const title = formatLanguageMap(metadata.title) || 'Untitled Book';
	
	// Extract author
	const author = metadata.author ? formatContributor(metadata.author) : 'Unknown Author';
	
	// Extract direction
	const dir = (rendition.direction || 'ltr') as 'ltr' | 'rtl';
	
	// Extract table of contents
	const toc = view.book?.toc || [];
	
	// Extract cover
	let cover: Blob | undefined;
	try {
		const coverUrl = await view.getCover?.();
		if (coverUrl) {
			const response = await fetch(coverUrl);
			cover = await response.blob();
		}
	} catch (e) {
		// Cover extraction failed, continue without it
		console.warn('Failed to extract cover:', e);
	}

	return {
		title,
		author,
		cover,
		dir,
		toc
	};
}

/**
 * Sets up error handling for the foliate view
 */
export function setupErrorHandling(view: FoliateView): void {
	view.addEventListener('error', ((event: CustomEvent) => {
		const error = event.detail;
		console.error('Foliate view error:', error);
		
		// Show user-friendly error message
		if (error?.message) {
			alert(`Error loading book: ${error.message}`);
		}
	}) as EventListener);
}

/**
 * Loads Calibre bookmarks if available
 * This is for compatibility with books that have Calibre annotations
 */
export async function loadCalibreBookmarks(
	view: FoliateView,
	annotations: SvelteMap<number, Array<{ value: string; color?: string; note?: string }>>,
	annotationsByValue: SvelteMap<string, { value: string; color?: string; note?: string }>
): Promise<void> {
	try {
		// Check if the book has Calibre metadata
		const book = view.book;
		if (!book) return;

		// Try to find Calibre bookmarks in the book's metadata
		// This is a placeholder - actual implementation would depend on
		// how Calibre stores bookmarks in the book format
		const calibreBookmarks = (book as any).calibreBookmarks;
		
		if (calibreBookmarks && Array.isArray(calibreBookmarks)) {
			for (const bookmark of calibreBookmarks) {
				// Process each bookmark and add to annotations
				if (bookmark.text && bookmark.position !== undefined) {
					const annotation = {
						value: bookmark.text,
						color: bookmark.color,
						note: bookmark.note
					};
					
					// Add to annotations map by position
					const existing = annotations.get(bookmark.position) || [];
					existing.push(annotation);
					annotations.set(bookmark.position, existing);
					
					// Add to value map for quick lookup
					annotationsByValue.set(bookmark.text, annotation);
				}
			}
		}
	} catch (e) {
		console.warn('Failed to load Calibre bookmarks:', e);
		// Not a critical error, continue without bookmarks
	}
}
