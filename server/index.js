import express from "express";
import cors from "cors";
import { scrapeMenu } from "./scrape.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET"],
}));

// API Routes - MUST be defined before static file serving
// Use app.use to ensure it matches before any static middleware
app.use("/api/menu", async (req, res) => {
  // Only handle GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { date, meal } = req.query;

  if (!date) {
    return res.status(400).json({ error: "Date parameter is required" });
  }

  try {
    const result = await scrapeMenu(date, meal);
    res.json(result);
  } catch (error) {
    console.error("Error scraping menu:", error);
    res.status(500).json({ error: error.message || "Failed to fetch menu data" });
  }
});

// Serve frontend if dist folder exists (for full-stack deployment)
const distPath = join(__dirname, "..", "dist");
if (existsSync(distPath)) {
  // Serve static files, but skip API routes
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next(); // Don't serve static files for API routes
    }
    // Serve static files for non-API routes
    express.static(distPath, { index: false })(req, res, next);
  });
  
  // Serve index.html for all non-API routes (SPA fallback)
  app.get("*", (req, res) => {
    // Double check - should never reach here for API routes due to route above
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    const indexPath = join(distPath, "index.html");
    if (existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: "Frontend not found. Please build the frontend first." });
    }
  });
  
  console.log("Frontend static files enabled from:", distPath);
} else {
  console.log("Frontend dist folder not found at:", distPath);
  console.log("Serving API only. Deploy frontend separately or build it first.");
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (existsSync(distPath)) {
    console.log("Frontend is being served from /dist");
  } else {
    console.log("Frontend not found. Deploy frontend separately or build it first.");
  }
});
