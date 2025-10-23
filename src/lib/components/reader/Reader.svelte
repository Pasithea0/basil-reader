<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import DropTarget from './DropTarget.svelte';
	import HeaderBar from './HeaderBar.svelte';
	import NavBar from './NavBar.svelte';
	import SideBar from './SideBar.svelte';
	import Menu from './Menu.svelte';
	import TOCView from './TOCView.svelte';
	import { formatLanguageMap, formatContributor, percentFormat } from '$lib/utils/format';
	import { getCSS } from '$lib/utils/css';
	import type { FoliateView } from '$lib/types/foliate';
	import { addBookToLibrary, base64ToFile, getStorageInfo, formatBytes, type StoredBook } from '$lib/utils/library';

	interface Props {
		onTitleChange?: string;
		onback?: () => void;
		initialBook?: StoredBook;
		initialFile?: File;
	}

	let showDropTarget = $state(true);
	let showSideBar = $state(false);
	let showToolbars = $state(false);

	// Book metadata
	let bookTitle = $state('Untitled Book');
	let bookAuthor = $state('');
	let bookCover = $state('');
	let bookDir = $state<'ltr' | 'rtl'>('ltr');

	// Expose bookTitle as a prop so parent can access it
	let { onTitleChange = $bindable(), onback, initialBook, initialFile }: Props = $props();
	$effect(() => {
		// Only update title when a book is actually loaded (not the default placeholder)
		if (bookTitle !== 'Untitled Book') {
			onTitleChange = bookTitle;
		}
	});
	
	interface TOCItem {
		label: string;
		href?: string;
		subitems?: TOCItem[];
	}
	
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
	let annotations = new SvelteMap<number, Array<{ value: string; color?: string; note?: string }>>();
	let annotationsByValue = new SvelteMap<string, { value: string; color?: string; note?: string }>();

	let viewReady = $state(false);
	let loadedFileId = $state<string | null>(null);

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
				base64ToFile(
					initialBook.fileData,
					initialBook.fileName,
					initialBook.fileType
				).then((file) => {
					return openBook(file, true); // Don't save again since it's already in library
				}).catch((e) => {
					console.error('Failed to load initial book:', e);
					loadedFileId = null;
				});
			}
		}
	});

	async function openBook(file: File | FileSystemDirectoryHandle, skipSave = false) {
		console.log('openBook called with:', file);
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
		console.log('Created foliate-view element:', view);

		await view.open(file);

		// Set up event listeners
		view.addEventListener('load', handleLoad as EventListener);
		view.addEventListener('relocate', handleRelocate as EventListener);

		const { book } = view;

		// Handle transform errors
		book.transformTarget?.addEventListener('data', (({ detail }: CustomEvent<{ data: Promise<unknown>; name: string }>) => {
			detail.data = Promise.resolve(detail.data).catch((e: Error) => {
				console.error(new Error(`Failed to load ${detail.name}`, { cause: e }));
				return '';
			});
		}) as EventListener);

		// Apply styles
		view.renderer.setStyles?.(getCSS(style));
		view.renderer.setAttribute('flow', selectedLayout);
		view.renderer.next();

		// Show toolbars
		showToolbars = true;

		// Setup book metadata
		bookTitle = formatLanguageMap(book.metadata?.title) || 'Untitled Book';
		bookAuthor = book.metadata?.author ? formatContributor(book.metadata.author) : '';
		bookDir = book.dir as 'ltr' | 'rtl';

		// Get cover
		let coverBlob: Blob | undefined;
		try {
			const cover = await book.getCover?.();
			if (cover) {
				coverBlob = cover;
				bookCover = URL.createObjectURL(cover);
			}
		} catch (e) {
			console.error('Failed to load cover:', e);
		}

		// Save to library if it's a new upload
		if (!skipSave && file instanceof File) {
			try {
				await addBookToLibrary(file, {
					title: bookTitle,
					author: bookAuthor,
					cover: coverBlob
				});
				console.log('Book saved to library');
			} catch (e) {
				console.error('Failed to save book to library:', e);
				const storageInfo = getStorageInfo();
				const errorMsg = (e as Error).message;
				
				// Show a helpful error message
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
		}

		// Setup TOC
		if (book.toc) {
			toc = book.toc as TOCItem[];
		}

		// Get section fractions
		sectionFractions = Array.from(view.getSectionFractions());

		// Load Calibre bookmarks if available
		try {
			const bookmarks = await book.getCalibreBookmarks?.();
			if (bookmarks) {
				const { fromCalibreHighlight } = await import('$lib/foliate-js/epubcfi.js');
				const { Overlayer } = await import('$lib/foliate-js/overlayer.js');

				for (const obj of bookmarks) {
					if (obj.type === 'highlight') {
						const value = fromCalibreHighlight(obj) as string;
						const color = obj.style?.which;
						const note = obj.notes;
						const annotation = { value, color, note };
						const list = annotations.get(obj.spine_index);
						if (list) list.push(annotation);
						else annotations.set(obj.spine_index, [annotation]);
						annotationsByValue.set(value, annotation);
					}
				}

				view.addEventListener('create-overlay', ((e: CustomEvent<{ index: number }>) => {
					const { index } = e.detail;
					const list = annotations.get(index);
					if (list && view) {
						for (const annotation of list) {
							view.addAnnotation(annotation);
						}
					}
				}) as EventListener);

				view.addEventListener('draw-annotation', ((e: CustomEvent<{ draw: (fn: (range: Range) => SVGElement, options: Record<string, unknown>) => void; annotation: { color?: string } }>) => {
					const { draw, annotation } = e.detail;
					const { color } = annotation;
					draw(Overlayer.highlight, { color });
				}) as EventListener);

				view.addEventListener('show-annotation', ((e: CustomEvent<{ value: string }>) => {
					const annotation = annotationsByValue.get(e.detail.value);
					if (annotation?.note) alert(annotation.note);
				}) as EventListener);
			}
		} catch (e) {
			console.error('Failed to load bookmarks:', e);
		}
	}

	function handleLoad({ detail }: CustomEvent<{ doc: Document }>) {
		const { doc } = detail;
		doc.addEventListener('keydown', handleKeydown);
	}

	function handleRelocate({ detail }: CustomEvent<{ fraction: number; location: { current: number }; tocItem?: { href?: string }; pageItem?: { label: string } }>) {
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
