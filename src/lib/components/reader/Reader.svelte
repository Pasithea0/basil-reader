<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import DropTarget from './DropTarget.svelte';
	import HeaderBar from './HeaderBar.svelte';
	import NavBar from './NavBar.svelte';
	import SideBar from './SideBar.svelte';
	import Menu from './Menu.svelte';
	import TOCView from './TOCView.svelte';
	import { percentFormat } from '$lib/utils/format';
	import type { FoliateView } from '$lib/types/foliate';
	import { getBookById, type StoredBook } from '$lib/utils/storage';
	import { 
		extractBookMetadata, 
		applyBookStyles, 
		saveBookToLibrary,
		extractTOC,
		extractSectionFractions,
		type TOCItem,
		type ReaderStyle
	} from '$lib/utils/reader/book-loader';
	import { setupAnnotations, type AnnotationsMap, type AnnotationsByValueMap } from '$lib/utils/reader/annotations';

	interface Props {
		onTitleChange?: string;
		onback?: () => void;
		initialBook?: StoredBook;
		initialFile?: File;
	}

	// UI state
	let showDropTarget = $state(true);
	let showSideBar = $state(false);
	let showToolbars = $state(false);

	// Book metadata
	let bookTitle = $state('Untitled Book');
	let bookAuthor = $state('');
	let bookCover = $state('');
	let bookDir = $state<'ltr' | 'rtl'>('ltr');

	// Props
	let { onTitleChange = $bindable(), onback, initialBook, initialFile }: Props = $props();
	
	// Update parent with title changes
	$effect(() => {
		if (bookTitle !== 'Untitled Book') {
			onTitleChange = bookTitle;
		}
	});
	
	// Table of contents
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

	// Foliate view
	let viewContainer: HTMLElement;
	let view: FoliateView | null = null;
	let annotations: AnnotationsMap = new SvelteMap();
	let annotationsByValue: AnnotationsByValueMap = new SvelteMap();

	let viewReady = $state(false);
	let loadedFileId = $state<string | null>(null);

	onMount(async () => {
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
							return openBook(file, true); // Don't save again
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

	async function openBook(file: File | FileSystemDirectoryHandle, skipSave = false) {
		showDropTarget = false;

		// Create foliate-view element (external library component)
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

		// Handle resource loading errors
		book.transformTarget?.addEventListener(
			'data',
			((
				{ detail }: CustomEvent<{ data: Promise<unknown>; name: string }>
			) => {
				detail.data = Promise.resolve(detail.data).catch((e: Error) => {
					console.error(new Error(`Failed to load ${detail.name}`, { cause: e }));
					return '';
				});
			}) as EventListener
		);

		// Apply styles
		applyBookStyles(view, style, selectedLayout);

		// Show toolbars
		showToolbars = true;

		// Extract book metadata
		const metadata = await extractBookMetadata(view);
		bookTitle = metadata.title;
		bookAuthor = metadata.author;
		bookCover = metadata.cover;
		bookDir = metadata.dir;

		// Save to library if it's a new upload
		if (!skipSave && file instanceof File) {
			let coverBlob: Blob | undefined;
			try {
				const cover = await book.getCover?.();
				coverBlob = cover || undefined;
			} catch (e) {
				console.error('Failed to load cover for saving:', e);
			}

			const saveResult = await saveBookToLibrary(file, {
				title: bookTitle,
				author: bookAuthor,
				cover: coverBlob
			});

			if (!saveResult.success && saveResult.error) {
				alert(saveResult.error);
			}
		}

		// Setup TOC and progress tracking
		toc = extractTOC(view);
		sectionFractions = extractSectionFractions(view);

		// Load annotations
		await setupAnnotations(view, annotations, annotationsByValue);
	}

	function handleLoad({ detail }: CustomEvent<{ doc: Document }>) {
		const { doc } = detail;
		doc.addEventListener('keydown', handleKeydown);
	}

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

	function handleKeydown(event: KeyboardEvent) {
		const k = event.key;
		if (k === 'ArrowLeft' || k === 'h') {
			view?.goLeft();
		} else if (k === 'ArrowRight' || k === 'l') {
			view?.goRight();
		}
	}

	function handleLayoutChange(event: CustomEvent<{ value: string }>) {
		selectedLayout = event.detail.value;
		if (view) {
			applyBookStyles(view, style, selectedLayout);
		}
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
