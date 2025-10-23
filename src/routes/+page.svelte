<script lang="ts">
	import Library from '$lib/components/reader/Library.svelte';
	import Reader from '$lib/components/reader/Reader.svelte';
	import type { StoredBook } from '$lib/utils/library';

	let bookTitle = $state('Basil Reader');
	let currentView = $state<'library' | 'reader'>('library');
	let selectedBook = $state<StoredBook | undefined>(undefined);

	function handleOpenBook(book: StoredBook) {
		selectedBook = book;
		currentView = 'reader';
		bookTitle = book.title;
	}

	function handleBackToLibrary() {
		currentView = 'library';
		selectedBook = undefined;
		bookTitle = 'Basil Reader';
	}
</script>

<svelte:head>
	<title>{bookTitle}</title>
</svelte:head>

{#if currentView === 'library'}
	{#key currentView}
		<Library onOpenBook={handleOpenBook} />
	{/key}
{:else}
	<Reader bind:onTitleChange={bookTitle} onback={handleBackToLibrary} initialBook={selectedBook} />
{/if}
