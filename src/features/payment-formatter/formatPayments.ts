const DATE_LINE = /^\d{2}\.\d{2}\.\d{4}$/;
const TIME_LINE = /^\d{1,2}:\d{2}$/;

export function formatPayments(input: string): string {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !/^svg$/i.test(line));
  const result: string[] = [];

  for (let index = 0; index < lines.length;) {
    const name = lines[index];
    const date = lines[index + 1];
    const next = lines[index + 2];

    if (date && DATE_LINE.test(date) && next) {
      if (TIME_LINE.test(next) && lines[index + 3]) {
        result.push(`${name} ${date} ${next} ${lines[index + 3]}`);
        index += 4;
      } else {
        result.push(`${name} ${date} ${next}`);
        index += 3;
      }
    } else {
      result.push(name);
      index += 1;
    }
  }

  return result.join("\n");
}
