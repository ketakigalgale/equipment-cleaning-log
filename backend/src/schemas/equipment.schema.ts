import { z } from "zod";

export const equipmentStatusSchema = z.enum(["ACTIVE", "RETIRED"]);

export const createEquipmentSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(200),
  code: z.string().trim().min(1, "code is required").max(50),
  status: equipmentStatusSchema.optional(),
});

export const updateEquipmentSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    code: z.string().trim().min(1).max(50).optional(),
    status: equipmentStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

export const listEquipmentQuerySchema = z.object({
  status: equipmentStatusSchema.optional(),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
