import { useMemo, useRef, useState } from "react";
import {
  analyzeLogs,
  hintFor,
  redactSensitive,
  summarizeRequestExecutions,
  type LogEvent,
  type LogLevel,
} from "./analyzeLogs";
import "./LogAnalyzer.css";

const example = `2026-10-29 08:19:30.283 [worker-1] [request-123] [] [operator] INFO [app.DocumentService] Document list request started
2026-10-29 08:19:30.343 [worker-1] [request-123] [] [operator] INFO [app.DocumentService] Response status: 200
2026-10-29 08:19:30.401 [worker-2] [request-123] [] [operator] ERROR [app.PaymentService] Cannot send request: connection refused
2026-10-29 08:19:30.402 [worker-2] [request-123] [] [operator] ERROR [app.PaymentService] Payment response failed`;
const levelOptions: Array<LogLevel | "ALL"> = [
  "ALL",
  "ERROR",
  "FATAL",
  "WARN",
  "INFO",
  "DEBUG",
  "TRACE",
  "OTHER",
];
const MAX_LOG_SIZE = 8 * 1024 * 1024;
const MAX_VISIBLE_EVENTS = 2000;
const QUEUE_TIMEOUT_GUIDANCE =
  "Очередь запросов переполнена: запрос не ушёл во внешнюю систему, поэтому обращаться с ним в поддержку этой системы не нужно. Выгрузите в Auxilium2 аварийные логи read timeout и slow responses, чтобы найти причину переполнения.";

function groupLabels(events: LogEvent[]) {
  const keys = [...new Set(events.map((event) => event.group))];
  return new Map(keys.map((key, index) => [key, `Группа ${index + 1}`]));
}
function countsByLevel(events: LogEvent[], level: LogLevel) {
  return events.filter((event) => event.level === level).length;
}
function durationLabel(milliseconds: number | null) {
  if (milliseconds === null) return "Не удалось вычислить по временным меткам";
  return milliseconds < 1000
    ? `${milliseconds} мс`
    : `${(milliseconds / 1000).toFixed(3).replace(".", ",")} с`;
}

export function LogAnalyzer() {
  const [input, setInput] = useState("");
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [level, setLevel] = useState<LogLevel | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const [chainGroup, setChainGroup] = useState("");
  const [contextTarget, setContextTarget] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const labels = useMemo(() => groupLabels(events), [events]);
  const filtered = useMemo(
    () =>
      events.filter(
        (event) =>
          (level === "ALL" || event.level === level) &&
          `${event.time} ${event.thread} ${event.logger} ${event.message}`
            .toLocaleLowerCase()
            .includes(query.trim().toLocaleLowerCase()),
      ),
    [events, level, query],
  );
  const visibleEvents = filtered.slice(0, MAX_VISIBLE_EVENTS);
  const failures = events.filter(
    (event) => event.level === "ERROR" || event.level === "FATAL",
  );
  const requestExecutions = useMemo(
    () => summarizeRequestExecutions(events),
    [events],
  );
  const queueTimeouts = requestExecutions.filter(
    (request) =>
      request.executionTimeMs === 0 && request.outcome.includes("Таймаут"),
  );
  const groups = [...new Set(events.map((event) => event.group))];
  const chainEvents = events.filter((event) => event.group === chainGroup);
  const errorClusters = useMemo(() => {
    const clusters = new Map<string, LogEvent[]>();
    for (const event of events.filter(
      (item) => item.level === "ERROR" || item.level === "FATAL",
    )) {
      const signature = redactSensitive(event.message)
        .replace(/:\d+\b/g, ":#")
        .replace(/\s+/g, " ")
        .trim()
        .toLocaleLowerCase();
      const occurrences = clusters.get(signature);
      if (occurrences) occurrences.push(event);
      else clusters.set(signature, [event]);
    }
    return [...clusters.entries()]
      .map(([signature, occurrences]) => ({
        signature,
        occurrences,
        groups: new Set(occurrences.map((event) => event.group)).size,
      }))
      .sort((a, b) => b.occurrences.length - a.occurrences.length);
  }, [events]);
  const contextEvents =
    contextTarget === null
      ? []
      : events.slice(
          Math.max(0, contextTarget - 4),
          Math.min(events.length, contextTarget + 3),
        );
  const hints = [
    ...new Set(
      failures
        .map((event) => hintFor(event.message))
        .filter((hint): hint is string => hint !== null),
    ),
  ];
  const timeRange = events.length
    ? `${events[0].time} — ${events[events.length - 1].time}`
    : "—";

  function runAnalysis(source = input) {
    const parsed = analyzeLogs(source);
    setEvents(parsed);
    setChainGroup(
      parsed.find((event) => event.level === "ERROR" || event.level === "FATAL")
        ?.group ??
        parsed[0]?.group ??
        "",
    );
    setContextTarget(null);
    setLevel("ALL");
    setQuery("");
    setShowRaw(false);
    setNotice(
      parsed.length
        ? `Разобрано событий: ${parsed.length}`
        : "Не удалось найти строки с датой и уровнем логирования.",
    );
  }
  function clear() {
    setInput("");
    setEvents([]);
    setQuery("");
    setLevel("ALL");
    setNotice("");
    setShowRaw(false);
    setChainGroup("");
    setContextTarget(null);
    if (fileRef.current) fileRef.current.value = "";
  }
  async function loadFile(file?: File) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setNotice("Файл больше 8 МБ. Разделите его на несколько частей.");
      return;
    }
    try {
      const text = await file.text();
      setInput(text);
      runAnalysis(text);
      setNotice(
        `Файл обработан локально · ${file.name} · ${text.length.toLocaleString("ru-RU")} символов`,
      );
    } catch {
      setNotice("Не удалось прочитать файл в браузере.");
    }
  }
  async function copySummary() {
    if (!events.length) return;
    const first = failures[0];
    const summary = [
      `Событий: ${events.length}; ERROR/FATAL: ${failures.length}; WARN: ${countsByLevel(events, "WARN")}; групп: ${labels.size}.`,
      `Временной диапазон: ${timeRange}.`,
      first
        ? `Первое ERROR/FATAL: ${first.time} · ${first.logger} · ${redactSensitive(first.message)}`
        : "Ошибок ERROR/FATAL не найдено.",
      ...requestExecutions
        .slice(0, 12)
        .map(
          (request) =>
            `${request.name}: общее время ${durationLabel(request.durationMs)}; ${request.outcome}${request.queue ? `; очередь ${request.queue}` : ""}${request.executionTimeMs !== null ? `; executionTime ${request.executionTimeMs} мс` : ""}${request.connectMs !== null ? `; connect/write/read ${request.connectMs}/${request.writeMs}/${request.readMs} мс` : ""}${request.cause ? `; ${redactSensitive(request.cause)}` : ""}.`,
        ),
      ...queueTimeouts.map(
        (request) =>
          `executionTime: 0 · ${request.name}${request.queue ? ` · очередь ${request.queue}` : ""}. ${QUEUE_TIMEOUT_GUIDANCE}`,
      ),
      ...hints.map((hint) => `Подсказка по шаблону: ${hint}`),
      "Вывод построен локальными правилами и не является подтверждённой первопричиной.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(summary);
      setNotice("Сводка скопирована. Проверьте её перед отправкой: маскирование распознаёт только известные шаблоны.");
    } catch {
      setNotice("Не удалось скопировать. Проверьте разрешения браузера.");
    }
  }

  function renderEvent(event: LogEvent, withContext = false) {
    return (
      <article
        className={`analyzer-event level-${event.level.toLowerCase()} ${contextTarget === event.index ? "context-selected" : ""}`}
        key={event.index}
      >
        <div className="event-top">
          <time>
            {event.time.replace(" (локальное время лога)", "")}
            <small>
              {event.time.endsWith("(локальное время лога)")
                ? "время лога, зона не указана"
                : ""}
            </small>
          </time>
          <span className={`level-pill level-${event.level.toLowerCase()}`}>
            {event.level}
          </span>
          <span className="event-group">{labels.get(event.group)}</span>
        </div>
        <div className="event-meta">
          <span>{event.logger}</span>
          <span>{event.thread}</span>
        </div>
        <p>{redactSensitive(event.message)}</p>
        {showRaw && <pre>{redactSensitive(event.raw)}</pre>}
        {withContext &&
          (event.level === "ERROR" || event.level === "FATAL") && (
            <button
              className="event-context-button"
              onClick={() =>
                setContextTarget(
                  contextTarget === event.index ? null : event.index,
                )
              }
            >
              {contextTarget === event.index
                ? "Скрыть контекст"
                : "Показать контекст ±3 события"}
            </button>
          )}
      </article>
    );
  }

  return (
    <section className="log-analyzer">
      <div className="analyzer-privacy">
        <span className="analyzer-lock">●</span>
        <div>
          <strong>Обработка только в этом браузере</strong>
          <p>
            Файл не отправляется, не сохраняется и не передаётся ИИ. При
            закрытии страницы данные исчезнут. Маскирование чувствительных
            значений распознаёт известные шаблоны и не гарантирует удаление всех
            секретов.
          </p>
        </div>
        <button className="analyzer-clear" onClick={clear}>
          Очистить данные
        </button>
      </div>

      <details className="analyzer-guide">
        <summary>Краткая памятка: как читать запросы и таймауты</summary>
        <div className="guide-content">
          <p>
            <strong>Сначала найдите цепочку.</strong> Сгруппируйте события по ID
            запроса и проследите путь от начала вызова до ответа или ошибки.
            Сравнивайте временные метки, компонент и поток.
          </p>
          <p>
            <strong>Общее время и фазы — разные показатели.</strong> Общее время
            в сводке считается между строками начала и завершения запроса.{" "}
            <code>connect / write / read</code> — отдельные замеры HTTP-клиента.
            Нули в этих полях сами по себе не означают, что весь запрос занял 0
            мс.
          </p>
          <ul>
            <li>
              <strong>Таймаут соединения:</strong> соединение с адресатом не
              установилось вовремя. Ищите `Connect timed out`,
              `ConnectException`, ошибки DNS или маршрута.
            </li>
            <li>
              <strong>Таймаут чтения:</strong> соединение установлено, но ответ
              не пришёл за отведённое время. Ищите `Read timed out`; сравните
              общее время с настройкой таймаута именно этого пула.
            </li>
            <li>
              <strong>Таймаут очереди:</strong> если строка содержит
              `executionTime: 0` и `poolId`, лог указывает на завершение до
              исполнения запроса. Проверьте загрузку и настройки указанной
              очереди. Время ожидания можно вычислить только если в логе есть
              момент постановки в очередь.
            </li>
          </ul>
          <p>
            <strong>Проверяйте доказательства.</strong> `Cannot send request` —
            общее сообщение, не диагноз. Ищите рядом класс причины, HTTP-статус
            и строку HTTP Timings.{" "}
          </p>
          <p className="guide-note">
            Вывод анализатора — подсказка по строкам лога. Он не знает
            фактические настройки таймаутов и не подтверждает первопричину.
          </p>
        </div>
      </details>

      <div className="analyzer-input panel">
        <div className="analyzer-title-row">
          <div>
            <span className="russia-kicker">ЛОКАЛЬНЫЙ РАЗБОР</span>
            <h2>Исходные логи</h2>
          </div>
          <span className="analyzer-char-count">
            {input.length.toLocaleString("ru-RU")} символов
          </span>
        </div>
        <textarea
          value={input}
          onChange={(event) => {
            const value = event.target.value;
            setInput(value.slice(0, MAX_LOG_SIZE));
            setNotice(
              value.length > MAX_LOG_SIZE
                ? "Вставленный текст превышает 8 МБ — лишняя часть не добавлена."
                : "",
            );
          }}
          placeholder="Вставьте текст лога сюда…"
          spellCheck={false}
          aria-label="Исходный текст лога"
        />
        <div className="analyzer-actions">
          <input
            ref={fileRef}
            type="file"
            accept=".log,.txt,text/plain"
            onChange={(event) => void loadFile(event.target.files?.[0])}
            aria-label="Выбрать локальный log файл"
          />
          <button className="primary-button" onClick={() => runAnalysis()}>
            Анализировать
          </button>
          <button
            className="secondary-button"
            onClick={() => {
              setInput(example);
              runAnalysis(example);
            }}
          >
            Загрузить пример
          </button>
        </div>
      </div>

      {notice && (
        <p className="analyzer-notice" role="status">
          {notice}
        </p>
      )}
      {events.length > 0 && (
        <>
          <div className="analyzer-metrics">
            <div>
              <span>СОБЫТИЯ</span>
              <strong>{events.length}</strong>
            </div>
            <div>
              <span>ERROR / FATAL</span>
              <strong className={failures.length ? "metric-danger" : ""}>
                {failures.length}
              </strong>
            </div>
            <div>
              <span>ПРЕДУПРЕЖДЕНИЯ</span>
              <strong>{countsByLevel(events, "WARN")}</strong>
            </div>
            <div>
              <span>ГРУППЫ ЗАПРОСОВ</span>
              <strong>{labels.size}</strong>
            </div>
          </div>
          <section className="analyzer-summary panel">
            <div className="analyzer-title-row">
              <div>
                <span className="russia-kicker">СВОДКА</span>
                <h2>Что видно в этом фрагменте</h2>
              </div>
              <button
                className="secondary-button"
                onClick={() => void copySummary()}
              >
                Копировать сводку с маскированием известных полей
              </button>
            </div>
            <p className="analyzer-range">
              Временной диапазон: <strong>{timeRange}</strong>
            </p>
            {failures[0] ? (
              <div className="first-failure">
                <span>
                  ПЕРВАЯ ОШИБКА ВО ФРАГМЕНТЕ · {failures[0].time} ·{" "}
                  {failures[0].logger}
                </span>
                <p>{redactSensitive(failures[0].message)}</p>
              </div>
            ) : (
              <p className="analyzer-no-errors">
                Событий ERROR или FATAL не найдено.
              </p>
            )}
            {queueTimeouts.length > 0 && (
              <div className="queue-timeout-summary">
                <strong>Обнаружен таймаут очереди · executionTime: 0</strong>
                <ul>
                  {queueTimeouts.map((request, index) => (
                    <li key={`${request.name}-${request.queue}-${index}`}>
                      {request.name}
                      {request.queue ? ` · очередь ${request.queue}` : ""}
                    </li>
                  ))}
                </ul>
                <p>{QUEUE_TIMEOUT_GUIDANCE}</p>
              </div>
            )}
            {hints.length > 0 && (
              <div className="analyzer-hints">
                <strong>Подсказки по совпавшим шаблонам</strong>
                {hints.map((hint) => (
                  <p key={hint}>{hint}</p>
                ))}
              </div>
            )}
            <p className="analyzer-limit">
              Это только совпадения с заранее заданными правилами. Подсказки
              помогают проверить направление поиска и не подтверждают
              первопричину.
            </p>
          </section>
          <section className="analyzer-executions panel">
            <div className="analyzer-title-row">
              <div>
                <span className="russia-kicker">ВРЕМЯ ВЫЗОВОВ</span>
                <h2>Исполнение запросов</h2>
              </div>
              <span className="analyzer-char-count">
                {requestExecutions.length} вызовов
              </span>
            </div>
            <p className="analyzer-limit">
              Общее время — разница временных меток начала и завершения в логе.
              Connect/write/read — отдельные значения из строки HTTP Timings;
              ноль там означает, что лог записал 0 мс для этой фазы.
            </p>
            {requestExecutions.length ? (
              <div className="execution-list">
                {requestExecutions.slice(0, 30).map((request, index) => (
                  <article
                    className={`execution-card ${request.outcome.includes("Таймаут") || request.outcome.includes("Ошибка") ? "execution-failed" : ""}`}
                    key={`${request.group}-${request.thread}-${request.name}-${index}`}
                  >
                    <div className="execution-card-heading">
                      <strong>{request.name}</strong>
                      <span className="execution-outcome">
                        {request.outcome}
                      </span>
                    </div>
                    <div className="execution-facts">
                      <span>
                        <small>ПО ВРЕМЕНИ ЛОГА</small>
                        <b>{durationLabel(request.durationMs)}</b>
                      </span>
                      {request.connectMs !== null && (
                        <span>
                          <small>CONNECT / WRITE / READ</small>
                          <b>
                            {request.connectMs} / {request.writeMs} /{" "}
                            {request.readMs} мс
                          </b>
                        </span>
                      )}
                      {request.executionTimeMs !== null && (
                        <span>
                          <small>EXECUTION TIME</small>
                          <b>{request.executionTimeMs} мс</b>
                        </span>
                      )}
                      {request.queue && (
                        <span>
                          <small>ОЧЕРЕДЬ / ПУЛ</small>
                          <b>{request.queue}</b>
                        </span>
                      )}
                      {request.status && (
                        <span>
                          <small>HTTP</small>
                          <b>{request.status}</b>
                        </span>
                      )}
                    </div>
                    {request.cause && (
                      <p className="execution-cause">
                        {redactSensitive(request.cause)}
                      </p>
                    )}
                    {request.executionTimeMs === 0 &&
                      request.outcome.includes("Таймаут") && (
                        <p className="execution-interpretation">
                          executionTime: 0 означает переполнение очереди
                          запросов: этот запрос не ушёл во внешнюю систему.
                          Передавать его поддержке внешней системы смысла нет. В
                          Auxilium2 выгрузите аварийные логи read timeout и slow
                          responses, чтобы выяснить, что привело к переполнению
                          очереди.
                        </p>
                      )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="analyzer-empty">
                Строки начала/завершения запросов и HTTP Timings не найдены в
                поддерживаемом формате.
              </p>
            )}
            {requestExecutions.length > 30 && (
              <p className="analyzer-limit">Показаны первые 30 запросов.</p>
            )}
          </section>
          {errorClusters.length > 0 && (
            <section className="analyzer-clusters panel">
              <div className="analyzer-title-row">
                <div>
                  <span className="russia-kicker">ПОВТОРЫ</span>
                  <h2>Группы одинаковых ошибок</h2>
                </div>
                <span className="analyzer-char-count">
                  {errorClusters.length} типов
                </span>
              </div>
              <div className="cluster-list">
                {errorClusters.slice(0, 12).map((cluster) => (
                  <button
                    className="error-cluster"
                    key={cluster.signature}
                    onClick={() => {
                      setChainGroup(cluster.occurrences[0].group);
                      document
                        .getElementById("analyzer-chain")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }}
                  >
                    <span className="cluster-count">
                      {cluster.occurrences.length}×
                    </span>
                    <span className="cluster-message">
                      <strong>{cluster.occurrences[0].logger}</strong>
                      <span>
                        {redactSensitive(cluster.occurrences[0].message)}
                      </span>
                    </span>
                    <span className="cluster-times">
                      {cluster.occurrences[0].time.replace(
                        " (локальное время лога)",
                        "",
                      )}
                      <small>
                        последнее:{" "}
                        {cluster.occurrences[
                          cluster.occurrences.length - 1
                        ].time.replace(" (локальное время лога)", "")}
                      </small>
                    </span>
                    <span className="cluster-groups">
                      {cluster.groups} групп
                    </span>
                  </button>
                ))}
              </div>
              {errorClusters.length > 12 && (
                <p className="analyzer-limit">
                  Показаны первые 12 типов ошибок по числу повторов.
                </p>
              )}
            </section>
          )}
          <section className="analyzer-chain panel" id="analyzer-chain">
            <div className="analyzer-title-row">
              <div>
                <span className="russia-kicker">СВЯЗАННЫЕ СОБЫТИЯ</span>
                <h2>Цепочка запроса</h2>
              </div>
              <label className="chain-picker">
                Группа
                <select
                  value={chainGroup}
                  onChange={(event) => setChainGroup(event.target.value)}
                >
                  {groups.map((group) => (
                    <option key={group} value={group}>
                      {labels.get(group)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="analyzer-event-list">
              {chainEvents.length ? (
                chainEvents.map((event) => renderEvent(event))
              ) : (
                <p className="analyzer-empty">
                  Выберите группу, чтобы увидеть события.
                </p>
              )}
            </div>
          </section>
          <section className="analyzer-events panel">
            <div className="analyzer-title-row">
              <div>
                <span className="russia-kicker">ХРОНОЛОГИЯ</span>
                <h2>События</h2>
              </div>
              <span className="analyzer-char-count">
                Показано {visibleEvents.length} из {filtered.length} найденных ·
                всего {events.length}
              </span>
            </div>
            <div className="analyzer-filters">
              <label>
                Уровень
                <select
                  value={level}
                  onChange={(event) =>
                    setLevel(event.target.value as LogLevel | "ALL")
                  }
                >
                  {levelOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "ALL" ? "Все уровни" : option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Поиск
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Компонент, сообщение, поток…"
                />
              </label>
              <label className="raw-toggle">
                <input
                  type="checkbox"
                  checked={showRaw}
                  onChange={(event) => setShowRaw(event.target.checked)}
                />{" "}
                Показать строку с маскированием
              </label>
            </div>
            {filtered.length > MAX_VISIBLE_EVENTS && (
              <p className="analyzer-limit">
                Показаны первые {MAX_VISIBLE_EVENTS.toLocaleString("ru-RU")}{" "}
                события. Уточните фильтр, чтобы увидеть нужный участок.
              </p>
            )}
            <div className="analyzer-event-list">
              {visibleEvents.map((event) => renderEvent(event, true))}
              {filtered.length === 0 && (
                <p className="analyzer-empty">
                  События не найдены по выбранным фильтрам.
                </p>
              )}
            </div>
            {contextTarget !== null && (
              <div className="event-context">
                <div className="analyzer-title-row">
                  <div>
                    <span className="russia-kicker">ОКРУЖЕНИЕ ОШИБКИ</span>
                    <h2>События до и после · ±3</h2>
                  </div>
                  <button
                    className="context-close"
                    onClick={() => setContextTarget(null)}
                  >
                    Закрыть
                  </button>
                </div>
                <div className="analyzer-event-list">
                  {contextEvents.map((event) => renderEvent(event))}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
