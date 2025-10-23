<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let visible = false;

	const dispatch = createEventDispatcher();
</script>

<div class="toolbar header-bar" style:visibility={visible ? 'visible' : 'hidden'}>
	<button
		id="side-bar-button"
		aria-label="Show sidebar"
		on:click={() => dispatch('toggle-sidebar')}
	>
		<svg class="icon" width="24" height="24" aria-hidden="true">
			<path d="M 4 6 h 16 M 4 12 h 16 M 4 18 h 16" />
		</svg>
	</button>
	<div class="menu-container">
		<slot name="menu" />
	</div>
</div>

<style>
	.toolbar {
		box-sizing: border-box;
		position: absolute;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		height: 48px;
		padding: 6px;
		transition: opacity 250ms ease;
	}
	.toolbar button {
		padding: 3px;
		border-radius: 6px;
		background: none;
		border: 0;
		color: GrayText;
	}
	.toolbar button:hover {
		background: rgba(0, 0, 0, 0.1);
		color: currentcolor;
	}
	.header-bar {
		top: 0;
	}
	.icon {
		display: block;
		fill: none;
		stroke: currentcolor;
		stroke-width: 2px;
	}
	.menu-container {
		position: relative;
	}
</style>
