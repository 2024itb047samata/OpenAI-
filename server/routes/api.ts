import { Router } from "express";
import { authController } from "../controllers/auth";
import { repositoryController } from "../controllers/repositories";
import { geminiController } from "../controllers/gemini";

const router = Router();

// --- SYSTEM & DIRECT PROXY ENDPOINTS ---
router.get("/health", geminiController.getHealth);
router.post("/gemini/generate", geminiController.generateText);
router.post("/gemini/embed", geminiController.generateEmbeddings);

// --- GITHUB OAUTH ENDPOINTS ---
router.get("/auth/github/url", authController.getLoginUrl);
router.get("/auth/github/callback", authController.handleCallback);
router.get("/auth/github/user", authController.getUserStatus);
router.post("/auth/github/logout", authController.handleLogout);

// --- SETTINGS ENDPOINTS ---
router.post("/settings/secret", authController.saveSecret);

// --- REPOSITORY & INGESTION ENDPOINTS ---
router.get("/repositories", repositoryController.listRepositories);
router.post("/repositories", repositoryController.createRepository);
router.post("/repositories/:owner/:repo/ingest", repositoryController.ingestRepository);
router.get("/repositories/:owner/:repo/timeline", repositoryController.getTimeline);
router.post("/repositories/:owner/:repo/query", repositoryController.queryRepository);

export default router;
