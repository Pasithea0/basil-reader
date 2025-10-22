<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		const item = Array.from(e.dataTransfer?.items || []).find((item) => item.kind === 'file');
		if (item) {
			const entry = item.webkitGetAsEntry();
			const file = entry?.isFile ? item.getAsFile() : entry;
			if (file) {
				dispatch('open', { file });
			}
		}
	}

	function handleFileButtonClick() {
		const input = document.getElementById('file-input') as HTMLInputElement;
		input?.click();
	}

	function handleFileInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			dispatch('open', { file });
		}
	}
</script>

<input type="file" id="file-input" on:change={handleFileInputChange} hidden />
<div class="drop-target filter" on:drop={handleDrop} on:dragover={handleDragOver}>
	<div>
		<svg class="icon empty-state-icon" width="72" height="72" aria-hidden="true">
			<path
				d="M36 18s-6-6-12-6-15 6-15 6v42s9-6 15-6 12 6 12 6c4-4 8-6 12-6s12 2 15 6V18c-6-4-12-6-15-6-4 0-8 2-12 6m0 0v42"
			/>
		</svg>
		<h1>Drop a book here!</h1>
		<p>Or <button id="file-button" on:click={handleFileButtonClick}>choose a file</button> to open it.</p>
	</div>
</div>

<style>
	.drop-target {
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	.drop-target h1 {
		font-weight: 900;
	}
	#file-button {
		font: inherit;
		background: none;
		border: 0;
		padding: 0;
		text-decoration: underline;
		cursor: pointer;
	}
	.icon {
		display: block;
		fill: none;
		stroke: currentcolor;
		stroke-width: 2px;
	}
	.empty-state-icon {
		margin: auto;
	}
</style>
