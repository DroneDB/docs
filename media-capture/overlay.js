// Injected by capture.mjs into every page before the Hub's own scripts run.
//
//  - Clips (window.__ddbCaptureCursor = true, set by an earlier init script): a visible cursor dot
//    that follows the real mouse events Playwright sends, and a ripple on each click, because a
//    screen recording shows no system cursor.
//  - Every shot: window.__ddbCapture.highlight(rect) draws the red rounded box around the control
//    that matters; clearHighlight() removes it.
//
// Nothing here changes the Hub: the elements are fixed, on top, and let every event through.
(() => {
  if (window.__ddbCapture) return;
  const Z = 2147483647;
  const RED = '#d32f2f';
  let layer = null;

  function ensureLayer() {
    if (layer && layer.isConnected) return layer;
    layer = document.createElement('div');
    layer.setAttribute('data-ddb-capture', '');
    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:${Z};overflow:hidden;`;
    const style = document.createElement('style');
    style.textContent = `
      [data-ddb-capture] .ddb-cursor { position:absolute; left:0; top:0; width:22px; height:22px;
        margin:-11px 0 0 -11px; border-radius:50%; background:rgba(33,33,33,.55);
        border:2px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,.45); transition:transform .08s ease-out; }
      [data-ddb-capture] .ddb-cursor.down { transform:scale(.8); }
      [data-ddb-capture] .ddb-ripple { position:absolute; width:16px; height:16px; margin:-8px 0 0 -8px;
        border-radius:50%; border:3px solid ${RED}; animation:ddb-ripple .55s ease-out forwards; }
      @keyframes ddb-ripple { from { transform:scale(.6); opacity:.95; } to { transform:scale(3.6); opacity:0; } }
      [data-ddb-capture] .ddb-highlight { position:absolute; border:3px solid ${RED}; border-radius:10px;
        box-shadow:0 0 0 2px rgba(255,255,255,.85), 0 2px 10px rgba(0,0,0,.25); }
    `;
    layer.appendChild(style);
    (document.body || document.documentElement).appendChild(layer);
    return layer;
  }

  let cursor = null;
  function moveCursor(x, y) {
    if (!cursor || !cursor.isConnected) {
      cursor = document.createElement('div');
      cursor.className = 'ddb-cursor';
      ensureLayer().appendChild(cursor);
    }
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
  }

  function ripple(x, y) {
    const r = document.createElement('div');
    r.className = 'ddb-ripple';
    r.style.left = `${x}px`;
    r.style.top = `${y}px`;
    ensureLayer().appendChild(r);
    setTimeout(() => r.remove(), 700);
  }

  function installCursor() {
    const opts = {capture: true, passive: true};
    window.addEventListener('mousemove', e => moveCursor(e.clientX, e.clientY), opts);
    window.addEventListener('pointermove', e => moveCursor(e.clientX, e.clientY), opts);
    window.addEventListener('mousedown', e => {
      moveCursor(e.clientX, e.clientY);
      cursor.classList.add('down');
      ripple(e.clientX, e.clientY);
    }, opts);
    window.addEventListener('mouseup', () => cursor && cursor.classList.remove('down'), opts);
  }

  window.__ddbCapture = {
    /**
     * Red rounded box around a rect in CSS pixels of the viewport ({ x, y, width, height }), kept
     * inside the viewport so the whole box shows for a control at its edge.
     */
    highlight(rect, pad = 9) {   // 6 px between the control and the 3 px line
      const box = document.createElement('div');
      box.className = 'ddb-highlight';
      const edge = 3; // the border width: the line stays on screen
      const left = Math.max(edge, rect.x - pad);
      const top = Math.max(edge, rect.y - pad);
      const right = Math.min(window.innerWidth - edge, rect.x + rect.width + pad);
      const bottom = Math.min(window.innerHeight - edge, rect.y + rect.height + pad);
      box.style.boxSizing = 'border-box';
      box.style.left = `${left}px`;
      box.style.top = `${top}px`;
      box.style.width = `${right - left}px`;
      box.style.height = `${bottom - top}px`;
      ensureLayer().appendChild(box);
    },
    clearHighlight() {
      if (layer) layer.querySelectorAll('.ddb-highlight').forEach(b => b.remove());
    },
    /** Shows the cursor dot at a point (where the recording starts). */
    cursorAt(x, y) {
      moveCursor(x, y);
    }
  };

  // Listeners on window need no document body; the dot is added on the first mouse event
  if (window.__ddbCaptureCursor) installCursor();
})();
