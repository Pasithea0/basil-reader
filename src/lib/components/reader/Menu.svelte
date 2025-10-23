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
		class="p-0.5 rounded-md bg-transparent border-0 text-gray-500 hover:bg-black/10 hover:text-current"
	>
		<svg
			class="block fill-none stroke-current stroke-2"
			width="24"
			height="24"
			aria-hidden="true"
		>
			<path
				d="M5 12.7a7 7 0 0 1 0-1.4l-1.8-2 2-3.5 2.7.5a7 7 0 0 1 1.2-.7L10 3h4l.9 2.6 1.2.7 2.7-.5 2 3.4-1.8 2a7 7 0 0 1 0 1.5l1.8 2-2 3.5-2.7-.5a7 7 0 0 1-1.2.7L14 21h-4l-.9-2.6a7 7 0 0 1-1.2-.7l-2.7.5-2-3.4 1.8-2Z"
			/>
			<circle cx="12" cy="12" r="3" />
		</svg>
	</button>
	<ul
		class="absolute right-0 bg-[Canvas] text-[CanvasText] rounded-md shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_0_16px_rgba(0,0,0,0.1)] p-1.5 cursor-default list-none m-0 {show
			? 'visible'
			: 'invisible'}"
	>
		<li class="px-3 py-1.5 pl-6 rounded-md">
			<strong>Layout</strong>
		</li>
		<li
			onclick={() => selectLayout('paginated')}
			class="px-3 py-1.5 pl-6 rounded-md hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer {selectedLayout ===
			'paginated'
				? 'bg-[center_left] bg-no-repeat bg-[url(\'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%223%22%2F%3E%3C%2Fsvg%3E\')]'
				: ''}"
			aria-checked={selectedLayout === 'paginated'}
		>
			Paginated
		</li>
		<li
			onclick={() => selectLayout('scrolled')}
			class="px-3 py-1.5 pl-6 rounded-md hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer {selectedLayout ===
			'scrolled'
				? 'bg-[center_left] bg-no-repeat bg-[url(\'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%223%22%2F%3E%3C%2Fsvg%3E\')]'
				: ''}"
			aria-checked={selectedLayout === 'scrolled'}
		>
			Scrolled
		</li>
	</ul>
</div>
