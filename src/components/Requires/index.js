import React from 'react';
import Link from '@docusaurus/Link';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import styles from './styles.module.css';

const ACCESS = {
  none: 'No account',
  read: 'Read access to the dataset (anyone, for a public dataset)',
  write: 'Write access to the dataset',
  owner: 'Owner of the organization',
  admin: 'Registry administrator',
};

function useFrontMatterRequires() {
  try {
    return useDoc().frontMatter.requires || {};
  } catch {
    return {};
  }
}

// "Requires:" line of a Hub guide page. Reads the `requires` front matter; props override it.
export default function Requires(props) {
  const {access, node, plan, data} = {...useFrontMatterRequires(), ...props};
  const items = [];
  if (access) {
    if (!ACCESS[access]) throw new Error(`<Requires>: unknown access "${access}"`);
    items.push(ACCESS[access]);
  }
  if (data) items.push(data);
  if (node) items.push('A processing node (on DroneDB Hub: a plan with processing)');
  if (plan) items.push(<>A <Link to="/docs/hub-guide/account/plans">plan</Link> with {plan}</>);
  if (!items.length) return null;
  return (
    <p className={styles.requires}>
      <strong>Requires:</strong>{' '}
      {items.map((item, i) => <span key={i}>{i > 0 && ' · '}{item}</span>)}
    </p>
  );
}
