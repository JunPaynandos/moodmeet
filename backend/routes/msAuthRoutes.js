import express from "express";
import { microsoftAuthCallback } from "../controllers/msAuthController.js";

const router = express.Router();

router.get("/callback", microsoftAuthCallback);

export default router;
