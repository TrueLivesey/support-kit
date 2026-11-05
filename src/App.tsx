import { useEffect, useState } from "react";
import "./App.css";
import { TicketFormatter } from "./features/ticket-formatter/TicketFormatter";
import { LogFormatter } from "./features/log-formatter/LogFormatter";
import { JsonFormatter } from "./features/json-formatter/JsonFormatter";
import { RussiaTimeZones } from "./features/russia-time-zones/RussiaTimeZones";
import { PaymentFormatter } from "./features/payment-formatter/PaymentFormatter";
import { LogAnalyzer } from "./features/log-analyzer/LogAnalyzer";
import { TimeCalculator } from "./features/time-calculator/TimeCalculator";
import { TextTools } from "./features/text-tools/TextTools";

const tools = [
  {
    id: "tickets",
    title: "Форматирование заявок",
    description: "Преобразование строк в удобный формат",
    category: "Форматирование",
    icon: "▤",
  },
  {
    id: "payments",
    title: "Начисления и платежи",
    description: "Форматирование списка платежей и начислений",
    category: "Форматирование",
    icon: "₽",
  },
  {
    id: "logs",
    title: "Форматирование логов",
    description: "Подготовка логов с сохранением переносов строк",
    category: "Форматирование",
    icon: "⌘",
  },
  {
    id: "log-analyzer",
    title: "Анализ аварийных логов",
    description: "Локальная хронология, фильтры и подсказки по ошибкам",
    category: "Аварии",
    icon: "⌕",
  },
  {
    id: "json",
    title: "JSON Formatter",
    description: "Проверка и форматирование JSON",
    category: "Форматирование",
    icon: "{}",
  },
  {
    id: "text-tools",
    title: "Типограф и регистр",
    description: "Типографика и преобразование регистра текста",
    category: "Форматирование",
    icon: "Aa",
  },
  {
    id: "time-calculator",
    title: "Калькулятор времени",
    description: "Расчёт промежутка между двумя датами и временем",
    category: "Аварии",
    icon: "◴",
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

  const selectedTool = tools.find((tool) => tool.id === activeTool);

  return (
    <div className="app">
      <aside className="sidebar">
        <a className="logo" href="/support-kit/">
          <span className="logo-icon">SK</span>
          <span>SupportKit</span>
        </a>

        <div className="sidebar-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>

        <nav className="navigation">
          <a
            className={`nav-item ${activeTool === null ? "active" : ""}`}
            href="#/"
          >
            <span>▦</span>
            Все инструменты
          </a>

          {[...new Set(tools.map((tool) => tool.category))].map((category) => (
            <div className="nav-group" key={category}>
              <span className="nav-group-title">{category}</span>
              {tools
                .filter((tool) => tool.category === category)
                .map((tool) => (
                  <a
                    key={tool.id}
                    className={`nav-item ${activeTool === tool.id ? "active" : ""}`}
                    href={`#/tools/${tool.id}`}
                  >
                    <span>{tool.icon}</span>
                    {tool.title}
                  </a>
                ))}
            </div>
          ))}
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
            ) : selectedTool.id === "log-analyzer" ? (
              <LogAnalyzer />
            ) : selectedTool.id === "json" ? (
              <JsonFormatter />
            ) : selectedTool.id === "text-tools" ? (
              <TextTools />
            ) : selectedTool.id === "time-calculator" ? (
              <TimeCalculator />
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
                <a
                  className="secondary-button"
                  href="#/"
                >
                  ← Все инструменты
                </a>
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
                  <a
                    key={tool.id}
                    className="tool-card"
                    href={`#/tools/${tool.id}`}
                  >
                    <div className="tool-card-top">
                      <span className="tool-icon">{tool.icon}</span>
                      <span className="tool-arrow">↗</span>
                    </div>

                    <span className="tool-category">{tool.category}</span>
                    <span className="tool-title">{tool.title}</span>
                    <span className="tool-description">{tool.description}</span>
                  </a>
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
