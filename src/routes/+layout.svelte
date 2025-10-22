<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<meta name="color-scheme" content="light dark" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<style>
	:global(html) {
		height: 100%;
	}
	:global(body) {
		margin: 0;
		height: 100%;
		font: menu;
		font-family: system-ui, sans-serif;
	}
</style>
