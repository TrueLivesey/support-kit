import { useMemo, useState } from "react";
import "./RussiaTimeZones.css";

type Zone = { title: string; id: string; cities: string[] };
const zones: Zone[] = [
  {
    title: "Калининградское время",
    id: "Europe/Kaliningrad",
    cities: ["Калининград"],
  },
  {
    title: "Московское время",
    id: "Europe/Moscow",
    cities: [
      "Москва",
      "Санкт-Петербург",
      "Воронеж",
      "Краснодар",
      "Мурманск",
      "Петрозаводск",
      "Архангельск",
      "Белгород",
      "Брянск",
      "Владимир",
      "Вологда",
      "Иваново",
      "Калуга",
      "Кострома",
      "Курск",
      "Липецк",
      "Орел",
      "Псков",
      "Рязань",
      "Смоленск",
      "Тамбов",
      "Тверь",
      "Тула",
      "Ярославль",
      "Ростов-на-Дону",
      "Ставрополь",
      "Симферополь",
      "Севастополь",
      "Майкоп",
      "Черкесск",
      "Нальчик",
      "Владикавказ",
      "Грозный",
      "Махачкала",
      "Элиста",
      "Сыктывкар",
      "Нарьян-Мар",
      "Йошкар-Ола",
      "Чебоксары",
      "Саранск",
      "Киров",
      "Великий Новгород",
    ],
  },
  {
    title: "Самарское время",
    id: "Europe/Samara",
    cities: [
      "Самара",
      "Ижевск",
      "Саратов",
      "Тольятти",
      "Ульяновск",
      "Оренбург",
      "Пенза",
      "Балаково",
      "Энгельс",
    ],
  },
  {
    title: "Екатеринбургское время",
    id: "Asia/Yekaterinburg",
    cities: [
      "Екатеринбург",
      "Уфа",
      "Пермь",
      "Челябинск",
      "Курган",
      "Тюмень",
      "Ханты-Мансийск",
      "Салехард",
      "Нефтеюганск",
      "Сургут",
      "Нижний Тагил",
      "Магнитогорск",
    ],
  },
  { title: "Омское время", id: "Asia/Omsk", cities: ["Омск", "Тара"] },
  {
    title: "Красноярское время",
    id: "Asia/Krasnoyarsk",
    cities: [
      "Красноярск",
      "Новосибирск",
      "Томск",
      "Кемерово",
      "Барнаул",
      "Абакан",
      "Кызыл",
      "Горно-Алтайск",
      "Норильск",
      "Бийск",
      "Новокузнецк",
    ],
  },
  {
    title: "Иркутское время",
    id: "Asia/Irkutsk",
    cities: ["Иркутск", "Улан-Удэ", "Братск", "Ангарск", "Чита"],
  },
  {
    title: "Якутское время",
    id: "Asia/Yakutsk",
    cities: ["Якутск", "Благовещенск", "Чита", "Нерюнгри", "Мирный", "Тында"],
  },
  {
    title: "Владивостокское время",
    id: "Asia/Vladivostok",
    cities: [
      "Владивосток",
      "Хабаровск",
      "Южно-Сахалинск",
      "Комсомольск-на-Амуре",
      "Биробиджан",
      "Уссурийск",
      "Находка",
      "Артём",
    ],
  },
  {
    title: "Магаданское время",
    id: "Asia/Magadan",
    cities: ["Магадан", "Сусуман", "Палана"],
  },
  {
    title: "Камчатское время",
    id: "Asia/Kamchatka",
    cities: ["Петропавловск-Камчатский", "Анадырь", "Елизово"],
  },
];
const cities = zones
  .flatMap((zone) =>
    zone.cities.map((name) => ({ name, zone: zone.id, group: zone.title })),
  )
  .sort((a, b) => a.name.localeCompare(b.name, "ru"));
type RegionCode = {
  codes: string[];
  region: string;
  city: string;
  zone: string;
};
// Автомобильные коды региона. Несколько кодов могут соответствовать одному субъекту.
const regionCodes: RegionCode[] = [
  {
    codes: ["01", "101"],
    region: "Республика Адыгея",
    city: "Майкоп",
    zone: "Europe/Moscow",
  },
  {
    codes: ["02", "102", "702"],
    region: "Республика Башкортостан",
    city: "Уфа",
    zone: "Asia/Yekaterinburg",
  },
  {
    codes: ["03", "103"],
    region: "Республика Бурятия",
    city: "Улан-Удэ",
    zone: "Asia/Irkutsk",
  },
  {
    codes: ["04"],
    region: "Республика Алтай",
    city: "Горно-Алтайск",
    zone: "Asia/Krasnoyarsk",
  },
  {
    codes: ["05", "105"],
    region: "Республика Дагестан",
    city: "Махачкала",
    zone: "Europe/Moscow",
  },
  {
    codes: ["06"],
    region: "Республика Ингушетия",
    city: "Магас",
    zone: "Europe/Moscow",
  },
  {
    codes: ["07"],
    region: "Кабардино-Балкарская Республика",
    city: "Нальчик",
    zone: "Europe/Moscow",
  },
  {
    codes: ["08"],
    region: "Республика Калмыкия",
    city: "Элиста",
    zone: "Europe/Moscow",
  },
  {
    codes: ["09", "109"],
    region: "Карачаево-Черкесская Республика",
    city: "Черкесск",
    zone: "Europe/Moscow",
  },
  {
    codes: ["10"],
    region: "Республика Карелия",
    city: "Петрозаводск",
    zone: "Europe/Moscow",
  },
  {
    codes: ["11", "111"],
    region: "Республика Коми",
    city: "Сыктывкар",
    zone: "Europe/Moscow",
  },
  {
    codes: ["12"],
    region: "Республика Марий Эл",
    city: "Йошкар-Ола",
    zone: "Europe/Moscow",
  },
  {
    codes: ["13", "113"],
    region: "Республика Мордовия",
    city: "Саранск",
    zone: "Europe/Moscow",
  },
  {
    codes: ["14"],
    region: "Республика Саха (Якутия)",
    city: "Якутск",
    zone: "Asia/Yakutsk",
  },
  {
    codes: ["15"],
    region: "Республика Северная Осетия — Алания",
    city: "Владикавказ",
    zone: "Europe/Moscow",
  },
  {
    codes: ["16", "116", "716"],
    region: "Республика Татарстан",
    city: "Казань",
    zone: "Europe/Moscow",
  },
  {
    codes: ["17"],
    region: "Республика Тыва",
    city: "Кызыл",
    zone: "Asia/Krasnoyarsk",
  },
  {
    codes: ["18", "118"],
    region: "Удмуртская Республика",
    city: "Ижевск",
    zone: "Europe/Samara",
  },
  {
    codes: ["19"],
    region: "Республика Хакасия",
    city: "Абакан",
    zone: "Asia/Krasnoyarsk",
  },
  {
    codes: ["20", "95"],
    region: "Чеченская Республика",
    city: "Грозный",
    zone: "Europe/Moscow",
  },
  {
    codes: ["21", "121"],
    region: "Чувашская Республика",
    city: "Чебоксары",
    zone: "Europe/Moscow",
  },
  {
    codes: ["22", "122", "222"],
    region: "Алтайский край",
    city: "Барнаул",
    zone: "Asia/Krasnoyarsk",
  },
  {
    codes: ["23", "93", "123", "193", "323"],
    region: "Краснодарский край",
    city: "Краснодар",
    zone: "Europe/Moscow",
  },
  {
    codes: ["24", "84", "88", "124", "224"],
    region: "Красноярский край",
    city: "Красноярск",
    zone: "Asia/Krasnoyarsk",
  },
  {
    codes: ["25", "125", "725"],
    region: "Приморский край",
    city: "Владивосток",
    zone: "Asia/Vladivostok",
  },
  {
    codes: ["26", "126"],
    region: "Ставропольский край",
    city: "Ставрополь",
    zone: "Europe/Moscow",
  },
  {
    codes: ["27"],
    region: "Хабаровский край",
    city: "Хабаровск",
    zone: "Asia/Vladivostok",
  },
  {
    codes: ["28"],
    region: "Амурская область",
    city: "Благовещенск",
    zone: "Asia/Yakutsk",
  },
  {
    codes: ["29"],
    region: "Архангельская область",
    city: "Архангельск",
    zone: "Europe/Moscow",
  },
  {
    codes: ["30", "130"],
    region: "Астраханская область",
    city: "Астрахань",
    zone: "Europe/Moscow",
  },
  {
    codes: ["31", "131"],
    region: "Белгородская область",
    city: "Белгород",
    zone: "Europe/Moscow",
  },
  {
    codes: ["32"],
    region: "Брянская область",
    city: "Брянск",
    zone: "Europe/Moscow",
  },
  {
    codes: ["33", "133"],
    region: "Владимирская область",
    city: "Владимир",
    zone: "Europe/Moscow",
  },
  {
    codes: ["34", "134"],
    region: "Волгоградская область",
    city: "Волгоград",
    zone: "Europe/Moscow",
  },
  {
    codes: ["35"],
    region: "Вологодская область",
    city: "Вологда",
    zone: "Europe/Moscow",
  },
  {
    codes: ["36", "136"],
    region: "Воронежская область",
    city: "Воронеж",
    zone: "Europe/Moscow",
  },
  {
    codes: ["37"],
    region: "Ивановская область",
    city: "Иваново",
    zone: "Europe/Moscow",
  },
  {
    codes: ["38", "85", "138"],
    region: "Иркутская область",
    city: "Иркутск",
    zone: "Asia/Irkutsk",
  },
  {
    codes: ["39", "91", "139"],
    region: "Калининградская область",
    city: "Калининград",
    zone: "Europe/Kaliningrad",
  },
  {
    codes: ["40"],
    region: "Калужская область",
    city: "Калуга",
    zone: "Europe/Moscow",
  },
  {
    codes: ["41"],
    region: "Камчатский край",
    city: "Петропавловск-Камчатский",
    zone: "Asia/Kamchatka",
  },
  {
    codes: ["42", "142"],
    region: "Кемеровская область — Кузбасс",
    city: "Кемерово",
    zone: "Asia/Krasnoyarsk",
  },
  {
    codes: ["43"],
    region: "Кировская область",
    city: "Киров",
    zone: "Europe/Moscow",
  },
  {
    codes: ["44"],
    region: "Костромская область",
    city: "Кострома",
    zone: "Europe/Moscow",
  },
  {
    codes: ["45"],
    region: "Курганская область",
    city: "Курган",
    zone: "Asia/Yekaterinburg",
  },
  {
    codes: ["46"],
    region: "Курская область",
    city: "Курск",
    zone: "Europe/Moscow",
  },
  {
    codes: ["47", "147"],
    region: "Ленинградская область",
    city: "Гатчина",
    zone: "Europe/Moscow",
  },
  {
    codes: ["48"],
    region: "Липецкая область",
    city: "Липецк",
    zone: "Europe/Moscow",
  },
  {
    codes: ["49"],
    region: "Магаданская область",
    city: "Магадан",
    zone: "Asia/Magadan",
  },
  {
    codes: ["50", "90", "150", "190", "250", "550", "750", "790"],
    region: "Московская область",
    city: "Красногорск",
    zone: "Europe/Moscow",
  },
  {
    codes: ["51"],
    region: "Мурманская область",
    city: "Мурманск",
    zone: "Europe/Moscow",
  },
  {
    codes: ["52", "152", "252"],
    region: "Нижегородская область",
    city: "Нижний Новгород",
    zone: "Europe/Moscow",
  },
  {
    codes: ["53"],
    region: "Новгородская область",
    city: "Великий Новгород",
    zone: "Europe/Moscow",
  },
  {
    codes: ["54", "154", "754"],
    region: "Новосибирская область",
    city: "Новосибирск",
    zone: "Asia/Krasnoyarsk",
  },
  {
    codes: ["55", "155"],
    region: "Омская область",
    city: "Омск",
    zone: "Asia/Omsk",
  },
  {
    codes: ["56", "156"],
    region: "Оренбургская область",
    city: "Оренбург",
    zone: "Europe/Samara",
  },
  {
    codes: ["57"],
    region: "Орловская область",
    city: "Орёл",
    zone: "Europe/Moscow",
  },
  {
    codes: ["58", "158"],
    region: "Пензенская область",
    city: "Пенза",
    zone: "Europe/Samara",
  },
  {
    codes: ["59", "159"],
    region: "Пермский край",
    city: "Пермь",
    zone: "Asia/Yekaterinburg",
  },
  {
    codes: ["60"],
    region: "Псковская область",
    city: "Псков",
    zone: "Europe/Moscow",
  },
  {
    codes: ["61", "161", "761"],
    region: "Ростовская область",
    city: "Ростов-на-Дону",
    zone: "Europe/Moscow",
  },
  {
    codes: ["62"],
    region: "Рязанская область",
    city: "Рязань",
    zone: "Europe/Moscow",
  },
  {
    codes: ["63", "163", "763"],
    region: "Самарская область",
    city: "Самара",
    zone: "Europe/Samara",
  },
  {
    codes: ["64", "164"],
    region: "Саратовская область",
    city: "Саратов",
    zone: "Europe/Samara",
  },
  {
    codes: ["65"],
    region: "Сахалинская область",
    city: "Южно-Сахалинск",
    zone: "Asia/Magadan",
  },
  {
    codes: ["66", "96", "166", "196"],
    region: "Свердловская область",
    city: "Екатеринбург",
    zone: "Asia/Yekaterinburg",
  },
  {
    codes: ["67"],
    region: "Смоленская область",
    city: "Смоленск",
    zone: "Europe/Moscow",
  },
  {
    codes: ["68"],
    region: "Тамбовская область",
    city: "Тамбов",
    zone: "Europe/Moscow",
  },
  {
    codes: ["69", "169"],
    region: "Тверская область",
    city: "Тверь",
    zone: "Europe/Moscow",
  },
  {
    codes: ["70"],
    region: "Томская область",
    city: "Томск",
    zone: "Asia/Krasnoyarsk",
  },
  {
    codes: ["71"],
    region: "Тульская область",
    city: "Тула",
    zone: "Europe/Moscow",
  },
  {
    codes: ["72", "172"],
    region: "Тюменская область",
    city: "Тюмень",
    zone: "Asia/Yekaterinburg",
  },
  {
    codes: ["73", "173"],
    region: "Ульяновская область",
    city: "Ульяновск",
    zone: "Europe/Samara",
  },
  {
    codes: ["74", "174", "774"],
    region: "Челябинская область",
    city: "Челябинск",
    zone: "Asia/Yekaterinburg",
  },
  {
    codes: ["75"],
    region: "Забайкальский край",
    city: "Чита",
    zone: "Asia/Yakutsk",
  },
  {
    codes: ["76", "176"],
    region: "Ярославская область",
    city: "Ярославль",
    zone: "Europe/Moscow",
  },
  {
    codes: [
      "77",
      "97",
      "99",
      "177",
      "197",
      "199",
      "277",
      "299",
      "777",
      "797",
      "799",
      "977",
      "997",
    ],
    region: "Москва",
    city: "Москва",
    zone: "Europe/Moscow",
  },
  {
    codes: ["78", "98", "178", "198", "778"],
    region: "Санкт-Петербург",
    city: "Санкт-Петербург",
    zone: "Europe/Moscow",
  },
  {
    codes: ["79"],
    region: "Еврейская автономная область",
    city: "Биробиджан",
    zone: "Asia/Vladivostok",
  },
  {
    codes: ["80", "180"],
    region: "Донецкая Народная Республика",
    city: "Донецк",
    zone: "Europe/Moscow",
  },
  {
    codes: ["81", "181"],
    region: "Луганская Народная Республика",
    city: "Луганск",
    zone: "Europe/Moscow",
  },
  {
    codes: ["82", "182"],
    region: "Республика Крым",
    city: "Симферополь",
    zone: "Europe/Moscow",
  },
  {
    codes: ["83"],
    region: "Ненецкий автономный округ",
    city: "Нарьян-Мар",
    zone: "Europe/Moscow",
  },
  {
    codes: ["84", "184"],
    region: "Херсонская область",
    city: "Геническ",
    zone: "Europe/Moscow",
  },
  {
    codes: ["85", "185"],
    region: "Запорожская область",
    city: "Мелитополь",
    zone: "Europe/Moscow",
  },
  {
    codes: ["86", "186"],
    region: "Ханты-Мансийский автономный округ — Югра",
    city: "Ханты-Мансийск",
    zone: "Asia/Yekaterinburg",
  },
  {
    codes: ["87"],
    region: "Чукотский автономный округ",
    city: "Анадырь",
    zone: "Asia/Kamchatka",
  },
  {
    codes: ["89"],
    region: "Ямало-Ненецкий автономный округ",
    city: "Салехард",
    zone: "Asia/Yekaterinburg",
  },
  {
    codes: ["92", "192"],
    region: "Севастополь",
    city: "Севастополь",
    zone: "Europe/Moscow",
  },
  {
    codes: ["94"],
    region: "Байконур и территории за пределами РФ, обслуживаемые МВД России",
    city: "Москва",
    zone: "Europe/Moscow",
  },
  {
    codes: ["188"],
    region: "Харьковская область",
    city: "Белгород",
    zone: "Europe/Moscow",
  },
];
function normalizeCode(value: string) {
  return value.trim().replace(/^0+(?=\d)/, "");
}
function todayLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function parts(date: Date, zone: string) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, Number(p.value)]),
  );
}
function resolveInstant(date: string, time: string, zone: string): Date | null {
  const d = /^(\d{4})-(\d\d)-(\d\d)$/.exec(date),
    t = /^(\d\d):(\d\d)$/.exec(time);
  if (!d || !t) return null;
  const [y, m, day] = d.slice(1).map(Number),
    [h, min] = t.slice(1).map(Number),
    target = Date.UTC(y, m - 1, day, h, min),
    check = new Date(target);
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== m - 1 ||
    check.getUTCDate() !== day ||
    h > 23 ||
    min > 59
  )
    return null;
  let value = target;
  for (let i = 0; i < 3; i++) {
    const p = parts(new Date(value), zone);
    value +=
      target - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  }
  const result = new Date(value),
    p = parts(result, zone);
  return p.year === y &&
    p.month === m &&
    p.day === day &&
    p.hour === h &&
    p.minute === min
    ? result
    : null;
}
function format(
  date: Date,
  zone: string,
  extra: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: zone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    ...extra,
  }).format(date);
}
function offset(date: Date, zone: string) {
  return (
    new Intl.DateTimeFormat("en", {
      timeZone: zone,
      timeZoneName: "longOffset",
    })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value ?? "GMT"
  )
    .replace("GMT", "UTC")
    .replace(":00", "");
}
function offsetHours(date: Date, zone: string) {
  const p = parts(date, zone);
  return (
    Date.UTC(p.year, p.month - 1, p.day, p.hour) -
    date.getTime() +
    date.getUTCMinutes() * 60_000 +
    date.getUTCSeconds() * 1_000
  );
}
function formatTimeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length >= 2
    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
    : digits;
}
export function RussiaTimeZones() {
  const [city, setCity] = useState(""),
    [cityZone, setCityZone] = useState<string | null>(null),
    [cityQuery, setCityQuery] = useState(""),
    [cityFocused, setCityFocused] = useState(false),
    [date, setDate] = useState(todayLocal),
    [time, setTime] = useState("12:20"),
    [query, setQuery] = useState(""),
    [regionQuery, setRegionQuery] = useState(""),
    [copied, setCopied] = useState(false);
  const selectedBase = cities.find((c) => c.name === city) ?? cities[0];
  const selected = {
    ...selectedBase,
    name: city,
    zone: cityZone ?? selectedBase.zone,
  };
  const result = useMemo(
    () => (city ? resolveInstant(date, time, selected.zone) : null),
    [city, date, time, selected.zone],
  );
  const suggestions = cityQuery.trim()
    ? cities
        .filter((c) =>
          c.name
            .toLocaleLowerCase("ru")
            .includes(cityQuery.trim().toLocaleLowerCase("ru")),
        )
        .slice(0, 10)
    : [];
  const shown = zones.filter((zone) =>
    `${zone.title} ${zone.cities.join(" ")}`
      .toLocaleLowerCase("ru")
      .includes(query.trim().toLocaleLowerCase("ru")),
  );
  const regionMatch = regionCodes.find((entry) =>
    entry.codes.some(
      (code) => normalizeCode(code) === normalizeCode(regionQuery),
    ),
  );
  function chooseRegionCity(code: string) {
    const match = regionCodes.find((entry) =>
      entry.codes.some((item) => normalizeCode(item) === normalizeCode(code)),
    );
    if (!match) return false;
    setCity(match.city);
    setCityZone(match.zone);
    setCityQuery("");
    setCityFocused(false);
    return true;
  }
  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(
      `${city}: ${format(result, selected.zone)}\nМосква (MSK): ${format(result, "Europe/Moscow")}\nЕкатеринбург (YEKT): ${format(result, "Asia/Yekaterinburg")}\nUTC: ${format(result, "UTC", { timeZoneName: "short" })}`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="russia-tool">
      <section className="russia-panel">
        <div className="russia-heading">
          <div>
            <span className="russia-kicker">КОНВЕРТЕР ИНЦИДЕНТА</span>
            <h2>Когда искать событие в логах?</h2>
          </div>
          <span className="local-mark">● Только в браузере</span>
        </div>
        <p className="russia-help">
          Укажите местное время клиента, чтобы перевести его в часовые пояса
          логов.
        </p>
        <div className="russia-fields">
          <label>
            Город или код региона клиента
            <div className="city-picker">
              <input
                value={cityFocused ? cityQuery : city}
                onFocus={() => {
                  setCityFocused(true);
                  setCityQuery("");
                }}
                onBlur={() =>
                  window.setTimeout(() => {
                    if (!chooseRegionCity(cityQuery)) setCityFocused(false);
                  }, 150)
                }
                onChange={(e) => setCityQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && chooseRegionCity(cityQuery))
                    e.preventDefault();
                }}
                placeholder="Например, Воронеж или 36"
                aria-label="Поиск города или номера региона"
              />
              {cityFocused && suggestions.length > 0 && (
                <div className="city-menu">
                  {suggestions.map((c) => (
                    <button
                      key={c.name}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setCity(c.name);
                        setCityZone(null);
                        setCityQuery("");
                        setCityFocused(false);
                      }}
                    >
                      {c.name}
                      <small>{c.group}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </label>
          <label>
            Дата инцидента
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            Местное время
            <input
              type="text"
              inputMode="numeric"
              placeholder="ЧЧ:ММ"
              maxLength={5}
              value={time}
              onKeyDown={(e) => {
                if (
                  e.key === "Backspace" &&
                  time.endsWith(":") &&
                  e.currentTarget.selectionStart === time.length
                ) {
                  e.preventDefault();
                  setTime(time.slice(0, -2));
                }
              }}
              onChange={(e) => setTime(formatTimeInput(e.target.value))}
              aria-label="Местное время в формате 24 часа"
            />
          </label>
        </div>
        {!city ? (
          <p className="russia-empty-city">
            Выберите город или введите код региона, чтобы увидеть время для
            поиска в логах.
          </p>
        ) : !result ? (
          <p className="russia-error" role="alert">
            Проверьте дату и время: такого местного времени в этой зоне не
            существует.
          </p>
        ) : (
          <div className="russia-output">
            <div className="russia-source-results">
              <div>
                <span>ГОРОД КЛИЕНТА · {offset(result, selected.zone)}</span>
                <strong>{format(result, selected.zone)}</strong>
              </div>
              <div>
                <span>ВСЕМИРНОЕ ВРЕМЯ · UTC</span>
                <strong>
                  {format(result, "UTC", { timeZoneName: "short" })}
                </strong>
              </div>
            </div>
            <div className="russia-log-results">
              <div className="russia-msk">
                <span>МОСКВА · MSK</span>
                <strong>{format(result, "Europe/Moscow")}</strong>
              </div>
              <div className="russia-yekt">
                <span>ЕКАТЕРИНБУРГ · YEKT</span>
                <strong>{format(result, "Asia/Yekaterinburg")}</strong>
              </div>
            </div>
            <div className="russia-actions">
              <span>Момент в UTC: {result.toISOString()}</span>
              <button onClick={() => void copy()}>
                {copied ? "Скопировано ✓" : "Копировать результат"}
              </button>
            </div>
          </div>
        )}
      </section>
      <section className="russia-panel region-code-card">
        <div className="zones-heading">
          <div>
            <span className="russia-kicker">КОД НА НОМЕРЕ</span>
            <h2>Найти регион по номеру</h2>
            <p>
              Введите две или три цифры кода региона с автомобильного номера.
            </p>
          </div>
          <input
            inputMode="numeric"
            maxLength={3}
            value={regionQuery}
            onChange={(e) =>
              setRegionQuery(e.target.value.replace(/\D/g, "").slice(0, 3))
            }
            placeholder="Например, 26"
            aria-label="Поиск региона по автомобильному коду"
          />
        </div>
        {regionQuery && (
          <div className="region-code-result" aria-live="polite">
            {regionMatch ? (
              <>
                <div>
                  <span>РЕГИОН</span>
                  <strong>{regionMatch.region}</strong>
                </div>
                <div>
                  <span>КОДЫ ЭТОГО РЕГИОНА</span>
                  <strong>{regionMatch.codes.join(", ")}</strong>
                </div>
              </>
            ) : (
              <p>Регион с кодом {regionQuery} не найден.</p>
            )}
          </div>
        )}
      </section>
      <section className="russia-panel">
        <div className="zones-heading">
          <div>
            <span className="russia-kicker">СПРАВОЧНИК</span>
            <h2>11 часовых зон России</h2>
            <p>
              Города сгруппированы по часовым зонам. Поиск охватывает и название
              зоны, и города.
            </p>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти город или зону"
            aria-label="Поиск по часовым поясам"
          />
        </div>
        <div className="russia-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Часовая зона</th>
                <th>UTC</th>
                <th>Относительно МСК</th>
                <th>Города</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((zone) => {
                const d = result ?? new Date();
                const delta = Math.round(
                  (offsetHours(d, zone.id) - offsetHours(d, "Europe/Moscow")) /
                    3600000,
                );
                return (
                  <tr key={zone.id}>
                    <td>{zone.title}</td>
                    <td>{offset(d, zone.id)}</td>
                    <td>
                      {delta > 0 ? "+" : ""}
                      {delta} ч
                    </td>
                    <td>{zone.cities.join(", ")}</td>
                  </tr>
                );
              })}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={4}>Совпадений нет</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="russia-note">
          Справочник включает крупные города и административные центры
          субъектов; IANA/Intl обеспечивает корректные часовые смещения на
          выбранную дату.
        </p>
      </section>
    </div>
  );
}
