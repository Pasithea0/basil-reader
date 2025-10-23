<script lang="ts">
	import { X, Upload, BookOpen } from 'lucide-svelte';

	interface Props {
		show: boolean;
		onclose: () => void;
		onfileselect: (file: File) => void;
	}

	let { show = $bindable(), onclose, onfileselect }: Props = $props();

	let fileInputElement: HTMLInputElement;

	function handleFileButtonClick() {
		fileInputElement?.click();
	}

	function handleFileInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			onfileselect(file);
			show = false;
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		const item = Array.from(e.dataTransfer?.items || []).find((item) => item.kind === 'file');
		if (item) {
			const file = item.getAsFile();
			if (file) {
				onfileselect(file);
				show = false;
			}
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			show = false;
			onclose();
		}
	}
</script>

<input
	type="file"
	bind:this={fileInputElement}
	onchange={handleFileInputChange}
	accept=".epub,.mobi,.azw,.azw3,.fb2,.cbz,.pdf"
	hidden
/>

{#if show}
	<div
		class="modal-backdrop"
		onclick={(e) => {
			if (e.target === e.currentTarget) {
				show = false;
				onclose();
			}
		}}
		onkeydown={handleKeydown}
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-label="Upload book"
	>
		<div
			class="modal-content"
			role="presentation"
			ondrop={handleDrop}
			ondragover={handleDragOver}
		>
			<button
				onclick={() => {
					show = false;
					onclose();
				}}
				class="close-button"
				aria-label="Close"
			>
				<X class="h-6 w-6" strokeWidth={2} />
			</button>

			<div class="modal-body">
				<div class="icon-container">
					<BookOpen class="h-16 w-16 text-blue-500" strokeWidth={2} />
				</div>
				<h2 class="modal-title">Add a Book</h2>
				<p class="modal-description">Drop your book file here or choose from your device</p>

				<div class="action-container">
					<button onclick={handleFileButtonClick} class="upload-button">
						<Upload class="h-5 w-5" strokeWidth={2} />
						<span>Choose File</span>
					</button>
					<p class="supported-formats">
						Supported formats: EPUB, MOBI, AZW, AZW3, FB2, CBZ, PDF
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
	}

	.modal-content {
		position: relative;
		margin: 1rem;
		width: 100%;
		max-width: 32rem;
		border-radius: 1rem;
		background-color: var(--background, white);
		padding: 2rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	}

	.close-button {
		position: absolute;
		right: 1rem;
		top: 1rem;
		padding: 0.5rem;
		border-radius: 0.5rem;
		border: none;
		background-color: transparent;
		color: #6b7280;
		cursor: pointer;
		transition: background-color 0.2s, color 0.2s;
	}

	.close-button:hover {
		background-color: rgba(0, 0, 0, 0.05);
		color: #374151;
	}

	.modal-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem 0;
		text-align: center;
	}

	.icon-container {
		padding: 1.5rem;
		border-radius: 9999px;
		background-color: rgba(59, 130, 246, 0.1);
	}

	.modal-title {
		margin-top: 1.5rem;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary, #111827);
	}

	.modal-description {
		margin-top: 0.5rem;
		color: var(--text-secondary, #6b7280);
	}

	.action-container {
		margin-top: 2rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
	}

	.upload-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		border: none;
		background-color: #3b82f6;
		color: white;
		font-weight: 600;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.upload-button:hover {
		background-color: #2563eb;
	}

	.supported-formats {
		font-size: 0.75rem;
		color: var(--text-muted, #9ca3af);
	}

	@media (prefers-color-scheme: dark) {
		.modal-content {
			background-color: var(--background, #1f2937);
		}

		.close-button:hover {
			background-color: rgba(255, 255, 255, 0.1);
			color: #d1d5db;
		}

		.icon-container {
			background-color: rgba(59, 130, 246, 0.2);
		}

		.modal-title {
			color: var(--text-primary, #f9fafb);
		}

		.modal-description {
			color: var(--text-secondary, #9ca3af);
		}
	}
</style>
