import { Router } from "express";
import { prisma } from "../db";
import { parsePaginationParams } from "../lib/pagination";
import {
  createCleaningRecordSchema,
  listCleaningRecordsQuerySchema,
  updateCleaningRecordSchema,
} from "../schemas/cleaningRecord.schema";
import * as cleaningRecordService from "../services/cleaningRecordService";

// Mounted at /api/equipment/:equipmentId/cleaning-records
export const nestedCleaningRecordsRouter = Router({ mergeParams: true });

nestedCleaningRecordsRouter.get("/", async (req, res, next) => {
  try {
    const { equipmentId } = req.params as { equipmentId: string };
    const query = listCleaningRecordsQuerySchema.parse(req.query);
    const { page, limit, skip } = parsePaginationParams(query);
    const result = await cleaningRecordService.listCleaningRecords(prisma, equipmentId, {
      page,
      limit,
      skip,
      status: query.status,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

nestedCleaningRecordsRouter.post("/", async (req, res, next) => {
  try {
    const { equipmentId } = req.params as { equipmentId: string };
    const input = createCleaningRecordSchema.parse(req.body);
    const data = await cleaningRecordService.createCleaningRecord(prisma, equipmentId, input, req.actor);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

// Mounted at /api/cleaning-records
export const cleaningRecordsRouter = Router();

cleaningRecordsRouter.put("/:id", async (req, res, next) => {
  try {
    const input = updateCleaningRecordSchema.parse(req.body);
    const data = await cleaningRecordService.updateCleaningRecord(prisma, req.params.id, input, req.actor);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

cleaningRecordsRouter.get("/:id/audit", async (req, res, next) => {
  try {
    const data = await cleaningRecordService.getAuditTrail(prisma, req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});
