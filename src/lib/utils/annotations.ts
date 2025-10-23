/**
 * Annotation utilities for handling book highlights and notes
 * Works with Calibre bookmarks from EPUB files
 */

import type { FoliateView } from '$lib/types/foliate';

export interface Annotation {
	value: string;
	color?: string;
	note?: string;
}

export interface AnnotationStore {
	byIndex: Map<number, Annotation[]>;
	byValue: Map<string, Annotation>;
}

/**
 * Create an empty annotation store
 */
export function createAnnotationStore(): AnnotationStore {
	return {
		byIndex: new Map(),
		byValue: new Map()
	};
}

/**
 * Add an annotation to the store
 */
export function addAnnotation(
	store: AnnotationStore,
	index: number,
	annotation: Annotation
): void {
	const list = store.byIndex.get(index);
	if (list) {
		list.push(annotation);
	} else {
		store.byIndex.set(index, [annotation]);
	}
	store.byValue.set(annotation.value, annotation);
}

/**
 * Get annotations for a specific section index
 */
export function getAnnotationsForIndex(
	store: AnnotationStore,
	index: number
): Annotation[] | undefined {
	return store.byIndex.get(index);
}

/**
 * Get an annotation by its value
 */
export function getAnnotationByValue(
	store: AnnotationStore,
	value: string
): Annotation | undefined {
	return store.byValue.get(value);
}

/**
 * Load Calibre bookmarks from a book and add them to the view
 */
export async function loadCalibreAnnotations(
	book: any,
	view: FoliateView,
	store: AnnotationStore
): Promise<void> {
	try {
		const bookmarks = await book.getCalibreBookmarks?.();
		if (!bookmarks) return;

		const { fromCalibreHighlight } = await import('$lib/foliate-js/epubcfi.js');
		const { Overlayer } = await import('$lib/foliate-js/overlayer.js');

		// Process bookmarks
		for (const obj of bookmarks) {
			if (obj.type === 'highlight') {
				const value = fromCalibreHighlight(obj) as string;
				const annotation: Annotation = {
					value,
					color: obj.style?.which,
					note: obj.notes
				};
				addAnnotation(store, obj.spine_index, annotation);
			}
		}

		// Set up event listeners for rendering annotations
		view.addEventListener(
			'create-overlay',
			((e: CustomEvent<{ index: number }>) => {
				const { index } = e.detail;
				const annotations = getAnnotationsForIndex(store, index);
				if (annotations) {
					for (const annotation of annotations) {
						view.addAnnotation(annotation);
					}
				}
			}) as EventListener
		);

		view.addEventListener(
			'draw-annotation',
			((e: CustomEvent<{ draw: Function; annotation: Annotation }>) => {
				const { draw, annotation } = e.detail;
				const { color } = annotation;
				draw(Overlayer.highlight, { color });
			}) as EventListener
		);

		view.addEventListener(
			'show-annotation',
			((e: CustomEvent<{ value: string }>) => {
				const annotation = getAnnotationByValue(store, e.detail.value);
				if (annotation?.note) {
					alert(annotation.note);
				}
			}) as EventListener
		);
	} catch (error) {
		console.error('Failed to load Calibre annotations:', error);
	}
}
