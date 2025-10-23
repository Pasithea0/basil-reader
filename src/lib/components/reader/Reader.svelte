<script lang="ts">
	import { onMount } from 'svelte';
	import DropTarget from './DropTarget.svelte';
	import HeaderBar from './HeaderBar.svelte';
	import NavBar from './NavBar.svelte';
	import SideBar from './SideBar.svelte';
	import Menu from './Menu.svelte';
	import TOCView from './TOCView.svelte';
	import { formatLanguageMap, formatContributor, percentFormat } from '$lib/utils/format';
	import { getCSS } from '$lib/utils/css';

	let showDropTarget = $state(true);
	let showSideBar = $state(false);
	let showToolbars = $state(false);
	let showProgressSlider = $state(false);

	// Book metadata
	let bookTitle = $state('Untitled Book');
	let bookAuthor = $state('');
	let bookCover = $state('');
	let bookDir = $state('ltr');
	let toc: any[] = $state([]);
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
	let view: any;
	let annotations = new Map();
	let annotationsByValue = new Map();

	onMount(async () => {
		// Import foliate-js view component
		await import('$lib/foliate-js/view.js');
	});

	async function openBook(file: File | any) {
		console.log('openBook called with:', file);
		showDropTarget = false;

		// Create foliate-view element
		view = document.createElement('foliate-view');
		viewContainer.appendChild(view);
		console.log('Created foliate-view element:', view);

		await view.open(file);

		// Set up event listeners
		view.addEventListener('load', handleLoad);
		view.addEventListener('relocate', handleRelocate);

		const { book } = view;

		// Handle transform errors
		book.transformTarget?.addEventListener('data', ({ detail }: any) => {
			detail.data = Promise.resolve(detail.data).catch((e: any) => {
				console.error(new Error(`Failed to load ${detail.name}`, { cause: e }));
				return '';
			});
		});

		// Apply styles
		view.renderer.setStyles?.(getCSS(style));
		view.renderer.setAttribute('flow', selectedLayout);
		view.renderer.next();

		// Show toolbars
		showToolbars = true;

		// Setup book metadata
		bookTitle = formatLanguageMap(book.metadata?.title) || 'Untitled Book';
		bookAuthor = formatContributor(book.metadata?.author);
		bookDir = book.dir;

		// Get cover
		try {
			const coverBlob = await book.getCover?.();
			if (coverBlob) {
				bookCover = URL.createObjectURL(coverBlob);
			}
		} catch (e) {
			console.error('Failed to load cover:', e);
		}

		// Setup TOC
		if (book.toc) {
			toc = book.toc;
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
						const value = fromCalibreHighlight(obj);
						const color = obj.style.which;
						const note = obj.notes;
						const annotation = { value, color, note };
						const list = annotations.get(obj.spine_index);
						if (list) list.push(annotation);
						else annotations.set(obj.spine_index, [annotation]);
						annotationsByValue.set(value, annotation);
					}
				}

				view.addEventListener('create-overlay', (e: any) => {
					const { index } = e.detail;
					const list = annotations.get(index);
					if (list) {
						for (const annotation of list) {
							view.addAnnotation(annotation);
						}
					}
				});

				view.addEventListener('draw-annotation', (e: any) => {
					const { draw, annotation } = e.detail;
					const { color } = annotation;
					draw(Overlayer.highlight, { color });
				});

				view.addEventListener('show-annotation', (e: any) => {
					const annotation = annotationsByValue.get(e.detail.value);
					if (annotation.note) alert(annotation.note);
				});
			}
		} catch (e) {
			console.error('Failed to load bookmarks:', e);
		}
	}

	function handleLoad({ detail }: any) {
		const { doc } = detail;
		doc.addEventListener('keydown', handleKeydown);
	}

	function handleRelocate({ detail }: any) {
		const { fraction: newFraction, location, tocItem, pageItem } = detail;
		fraction = newFraction;

		const percent = percentFormat.format(fraction);
		const loc = pageItem ? `Page ${pageItem.label}` : `Loc ${location.current}`;
		progressTitle = `${percent} · ${loc}`;

		showProgressSlider = true;

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

	function handleLayoutChange(event: CustomEvent) {
		selectedLayout = event.detail.value;
		view?.renderer.setAttribute('flow', selectedLayout);
	}

	function handleTOCNavigate(event: CustomEvent) {
		view?.goTo(event.detail.href).catch((e: any) => console.error(e));
		showSideBar = false;
	}

	function handleSeek(event: CustomEvent) {
		view?.goToFraction(event.detail.fraction);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative w-full h-screen">
	{#if showDropTarget}
		<DropTarget onopen={(e) => openBook(e.detail.file)} />
	{/if}

	<HeaderBar visible={showToolbars} ontoggleSidebar={() => (showSideBar = true)}>
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
