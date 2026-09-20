import { Router } from "express";
import { equipmentRouter } from "./equipment.routes";
import { cleaningRecordsRouter, nestedCleaningRecordsRouter } from "./cleaningRecords.routes";

export const apiRouter = Router();

apiRouter.use("/equipment/:equipmentId/cleaning-records", nestedCleaningRecordsRouter);
apiRouter.use("/equipment", equipmentRouter);
apiRouter.use("/cleaning-records", cleaningRecordsRouter);
