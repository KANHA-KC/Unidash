export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCSV(csvText: string): ParsedCSV {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((h, index) => {
        row[h] = values[index];
      });
      rows.push(row);
    }
  }

  return { headers, rows };
}

// Simulate realistic live fluctuations for metrics (e.g. +-$20 to MRR, fluctuating ms ping)
export function simulateMetricFluctuation(currentVal: number | string): number | string {
  if (typeof currentVal === 'number') {
    // 60% chance to fluctuate by +/- 0.5%
    if (Math.random() > 0.4) {
      const deltaPercent = (Math.random() - 0.48) * 0.015;
      const newVal = Math.round((currentVal * (1 + deltaPercent)) * 100) / 100;
      return newVal;
    }
    return currentVal;
  }
  return currentVal;
}
