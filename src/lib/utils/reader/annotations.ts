// Annotation handling utilities for Reader component

import type { FoliateView } from '$lib/types/foliate';
import { SvelteMap } from 'svelte/reactivity';

export interface Annotation {
	value: string;
	color?: string;
	note?: string;
}

export type AnnotationsMap = SvelteMap<number, Annotation[]>;
export type AnnotationsByValueMap = SvelteMap<string, Annotation>;

/**
 * Loads Calibre bookmarks and sets up annotation system
 */
export async function setupAnnotations(
	view: FoliateView,
	annotations: AnnotationsMap,
	annotationsByValue: AnnotationsByValueMap
): Promise<void> {
	const { book } = view;
	
	try {
		const bookmarks = await book.getCalibreBookmarks?.();
		if (!bookmarks) return;

		const { fromCalibreHighlight } = await import('$lib/foliate-js/epubcfi.js');
		const { Overlayer } = await import('$lib/foliate-js/overlayer.js');

		// Load existing bookmarks
		for (const obj of bookmarks) {
			if (obj.type === 'highlight') {
				const value = fromCalibreHighlight(obj) as string;
				const color = obj.style?.which;
				const note = obj.notes;
				const annotation = { value, color, note };
				
				const list = annotations.get(obj.spine_index);
				if (list) {
					list.push(annotation);
				} else {
					annotations.set(obj.spine_index, [annotation]);
				}
				annotationsByValue.set(value, annotation);
			}
		}

		// Set up event listeners for annotations
		view.addEventListener('create-overlay', ((e: CustomEvent<{ index: number }>) => {
			const { index } = e.detail;
			const list = annotations.get(index);
			if (list && view) {
				for (const annotation of list) {
					view.addAnnotation(annotation);
				}
			}
		}) as EventListener);

		view.addEventListener('draw-annotation', ((e: CustomEvent<{ 
			draw: (fn: (range: Range) => SVGElement, options: Record<string, unknown>) => void; 
			annotation: { color?: string } 
		}>) => {
			const { draw, annotation } = e.detail;
			const { color } = annotation;
			draw(Overlayer.highlight, { color });
		}) as EventListener);

		view.addEventListener('show-annotation', ((e: CustomEvent<{ value: string }>) => {
			const annotation = annotationsByValue.get(e.detail.value);
			if (annotation?.note) {
				alert(annotation.note);
			}
		}) as EventListener);
	} catch (e) {
		console.error('Failed to load bookmarks:', e);
	}
}
