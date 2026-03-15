import { handleRoute } from "@/lib/api";
import { requireCurrentUser } from "@/lib/session";
import { getRepositoryConfig, updateRepositoryConfig } from "@/modules/repos/repo-service";

type Params = Promise<{ repoId: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params }
) {
  return handleRoute(async () => {
    const user = await requireCurrentUser();
    const { repoId } = await params;
    return getRepositoryConfig(repoId, user.id);
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Params }
) {
  return handleRoute(async () => {
    const user = await requireCurrentUser();
    const { repoId } = await params;
    return updateRepositoryConfig({
      repoId,
      userId: user.id,
      input: await request.json()
    });
  });
}
