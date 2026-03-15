import { handleRoute } from "@/lib/api";
import { requireCurrentUser } from "@/lib/session";
import { getRepositoryFiles } from "@/modules/repos/repo-service";

type Params = Promise<{ repoId: string }>;

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  return handleRoute(async () => {
    const user = await requireCurrentUser();
    const { repoId } = await params;
    const url = new URL(request.url);
    const ref = url.searchParams.get("ref") ?? undefined;
    return getRepositoryFiles(repoId, user.id, ref);
  });
}
