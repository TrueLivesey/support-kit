import { useEffect, useState } from "react";
import "./App.css";
import { TicketFormatter } from "./features/ticket-formatter/TicketFormatter";
import { LogFormatter } from "./features/log-formatter/LogFormatter";
import { JsonFormatter } from "./features/json-formatter/JsonFormatter";
import { TimestampConverter } from "./features/timestamp-converter/TimestampConverter";
import { RussiaTimeZones } from "./features/russia-time-zones/RussiaTimeZones";
import { PaymentFormatter } from "./features/payment-formatter/PaymentFormatter";

const tools = [
  {
    id: "tickets",
    title: "Форматирование заявок",
    description: "Преобразование строк в удобный формат",
    category: "Заявки",
    icon: "▤",
  },
  {
    id: "payments",
    title: "Начисления и платежи",
    description: "Форматирование списка платежей и начислений",
    category: "Начисления и платежи",
    icon: "₽",
  },
  {
    id: "logs",
    title: "Форматирование логов",
    description: "Подготовка логов с сохранением переносов строк",
    category: "Логи",
    icon: "⌘",
  },
  {
    id: "json",
    title: "JSON Formatter",
    description: "Проверка и форматирование JSON",
    category: "Данные",
    icon: "{}",
  },
  {
    id: "timestamp",
    title: "Конвертер времени",
    description: "Преобразование Unix Timestamp в дату",
    category: "Данные",
    icon: "◷",
  },
  {
    id: "russia-time-zones",
    title: "Часовые пояса России",
    description: "Перевод времени инцидента и справочник часовых зон",
    category: "Данные",
    icon: "◷",
  },
];

function App() {
  const [activeTool, setActiveTool] = useState<string | null>(() => {
    const routeId = window.location.hash.match(/^#\/tools\/([^/]+)$/)?.[1];
    return routeId && tools.some((tool) => tool.id === routeId)
      ? routeId
      : null;
  });

  useEffect(() => {
    const syncRoute = () => {
      const routeId = window.location.hash.match(/^#\/tools\/([^/]+)$/)?.[1];
      setActiveTool(
        routeId && tools.some((tool) => tool.id === routeId) ? routeId : null,
      );
    };
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  const navigate = (toolId: string | null) => {
    const nextHash = toolId ? `#/tools/${toolId}` : "#/";
    if (window.location.hash !== nextHash) window.location.hash = nextHash;
    setActiveTool(toolId);
  };

  const selectedTool = tools.find((tool) => tool.id === activeTool);

  return (
    <div className="app">
      <aside className="sidebar">
        <a className="logo" href="/">
          <span className="logo-icon">SK</span>
          <span>SupportKit</span>
        </a>

        <div className="sidebar-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>

        <nav className="navigation">
          <button
            className={`nav-item ${activeTool === null ? "active" : ""}`}
            onClick={() => navigate(null)}
          >
            <span>▦</span>
            Все инструменты
          </button>

          <div className="nav-group">
            <span className="nav-group-title">Заявки</span>
            <button
              className={`nav-item ${activeTool === "tickets" ? "active" : ""}`}
              onClick={() => navigate("tickets")}
            >
              <span>▤</span>
              Форматирование
            </button>
          </div>

          <div className="nav-group">
            <span className="nav-group-title">Логи</span>
            <button
              className={`nav-item ${activeTool === "logs" ? "active" : ""}`}
              onClick={() => navigate("logs")}
            >
              <span>⌘</span>
              Форматирование логов
            </button>
          </div>

          <div className="nav-group">
            <span className="nav-group-title">Начисления и платежи</span>
            <button
              className={`nav-item ${activeTool === "payments" ? "active" : ""}`}
              onClick={() => navigate("payments")}
            >
              <span>₽</span>
              Форматирование
            </button>
          </div>

          <div className="nav-group">
            <span className="nav-group-title">Данные</span>
            {tools
              .filter((tool) => tool.category === "Данные")
              .map((tool) => (
                <button
                  key={tool.id}
                  className={`nav-item ${activeTool === tool.id ? "active" : ""}`}
                  onClick={() => navigate(tool.id)}
                >
                  <span>{tool.icon}</span>
                  {tool.title}
                </button>
              ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" />
          Локальное приложение
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <span className="breadcrumb">Рабочее пространство</span>
          <span className="version">v0.1.0</span>
        </header>

        <section className="content">
          <div className="welcome">
            <div className="eyebrow">ТВОЯ РАБОЧАЯ ПАНЕЛЬ</div>
            <h1>{selectedTool ? selectedTool.title : "Все инструменты"}</h1>
            <p>
              {selectedTool
                ? selectedTool.description
                : "Полезные утилиты для повседневных задач технической поддержки."}
            </p>
          </div>

          {selectedTool ? (
            selectedTool.id === "tickets" ? (
              <TicketFormatter />
            ) : selectedTool.id === "payments" ? (
              <PaymentFormatter />
            ) : selectedTool.id === "logs" ? (
              <LogFormatter />
            ) : selectedTool.id === "json" ? (
              <JsonFormatter />
            ) : selectedTool.id === "timestamp" ? (
              <TimestampConverter />
            ) : selectedTool.id === "russia-time-zones" ? (
              <RussiaTimeZones />
            ) : (
              <section className="placeholder">
                <div className="placeholder-icon">{selectedTool.icon}</div>
                <h2>Инструмент готовится к запуску</h2>
                <p>
                  Скоро здесь появится функциональность:
                  {` ${selectedTool.title.toLowerCase()}.`}
                </p>
                <button
                  className="secondary-button"
                  onClick={() => setActiveTool(null)}
                >
                  ← Все инструменты
                </button>
              </section>
            )
          ) : (
            <>
              <div className="section-heading">
                <h2>Доступные инструменты</h2>
                <span>{tools.length} инструмента</span>
              </div>

              <div className="tools-grid">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    className="tool-card"
                    onClick={() => navigate(tool.id)}
                  >
                    <div className="tool-card-top">
                      <span className="tool-icon">{tool.icon}</span>
                      <span className="tool-arrow">↗</span>
                    </div>

                    <span className="tool-category">{tool.category}</span>
                    <span className="tool-title">{tool.title}</span>
                    <span className="tool-description">{tool.description}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
