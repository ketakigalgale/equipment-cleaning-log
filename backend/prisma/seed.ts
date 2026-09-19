import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.cleaningRecord.deleteMany();
  await prisma.equipment.deleteMany();

  const tabletPress = await prisma.equipment.create({
    data: { name: "Tablet Press #1", code: "TP-001", status: "ACTIVE" },
  });

  const granulator = await prisma.equipment.create({
    data: { name: "High Shear Granulator", code: "HSG-002", status: "ACTIVE" },
  });

  await prisma.equipment.create({
    data: { name: "Blister Packer (decommissioned)", code: "BP-003", status: "RETIRED" },
  });

  const seedRecord = async (
    equipmentId: string,
    overrides: Partial<{
      cleanedBy: string;
      cleanedAt: Date;
      method: string;
      notes: string;
      status: "PENDING" | "VERIFIED";
    }>,
  ) => {
    const record = await prisma.cleaningRecord.create({
      data: {
        equipmentId,
        cleanedBy: overrides.cleanedBy ?? "A. Sharma",
        cleanedAt: overrides.cleanedAt ?? new Date(),
        method: overrides.method ?? "Wet cleaning (WFI rinse)",
        notes: overrides.notes ?? null,
        status: overrides.status ?? "PENDING",
      },
    });

    await prisma.auditLog.createMany({
      data: [
        { cleaningRecordId: record.id, action: "CREATE", changedBy: record.cleanedBy, field: "cleanedBy", oldValue: null, newValue: record.cleanedBy },
        { cleaningRecordId: record.id, action: "CREATE", changedBy: record.cleanedBy, field: "method", oldValue: null, newValue: record.method },
        { cleaningRecordId: record.id, action: "CREATE", changedBy: record.cleanedBy, field: "status", oldValue: null, newValue: record.status },
      ],
    });

    return record;
  };

  await seedRecord(tabletPress.id, {
    cleanedBy: "A. Sharma",
    method: "Wet cleaning (WFI rinse)",
    status: "VERIFIED",
    notes: "Routine changeover clean.",
  });

  const pendingRecord = await seedRecord(tabletPress.id, {
    cleanedBy: "R. Iyer",
    method: "Dry cleaning (vacuum + wipe)",
    status: "PENDING",
  });

  // Give one record a second audit entry so the seeded data demonstrates
  // an UPDATE (not just the initial CREATE) in the audit trail.
  const updated = await prisma.cleaningRecord.update({
    where: { id: pendingRecord.id },
    data: { status: "VERIFIED", notes: "Verified after re-inspection." },
  });
  await prisma.auditLog.createMany({
    data: [
      { cleaningRecordId: updated.id, action: "UPDATE", changedBy: "S. Kulkarni", field: "status", oldValue: "PENDING", newValue: "VERIFIED" },
      { cleaningRecordId: updated.id, action: "UPDATE", changedBy: "S. Kulkarni", field: "notes", oldValue: null, newValue: "Verified after re-inspection." },
    ],
  });

  await seedRecord(granulator.id, {
    cleanedBy: "R. Iyer",
    method: "CIP (clean-in-place)",
    status: "PENDING",
  });

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
