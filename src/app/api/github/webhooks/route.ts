import { AppError } from "@/lib/errors";
import { failure, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { enqueueIncrementalTaskForWebhook } from "@/modules/worker/task-runner";
import { verifyWebhookSignature } from "@/modules/github/github-service";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? undefined;
  const deliveryId = request.headers.get("x-github-delivery");
  const eventName = request.headers.get("x-github-event") ?? "unknown";

  if (!deliveryId) {
    return failure(new AppError("WEBHOOK_DELIVERY_MISSING", 400, "缺少 delivery id"));
  }

  if (!verifyWebhookSignature(payload, signature)) {
    return failure(new AppError("WEBHOOK_SIGNATURE_INVALID", 401, "Webhook 签名无效"));
  }

  const existing = await prisma.webhookDelivery.findUnique({
    where: { deliveryId }
  });

  if (existing) {
    return success({
      duplicated: true
    });
  }

  const record = await prisma.webhookDelivery.create({
    data: {
      deliveryId,
      eventName,
      status: "received"
    }
  });

  const json = JSON.parse(payload) as {
    installation?: { id?: number };
    repository?: { full_name?: string };
    ref?: string;
  };

  if (eventName === "push" && json.repository?.full_name) {
    const repo = await prisma.repository.findUnique({
      where: { fullName: json.repository.full_name }
    });

    if (repo && json.ref === `refs/heads/${repo.baseBranch}`) {
      await enqueueIncrementalTaskForWebhook(repo.id);
    }
  }

  await prisma.webhookDelivery.update({
    where: { id: record.id },
    data: {
      installationId: json.installation?.id ? String(json.installation.id) : null,
      repoFullName: json.repository?.full_name ?? null,
      status: "processed",
      processedAt: new Date()
    }
  });

  return success({
    received: true
  });
}
