/* ============================================================
   SHARE - Κοινοποίηση αποτελεσμάτων αναζήτησης μέσω URL
   ------------------------------------------------------------
   Τα αποτελέσματα κωδικοποιούνται (base64url) στο hash του URL
   (#r=...), οπότε ο παραλήπτης τα βλέπει ΧΩΡΙΣ να χρειάζεται
   δικό του API key / DeepSeek.
   ============================================================ */

'use strict';

function _b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach(function(b) { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function _b64decode(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const bytes = Uint8Array.from(bin, function(c) { return c.charCodeAt(0); });
  return new TextDecoder().decode(bytes);
}

function _minimalProduct(p) {
  return {
    name: p.name,
    description: p.description,
    price: p.price,
    rarity: p.rarity,
    ratingBreakdown: p.ratingBreakdown,
    totalPurchases: p.totalPurchases,
    reviews: p.reviews,
    image: p.image
  };
}

function encodeShare(products, query) {
  const payload = { q: query || '', p: products.map(_minimalProduct) };
  return _b64encode(JSON.stringify(payload));
}

function decodeShareFromHash() {
  const m = (location.hash || '').match(/[#&]r=([^&]+)/);
  if (!m) return null;
  try {
    const data = JSON.parse(_b64decode(m[1]));
    if (data && Array.isArray(data.p) && data.p.length) return data;
  } catch (e) {
    console.error('decodeShare error:', e);
  }
  return null;
}

// Δείχνει μια μοιρασμένη αναζήτηση χωρίς απαίτηση API key.
function openSharedResults(data) {
  const gate = document.getElementById('keyGateScreen');
  const setup = document.getElementById('setupScreen');
  if (gate) gate.style.display = 'none';
  if (setup) setup.style.display = 'none';

  showApp();
  data.p.forEach(function(p) { if (!p.image) getProductImage(p); });
  displayResults(data.p, data.q || '\u03ba\u03bf\u03b9\u03bd\u03bf\u03c0\u03bf\u03b9\u03b7\u03bc\u03ad\u03bd\u03b7 \u03b1\u03bd\u03b1\u03b6\u03ae\u03c4\u03b7\u03c3\u03b7', true);
  showToast('\u{1f517} \u039c\u03bf\u03b9\u03c1\u03b1\u03c3\u03bc\u03ad\u03bd\u03b7 \u03b1\u03bd\u03b1\u03b6\u03ae\u03c4\u03b7\u03c3\u03b7!', 'success');
}

function _shareUrl(products, query) {
  return location.origin + location.pathname + '#r=' + encodeShare(products, query);
}

function shareResults() {
  if (!currentProducts || !currentProducts.length) {
    return showToast('\u26a0\ufe0f \u0394\u03b5\u03bd \u03c5\u03c0\u03ac\u03c1\u03c7\u03bf\u03c5\u03bd \u03b1\u03c0\u03bf\u03c4\u03b5\u03bb\u03ad\u03c3\u03bc\u03b1\u03c4\u03b1 \u03b3\u03b9\u03b1 \u03ba\u03bf\u03b9\u03bd\u03bf\u03c0\u03bf\u03af\u03b7\u03c3\u03b7.', 'error');
  }

  const url = _shareUrl(currentProducts, currentQuery);
  history.replaceState(null, '', '#r=' + encodeShare(currentProducts, currentQuery));

  if (navigator.share) {
    navigator.share({ title: 'O tee mou - \u03c8\u03ac\u03be\u03b5 \u03c4\u03bf \u03b1\u03c0\u03af\u03b8\u03b1\u03bd\u03bf', text: '\u0394\u03b5\u03c2 \u03c4\u03b1 \u03b1\u03c0\u03af\u03b8\u03b1\u03bd\u03b1 \u03b5\u03c5\u03c1\u03ae\u03bc\u03b1\u03c4\u03b1!', url: url })
      .catch(function() {});
    return;
  }

  _copyToClipboard(url).then(function(ok) {
    if (ok) {
      showToast('\u{1f517} \u039f \u03c3\u03cd\u03bd\u03b4\u03b5\u03c3\u03bc\u03bf\u03c2 \u03b1\u03bd\u03c4\u03b9\u03b3\u03c1\u03ac\u03c6\u03b7\u03ba\u03b5! \u03a3\u03c4\u03b5\u03af\u03bb\u2019 \u03c4\u03bf\u03bd \u03c3\u03b5 \u03ba\u03ac\u03c0\u03bf\u03b9\u03bf\u03bd.', 'success');
    } else {
      _showShareLink(url);
    }
  });
}

function _copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(function() { return true; }, function() { return _legacyCopy(text); });
  }
  return Promise.resolve(_legacyCopy(text));
}

function _legacyCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (e) {
    return false;
  }
}

function _showShareLink(url) {
  showModal('\u{1f517} \u039c\u03bf\u03b9\u03c1\u03ac\u03c3\u03bf\u03c5',
    '<p style="color:#6B5B7B;font-size:0.85rem;margin-bottom:10px;">\u0391\u03bd\u03c4\u03af\u03b3\u03c1\u03b1\u03c8\u03b5 \u03c4\u03bf\u03bd \u03c3\u03cd\u03bd\u03b4\u03b5\u03c3\u03bc\u03bf \u03ba\u03b1\u03b9 \u03c3\u03c4\u03b5\u03af\u03bb\u2019 \u03c4\u03bf\u03bd. \u039f \u03c0\u03b1\u03c1\u03b1\u03bb\u03ae\u03c0\u03c4\u03b7\u03c2 \u03b8\u03b1 \u03b4\u03b5\u03b9 \u03c4\u03b1 \u03b9\u03b4\u03b9\u03b1 \u03b1\u03c0\u03bf\u03c4\u03b5\u03bb\u03ad\u03c3\u03bc\u03b1\u03c4\u03b1 \u03c7\u03c9\u03c1\u03af\u03c2 \u03ba\u03b1\u03bd\u03ad\u03bd\u03b1 API key.</p>' +
    '<input id="shareLinkInput" readonly value="' + url.replace(/"/g, '&quot;') + '" style="width:100%;padding:12px;border:2px solid #FFD4B8;border-radius:10px;font-size:0.8rem;box-sizing:border-box;background:#FFF8F0;color:#2D1B3D;" onclick="this.select()">'
  );
}
