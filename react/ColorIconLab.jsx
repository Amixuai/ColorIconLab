/**
 * ColorIconLab — React Component
 * ----------------------------------------------------------------------
 * Usage:
 *   import { ColorIconLab, byPrefixAndName } from './ColorIconLab';
 *
 *   <ColorIconLab icon={byPrefixAndName.cils['filter']} />   // solid
 *   <ColorIconLab icon={byPrefixAndName.cilb['youtube']} />  // brand
 *
 * Only the icon actually rendered is ever fetched from the CDN.
 * ----------------------------------------------------------------------
 */
import { useEffect, useState } from 'react';

const METADATA_URL =
  'https://cdn.jsdelivr.net/gh/Amixuai/ColorIconLab@latest/metadata/index.json';
const CDN_ROOT = 'https://cdn.jsdelivr.net/gh/Amixuai/ColorIconLab@latest';

let metadataPromise = null;
const svgCache = {};

function loadMetadata() {
  if (!metadataPromise) {
    metadataPromise = fetch(METADATA_URL).then((res) => res.json());
  }
  return metadataPromise;
}

function fetchSvg(path) {
  if (!svgCache[path]) {
    svgCache[path] = fetch(`${CDN_ROOT}/${path}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.text();
      })
      .catch(
        () =>
          '<svg viewBox="0 0 24 24" width="24" height="24"><text x="2" y="16" font-size="8">Icon Not Found</text></svg>'
      );
  }
  return svgCache[path];
}

/**
 * `icon` is a descriptor object: { name, style, isBrand }.
 * Produced by the byPrefixAndName helper below, matching Font
 * Awesome's `byPrefixAndName.fab['youtube']` pattern.
 */
export function ColorIconLab({ icon, color, size, className }) {
  const [svg, setSvg] = useState(null);

  useEffect(() => {
    if (!icon) return;
    let cancelled = false;

    loadMetadata().then((index) => {
      const entry = index[icon.name];
      if (!entry) return;

      const path = icon.isBrand
        ? entry.paths.find((p) => p.includes('/brands/'))
        : entry.paths.find((p) => p.includes('/' + (icon.style || 'solid') + '/'));

      if (!path) return;

      fetchSvg(path).then((markup) => {
        if (!cancelled) setSvg(markup);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [icon]);

  if (!svg) return null;

  return (
    <span
      className={className}
      style={{ color, width: size, height: size, display: 'inline-block' }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/**
 * byPrefixAndName.cils['filter']  -> solid icon descriptor
 * byPrefixAndName.cilb['youtube'] -> brand icon descriptor
 *
 * Implemented as a Proxy so any icon name works without needing a
 * pre-generated list — the actual existence check happens at fetch
 * time against the live metadata index.
 */
function makeStyleProxy(style, isBrand) {
  return new Proxy(
    {},
    {
      get(_, name) {
        return { name, style, isBrand };
      },
    }
  );
}

export const byPrefixAndName = {
  cils: makeStyleProxy('solid', false),
  cilo: makeStyleProxy('outline', false),
  cilc: makeStyleProxy('colorful', false),
  cilb: makeStyleProxy('brands', true),
};
