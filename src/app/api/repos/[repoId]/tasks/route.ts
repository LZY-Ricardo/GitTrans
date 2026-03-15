import { TaskType } from "@prisma/client";
import { z } from "zod";

import { handleRoute } from "@/lib/api";
import { requireCurrentUser } from "@/lib/session";
import { createTask, listTasksForRepository } from "@/modules/tasks/task-service";

type Params = Promise<{ repoId: string }>;

const CreateTaskSchema = z.object({
  type: z.nativeEnum(TaskType)
});

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  return handleRoute(async () => {
    const user = await requireCurrentUser();
    const { repoId } = await params;
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "20");

    return listTasksForRepository({
      repoId,
      userId: user.id,
      page,
      pageSize
    });
  });
}

export async function POST(
  request: Request,
  { params }: { params: Params }
) {
  return handleRoute(async () => {
    const user = await requireCurrentUser();
    const { repoId } = await params;
    const body = CreateTaskSchema.parse(await request.json());
    const task = await createTask({
      repoId,
      userId: user.id,
      type: body.type
    });

    return {
      taskId: task.id,
      status: task.status
    };
  });
}
