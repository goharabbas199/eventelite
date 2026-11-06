type LogLevel = "warn" | "error";

function getErrorCategory(error: unknown): string {
  if (error instanceof SyntaxError) return "syntax_error";
  if (error instanceof TypeError) return "type_error";
  if (error instanceof RangeError) return "range_error";
  if (error instanceof Error) return "application_error";
  return "unknown_error";
}

export function logSafeException(
  source: string,
  error: unknown,
  requestId?: unknown,
  level: LogLevel = "error",
): void {
  const safeRequestId =
    typeof requestId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)
      ? requestId
      : undefined;

  const entry = {
    level,
    event: "application_error",
    source,
    category: getErrorCategory(error),
    message: "Error details omitted",
    ...(safeRequestId ? { requestId: safeRequestId } : {}),
  };

  console[level](JSON.stringify(entry));
}
