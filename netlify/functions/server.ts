import serverless from "serverless-http";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { connectLambda } from "@netlify/blobs";
import { registerRoutes } from "../../server/routes";
import { BlobsStorage } from "../../server/blobs-storage";
import { setupAuth } from "../../server/auth";

const app = express();
let storage: BlobsStorage | null = null;

app.use(session({
  secret: process.env.SESSION_SECRET || "quran-tracker-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Middleware to attach current storage instance to request
app.use((req, res, next) => {
  if (storage) {
    (req as any).storage = storage;
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

let appHandler: ReturnType<typeof serverless> | null = null;
let isInitialized = false;

async function initializeApp() {
  if (isInitialized && appHandler) return appHandler;
  
  // Routes will use storage from request object (attached via middleware)
  await registerRoutes(app, storage);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  appHandler = serverless(app, {
    binary: ['image/*', 'font/*', 'application/javascript', 'application/json'],
  });

  isInitialized = true;
  return appHandler;
}

export const handler = async (event: any, context: any) => {
  // Connect Netlify Blobs to the Lambda event context for this invocation
  connectLambda(event);
  
  // Initialize storage for this invocation (after connecting Lambda context)
  // This will be attached to requests via middleware
  storage = new BlobsStorage();
  
  // Update auth setup with new storage instance
  setupAuth(storage);
  
  const serverlessHandler = await initializeApp();
  return serverlessHandler(event, context);
};
