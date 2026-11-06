import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { randomUUID } from "node:crypto";
import { runWithOrganization } from "./organization-context";
import { logSafeException } from "./logging";

const app = express();
const httpServer = createServer(app);

// Trust Replit's reverse proxy so cookies and secure detection work correctly
app.set("trust proxy", 1);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const requestId = randomUUID();
  res.locals.requestId = requestId;
  const start = Date.now();

  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const routePath = req.route?.path;
      const route =
        typeof routePath === "string" ? routePath : "<unmatched>";
      const method = /^[A-Z]{1,10}$/.test(req.method) ? req.method : "OTHER";

      console.log(
        JSON.stringify({
          level: "info",
          event: "http_request",
          requestId,
          method,
          route,
          statusCode: res.statusCode,
          durationMs: Date.now() - start,
        }),
      );
    }
  });

  next();
});

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: false, limit: "15mb" }));

(async () => {
  try {
    await registerRoutes(httpServer, app);

    if (process.env.NODE_ENV !== "production") {
      try {
        const seedModule = await import("./seed");
        await runWithOrganization(1, () => seedModule.seedDatabase());
        log("Database seeded (development only)");
      } catch (err) {
        logSafeException("database_seed", err, undefined, "warn");
      }
    }

    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      logSafeException("http_error_handler", err, res.locals.requestId);

      if (res.headersSent) return res.destroy();

      return res.status(status).json({ message });
    });

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    const port = parseInt(process.env.PORT || "5000", 10);

    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
      },
      () => {
        log(`serving on port ${port}`);
      },
    );
  } catch (err) {
    logSafeException("server_startup", err);
    process.exit(1);
  }
})();
