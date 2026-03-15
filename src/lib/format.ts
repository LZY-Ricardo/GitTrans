const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "未开始";
  }

  return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "未设置";
  }

  return dateFormatter.format(new Date(value));
}

export function formatDuration(startedAt?: string | null, finishedAt?: string | null) {
  if (!startedAt) {
    return "等待中";
  }

  const start = new Date(startedAt).getTime();
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  const diffMinutes = Math.max(1, Math.round((end - start) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours} 小时 ${minutes} 分钟`;
}
