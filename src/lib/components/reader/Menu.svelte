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
		class="p-0.5 rounded-md bg-transparent border-0 text-gray-500 hover:bg-black/10 hover:text-current"
	>
		<Settings class="block h-6 w-6" strokeWidth={2} />
	</button>
	<ul
		role="menu"
		class="absolute right-0 bg-[Canvas] text-[CanvasText] rounded-md shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_0_16px_rgba(0,0,0,0.1)] p-1.5 cursor-default list-none m-0 {show
			? 'visible'
			: 'invisible'}"
	>
		<li role="presentation" class="px-3 py-1.5 rounded-md">
			<strong>Layout</strong>
		</li>
		<li role="none">
			<button
				type="button"
				role="menuitemradio"
				aria-checked={selectedLayout === 'paginated'}
				onclick={() => selectLayout('paginated')}
				onkeydown={(e) => handleKeyDown(e, 'paginated')}
				class="w-full text-left px-3 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer flex items-center gap-2 bg-transparent border-0"
			>
				<span class="w-4 h-4 flex items-center justify-center">
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
				class="w-full text-left px-3 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer flex items-center gap-2 bg-transparent border-0"
			>
				<span class="w-4 h-4 flex items-center justify-center">
					{#if selectedLayout === 'scrolled'}
						<Circle class="h-4 w-4" fill="currentColor" strokeWidth={0} />
					{/if}
				</span>
				<span>Scrolled</span>
			</button>
		</li>
	</ul>
</div>
