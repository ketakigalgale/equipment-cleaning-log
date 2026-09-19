import { Router } from "express";
import { prisma } from "../db";
import { createEquipmentSchema, listEquipmentQuerySchema, updateEquipmentSchema } from "../schemas/equipment.schema";
import * as equipmentService from "../services/equipmentService";

export const equipmentRouter = Router();

equipmentRouter.get("/", async (req, res, next) => {
  try {
    const query = listEquipmentQuerySchema.parse(req.query);
    const data = await equipmentService.listEquipment(prisma, query);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

equipmentRouter.post("/", async (req, res, next) => {
  try {
    const input = createEquipmentSchema.parse(req.body);
    const data = await equipmentService.createEquipment(prisma, input);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

equipmentRouter.get("/:id", async (req, res, next) => {
  try {
    const data = await equipmentService.getEquipmentById(prisma, req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

equipmentRouter.put("/:id", async (req, res, next) => {
  try {
    const input = updateEquipmentSchema.parse(req.body);
    const data = await equipmentService.updateEquipment(prisma, req.params.id, input);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

equipmentRouter.delete("/:id", async (req, res, next) => {
  try {
    await equipmentService.deleteEquipment(prisma, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
