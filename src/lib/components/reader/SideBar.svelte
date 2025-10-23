<script lang="ts">
	interface Props {
		show?: boolean;
		title?: string;
		author?: string;
		coverSrc?: string;
		onclose?: () => void;
		children?: any;
	}

	let { show = $bindable(false), title = '', author = '', coverSrc = '', onclose, children }: Props = $props();

	function closeSideBar() {
		show = false;
		onclose?.();
	}
</script>

<!-- Dimming overlay -->
<div
	class="fixed inset-0 z-20 bg-black/20 transition-opacity duration-300 {show
		? 'visible opacity-100'
		: 'invisible opacity-0'}"
	onclick={closeSideBar}
	aria-hidden="true"
></div>

<!-- Sidebar -->
<div
	class="fixed top-0 left-0 h-full w-80 z-20 flex flex-col bg-[Canvas] text-[CanvasText] shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_0_40px_rgba(0,0,0,0.2)] transition-transform duration-300 {show
		? 'translate-x-0'
		: '-translate-x-80'}"
>
	<!-- Header with cover and metadata -->
	<div class="p-4 flex border-b border-black/10 dark:border-white/10 items-center">
		{#if coverSrc}
			<img
				src={coverSrc}
				alt="Book cover"
				class="h-[10vh] min-h-[60px] max-h-[180px] rounded-sm bg-gray-300 shadow-[0_0_1px_rgba(0,0,0,0.1),0_0_16px_rgba(0,0,0,0.1)] mr-4"
			/>
		{/if}
		<div>
			<h1 class="my-2 text-base">{title}</h1>
			<p class="my-2 text-sm text-gray-500">{author}</p>
		</div>
	</div>

	<!-- TOC container -->
	<div class="p-2 overflow-y-auto">
		{@render children?.()}
	</div>
</div>
