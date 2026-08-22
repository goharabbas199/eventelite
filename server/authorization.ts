import type { NextFunction, Request, Response } from "express";
import { storage } from "./storage";
import { runWithOrganization } from "./organization-context";

export const ROLES = ["owner", "admin", "manager", "staff", "user"] as const;
export type Role = (typeof ROLES)[number];

export type Permission =
  | "users:manage"
  | "business:write"
  | "business:delete"
  | "financial:write"
  | "documents:approve"
  | "settings:manage";

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: [
    "users:manage",
    "business:write",
    "business:delete",
    "financial:write",
    "documents:approve",
    "settings:manage",
  ],
  admin: [
    "users:manage",
    "business:write",
    "business:delete",
    "financial:write",
    "documents:approve",
    "settings:manage",
  ],
  manager: ["business:write", "financial:write", "documents:approve"],
  staff: ["business:write"],
  user: [],
};

function isKnownRole(role: string): role is Role {
  return (ROLES as readonly string[]).includes(role);
}

/**
 * Authentication and authorization always use the database user, not a role
 * supplied by the browser or a potentially stale session object.
 */
export async function loadCurrentUser(req: Request) {
  if (!req.isAuthenticated() || !req.user) return undefined;
  const userId = Number((req.user as { id?: unknown }).id);
  if (!Number.isInteger(userId)) return undefined;
  return storage.getUserById(userId);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  void loadCurrentUser(req)
    .then((user) => {
      if (!user) return res.status(401).json({ message: "Not authenticated" });
       req.user = user;
       if (!user.organizationId) return res.status(403).json({ message: "User is not assigned to an organization" });
       runWithOrganization(user.organizationId, next);
    })
    .catch(next);
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    void loadCurrentUser(req)
      .then((user) => {
        if (!user) return res.status(401).json({ message: "Not authenticated" });
        req.user = user;
        if (!isKnownRole(user.role) || !allowedRoles.includes(user.role)) {
          return res.status(403).json({ message: "You do not have permission to perform this action" });
        }
        next();
      })
      .catch(next);
  };
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    void loadCurrentUser(req)
      .then((user) => {
        if (!user) return res.status(401).json({ message: "Not authenticated" });
        req.user = user;
        if (!isKnownRole(user.role) || !ROLE_PERMISSIONS[user.role].includes(permission)) {
          return res.status(403).json({ message: "You do not have permission to perform this action" });
        }
        next();
      })
      .catch(next);
  };
}