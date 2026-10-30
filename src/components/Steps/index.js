import React from 'react';
import styles from './styles.module.css';

// Numbered steps: wraps a Markdown ordered list, with screenshots inside the list items.
export default function Steps({children}) {
  return <div className={styles.steps}>{children}</div>;
}
