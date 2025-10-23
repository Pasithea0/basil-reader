<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import HeaderBar from './HeaderBar.svelte';
	import NavBar from './NavBar.svelte';
	import SideBar from './SideBar.svelte';
	import Menu from './Menu.svelte';
	import TOCView from './TOCView.svelte';
	import { percentFormat } from '$lib/utils/format';
	import { getCSS } from '$lib/utils/css';
	import {
		addBookToLibrary,
		getBookById,
		getStorageInfo,
		formatBytes,
		type StoredBook
	} from '$lib/utils/library';
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
		initialFile?: File;
	}

	let { onTitleChange = $bindable(), onback, initialBook, initialFile }: Props = $props();

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

	// Foliate view
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

	// Expose bookTitle as a prop
	$effect(() => {
		if (bookTitle !== 'Untitled Book') {
			onTitleChange = bookTitle;
		}
	});

	// Initialize foliate-js
	onMount(async () => {
		// @ts-expect-error - Runtime import from external JS library
		await import('$lib/foliate-js/view.js');
		viewReady = true;
	});

	// Load book when ready
	$effect(() => {
		if (!viewReady) return;

		if (initialFile && !loadedFileId) {
			loadFile(initialFile);
		} else if (initialBook && !initialFile) {
			loadBookFromLibrary(initialBook);
		}
	});

	// Book loading

	async function loadFile(file: File) {
		const fileId = `file-${file.name}-${file.size}`;
		if (loadedFileId === fileId) return;

		loadedFileId = fileId;
		try {
			await openBook(file, false);
		} catch (e) {
			console.error('Failed to load file:', e);
			loadedFileId = null;
			showErrorAlert('Failed to open book', e as Error);
		}
	}

	async function loadBookFromLibrary(book: StoredBook) {
		const bookId = `book-${book.id}`;
		if (loadedFileId === bookId) return;

		loadedFileId = bookId;
		try {
			const file = await getBookById(book.id);
			if (!file) {
				throw new Error('Book not found in library');
			}
			await openBook(file, true);
		} catch (e) {
			console.error('Failed to load book from library:', e);
			loadedFileId = null;
			showErrorAlert('Failed to open book', e as Error);
		}
	}

	async function openBook(file: File | FileSystemDirectoryHandle, skipSave = false) {
		// Create foliate view
		view = await createFoliateView(viewContainer, file);

		// Set up event listeners
		view.addEventListener('load', handleLoad as EventListener);
		view.addEventListener('relocate', handleRelocate as EventListener);
		setupErrorHandling(view);

		// Extract metadata
		const metadata = await extractBookMetadata(view);
		bookTitle = metadata.title;
		bookAuthor = metadata.author;
		bookDir = metadata.dir;
		toc = metadata.toc || [];

		// Set cover
		if (metadata.cover) {
			bookCover = URL.createObjectURL(metadata.cover);
		}

		// Apply styles and layout
		view.renderer.setStyles?.(getCSS(style));
		view.renderer.setAttribute('flow', selectedLayout);
		view.renderer.next();

		// Show toolbars
		showToolbars = true;

		// Save to library if new upload
		if (!skipSave && file instanceof File) {
			await saveBookToLibrary(file, metadata);
		}

		// Get section fractions for navigation
		sectionFractions = Array.from(view.getSectionFractions());

		// Load Calibre bookmarks
		await loadCalibreBookmarks(view, annotations, annotationsByValue);
	}

	async function saveBookToLibrary(
		file: File,
		metadata: { title: string; author: string; cover?: Blob }
	) {
		try {
			await addBookToLibrary(file, metadata);
		} catch (e) {
			console.error('Failed to save book to library:', e);
			const storageInfo = await getStorageInfo();
			showStorageErrorAlert(e as Error, storageInfo);
		}
	}

	// Event handlers

	function handleLoad({ detail }: CustomEvent<{ doc: Document }>) {
		detail.doc.addEventListener('keydown', handleKeydown);
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

		fraction = newFraction;

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
		view?.renderer.setAttribute('flow', selectedLayout);
		view?.renderer.setStyles?.(getCSS(style));
	}

	function handleTOCNavigate(event: CustomEvent<{ href: string }>) {
		view?.goTo(event.detail.href).catch((e: Error) => console.error(e));
		showSideBar = false;
	}

	function handleSeek(event: CustomEvent<{ fraction: number }>) {
		view?.goToFraction(event.detail.fraction);
	}

	// Error handling

	function showErrorAlert(title: string, error: Error) {
		alert(`${title}\n\n${error.message}`);
	}

	function showStorageErrorAlert(
		error: Error,
		storageInfo: { used: number; total: number; available: number; usedPercent: number }
	) {
		const message =
			`⚠️ Failed to save book to library\n\n` +
			`${error.message}\n\n` +
			`📊 Storage Status:\n` +
			`• Used: ${formatBytes(storageInfo.used)} / ${formatBytes(storageInfo.total)}\n` +
			`• Available: ${formatBytes(storageInfo.available)}\n` +
			`• Usage: ${storageInfo.usedPercent.toFixed(1)}%\n\n` +
			`💡 Tips:\n` +
			`• Remove some books from your library to free up space\n` +
			`• The book is still open and readable, just not saved\n` +
			`• You can use the back button to return to your library`;

		alert(message);
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

	<div class="h-full w-full" bind:this={viewContainer}></div>
</div>
