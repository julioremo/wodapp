import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		alias: {
			// This tells SvelteKit: "When you see this import, look in this file"
			'@wodapp/types': path.resolve('../../packages/types/src/index.ts'),
			'@wodapp/supabase-client': path.resolve('../../packages/supabase-client/src/index.ts')
		}
	}
};

export default config;