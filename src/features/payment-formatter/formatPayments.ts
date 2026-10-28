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
    const time = lines[index + 2];
    const amount = lines[index + 3];

    if (date && DATE_LINE.test(date) && time && TIME_LINE.test(time) && amount) {
      result.push(`${name} ${date} ${time} ${amount}`);
      index += 4;
    } else {
      result.push(name);
      index += 1;
    }
  }

  return result.join("\n");
}
