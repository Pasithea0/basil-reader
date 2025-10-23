<script lang="ts">
	import { Settings, Circle } from 'lucide-svelte';

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

	function handleKeyDown(e: KeyboardEvent, value: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			selectLayout(value);
		}
	}
</script>

<div class="relative">
	<button
		aria-label="Show settings"
		aria-haspopup="true"
		onclick={toggleMenu}
		class="rounded-md border-0 bg-transparent p-0.5 text-gray-500 hover:bg-black/10 hover:text-current"
	>
		<Settings class="block h-6 w-6" strokeWidth={2} />
	</button>
	<ul
		role="menu"
		class="absolute right-0 m-0 cursor-default list-none rounded-md bg-[Canvas] p-1.5 text-[CanvasText] shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_0_16px_rgba(0,0,0,0.1)] {show
			? 'visible'
			: 'invisible'}"
	>
		<li role="presentation" class="rounded-md px-3 py-1.5">
			<strong>Layout</strong>
		</li>
		<li role="none">
			<button
				type="button"
				role="menuitemradio"
				aria-checked={selectedLayout === 'paginated'}
				onclick={() => selectLayout('paginated')}
				onkeydown={(e) => handleKeyDown(e, 'paginated')}
				class="flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-3 py-1.5 text-left hover:bg-black/5 dark:hover:bg-white/10"
			>
				<span class="flex h-4 w-4 items-center justify-center">
					{#if selectedLayout === 'paginated'}
						<Circle class="h-4 w-4" fill="currentColor" strokeWidth={0} />
					{/if}
				</span>
				<span>Paginated</span>
			</button>
		</li>
		<li role="none">
			<button
				type="button"
				role="menuitemradio"
				aria-checked={selectedLayout === 'scrolled'}
				onclick={() => selectLayout('scrolled')}
				onkeydown={(e) => handleKeyDown(e, 'scrolled')}
				class="flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-3 py-1.5 text-left hover:bg-black/5 dark:hover:bg-white/10"
			>
				<span class="flex h-4 w-4 items-center justify-center">
					{#if selectedLayout === 'scrolled'}
						<Circle class="h-4 w-4" fill="currentColor" strokeWidth={0} />
					{/if}
				</span>
				<span>Scrolled</span>
			</button>
		</li>
	</ul>
</div>
