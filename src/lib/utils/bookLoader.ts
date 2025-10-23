/**
 * Book loader utility for handling book opening and metadata extraction
 * Separates book loading logic from the Reader component
 */

import { formatLanguageMap, formatContributor } from './format';
import type { FoliateView } from '$lib/types/foliate';

export interface BookMetadata {
	title: string;
	author: string;
	cover?: Blob;
	dir: 'ltr' | 'rtl';
	toc?: TOCItem[];
}

export interface TOCItem {
	label: string;
	href?: string;
	subitems?: TOCItem[];
}

/**
 * Creates and initializes a foliate-view element
 */
export async function createFoliateView(
	container: HTMLElement,
	file: File | FileSystemDirectoryHandle
): Promise<FoliateView> {
	// Create foliate-view element
	// We need to use DOM manipulation here because foliate-view is a custom element
	// from an external library (foliate-js) that must be created imperatively.
	// Svelte can't manage this element because it's defined in vanilla JS.
	const viewElement = document.createElement('foliate-view') as unknown as FoliateView;
	container.appendChild(viewElement);

	await viewElement.open(file);

	return viewElement;
}

/**
 * Extracts metadata from a book
 */
export async function extractBookMetadata(view: FoliateView): Promise<BookMetadata> {
	const { book } = view;

	// Extract basic metadata
	const title = formatLanguageMap(book.metadata?.title) || 'Untitled Book';
	const author = book.metadata?.author ? formatContributor(book.metadata.author) : '';
	const dir = (book.dir as 'ltr' | 'rtl') || 'ltr';

	// Extract cover
	let cover: Blob | undefined;
	try {
		const coverBlob = await book.getCover?.();
		if (coverBlob) {
			cover = coverBlob;
		}
	} catch (e) {
		console.error('Failed to load cover:', e);
	}

	// Extract TOC
	const toc = book.toc ? (book.toc as TOCItem[]) : [];

	return {
		title,
		author,
		cover,
		dir,
		toc
	};
}

/**
 * Sets up error handling for book transforms
 */
export function setupErrorHandling(view: FoliateView): () => void {
    const { book } = view;
    const handler = (({
        detail
    }: CustomEvent<{ data: Promise<unknown>; name: string }>) => {
        detail.data = Promise.resolve(detail.data).catch((e: Error) => {
            console.error(new Error(`Failed to load ${detail.name}`, { cause: e }));
            return '';
        });
    }) as EventListener;

    book.transformTarget?.addEventListener('data', handler);

    return () => {
        try {
            book.transformTarget?.removeEventListener('data', handler);
        } catch {}
    };
}

/**
 * Extracts metadata from a book file without fully opening it in the reader
 * This is useful for importing books to the library without immediately reading them
 */
export async function extractMetadataFromFile(file: File): Promise<BookMetadata> {
	// Ensure foliate-js view module is loaded
	await import('$lib/foliate-js/view.js');

	// Create a temporary container for metadata extraction
	const tempContainer = document.createElement('div');
	tempContainer.style.display = 'none';
	document.body.appendChild(tempContainer);

	try {
		// Create a temporary view to extract metadata
		const view = await createFoliateView(tempContainer, file);
		const metadata = await extractBookMetadata(view);

		// Clean up
		tempContainer.remove();

		return metadata;
	} catch (e) {
		// Clean up on error
		tempContainer.remove();
		throw e;
	}
}

/**
 * Loads and sets up Calibre bookmarks if available
 */
export async function loadCalibreBookmarks(
	view: FoliateView,
	annotations: Map<number, Array<{ value: string; color?: string; note?: string }>>,
	annotationsByValue: Map<string, { value: string; color?: string; note?: string }>
): Promise<() => void> {
	try {
		const { book } = view;
		const bookmarks = await book.getCalibreBookmarks?.();

		if (!bookmarks) return;

		const { fromCalibreHighlight } = await import('$lib/foliate-js/epubcfi.js');
		const { Overlayer } = await import('$lib/foliate-js/overlayer.js');

		// Process bookmarks
		for (const obj of bookmarks) {
			if (obj.type === 'highlight') {
				const value = fromCalibreHighlight(obj) as string;
				const color = obj.style?.which;
				const note = obj.notes;
				const annotation = { value, color, note };
				const list = annotations.get(obj.spine_index);
				if (list) list.push(annotation);
				else annotations.set(obj.spine_index, [annotation]);
				annotationsByValue.set(value, annotation);
			}
		}

        // Set up annotation event listeners and keep references for cleanup
        const handleCreateOverlayer = ((e: CustomEvent<{ index: number }>) => {
            const { index } = e.detail;
            const list = annotations.get(index);
            if (list) {
                for (const annotation of list) {
                    view.addAnnotation(annotation);
                }
            }
        }) as EventListener;

        const handleDrawAnnotation = ((
            e: CustomEvent<{
                draw: (fn: (range: Range) => SVGElement, options: Record<string, unknown>) => void;
                annotation: { color?: string };
            }>
        ) => {
            const { draw, annotation } = e.detail;
            const { color } = annotation;
            draw(Overlayer.highlight, { color });
        }) as EventListener;

        const handleShowAnnotation = ((e: CustomEvent<{ value: string }>) => {
            const annotation = annotationsByValue.get(e.detail.value);
            if (annotation?.note) alert(annotation.note);
        }) as EventListener;

        view.addEventListener('create-overlayer', handleCreateOverlayer);
        view.addEventListener('draw-annotation', handleDrawAnnotation);
        view.addEventListener('show-annotation', handleShowAnnotation);

        return () => {
            try { view.removeEventListener('create-overlayer', handleCreateOverlayer); } catch {}
            try { view.removeEventListener('draw-annotation', handleDrawAnnotation); } catch {}
            try { view.removeEventListener('show-annotation', handleShowAnnotation); } catch {}
        };
	} catch (e) {
		console.error('Failed to load bookmarks:', e);
        return () => {};
    }
}
