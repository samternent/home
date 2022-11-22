import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
	server: {
		proxy: {
			'/api': {
				target: `http://localhost:4003`,
				changeOrigin: true,
			},
		},
	},
	plugins: [
		vue(),
		VitePWA({
			registerType: 'autoUpdate',
			workbox: {
				navigateFallbackDenylist: [/^\/api/],
			},
		}),
	],
});
