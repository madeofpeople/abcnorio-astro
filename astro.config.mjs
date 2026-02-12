// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import partytown from '@astrojs/partytown';
import icon from 'astro-icon';
import { loadEnv } from "vite";

const env = loadEnv(process.env, process.cwd(), "");
let BUILD_PATH = env.DEV_BUILD_PATH;

switch (env.BUILD_MODE) {
  case "production":
    BUILD_PATH = env.PRODUCTION_BUILD_PATH;
  break;
  case "staging":
    BUILD_PATH = env.STAGING_BUILD_PATH;
  break;
}

export default defineConfig({
  server: {
    port: 8080
  },
  outDir: BUILD_PATH,
  image: {
    remotePatterns: [{ protocol: "https" }],
  },
  integrations: [react(), partytown(), icon()],
  vite: {
    include: ['picocolors'],
  },
});