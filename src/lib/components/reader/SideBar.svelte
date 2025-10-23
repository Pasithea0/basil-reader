<script lang="ts">
	interface Props {
		show?: boolean;
		title?: string;
		author?: string;
		coverSrc?: string;
		onclose?: () => void;
		children?: any;
	}

	let {
		show = $bindable(false),
		title = '',
		author = '',
		coverSrc = '',
		onclose,
		children
	}: Props = $props();

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
	class="fixed top-0 left-0 z-20 flex h-full w-80 flex-col bg-[Canvas] text-[CanvasText] shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_0_40px_rgba(0,0,0,0.2)] transition-transform duration-300 {show
		? 'translate-x-0'
		: '-translate-x-80'}"
>
	<!-- Header with cover and metadata -->
	<div class="flex items-center border-b border-black/10 p-4 dark:border-white/10">
		{#if coverSrc}
			<img
				src={coverSrc}
				alt="Book cover"
				class="mr-4 h-[10vh] max-h-[180px] min-h-[60px] rounded-sm bg-gray-300 shadow-[0_0_1px_rgba(0,0,0,0.1),0_0_16px_rgba(0,0,0,0.1)]"
			/>
		{/if}
		<div>
			<h1 class="my-2 text-base">{title}</h1>
			<p class="my-2 text-sm text-gray-500">{author}</p>
		</div>
	</div>

	<!-- TOC container -->
	<div class="overflow-y-auto p-2">
		{@render children?.()}
	</div>
</div>
