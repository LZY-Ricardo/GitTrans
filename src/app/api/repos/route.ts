import { handleRoute } from "@/lib/api";
import { requireCurrentUser } from "@/lib/session";
import { listRepositoriesForUser } from "@/modules/repos/repo-service";

export async function GET() {
  return handleRoute(async () => {
    const user = await requireCurrentUser();
    return {
      items: await listRepositoriesForUser(user.id)
    };
  });
}
