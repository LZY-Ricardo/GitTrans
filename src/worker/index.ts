import { config } from "dotenv";
import { hostname } from "node:os";

// 加载环境变量
config();

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { runNextTask } from "@/modules/worker/task-runner";

const workerId = `${hostname()}-${process.pid}`;

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main() {
  logger.info({ workerId }, "Worker started");

  const runOnce = process.env.WORKER_RUN_ONCE === "1";

  if (runOnce) {
    await runNextTask(workerId);
    process.exit(0);
  }

  while (true) {
    const processed = await runNextTask(workerId);

    if (!processed) {
      await sleep(env.WORKER_POLL_INTERVAL_MS);
    }
  }
}

main().catch((error) => {
  logger.error({ err: error, workerId }, "Worker crashed");
  process.exit(1);
});
