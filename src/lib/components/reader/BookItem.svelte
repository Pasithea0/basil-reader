<script lang="ts">
	import { BookOpen, X } from 'lucide-svelte';
	import type { StoredBook } from '$lib/utils/library';
	import { formatBytes, getBookProgress } from '$lib/utils/library';
	import { onMount } from 'svelte';

	interface Props {
		book: StoredBook;
		onclick?: () => void;
		onremove?: () => void;
	}

	let { book, onclick, onremove }: Props = $props();

	let progressText = $state<string>('');

	onMount(async () => {
		const progress = await getBookProgress(book.id);
		if (progress) {
			const percent = Math.round((progress.fraction || 0) * 100);
			const page = progress.location?.current || progress.page;
			if (page && percent > 0) {
				progressText = `pg ${page} · ${percent}%`;
			} else if (percent > 0) {
				progressText = `${percent}%`;
			}
		}
	});

	let showRemoveButton = $state(false);
</script>

<div
	role="button"
	tabindex="0"
	class="group relative cursor-pointer transition-transform duration-200 hover:scale-102"
	onmouseenter={() => (showRemoveButton = true)}
	onmouseleave={() => (showRemoveButton = false)}
>
	<button onclick={() => onclick?.()} class="w-full border-0 bg-transparent p-0 text-left">
		<div
			class="relative mb-3 aspect-2/3 w-full overflow-hidden rounded-lg bg-gray-200 shadow-xl dark:bg-gray-700"
		>
			{#if book.coverUrl}
				<img src={book.coverUrl} alt="{book.title} cover" class="h-full w-full object-cover" />
			{:else}
				<div class="flex h-full w-full items-center justify-center">
					<BookOpen class="h-1/3 w-1/3 text-gray-400" strokeWidth={2} />
				</div>
			{/if}
		</div>
		<h3 class="line-clamp-2 text-sm font-semibold text-[CanvasText]">{book.title}</h3>
		{#if book.author}
			<p class="line-clamp-1 text-xs text-gray-600 dark:text-gray-400">{book.author}</p>
		{/if}
		<div class="flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-500">
			<span>{formatBytes(book.fileSize)}</span>
			{#if progressText}
				<span class="">{progressText}</span>
			{/if}
		</div>
	</button>

	{#if showRemoveButton && onremove}
		<button
			onclick={(e) => {
				e.stopPropagation();
				onremove?.();
			}}
			class="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-md border-2 border-red-700 bg-red-800 text-red-300 opacity-80 shadow-lg transition-opacity duration-200 hover:opacity-100"
			aria-label="Remove book"
		>
			<X class="h-5 w-5" strokeWidth={2} />
		</button>
	{/if}
</div>
