<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, BookOpen, X, Upload, Trash2 } from 'lucide-svelte';
	import BookItem from './BookItem.svelte';
	import Spinner from './Spinner.svelte';
	import {
		getLibrary,
		removeBookFromLibrary,
		getStorageInfo,
		formatBytes,
		clearLibrary,
		addBookToLibrary,
		type StoredBook,
		type StorageInfo
	} from '$lib/utils/library';
	import {
		getFileFromDragEvent,
		triggerFileInput,
		getFileFromInputEvent,
		SUPPORTED_BOOK_FORMATS
	} from '$lib/utils/fileHandler';
	import { extractMetadataFromFile } from '$lib/utils/bookLoader';

	interface Props {
		onOpenBook?: (book: StoredBook) => void;
	}

	let { onOpenBook }: Props = $props();

	// State
	let library = $state<StoredBook[]>([]);
	let storageInfo = $state<StorageInfo>({ used: 0, total: 0, available: 0, usedPercent: 0 });
	let showUploadModal = $state(false);
	let isImporting = $state(false);
	let importingFileName = $state('');

	const FILE_INPUT_ID = 'library-file-input';

	/**
	 * Updates library data and storage info
	 */
	async function updateLibraryData() {
		library = await getLibrary();
		storageInfo = await getStorageInfo();
	}

	onMount(() => {
		updateLibraryData();
	});

	/**
	 * Opens a book from the library
	 */
	function handleOpenBook(book: StoredBook) {
		onOpenBook?.(book);
	}

	/**
	 * Removes a book from the library with confirmation
	 */
	async function handleRemoveBook(bookId: string) {
		if (confirm('Are you sure you want to remove this book from your library?')) {
			await removeBookFromLibrary(bookId);
			await updateLibraryData();
		}
	}

	/**
	 * Clears all books from library with confirmation
	 */
	async function handleClearLibrary() {
		if (library.length === 0) return;

		if (
			confirm(
				`Are you sure you want to remove all ${library.length} book${library.length === 1 ? '' : 's'} from your library?\n\nThis action cannot be undone.`
			)
		) {
			await clearLibrary();
			await updateLibraryData();
		}
	}

	/**
	 * Opens upload modal
	 */
	function handleAddBookClick() {
		showUploadModal = true;
	}

	/**
	 * Triggers file input click
	 */
	function handleFileButtonClick() {
		triggerFileInput(FILE_INPUT_ID);
	}

	/**
	 * Imports a book file to the library
	 */
	async function importBook(file: File) {
		isImporting = true;
		importingFileName = file.name;
		showUploadModal = false;

		try {
			// Extract metadata from the file
			const metadata = await extractMetadataFromFile(file);

			// Save to library
			await addBookToLibrary(file, metadata);

			// Refresh library
			await updateLibraryData();

			console.log('Book imported successfully:', metadata.title);
		} catch (e) {
			console.error('Failed to import book:', e);
			const errorMsg = (e as Error).message;

			// Show error message
			alert(`⚠️ Failed to import book\n\n` + `${errorMsg}\n\n`);
		} finally {
			isImporting = false;
			importingFileName = '';
		}
	}

	/**
	 * Handles file input change
	 */
	function handleFileInputChange(e: Event) {
		const file = getFileFromInputEvent(e);
		if (file) {
			importBook(file);
		}
	}

	/**
	 * Handles file drop
	 */
	function handleDrop(e: DragEvent) {
		e.preventDefault();
		const file = getFileFromDragEvent(e);
		if (file) {
			importBook(file);
		}
	}

	/**
	 * Handles drag over for drop zones
	 */
	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	/**
	 * Gets appropriate storage indicator color
	 */
	function getStorageColor(usedPercent: number): string {
		if (usedPercent > 90) return 'bg-red-500';
		if (usedPercent > 70) return 'bg-yellow-500';
		return 'bg-blue-500';
	}
</script>

<input
	type="file"
	id={FILE_INPUT_ID}
	onchange={handleFileInputChange}
	accept={SUPPORTED_BOOK_FORMATS}
	hidden
/>

<div class="relative h-screen w-full overflow-auto">
	<!-- Importing overlay -->
	{#if isImporting}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-[Canvas]/80 backdrop-blur-sm"
		>
			<Spinner size="lg" text="Importing {importingFileName}..." />
		</div>
	{/if}

	<!-- Library header -->
	<div class="sticky top-0 z-10 bg-[Canvas] px-6 py-4 shadow-sm">
		<div class="flex items-center justify-between">
			<h1 class="text-3xl font-black text-[CanvasText]">My Library</h1>
			<div class="flex items-center gap-2">
				<button
					onclick={handleClearLibrary}
					class="rounded-md border-0 bg-transparent p-2 text-gray-500 transition-colors hover:bg-black/10 hover:text-current disabled:cursor-not-allowed disabled:opacity-30"
					disabled={library.length === 0}
					aria-label="Clear all books"
				>
					<Trash2 class="h-6 w-6" strokeWidth={2} />
				</button>
				<button
					onclick={handleAddBookClick}
					class="flex items-center gap-2 rounded-lg border-0 bg-blue-500 px-4 py-2 font-semibold text-white shadow-md transition-colors hover:bg-blue-600"
					aria-label="Upload book"
				>
					<Plus class="h-5 w-5" strokeWidth={2} />
					<span>Add Book</span>
				</button>
			</div>
		</div>

		<!-- Storage info -->
		<div class="mt-3 flex items-center gap-3">
			<p class="text-sm text-gray-600 dark:text-gray-400">
				{library.length}
				{library.length === 1 ? 'book' : 'books'}
			</p>
			{#if storageInfo.total > 0}
				<div class="h-1 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
					<div
						class="h-full rounded-full transition-all {getStorageColor(storageInfo.usedPercent)}"
						style="width: {Math.min(storageInfo.usedPercent, 100)}%"
					></div>
				</div>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					{formatBytes(storageInfo.used)} / {formatBytes(storageInfo.total)}
				</p>
			{:else}
				<p class="text-sm text-gray-500 dark:text-gray-500">Loading storage info...</p>
			{/if}
		</div>
	</div>

	<!-- Book grid -->
	<div class="px-6 py-8">
		<div class="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
			{#each library as book (book.id)}
				<BookItem
					{book}
					onclick={() => handleOpenBook(book)}
					onremove={() => handleRemoveBook(book.id)}
				/>
			{/each}

			{#if library.length === 0}
				<!-- Empty state drop zone -->
				<div
					role="button"
					tabindex="0"
					class="relative cursor-pointer"
					ondrop={handleDrop}
					ondragover={handleDragOver}
					onclick={handleFileButtonClick}
					onkeydown={(e) => e.key === 'Enter' && handleFileButtonClick()}
				>
					<div
						class="relative mb-3 flex aspect-2/3 w-full flex-col items-center justify-center overflow-hidden rounded-lg border-4 border-dashed border-gray-300 bg-gray-50 shadow-lg transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-gray-700"
					>
						<BookOpen class="h-16 w-16 text-gray-400 dark:text-gray-500" strokeWidth={2} />
						<p class="mt-4 px-4 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
							Drop to upload<br />or click to select
						</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Upload Modal -->
{#if showUploadModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
		onclick={(e) => e.target === e.currentTarget && (showUploadModal = false)}
		onkeydown={(e) => e.key === 'Escape' && (showUploadModal = false)}
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-label="Upload book"
	>
		<div
			class="relative m-4 w-full max-w-lg rounded-2xl bg-[Canvas] p-8 shadow-2xl"
			role="presentation"
			ondrop={handleDrop}
			ondragover={handleDragOver}
		>
			<button
				onclick={() => (showUploadModal = false)}
				class="absolute top-4 right-4 rounded-lg border-0 bg-transparent p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
				aria-label="Close"
			>
				<X class="h-6 w-6" strokeWidth={2} />
			</button>

			<div class="flex flex-col items-center justify-center py-8 text-center">
				<div class="rounded-full bg-blue-100 p-6 dark:bg-blue-900/30">
					<BookOpen class="h-16 w-16 text-blue-500" strokeWidth={2} />
				</div>
				<h2 class="mt-6 text-2xl font-bold text-[CanvasText]">Add a Book</h2>
				<p class="mt-2 text-gray-600 dark:text-gray-400">
					Drop your book file here or choose from your device
				</p>

				<div class="mt-8 flex w-full flex-col gap-3">
					<button
						onclick={handleFileButtonClick}
						class="flex items-center justify-center gap-2 rounded-lg border-0 bg-blue-500 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-600"
					>
						<Upload class="h-5 w-5" strokeWidth={2} />
						<span>Choose File</span>
					</button>
					<p class="text-xs text-gray-500 dark:text-gray-500">
						Supported formats: EPUB, MOBI, AZW, AZW3, FB2, CBZ, (PDFs are experimental)
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}
