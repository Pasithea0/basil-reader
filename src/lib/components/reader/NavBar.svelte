<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	interface Props {
		fraction?: number;
		dir?: 'ltr' | 'rtl' | 'auto';
		title?: string;
		sectionFractions?: number[];
		currentPage?: number;
		totalPages?: number;
		ongoLeft?: () => void;
		ongoRight?: () => void;
		onseek?: (event: CustomEvent<{ fraction: number }>) => void;
		isVisible?: boolean;
		ontoggleVisibility?: () => void;
	}

	let {
		fraction = 0,
		dir = 'ltr',
		title = '',
		sectionFractions = [],
		currentPage = 0,
		totalPages = 0,
		ongoLeft,
		ongoRight,
		onseek,
		isVisible = false,
		ontoggleVisibility
	}: Props = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		onseek?.(new CustomEvent('seek', { detail: { fraction: parseFloat(target.value) } }));
	}

	function handleMouseEnter() {
		ontoggleVisibility?.();
	}

	function handleMouseLeave() {
		ontoggleVisibility?.();
	}
</script>

<div
	class="fixed z-10 flex h-26 w-full items-end justify-between p-2 transition-all duration-250 {isVisible
		? 'bottom-0'
		: '-bottom-10'}"
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
	aria-label="Toggle navigation visibility"
>
	<div class="flex w-full items-center justify-between gap-1">
		<button
			id="left-button"
			aria-label="Go left"
			onclick={() => ongoLeft?.()}
			class="shrink-0 rounded-md border-0 bg-transparent p-0.5 text-gray-500 hover:bg-black/10 hover:text-current"
		>
			<ChevronLeft class="block h-6 w-6" strokeWidth={2} />
		</button>
		<input
			id="progress-slider"
			type="range"
			min="0"
			max="1"
			step="any"
			list="tick-marks"
			{dir}
			value={fraction}
			{title}
			oninput={handleInput}
			class="mx-3 grow"
		/>
		<datalist id="tick-marks">
			{#each sectionFractions as frac, i (i)}
				<option value={frac}></option>
			{/each}
		</datalist>
		{#if totalPages > 0}
			<div class="min-w-16 shrink-0 text-center text-xs text-gray-600 dark:text-gray-400">
				{currentPage}/{totalPages}
			</div>
		{/if}
		<button
			id="right-button"
			aria-label="Go right"
			onclick={() => ongoRight?.()}
			class="shrink-0 rounded-md border-0 bg-transparent p-0.5 text-gray-500 hover:bg-black/10 hover:text-current"
		>
			<ChevronRight class="block h-6 w-6" strokeWidth={2} />
		</button>
	</div>
</div>
