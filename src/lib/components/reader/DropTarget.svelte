<script lang="ts">
	import { BookOpen } from 'lucide-svelte';
	import {
		getFileFromDragEvent,
		validateFile,
		triggerFileInput,
		SUPPORTED_BOOK_FORMATS
	} from '$lib/utils/fileHandler';

	interface Props {
		onopen?: (event: CustomEvent<{ file: File | FileSystemDirectoryHandle }>) => void;
	}

	let { onopen }: Props = $props();

	const FILE_INPUT_ID = 'drop-target-file-input';

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		const file = validateFile(await getFileFromDragEvent(e));

		if (file) {
			onopen?.(new CustomEvent('open', { detail: { file } }));
		}
	}

	function handleFileButtonClick() {
		triggerFileInput(FILE_INPUT_ID);
	}

	function handleFileInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = validateFile(target.files?.[0] || null);

		if (file) {
			onopen?.(new CustomEvent('open', { detail: { file } }));
		}
	}
</script>

<input
	type="file"
	id={FILE_INPUT_ID}
	onchange={handleFileInputChange}
	accept={SUPPORTED_BOOK_FORMATS}
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
				class="cursor-pointer border-0 bg-transparent p-0 font-inherit underline"
				>choose a file</button
			> to open it.
		</p>
		<p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
			Supported formats: EPUB, MOBI, AZW, AZW3, FB2, CBZ
		</p>
	</div>
</div>
