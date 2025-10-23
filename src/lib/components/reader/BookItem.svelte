<script lang="ts">
	import { BookOpen, X } from 'lucide-svelte';
	import type { StoredBook } from '$lib/utils/library';
	import { formatBytes } from '$lib/utils/library';

	interface Props {
		book: StoredBook;
		onclick?: () => void;
		onremove?: () => void;
	}

	let { book, onclick, onremove }: Props = $props();

	let showRemoveButton = $state(false);
</script>

<div
	role="button"
	tabindex="0"
	class="group relative cursor-pointer"
	onmouseenter={() => (showRemoveButton = true)}
	onmouseleave={() => (showRemoveButton = false)}
>
	<button
		onclick={() => onclick?.()}
		class="w-full border-0 bg-transparent p-0 text-left transition-transform hover:scale-105"
	>
		<div
			class="relative mb-3 aspect-2/3 w-full overflow-hidden rounded-lg bg-gray-200 shadow-lg dark:bg-gray-700"
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
		<p class="text-xs text-gray-500 dark:text-gray-500">{formatBytes(book.fileSize)}</p>
	</button>

	{#if showRemoveButton && onremove}
		<button
			onclick={(e) => {
				e.stopPropagation();
				onremove?.();
			}}
			class="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border-0 bg-red-500 text-white shadow-lg transition-opacity hover:bg-red-600"
			aria-label="Remove book"
		>
			<X class="h-5 w-5" strokeWidth={2} />
		</button>
	{/if}
</div>
