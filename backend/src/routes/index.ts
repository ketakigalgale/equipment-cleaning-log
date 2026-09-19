import { Router } from "express";
import { equipmentRouter } from "./equipment.routes";
import { cleaningRecordsRouter, nestedCleaningRecordsRouter } from "./cleaningRecords.routes";

export const apiRouter = Router();

// Registered before /equipment so /equipment/:id/cleaning-records is matched
// as the nested resource rather than falling into /equipment/:id.
apiRouter.use("/equipment/:equipmentId/cleaning-records", nestedCleaningRecordsRouter);
apiRouter.use("/equipment", equipmentRouter);
apiRouter.use("/cleaning-records", cleaningRecordsRouter);
