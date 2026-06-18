// @ts-check

import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		outDir: "../../public",
	},
	server: {
		port: 1000,
		proxy: {
			"/sprites": {
				target: "http://localhost:3000",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/sprites/, "/sprites")
			}
		}
	},

})