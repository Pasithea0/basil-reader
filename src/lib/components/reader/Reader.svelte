<script lang="ts">
	import { onMount } from 'svelte';
	import DropTarget from './DropTarget.svelte';
	import HeaderBar from './HeaderBar.svelte';
	import NavBar from './NavBar.svelte';
	import SideBar from './SideBar.svelte';
	import Menu from './Menu.svelte';
	import TOCView from './TOCView.svelte';
	import { percentFormat } from '$lib/utils/format';
	import { getCSS } from '$lib/utils/css';
	import { getBookById, type StoredBook } from '$lib/utils/library';
	import {
		openBook,
		saveBookToLibrary,
		setupKeyboardNavigation,
		type TOCItem,
		type ReaderStyle
	} from '$lib/utils/book-loader';
	import {
		createAnnotationStore,
		loadCalibreAnnotations,
		type AnnotationStore
	} from '$lib/utils/annotations';
	import type { FoliateView } from '$lib/types/foliate';

	interface Props {
		onTitleChange?: string;
		onback?: () => void;
		initialBook?: StoredBook;
		initialFile?: File;
	}

	let { onTitleChange = $bindable(), onback, initialBook, initialFile }: Props = $props();

	// UI state
	let showDropTarget = $state(true);
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
	let style: ReaderStyle = {
		spacing: 1.4,
		justify: true,
		hyphenate: true
	};
	let selectedLayout = $state('paginated');

	// Foliate view and annotations
	let viewContainer: HTMLElement;
	let view: FoliateView | null = null;
	let annotationStore: AnnotationStore = createAnnotationStore();
	let viewReady = $state(false);
	let loadedFileId = $state<string | null>(null);

	// Expose book title to parent
	$effect(() => {
		if (bookTitle !== 'Untitled Book') {
			onTitleChange = bookTitle;
		}
	});

	// Initialize Foliate library
	onMount(async () => {
		await import('$lib/foliate-js/view.js');
		viewReady = true;
	});

	// Load book when ready
	$effect(() => {
		if (!viewReady) return;

		if (initialFile && !loadedFileId) {
			const fileId = `file-${initialFile.name}-${initialFile.size}`;
			if (loadedFileId !== fileId) {
				loadedFileId = fileId;
				loadBookFile(initialFile, false).catch((error) => {
					console.error('Failed to load initial file:', error);
					loadedFileId = null;
				});
			}
		} else if (initialBook && !initialFile) {
			const bookId = `book-${initialBook.id}`;
			if (loadedFileId !== bookId) {
				loadedFileId = bookId;
				getBookById(initialBook.id)
					.then((file) => {
						if (file) {
							return loadBookFile(file, true);
						} else {
							throw new Error('Book not found in library');
						}
					})
					.catch((error) => {
						console.error('Failed to load initial book:', error);
						loadedFileId = null;
					});
			}
		}
	});

	/**
	 * Load a book file into the reader
	 */
	async function loadBookFile(file: File | FileSystemDirectoryHandle, skipSave = false) {
		showDropTarget = false;

		// Create foliate-view element
		// eslint-disable-next-line svelte/no-dom-manipulating
		const viewElement = document.createElement('foliate-view') as unknown as FoliateView;
		view = viewElement;
		viewContainer.appendChild(viewElement);

		// Open book and get metadata
		const result = await openBook(file, view, style, selectedLayout);

		// Update UI with book metadata
		bookTitle = result.metadata.title;
		bookAuthor = result.metadata.author;
		bookCover = result.metadata.cover;
		bookDir = result.metadata.dir;
		toc = result.toc;
		sectionFractions = result.sectionFractions;

		// Set up event listeners
		view.addEventListener('load', handleLoad as EventListener);
		view.addEventListener('relocate', handleRelocate as EventListener);

		// Save to library if it's a new upload
		if (!skipSave && file instanceof File) {
			const saveResult = await saveBookToLibrary(file, {
				title: bookTitle,
				author: bookAuthor,
				cover: result.coverBlob
			});

			if (!saveResult.success && saveResult.error) {
				alert(saveResult.error);
			}
		}

		// Load annotations
		await loadCalibreAnnotations(view.book, view, annotationStore);

		// Show toolbars
		showToolbars = true;
	}

	/**
	 * Handle document load event
	 */
	function handleLoad({ detail }: CustomEvent<{ doc: Document }>) {
		const { doc } = detail;
		const keydownHandler = setupKeyboardNavigation(view!);
		doc.addEventListener('keydown', keydownHandler);
	}

	/**
	 * Handle location change event
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

		fraction = newFraction;

		const percent = percentFormat.format(newFraction);
		const loc = pageItem ? `Page ${pageItem.label}` : `Loc ${location.current}`;
		progressTitle = `${percent} · ${loc}`;

		if (tocItem?.href) {
			currentHref = tocItem.href;
		}
	}

	/**
	 * Handle keyboard navigation at window level
	 */
	function handleWindowKeydown(event: KeyboardEvent) {
		const key = event.key;
		if (key === 'ArrowLeft' || key === 'h') {
			view?.goLeft();
		} else if (key === 'ArrowRight' || key === 'l') {
			view?.goRight();
		}
	}

	/**
	 * Handle layout change
	 */
	function handleLayoutChange(event: CustomEvent<{ value: string }>) {
		selectedLayout = event.detail.value;
		view?.renderer.setAttribute('flow', selectedLayout);
		// Reapply styles after layout change
		view?.renderer.setStyles?.(getCSS(style));
	}

	/**
	 * Handle TOC navigation
	 */
	function handleTOCNavigate(event: CustomEvent<{ href: string }>) {
		view?.goTo(event.detail.href).catch((error: Error) => console.error(error));
		showSideBar = false;
	}

	/**
	 * Handle progress slider seek
	 */
	function handleSeek(event: CustomEvent<{ fraction: number }>) {
		view?.goToFraction(event.detail.fraction);
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="relative w-full h-screen">
	{#if showDropTarget}
		<DropTarget onopen={(e) => loadBookFile(e.detail.file)} />
	{/if}

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

	<div class="w-full h-full" bind:this={viewContainer}></div>
</div>
