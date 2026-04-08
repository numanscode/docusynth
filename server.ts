
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import compression from "compression";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(compression());
  app.use(express.json({ limit: '50mb' }));

  // Secure Gemini API Proxy
  app.post("/api/gemini/process", async (req, res) => {
    try {
      const { model, contents, config, userApiKey } = req.body;
      const apiKey = userApiKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(401).json({ error: "API Key Missing" });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const genAI = new GoogleGenAI({ apiKey });
      
      // We use the low-level generateContent to handle both text and image tasks
      const response = await genAI.models.generateContent({
        model,
        contents,
        config
      });

      res.json(response);
    } catch (error: any) {
      console.error("[GEMINI PROXY ERROR]", error);
      res.status(error.status || 500).json({ 
        error: error.message || "Internal Server Error",
        details: error.details || []
      });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from the dist folder in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYSTEM] DOCUSYNTH CORE ACTIVE: http://localhost:${PORT}`);
  });
}

startServer();
