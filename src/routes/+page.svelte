<script lang="ts">
	import Reader from '$lib/components/reader/Reader.svelte';

	let bookTitle = $state('Basil Reader');
</script>

<svelte:head>
	<title>{bookTitle}</title>
</svelte:head>

<Reader bind:onTitleChange={bookTitle} />
