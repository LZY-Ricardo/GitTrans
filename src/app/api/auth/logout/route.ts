import { success } from "@/lib/api";
import { destroyCurrentSession } from "@/lib/session";

export async function POST() {
  await destroyCurrentSession();
  return success({ loggedOut: true });
}
