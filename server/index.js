import express from "express";
import cors from "cors";
import { scrapeMenu } from "./scrape.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// CRITICAL: Add middleware at the very start to log all requests
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path} - API route: ${req.path.startsWith("/api")}`);
  next();
});

app.use(cors({
  origin: "*",
  methods: ["GET"],
}));

// Create API router to ensure API routes are handled separately
const apiRouter = express.Router();

// Test endpoint to verify API is working
apiRouter.get("/test", (req, res) => {
  console.log("API /api/test endpoint called");
  res.json({ message: "API is working!", timestamp: new Date().toISOString(), path: req.path });
});

// Catch-all for API router to handle unmatched API routes
apiRouter.use("*", (req, res) => {
  console.log("API route not found in router:", req.originalUrl);
  res.status(404).json({ error: "API endpoint not found", path: req.path });
});

apiRouter.get("/menu", async (req, res) => {
  console.log("API /api/menu called with:", { date: req.query.date, meal: req.query.meal });
  const { date, meal } = req.query;

  if (!date) {
    return res.status(400).json({ error: "Date parameter is required" });
  }

  try {
    const result = await scrapeMenu(date, meal);
    console.log("API /api/menu returning result");
    res.json(result);
  } catch (error) {
    console.error("Error scraping menu:", error);
    res.status(500).json({ error: error.message || "Failed to fetch menu data" });
  }
});

// Mount API router FIRST - before any other routes
app.use("/api", apiRouter);

// CRITICAL: Add middleware to ensure API routes never get HTML
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    // If we reach here and it's an API route, it means the API router didn't handle it
    console.error("API route not handled by router:", req.path);
    return res.status(404).json({ error: "API endpoint not found" });
  }
  next();
});

// Serve frontend if dist folder exists (for full-stack deployment)
const distPath = join(__dirname, "..", "dist");
if (existsSync(distPath)) {
  console.log("Frontend dist folder found at:", distPath);
  
  // Serve static files (CSS, JS, images) - ONLY for non-API routes
  app.use((req, res, next) => {
    // NEVER serve static files for API routes
    if (req.path.startsWith("/api")) {
      console.log("Skipping static file serving for API route:", req.path);
      return next();
    }
    // Serve static files for non-API routes only
    express.static(distPath, { index: false })(req, res, (err) => {
      if (err) {
        return next(err);
      }
      // If file not found, continue to next middleware
      if (!res.headersSent) {
        next();
      }
    });
  });
  
  // Serve index.html ONLY for non-API routes (SPA fallback)
  app.get(/^(?!\/api).*$/, (req, res) => {
    console.log("Serving index.html for non-API route:", req.path);
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
