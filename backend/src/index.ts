import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import identityRoutes from "./routes/identity.routes";
import matchmakingRoutes from "./routes/matchmaking.routes";
import communicationRoutes from "./routes/communication.routes";
import verificationRoutes from "./routes/verification.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Chellam-API-Gateway",
    version: "1.0.0",
    message: "Node.js Enterprise Microservices Router is heavily online.",
  });
});

// Mount Service Routers
app.use("/api/v1/identity", identityRoutes);
app.use("/api/v1/matchmaking", matchmakingRoutes);
app.use("/api/v1/communication", communicationRoutes);
app.use("/api/v1/verification", verificationRoutes);

// Fallback error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Microservice Error" });
});

// Server Init
app.listen(PORT, () => {
  console.log(`[GATEWAY]: Chellam Matrimony Microservices API running on port ${PORT}`);
});
