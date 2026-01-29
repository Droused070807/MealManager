// Use backend server for API calls (Render deployment)
const API_URL = import.meta.env.VITE_API_URL || 'https://mealmanager.onrender.com';

export const fetchData = async (date: string, meal?: string): Promise<unknown> => {
  try {
    const url = new URL(`${API_URL}/api/menu`);
    url.searchParams.set('date', date);
    if (meal) {
      url.searchParams.set('meal', meal);
    }

    console.log('Fetching from:', url.toString());
    
    // Add 90 second timeout for Render cold starts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    
    try {
      const response = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch menu data' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Menu data received');
      
      return data;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout after 90 seconds. The backend server may be down or experiencing issues. Please try again in a few minutes.');
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('Error fetching menu:', error);
    throw new Error(error.message || 'Failed to fetch menu data');
  }
};
