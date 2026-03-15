import { NextResponse } from "next/server";

import { AppError, isAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export function getRequestId() {
  return crypto.randomUUID();
}

export function success<T>(data: T, status = 200, requestId = getRequestId()) {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
      requestId,
    },
    { status },
  );
}

export function failure(
  error: AppError,
  requestId = getRequestId(),
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code: error.code,
        message: error.message,
        ...extra,
      },
      requestId,
    },
    { status: error.status },
  );
}

export async function handleRoute<T>(
  action: (requestId: string) => Promise<T>,
) {
  const requestId = getRequestId();

  try {
    const data = await action(requestId);
    return success(data, 200, requestId);
  } catch (error) {
    if (isAppError(error)) {
      return failure(error, requestId);
    }

    logger.error({ err: error, requestId }, "Unhandled route error");
    return failure(
      new AppError("INTERNAL_ERROR", 500, "服务内部错误"),
      requestId,
    );
  }
}
