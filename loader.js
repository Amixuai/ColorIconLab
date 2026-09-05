/**
 * ColorIconLab — On-Demand HTML Icon Loader
 * ----------------------------------------------------------------------
 * Usage in a project (only these two lines are ever needed):
 *
 *   <script src="https://cdn.jsdelivr.net/gh/Amixuai/ColorIconLab@latest/loader.js"></script>
 *   <i class="cil-solid cil-gear"></i>
 *   <i class="cil-brands cil-youtube"></i>
 *
 * Only the icons actually present in the page's DOM are ever fetched —
 * never the whole library, regardless of how many icons the library
 * contains in total.
 * ----------------------------------------------------------------------
 */
(function () {
  var CDN_BASE =
    'https://cdn.jsdelivr.net/gh/Amixuai/ColorIconLab@latest/svg';

  var CATEGORY_BY_NAME = null; // lazily loaded from metadata/index.json
  var svgCache = {};

  function fetchMetadataIndex() {
    if (CATEGORY_BY_NAME) return Promise.resolve(CATEGORY_BY_NAME);
    return fetch(
      'https://cdn.jsdelivr.net/gh/Amixuai/ColorIconLab@latest/metadata/index.json'
    )
      .then(function (res) {
        return res.json();
      })
      .then(function (index) {
        CATEGORY_BY_NAME = index;
        return index;
      });
  }

  function resolvePath(style, iconName, isBrand, index) {
    var entry = index[iconName];
    if (!entry) return null;
    // Brand icons ignore the style class entirely — always served
    // from the "brands" category regardless of the style requested.
    if (isBrand || entry.isBrand) {
      return entry.paths.find(function (p) {
        return p.indexOf('/brands/') !== -1;
      });
    }
    return entry.paths.find(function (p) {
      return p.indexOf('/' + style + '/') !== -1;
    });
  }

  function fetchSvg(path) {
    if (svgCache[path]) return svgCache[path];
    svgCache[path] = fetch(CDN_BASE.replace('/svg', '') + '/' + path)
      .then(function (res) {
        if (!res.ok) throw new Error('Icon not found: ' + path);
        return res.text();
      })
      .catch(function () {
        // Fallback placeholder so the host page never breaks.
        return '<svg viewBox="0 0 24 24" width="24" height="24">' +
          '<text x="2" y="16" font-size="8">Icon Not Found</text></svg>';
      });
    return svgCache[path];
  }

  function classListToIcon(classList) {
    var style = null;
    var iconName = null;
    var isBrand = false;

    classList.forEach(function (cls) {
      if (cls === 'cil-solid') style = 'solid';
      else if (cls === 'cil-outline') style = 'outline';
      else if (cls === 'cil-colorful') style = 'colorful';
      else if (cls === 'cil-brands') isBrand = true;
      else if (cls.indexOf('cil-') === 0) {
        iconName = cls.replace('cil-', '');
      }
    });

    return { style: style, iconName: iconName, isBrand: isBrand };
  }

  function renderIcon(el, index) {
    var parsed = classListToIcon(el.classList);
    if (!parsed.iconName) return;

    var path = resolvePath(
      parsed.style || 'solid',
      parsed.iconName,
      parsed.isBrand,
      index
    );

    if (!path) {
      el.innerHTML =
        '<svg viewBox="0 0 24 24" width="24" height="24">' +
        '<text x="2" y="16" font-size="8">Icon Not Found</text></svg>';
      return;
    }

    fetchSvg(path).then(function (svg) {
      el.innerHTML = svg;
    });
  }

  function scanAndRender() {
    fetchMetadataIndex().then(function (index) {
      var elements = document.querySelectorAll('[class*="cil-"]');
      elements.forEach(function (el) {
        renderIcon(el, index);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanAndRender);
  } else {
    scanAndRender();
  }

  // Re-scan if new icon tags are added dynamically after initial load.
  var observer = new MutationObserver(function () {
    scanAndRender();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
