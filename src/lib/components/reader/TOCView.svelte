<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let toc: any[] = [];
	export let currentHref = '';

	const dispatch = createEventDispatcher();

	let expandedItems = new Set<number>();

	function toggleExpand(index: number) {
		if (expandedItems.has(index)) {
			expandedItems.delete(index);
		} else {
			expandedItems.add(index);
		}
		expandedItems = expandedItems;
	}

	function handleItemClick(href: string) {
		dispatch('navigate', { href });
	}

	function renderTOCItem(item: any, index: number, depth = 0) {
		const hasSubitems = item.subitems && item.subitems.length > 0;
		const isExpanded = expandedItems.has(index);
		const isCurrent = item.href === currentHref;

		return { item, index, depth, hasSubitems, isExpanded, isCurrent };
	}
</script>

<div class="toc-container">
	{#each toc as item, i}
		{@const rendered = renderTOCItem(item, i)}
		<div class="toc-item" style="padding-left: {rendered.depth * 24}px">
			{#if rendered.hasSubitems}
				<button
					class="expand-button"
					aria-expanded={rendered.isExpanded}
					on:click={() => toggleExpand(i)}
				>
					<svg width="24" height="24" viewBox="0 0 24 24">
						<path d="M 9 6 L 15 12 L 9 18" />
					</svg>
				</button>
			{:else}
				<span class="expand-placeholder"></span>
			{/if}
			{#if item.href}
				<a
					href="#"
					aria-current={rendered.isCurrent ? 'page' : undefined}
					on:click|preventDefault={() => handleItemClick(item.href)}
				>
					{item.label}
				</a>
			{:else}
				<span class="no-link">{item.label}</span>
			{/if}
		</div>
		{#if rendered.hasSubitems && rendered.isExpanded}
			{#each item.subitems as subitem, j}
				{@const subRendered = renderTOCItem(subitem, i * 1000 + j, rendered.depth + 1)}
				<div class="toc-item" style="padding-left: {subRendered.depth * 24}px">
					{#if subRendered.hasSubitems}
						<button
							class="expand-button"
							aria-expanded={subRendered.isExpanded}
							on:click={() => toggleExpand(i * 1000 + j)}
						>
							<svg width="24" height="24" viewBox="0 0 24 24">
								<path d="M 9 6 L 15 12 L 9 18" />
							</svg>
						</button>
					{:else}
						<span class="expand-placeholder"></span>
					{/if}
					{#if subitem.href}
						<a
							href="#"
							aria-current={subRendered.isCurrent ? 'page' : undefined}
							on:click|preventDefault={() => handleItemClick(subitem.href)}
						>
							{subitem.label}
						</a>
					{:else}
						<span class="no-link">{subitem.label}</span>
					{/if}
				</div>
			{/each}
		{/if}
	{/each}
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
	.toc-container {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.toc-item {
		display: flex;
		align-items: center;
		margin: 2px 0;
	}
	.expand-button {
		background: none;
		border: 0;
		padding: 0;
		margin-inline-start: -24px;
		padding-inline-start: 5px;
		padding-inline-end: 6px;
		cursor: pointer;
		transition: transform 0.2s ease;
		opacity: 0.5;
	}
	.expand-button:hover {
		opacity: 1;
	}
	.expand-button[aria-expanded='false'] svg {
		transform: rotate(-90deg);
	}
	.expand-button svg {
		fill: CanvasText;
		stroke: none;
		width: 24px;
		height: 24px;
	}
	.expand-placeholder {
		display: inline-block;
		width: 24px;
		margin-inline-start: -24px;
	}
	.toc-item a,
	.toc-item .no-link {
		display: block;
		border-radius: 6px;
		padding: 8px;
		flex: 1;
	}
	.toc-item a {
		color: CanvasText;
		text-decoration: none;
	}
	.toc-item a:hover {
		background: var(--active-bg);
	}
	.toc-item .no-link {
		color: GrayText;
	}
	.toc-item a[aria-current] {
		font-weight: bold;
		background: var(--active-bg);
	}
</style>
