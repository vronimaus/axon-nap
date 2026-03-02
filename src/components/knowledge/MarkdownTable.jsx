export function parseMarkdownTable(content) {
  const lines = content.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Prüfe ob Zeile eine Tabelle startet (beginnt und endet mit |)
    if (line.startsWith('|') && line.endsWith('|')) {
      // Prüfe ob es die erste Zeile einer Tabelle ist
      const nextLine = lines[i + 1]?.trim() || '';
      const isSeparatorLine = nextLine.startsWith('|') && nextLine.includes('---');

      if (isSeparatorLine) {
        // Extrahiere Header
        const headerCells = line
          .split('|')
          .slice(1, -1)
          .map((cell) => cell.trim());

        const rows = [];
        let j = i + 2;

        // Sammle alle Datenzeilen
        while (j < lines.length) {
          const dataLine = lines[j].trim();
          if (dataLine.startsWith('|') && dataLine.endsWith('|')) {
            const cells = dataLine
              .split('|')
              .slice(1, -1)
              .map((cell) => cell.trim());
            rows.push(cells);
            j++;
          } else {
            break;
          }
        }

        if (rows.length > 0) {
          result.push({
            type: 'table',
            headers: headerCells,
            rows: rows,
          });
          i = j;
          continue;
        }
      }
    }

    // Normaler Text
    if (line.length > 0) {
      result.push({
        type: 'text',
        content: lines.slice(i, i + 1).join('\n'),
      });
    }

    i++;
  }

  return result;
}

export default function MarkdownTable({ headers, rows }) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full border-collapse bg-slate-900/50">
        <thead>
          <tr className="bg-slate-800/80 border-b border-slate-700">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-left text-sm font-semibold text-cyan-400 border-r border-slate-700 last:border-r-0"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="border-b border-slate-700 hover:bg-slate-800/40 transition-colors last:border-b-0"
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="px-4 py-3 text-sm text-slate-300 border-r border-slate-700 last:border-r-0"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}