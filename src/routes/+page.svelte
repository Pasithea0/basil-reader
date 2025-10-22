<script lang="ts">
	import Reader from '$lib/components/reader/Reader.svelte';
</script>

<svelte:head>
	<title>Basil Reader - E-Book Reader</title>
	<meta
		http-equiv="Content-Security-Policy"
		content="default-src 'self' blob:; script-src 'self'; style-src 'self' blob: 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self' blob: data: *; frame-src blob: data:; object-src blob: data:; form-action 'none';"
	/>
</svelte:head>

<Reader />
