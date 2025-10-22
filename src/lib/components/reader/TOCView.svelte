<script lang="ts">
	interface Props {
		toc?: any[];
		currentHref?: string;
		onnavigate?: (event: CustomEvent<{ href: string }>) => void;
	}

	let { toc = [], currentHref = '', onnavigate }: Props = $props();

	let expandedItems = $state(new Set<string>());

	function toggleExpand(id: string) {
		if (expandedItems.has(id)) {
			expandedItems.delete(id);
		} else {
			expandedItems.add(id);
		}
		expandedItems = new Set(expandedItems);
	}

	function handleItemClick(href: string) {
		onnavigate?.(new CustomEvent('navigate', { detail: { href } }));
	}
</script>

{#snippet tocItem(item: any, depth: number = 0, parentId: string = '')}
	{@const itemId = `${parentId}-${item.label}`}
	{@const hasSubitems = item.subitems && item.subitems.length > 0}
	{@const isExpanded = expandedItems.has(itemId)}
	{@const isCurrent = item.href === currentHref}
	{@const paddingLeft = depth * 24}

	<div class="flex items-center my-0.5" style="padding-left: {paddingLeft}px">
		{#if hasSubitems}
			<button
				onclick={() => toggleExpand(itemId)}
				class="p-0 border-0 bg-transparent cursor-pointer transition-transform duration-200 opacity-50 hover:opacity-100 w-6 h-6 flex items-center justify-center flex-shrink-0"
				aria-expanded={isExpanded}
			>
				<svg
					class="w-6 h-6 fill-current transition-transform duration-200 {isExpanded
						? ''
						: '-rotate-90'}"
					viewBox="0 0 24 24"
				>
					<path d="M 9 6 L 15 12 L 9 18" />
				</svg>
			</button>
		{:else}
			<span class="w-6 flex-shrink-0"></span>
		{/if}

		{#if item.href}
			<a
				href="#{item.href}"
				onclick={(e) => {
					e.preventDefault();
					handleItemClick(item.href);
				}}
				class="block rounded-md px-2 py-2 flex-1 no-underline text-[CanvasText] hover:bg-black/5 dark:hover:bg-white/10 {isCurrent
					? 'font-bold bg-black/5 dark:bg-white/10'
					: ''}"
				aria-current={isCurrent ? 'page' : undefined}
			>
				{item.label}
			</a>
		{:else}
			<span class="block rounded-md px-2 py-2 flex-1 text-gray-500">{item.label}</span>
		{/if}
	</div>

	{#if hasSubitems && isExpanded}
		{#each item.subitems as subitem}
			{@render tocItem(subitem, depth + 1, itemId)}
		{/each}
	{/if}
{/snippet}

<div class="list-none p-0 m-0">
	{#each toc as item}
		{@render tocItem(item, 0, 'root')}
	{/each}
</div>
