import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as db from "../database/db";


const ListQuerySchema = z.object({
  status: z.enum(["success", "failed", "upcoming", "unknown"]).optional(),
  year:   z.coerce.number().int().min(1950).max(2100).optional(),
  search: z.string().max(100).optional(),
  limit:  z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});


export const health = (_req: Request, res: Response, mockNext: NextFunction) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
};

export const listLaunches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ListQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid query params",
        details: parsed.error.flatten(),
      });
      return;
    }

    const launches = await db.getLaunches(parsed.data);
    res.json(launches);

  } catch (err) {
    next(err);
  }
};

export const getLaunchById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const launch = await db.getLaunchById(id);

    if (!launch) {
      res.status(404).json({ error: "Launch not found" });
      return;
    }

    res.json(launch);

  } catch (err) {
    next(err);
  }
};

export const getSummary = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await db.getSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

export const getByYear = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await db.getByYear();
    res.json(data);
  } catch (err) {
    next(err);
  }
};