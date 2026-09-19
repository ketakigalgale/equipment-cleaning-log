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

/**
 * Reads the "current user" from the X-Actor header. There is no real auth
 * in this app (see NOTES.md) - this is a stand-in so audit entries have a
 * plausible "changed by" instead of a hardcoded string.
 */
export function actorMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("x-actor");
  req.actor = header && header.trim().length > 0 ? header.trim() : DEFAULT_ACTOR;
  next();
}
