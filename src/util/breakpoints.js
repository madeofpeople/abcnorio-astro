const style = getComputedStyle(document.documentElement);
export const bp = (name) => parseInt(style.getPropertyValue(`--breakpoint-${name}`));