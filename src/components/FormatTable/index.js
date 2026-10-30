import React from 'react';
import {translate} from '@docusaurus/Translate';
import formats from '@site/src/data/formats.json';

// Supported formats from src/data/formats.json, the single source of truth for formats and
// entry types. `category` limits the table to one group (for example "raster").
export default function FormatTable({category}) {
  // Literal translate() calls, so write-translations finds them
  const headers = [
    translate({id: 'component.formats.format', message: 'Format'}),
    translate({id: 'component.formats.extensions', message: 'Extensions'}),
    translate({id: 'component.formats.entryType', message: 'Entry type'}),
    translate({id: 'component.formats.view', message: 'Opens in'}),
    translate({id: 'component.formats.builds', message: 'Hub builds'}),
    translate({id: 'component.formats.notes', message: 'Notes'}),
  ];
  const rows = category ? formats.filter(f => f.category === category) : formats;
  if (!rows.length) throw new Error(`<FormatTable>: no formats${category ? ` in category "${category}"` : ''}`);
  return (
    <table>
      <thead>
        <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
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
