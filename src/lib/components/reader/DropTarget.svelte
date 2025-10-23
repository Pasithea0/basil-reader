<script lang="ts">
	import { BookOpen } from 'lucide-svelte';

	interface Props {
		onopen?: (event: CustomEvent<{ file: File | FileSystemDirectoryHandle }>) => void;
	}

	let { onopen }: Props = $props();

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	async function handleDrop(e: DragEvent) {
		console.log('Drop event', e);
		e.preventDefault();
		const item = Array.from(e.dataTransfer?.items || []).find((item) => item.kind === 'file');
		console.log('Dropped item:', item);
		if (item) {
			let file: File | FileSystemDirectoryHandle | null = null;
			
			if ('getAsFileSystemHandle' in item && typeof item.getAsFileSystemHandle === 'function') {
				try {
					const handle = await item.getAsFileSystemHandle();
					file = handle as File | FileSystemDirectoryHandle;
				} catch (e) {
					console.warn('Failed to get FileSystemHandle, falling back to file:', e);
				}
			}
			
			// Fallback to getAsFile for regular files
			if (!file) {
				file = item.getAsFile();
			}
			
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
	role="region"
	aria-label="Drop zone for book files"
	class="flex h-screen items-center justify-center text-center"
	ondrop={handleDrop}
	ondragover={handleDragOver}
>
	<div>
		<BookOpen class="mx-auto block h-18 w-18" strokeWidth={2} />
		<h1 class="mt-4 text-4xl font-black">Drop a book here!</h1>
		<p class="mt-2">
			Or <button
				id="file-button"
				onclick={handleFileButtonClick}
				class="font-inherit cursor-pointer border-0 bg-transparent p-0 underline"
				>choose a file</button
			> to open it.
		</p>
	</div>
</div>
