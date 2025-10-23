/**
 * Book loader utilities for Foliate view
 * Handles book opening, metadata extraction, and initial setup
 */

import type { FoliateView } from '$lib/types/foliate';
import { formatLanguageMap, formatContributor } from './format';
import { getCSS } from './css';
import { addBookToLibrary, getStorageInfo, formatBytes } from './library';

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

export interface BookLoadResult {
	metadata: BookMetadata;
	toc: TOCItem[];
	sectionFractions: number[];
	coverBlob?: Blob;
}

export interface ReaderStyle {
	spacing: number;
	justify: boolean;
	hyphenate: boolean;
}

/**
 * Open a book file and set up the Foliate view
 */
export async function openBook(
	file: File | FileSystemDirectoryHandle,
	view: FoliateView,
	style: ReaderStyle,
	layout: string
): Promise<BookLoadResult> {
	// Open the book
	await view.open(file);

	const { book } = view;

	// Handle transform errors
	book.transformTarget?.addEventListener(
		'data',
		((event: CustomEvent<{ data: Promise<unknown>; name: string }>) => {
			const { detail } = event;
			detail.data = Promise.resolve(detail.data).catch((error: Error) => {
				console.error(new Error(`Failed to load ${detail.name}`, { cause: error }));
				return '';
			});
		}) as EventListener
	);

	// Apply styles and layout
	view.renderer.setStyles?.(getCSS(style));
	view.renderer.setAttribute('flow', layout);
	view.renderer.next();

	// Extract metadata
	const title = formatLanguageMap(book.metadata?.title) || 'Untitled Book';
	const author = book.metadata?.author ? formatContributor(book.metadata.author) : '';
	const dir = (book.dir as 'ltr' | 'rtl') || 'ltr';

	// Get cover
	let coverUrl = '';
	let coverBlob: Blob | undefined;
	try {
		const cover = await book.getCover?.();
		if (cover) {
			coverBlob = cover;
			coverUrl = URL.createObjectURL(cover);
		}
	} catch (error) {
		console.error('Failed to load cover:', error);
	}

	// Get TOC
	const toc = (book.toc as TOCItem[]) || [];

	// Get section fractions for progress tracking
	const sectionFractions = Array.from(view.getSectionFractions());

	return {
		metadata: {
			title,
			author,
			cover: coverUrl,
			dir
		},
		toc,
		sectionFractions,
		coverBlob
	};
}

/**
 * Save a book to the library with error handling
 */
export async function saveBookToLibrary(
	file: File,
	metadata: { title: string; author: string; cover?: Blob }
): Promise<{ success: boolean; error?: string }> {
	try {
		await addBookToLibrary(file, metadata);
		return { success: true };
	} catch (error) {
		console.error('Failed to save book to library:', error);

		const storageInfo = await getStorageInfo();
		const errorMsg = (error as Error).message;

		const detailedError =
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

		return { success: false, error: detailedError };
	}
}

/**
 * Set up keyboard navigation handlers
 */
export function setupKeyboardNavigation(view: FoliateView): (event: KeyboardEvent) => void {
	return (event: KeyboardEvent) => {
		const key = event.key;
		if (key === 'ArrowLeft' || key === 'h') {
			view.goLeft();
		} else if (key === 'ArrowRight' || key === 'l') {
			view.goRight();
		}
	};
}
