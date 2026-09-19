import { z } from "zod";

export const cleaningStatusSchema = z.enum(["PENDING", "VERIFIED"]);

export const createCleaningRecordSchema = z.object({
  cleanedBy: z.string().trim().min(1, "cleanedBy is required").max(200),
  cleanedAt: z.coerce.date({ errorMap: () => ({ message: "cleanedAt must be a valid date" }) }),
  method: z.string().trim().min(1, "method is required").max(200),
  notes: z.string().trim().max(2000).optional().nullable(),
  status: cleaningStatusSchema.optional(),
});

export const updateCleaningRecordSchema = z
  .object({
    cleanedBy: z.string().trim().min(1).max(200).optional(),
    cleanedAt: z.coerce.date({ errorMap: () => ({ message: "cleanedAt must be a valid date" }) }).optional(),
    method: z.string().trim().min(1).max(200).optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    status: cleaningStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

export const listCleaningRecordsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: cleaningStatusSchema.optional(),
});

export type CreateCleaningRecordInput = z.infer<typeof createCleaningRecordSchema>;
export type UpdateCleaningRecordInput = z.infer<typeof updateCleaningRecordSchema>;
