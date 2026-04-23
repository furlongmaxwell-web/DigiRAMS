import { prisma } from "./prisma";

interface AuditLogParams {
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entityType: string;
  entityId: string;
  entityTitle?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Logs an audit event to the database.
 * Fire-and-forget — errors are swallowed so they never break the main flow.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        entityTitle: params.entityTitle ?? null,
        details: JSON.stringify(params.details ?? {}),
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write audit log:", err);
  }
}

/**
 * Compares old and new data objects, returning a summary of changes.
 * Only includes fields that actually differ.
 */
export function diffChanges(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
): { changed: boolean; changes: Record<string, { old: unknown; new: unknown }> } {
  const changes: Record<string, { old: unknown; new: unknown }> = {};

  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    const oldVal = oldData[key];
    const newVal = newData[key];

    // Deep-compare JSON stringified values to handle nested objects/arrays
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[key] = { old: oldVal, new: newVal };
    }
  }

  return {
    changed: Object.keys(changes).length > 0,
    changes,
  };
}
