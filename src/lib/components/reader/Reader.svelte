<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import HeaderBar from './HeaderBar.svelte';
	import NavBar from './NavBar.svelte';
	import SideBar from './SideBar.svelte';
	import TOCView from './TOCView.svelte';
	import Spinner from './Spinner.svelte';
	import { percentFormat } from '$lib/utils/format';
	import { getCSS } from '$lib/utils/css';
import { getBookById, type StoredBook } from '$lib/utils/library';
	import {
		createFoliateView,
		extractBookMetadata,
		setupErrorHandling,
		loadCalibreBookmarks,
		type TOCItem
	} from '$lib/utils/bookLoader';
    import type { FoliateView } from '$lib/types/foliate';
    import { getBookProgress, saveBookProgress } from '$lib/utils/library';

	interface Props {
		onTitleChange?: string;
		onback?: () => void;
		initialBook?: StoredBook;
	}

	// Props
	let { onTitleChange = $bindable(), onback, initialBook }: Props = $props();

	// UI State
	let showSideBar = $state(false);
	let showHeader = $state(false);
	let showNavBar = $state(false);

	// Book metadata
	let bookTitle = $state('Untitled Book');
	let bookAuthor = $state('');
	let bookCover = $state('');
	let bookDir = $state<'ltr' | 'rtl'>('ltr');
	let toc: TOCItem[] = $state([]);
	let currentHref = $state('');
	let currentPage = $state(0);
	let totalPages = $state(0);

	// Navigation state
	let fraction = $state(0);
	let progressTitle = $state('');
	let sectionFractions: number[] = $state([]);

	// Reader settings
	let style = {
		spacing: 1.4,
		justify: true,
		hyphenate: true
	};
	let selectedLayout = $state('paginated');

	// Foliate view reference
	let viewContainer: HTMLElement;
    let view: FoliateView | null = null;
    let currentDoc: Document | null = null;
	let annotations = new SvelteMap<
		number,
		Array<{ value: string; color?: string; note?: string }>
	>();
	let annotationsByValue = new SvelteMap<
		string,
		{ value: string; color?: string; note?: string }
	>();

	// Loading state
	let viewReady = $state(false);
	let loadedFileId = $state<string | null>(null);
	let isLoadingBook = $state(false);

	// Expose bookTitle as a prop so parent can access it
	$effect(() => {
		if (bookTitle !== 'Untitled Book') {
			onTitleChange = bookTitle;
		}
	});

    // Initialize foliate-js view component (view.js is imported globally in +layout)
    onMount(() => {
        viewReady = true;
    });

	// Watch for book changes and load them when ready
	$effect(() => {
		if (!viewReady) return;

		// Load initial book if provided (from library)
		if (initialBook) {
			const bookId = `book-${initialBook.id}`;
			if (loadedFileId !== bookId) {
				loadedFileId = bookId;
				isLoadingBook = true;
				getBookById(initialBook.id)
					.then((file) => {
						if (file) {
							return openBook(file);
						} else {
							throw new Error('Book not found in library');
						}
					})
					.catch((e) => {
						console.error('Failed to load book:', e);
						loadedFileId = null;
					})
					.finally(() => {
						isLoadingBook = false;
					});
			}
		}
	});

	/**
	 * Opens and initializes a book for reading
	 */
    async function openBook(file: File | FileSystemDirectoryHandle) {
		console.log('Opening book:', file);

		try {
            // Clean up any existing view before creating a new one
            if (view) {
                cleanupView();
            }

			// Create and initialize foliate view
			view = await createFoliateView(viewContainer, file);

			// Set up event listeners
			view.addEventListener('load', handleLoad as EventListener);
			view.addEventListener('relocate', handleRelocate as EventListener);

            // Set up error handling
            const removeErrorHandler = setupErrorHandling(view);

			// Extract metadata
			const metadata = await extractBookMetadata(view);
			bookTitle = metadata.title;
			bookAuthor = metadata.author;
			bookDir = metadata.dir;
			toc = metadata.toc || [];

            // Set cover if available (revoke previous before replacing)
            if (metadata.cover) {
                if (bookCover) {
                    try { URL.revokeObjectURL(bookCover); } catch {}
                }
                bookCover = URL.createObjectURL(metadata.cover);
            }

			// Apply styles
            view.renderer.setStyles?.(getCSS(style));
            view.renderer.setAttribute('flow', selectedLayout);

            // Get section fractions for navigation
            sectionFractions = Array.from(view.getSectionFractions());

            // Attempt to restore previous reading position
            if (initialBook) {
                try {
                    const progress = await getBookProgress(initialBook.id);
                    if (progress) {
                        if (progress.cfi) {
                            await view.goTo(progress.cfi).catch((e: Error) => console.error(e));
                        } else if (progress.href) {
                            await view.goTo(progress.href).catch((e: Error) => console.error(e));
                        } else if (typeof progress.fraction === 'number') {
                            const f = Math.min(1, Math.max(0, progress.fraction));
                            view.goToFraction(f);
                        } else if (
                            typeof progress.page === 'number' &&
                            typeof progress.totalPages === 'number' &&
                            progress.totalPages > 0
                        ) {
                            const f = Math.min(1, Math.max(0, (progress.page - 1) / progress.totalPages));
                            view.goToFraction(f);
                        }
                    }
                } catch (e) {
                    console.error('Failed to restore reading position:', e);
                }
            }

			// Load Calibre bookmarks if available
            const removeBookmarkHandlers = await loadCalibreBookmarks(view, annotations, annotationsByValue);
            // Ensure these are removed on cleanup
            teardownCallbacks.push(() => {
                try { removeErrorHandler(); } catch {}
                try { removeBookmarkHandlers(); } catch {}
            });
		} catch (e) {
			console.error('Failed to open book:', e);
			throw e;
		}
	}

	/**
	 * Event handler for when a book document loads
	 */
	function handleLoad({ detail }: CustomEvent<{ doc: Document }>) {
        const { doc } = detail;
        currentDoc = doc;
        doc.addEventListener('keydown', handleKeydown);
	}

	/**
	 * Event handler for navigation/location changes
	 */
    function handleRelocate({
		detail
	}: CustomEvent<{
		range: Range;
		fraction: number;
		location: { current: number; total?: number };
		tocItem?: { href?: string };
		pageItem?: { label: string };
        cfi?: string;
	}>) {
        const { range, cfi, fraction: newFraction, location, tocItem, pageItem } = detail;

		// Update fraction - this will update the slider position
		fraction = newFraction;
		currentPage = location?.current ?? 0;
		totalPages = location?.total ?? totalPages;

		// Update title with percentage and location
		const percent = percentFormat.format(newFraction);
		const loc = pageItem
			? `Page ${pageItem.label}${totalPages ? ` of ${totalPages}` : ''}`
			: `Loc ${currentPage}${totalPages ? ` of ${totalPages}` : ''}`;
		progressTitle = `${percent} · ${loc}`;

        if (tocItem?.href) {
            currentHref = tocItem.href;
        }

		// Persist progress for this book
        if (initialBook) {
            // Save minimally on each relocate; storage util deduplicates unchanged state
            void saveBookProgress(initialBook.id, {
                page: currentPage || undefined,
                totalPages: totalPages || undefined,
                fraction: newFraction,
                href: currentHref || undefined,
                cfi,
                updatedAt: Date.now()
            });
        }
	}

	/**
	 * Handles keyboard navigation
	 */
	function handleKeydown(event: KeyboardEvent) {
		const k = event.key;
		if (k === 'ArrowLeft' || k === 'h') {
			view?.goLeft();
		} else if (k === 'ArrowRight' || k === 'l') {
			view?.goRight();
		}
	}

    // Cleanup when component is destroyed
    const teardownCallbacks: Array<() => void> = [];

    onDestroy(() => {
        try {
            cleanupView();
        } catch {}
        // Run any additional teardown callbacks
        for (const cb of teardownCallbacks.splice(0)) {
            try { cb(); } catch {}
        }
        if (bookCover) {
            try { URL.revokeObjectURL(bookCover); } catch {}
        }
    });

    /**
     * Cleans up the foliate view and unloads the book sections to avoid renderer errors
     */
    function cleanupView() {
        if (!view) return;
        // Save last-known progress before tearing down
        try {
            if (initialBook) {
                void saveBookProgress(initialBook.id, {
                    page: currentPage || undefined,
                    totalPages: totalPages || undefined,
                    fraction: typeof fraction === 'number' ? fraction : undefined,
                    href: currentHref || undefined,
                    updatedAt: Date.now()
                });
            }
        } catch {}
        try {
            view.removeEventListener('load', handleLoad as EventListener);
        } catch {}
        try {
            view.removeEventListener('relocate', handleRelocate as EventListener);
        } catch {}
        try {
            currentDoc?.removeEventListener('keydown', handleKeydown);
            currentDoc = null;
        } catch {}
        try {
            view.close?.();
        } catch {}
        try {
            view.remove();
        } catch {}
        view = null;
    }

	/**
	 * Handles layout changes (paginated vs scrolled)
	 */
	function handleLayoutChange(event: CustomEvent<{ value: string }>) {
		selectedLayout = event.detail.value;
		view?.renderer.setAttribute('flow', selectedLayout);
		// Reapply styles after layout change to prevent formatting issues
		view?.renderer.setStyles?.(getCSS(style));
	}

	/**
	 * Handles TOC navigation
	 */
	function handleTOCNavigate(event: CustomEvent<{ href: string }>) {
		view?.goTo(event.detail.href).catch((e: Error) => console.error(e));
		showSideBar = false;
	}

	/**
	 * Handles seek/slider navigation
	 */
	function handleSeek(event: CustomEvent<{ fraction: number }>) {
		view?.goToFraction(event.detail.fraction);
	}

	/**
	 * Toggle header visibility
	 */
	function toggleHeaderVisibility() {
		showHeader = !showHeader;
	}

	/**
	 * Toggle navbar visibility
	 */
	function toggleNavBarVisibility() {
		showNavBar = !showNavBar;
	}

	/**
	 * Close all UI elements (called when clicking overlay)
	 */
	function closeAllUI() {
		showHeader = false;
		showNavBar = false;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="reader-container relative h-screen w-full touch-none overflow-hidden">
	<HeaderBar
		bind:selectedLayout
		onlayoutChange={handleLayoutChange}
		ontoggleSidebar={() => (showSideBar = true)}
		{onback}
		isVisible={showHeader}
		ontoggleVisibility={toggleHeaderVisibility}
		oncloseAll={closeAllUI}
	></HeaderBar>

	<NavBar
		{fraction}
		dir={bookDir}
		title={progressTitle}
		{sectionFractions}
		ongoLeft={() => view?.goLeft()}
		ongoRight={() => view?.goRight()}
		onseek={handleSeek}
		isVisible={showNavBar}
		ontoggleVisibility={toggleNavBarVisibility}
	/>

	<SideBar bind:show={showSideBar} title={bookTitle} author={bookAuthor} coverSrc={bookCover}>
		<TOCView {toc} {currentHref} onnavigate={handleTOCNavigate} />
	</SideBar>

	<!-- Loading overlay -->
	{#if isLoadingBook}
		<div
			class="absolute inset-0 z-50 flex items-center justify-center bg-[Canvas]/80 backdrop-blur-sm"
		>
			<Spinner size="lg" text="Loading book..." />
		</div>
	{/if}

	<div class="h-full w-full" bind:this={viewContainer}></div>
</div>

<!-- <style>
	:global(.reader-container) {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		touch-action: none;
		-webkit-overflow-scrolling: touch;
	}
</style> -->
