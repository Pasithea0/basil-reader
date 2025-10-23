<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Trash2 } from 'lucide-svelte';
	import BookItem from './BookItem.svelte';
	import UploadModal from './UploadModal.svelte';
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

	/**
	 * Update library data from IndexedDB
	 */
	async function updateLibraryData() {
		library = await getLibrary();
		storageInfo = await getStorageInfo();
	}

	onMount(() => {
		updateLibraryData();
	});

	/**
	 * Handle opening a book from the library
	 */
	function handleOpenBook(book: StoredBook) {
		onOpenBook?.(book);
	}

	/**
	 * Handle removing a book from the library
	 */
	async function handleRemoveBook(bookId: string) {
		if (confirm('Are you sure you want to remove this book from your library?')) {
			await removeBookFromLibrary(bookId);
			await updateLibraryData();
		}
	}

	/**
	 * Handle clearing the entire library
	 */
	async function handleClearLibrary() {
		if (library.length === 0) return;

		const confirmMessage =
			`Are you sure you want to remove all ${library.length} book${library.length === 1 ? '' : 's'} from your library?\n\n` +
			`This action cannot be undone.`;

		if (confirm(confirmMessage)) {
			await clearLibrary();
			await updateLibraryData();
		}
	}

	/**
	 * Handle file upload
	 */
	function handleFileUpload(file: File) {
		showUploadModal = false;
		onUploadBook?.(file);
	}

	/**
	 * Get storage bar color based on usage
	 */
	function getStorageBarColor(percent: number): string {
		if (percent > 90) return 'bg-red-500';
		if (percent > 70) return 'bg-yellow-500';
		return 'bg-blue-500';
	}
</script>

<div class="library-container">
	<!-- Library header -->
	<div class="library-header">
		<div class="header-row">
			<h1 class="library-title">My Library</h1>
			<div class="header-actions">
				<button
					onclick={handleClearLibrary}
					class="clear-button"
					disabled={library.length === 0}
					aria-label="Clear all books"
				>
					<Trash2 class="h-6 w-6" strokeWidth={2} />
				</button>
				<button
					onclick={() => (showUploadModal = true)}
					class="add-button"
					aria-label="Upload book"
				>
					<Plus class="h-5 w-5" strokeWidth={2} />
					<span>Add Book</span>
				</button>
			</div>
		</div>

		<!-- Storage info -->
		<div class="storage-info">
			<p class="book-count">
				{library.length}
				{library.length === 1 ? 'book' : 'books'}
			</p>
			{#if storageInfo.total > 0}
				<div class="storage-bar">
					<div
						class="storage-bar-fill {getStorageBarColor(storageInfo.usedPercent)}"
						style="width: {Math.min(storageInfo.usedPercent, 100)}%"
					></div>
				</div>
				<p class="storage-text">
					{formatBytes(storageInfo.used)} / {formatBytes(storageInfo.total)}
				</p>
			{:else}
				<p class="storage-loading">Loading storage info...</p>
			{/if}
		</div>
	</div>

	<!-- Book grid -->
	<div class="library-content">
		<div class="book-grid">
			{#each library as book (book.id)}
				<BookItem
					{book}
					onclick={() => handleOpenBook(book)}
					onremove={() => handleRemoveBook(book.id)}
				/>
			{/each}

			{#if library.length === 0}
				<div class="empty-state">
					<p class="empty-message">No books in your library yet</p>
					<button onclick={() => (showUploadModal = true)} class="empty-add-button">
						<Plus class="h-5 w-5" strokeWidth={2} />
						<span>Add Your First Book</span>
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<UploadModal
	bind:show={showUploadModal}
	onclose={() => (showUploadModal = false)}
	onfileselect={handleFileUpload}
/>

<style>
	.library-container {
		position: relative;
		width: 100%;
		height: 100vh;
		overflow: auto;
	}

	.library-header {
		position: sticky;
		top: 0;
		z-index: 10;
		background-color: var(--background, white);
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	.header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.library-title {
		font-size: 1.875rem;
		font-weight: 900;
		color: var(--text-primary, #111827);
		margin: 0;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.clear-button {
		padding: 0.5rem;
		border-radius: 0.375rem;
		border: none;
		background-color: transparent;
		color: #6b7280;
		cursor: pointer;
		transition: background-color 0.2s, color 0.2s;
	}

	.clear-button:hover:not(:disabled) {
		background-color: rgba(0, 0, 0, 0.1);
		color: currentColor;
	}

	.clear-button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.add-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		border: none;
		background-color: #3b82f6;
		color: white;
		font-weight: 600;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.add-button:hover {
		background-color: #2563eb;
	}

	.storage-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.book-count {
		font-size: 0.875rem;
		color: var(--text-secondary, #6b7280);
		margin: 0;
	}

	.storage-bar {
		flex: 1;
		height: 0.25rem;
		border-radius: 9999px;
		background-color: rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.storage-bar-fill {
		height: 100%;
		border-radius: 9999px;
		transition: width 0.3s ease;
	}

	.storage-text {
		font-size: 0.875rem;
		color: var(--text-secondary, #6b7280);
		margin: 0;
	}

	.storage-loading {
		font-size: 0.875rem;
		color: var(--text-muted, #9ca3af);
		margin: 0;
	}

	.library-content {
		padding: 2rem 1.5rem;
	}

	.book-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	@media (min-width: 640px) {
		.book-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (min-width: 768px) {
		.book-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.book-grid {
			grid-template-columns: repeat(5, 1fr);
		}
	}

	@media (min-width: 1280px) {
		.book-grid {
			grid-template-columns: repeat(6, 1fr);
		}
	}

	.empty-state {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-message {
		font-size: 1.125rem;
		color: var(--text-secondary, #6b7280);
		margin: 0 0 1.5rem 0;
	}

	.empty-add-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		border: none;
		background-color: #3b82f6;
		color: white;
		font-weight: 600;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.empty-add-button:hover {
		background-color: #2563eb;
	}

	@media (prefers-color-scheme: dark) {
		.library-header {
			background-color: var(--background, #111827);
		}

		.library-title {
			color: var(--text-primary, #f9fafb);
		}

		.clear-button {
			color: #9ca3af;
		}

		.clear-button:hover:not(:disabled) {
			background-color: rgba(255, 255, 255, 0.1);
		}

		.storage-bar {
			background-color: rgba(255, 255, 255, 0.1);
		}

		.book-count,
		.storage-text {
			color: var(--text-secondary, #9ca3af);
		}

		.storage-loading {
			color: var(--text-muted, #6b7280);
		}

		.empty-message {
			color: var(--text-secondary, #9ca3af);
		}
	}
</style>
