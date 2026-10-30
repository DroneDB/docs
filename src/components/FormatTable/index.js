import React from 'react';
import formats from '@site/src/data/formats.json';

// Supported formats from src/data/formats.json, the single source of truth for formats and
// entry types. `category` limits the table to one group (for example "raster").
export default function FormatTable({category}) {
  const rows = category ? formats.filter(f => f.category === category) : formats;
  if (!rows.length) throw new Error(`<FormatTable>: no formats${category ? ` in category "${category}"` : ''}`);
  return (
    <table>
      <thead>
        <tr><th>Format</th><th>Extensions</th><th>Entry type</th><th>Opens in</th><th>Hub builds</th><th>Notes</th></tr>
      </thead>
      <tbody>
        {rows.map(f => (
          <tr key={f.name}>
            <td>{f.name}</td>
            <td>{f.extensions.map((e, i) => <span key={e}>{i > 0 && ', '}<code>{e}</code></span>)}</td>
            <td>{f.entryType}</td>
            <td>{f.view || '—'}</td>
            <td>{f.builds || '—'}</td>
            <td>{f.notes || ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
