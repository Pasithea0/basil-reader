<script lang="ts">
	interface Props {
		visible?: boolean;
		fraction?: number;
		dir?: 'ltr' | 'rtl' | 'auto';
		title?: string;
		sectionFractions?: number[];
		ongoLeft?: () => void;
		ongoRight?: () => void;
		onseek?: (event: CustomEvent<{ fraction: number }>) => void;
	}

	let {
		visible = false,
		fraction = 0,
		dir = 'ltr',
		title = '',
		sectionFractions = [],
		ongoLeft,
		ongoRight,
		onseek
	}: Props = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		onseek?.(new CustomEvent('seek', { detail: { fraction: parseFloat(target.value) } }));
	}
</script>

<div
	class="fixed bottom-0 z-10 flex items-center justify-between w-full h-12 px-1.5 transition-opacity duration-250 {visible
		? 'visible'
		: 'invisible'}"
>
	<button
		id="left-button"
		aria-label="Go left"
		onclick={() => ongoLeft?.()}
		class="p-0.5 rounded-md bg-transparent border-0 text-gray-500 hover:bg-black/10 hover:text-current flex-shrink-0"
	>
		<svg
			class="block fill-none stroke-current stroke-2"
			width="24"
			height="24"
			aria-hidden="true"
		>
			<path d="M 15 6 L 9 12 L 15 18" />
		</svg>
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
		class="flex-grow mx-3 {visible ? 'visible' : 'invisible'}"
	/>
	<datalist id="tick-marks">
		{#each sectionFractions as frac}
			<option value={frac}></option>
		{/each}
	</datalist>
	<button
		id="right-button"
		aria-label="Go right"
		onclick={() => ongoRight?.()}
		class="p-0.5 rounded-md bg-transparent border-0 text-gray-500 hover:bg-black/10 hover:text-current flex-shrink-0"
	>
		<svg
			class="block fill-none stroke-current stroke-2"
			width="24"
			height="24"
			aria-hidden="true"
		>
			<path d="M 9 6 L 15 12 L 9 18" />
		</svg>
	</button>
</div>
