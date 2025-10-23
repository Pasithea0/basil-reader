<script lang="ts">
	import Library from '$lib/components/reader/Library.svelte';
	import Reader from '$lib/components/reader/Reader.svelte';
	import { base64ToFile, type StoredBook } from '$lib/utils/library';

	let bookTitle = $state('Basil Reader');
	let currentView = $state<'library' | 'reader'>('library');
	let selectedBook = $state<StoredBook | undefined>(undefined);
	let uploadFile = $state<File | undefined>(undefined);
	let libraryKey = $state(0); // Key to force library refresh

	async function handleOpenBook(book: StoredBook) {
		selectedBook = book;
		uploadFile = undefined;
		currentView = 'reader';
		bookTitle = book.title;
	}

	async function handleUploadBook(file: File) {
		// Open the reader with the new file - it will be saved automatically
		uploadFile = file;
		selectedBook = undefined;
		currentView = 'reader';
	}

	function handleBackToLibrary() {
		currentView = 'library';
		selectedBook = undefined;
		uploadFile = undefined;
		bookTitle = 'Basil Reader';
		libraryKey++; // Force library to refresh
	}
</script>

<svelte:head>
	<title>{bookTitle}</title>
</svelte:head>

{#if currentView === 'library'}
	{#key libraryKey}
		<Library onOpenBook={handleOpenBook} onUploadBook={handleUploadBook} />
	{/key}
{:else}
	<Reader 
		bind:onTitleChange={bookTitle} 
		onback={handleBackToLibrary} 
		initialBook={selectedBook}
		initialFile={uploadFile}
	/>
{/if}
