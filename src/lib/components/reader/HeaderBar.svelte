<script lang="ts">
	import { ChevronLeft, Menu } from 'lucide-svelte';

	interface Props {
		visible?: boolean;
		ontoggleSidebar?: () => void;
		onback?: () => void;
		children?: import('svelte').Snippet;
	}

	let { visible = false, ontoggleSidebar, onback, children }: Props = $props();
</script>

<div
	class="fixed top-0 z-10 flex h-12 w-full items-center justify-between px-1.5 transition-opacity duration-250 {visible
		? 'visible'
		: 'invisible'}"
>
	<div class="flex items-center gap-1">
		{#if onback}
			<button
				id="back-button"
				aria-label="Back to library"
				onclick={() => onback?.()}
				class="rounded-md border-0 bg-transparent p-0.5 text-gray-500 hover:bg-black/10 hover:text-current"
			>
				<ChevronLeft class="block h-6 w-6" strokeWidth={2} />
			</button>
		{/if}
		<button
			id="side-bar-button"
			aria-label="Show sidebar"
			onclick={() => ontoggleSidebar?.()}
			class="rounded-md border-0 bg-transparent p-0.5 text-gray-500 hover:bg-black/10 hover:text-current"
		>
			<Menu class="block h-6 w-6" strokeWidth={2} />
		</button>
	</div>
	<div class="relative">
		{@render children?.()}
	</div>
</div>
