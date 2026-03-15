import { handleRoute } from "@/lib/api";
import { requireCurrentUser } from "@/lib/session";
import { listAccessibleInstallationsForUser } from "@/modules/repos/repo-service";

export async function GET() {
  return handleRoute(async () => {
    const user = await requireCurrentUser();
    return {
      items: await listAccessibleInstallationsForUser(user.id)
    };
  });
}
