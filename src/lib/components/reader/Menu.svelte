<script lang="ts">
	interface Props {
		selectedLayout?: string;
		onlayoutChange?: (event: CustomEvent<{ value: string }>) => void;
	}

	let { selectedLayout = $bindable('paginated'), onlayoutChange }: Props = $props();

	let show = $state(false);

	function selectLayout(value: string) {
		selectedLayout = value;
		onlayoutChange?.(new CustomEvent('layout-change', { detail: { value } }));
		show = false;
	}

	function toggleMenu() {
		show = !show;
	}
</script>

<div class="relative">
	<button
		aria-label="Show settings"
		aria-haspopup="true"
		onclick={toggleMenu}
		class="rounded-md border-0 bg-transparent p-0.5 text-gray-500 hover:bg-black/10 hover:text-current"
	>
		<svg class="block fill-none stroke-current stroke-2" width="24" height="24" aria-hidden="true">
			<path
				d="M5 12.7a7 7 0 0 1 0-1.4l-1.8-2 2-3.5 2.7.5a7 7 0 0 1 1.2-.7L10 3h4l.9 2.6 1.2.7 2.7-.5 2 3.4-1.8 2a7 7 0 0 1 0 1.5l1.8 2-2 3.5-2.7-.5a7 7 0 0 1-1.2.7L14 21h-4l-.9-2.6a7 7 0 0 1-1.2-.7l-2.7.5-2-3.4 1.8-2Z"
			/>
			<circle cx="12" cy="12" r="3" />
		</svg>
	</button>
	<ul
		class="absolute right-0 m-0 cursor-default list-none rounded-md bg-[Canvas] p-1.5 text-[CanvasText] shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_0_16px_rgba(0,0,0,0.1)] {show
			? 'visible'
			: 'invisible'}"
	>
		<li class="rounded-md px-3 py-1.5">
			<strong>Layout</strong>
		</li>
		<li
			onclick={() => selectLayout('paginated')}
			class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
			aria-checked={selectedLayout === 'paginated'}
		>
			<span class="flex h-4 w-4 items-center justify-center">
				{#if selectedLayout === 'paginated'}
					<svg width="16" height="16" viewBox="0 0 16 16" class="fill-current">
						<circle cx="8" cy="8" r="3" />
					</svg>
				{/if}
			</span>
			<span>Paginated</span>
		</li>
		<li
			onclick={() => selectLayout('scrolled')}
			class="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
			aria-checked={selectedLayout === 'scrolled'}
		>
			<span class="flex h-4 w-4 items-center justify-center">
				{#if selectedLayout === 'scrolled'}
					<svg width="16" height="16" viewBox="0 0 16 16" class="fill-current">
						<circle cx="8" cy="8" r="3" />
					</svg>
				{/if}
			</span>
			<span>Scrolled</span>
		</li>
	</ul>
</div>
