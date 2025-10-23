<script lang="ts">
	import { BookOpen, Trash2 } from 'lucide-svelte';
	import type { StoredBook } from '$lib/utils/library';

	interface Props {
		book: StoredBook;
		onclick?: () => void;
		onremove?: () => void;
	}

	let { book, onclick, onremove }: Props = $props();
</script>

<div class="book-item">
	<button
		class="book-cover-button"
		onclick={onclick}
		aria-label="Open {book.title}"
	>
		<div class="book-cover">
			{#if book.cover}
				<img src={book.cover} alt="{book.title} cover" class="cover-image" />
			{:else}
				<div class="cover-placeholder">
					<BookOpen class="h-12 w-12 text-gray-400" strokeWidth={2} />
				</div>
			{/if}
		</div>
	</button>

	<div class="book-info">
		<h3 class="book-title">{book.title}</h3>
		{#if book.author}
			<p class="book-author">{book.author}</p>
		{/if}
	</div>

	<button
		class="remove-button"
		onclick={(e) => {
			e.stopPropagation();
			onremove?.();
		}}
		aria-label="Remove {book.title}"
	>
		<Trash2 class="h-4 w-4" strokeWidth={2} />
	</button>
</div>

<style>
	.book-item {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.book-cover-button {
		all: unset;
		cursor: pointer;
		display: block;
	}

	.book-cover {
		position: relative;
		width: 100%;
		aspect-ratio: 2 / 3;
		border-radius: 0.5rem;
		overflow: hidden;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.book-cover-button:hover .book-cover {
		transform: translateY(-4px);
		box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.2);
	}

	.cover-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.cover-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.book-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-height: 3rem;
	}

	.book-title {
		font-size: 0.875rem;
		font-weight: 600;
		line-height: 1.25rem;
		color: var(--text-primary, #1f2937);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin: 0;
	}

	.book-author {
		font-size: 0.75rem;
		color: var(--text-secondary, #6b7280);
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin: 0;
	}

	.remove-button {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.5rem;
		background-color: rgba(255, 255, 255, 0.9);
		border: none;
		border-radius: 0.375rem;
		color: #6b7280;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.2s, background-color 0.2s, color 0.2s;
	}

	.book-item:hover .remove-button {
		opacity: 1;
	}

	.remove-button:hover {
		background-color: #ef4444;
		color: white;
	}

	@media (prefers-color-scheme: dark) {
		.book-title {
			color: var(--text-primary, #f9fafb);
		}

		.book-author {
			color: var(--text-secondary, #9ca3af);
		}

		.remove-button {
			background-color: rgba(31, 41, 55, 0.9);
			color: #9ca3af;
		}
	}
</style>
