import { NextFunction, Request, Response } from "express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      actor: string;
    }
  }
}

const DEFAULT_ACTOR = "Unknown User";

export function actorMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("x-actor");
  req.actor = header && header.trim().length > 0 ? header.trim() : DEFAULT_ACTOR;
  next();
}
