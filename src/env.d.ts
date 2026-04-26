/// <reference types="astro/client" />

declare global {
    interface Window {
        htmx: (typeof import('htmx.org'))['default'];
    }
}

export {};
