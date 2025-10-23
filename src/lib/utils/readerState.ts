// Reader state management utility
// Handles reader-specific state and logic

import type { FoliateView } from '$lib/types/foliate';
import { formatLanguageMap, formatContributor, percentFormat } from './format';
import { getCSS } from './css';

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

export interface BookMetadata {
	title: string;
	author: string;
	cover: string;
	dir: 'ltr' | 'rtl';
}

export interface NavigationState {
	fraction: number;
	progressTitle: string;
	sectionFractions: number[];
	currentHref: string;
}

/**
 * Default reader styles
 */
export const DEFAULT_READER_STYLE: ReaderStyle = {
	spacing: 1.4,
	justify: true,
	hyphenate: true
};

/**
 * Extracts book metadata from foliate book object
 */
export async function extractBookMetadata(book: any): Promise<BookMetadata> {
	const title = formatLanguageMap(book.metadata?.title) || 'Untitled Book';
	const author = book.metadata?.author ? formatContributor(book.metadata.author) : '';
	const dir = (book.dir as 'ltr' | 'rtl') || 'ltr';

	// Get cover
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
 * Sets up the foliate view with initial configuration
 */
export function setupFoliateView(
	view: FoliateView,
	style: ReaderStyle,
	layout: string
): void {
	// Apply styles
	view.renderer.setStyles?.(getCSS(style));
	view.renderer.setAttribute('flow', layout);
	view.renderer.next();
}

/**
 * Handles the relocate event from foliate view
 */
export function handleRelocateEvent(detail: {
	fraction: number;
	location: { current: number };
	tocItem?: { href?: string };
	pageItem?: { label: string };
}): { fraction: number; progressTitle: string; currentHref?: string } {
	const { fraction, location, tocItem, pageItem } = detail;

	// Update title with percentage and location
	const percent = percentFormat.format(fraction);
	const loc = pageItem ? `Page ${pageItem.label}` : `Loc ${location.current}`;
	const progressTitle = `${percent} · ${loc}`;

	return {
		fraction,
		progressTitle,
		currentHref: tocItem?.href
	};
}

/**
 * Handles keyboard navigation
 */
export function handleKeyboardNavigation(
	event: KeyboardEvent,
	view: FoliateView | null
): boolean {
	if (!view) return false;

	const k = event.key;
	if (k === 'ArrowLeft' || k === 'h') {
		view.goLeft();
		return true;
	} else if (k === 'ArrowRight' || k === 'l') {
		view.goRight();
		return true;
	}
	return false;
}

/**
 * Extracts TOC from book
 */
export function extractTOC(book: any): TOCItem[] {
	return book.toc ? (book.toc as TOCItem[]) : [];
}

/**
 * Gets section fractions from view
 */
export function getSectionFractions(view: FoliateView): number[] {
	return Array.from(view.getSectionFractions());
}
