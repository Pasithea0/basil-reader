import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Plugin to fix foliate-js glob pattern issue
function fixFoliateJs() {
	return {
		name: 'fix-foliate-js',
		transform(code: string, id: string) {
			// Fix the glob pattern in pdf.js
			if (id.includes('foliate-js/pdf.js')) {
				return code.replace('`vendor/pdfjs/${path}`', '`./vendor/pdfjs/${path}`');
			}
		}
	};
}

export default defineConfig({
	plugins: [fixFoliateJs(), tailwindcss(), sveltekit()],
	optimizeDeps: {
		exclude: ['$lib/foliate-js']
	},
	server: {
		fs: {
			allow: ['..']
		}
	}
});
