// Shared by the browser app and the data server.

/** Parse comma/newline separated CSV-ish text into rows of cells. Handles simple quoted cells. */
export function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const cells: string[] = [];
      let cur = '';
      let quoted = false;
      for (const ch of line) {
        if (ch === '"') quoted = !quoted;
        else if ((ch === ',' || ch === '\t') && !quoted) {
          cells.push(cur.trim());
          cur = '';
        } else cur += ch;
      }
      cells.push(cur.trim());
      return cells;
    });
}

/** CSV text with a header row → objects keyed by header. Values stay strings; callers coerce. */
export function csvToObjects(text: string): Record<string, string>[] {
  const [head, ...body] = parseCsv(text);
  if (!head) return [];
  const keys = head.map((h, i) => h.trim() || `column_${i + 1}`);
  return body.map((cells) => Object.fromEntries(keys.map((k, i) => [k, cells[i] ?? ''])));
}
