<script lang="ts">
	import { onMount } from 'svelte';
	import DropTarget from './DropTarget.svelte';
	import HeaderBar from './HeaderBar.svelte';
	import NavBar from './NavBar.svelte';
	import SideBar from './SideBar.svelte';
	import Menu from './Menu.svelte';
	import TOCView from './TOCView.svelte';
	import type { FoliateView } from '$lib/types/foliate';
	import {
		addBookToLibrary,
		getBookById,
		getStorageInfo,
		formatBytes,
		type StoredBook
	} from '$lib/utils/bookManager';
	import {
		extractBookMetadata,
		setupFoliateView,
		handleRelocateEvent,
		handleKeyboardNavigation,
		extractTOC,
		getSectionFractions,
		DEFAULT_READER_STYLE,
		type TOCItem,
		type ReaderStyle
	} from '$lib/utils/readerState';
	import { loadCalibreBookmarks } from '$lib/utils/annotations';
	import { getCSS } from '$lib/utils/css';

	// Props
	interface Props {
		onTitleChange?: string;
		onback?: () => void;
		initialBook?: StoredBook;
		initialFile?: File;
	}

	let { onTitleChange = $bindable(), onback, initialBook, initialFile }: Props = $props();

	// UI State
	let showDropTarget = $state(true);
	let showSideBar = $state(false);
	let showToolbars = $state(false);

	// Book metadata
	let bookTitle = $state('Untitled Book');
	let bookAuthor = $state('');
	let bookCover = $state('');
	let bookDir = $state<'ltr' | 'rtl'>('ltr');

	// Table of Contents
	let toc: TOCItem[] = $state([]);
	let currentHref = $state('');

	// Navigation state
	let fraction = $state(0);
	let progressTitle = $state('');
	let sectionFractions: number[] = $state([]);

	// Reader settings
	let style: ReaderStyle = DEFAULT_READER_STYLE;
	let selectedLayout = $state('paginated');

	// Foliate view reference
	let viewContainer: HTMLElement;
	let view: FoliateView | null = null;

	let viewReady = $state(false);
	let loadedFileId = $state<string | null>(null);

	// Update parent component title when book is loaded
	$effect(() => {
		if (bookTitle !== 'Untitled Book') {
			onTitleChange = bookTitle;
		}
	});

	onMount(async () => {
		// Import foliate-js view component
		await import('$lib/foliate-js/view.js');
		viewReady = true;
	});

	// Watch for file/book changes and load them when ready
	$effect(() => {
		if (!viewReady) return;

		// Load initial file if provided (new upload)
		if (initialFile && !loadedFileId) {
			const fileId = `file-${initialFile.name}-${initialFile.size}`;
			if (loadedFileId !== fileId) {
				loadedFileId = fileId;
				openBook(initialFile, false).catch((e) => {
					console.error('Failed to load initial file:', e);
					loadedFileId = null;
				});
			}
		}
		// Load initial book if provided (from library)
		else if (initialBook && !initialFile) {
			const bookId = `book-${initialBook.id}`;
			if (loadedFileId !== bookId) {
				loadedFileId = bookId;
				getBookById(initialBook.id)
					.then((file) => {
						if (file) {
							return openBook(file, true); // Don't save again since it's already in library
						} else {
							throw new Error('Book not found in library');
						}
					})
					.catch((e) => {
						console.error('Failed to load initial book:', e);
						loadedFileId = null;
					});
			}
		}
	});

	/**
	 * Opens a book file in the reader
	 */
	async function openBook(file: File | FileSystemDirectoryHandle, skipSave = false) {
		showDropTarget = false;

		// Create foliate-view element
		// We need to use DOM manipulation here because foliate-view is a custom element
		// from an external library (foliate-js) that must be created imperatively.
		// Svelte can't manage this element because it's defined in vanilla JS.
		/* eslint-disable svelte/no-dom-manipulating */
		const viewElement = document.createElement('foliate-view') as unknown as FoliateView;
		view = viewElement;
		viewContainer.appendChild(viewElement);
		/* eslint-enable svelte/no-dom-manipulating */

		await view.open(file);

		// Set up event listeners
		view.addEventListener('load', handleLoad as EventListener);
		view.addEventListener('relocate', handleRelocate as EventListener);

		const { book } = view;

		// Handle transform errors
		book.transformTarget?.addEventListener(
			'data',
			(({ detail }: CustomEvent<{ data: Promise<unknown>; name: string }>) => {
				detail.data = Promise.resolve(detail.data).catch((e: Error) => {
					console.error(new Error(`Failed to load ${detail.name}`, { cause: e }));
					return '';
				});
			}) as EventListener
		);

		// Apply initial styles and layout
		setupFoliateView(view, style, selectedLayout);

		// Show toolbars
		showToolbars = true;

		// Extract and set book metadata
		const metadata = await extractBookMetadata(book);
		bookTitle = metadata.title;
		bookAuthor = metadata.author;
		bookCover = metadata.cover;
		bookDir = metadata.dir;

		// Save to library if it's a new upload
		if (!skipSave && file instanceof File) {
			await saveBookToLibrary(file, metadata);
		}

		// Setup TOC
		toc = extractTOC(book);

		// Get section fractions
		sectionFractions = getSectionFractions(view);

		// Load Calibre bookmarks if available
		await loadCalibreBookmarks(book, view);
	}

	/**
	 * Saves a book to the library with error handling
	 */
	async function saveBookToLibrary(
		file: File,
		metadata: { title: string; author: string; cover: string }
	) {
		try {
			// Convert cover URL to Blob if available
			let coverBlob: Blob | undefined;
			if (metadata.cover) {
				try {
					const response = await fetch(metadata.cover);
					coverBlob = await response.blob();
				} catch (e) {
					console.error('Failed to fetch cover blob:', e);
				}
			}

			await addBookToLibrary(file, {
				title: metadata.title,
				author: metadata.author,
				cover: coverBlob
			});
			console.log('Book saved to library');
		} catch (e) {
			console.error('Failed to save book to library:', e);
			await showStorageError(e as Error);
		}
	}

	/**
	 * Shows a helpful error message when storage fails
	 */
	async function showStorageError(error: Error) {
		const storageInfo = await getStorageInfo();
		const errorMsg = error.message;

		alert(
			`⚠️ Failed to save book to library\n\n` +
				`${errorMsg}\n\n` +
				`📊 Storage Status:\n` +
				`• Used: ${formatBytes(storageInfo.used)} / ${formatBytes(storageInfo.total)}\n` +
				`• Available: ${formatBytes(storageInfo.available)}\n` +
				`• Usage: ${storageInfo.usedPercent.toFixed(1)}%\n\n` +
				`💡 Tips:\n` +
				`• Remove some books from your library to free up space\n` +
				`• The book is still open and readable, just not saved\n` +
				`• You can use the back button to return to your library`
		);
	}

	function handleLoad({ detail }: CustomEvent<{ doc: Document }>) {
		const { doc } = detail;
		doc.addEventListener('keydown', handleKeydown);
	}

	function handleRelocate(
		event: CustomEvent<{
			fraction: number;
			location: { current: number };
			tocItem?: { href?: string };
			pageItem?: { label: string };
		}>
	) {
		const result = handleRelocateEvent(event.detail);
		fraction = result.fraction;
		progressTitle = result.progressTitle;
		if (result.currentHref) {
			currentHref = result.currentHref;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		handleKeyboardNavigation(event, view);
	}

	function handleLayoutChange(event: CustomEvent<{ value: string }>) {
		selectedLayout = event.detail.value;
		view?.renderer.setAttribute('flow', selectedLayout);
		// Reapply styles after layout change to prevent formatting issues
		view?.renderer.setStyles?.(getCSS(style));
	}

	function handleTOCNavigate(event: CustomEvent<{ href: string }>) {
		view?.goTo(event.detail.href).catch((e: Error) => console.error(e));
		showSideBar = false;
	}

	function handleSeek(event: CustomEvent<{ fraction: number }>) {
		view?.goToFraction(event.detail.fraction);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative w-full h-screen">
	{#if showDropTarget}
		<DropTarget onopen={(e) => openBook(e.detail.file)} />
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
