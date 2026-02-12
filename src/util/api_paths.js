// @ts-check
import { loadEnv } from "vite";
const env = loadEnv(process.env, process.cwd(), "");
let REST_API = env.DEV_REST_API;
let BLOCKS_API = env.DEV_BLOCKS_API;

switch (env.BUILD_MODE) {
  case "production":
    REST_API = env.PRODUCTION_REST_API;
    BLOCKS_API = env.PRODUCTION_BLOCKS_API;
    break;
  case "staging":
    REST_API = env.STAGING_REST_API;
    BLOCKS_API = env.STAGING_BLOCKS_API;
  break;
}

export const REST_PATH = REST_API;
export const BLOCKS_PATH = BLOCKS_API;
