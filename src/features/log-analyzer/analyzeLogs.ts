export type LogLevel =
  | "TRACE"
  | "DEBUG"
  | "INFO"
  | "WARN"
  | "ERROR"
  | "FATAL"
  | "OTHER";
export type LogEvent = {
  index: number;
  time: string;
  level: LogLevel;
  thread: string;
  logger: string;
  group: string;
  message: string;
  raw: string;
};
export type RequestExecution = {
  name: string;
  group: string;
  thread: string;
  startTime: string;
  endTime: string | null;
  durationMs: number | null;
  connectMs: number | null;
  writeMs: number | null;
  readMs: number | null;
  executionTimeMs: number | null;
  queue: string | null;
  status: string | null;
  cause: string | null;
  outcome: string;
};
const LEVEL_RE =
  /\b(TRACE|DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL|CRITICAL|SEVERE)\b/i;
const UUID_RE = /\b[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}\b/i;

export function redactSensitive(value: string): string {
  const serviceAddresses: string[] = [];
  let safe = value.replace(/https?:\/\/[^\s"'<>]+/gi, (address) => {
    const cleaned = address
      .replace(/(https?:\/\/)[^/@\s]+:[^/@\s]+@/i, "$1[скрыто]@")
      .replace(
        /([?&](?:access[-_]?token|refresh[-_]?token|session[-_]?key|token|api[-_]?key|client[-_]?secret|password|authorization|signature)=)[^&#\s]*/gi,
        "$1[скрыто]",
      );
    const index = serviceAddresses.push(cleaned) - 1;
    return `__SERVICE_ADDRESS_${index}__`;
  });
  safe = safe
    .replace(/(authorization\s*[:=]\s*)(?:bearer\s+)?[^\s,;]+/gi, "$1[скрыто]")
    .replace(
      /((?:session[-_ ]?key|access[-_ ]?token|refresh[-_ ]?token|api[-_ ]?key|client[-_ ]?secret|secret[-_ ]?key|private[-_ ]?key|credential|jwt|id[-_ ]?token|password|passwd|secret|cookie|client-session-key|userLogin|login|(?:x-)?(?:operator|elk|sso)[-_ ]?login|accountId|svcNum|phone|email)\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;}]+)/gi,
      "$1[скрыто]",
    )
    .replace(
      /("(?:cookie|authorization|client-session-key|userLogin|login|(?:x-)?(?:operator|elk|sso)[-_ ]?login|accountId|svcNum|token|access[-_]?token|refresh[-_]?token|session[-_]?key|api[-_]?key|client[-_]?secret|secret[-_]?key|private[-_]?key|credential|jwt|id[-_ ]?token|password|phone|email)"\s*:\s*)(?:"[^"]*"|[^,}\s]+)/gi,
      '$1"[скрыто]"',
    )
    .replace(
      /(?:\+7|8)[\s()-]?\d{3}[\s()-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/g,
      "[телефон скрыт]",
    )
    .replace(UUID_RE, "[ID запроса]")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[IP-адрес]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[почта]")
    .replace(/\b\d{8,}\b/g, "[номер скрыт]");
  return safe.replace(
    /__SERVICE_ADDRESS_(\d+)__/g,
    (_, index: string) => serviceAddresses[Number(index)] ?? "[адрес сервиса]",
  );
}

function levelFrom(value: string): LogLevel {
  const level = value.toUpperCase();
  if (level === "WARNING") return "WARN";
  if (level === "CRITICAL" || level === "SEVERE") return "FATAL";
  return ["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL"].includes(level)
    ? (level as LogLevel)
    : "OTHER";
}

export function analyzeLogs(input: string): LogEvent[] {
  const events: LogEvent[] = [];
  for (const line of input.replace(/\r\n?/g, "\n").split("\n")) {
    if (!line.trim()) continue;
    const timeMatch = line.match(
      /^(\d{4}-\d\d-\d\d[ T]\d\d:\d\d:\d\d(?:[.,]\d{1,6})?)/,
    );
    const levelMatch = line.match(LEVEL_RE);
    if (!timeMatch || !levelMatch) {
      if (events.length) {
        events[events.length - 1].raw += `\n${line}`;
        events[events.length - 1].message += `\n${line}`;
      }
      continue;
    }

    const beforeLevel = line.slice(timeMatch[0].length, levelMatch.index);
    const bracketParts = [...beforeLevel.matchAll(/\[([^\]]*)\]/g)].map(
      (match) => match[1],
    );
    const loggerPart = line.slice(
      (levelMatch.index ?? 0) + levelMatch[0].length,
    );
    const loggerMatch = loggerPart.match(/^\s*\[([^\]]+)\]/);
    const message = loggerMatch
      ? loggerPart.slice(loggerMatch[0].length).trim()
      : loggerPart.trim();
    const uuid = line.match(UUID_RE)?.[0];
    const requestTag = line.match(
      /(?:request|trace|correlation)[-_ ]?id\s*[:=]\s*([\w.-]+)/i,
    )?.[1];
    const groupKey =
      uuid ?? requestTag ?? bracketParts[1] ?? `event-${events.length + 1}`;
    let date = timeMatch[1].replace(" ", "T").replace(",", ".");
    if (!/[+-]\d\d:\d\d$|Z$/i.test(date)) date += " (локальное время лога)";
    events.push({
      index: events.length + 1,
      time: date,
      level: levelFrom(levelMatch[1]),
      thread: bracketParts[0] ?? "—",
      logger: loggerMatch?.[1] ?? "—",
      group: groupKey,
      message,
      raw: line,
    });
  }
  return events;
}

function timestampMs(value: string) {
  return Date.parse(value.replace(" (локальное время лога)", ""));
}

function requestNameIn(value: string) {
  const name = value.match(
    /(?:Request|Response|Error)(?:\.URL)?\[([A-Za-z0-9_]+)/,
  )?.[1];
  if (name) return name.replace(/Response$/, "Request");
  return value.match(/reqType=["']([^"']+)["']/i)?.[1] ?? "Запрос";
}

export function summarizeRequestExecutions(
  events: LogEvent[],
): RequestExecution[] {
  const requests: RequestExecution[] = [];
  const active = new Map<string, RequestExecution>();
  const activeByName = new Map<string, RequestExecution>();
  for (const event of events) {
    const raw = event.raw;
    const requestName = requestNameIn(raw);
    const key = `${event.group}|${event.thread}`;
    const isStart = />>> ASR Request\[/.test(raw);
    let current = active.get(key);
    if (isStart) {
      current = {
        name: requestName,
        group: event.group,
        thread: event.thread,
        startTime: event.time,
        endTime: null,
        durationMs: null,
        connectMs: null,
        writeMs: null,
        readMs: null,
        executionTimeMs: null,
        queue: null,
        status: null,
        cause: null,
        outcome: "Выполняется",
      };
      requests.push(current);
      active.set(key, current);
      activeByName.set(`${key}|${current.name}`, current);
    } else if (
      current &&
      /(?:Request|Response|Error)\[/.test(raw) &&
      current.name !== requestName &&
      requestName !== "Запрос"
    ) {
      current = activeByName.get(`${key}|${requestName}`) ?? current;
    }

    const queue = raw.match(/poolId:\s*([\w.-]+)(?:->[^,\s]+)?/i)?.[1];
    const executionTime = raw.match(/executionTime:\s*(\d+(?:\.\d+)?)/i)?.[1];
    const timings = raw.match(
      /connect time:\s*(\d+(?:\.\d+)?)\s*,\s*write time:\s*(\d+(?:\.\d+)?)\s*,\s*read time:\s*(\d+(?:\.\d+)?)/i,
    );
    const isQueueTimeout =
      /timeout error/i.test(raw) && executionTime !== undefined;
    if (!current && isQueueTimeout) {
      current = {
        name: requestName,
        group: event.group,
        thread: event.thread,
        startTime: event.time,
        endTime: event.time,
        durationMs: null,
        connectMs: null,
        writeMs: null,
        readMs: null,
        executionTimeMs: Number(executionTime),
        queue: queue ?? null,
        status: null,
        cause: "Таймаут до выполнения запроса (executionTime указан в строке)",
        outcome: "Таймаут очереди",
      };
      requests.push(current);
      continue;
    }
    if (!current) continue;
    if (queue) current.queue = queue;
    if (executionTime !== undefined)
      current.executionTimeMs = Number(executionTime);
    if (timings) {
      current.connectMs = Number(timings[1]);
      current.writeMs = Number(timings[2]);
      current.readMs = Number(timings[3]);
    }
    const status = raw.match(
      /(?:responseStatus|HTTP\s+status|status)\s*[:=]\s*(\d{3})/i,
    )?.[1];
    if (status) current.status = status;
    const cause =
      raw.match(/initialCause:\s*(.+)$/i)?.[1] ??
      raw.match(
        /(SocketTimeoutException:\s*Read timed out|ConnectException:[^,\n]*|UnknownHostException:[^,\n]*)/i,
      )?.[1];
    if (cause && cause !== "{}") current.cause = redactSensitive(cause.trim());
    if (/Read timed out/i.test(raw)) current.outcome = "Таймаут чтения ответа";
    else if (/timeout error/i.test(raw) && current.executionTimeMs === 0)
      current.outcome = "Таймаут ожидания в очереди";
    else if (
      /Cannot send request|connection refused|UnknownHostException|ConnectException/i.test(
        raw,
      )
    )
      current.outcome = "Ошибка отправки запроса";
    else if (/<<< ASR Response\[/i.test(raw)) current.outcome = "Ответ получен";
    if (/Cannot send request|<<< ASR Error|<<< ASR Response\[/i.test(raw)) {
      current.endTime = event.time;
      if (current.startTime && current.endTime) {
        const elapsed =
          timestampMs(current.endTime) - timestampMs(current.startTime);
        current.durationMs =
          Number.isFinite(elapsed) && elapsed >= 0 ? elapsed : null;
      }
    }
    if (/<<< ASR Error|<<< ASR Response\[/i.test(raw)) {
      activeByName.delete(`${key}|${current.name}`);
      if (active.get(key) === current) active.delete(key);
    }
  }
  return requests;
}

export function hintFor(message: string): string | null {
  if (
    /unknownhost|name or service not known|could not resolve|dns/i.test(message)
  )
    return "В тексте есть признаки ошибки DNS. Сверьте разрешение имени сервиса на узле приложения.";
  if (
    /cannot send request|connection refused|connectexception|no route to host|connection reset|socketexception/i.test(
      message,
    )
  )
    return "В тексте есть признаки сбоя исходящего соединения (СЕТЬ. Проверьте маршрут, порт, доступность адресата и сетевые правила.";
  if (/timeout|timed out|read timed out/i.test(message))
    return "В тексте есть признак тайм-аута. Сопоставьте длительность запроса с тайм-аутами вызывающей и принимающей сторон.";
  if (/ssl|tls|certificate|handshake/i.test(message))
    return "В тексте есть признак ошибки TLS. Проверьте сертификат, цепочку доверия и настройки handshake.";
  if (/deadlock|sqlstate|ora-\d+|database|jdbc/i.test(message))
    return "В тексте есть признак ошибки базы данных. Проверьте код ошибки БД и соседние события.";
  if (
    /\b5\d\d\b|internal server error|bad gateway|service unavailable/i.test(
      message,
    )
  )
    return "В тексте есть признак HTTP-ошибки сервера. Сопоставьте время с логами вызываемого сервиса или шлюза.";
  return null;
}
