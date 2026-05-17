
import express from "express";
import path from "node:path";
import compression from "compression";

async function startServer() {
  console.log("[SYSTEM] STARTING SERVER...");
  const app = express();
  const PORT = 3000;

  console.log(`[SYSTEM] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[SYSTEM] CWD: ${process.cwd()}`);

  app.use(compression());
  app.use(express.json({ limit: '50mb' }));

  // Secure Gemini API Proxy
  app.post("/api/gemini/process", async (req, res) => {
    try {
      const { model, contents, config, userApiKey } = req.body;
      const apiKey = userApiKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.error("[GEMINI PROXY] API Key is missing.");
        return res.status(401).json({ error: "API Key Not Configured. Please provide a key or set GEMINI_API_KEY in secrets." });
      }

      // Log masked key for debugging
      const maskedKey = apiKey.length > 8 ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : "****";
      console.log(`[GEMINI PROXY] Processing request with model: ${model} using key: ${maskedKey}`);

      const { GoogleGenAI } = await import("@google/genai");
      const genAI = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const response = await genAI.models.generateContent({
        model: model || "gemini-3-flash-preview",
        contents,
        config
      });

      res.json(response);
    } catch (error: any) {
      console.error("[GEMINI PROXY ERROR]", error);
      
      const status = error.status || (error.message?.includes('401') ? 401 : 500);
      res.status(status).json({ 
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
    const { createServer: createViteServer } = await import("vite");
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
    console.log(`[SYSTEM] CORE ACTIVE: http://localhost:${PORT}`);
  });
}

startServer();
