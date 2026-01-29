// Client-side data fetching - no backend needed!
const LOCATION_ID = "66c79443351d5300dddee979"; // LSU 459 Commons

const API_BASE = "https://apiv4.dineoncampus.com";

export const fetchData = async (date: string, meal?: string): Promise<unknown> => {
  try {
    console.log('Fetching menu data for:', { date, meal });

    // Step 1: Fetch available periods for the date
    const periodsUrl = `${API_BASE}/locations/${LOCATION_ID}/periods/?date=${date}`;
    console.log('Fetching periods from:', periodsUrl);
    
    const periodsResponse = await fetch(periodsUrl);
    if (!periodsResponse.ok) {
      throw new Error(`Failed to fetch periods: ${periodsResponse.status}`);
    }
    
    const periodsData = await periodsResponse.json();
    console.log('Periods data:', periodsData);

    if (!periodsData.periods || periodsData.periods.length === 0) {
      throw new Error(`Meal period "${meal}" not found for date ${date}. Available periods: none`);
    }

    // Step 2: Find the requested meal period
    let periodObj;
    if (meal) {
      periodObj = periodsData.periods.find(
        (p: any) => p.name.toLowerCase() === meal.toLowerCase()
      );
      if (!periodObj) {
        const available = periodsData.periods.map((p: any) => p.name).join(", ");
        throw new Error(`Meal period "${meal}" not found for date ${date}. Available periods: ${available}`);
      }
    } else {
      // If no meal specified, use the first available period
      periodObj = periodsData.periods[0];
    }

    console.log('Using period:', periodObj);

    // Step 3: Fetch menu for the period
    const menuUrl = `${API_BASE}/locations/${LOCATION_ID}/menu?date=${date}&period=${periodObj.id}`;
    console.log('Fetching menu from:', menuUrl);
    
    const menuResponse = await fetch(menuUrl);
    if (!menuResponse.ok) {
      throw new Error(`Failed to fetch menu: ${menuResponse.status}`);
    }
    
    const menuData = await menuResponse.json();
    console.log('Menu data received');

    return menuData;
  } catch (error: any) {
    console.error('Error fetching menu:', error);
    throw new Error(error.message || 'Failed to fetch menu data');
  }
};
