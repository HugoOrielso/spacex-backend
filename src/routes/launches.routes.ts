import { Router } from "express";
import { health, listLaunches, getLaunchById, getSummary, getByYear } from "../controllers/launches.controller";

export const router = Router();

router.get("/health", health);

router.get("/launches", listLaunches);

router.get("/launches/:id", getLaunchById);

router.get("/stats/summary", getSummary);

router.get("/stats/by-year", getByYear);