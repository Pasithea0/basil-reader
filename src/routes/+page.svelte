<script lang="ts">
	import Library from '$lib/components/reader/Library.svelte';
	import Reader from '$lib/components/reader/Reader.svelte';
	import type { StoredBook } from '$lib/utils/bookManager';

	let bookTitle = $state('Basil Reader');
	let currentView = $state<'library' | 'reader'>('library');
	let selectedBook = $state<StoredBook | undefined>(undefined);
	let uploadFile = $state<File | undefined>(undefined);
	
	let libraryComponent: Library | undefined = $state(undefined);

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
	}
</script>

<svelte:head>
	<title>{bookTitle}</title>
</svelte:head>

{#if currentView === 'library'}
	{#key currentView}
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
