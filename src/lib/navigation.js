import { MENU_API } from '@util/paths.js';

export async function fetchMenu(location = 'primary') {
  const url = `${MENU_API}?location=${encodeURIComponent(location)}`;

  const response = await fetch(url);

  if (!response.ok) {
    console.log(response)
    return [];
  }

  const payload = await response.json();
  return Array.isArray(payload?.items) ? payload.items : [];
}
