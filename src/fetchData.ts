// Use Netlify Functions for API calls
export const fetchData = async (date: string, meal?: string): Promise<unknown> => {
  try {
    // Netlify Functions are at /.netlify/functions/[function-name]
    const url = new URL('/.netlify/functions/menu', window.location.origin);
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
