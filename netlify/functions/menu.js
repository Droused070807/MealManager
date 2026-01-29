// Netlify serverless function to proxy LSU API requests
const LOCATION_ID = "66c79443351d5300dddee979"; // LSU 459 Commons
const API_BASE = "https://apiv4.dineoncampus.com";

exports.handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { date, meal } = event.queryStringParameters || {};

    if (!date) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Date parameter is required' }),
      };
    }

    console.log('Fetching menu for:', { date, meal });

    // Headers to mimic a browser request
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://lsu.campusdish.com/',
      'Origin': 'https://lsu.campusdish.com',
    };

    // Step 1: Fetch periods
    const periodsUrl = `${API_BASE}/locations/${LOCATION_ID}/periods/?date=${date}`;
    console.log('Fetching periods from:', periodsUrl);
    
    const periodsResponse = await fetch(periodsUrl, { headers: fetchHeaders });
    if (!periodsResponse.ok) {
      console.error('Periods fetch failed:', periodsResponse.status, periodsResponse.statusText);
      throw new Error(`Failed to fetch periods: ${periodsResponse.status}`);
    }
    
    const periodsData = await periodsResponse.json();

    if (!periodsData.periods || periodsData.periods.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: `Meal period "${meal}" not found for date ${date}. Available periods: none`
        }),
      };
    }

    // Step 2: Find the requested meal period
    let periodObj;
    if (meal) {
      periodObj = periodsData.periods.find(
        (p) => p.name.toLowerCase() === meal.toLowerCase()
      );
      if (!periodObj) {
        const available = periodsData.periods.map((p) => p.name).join(", ");
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: `Meal period "${meal}" not found for date ${date}. Available periods: ${available}`
          }),
        };
      }
    } else {
      periodObj = periodsData.periods[0];
    }

    // Step 3: Fetch menu
    const menuUrl = `${API_BASE}/locations/${LOCATION_ID}/menu?date=${date}&period=${periodObj.id}`;
    console.log('Fetching menu from:', menuUrl);
    
    const menuResponse = await fetch(menuUrl, { headers: fetchHeaders });
    if (!menuResponse.ok) {
      console.error('Menu fetch failed:', menuResponse.status, menuResponse.statusText);
      throw new Error(`Failed to fetch menu: ${menuResponse.status}`);
    }
    
    const menuData = await menuResponse.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(menuData),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Failed to fetch menu data' }),
    };
  }
};
