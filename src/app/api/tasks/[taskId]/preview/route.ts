import { AppError } from "@/lib/errors";
import { handleRoute } from "@/lib/api";
import { requireCurrentUser } from "@/lib/session";
import { getTaskPreview } from "@/modules/tasks/task-service";

type Params = Promise<{ taskId: string }>;

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  return handleRoute(async () => {
    const user = await requireCurrentUser();
    const { taskId } = await params;
    const url = new URL(request.url);
    const path = url.searchParams.get("path");
    const lang = url.searchParams.get("lang");

    if (!path || !lang) {
      throw new AppError("INVALID_QUERY", 400, "path 和 lang 为必填参数");
    }

    return getTaskPreview({
      taskId,
      userId: user.id,
      path,
      lang
    });
  });
}
