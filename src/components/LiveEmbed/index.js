import React, {useState} from 'react';
import {translate} from '@docusaurus/Translate';
import media from '@site/src/data/media.json';
import {hubUrl} from '@site/src/lib/hub.mjs';
import {useMediaSrc} from '@site/src/components/Screenshot';
import styles from './styles.module.css';

// A live Hub viewer behind a poster. The viewer loads the whole Hub app and the data, so it
// loads only when the reader asks for it. One per page at most.
export default function LiveEmbed({org, ds, path, view, poster, height = 480, title}) {
  const [loaded, setLoaded] = useState(false);
  const posterSrc = useMediaSrc(poster || '');
  const hasPoster = poster && media[poster];
  const src = hubUrl({org, ds, path, view, embed: true});
  const full = hubUrl({org, ds, path, view});
  const label = title || `${org}/${ds}: ${path || ''}`;
  return (
    <figure className={styles.figure}>
      <div className={styles.frame} style={{height}}>
        {loaded ? (
          <iframe className={styles.iframe} src={src} title={label} loading="lazy" allow="fullscreen; xr-spatial-tracking" allowFullScreen />
        ) : (
          <>
            {hasPoster && <img className={styles.poster} src={posterSrc} alt="" loading="lazy" decoding="async" />}
            <button type="button" className={`button button--primary ${styles.load}`} onClick={() => setLoaded(true)}>
              {translate({id: 'component.liveEmbed.load', message: 'Load interactive viewer'})}
            </button>
          </>
        )}
      </div>
      <figcaption className={styles.caption}>
        <span>{label}</span>
        <a href={full} target="_blank" rel="noopener noreferrer">{translate({id: 'component.liveEmbed.fullScreen', message: 'Open full screen'})} ↗</a>
      </figcaption>
    </figure>
  );
}
