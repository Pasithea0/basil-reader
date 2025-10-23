// Book loading utilities for Reader component

import type { FoliateView } from '$lib/types/foliate';
import { formatLanguageMap, formatContributor } from '$lib/utils/format';
import { getCSS } from '$lib/utils/css';
import { addBookToLibrary, getStorageInfo, formatBytes } from '$lib/utils/storage';

export interface BookMetadata {
	title: string;
	author: string;
	cover: string;
	dir: 'ltr' | 'rtl';
}

export interface TOCItem {
	label: string;
	href?: string;
	subitems?: TOCItem[];
}

export interface ReaderStyle {
	spacing: number;
	justify: boolean;
	hyphenate: boolean;
}

/**
 * Extracts metadata from a loaded book
 */
export async function extractBookMetadata(view: FoliateView): Promise<BookMetadata> {
	const { book } = view;
	
	const title = formatLanguageMap(book.metadata?.title) || 'Untitled Book';
	const author = book.metadata?.author ? formatContributor(book.metadata.author) : '';
	const dir = (book.dir as 'ltr' | 'rtl') || 'ltr';
	
	let cover = '';
	try {
		const coverBlob = await book.getCover?.();
		if (coverBlob) {
			cover = URL.createObjectURL(coverBlob);
		}
	} catch (e) {
		console.error('Failed to load cover:', e);
	}
	
	return { title, author, cover, dir };
}

/**
 * Applies styles to the book renderer
 */
export function applyBookStyles(view: FoliateView, style: ReaderStyle, layout: string): void {
	view.renderer.setStyles?.(getCSS(style));
	view.renderer.setAttribute('flow', layout);
	view.renderer.next();
}

/**
 * Attempts to save a book to the library
 */
export async function saveBookToLibrary(
	file: File,
	metadata: { title: string; author: string; cover?: Blob }
): Promise<{ success: boolean; error?: string }> {
	try {
		await addBookToLibrary(file, metadata);
		return { success: true };
	} catch (e) {
		console.error('Failed to save book to library:', e);
		const storageInfo = await getStorageInfo();
		const errorMsg = (e as Error).message;
		
		const errorMessage = 
			`⚠️ Failed to save book to library\n\n` +
			`${errorMsg}\n\n` +
			`📊 Storage Status:\n` +
			`• Used: ${formatBytes(storageInfo.used)} / ${formatBytes(storageInfo.total)}\n` +
			`• Available: ${formatBytes(storageInfo.available)}\n` +
			`• Usage: ${storageInfo.usedPercent.toFixed(1)}%\n\n` +
			`💡 Tips:\n` +
			`• Remove some books from your library to free up space\n` +
			`• The book is still open and readable, just not saved\n` +
			`• You can use the back button to return to your library`;
		
		return { success: false, error: errorMessage };
	}
}

/**
 * Gets the table of contents from a book
 */
export function extractTOC(view: FoliateView): TOCItem[] {
	const { book } = view;
	return (book.toc as TOCItem[]) || [];
}

/**
 * Gets section fractions for progress tracking
 */
export function extractSectionFractions(view: FoliateView): number[] {
	return Array.from(view.getSectionFractions());
}
