import { AsyncLocalStorage } from "node:async_hooks";

const organizationStorage = new AsyncLocalStorage<number>();

export function runWithOrganization<T>(organizationId: number, callback: () => T): T {
  return organizationStorage.run(organizationId, callback);
}

export function getOrganizationId(): number | undefined {
  return organizationStorage.getStore();
}