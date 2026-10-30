import React from 'react';
import {translate} from '@docusaurus/Translate';
import {hubUrl} from '@site/src/lib/hub.mjs';
import styles from './styles.module.css';

// "Try it live" button: opens a public showcase dataset on DroneDB Hub. `compare` opens the
// compare view of several rasters: an array, or the paths separated by commas.
export default function TryLive({org, ds, path, view, compare, hint, label = translate({id: 'component.tryLive.label', message: 'Try it live on Hub'})}) {
  const paths = typeof compare === 'string' ? compare.split(',').map(p => p.trim()) : compare;
  const href = hubUrl({org, ds, path, view, compare: paths});
  return (
    <div className={styles.box}>
      <a className={`button button--primary ${styles.button}`} href={href} target="_blank" rel="noopener noreferrer">
        {label} <span aria-hidden="true">↗</span>
      </a>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
