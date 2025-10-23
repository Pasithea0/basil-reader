<script lang="ts">
	interface Props {
		onopen?: (event: CustomEvent<{ file: File }>) => void;
	}

	let { onopen }: Props = $props();

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	function handleDrop(e: DragEvent) {
		console.log('Drop event', e);
		e.preventDefault();
		const item = Array.from(e.dataTransfer?.items || []).find((item) => item.kind === 'file');
		console.log('Dropped item:', item);
		if (item) {
			const entry = item.webkitGetAsEntry();
			const file = entry?.isFile ? item.getAsFile() : entry;
			console.log('File to open:', file);
			if (file) {
				onopen?.(new CustomEvent('open', { detail: { file } }));
			}
		}
	}

	function handleFileButtonClick() {
		console.log('File button clicked');
		const input = document.getElementById('file-input') as HTMLInputElement;
		console.log('Input element:', input);
		input?.click();
	}

	function handleFileInputChange(e: Event) {
		console.log('File input changed', e);
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		console.log('Selected file:', file);
		if (file) {
			onopen?.(new CustomEvent('open', { detail: { file } }));
		}
	}
</script>

<input
	type="file"
	id="file-input"
	onchange={handleFileInputChange}
	accept=".epub,.mobi,.azw,.azw3,.fb2,.cbz,.pdf"
	hidden
/>
<div
	class="h-screen flex items-center justify-center text-center"
	ondrop={handleDrop}
	ondragover={handleDragOver}
>
	<div>
		<svg
			class="block fill-none stroke-current stroke-2 mx-auto"
			width="72"
			height="72"
			aria-hidden="true"
		>
			<path
				d="M36 18s-6-6-12-6-15 6-15 6v42s9-6 15-6 12 6 12 6c4-4 8-6 12-6s12 2 15 6V18c-6-4-12-6-15-6-4 0-8 2-12 6m0 0v42"
			/>
		</svg>
		<h1 class="font-black text-4xl mt-4">Drop a book here!</h1>
		<p class="mt-2">
			Or <button
				id="file-button"
				onclick={handleFileButtonClick}
				class="font-inherit bg-transparent border-0 p-0 underline cursor-pointer"
				>choose a file</button
			> to open it.
		</p>
	</div>
</div>
