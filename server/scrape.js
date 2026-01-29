import puppeteer from "puppeteer-extra";
import Stealth from "puppeteer-extra-plugin-stealth";
puppeteer.use(Stealth());

// Location ID for LSU's 459 Commons dining hall
// This can be overridden with LOCATION_ID environment variable
const LOCATION_ID = "66c79443351d5300dddee979";

let browser;
async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    });
  }
  return browser;
}

async function fetchJsonWithPuppeteer(page, url) {
  try {
    console.log(`Navigating to: ${url}`);
    // Navigate to the URL and get the response
    const response = await page.goto(url, { 
      waitUntil: "domcontentloaded",
      timeout: 30000 
    });

    if (!response) {
      throw new Error("No response received from page.goto()");
    }

    console.log(`Response status: ${response.status()}, URL: ${response.url()}`);

    if (!response.ok()) {
      const statusText = await response.text().catch(() => response.statusText());
      throw new Error(`HTTP ${response.status()}: ${statusText}`);
    }

    // Read the JSON from the response immediately
    console.log(`Reading JSON from response...`);
    const jsonData = await response.json();
    console.log(`Successfully parsed JSON`);
    return jsonData;
  } catch (error) {
    console.error(`Error in fetchJsonWithPuppeteer for ${url}:`, error.message);
    throw error;
  }
}

export async function scrapeMenu(date, mealName) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const locationId = LOCATION_ID;

    // Fetch periods
    const periodsUrl = 
      `https://apiv4.dineoncampus.com/locations/${locationId}/periods/?date=${date}`;

    console.log(`Fetching periods from: ${periodsUrl}`);

    const periods = await fetchJsonWithPuppeteer(page, periodsUrl);

    if (!periods || !periods.periods) {
      throw new Error(`Invalid periods response: ${JSON.stringify(periods)}`);
    }

    const periodObj = periods.periods.find(
      p => p.name?.toLowerCase() === mealName?.toLowerCase()
    );

    if (!periodObj) {
      const availablePeriods = periods.periods.map(p => p.name).join(", ") || "none";
      throw new Error(`Meal period "${mealName}" not found for date ${date}. Available periods: ${availablePeriods}`);
    }

    // Fetch menu
    const menuUrl =
      `https://apiv4.dineoncampus.com/locations/${locationId}/menu?date=${date}&period=${periodObj.id}`;

    console.log(`Fetching menu from: ${menuUrl}`);

    const menuData = await fetchJsonWithPuppeteer(page, menuUrl);

    return menuData;
  } catch (error) {
    console.error("Error in scrapeMenu:", error);
    throw error;
  } finally {
    // Always close the page, even if there's an error
    try {
      await page.close();
    } catch (closeError) {
      console.warn("Error closing page:", closeError.message);
    }
  }
}
