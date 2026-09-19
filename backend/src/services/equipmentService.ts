import { Equipment, PrismaClient } from "@prisma/client";
import { ConflictError, NotFoundError } from "../lib/errors";
import { CreateEquipmentInput, UpdateEquipmentInput } from "../schemas/equipment.schema";

export async function listEquipment(db: PrismaClient, filter: { status?: "ACTIVE" | "RETIRED" }): Promise<Equipment[]> {
  return db.equipment.findMany({
    where: filter.status ? { status: filter.status } : undefined,
    orderBy: { name: "asc" },
  });
}

export async function getEquipmentById(db: PrismaClient, id: string): Promise<Equipment> {
  const equipment = await db.equipment.findUnique({ where: { id } });
  if (!equipment) throw new NotFoundError("Equipment", id);
  return equipment;
}

export async function createEquipment(db: PrismaClient, input: CreateEquipmentInput): Promise<Equipment> {
  return db.equipment.create({ data: input });
}

export async function updateEquipment(db: PrismaClient, id: string, input: UpdateEquipmentInput): Promise<Equipment> {
  await getEquipmentById(db, id);
  return db.equipment.update({ where: { id }, data: input });
}

export async function deleteEquipment(db: PrismaClient, id: string): Promise<void> {
  await getEquipmentById(db, id);
  const recordCount = await db.cleaningRecord.count({ where: { equipmentId: id } });
  if (recordCount > 0) {
    throw new ConflictError(
      `Equipment ${id} has ${recordCount} cleaning record(s) and cannot be deleted. Retire it instead.`,
    );
  }
  await db.equipment.delete({ where: { id } });
}
