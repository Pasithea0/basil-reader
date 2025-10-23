// Annotations utility
// Handles Calibre bookmarks and annotations

import { SvelteMap } from 'svelte/reactivity';
import type { FoliateView } from '$lib/types/foliate';

export interface Annotation {
	value: string;
	color?: string;
	note?: string;
}

/**
 * Loads Calibre bookmarks and sets up annotation handlers
 * Returns annotation maps if successful, null otherwise
 */
export async function loadCalibreBookmarks(
	book: any,
	view: FoliateView
): Promise<{
	annotations: SvelteMap<number, Annotation[]>;
	annotationsByValue: SvelteMap<string, Annotation>;
} | null> {
	try {
		const bookmarks = await book.getCalibreBookmarks?.();
		if (!bookmarks) return null;

		const { fromCalibreHighlight } = await import('$lib/foliate-js/epubcfi.js');
		const { Overlayer } = await import('$lib/foliate-js/overlayer.js');

		const annotations = new SvelteMap<number, Annotation[]>();
		const annotationsByValue = new SvelteMap<string, Annotation>();

		// Parse bookmarks into annotations
		for (const obj of bookmarks) {
			if (obj.type === 'highlight') {
				const value = fromCalibreHighlight(obj) as string;
				const color = obj.style?.which;
				const note = obj.notes;
				const annotation: Annotation = { value, color, note };
				
				const list = annotations.get(obj.spine_index);
				if (list) {
					list.push(annotation);
				} else {
					annotations.set(obj.spine_index, [annotation]);
				}
				annotationsByValue.set(value, annotation);
			}
		}

		// Set up event listeners
		setupAnnotationListeners(view, annotations, annotationsByValue, Overlayer);

		return { annotations, annotationsByValue };
	} catch (e) {
		console.error('Failed to load bookmarks:', e);
		return null;
	}
}

/**
 * Sets up annotation event listeners on the foliate view
 */
function setupAnnotationListeners(
	view: FoliateView,
	annotations: SvelteMap<number, Annotation[]>,
	annotationsByValue: SvelteMap<string, Annotation>,
	Overlayer: any
): void {
	// Create overlay for annotations
	view.addEventListener('create-overlay', ((e: CustomEvent<{ index: number }>) => {
		const { index } = e.detail;
		const list = annotations.get(index);
		if (list && view) {
			for (const annotation of list) {
				view.addAnnotation(annotation);
			}
		}
	}) as EventListener);

	// Draw annotations
	view.addEventListener('draw-annotation', ((e: CustomEvent<{
		draw: (fn: (range: Range) => SVGElement, options: Record<string, unknown>) => void;
		annotation: { color?: string };
	}>) => {
		const { draw, annotation } = e.detail;
		const { color } = annotation;
		draw(Overlayer.highlight, { color });
	}) as EventListener);

	// Show annotation notes
	view.addEventListener('show-annotation', ((e: CustomEvent<{ value: string }>) => {
		const annotation = annotationsByValue.get(e.detail.value);
		if (annotation?.note) {
			alert(annotation.note);
		}
	}) as EventListener);
}
