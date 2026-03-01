import { Request, Response, NextFunction } from "express";

// ── Mock del módulo db ────────────────────────────────────────────────────────
jest.mock("../database/db", () => ({
  getLaunches: jest.fn(),
  getLaunchById: jest.fn(),
  getSummary: jest.fn(),
  getByYear: jest.fn(),
}));

import * as db from "../database/db";
import {
  health,
  listLaunches,
  getLaunchById,
  getSummary,
  getByYear,
} from "../controllers/launches.controller";

// ── Helpers ───────────────────────────────────────────────────────────────────
const mockReq = (overrides: Partial<Request> = {}): Request =>
  ({ query: {}, params: {}, ...overrides } as unknown as Request);

const mockRes = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const res = { json, status } as unknown as Response;
  return { res, json, status };
};

const mockNext = jest.fn() as unknown as NextFunction;

const sampleLaunch = {
  launch_id: "abc123",
  mission_name: "FalconSat",
  date_utc: "2006-03-24T22:30:00.000Z",
  status: "success",
  rocket_id: "rocket-1",
  launchpad_id: "pad-1",
};

// ── health ────────────────────────────────────────────────────────────────────
describe("health", () => {
  it("responde con status ok y timestamp", () => {
    const req = mockReq();
    const { res, json } = mockRes();

    health(req, res, mockNext);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ok" })
    );
  });

  it("incluye un campo ts en la respuesta", () => {
    const req = mockReq();
    const { res, json } = mockRes();

    health(req, res, mockNext);

    const call = json.mock.calls[0][0] as any;
    expect(call).toHaveProperty("ts");
    expect(typeof call.ts).toBe("string");
  });
});

// ── listLaunches ──────────────────────────────────────────────────────────────
describe("listLaunches", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retorna lista de lanzamientos con query válido", async () => {
    (db.getLaunches as jest.Mock).mockResolvedValue([sampleLaunch]);

    const req = mockReq({ query: { status: "success", limit: "10" } });
    const { res, json } = mockRes();

    await listLaunches(req, res, mockNext);

    expect(db.getLaunches).toHaveBeenCalledWith(
      expect.objectContaining({ status: "success", limit: 10 })
    );
    expect(json).toHaveBeenCalledWith([sampleLaunch]);
  });

  it("retorna 400 con query params inválidos", async () => {
    const req = mockReq({ query: { status: "invalid_status" } });
    const { res, status } = mockRes();

    await listLaunches(req, res, mockNext);

    expect(status).toHaveBeenCalledWith(400);
  });

  it("llama a next con error si db falla", async () => {
    (db.getLaunches as jest.Mock).mockRejectedValue(new Error("DB error"));

    const req = mockReq({ query: {} });
    const { res } = mockRes();
    const next = jest.fn() as unknown as NextFunction;

    await listLaunches(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("usa valores por defecto de limit y offset", async () => {
    (db.getLaunches as jest.Mock).mockResolvedValue([]);

    const req = mockReq({ query: {} });
    const { res } = mockRes();

    await listLaunches(req, res, mockNext);

    expect(db.getLaunches).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 200, offset: 0 })
    );
  });

  it("filtra por año correctamente", async () => {
    (db.getLaunches as jest.Mock).mockResolvedValue([sampleLaunch]);

    const req = mockReq({ query: { year: "2006" } });
    const { res } = mockRes();

    await listLaunches(req, res, mockNext);

    expect(db.getLaunches).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2006 })
    );
  });
});

// ── getLaunchById ─────────────────────────────────────────────────────────────
describe("getLaunchById", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retorna el lanzamiento cuando existe", async () => {
    (db.getLaunchById as jest.Mock).mockResolvedValue(sampleLaunch);

    const req = mockReq({ params: { id: "abc123" } });
    const { res, json } = mockRes();

    await getLaunchById(req, res, mockNext);

    expect(db.getLaunchById).toHaveBeenCalledWith("abc123");
    expect(json).toHaveBeenCalledWith(sampleLaunch);
  });

  it("retorna 404 cuando el lanzamiento no existe", async () => {
    (db.getLaunchById as jest.Mock).mockResolvedValue(null);

    const req = mockReq({ params: { id: "notfound" } });
    const { res, status } = mockRes();

    await getLaunchById(req, res, mockNext);

    expect(status).toHaveBeenCalledWith(404);
  });

  it("llama a next con error si db falla", async () => {
    (db.getLaunchById as jest.Mock).mockRejectedValue(new Error("DB error"));

    const req = mockReq({ params: { id: "abc123" } });
    const { res } = mockRes();
    const next = jest.fn() as unknown as NextFunction;

    await getLaunchById(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("maneja id como array tomando el primer elemento", async () => {
    (db.getLaunchById as jest.Mock).mockResolvedValue(sampleLaunch);

    const req = mockReq({ params: { id: ["abc123", "other"] as unknown as string } });
    const { res } = mockRes();

    await getLaunchById(req, res, mockNext);

    expect(db.getLaunchById).toHaveBeenCalledWith("abc123");
  });
});

// ── getSummary ────────────────────────────────────────────────────────────────
describe("getSummary", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retorna el resumen correctamente", async () => {
    const summary = { total: 205, success: 180, failed: 15, upcoming: 10, unknown: 0 };
    (db.getSummary as jest.Mock).mockResolvedValue(summary);

    const req = mockReq();
    const { res, json } = mockRes();

    await getSummary(req, res, mockNext);

    expect(json).toHaveBeenCalledWith(summary);
  });

  it("llama a next con error si db falla", async () => {
    (db.getSummary as jest.Mock).mockRejectedValue(new Error("DB error"));

    const req = mockReq();
    const { res } = mockRes();
    const next = jest.fn() as unknown as NextFunction;

    await getSummary(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ── getByYear ─────────────────────────────────────────────────────────────────
describe("getByYear", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retorna estadísticas por año correctamente", async () => {
    const data = [
      { year: 2006, total: 1, success: 0, failed: 1, upcoming: 0 },
      { year: 2024, total: 20, success: 18, failed: 1, upcoming: 1 },
    ];
    (db.getByYear as jest.Mock).mockResolvedValue(data);

    const req = mockReq();
    const { res, json } = mockRes();

    await getByYear(req, res, mockNext);

    expect(json).toHaveBeenCalledWith(data);
  });

  it("llama a next con error si db falla", async () => {
    (db.getByYear as jest.Mock).mockRejectedValue(new Error("DB error"));

    const req = mockReq();
    const { res } = mockRes();
    const next = jest.fn() as unknown as NextFunction;

    await getByYear(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});