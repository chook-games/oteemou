/* ============================================================
   API - AI providers, key validation + mandatory key gate
   Δεν υπάρχει ενσωματωμένο key. Ο χρήστης βάζει δικό του.
   ============================================================ */

'use strict';

const AI_PROVIDERS = {
  deepseek: {
    label: 'DeepSeek',
    placeholder: 'sk-...',
    defaultModel: 'deepseek-chat',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    note: '⚠️ Δεν είναι δωρεάν — χρεώνεται ανά χρήση, αλλά είναι πολύ φθηνό.',
    steps: [
      'Πήγαινε στο <a href="https://platform.deepseek.com" target="_blank" rel="noopener">platform.deepseek.com</a> και κάνε λογαριασμό (email ή Google).',
      'Στο μενού <b>Billing</b> πρόσθεσε υπόλοιπο (Top up). Χωρίς υπόλοιπο το key δεν δουλεύει.',
      'Άνοιξε <b>API Keys</b> και πάτα <b>Create new API key</b>.',
      'Αντίγραψε το κλειδί (ξεκινά με <b>sk-</b>) και βάλ\' το στο πεδίο API Key.'
    ]
  },
  openrouter: {
    label: 'OpenRouter (δωρεάν μοντέλα)',
    placeholder: 'sk-or-...',
    defaultModel: 'qwen/qwen3.8-27b:free',
    keyUrl: 'https://openrouter.ai/keys',
    note: '✅ Έχει δωρεάν μοντέλα (όσα τελειώνουν σε «:free») — δεν χρειάζεται κάρτα. Έχουν όμως όρια χρήσης ανά λεπτό/μέρα.',
    steps: [
      'Πήγαινε στο <a href="https://openrouter.ai" target="_blank" rel="noopener">openrouter.ai</a> και συνδέσου (Google / GitHub).',
      'Άνοιξε το μενού <b>Keys</b> και πάτα <b>Create Key</b>.',
      'Αντίγραψε το κλειδί (ξεκινά με <b>sk-or-</b>) και βάλ\' το στο πεδίο API Key.',
      'Στο πεδίο <b>Μοντέλο</b> διάλεξε κάποιο που τελειώνει σε <b>:free</b> (προεπιλεγμένο: <code>qwen/qwen3.8-27b:free</code>).'
    ]
  },
  gemini: {
    label: 'Google Gemini (δωρεάν tier)',
    placeholder: 'AIza...',
    defaultModel: 'gemini-2.5-flash',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    note: '✅ Δωρεάν tier με όριο ανά λεπτό/μέρα. Δεν χρειάζεται κάρτα για βασική χρήση.',
    steps: [
      'Πήγαινε στο <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">aistudio.google.com/app/apikey</a>.',
      'Συνδέσου με τον <b>Google</b> λογαριασμό σου.',
      'Πάτα <b>Create API key</b> και αντίγραψε το κλειδί (ξεκινά με <b>AIza</b>).',
      'Βάλ\' το στο πεδίο API Key. Προτεινόμενο μοντέλο: <code>gemini-2.5-flash</code>.'
    ]
  }
};

function getProvider(id) {
  return AI_PROVIDERS[id] || AI_PROVIDERS.deepseek;
}

// ===== LOW LEVEL REQUEST =====

async function aiRequest(providerId, key, model, systemPrompt, userMessage, maxTokens) {
  const provider = getProvider(providerId);
  const useModel = (model || provider.defaultModel).trim();

  if (providerId === 'gemini') {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
      encodeURIComponent(useModel) + ':generateContent';
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: maxTokens || 2000 }
      })
    });
    if (!resp.ok) throw new Error('API error: ' + resp.status);
    const data = await resp.json();
    const candidate = data.candidates && data.candidates[0];
    const parts = (candidate && candidate.content && candidate.content.parts) || [];
    return parts.map(function(p) { return p.text || ''; }).join('').trim();
  }

  let endpoint = 'https://api.deepseek.com/chat/completions';
  const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key };
  if (providerId === 'openrouter') {
    endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    headers['HTTP-Referer'] = location.origin;
    headers['X-Title'] = 'O tee mou';
  }

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      model: useModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.9,
      max_tokens: maxTokens || 2000
    })
  });
  if (!resp.ok) throw new Error('API error: ' + resp.status);
  const data = await resp.json();
  return data.choices[0].message.content;
}

// Uses the key/provider/model stored by the user.
async function callAI(systemPrompt, userMessage) {
  const d = getData();
  if (!d || !d.apiKey) throw new Error('Missing API key');
  return aiRequest(d.provider || 'deepseek', d.apiKey, d.apiModel, systemPrompt, userMessage, 2000);
}

async function validateApiKey(providerId, key, model) {
  const text = await aiRequest(
    providerId, key, model,
    'You are a connection test. Reply with exactly: OK',
    'ping', 5
  );
  if (!text) throw new Error('Empty response');
  return true;
}

function clearApiKey() {
  const d = getData();
  if (!d) return;
  d.apiKey = '';
  saveData(d);
}

// ===== MANDATORY KEY GATE =====

function providerHint(providerId) {
  const p = getProvider(providerId);
  return '🔗 Πάρε δωρεάν key: <a href="' + p.keyUrl +
    '" target="_blank" rel="noopener" style="color:#7B2D8E;font-weight:600;">' + p.label + '</a>';
}

function showApiHelp() {
  const gate = document.getElementById('gateProvider');
  const current = gate ? gate.value : ((getData() || {}).provider || 'deepseek');

  const sections = Object.keys(AI_PROVIDERS).map(function(id) {
    const p = AI_PROVIDERS[id];
    const isCurrent = id === current;
    const steps = p.steps.map(function(s) {
      return '<li style="margin-bottom:6px;">' + s + '</li>';
    }).join('');
    return '<div style="margin-bottom:16px;padding:14px 16px;border-radius:12px;border:2px solid ' +
      (isCurrent ? '#7B2D8E' : '#FFD4B8') + ';background:' + (isCurrent ? '#FBF3FF' : '#FFF8F0') + ';">' +
      '<h3 style="font-size:1rem;margin-bottom:8px;">' + p.label + (isCurrent ? ' &larr; επιλεγμένο' : '') + '</h3>' +
      '<ol style="margin:0 0 8px 18px;padding:0;font-size:0.85rem;line-height:1.5;color:#2D1B3D;">' + steps + '</ol>' +
      '<p style="font-size:0.8rem;margin:0 0 8px;color:#6B5B7B;">' + p.note + '</p>' +
      '<a href="' + p.keyUrl + '" target="_blank" rel="noopener" style="font-size:0.8rem;font-weight:600;color:#7B2D8E;">🔗 Πάρε key για ' + p.label + '</a>' +
    '</div>';
  }).join('');

  showModal('📖 Πώς να πάρω API key',
    '<p style="font-size:0.85rem;color:#6B5B7B;margin-bottom:14px;">Το key μένει μόνο στον browser σου. Διάλεξε όποιον πάροχο θέλεις — για δωρεάν χρήση προτείνουμε <b>OpenRouter</b> ή <b>Google Gemini</b>.</p>' +
    sections
  );
}

function onProviderChange() {
  const providerId = document.getElementById('gateProvider').value;
  const p = getProvider(providerId);
  document.getElementById('gateApiKey').placeholder = p.placeholder;
  document.getElementById('gateModel').value = p.defaultModel;
  document.getElementById('gateKeyLink').innerHTML = providerHint(providerId);
}

function showKeyGate(message) {
  const setup = document.getElementById('setupScreen');
  const app = document.getElementById('appScreen');
  if (setup) setup.style.display = 'none';
  if (app) app.style.display = 'none';

  const gate = document.getElementById('keyGateScreen');
  if (!gate) return;
  gate.style.display = 'flex';

  const d = getData();
  if (d && d.provider) {
    document.getElementById('gateProvider').value = d.provider;
  }
  onProviderChange();

  if (d) {
    if (d.apiKey) document.getElementById('gateApiKey').value = d.apiKey;
    if (d.apiModel) document.getElementById('gateModel').value = d.apiModel;
  }

  const err = document.getElementById('gateError');
  if (err) {
    if (message) {
      err.textContent = message;
      err.style.display = 'block';
    } else {
      err.style.display = 'none';
    }
  }
}

async function submitKeyGate() {
  const providerId = document.getElementById('gateProvider').value;
  const key = document.getElementById('gateApiKey').value.trim();
  const model = document.getElementById('gateModel').value.trim() || getProvider(providerId).defaultModel;
  const btn = document.getElementById('gateSubmitBtn');
  const err = document.getElementById('gateError');

  if (!key) {
    err.textContent = '⚠️ Γράψε ένα API key για να συνεχίσεις.';
    err.style.display = 'block';
    return;
  }

  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Έλεγχος...';
  err.style.display = 'none';

  try {
    await validateApiKey(providerId, key, model);

    const d = getData() || getDefaultData();
    d.provider = providerId;
    d.apiKey = key;
    d.apiModel = model;
    saveData(d);

    document.getElementById('keyGateScreen').style.display = 'none';
    if (d.user) {
      showApp();
    } else {
      document.getElementById('setupScreen').style.display = 'flex';
    }
    showToast('✅ Το API key είναι έγκυρο!', 'success');
  } catch (e) {
    console.error(e);
    const msg = String((e && e.message) || '');
    err.textContent = msg.indexOf('API error:') === -1
      ? '🌐 Σφάλμα σύνδεσης. Έλεγξε το δίκτυό σου και δοκίμασε ξανά.'
      : '❌ Το key δεν είναι έγκυρο. Έλεγξέ το και δοκίμασε ξανά.';
    err.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

// ===== SETTINGS API KEY =====

function onSettingsProviderChange() {
  const providerId = document.getElementById('settingsProvider').value;
  const p = getProvider(providerId);
  document.getElementById('settingsApiKey').placeholder = p.placeholder;
  document.getElementById('settingsApiModel').value = p.defaultModel;
}

async function saveSettingsApiKey() {
  const providerId = document.getElementById('settingsProvider').value;
  const key = document.getElementById('settingsApiKey').value.trim();
  const model = document.getElementById('settingsApiModel').value.trim() || getProvider(providerId).defaultModel;
  const btn = document.getElementById('settingsApiSaveBtn');

  if (!key) return showToast('⚠️ Γράψε ένα API key', 'error');

  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Έλεγχος...';

  try {
    await validateApiKey(providerId, key, model);

    const d = getData() || getDefaultData();
    d.provider = providerId;
    d.apiKey = key;
    d.apiModel = model;
    saveData(d);

    showToast('✅ Το API key αποθηκεύτηκε!', 'success');
    closeModal();
  } catch (e) {
    console.error(e);
    const msg = String((e && e.message) || '');
    showToast(msg.indexOf('API error:') === -1
      ? '🌐 Σφάλμα σύνδεσης. Δοκίμασε ξανά.'
      : '❌ Μη έγκυρο API key!', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}
