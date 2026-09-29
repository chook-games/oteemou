/* ============================================================
   SETTINGS / DATA - Ρυθμίσεις, dark mode, AI εικόνες, export/import
   ============================================================ */

'use strict';

// ===== SETTINGS =====

function showSettings() {
  const d = getData();
  if (!d) return;

  const prov = d.provider || 'deepseek';
  const model = d.apiModel || getProvider(prov).defaultModel;
  const providerOptions = Object.keys(AI_PROVIDERS).map(function(id) {
    return '<option value="' + id + '"' + (id === prov ? ' selected' : '') + '>' + AI_PROVIDERS[id].label + '</option>';
  }).join('');

  showModal('\u2699\ufe0f \u03a1\u03c5\u03b8\u03bc\u03af\u03c3\u03b5\u03b9\u03c2',
    '<div class="settings-group">' +
      '<h3>\u{1f511} AI API</h3>' +
      '<div class="form-group" style="margin-bottom:10px;">' +
        '<label style="display:block;font-weight:500;margin-bottom:4px;font-size:0.8rem;color:#6B5B7B;">\u03a0\u03ac\u03c1\u03bf\u03c7\u03bf\u03c2</label>' +
        '<select id="settingsProvider" onchange="onSettingsProviderChange()" style="width:100%;padding:12px 16px;border:2px solid #FFD4B8;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:0.95rem;background:#FFF8F0;color:#2D1B3D;box-sizing:border-box;">' + providerOptions + '</select>' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:10px;">' +
        '<label style="display:block;font-weight:500;margin-bottom:4px;font-size:0.8rem;color:#6B5B7B;">API Key</label>' +
        '<input type="password" id="settingsApiKey" value="' + (d.apiKey || '') + '" placeholder="' + getProvider(prov).placeholder + '" style="width:100%;padding:12px 16px;border:2px solid #FFD4B8;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:0.95rem;background:#FFF8F0;color:#2D1B3D;box-sizing:border-box;">' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:10px;">' +
        '<label style="display:block;font-weight:500;margin-bottom:4px;font-size:0.8rem;color:#6B5B7B;">\u039c\u03bf\u03bd\u03c4\u03ad\u03bb\u03bf</label>' +
        '<input type="text" id="settingsApiModel" value="' + model + '" placeholder="model" style="width:100%;padding:12px 16px;border:2px solid #FFD4B8;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:0.95rem;background:#FFF8F0;color:#2D1B3D;box-sizing:border-box;">' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button id="settingsApiSaveBtn" onclick="saveSettingsApiKey()" style="padding:8px 16px;border:2px solid #FFD4B8;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;background:#FFF8F0;color:#2D1B3D;">\u0391\u03c0\u03bf\u03b8\u03ae\u03ba\u03b5\u03c5\u03c3\u03b7 \u{1f4be}</button>' +
        '<button onclick="showApiHelp()" style="padding:8px 16px;border:2px solid #FFD4B8;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;background:#FFF8F0;color:#2D1B3D;">\u{1f4d6} \u039f\u03b4\u03b7\u03b3\u03af\u03b5\u03c2</button>' +
      '</div>' +
    '</div>' +
    '<div class="settings-group">' +
      '<h3>\u{1f319} \u0395\u03bc\u03c6\u03ac\u03bd\u03b9\u03c3\u03b7</h3>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button onclick="toggleDarkMode()" style="padding:8px 16px;border:2px solid #FFD4B8;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;background:#FFF8F0;color:#2D1B3D;">' + (d.darkMode ? '\u2600\ufe0f \u03a6\u03c9\u03c4\u03b5\u03b9\u03bd\u03ae \u03bb\u03b5\u03b9\u03c4\u03bf\u03c5\u03c1\u03b3\u03af\u03b1' : '\u{1f319} \u03a3\u03ba\u03bf\u03c4\u03b5\u03b9\u03bd\u03ae \u03bb\u03b5\u03b9\u03c4\u03bf\u03c5\u03c1\u03b3\u03af\u03b1') + '</button>' +
        '<button onclick="toggleImages()" style="padding:8px 16px;border:2px solid #FFD4B8;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;background:#FFF8F0;color:#2D1B3D;">' + (imagesEnabled() ? '\u{1f5bc}\ufe0f AI \u03b5\u03b9\u03ba\u03cc\u03bd\u03b5\u03c2: \u039d\u03b1\u03b9' : '\u{1f5bc}\ufe0f AI \u03b5\u03b9\u03ba\u03cc\u03bd\u03b5\u03c2: \u038c\u03c7\u03b9') + '</button>' +
      '</div>' +
    '</div>' +
    '<div class="settings-group">' +
      '<h3>\u{1f4be} \u0394\u03b5\u03b4\u03bf\u03bc\u03ad\u03bd\u03b1</h3>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button onclick="exportData()" style="padding:8px 16px;border:2px solid #FFD4B8;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;background:#FFF8F0;color:#2D1B3D;">\u{1f4e4} \u0395\u03be\u03b1\u03b3\u03c9\u03b3\u03ae</button>' +
        '<button onclick="document.getElementById(\'importFile\').click()" style="padding:8px 16px;border:2px solid #FFD4B8;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;background:#FFF8F0;color:#2D1B3D;">\u{1f4e5} \u0395\u03b9\u03c3\u03b1\u03b3\u03c9\u03b3\u03ae</button>' +
        '<input type="file" id="importFile" accept=".json" style="display:none;" onchange="importData(event)">' +
      '</div>' +
    '</div>' +
    '<div class="settings-group">' +
      '<h3>\u26a0\ufe0f \u0395\u03c0\u03b9\u03ba\u03af\u03bd\u03b4\u03c5\u03bd\u03b7 \u03b6\u03ce\u03bd\u03b7</h3>' +
      '<button onclick="clearAllData()" style="padding:8px 16px;border:2px solid #E74C3C;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;background:#FFF0F0;color:#E74C3C;">\u{1f5d1}\ufe0f \u0394\u03b9\u03b1\u03b3\u03c1\u03b1\u03c6\u03ae \u03cc\u03bb\u03c9\u03bd \u03c4\u03c9\u03bd \u03b4\u03b5\u03b4\u03bf\u03bc\u03ad\u03bd\u03c9\u03bd</button>' +
    '</div>'
  );
}

function toggleImages() {
  let d = getData();
  if (!d) return;

  d.imagesEnabled = d.imagesEnabled === false;
  saveData(d);
  showToast(d.imagesEnabled
    ? '\u{1f5bc}\ufe0f \u039f\u03b9 AI \u03b5\u03b9\u03ba\u03cc\u03bd\u03b5\u03c2 \u03b5\u03bd\u03b5\u03c1\u03b3\u03bf\u03c0\u03bf\u03b9\u03ae\u03b8\u03b7\u03ba\u03b1\u03bd!'
    : '\u{1f5bc}\ufe0f \u039f\u03b9 AI \u03b5\u03b9\u03ba\u03cc\u03bd\u03b5\u03c2 \u03b1\u03c0\u03b5\u03bd\u03b5\u03c1\u03b3\u03bf\u03c0\u03bf\u03b9\u03ae\u03b8\u03b7\u03ba\u03b1\u03bd.', 'success');
  showSettings();
}

function toggleDarkMode() {
  let d = getData();
  if (!d) return;

  d.darkMode = !d.darkMode;
  saveData(d);

  if (d.darkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
    showToast('\u{1f319} \u03a3\u03ba\u03bf\u03c4\u03b5\u03b9\u03bd\u03ae \u03bb\u03b5\u03b9\u03c4\u03bf\u03c5\u03c1\u03b3\u03af\u03b1 \u03b5\u03bd\u03b5\u03c1\u03b3\u03bf\u03c0\u03bf\u03b9\u03ae\u03b8\u03b7\u03ba\u03b5!', 'success');
  } else {
    document.documentElement.removeAttribute('data-theme');
    showToast('\u2600\ufe0f \u03a6\u03c9\u03c4\u03b5\u03b9\u03bd\u03ae \u03bb\u03b5\u03b9\u03c4\u03bf\u03c5\u03c1\u03b3\u03af\u03b1 \u03b5\u03bd\u03b5\u03c1\u03b3\u03bf\u03c0\u03bf\u03b9\u03ae\u03b8\u03b7\u03ba\u03b5!', 'success');
  }

  closeModal();
}

function clearAllData() {
  if (!confirm('\u26a0\ufe0f \u03a3\u03af\u03b3\u03bf\u03c5\u03c1\u03b1 \u03b8\u03ad\u03bb\u03b5\u03b9\u03c2 \u03bd\u03b1 \u03b4\u03b9\u03b1\u03b3\u03c1\u03ac\u03c8\u03b5\u03b9\u03c2 \u03cc\u03bb\u03b1 \u03c4\u03b1 \u03b4\u03b5\u03b4\u03bf\u03bc\u03ad\u03bd\u03b1; \u0391\u03c5\u03c4\u03ae \u03b7 \u03b5\u03bd\u03ad\u03c1\u03b3\u03b5\u03b9\u03b1 \u03b5\u03af\u03bd\u03b1\u03b9 \u03bc\u03b7 \u03b1\u03bd\u03b1\u03c3\u03c4\u03c1\u03ad\u03c8\u03b9\u03bc\u03b7!')) return;

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CACHE_KEY);
  location.reload();
}

// ===== EXPORT / IMPORT =====

function exportData() {
  const d = getData();
  if (!d) return;

  const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'oteemou_backup_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('\u{1f4e4} \u0394\u03b5\u03b4\u03bf\u03bc\u03ad\u03bd\u03b1 \u03b5\u03be\u03ae\u03c7\u03b8\u03b7\u03c3\u03b1\u03bd!', 'success');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.user) throw new Error('Invalid backup file');
      saveData(data);
      showToast('\u{1f4e5} \u0394\u03b5\u03b4\u03bf\u03bc\u03ad\u03bd\u03b1 \u03b5\u03b9\u03c3\u03ae\u03c7\u03b8\u03b7\u03c3\u03b1\u03bd! \u039a\u03ac\u03bd\u03b5 reload...', 'success');
      setTimeout(function() { location.reload(); }, 1500);
    } catch (err) {
      showToast('\u274c \u039c\u03b7 \u03ad\u03b3\u03ba\u03c5\u03c1\u03bf \u03b1\u03c1\u03c7\u03b5\u03af\u03bf backup!', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}
