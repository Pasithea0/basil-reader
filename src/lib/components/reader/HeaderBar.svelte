<script lang="ts">
	interface Props {
		visible?: boolean;
		ontoggleSidebar?: () => void;
		children?: import('svelte').Snippet;
	}

	let { visible = false, ontoggleSidebar, children }: Props = $props();
</script>

<div
	class="fixed top-0 z-10 flex h-12 w-full items-center justify-between px-1.5 transition-opacity duration-250 {visible
		? 'visible'
		: 'invisible'}"
>
	<button
		id="side-bar-button"
		aria-label="Show sidebar"
		onclick={() => ontoggleSidebar?.()}
		class="rounded-md border-0 bg-transparent p-0.5 text-gray-500 hover:bg-black/10 hover:text-current"
	>
		<svg class="block fill-none stroke-current stroke-2" width="24" height="24" aria-hidden="true">
			<path d="M 4 6 h 16 M 4 12 h 16 M 4 18 h 16" />
		</svg>
	</button>
	<div class="relative">
		{@render children?.()}
	</div>
</div>
