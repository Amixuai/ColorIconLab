/**
 * ColorIconLab — Web Component ("Web ColorIconLab")
 * ----------------------------------------------------------------------
 * Usage:
 *   <script src="https://cdn.jsdelivr.net/gh/Amixuai/ColorIconLab@latest/wc-icon.js"></script>
 *   <wc-icon name="magnifying-glass"></wc-icon>
 *   <wc-icon name="youtube" family="brands"></wc-icon>
 *
 * Only the icons actually present in the page are ever fetched.
 * ----------------------------------------------------------------------
 */
(function () {
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

  function resolvePath(index, name, family, style) {
    const entry = index[name];
    if (!entry) return null;
    if (family === 'brands' || entry.isBrand) {
      return entry.paths.find((p) => p.includes('/brands/'));
    }
    return entry.paths.find((p) => p.includes('/' + (style || 'solid') + '/'));
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

  class ColorIconLabIcon extends HTMLElement {
    static get observedAttributes() {
      return ['name', 'family', 'style', 'color', 'size'];
    }

    connectedCallback() {
      this.render();
    }

    attributeChangedCallback() {
      if (this.isConnected) this.render();
    }

    async render() {
      const name = this.getAttribute('name');
      if (!name) return;

      const family = this.getAttribute('family');
      const style = this.getAttribute('style') || 'solid';
      const color = this.getAttribute('color');
      const size = this.getAttribute('size');

      const index = await loadMetadata();
      const path = resolvePath(index, name, family, style);

      if (!path) {
        this.innerHTML =
          '<svg viewBox="0 0 24 24" width="24" height="24"><text x="2" y="16" font-size="8">Icon Not Found</text></svg>';
        return;
      }

      const svg = await fetchSvg(path);
      this.innerHTML = svg;

      const svgEl = this.querySelector('svg');
      if (svgEl) {
        if (color) svgEl.style.fill = color;
        if (size) {
          svgEl.style.width = size;
          svgEl.style.height = size;
        }
      }
    }
  }

  customElements.define('wc-icon', ColorIconLabIcon);
})();
