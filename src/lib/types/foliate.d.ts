// Type definitions for foliate-js integration

export interface FoliateBook {
	sections: FoliateSection[];
	dir: 'ltr' | 'rtl';
	toc?: TOCItem[];
	pageList?: TOCItem[];
	metadata?: BookMetadata;
	rendition?: {
		layout?: 'reflowable' | 'pre-paginated';
		orientation?: 'auto' | 'landscape' | 'portrait';
		spread?: 'auto' | 'both' | 'none';
	};
	transformTarget?: EventTarget;
	resolveHref?: (href: string) => ResolvedLocation;
	resolveCFI?: (cfi: string) => ResolvedLocation;
	isExternal?: (href: string) => boolean;
	getCover?: () => Promise<Blob | null>;
	getCalibreBookmarks?: () => Promise<CalibreBookmark[]>;
}

export interface FoliateSection {
	load: () => string | Promise<string>;
	unload?: () => void;
	createDocument?: () => Document | Promise<Document>;
	size?: number;
	linear?: 'yes' | 'no';
	cfi?: string;
	id?: string | number;
}

export interface TOCItem {
	label: string;
	href: string;
	subitems?: TOCItem[];
}

export interface BookMetadata {
	title?: string | LanguageMap;
	author?: Contributor | Contributor[];
	publisher?: string;
	language?: string;
	modified?: string;
	published?: string;
	description?: string;
}

export interface LanguageMap {
	[languageCode: string]: string;
}

export type Contributor = string | { name: string | LanguageMap; role?: string };

export interface ResolvedLocation {
	index: number;
	anchor?: (doc: Document) => Element | Range | null;
}

export interface CalibreBookmark {
	type: 'highlight' | 'bookmark';
	spine_index: number;
	start_cfi: string;
	end_cfi: string;
	style?: {
		which: string;
	};
	notes?: string;
	[key: string]: unknown;
}

export interface FoliateView extends HTMLElement {
	open(file: File | FileSystemDirectoryHandle | string | FoliateBook): Promise<void>;
	goTo(target: string | ResolvedLocation): Promise<void>;
	goLeft(): void;
	goRight(): void;
	goToFraction(fraction: number): void;
	getSectionFractions(): IterableIterator<number>;
	addAnnotation(annotation: Annotation): void;
	book: FoliateBook;
	renderer: FoliateRenderer;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
}

export interface FoliateRenderer extends HTMLElement {
	setStyles(css: string): void;
	setAttribute(name: string, value: string): void;
	next(): void;
	prev(): void;
}

export interface Annotation {
	value: string | Record<string, unknown>;
	color?: string;
	note?: string;
}

export interface LoadEvent extends CustomEvent {
	detail: {
		doc: Document;
		index: number;
	};
}

export interface RelocateEvent extends CustomEvent {
	detail: {
		range: Range;
		index: number;
		fraction: number;
		location: {
			current: number;
			total: number;
		};
		tocItem?: TOCItem;
		pageItem?: {
			label: string;
		};
	};
}

export interface CreateOverlayEvent extends CustomEvent {
	detail: {
		doc: Document;
		index: number;
		attach: (overlay: { element: HTMLElement; redraw: () => void }) => void;
	};
}

export interface DrawAnnotationEvent extends CustomEvent {
	detail: {
		draw: (fn: (range: Range) => SVGElement, options: Record<string, unknown>) => void;
		annotation: Annotation;
	};
}

export interface ShowAnnotationEvent extends CustomEvent {
	detail: {
		value: string | Record<string, unknown>;
	};
}

// Type declarations for foliate-js modules
declare module '$lib/foliate-js/view.js' {
	// This module is loaded dynamically at runtime
	export {};
}

declare module '$lib/foliate-js/epubcfi.js' {
	export function fromCalibreHighlight(bookmark: CalibreBookmark): string;
	export function toEPUBCFI(range: Range): string;
	// Add other exports as needed
}

declare module '$lib/foliate-js/overlayer.js' {
	export class Overlayer {
		static highlight(range: Range): SVGElement;
		static underline(range: Range): SVGElement;
		// Add other methods as needed
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'foliate-view': FoliateView;
	}
}
