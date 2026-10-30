import React, {useEffect, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import media from '@site/src/data/media.json';
import MediaPending from '@site/src/components/MediaPending';
import styles from './styles.module.css';

/** Path of the image of a shot id (static/media/<section>/<feature>--<shot>.webp). */
export function useMediaSrc(id) {
  return useBaseUrl(`/media/${id}.webp`);
}

// Shots are captured at device pixel ratio 2: the CSS size is half the pixel size.
const cssSize = m => ({width: Math.round(m.width / 2), height: Math.round(m.height / 2)});

export default function Screenshot({id, alt, caption, zoomable = true}) {
  const src = useMediaSrc(id);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const m = media[id];
  if (!m) return <MediaPending kind="Screenshot" id={id} caption={caption} />;
  const {width, height} = cssSize(m);
  const text = alt || caption || m.alt || '';

  const img = <img className={styles.img} src={src} alt={text} width={width} height={height} loading="lazy" decoding="async" />;
  return (
    <figure className={styles.figure}>
      {zoomable ? (
        <button type="button" className={styles.zoom} onClick={() => setOpen(true)} aria-label={`Enlarge: ${text}`}>
          {img}
        </button>
      ) : img}
      {caption && <figcaption>{caption}</figcaption>}
      {open && (
        <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={text} onClick={() => setOpen(false)}>
          <img src={src} alt={text} />
        </div>
      )}
    </figure>
  );
}
