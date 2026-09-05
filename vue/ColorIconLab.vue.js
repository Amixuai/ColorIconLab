/**
 * ColorIconLab — Vue Component
 * ----------------------------------------------------------------------
 * Usage:
 *   import { ColorIconLab, byPrefixAndName } from './ColorIconLab.vue.js';
 *
 *   <ColorIconLab :icon="byPrefixAndName.cils['filter']" />   // solid
 *   <ColorIconLab :icon="byPrefixAndName.cilb['youtube']" />  // brand
 *
 * Only the icon actually rendered is ever fetched from the CDN.
 * ----------------------------------------------------------------------
 */
import { defineComponent, h, ref, watch } from 'vue';

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

export const ColorIconLab = defineComponent({
  name: 'ColorIconLab',
  props: {
    icon: { type: Object, required: true },
    color: { type: String, default: null },
    size: { type: String, default: null },
  },
  setup(props) {
    const svg = ref(null);

    async function loadIcon() {
      const index = await loadMetadata();
      const entry = index[props.icon.name];
      if (!entry) return;

      const path = props.icon.isBrand
        ? entry.paths.find((p) => p.includes('/brands/'))
        : entry.paths.find((p) =>
            p.includes('/' + (props.icon.style || 'solid') + '/')
          );

      if (!path) return;
      svg.value = await fetchSvg(path);
    }

    watch(() => props.icon, loadIcon, { immediate: true });

    return () =>
      svg.value
        ? h('span', {
            style: {
              color: props.color,
              width: props.size,
              height: props.size,
              display: 'inline-block',
            },
            innerHTML: svg.value,
          })
        : null;
  },
});

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
