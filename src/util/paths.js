const env = import.meta.env;
const mode = env.MODE || 'development';

let restAPI, blocksAPI, searchAPI, cmsURL = '';

switch (mode) {
  case 'production':
  case 'staging':
    cmsURL = env.STAGING_CMS
    searchAPI = env.STAGING_SEARCH_API
    break;
  default:
    cmsURL = env.DEV_CMS
    searchAPI = env.DEV_SEARCH_API
    break;
}
console.log('CMS URL:', cmsURL);
export const REST_PATH = `${cmsURL}${env.REST_ENDPOINT}`;
export const BLOCKS_PATH = `${cmsURL}${env.BLOCKS_ENDPOINT}`;
export const SITE_URL = (env.SITE_URL || env.SITE || '').replace(/\/$/, '');
export const CMS_URL = cmsURL;
export const MENU_API = `${cmsURL}${env.MENU_ENDPOINT}`;
export const SEARCH_API = `${cmsURL}${searchAPI}`;