// Use Netlify Functions for API calls
const API_URL = import.meta.env.VITE_API_URL || '/.netlify/functions';

export const fetchData = async (date: string, meal?: string): Promise<unknown> => {
  try {
    const url = new URL(`${API_URL}/menu`, window.location.origin);
    url.searchParams.set('date', date);
    if (meal) {
      url.searchParams.set('meal', meal);
    }

    console.log('Fetching from:', url.toString());
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch menu data' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Menu data received');
    
    return data;
  } catch (error: any) {
    console.error('Error fetching menu:', error);
    throw new Error(error.message || 'Failed to fetch menu data');
  }
};
