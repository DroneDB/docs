import React from 'react';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';
import styles from './styles.module.css';

// The only place where a Hub guide page shows CLI or API content. Collapsed by default.
export default function ForDevelopers({cli, api, apiLabel = 'API reference', children}) {
  return (
    <details className={styles.box}>
      <summary>For developers</summary>
      <div className={styles.body}>
        {cli && <CodeBlock language="bash">{cli}</CodeBlock>}
        {children}
        {api && <p><Link to={api}>{apiLabel}</Link></p>}
      </div>
    </details>
  );
}
