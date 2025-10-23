<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import HeaderBar from './HeaderBar.svelte';
	import NavBar from './NavBar.svelte';
	import SideBar from './SideBar.svelte';
	import Menu from './Menu.svelte';
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

	interface Props {
		onTitleChange?: string;
		onback?: () => void;
		initialBook?: StoredBook;
	}

	// Props
	let { onTitleChange = $bindable(), onback, initialBook }: Props = $props();

	// UI State
	let showSideBar = $state(false);
	let showToolbars = $state(false);

	// Book metadata
	let bookTitle = $state('Untitled Book');
	let bookAuthor = $state('');
	let bookCover = $state('');
	let bookDir = $state<'ltr' | 'rtl'>('ltr');
	let toc: TOCItem[] = $state([]);
	let currentHref = $state('');

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

	// Initialize foliate-js view component
	onMount(async () => {
		await import('$lib/foliate-js/view.js');
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
			// Create and initialize foliate view
			view = await createFoliateView(viewContainer, file);

			// Set up event listeners
			view.addEventListener('load', handleLoad as EventListener);
			view.addEventListener('relocate', handleRelocate as EventListener);

			// Set up error handling
			setupErrorHandling(view);

			// Extract metadata
			const metadata = await extractBookMetadata(view);
			bookTitle = metadata.title;
			bookAuthor = metadata.author;
			bookDir = metadata.dir;
			toc = metadata.toc || [];

			// Set cover if available
			if (metadata.cover) {
				bookCover = URL.createObjectURL(metadata.cover);
			}

			// Apply styles
			view.renderer.setStyles?.(getCSS(style));
			view.renderer.setAttribute('flow', selectedLayout);
			view.renderer.next();

			// Show toolbars
			showToolbars = true;

			// Get section fractions for navigation
			sectionFractions = Array.from(view.getSectionFractions());

			// Load Calibre bookmarks if available
			await loadCalibreBookmarks(view, annotations, annotationsByValue);
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
		doc.addEventListener('keydown', handleKeydown);
	}

	/**
	 * Event handler for navigation/location changes
	 */
	function handleRelocate({
		detail
	}: CustomEvent<{
		fraction: number;
		location: { current: number };
		tocItem?: { href?: string };
		pageItem?: { label: string };
	}>) {
		const { fraction: newFraction, location, tocItem, pageItem } = detail;

		// Update fraction - this will update the slider position
		fraction = newFraction;

		// Update title with percentage and location
		const percent = percentFormat.format(newFraction);
		const loc = pageItem ? `Page ${pageItem.label}` : `Loc ${location.current}`;
		progressTitle = `${percent} · ${loc}`;

		if (tocItem?.href) {
			currentHref = tocItem.href;
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
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative h-screen w-full">
	<HeaderBar visible={showToolbars} ontoggleSidebar={() => (showSideBar = true)} {onback}>
		<Menu bind:selectedLayout onlayoutChange={handleLayoutChange} />
	</HeaderBar>

	<NavBar
		visible={showToolbars}
		{fraction}
		dir={bookDir}
		title={progressTitle}
		{sectionFractions}
		ongoLeft={() => view?.goLeft()}
		ongoRight={() => view?.goRight()}
		onseek={handleSeek}
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
