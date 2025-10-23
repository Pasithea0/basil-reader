<script lang="ts">
	import { ChevronLeft, Menu } from 'lucide-svelte';
	import { Settings, Circle } from 'lucide-svelte';

	interface Props {
		ontoggleSidebar?: () => void;
		onback?: () => void;
		selectedLayout?: string;
		onlayoutChange?: (event: CustomEvent<{ value: string }>) => void;
		isVisible?: boolean;
		ontoggleVisibility?: () => void;
		oncloseAll?: () => void;
	}

	let {
		ontoggleSidebar,
		onback,
		selectedLayout = $bindable('paginated'),
		onlayoutChange,
		isVisible = false,
		ontoggleVisibility,
		oncloseAll
	}: Props = $props();

	// Reader settings
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

	function handleMouseEnter() {
		ontoggleVisibility?.();
	}

	function handleMouseLeave() {
		// Don't hide if settings menu is open
		if (!show) {
			ontoggleVisibility?.();
		}
	}
</script>

<div
	class="fixed z-10 flex h-26 w-full items-start justify-between p-2 transition-all duration-250 {isVisible ||
	show
		? 'top-0'
		: '-top-12'}"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			ontoggleVisibility?.();
		}
	}}
	role="button"
	tabindex="0"
	aria-label="Toggle header visibility"
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
	<div class="relative gap-1">
		<button
			aria-label="Show settings"
			aria-haspopup="true"
			onclick={toggleMenu}
			class="rounded-md border-0 bg-transparent p-0.5 text-gray-500 hover:bg-black/10 hover:text-current"
		>
			<Settings class="block h-6 w-6" strokeWidth={2} />
		</button>

		{#if show}
			<!-- Background overlay to close menu when clicked -->
			<div
				class="fixed inset-0 z-10"
				onclick={() => {
					show = false;
					oncloseAll?.();
				}}
				role="presentation"
			></div>

			<!-- Settings menu -->
			<ul
				role="menu"
				class="absolute top-8 right-0 z-20 m-0 cursor-default list-none rounded-md bg-[Canvas] p-1.5 text-[CanvasText] shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_0_16px_rgba(0,0,0,0.1)]"
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
		{/if}
	</div>
</div>
