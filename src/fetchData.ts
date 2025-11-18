// Use same origin if deployed together, otherwise use env var or localhost
const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

export const fetchData = async (date: string, meal?: string): Promise<unknown> => {
  const url = new URL(`${API_URL}/api/menu`);
  url.searchParams.set('date', date);
  if (meal) {
    url.searchParams.set('meal', meal);
  }

  const urlString = url.toString();
  console.log('Fetching from:', urlString);

  const res = await fetch(urlString);

  // Check content type to ensure we're getting JSON, not HTML
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    console.error('Received non-JSON response:', text.substring(0, 200));
    throw new Error(`Expected JSON but received ${contentType}. The API route may not be working correctly.`);
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Backend failed to fetch menu data' }));
    throw new Error(error.error || `HTTP error! status: ${res.status}`);
  }

  return await res.json();
};
