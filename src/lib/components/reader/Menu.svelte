<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let show = false;
	export let selectedLayout = 'paginated';

	const dispatch = createEventDispatcher();

	function selectLayout(value: string) {
		selectedLayout = value;
		dispatch('layout-change', { value });
		show = false;
	}

	function toggleMenu() {
		show = !show;
	}
</script>

<div class="menu-container">
	<button aria-label="Show settings" aria-haspopup="true" on:click={toggleMenu}>
		<svg class="icon" width="24" height="24" aria-hidden="true">
			<path
				d="M5 12.7a7 7 0 0 1 0-1.4l-1.8-2 2-3.5 2.7.5a7 7 0 0 1 1.2-.7L10 3h4l.9 2.6 1.2.7 2.7-.5 2 3.4-1.8 2a7 7 0 0 1 0 1.5l1.8 2-2 3.5-2.7-.5a7 7 0 0 1-1.2.7L14 21h-4l-.9-2.6a7 7 0 0 1-1.2-.7l-2.7.5-2-3.4 1.8-2Z"
			/>
			<circle cx="12" cy="12" r="3" />
		</svg>
	</button>
	<ul class="menu" class:show>
		<li>
			<strong>Layout</strong>
		</li>
		<li
			aria-checked={selectedLayout === 'paginated'}
			on:click={() => selectLayout('paginated')}
		>
			Paginated
		</li>
		<li
			aria-checked={selectedLayout === 'scrolled'}
			on:click={() => selectLayout('scrolled')}
		>
			Scrolled
		</li>
	</ul>
</div>

<style>
	.menu-container {
		position: relative;
	}
	.menu,
	.menu ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.menu {
		visibility: hidden;
		position: absolute;
		right: 0;
		background: Canvas;
		color: CanvasText;
		border-radius: 6px;
		box-shadow:
			0 0 0 1px rgba(0, 0, 0, 0.2),
			0 0 16px rgba(0, 0, 0, 0.1);
		padding: 6px;
		cursor: default;
	}
	.menu.show {
		visibility: visible;
	}
	.menu li {
		padding: 6px 12px;
		padding-left: 24px;
		border-radius: 6px;
	}
	.menu li:hover {
		background: var(--active-bg);
	}
	.menu li[aria-checked='true'] {
		background-position: center left;
		background-repeat: no-repeat;
		background-image: url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%223%22%2F%3E%3C%2Fsvg%3E');
	}
	button {
		padding: 3px;
		border-radius: 6px;
		background: none;
		border: 0;
		color: GrayText;
	}
	button:hover {
		background: rgba(0, 0, 0, 0.1);
		color: currentcolor;
	}
	.icon {
		display: block;
		fill: none;
		stroke: currentcolor;
		stroke-width: 2px;
	}
</style>
