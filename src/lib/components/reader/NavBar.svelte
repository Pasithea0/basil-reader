<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let visible = false;
	export let fraction = 0;
	export let dir = 'ltr';
	export let title = '';
	export let sectionFractions: number[] = [];

	const dispatch = createEventDispatcher();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		dispatch('seek', { fraction: parseFloat(target.value) });
	}
</script>

<div class="toolbar nav-bar" style:visibility={visible ? 'visible' : 'hidden'}>
	<button id="left-button" aria-label="Go left" on:click={() => dispatch('go-left')}>
		<svg class="icon" width="24" height="24" aria-hidden="true">
			<path d="M 15 6 L 9 12 L 15 18" />
		</svg>
	</button>
	<input
		id="progress-slider"
		type="range"
		min="0"
		max="1"
		step="any"
		list="tick-marks"
		{dir}
		value={fraction}
		{title}
		style:visibility={visible ? 'visible' : 'hidden'}
		on:input={handleInput}
	/>
	<datalist id="tick-marks">
		{#each sectionFractions as fraction}
			<option value={fraction} />
		{/each}
	</datalist>
	<button id="right-button" aria-label="Go right" on:click={() => dispatch('go-right')}>
		<svg class="icon" width="24" height="24" aria-hidden="true">
			<path d="M 9 6 L 15 12 L 9 18" />
		</svg>
	</button>
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
	.nav-bar {
		bottom: 0;
	}
	#progress-slider {
		flex-grow: 1;
		margin: 0 12px;
	}
	.icon {
		display: block;
		fill: none;
		stroke: currentcolor;
		stroke-width: 2px;
	}
</style>
