import { handleRoute } from "@/lib/api";
import { requireCurrentUser } from "@/lib/session";
import { getTaskProgress } from "@/modules/tasks/task-service";

type Params = Promise<{ taskId: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params }
) {
  return handleRoute(async () => {
    const user = await requireCurrentUser();
    const { taskId } = await params;
    return getTaskProgress(taskId, user.id);
  });
}
