<script lang="ts">
	interface Props {
		visible?: boolean;
		ontoggleSidebar?: () => void;
		children?: any;
	}

	let { visible = false, ontoggleSidebar, children }: Props = $props();
</script>

<div
	class="fixed top-0 z-10 flex items-center justify-between w-full h-12 px-1.5 transition-opacity duration-250 {visible
		? 'visible'
		: 'invisible'}"
>
	<button
		id="side-bar-button"
		aria-label="Show sidebar"
		onclick={() => ontoggleSidebar?.()}
		class="p-0.5 rounded-md bg-transparent border-0 text-gray-500 hover:bg-black/10 hover:text-current"
	>
		<svg
			class="block fill-none stroke-current stroke-2"
			width="24"
			height="24"
			aria-hidden="true"
		>
			<path d="M 4 6 h 16 M 4 12 h 16 M 4 18 h 16" />
		</svg>
	</button>
	<div class="relative">
		{@render children?.()}
	</div>
</div>
