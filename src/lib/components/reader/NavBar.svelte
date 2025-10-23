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

	// Track if user is currently dragging slider
	let isDragging = $state(false);
	let localFraction = $state(fraction);

	// Update local fraction when prop changes (but not while dragging)
	$effect(() => {
		if (!isDragging) {
			localFraction = fraction;
		}
	});

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		localFraction = parseFloat(target.value);
	}

	function handleChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const newFraction = parseFloat(target.value);
		isDragging = false;
		onseek?.(new CustomEvent('seek', { detail: { fraction: newFraction } }));
	}

	function handleMouseDown() {
		isDragging = true;
	}

	function handleMouseUp() {
		isDragging = false;
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
	<div class="flex-grow mx-3 relative">
		<input
			id="progress-slider"
			type="range"
			min="0"
			max="1"
			step="0.001"
			list="tick-marks"
			{dir}
			value={localFraction}
			{title}
			oninput={handleInput}
			onchange={handleChange}
			onmousedown={handleMouseDown}
			onmouseup={handleMouseUp}
			ontouchstart={handleMouseDown}
			ontouchend={handleMouseUp}
			class="w-full {visible ? 'visible' : 'invisible'}"
		/>
		<datalist id="tick-marks">
			{#each sectionFractions as frac}
				<option value={frac}></option>
			{/each}
		</datalist>
	</div>
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

<style>
	/* Custom styling for the range slider */
	input[type='range'] {
		-webkit-appearance: none;
		appearance: none;
		height: 6px;
		background: rgba(128, 128, 128, 0.3);
		border-radius: 3px;
		outline: none;
	}

	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: currentColor;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	input[type='range']::-webkit-slider-thumb:hover {
		transform: scale(1.2);
	}

	input[type='range']::-webkit-slider-thumb:active {
		transform: scale(1.3);
	}

	input[type='range']::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: currentColor;
		cursor: pointer;
		border: none;
		transition: all 0.15s ease;
	}

	input[type='range']::-moz-range-thumb:hover {
		transform: scale(1.2);
	}

	input[type='range']::-moz-range-thumb:active {
		transform: scale(1.3);
	}

	input[type='range']::-moz-range-track {
		background: rgba(128, 128, 128, 0.3);
		border-radius: 3px;
	}

	/* Section markers - show as subtle ticks */
	datalist {
		display: flex;
		justify-content: space-between;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 6px;
		pointer-events: none;
	}

	datalist option {
		padding: 0;
		margin: 0;
	}
</style>
