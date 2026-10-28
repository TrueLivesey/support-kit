
export function formatTicket(input: string): string {
  const lines = input
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '');

  const result: string[] = [];

  for (let i = 0; i < lines.length; i += 2) {
    const field = lines[i].trim();
    const value = lines[i + 1]?.trim();

    if (value !== undefined) {
      result.push(`${field}: ${value}`);
    } else {
      result.push(field);
    }
  }

  return result.join('\n');
}
