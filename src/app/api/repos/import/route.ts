import { z } from "zod";

import { handleRoute } from "@/lib/api";
import { requireCurrentUser } from "@/lib/session";
import { importRepositoryForUser } from "@/modules/repos/repo-service";

const ImportRepositorySchema = z.object({
  installationId: z.string().min(1),
  owner: z.string().min(1),
  name: z.string().min(1)
});

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireCurrentUser();
    const body = ImportRepositorySchema.parse(await request.json());
    const repo = await importRepositoryForUser({
      userId: user.id,
      installationId: body.installationId,
      owner: body.owner,
      name: body.name
    });

    return {
      repo: {
        id: repo.id,
        fullName: repo.fullName,
        defaultBranch: repo.defaultBranch,
        status: repo.status
      }
    };
  });
}
