<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg' | 'xl';
		color?: string;
		text?: string;
	}

	let { size = 'md', color = 'text-blue-500', text }: Props = $props();

	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-8 w-8',
		lg: 'h-12 w-12',
		xl: 'h-16 w-16'
	};

	const textSizeClasses = {
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-lg',
		xl: 'text-xl'
	};
</script>

<div class="flex flex-col items-center justify-center gap-3">
	<div class="relative">
		<!-- Outer ring -->
		<div class="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-700 {sizeClasses[size]}"></div>
		
		<!-- Spinning ring -->
		<div 
			class="rounded-full border-2 border-transparent border-t-current animate-spin {sizeClasses[size]} {color}"
			style="animation-duration: 1s;"
		></div>
	</div>
	
	{#if text}
		<p class="text-gray-600 dark:text-gray-400 {textSizeClasses[size]} font-medium">
			{text}
		</p>
	{/if}
</div>
