import { config } from "dotenv";
import { resolve } from "path";

// Load .env from monorepo root (2 levels up from apps/api/src)
config({ path: resolve(__dirname, "../../../.env") });

import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { runMigrations } from "./database/migrations.js";
import { responseTimeMiddleware } from "./middlewares/response-time.middleware.js";
import { errorHandlerMiddleware } from "./middlewares/error-handler.middleware.js";
import { openApiDocument } from "./openapi.js";
import { startFavoriteWorker } from "./queue.js";
import authRoutes from "./routes/auth.routes.js";
import entriesRoutes from "./routes/entries.routes.js";
import userRoutes from "./routes/user.routes.js";

export const app: ReturnType<typeof express> = express();
const PORT = process.env.API_PORT || 3001;

// Global middlewares
app.use(cors());
app.use(express.json());
app.use(responseTimeMiddleware);

// API Documentation (Swagger UI)
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "English Dictionary API — Docs",
}));

// Routes
app.get("/", (_req, res) => {
  res.json({ message: "English Dictionary" });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth", authRoutes);
app.use("/entries/en", entriesRoutes);
app.use("/user", userRoutes);

// Global error handler (must be last)
app.use(errorHandlerMiddleware);

// Start server
async function start() {
  try {
    // Run database migrations
    await runMigrations();
    console.log("✅ Database ready");

    // Start the async favorite worker
    await startFavoriteWorker();

    app.listen(PORT, () => {
      console.log(`🚀 API running on http://localhost:${PORT}`);
      console.log(`📚 Docs available at http://localhost:${PORT}/docs`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();
