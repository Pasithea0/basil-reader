<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let show = false;
	export let title = '';
	export let author = '';
	export let coverSrc = '';

	const dispatch = createEventDispatcher();

	function closeSideBar() {
		dispatch('close');
	}
</script>

<div class="dimming-overlay" class:show on:click={closeSideBar} aria-hidden="true"></div>
<div class="side-bar" class:show>
	<div class="side-bar-header">
		{#if coverSrc}
			<img src={coverSrc} alt="Book cover" class="side-bar-cover" />
		{/if}
		<div>
			<h1 class="side-bar-title">{title}</h1>
			<p class="side-bar-author">{author}</p>
		</div>
	</div>
	<div class="toc-view">
		<slot />
	</div>
</div>

<style>
	:root {
		--active-bg: rgba(0, 0, 0, 0.05);
	}
	@supports (color-scheme: light dark) {
		@media (prefers-color-scheme: dark) {
			:root {
				--active-bg: rgba(255, 255, 255, 0.1);
			}
		}
	}
	.side-bar {
		visibility: hidden;
		box-sizing: border-box;
		position: absolute;
		z-index: 2;
		top: 0;
		left: 0;
		height: 100%;
		width: 320px;
		transform: translateX(-320px);
		display: flex;
		flex-direction: column;
		background: Canvas;
		color: CanvasText;
		box-shadow:
			0 0 0 1px rgba(0, 0, 0, 0.2),
			0 0 40px rgba(0, 0, 0, 0.2);
		transition:
			visibility 0s linear 300ms,
			transform 300ms ease;
	}
	.side-bar.show {
		visibility: visible;
		transform: translateX(0);
		transition-delay: 0s;
	}
	.dimming-overlay {
		visibility: hidden;
		position: fixed;
		z-index: 2;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.2);
		opacity: 0;
		transition:
			visibility 0s linear 300ms,
			opacity 300ms ease;
	}
	.dimming-overlay.show {
		visibility: visible;
		opacity: 1;
		transition-delay: 0s;
	}
	.side-bar-header {
		padding: 1rem;
		display: flex;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		align-items: center;
	}
	.side-bar-cover {
		height: 10vh;
		min-height: 60px;
		max-height: 180px;
		border-radius: 3px;
		border: 0;
		background: lightgray;
		box-shadow:
			0 0 1px rgba(0, 0, 0, 0.1),
			0 0 16px rgba(0, 0, 0, 0.1);
		margin-inline-end: 1rem;
	}
	.side-bar-title {
		margin: 0.5rem 0;
		font-size: inherit;
	}
	.side-bar-author {
		margin: 0.5rem 0;
		font-size: small;
		color: GrayText;
	}
	.toc-view {
		padding: 0.5rem;
		overflow-y: scroll;
	}
</style>
