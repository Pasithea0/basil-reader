<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, BookOpen, X, Upload, Trash2 } from 'lucide-svelte';
	import BookItem from './BookItem.svelte';
	import { 
		getLibrary, 
		removeBookFromLibrary, 
		getStorageInfo, 
		formatBytes,
		clearLibrary,
		type StoredBook,
		type StorageInfo 
	} from '$lib/utils/library';

	interface Props {
		onOpenBook?: (book: StoredBook) => void;
		onUploadBook?: (file: File) => void;
	}

	let { onOpenBook, onUploadBook }: Props = $props();

	let library = $state<StoredBook[]>([]);
	let storageInfo = $state<StorageInfo>({ used: 0, total: 0, available: 0, usedPercent: 0 });
	let showUploadModal = $state(false);

	async function updateLibraryData() {
		library = await getLibrary();
		storageInfo = await getStorageInfo();
	}

	onMount(() => {
		updateLibraryData();
	});

	function handleOpenBook(book: StoredBook) {
		onOpenBook?.(book);
	}

	async function handleRemoveBook(bookId: string) {
		if (confirm('Are you sure you want to remove this book from your library?')) {
			await removeBookFromLibrary(bookId);
			await updateLibraryData();
		}
	}

	async function handleClearLibrary() {
		if (library.length === 0) return;
		
		if (confirm(`Are you sure you want to remove all ${library.length} book${library.length === 1 ? '' : 's'} from your library?\n\nThis action cannot be undone.`)) {
			await clearLibrary();
			await updateLibraryData();
		}
	}

	function handleAddBookClick() {
		showUploadModal = true;
	}

	function handleFileButtonClick() {
		const input = document.getElementById('library-file-input') as HTMLInputElement;
		input?.click();
	}

	function handleFileInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			showUploadModal = false;
			onUploadBook?.(file);
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		const item = Array.from(e.dataTransfer?.items || []).find((item) => item.kind === 'file');
		if (item) {
			const file = item.getAsFile();
			if (file) {
				showUploadModal = false;
				onUploadBook?.(file);
			}
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}
</script>

<input
	type="file"
	id="library-file-input"
	onchange={handleFileInputChange}
	accept=".epub,.mobi,.azw,.azw3,.fb2,.cbz,.pdf"
	hidden
/>

<div class="relative h-screen w-full overflow-auto">
	<!-- Library header with upload button -->
	<div class="sticky top-0 z-10 bg-[Canvas] px-6 py-4 shadow-sm">
		<div class="flex items-center justify-between">
			<h1 class="text-3xl font-black text-[CanvasText]">My Library</h1>
			<div class="flex items-center gap-2">
				<button
					onclick={handleClearLibrary}
					class="rounded-md border-0 bg-transparent p-2 text-gray-500 transition-colors hover:bg-black/10 hover:text-current disabled:opacity-30 disabled:cursor-not-allowed"
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
		<div class="mt-3 flex items-center gap-3">
			<p class="text-sm text-gray-600 dark:text-gray-400">
				{library.length} {library.length === 1 ? 'book' : 'books'}
			</p>
			{#if storageInfo.total > 0}
				<div class="h-1 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
					<div
						class="h-full rounded-full transition-all {storageInfo.usedPercent > 90
							? 'bg-red-500'
							: storageInfo.usedPercent > 70
								? 'bg-yellow-500'
								: 'bg-blue-500'}"
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
					onclick={handleAddBookClick}
					onkeydown={(e) => e.key === 'Enter' && handleAddBookClick()}
				>
				<div class="relative mb-3 flex aspect-2/3 w-full flex-col items-center justify-center overflow-hidden rounded-lg border-4 border-dashed border-gray-300 bg-gray-50 shadow-lg transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-gray-700">
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
			class="absolute right-4 top-4 rounded-lg border-0 bg-transparent p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
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

				<div class="mt-8 flex flex-col gap-3 w-full">
				<button
					onclick={handleFileButtonClick}
					class="flex items-center justify-center gap-2 rounded-lg border-0 bg-blue-500 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-600"
				>
					<Upload class="h-5 w-5" strokeWidth={2} />
					<span>Choose File</span>
				</button>
					<p class="text-xs text-gray-500 dark:text-gray-500">
						Supported formats: EPUB, MOBI, AZW, AZW3, FB2, CBZ, PDF
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}

