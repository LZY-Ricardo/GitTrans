import { success } from "@/lib/api";
import { LANGUAGE_OPTIONS, MODEL_OPTIONS } from "@/modules/catalog/bootstrap";

export async function GET() {
  return success({
    languages: LANGUAGE_OPTIONS,
    models: MODEL_OPTIONS,
    features: {
      byokEnabled: false,
      autoSyncEnabled: false
    }
  });
}
