/* ============================================================
   JAVASCRIPT - O tee mou Complete Application
   Parody e-commerce site (Temu parody)
   ============================================================ */

'use strict';

const DEFAULT_API_KEY = '__DEEPSEEK_API_KEY__';
const STORAGE_KEY = 'oteemou_data';
const CACHE_KEY = 'oteemou_cache';
const MAX_CACHE = 20;

// ===== LOCAL STORAGE HELPERS =====

function getData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('getData error:', e);
  }
  return null;
}

function saveData(d) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch (e) {
    console.error('saveData error:', e);
  }
}

function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

function saveCache(c) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch (e) {}
}

function getDefaultData() {
  return {
    user: null,
    apiKey: DEFAULT_API_KEY,
    favorites: [],
    cart: [],
    purchaseHistory: [],
    userReviews: {},
    points: 0,
    badges: [],
    rareFinds: [],
    leaderboard: null,
    darkMode: false
  };
}

// ===== INITIALIZATION =====

function init() {
  console.log('init() called');
  let d = getData() || getDefaultData();
  if (!getData()) saveData(d);

  if (d.darkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  if (d.user) {
    console.log('User found, calling showApp()');
    showApp();
  } else {
    console.log('No user, showing setup');
    document.getElementById('setupScreen').style.display = 'flex';
  }

  if (d.apiKey && d.apiKey !== DEFAULT_API_KEY) {
    document.getElementById('apiKeyInput').value = d.apiKey;
  }

  generateRecentDiscoveries();
}

// ===== AUTH =====

function switchAuthTab(tab) {
  console.log('switchAuthTab:', tab);
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginBtn = document.getElementById('loginTabBtn');
  const signupBtn = document.getElementById('signupTabBtn');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    loginBtn.style.background = '#7B2D8E';
    loginBtn.style.color = '#fff';
    signupBtn.style.background = '#FFF8F0';
    signupBtn.style.color = '#2D1B3D';
  } else {
    signupForm.style.display = 'block';
    loginForm.style.display = 'none';
    signupBtn.style.background = '#7B2D8E';
    signupBtn.style.color = '#fff';
    loginBtn.style.background = '#FFF8F0';
    loginBtn.style.color = '#2D1B3D';
  }
}

function handleSignup() {
  console.log('handleSignup() called');
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value.trim();

  if (!name || !email || !password) {
    showToast('\u26a0\ufe0f \u03a3\u03c5\u03bc\u03c0\u03bb\u03ae\u03c1\u03c9\u03c3\u03b5 \u03cc\u03bb\u03b1 \u03c4\u03b1 \u03c0\u03b5\u03b4\u03af\u03b1!', 'error');
    return;
  }

  let d = getData() || getDefaultData();
  d.user = { name: name, email: email, password: password };
  saveData(d);
  console.log('User saved:', d.user);

  // Generate leaderboard in background
  generateLeaderboard(d);

  // Show app IMMEDIATELY
  showApp();
}

function handleLogin() {
  console.log('handleLogin() called');
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!email || !password) {
    showToast('\u26a0\ufe0f \u03a3\u03c5\u03bc\u03c0\u03bb\u03ae\u03c1\u03c9\u03c3\u03b5 email \u03ba\u03b1\u03b9 \u03ba\u03c9\u03b4\u03b9\u03ba\u03cc!', 'error');
    return;
  }

  let d = getData();
  if (!d || !d.user || d.user.email !== email || d.user.password !== password) {
    showToast('\u274c \u039b\u03ac\u03b8\u03bf\u03c2 email \u03ae \u03ba\u03c9\u03b4\u03b9\u03ba\u03cc\u03c2!', 'error');
    return;
  }

  console.log('Login successful');
  showApp();
}

function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (!key) return showToast('\u26a0\ufe0f \u0393\u03c1\u03ac\u03c8\u03b5 \u03ad\u03bd\u03b1 API key', 'error');

  let d = getData() || getDefaultData();
  d.apiKey = key;
  saveData(d);
  showToast('\u2705 API key \u03b1\u03c0\u03bf\u03b8\u03b7\u03ba\u03b5\u03cd\u03c4\u03b7\u03ba\u03b5!', 'success');
}

function showApp() {
  console.log('showApp() called');
  // Hide setup
  document.getElementById('setupScreen').style.display = 'none';
  // Show app
  document.getElementById('appScreen').style.display = 'block';

  const d = getData();
  if (d && d.user) {
    document.getElementById('headerUserName').textContent = d.user.name;
  }
  updateCartBadge();
  console.log('showApp() completed');
}

function showScreen(screen) {
  console.log('showScreen:', screen);
  const home = document.getElementById('homeScreen');
  const results = document.getElementById('resultsScreen');

  if (screen === 'home') {
    home.style.display = 'flex';
    results.style.display = 'none';
  } else if (screen === 'results') {
    home.style.display = 'none';
    results.style.display = 'block';
  }
}

// ===== RECENT DISCOVERIES =====

const FAKE_USERS = ['\u039c\u03b1\u03c1\u03af\u03b1', '\u0394\u03b7\u03bc\u03ae\u03c4\u03c1\u03b7\u03c2', '\u039a\u03b1\u03c4\u03b5\u03c1\u03af\u03bd\u03b1', '\u0393\u03b9\u03ce\u03c1\u03b3\u03bf\u03c2', '\u0395\u03bb\u03ad\u03bd\u03b7', '\u039d\u03af\u03ba\u03bf\u03c2', '\u03a3\u03bf\u03c6\u03af\u03b1', '\u0391\u03bb\u03ad\u03be\u03b7\u03c2', '\u0386\u03bd\u03bd\u03b1', '\u03a0\u03ad\u03c4\u03c1\u03bf\u03c2'];

const FAKE_DISCOVERIES = [
  { name: '\u0391\u03cc\u03c1\u03b1\u03c4\u03bf \u03ba\u03b1\u03c0\u03ad\u03bb\u03bf \u03b3\u03b9\u03b1 \u03b3\u03ac\u03c4\u03b5\u03c2', rarity: 92 },
  { name: '\u039d\u03b5\u03c1\u03cc \u03c3\u03b5 \u03c3\u03ba\u03cc\u03bd\u03b7', rarity: 45 },
  { name: '\u03a0\u03b9\u03c1\u03bf\u03cd\u03bd\u03b9 \u03c0\u03bf\u03c5 \u03c4\u03c1\u03b1\u03b3\u03bf\u03c5\u03b4\u03ac\u03b5\u03b9', rarity: 78 },
  { name: '\u03a7\u03b1\u03bb\u03af \u03c0\u03bf\u03c5 \u03c0\u03b5\u03c4\u03ac\u03b5\u03b9 (\u03bc\u03b5 \u03b6\u03ce\u03bd\u03b7 \u03b1\u03c3\u03c6\u03b1\u03bb\u03b5\u03af\u03b1\u03c2)', rarity: 88 },
  { name: '\u039a\u03bf\u03c5\u03c4\u03ac\u03bb\u03b9 \u03c0\u03bf\u03c5 \u03bc\u03b5\u03c4\u03c1\u03ac\u03b5\u03b9 \u03b8\u03b5\u03c1\u03bc\u03af\u03b4\u03b5\u03c2', rarity: 55 },
  { name: '\u03a8\u03b7\u03c6\u03b9\u03b1\u03ba\u03cc \u03ba\u03b1\u03c4\u03bf\u03b9\u03ba\u03af\u03b4\u03b9\u03bf-\u03c0\u03af\u03c4\u03c3\u03b1', rarity: 97 }
];

function generateRecentDiscoveries() {
  const list = document.getElementById('recentList');
  if (!list) return;
  list.innerHTML = '';

  const shuffled = [...FAKE_DISCOVERIES].sort(function() {
    return Math.random() - 0.5;
  }).slice(0, 5);

  shuffled.forEach(function(d, i) {
    const tag = document.createElement('span');
    tag.style.cssText = 'background:#fff;border:2px solid #FFD4B8;border-radius:50px;padding:8px 16px;font-size:0.85rem;cursor:pointer;display:flex;align-items:center;gap:6px;';
    tag.innerHTML = FAKE_USERS[i % FAKE_USERS.length] + ' \u03b2\u03c1\u03ae\u03ba\u03b5: "' + d.name + '" <span style="background:#FFD700;color:#333;border-radius:50px;padding:2px 8px;font-size:0.7rem;font-weight:700;">\u2b50' + d.rarity + '</span>';
    tag.onclick = function() {
      document.getElementById('searchInput').value = d.name;
      doSearch();
    };
    list.appendChild(tag);
  });
}

// ===== DEEPSEEK API =====

async function callDeepSeek(systemPrompt, userMessage, apiKey) {
  const resp = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.9,
      max_tokens: 2000
    })
  });

  if (!resp.ok) throw new Error('API error: ' + resp.status);
  const data = await resp.json();
  return data.choices[0].message.content;
}

// ===== SEARCH =====

async function doSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return showToast('\u26a0\ufe0f \u0393\u03c1\u03ac\u03c8\u03b5 \u03ba\u03ac\u03c4\u03b9 \u03b3\u03b9\u03b1 \u03b1\u03bd\u03b1\u03b6\u03ae\u03c4\u03b7\u03c3\u03b7!', 'error');

  // Check cache
  const cache = getCache();
  const cacheKey = query.toLowerCase().trim();
  if (cache[cacheKey]) {
    displayResults(cache[cacheKey], query);
    showToast('\u{1f4e6} \u0391\u03c0\u03cc \u03c4\u03b7\u03bd \u03ba\u03c1\u03c5\u03c6\u03ae \u03bc\u03bd\u03ae\u03bc\u03b7! (cache)', 'success');
    return;
  }

  const d = getData();
  let apiKey = (d && d.apiKey) || DEFAULT_API_KEY;

  // Check if API key is the placeholder (not replaced by GitHub Actions)
  if (apiKey === '__DEEPSEEK_API_KEY__' || !apiKey) {
    showLoading(false);
    showToast('\u26a0\ufe0f \u03a0\u03c1\u03ad\u03c0\u03b5\u03b9 \u03bd\u03b1 \u03b5\u03b9\u03c3\u03ac\u03b3\u03b5\u03b9\u03c2 \u03c4\u03bf API key \u03c3\u03bf\u03c5 \u03b1\u03c0\u03cc \u03c4\u03bf \u03b5\u03b9\u03ba\u03bf\u03bd\u03af\u03b4\u03b9\u03bf \u0394\u03c5\u03c1\u03b1\u03af\u03c9\u03bd (\u2699\ufe0f) \u03c0\u03ac\u03bd\u03c9 \u03b4\u03b5\u03be\u03b9\u03ac!', 'error');
    return;
  }

  showLoading(true);
  try {
    const systemPrompt = 'You are an absurd product generator for a parody e-commerce site. Given a search query, create 2-5 fake products. Respond ONLY with a valid JSON object (no markdown, no extra text) in this exact structure: \n' +
      '{"products":[\n' +
      '  {"name":"\u03a0\u03b5\u03c4\u03bf\u03cd\u03bc\u03b5\u03bd\u03bf \u03c8\u03c5\u03b3\u03b5\u03af\u03bf \u03bc\u03b5 \u03c6\u03c9\u03bd\u03b7\u03c4\u03b9\u03ba\u03ae \u03c5\u03c0\u03bf\u03c3\u03c4\u03ae\u03c1\u03b9\u03be\u03b7","description":"\u0394\u03b9\u03b1\u03c4\u03b7\u03c1\u03b5\u03af \u03c4\u03b1 \u03c4\u03c1\u03cc\u03c6\u03b9\u03bc\u03b1 \u03b4\u03c1\u03bf\u03c3\u03b5\u03c1\u03ac \u03ba\u03b1\u03b9 \u03c3\u03bf\u03c5 \u03bb\u03ad\u03b5\u03b9 \u03b1\u03bd \u03be\u03ad\u03c7\u03b1\u03c3\u03b5\u03c2 \u03c4\u03bf \u03b3\u03ac\u03bb\u03b1.","price":3.42,"rarity":87,"ratingBreakdown":{"1":2,"2":3,"3":10,"4":25,"5":60},"totalPurchases":1324,"reviews":[{"username":"\u0393\u03b9\u03ac\u03bd\u03bd\u03b7\u03c2","rating":5,"text":"\u039c\u03b9\u03bb\u03ac\u03b5\u03b9 \u03c0\u03b9\u03bf \u03ba\u03b1\u03b8\u03b1\u03c1\u03ac \u03b1\u03c0\u03cc \u03c4\u03bf \u03b1\u03c6\u03b5\u03bd\u03c4\u03b9\u03ba\u03cc \u03bc\u03bf\u03c5!","date":"2025-08-12"}]}\n' +
      ']}\n' +
      'Rarity must be 1-100. Number of reviews inversely proportional to rarity: 90-100\u21921-2 reviews, 70-89\u21922-3, 40-69\u21923-4, <40\u21924-5. ratingBreakdown must sum to 100%. totalPurchases 200-5000. All text in Greek. Usernames common Greek first names.';

    const raw = await callDeepSeek(systemPrompt, 'Search query: ' + query, apiKey);
    const cleaned = raw.replace(/```json?/gi, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleaned);

    if (!result.products || !result.products.length) throw new Error('No products');

    // Cache it
    cache[cacheKey] = result.products;
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHE) delete cache[keys[0]];
    saveCache(cache);

    displayResults(result.products, query);
  } catch (e) {
    console.error(e);
    // Check if it's an auth error
    if (e.message && e.message.includes('401')) {
      showToast('\u26a0\ufe0f \u039b\u03ac\u03b8\u03bf\u03c2 API key! \u03a0\u03ae\u03b3\u03b1\u03b9\u03bd\u03b5 \u03c3\u03c4\u03b9\u03c2 \u03a1\u03c5\u03b8\u03bc\u03af\u03c3\u03b5\u03b9\u03c2 (\u2699\ufe0f) \u03ba\u03b1\u03b9 \u03b2\u03ac\u03bb\u03b5 \u03c4\u03bf \u03c3\u03c9\u03c3\u03c4\u03cc API key.', 'error');
    } else {
      showToast('\u{1f605} \u039f \u03b1\u03bb\u03b3\u03cc\u03c1\u03b9\u03b8\u03bc\u03bf\u03c2 \u03c0\u03ae\u03b3\u03b5 \u03b3\u03b9\u03b1 \u03ba\u03b1\u03c6\u03ad. \u0394\u03bf\u03ba\u03af\u03bc\u03b1\u03c3\u03b5 \u03be\u03b1\u03bd\u03ac!', 'error');
    }
  } finally {
    showLoading(false);
  }
}

function displayResults(products, query) {
  document.getElementById('resultsTitle').textContent = '\u0391\u03c0\u03bf\u03c4\u03b5\u03bb\u03ad\u03c3\u03bc\u03b1\u03c4\u03b1 \u03b3\u03b9\u03b1: "' + query + '"';

  // Calculate points
  const totalRarity = products.reduce(function(sum, p) {
    return sum + (p.rarity || 0);
  }, 0);
  document.getElementById('pointsEarned').textContent = '+' + totalRarity + ' \u03c0\u03cc\u03bd\u03c4\u03bf\u03b9';

  // Add points to user
  let d = getData();
  if (d) {
    d.points = (d.points || 0) + totalRarity;
    checkBadges(d);
    saveData(d);
  }

  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';

  products.forEach(function(p, i) {
    const card = document.createElement('div');
    card.className = 'product-card' + (p.rarity === 100 ? ' rarity-100' : '');
    card.id = 'product-' + i;

    // Calculate average rating
    const rb = p.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const totalRatings = Object.values(rb).reduce(function(a, b) { return a + b; }, 0);
    const avgRating = totalRatings > 0
      ? Object.entries(rb).reduce(function(s, entry) { return s + parseInt(entry[0]) * entry[1]; }, 0) / totalRatings
      : 0;
    const fullStars = Math.round(avgRating);

    // Get reviews (AI + user)
    const productId = getProductId(p);
    const userReviews = (d && d.userReviews && d.userReviews[productId]) || [];
    const allReviews = (p.reviews || []).concat(userReviews);
    const totalReviews = allReviews.length;

    // Check if in favorites
    const isFav = d && d.favorites && d.favorites.some(function(f) {
      return getProductId(f) === productId;
    });

    // Check if in cart
    const inCart = d && d.cart && d.cart.some(function(c) {
      return getProductId(c) === productId;
    });

    card.innerHTML =
      '<div class="product-image">' +
        '<span style="font-size:4rem;opacity:0.5;">\u{1f5bc}\ufe0f</span>' +
        (p.rarity === 100 ? '<span style="position:absolute;top:8px;right:8px;font-size:2rem;animation:crownBounce 1.5s infinite;">\u{1f451}</span>' : '') +
      '</div>' +
      '<div class="product-body">' +
        '<div class="product-name">' + escapeHtml(p.name) + '</div>' +
        '<div class="product-desc">' + escapeHtml(p.description) + '</div>' +
        '<div class="product-price">\u20ac' + formatPrice(p.price) + '</div>' +
        '<div class="product-rarity">\u2b50 \u03a3\u03c0\u03b1\u03bd\u03b9\u03cc\u03c4\u03b7\u03c4\u03b1: ' + p.rarity + '/100</div>' +
        '<div class="product-stars">' +
          '<span class="stars-filled">' + '\u2605'.repeat(fullStars) + '</span><span class="stars-empty">' + '\u2606'.repeat(5 - fullStars) + '</span>' +
          '<span style="font-size:0.8rem;color:#6B5B7B;margin-left:4px;">(' + totalReviews + ' \u03ba\u03c1\u03b9\u03c4\u03b9\u03ba\u03ad\u03c2)</span>' +
        '</div>' +
        '<div class="product-meta">\u{1f6d2} ' + (p.totalPurchases || 0) + ' \u03b1\u03b3\u03bf\u03c1\u03ad\u03c2</div>' +
        '<div class="product-actions">' +
          '<button class="' + (isFav ? 'btn-fav active' : 'btn-fav') + '" onclick="toggleFav(' + i + ')">' + (isFav ? '\u2764\ufe0f' : '\u{1f90d}') + ' \u0391\u03b3\u03b1\u03c0\u03b7\u03bc\u03ad\u03bd\u03b1</button>' +
          '<button class="' + (inCart ? 'btn-fav' : 'btn-cart') + '" onclick="toggleCart(' + i + ')">' + (inCart ? '\u2705' : '\u{1f6d2}') + ' ' + (inCart ? '\u03a3\u03c4\u03bf \u03ba\u03b1\u03bb\u03ac\u03b8\u03b9' : '\u039a\u03b1\u03bb\u03ac\u03b8\u03b9') + '</button>' +
          '<button class="btn-buy" onclick="buyNow(' + i + ')">\u0391\u03b3\u03bf\u03c1\u03ac \u03c4\u03ce\u03c1\u03b1</button>' +
        '</div>' +
        '<div class="reviews-section">' +
          '<h4>\u{1f4ac} \u039a\u03c1\u03b9\u03c4\u03b9\u03ba\u03ad\u03c2 (' + totalReviews + ')</h4>' +
          allReviews.map(function(r) {
            return '<div class="review-item">' +
              '<div class="review-header">' +
                '<span class="review-user">' + escapeHtml(r.username) + '</span>' +
                '<span>' + '\u2605'.repeat(r.rating) + '\u2606'.repeat(5 - r.rating) + '</span>' +
              '</div>' +
              '<div class="review-text">' + escapeHtml(r.text) + '</div>' +
              '<div class="review-date">' + (r.date || '') + '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';

    grid.appendChild(card);

    // Confetti for rarity > 80
    if (p.rarity > 80) showConfetti();

    // Rare find notification
    if (p.rarity > 90) {
      setTimeout(function() {
        showToast('\u{1f525} \u03a3\u03c0\u03ac\u03bd\u03b9\u03bf \u03b5\u03cd\u03c1\u03b7\u03bc\u03b1! "' + p.name + '" (\u2b50' + p.rarity + ') \u03b8\u03b1 \u03bc\u03c0\u03b5\u03b9\u03c2 \u03c3\u03c4\u03bf Hall of Fame;', 'warning');
        addRareFind(p);
      }, 1000);
    }
  });

  showScreen('results');
}

function getProductId(p) {
  return (p.name || '') + '|' + (p.description || '') + '|' + (p.price || 0);
}

function formatPrice(p) {
  return p.toFixed(2).replace('.', ',');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== FAVORITES =====

function toggleFav(idx) {
  const card = document.getElementById('product-' + idx);
  if (!card) return;

  const name = card.querySelector('.product-name')?.textContent;
  const desc = card.querySelector('.product-desc')?.textContent;
  const price = parseFloat(card.querySelector('.product-price')?.textContent?.replace('\u20ac', '').replace(',', '.'));
  const rarity = parseInt(card.querySelector('.product-rarity')?.textContent?.match(/\d+/)?.[0]);
  const product = { name: name, description: desc, price: price, rarity: rarity };

  let d = getData();
  if (!d) return;

  const pid = getProductId(product);
  const existing = d.favorites.findIndex(function(f) { return getProductId(f) === pid; });

  if (existing >= 0) {
    d.favorites.splice(existing, 1);
    showToast('\u{1f494} \u0391\u03c6\u03b1\u03b9\u03c1\u03ad\u03b8\u03b7\u03ba\u03b5 \u03b1\u03c0\u03cc \u03b1\u03b3\u03b1\u03c0\u03b7\u03bc\u03ad\u03bd\u03b1', 'error');
  } else {
    d.favorites.push(product);
    showToast('\u2764\ufe0f \u03a0\u03c1\u03bf\u03c3\u03c4\u03ad\u03b8\u03b7\u03ba\u03b5 \u03c3\u03c4\u03b1 \u03b1\u03b3\u03b1\u03c0\u03b7\u03bc\u03ad\u03bd\u03b1!', 'success');
  }

  saveData(d);
  checkBadges(d);

  // Re-render
  const products = getCurrentProducts();
  if (products) {
    const title = document.getElementById('resultsTitle').textContent;
    const q = title.replace('\u0391\u03c0\u03bf\u03c4\u03b5\u03bb\u03ad\u03c3\u03bc\u03b1\u03c4\u03b1 \u03b3\u03b9\u03b1: "', '').replace('"', '');
    displayResults(products, q);
  }
}

// ===== CART =====

function toggleCart(idx) {
  const card = document.getElementById('product-' + idx);
  if (!card) return;

  const name = card.querySelector('.product-name')?.textContent;
  const desc = card.querySelector('.product-desc')?.textContent;
  const price = parseFloat(card.querySelector('.product-price')?.textContent?.replace('\u20ac', '').replace(',', '.'));
  const rarity = parseInt(card.querySelector('.product-rarity')?.textContent?.match(/\d+/)?.[0]);
  const product = { name: name, description: desc, price: price, rarity: rarity };

  let d = getData();
  if (!d) return;

  const pid = getProductId(product);
  const existing = d.cart.findIndex(function(c) { return getProductId(c) === pid; });

  if (existing >= 0) {
    d.cart.splice(existing, 1);
    showToast('\u{1f5d1}\ufe0f \u0391\u03c6\u03b1\u03b9\u03c1\u03ad\u03b8\u03b7\u03ba\u03b5 \u03b1\u03c0\u03cc \u03c4\u03bf \u03ba\u03b1\u03bb\u03ac\u03b8\u03b9', 'error');
  } else {
    d.cart.push(product);
    showToast('\u{1f6d2} \u03a0\u03c1\u03bf\u03c3\u03c4\u03ad\u03b8\u03b7\u03ba\u03b5 \u03c3\u03c4\u03bf \u03ba\u03b1\u03bb\u03ac\u03b8\u03b9!', 'success');
  }

  saveData(d);
  updateCartBadge();

  const products = getCurrentProducts();
  if (products) {
    const title = document.getElementById('resultsTitle').textContent;
    const q = title.replace('\u0391\u03c0\u03bf\u03c4\u03b5\u03bb\u03ad\u03c3\u03bc\u03b1\u03c4\u03b1 \u03b3\u03b9\u03b1: "', '').replace('"', '');
    displayResults(products, q);
  }
}

function updateCartBadge() {
  const d = getData();
  const badge = document.getElementById('cartBadge');

  if (d && d.cart && d.cart.length > 0) {
    badge.textContent = d.cart.length;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function getCurrentProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid.children.length) return null;

  const products = [];
  grid.querySelectorAll('.product-card').forEach(function(card) {
    const name = card.querySelector('.product-name')?.textContent;
    const desc = card.querySelector('.product-desc')?.textContent;
    const price = parseFloat(card.querySelector('.product-price')?.textContent?.replace('\u20ac', '').replace(',', '.'));
    const rarity = parseInt(card.querySelector('.product-rarity')?.textContent?.match(/\d+/)?.[0]);
    if (name) products.push({ name: name, description: desc, price: price, rarity: rarity });
  });

  return products;
}

// ===== PURCHASE =====

let lastPurchasedProduct = null;

function buyNow(idx) {
  const card = document.getElementById('product-' + idx);
  if (!card) return;

  const name = card.querySelector('.product-name')?.textContent;
  const desc = card.querySelector('.product-desc')?.textContent;
  const price = parseFloat(card.querySelector('.product-price')?.textContent?.replace('\u20ac', '').replace(',', '.'));
  const rarity = parseInt(card.querySelector('.product-rarity')?.textContent?.match(/\d+/)?.[0]);
  const product = { name: name, description: desc, price: price, rarity: rarity };

  lastPurchasedProduct = product;
  document.getElementById('purchaseProductName').textContent = '"' + name + '" \u03ad\u03c1\u03c7\u03b5\u03c4\u03b1\u03b9... \u03b1\u03c0\u03cc \u03ac\u03bb\u03bb\u03b7 \u03b4\u03b9\u03ac\u03c3\u03c4\u03b1\u03c3\u03b7! \u{1f680}';
  document.getElementById('purchaseOverlay').style.display = 'flex';

  // Add to purchase history
  let d = getData();
  if (d) {
    d.purchaseHistory = d.purchaseHistory || [];
    d.purchaseHistory.push(product);
    saveData(d);
    checkBadges(d);
  }

  showConfetti();
}

function closePurchase() {
  document.getElementById('purchaseOverlay').style.display = 'none';
  lastPurchasedProduct = null;
}

function closePurchaseAndReview() {
  document.getElementById('purchaseOverlay').style.display = 'none';
  if (lastPurchasedProduct) showReviewForm(lastPurchasedProduct);
  lastPurchasedProduct = null;
}

// ===== REVIEWS =====

function showReviewForm(product) {
  const pid = getProductId(product);
  document.getElementById('modalTitle').textContent = '\u270d\ufe0f \u039a\u03c1\u03b9\u03c4\u03b9\u03ba\u03ae \u03b3\u03b9\u03b1: ' + product.name;
  document.getElementById('modalBody').innerHTML =
    '<div class="review-form">' +
      '<div class="star-selector" id="starSelector">' +
        [1, 2, 3, 4, 5].map(function(s) {
          return '<span data-star="' + s + '" onclick="setReviewStar(' + s + ')">\u2606</span>';
        }).join('') +
      '</div>' +
      '<textarea id="reviewText" placeholder="\u0393\u03c1\u03ac\u03c8\u03b5 \u03c4\u03b7\u03bd \u03ba\u03c1\u03b9\u03c4\u03b9\u03ba\u03ae \u03c3\u03bf\u03c5..." rows="3"></textarea>' +
      '<button onclick="submitReview(\'' + pid + '\')" style="width:100%;padding:12px 28px;border:none;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:1rem;font-weight:600;cursor:pointer;background:linear-gradient(135deg,#FF6B35,#7B2D8E);color:#fff;">\u03a5\u03c0\u03bf\u03b2\u03bf\u03bb\u03ae \u2705</button>' +
    '</div>';

  document.getElementById('modalOverlay').style.display = 'flex';
  window._reviewStar = 5;
  setReviewStar(5);
}

function setReviewStar(star) {
  window._reviewStar = star;
  document.querySelectorAll('#starSelector span').forEach(function(el) {
    el.textContent = parseInt(el.dataset.star) <= star ? '\u2605' : '\u2606';
  });
}

function submitReview(pid) {
  const text = document.getElementById('reviewText').value.trim();
  if (!text) return showToast('\u26a0\ufe0f \u0393\u03c1\u03ac\u03c8\u03b5 \u03ba\u03ac\u03c4\u03b9!', 'error');

  const d = getData();
  if (!d) return;

  d.userReviews = d.userReviews || {};
  d.userReviews[pid] = d.userReviews[pid] || [];
  d.userReviews[pid].push({
    username: d.user.name,
    rating: window._reviewStar || 5,
    text: text,
    date: new Date().toISOString().split('T')[0]
  });

  saveData(d);
  closeModal();
  showToast('\u2705 \u039a\u03c1\u03b9\u03c4\u03b9\u03ba\u03ae \u03c0\u03c1\u03bf\u03c3\u03c4\u03ad\u03b8\u03b7\u03ba\u03b5!', 'success');
}

// ===== RARE FINDS =====

function addRareFind(product) {
  if (!product || product.rarity <= 90) return;

  let d = getData();
  if (!d) return;

  d.rareFinds = d.rareFinds || [];
  const pid = getProductId(product);

  if (!d.rareFinds.some(function(r) { return getProductId(r) === pid; })) {
    d.rareFinds.push(product);
    saveData(d);
  }
}

// ===== BADGES =====

const BADGE_DEFS = [
  { id: 'explorer', name: '\u0395\u03be\u03b5\u03c1\u03b5\u03c5\u03bd\u03b7\u03c4\u03ae\u03c2', icon: '\u{1f50d}', desc: '\u03a0\u03c1\u03ce\u03c4\u03b7 \u03b1\u03bd\u03b1\u03b6\u03ae\u03c4\u03b7\u03c3\u03b7', check: function(d) { return (d.points || 0) >= 10; } },
  { id: 'collector', name: '\u03a3\u03c5\u03bb\u03bb\u03ad\u03ba\u03c4\u03b7\u03c2', icon: '\u{1f4e6}', desc: '500+ \u03c0\u03cc\u03bd\u03c4\u03bf\u03b9', check: function(d) { return (d.points || 0) >= 500; } },
  { id: 'legend', name: '\u0398\u03c1\u03cd\u03bb\u03bf\u03c2 \u03c4\u03bf\u03c5 O tee mou', icon: '\u{1f451}', desc: '\u0392\u03c1\u03b5\u03c2 rarity 100', check: function(d) { return d.rareFinds && d.rareFinds.some(function(r) { return r.rarity === 100; }); } },
  { id: 'hearts', name: '\u039a\u03b1\u03c1\u03b4\u03bf\u03cd\u03bb\u03b5\u03c2', icon: '\u{1f496}', desc: '5 \u03b1\u03b3\u03b1\u03c0\u03b7\u03bc\u03ad\u03bd\u03b1', check: function(d) { return d.favorites && d.favorites.length >= 5; } },
  { id: 'shopaholic', name: 'Shopaholic', icon: '\u{1f6cd}\ufe0f', desc: '3 \u03b1\u03b3\u03bf\u03c1\u03ad\u03c2', check: function(d) { return d.purchaseHistory && d.purchaseHistory.length >= 3; } },
  { id: 'hunter', name: '\u039a\u03c5\u03bd\u03b7\u03b3\u03cc\u03c2 \u03a3\u03c0\u03b1\u03bd\u03af\u03c9\u03bd', icon: '\u{1f3c6}', desc: '3 \u03c3\u03c0\u03ac\u03bd\u03b9\u03b1 \u03b5\u03c5\u03c1\u03ae\u03bc\u03b1\u03c4\u03b1', check: function(d) { return d.rareFinds && d.rareFinds.length >= 3; } },
  { id: 'hoarder', name: '\u039c\u03b1\u03b6\u03b5\u03cd\u03c4\u03c1\u03b9\u03b1', icon: '\u{1f5c4}\ufe0f', desc: '10 \u03c3\u03c4\u03bf \u03ba\u03b1\u03bb\u03ac\u03b8\u03b9', check: function(d) { return d.cart && d.cart.length >= 10; } },
  { id: 'reviewer', name: '\u039a\u03c1\u03b9\u03c4\u03b9\u03ba\u03cc\u03c2', icon: '\u{1f4dd}', desc: '\u0393\u03c1\u03ac\u03c8\u03b5 3 \u03ba\u03c1\u03b9\u03c4\u03b9\u03ba\u03ad\u03c2', check: function(d) {
    const r = d.userReviews || {};
    return Object.values(r).reduce(function(a, b) { return a + b.length; }, 0) >= 3;
  }}
];

function checkBadges(d) {
  if (!d) return;
  d.badges = d.badges || [];
  let changed = false;

  BADGE_DEFS.forEach(function(b) {
    if (!d.badges.includes(b.id) && b.check(d)) {
      d.badges.push(b.id);
      changed = true;
      showToast('\u{1f3c5} \u039d\u03ad\u03bf badge: ' + b.name + '!', 'success');
    }
  });

  if (changed) saveData(d);
}

// ===== LEADERBOARD (AI generated) =====

async function generateLeaderboard(d) {
  if (d.leaderboard) return; // Already generated

  const apiKey = d.apiKey || DEFAULT_API_KEY;

  try {
    const systemPrompt = 'Generate a JSON array of 10 fake Greek users with scores for a leaderboard. Respond ONLY with valid JSON array: [{"name":"\u039c\u03b1\u03c1\u03af\u03b1","score":987},...]. Scores 100-1000. Names common Greek first names.';
    const raw = await callDeepSeek(systemPrompt, 'Generate leaderboard', apiKey);
    const cleaned = raw.replace(/```json?/gi, '').replace(/```/g, '').trim();
    const lb = JSON.parse(cleaned);

    if (Array.isArray(lb) && lb.length >= 5) {
      d.leaderboard = lb.slice(0, 10);
      saveData(d);
    }
  } catch (e) {
    // Fallback: generate fake leaderboard locally
    const fallback = ['\u039c\u03b1\u03c1\u03af\u03b1', '\u0394\u03b7\u03bc\u03ae\u03c4\u03c1\u03b7\u03c2', '\u039a\u03b1\u03c4\u03b5\u03c1\u03af\u03bd\u03b1', '\u0393\u03b9\u03ce\u03c1\u03b3\u03bf\u03c2', '\u0395\u03bb\u03ad\u03bd\u03b7', '\u039d\u03af\u03ba\u03bf\u03c2', '\u03a3\u03bf\u03c6\u03af\u03b1', '\u0391\u03bb\u03ad\u03be\u03b7\u03c2', '\u0386\u03bd\u03bd\u03b1', '\u03a0\u03ad\u03c4\u03c1\u03bf\u03c2'];
    d.leaderboard = fallback.map(function(n, i) {
      return { name: n, score: 1000 - i * 87 + Math.floor(Math.random() * 50) };
    });
    saveData(d);
  }
}

// ===== MODALS =====

function showModal(title, content) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = content;
  document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

// ===== PROFILE =====

function showProfile() {
  const d = getData();
  if (!d) return;

  const badges = d.badges || [];
  const allBadges = BADGE_DEFS.map(function(b) {
    return '<div class="badge-item ' + (badges.includes(b.id) ? 'unlocked' : 'locked') + '">' +
      '<span class="badge-icon">' + b.icon + '</span>' +
      '<span class="badge-name">' + b.name + '</span>' +
      '<span class="badge-desc">' + b.desc + '</span>' +
    '</div>';
  }).join('');

  showModal('\u{1f464} ' + d.user.name,
    '<div style="text-align:center;margin-bottom:16px;">' +
      '<div style="font-size:3rem;">\u2b50</div>' +
      '<h3>' + (d.points || 0) + ' \u03c0\u03cc\u03bd\u03c4\u03bf\u03b9</h3>' +
      '<p style="color:#6B5B7B;font-size:0.85rem;">\u0395\u03be\u03b5\u03c1\u03b5\u03cd\u03bd\u03b7\u03c3\u03b5 \u03b3\u03b9\u03b1 \u03bd\u03b1 \u03ba\u03b5\u03c1\u03b4\u03af\u03c3\u03b5\u03b9\u03c2 \u03c0\u03b5\u03c1\u03b9\u03c3\u03c3\u03cc\u03c4\u03b5\u03c1\u03bf\u03c5\u03c2!</p>' +
    '</div>' +
    '<h3 style="margin-bottom:10px;">\u{1f3c5} Badges (' + badges.length + '/' + BADGE_DEFS.length + ')</h3>' +
    '<div class="badge-grid">' + allBadges + '</div>' +
    '<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">' +
      '<button onclick="showLeaderboard()" style="padding:8px 16px;border:2px solid #FFD4B8;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;background:#FFF8F0;color:#2D1B3D;">\u{1f3c6} Leaderboard</button>' +
      '<button onclick="showHallOfFame()" style="padding:8px 16px;border:2px solid #FFD4B8;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;background:#FFF8F0;color:#2D1B3D;">\u{1f396}\ufe0f Hall of Fame</button>' +
      '<button onclick="exportData()" style="padding:8px 16px;border:2px solid #FFD4B8;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;background:#FFF8F0;color:#2D1B3D;">\u{1f4e4} \u0395\u03be\u03b1\u03b3\u03c9\u03b3\u03ae</button>' +
      '<button onclick="document.getElementById(\'importFile\').click()" style="padding:8px 16px;border:2px solid #FFD4B8;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;background:#FFF8F0;color:#2D1B3D;">\u{1f4e5} \u0395\u03b9\u03c3\u03b1\u03b3\u03c9\u03b3\u03ae</button>' +
      '<input type="file" id="importFile" accept=".json" style="display:none;" onchange="importData(event)">' +
    '</div>'
  );
}

// ===== LEADERBOARD VIEW =====

function showLeaderboard() {
  const d = getData();
  if (!d) return;

  const lb = d.leaderboard || [];
  const userPoints = d.points || 0;

  // Add user to leaderboard
  const allEntries = lb.concat([{ name: d.user.name + ' (\u03b5\u03c3\u03cd)', score: userPoints, isUser: true }]);
  allEntries.sort(function(a, b) { return b.score - a.score; });

  const items = allEntries.slice(0, 15).map(function(e, i) {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    const isUser = e.isUser;
    return '<div class="leaderboard-item ' + (isUser ? 'current-user' : '') + '">' +
      '<span class="rank ' + rankClass + '">' + (i + 1) + '</span>' +
      '<span class="lb-name">' + e.name + '</span>' +
      '<span class="lb-points">' + e.score + ' \u03c0\u03cc\u03bd\u03c4\u03bf\u03b9</span>' +
    '</div>';
  }).join('');

  showModal('\u{1f3c6} Top \u0395\u03c5\u03c1\u03ae\u03bc\u03b1\u03c4\u03b1 (Leaderboard)',
    '<p style="color:#6B5B7B;margin-bottom:16px;">\u039f\u03b9 \u03ba\u03bf\u03c1\u03c5\u03c6\u03b1\u03af\u03bf\u03b9 \u03b5\u03be\u03b5\u03c1\u03b5\u03c5\u03bd\u03b7\u03c4\u03ad\u03c2 \u03c4\u03bf\u03c5 O tee mou!</p>' +
    items
  );
}

// ===== HALL OF FAME =====

function showHallOfFame() {
  const d = getData();
  if (!d) return;

  const rare = d.rareFinds || [];
  if (!rare.length) {
    showModal('\u{1f396}\ufe0f Hall of Fame',
      '<p style="color:#6B5B7B;text-align:center;">\u0394\u03b5\u03bd \u03ad\u03c7\u03b5\u03b9\u03c2 \u03b2\u03c1\u03b5\u03b9 \u03b1\u03ba\u03cc\u03bc\u03b1 \u03c3\u03c0\u03ac\u03bd\u03b9\u03b1 \u03b5\u03c5\u03c1\u03ae\u03bc\u03b1\u03c4\u03b1! \u{1f50d} \u03a3\u03c5\u03bd\u03ad\u03c7\u03b9\u03c3\u03b5 \u03bd\u03b1 \u03c8\u03ac\u03c7\u03bd\u03b5\u03b9\u03c2!</p>'
    );
    return;
  }

  const items = rare.map(function(r) {
    return '<div class="hall-item">' +
      '<div class="trophy">' + (r.rarity === 100 ? '\u{1f451}' : '\u{1f3c6}') + '</div>' +
      '<div class="hall-name">' + escapeHtml(r.name) + '</div>' +
      '<div class="hall-rarity">\u2b50 \u03a3\u03c0\u03b1\u03bd\u03b9\u03cc\u03c4\u03b7\u03c4\u03b1: ' + r.rarity + '/100</div>' +
    '</div>';
  }).join('');

  showModal('\u{1f396}\ufe0f Hall of Fame',
    '<p style="color:#6B5B7B;margin-bottom:16px;">\u03a4\u03b1 \u03c3\u03c0\u03b1\u03bd\u03b9\u03cc\u03c4\u03b5\u03c1\u03b1 \u03b5\u03c5\u03c1\u03ae\u03bc\u03b1\u03c4\u03ac \u03c3\u03bf\u03c5!</p>' +
    '<div class="hall-grid">' + items + '</div>'
  );
}

// ===== FAVORITES VIEW =====

function showFavorites() {
  const d = getData();
  if (!d) return;

  const favs = d.favorites || [];
  if (!favs.length) {
    showModal('\u2764\ufe0f \u0391\u03b3\u03b1\u03c0\u03b7\u03bc\u03ad\u03bd\u03b1',
      '<p style="color:#6B5B7B;text-align:center;">\u0394\u03b5\u03bd \u03ad\u03c7\u03b5\u03b9\u03c2 \u03b1\u03b3\u03b1\u03c0\u03b7\u03bc\u03ad\u03bd\u03b1 \u03b1\u03ba\u03cc\u03bc\u03b1! \u2764\ufe0f \u03a0\u03c1\u03cc\u03c3\u03b8\u03b5\u03c3\u03b5 \u03c0\u03c1\u03bf\u03ca\u03cc\u03bd\u03c4\u03b1 \u03c0\u03bf\u03c5 \u03c3\u03bf\u03c5 \u03b1\u03c1\u03ad\u03c3\u03bf\u03c5\u03bd!</p>'
    );
    return;
  }

  const items = favs.map(function(f, i) {
    return '<div class="cart-item">' +
      '<div class="cart-img">\u{1f5bc}\ufe0f</div>' +
      '<div class="cart-info">' +
        '<div class="cart-name">' + escapeHtml(f.name) + '</div>' +
        '<div class="cart-price">\u20ac' + formatPrice(f.price) + ' \u2b50' + (f.rarity || 0) + '</div>' +
      '</div>' +
      '<button class="cart-remove" onclick="removeFav(' + i + ')">\u{1f5d1}\ufe0f</button>' +
    '</div>';
  }).join('');

  showModal('\u2764\ufe0f \u0391\u03b3\u03b1\u03c0\u03b7\u03bc\u03ad\u03bd\u03b1 (' + favs.length + ')',
    '<div style="margin-bottom:16px;">' + items + '</div>' +
    '<button onclick="closeModal()" style="width:100%;padding:12px 28px;border:none;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:1rem;font-weight:600;cursor:pointer;background:linear-gradient(135deg,#FF6B35,#7B2D8E);color:#fff;">\u0395\u03bd\u03c4\u03ac\u03be\u03b5\u03b9 \u2705</button>'
  );
}

function removeFav(idx) {
  let d = getData();
  if (!d) return;
  d.favorites = d.favorites || [];
  if (idx >= 0 && idx < d.favorites.length) {
    d.favorites.splice(idx, 1);
    saveData(d);
    showToast('\u{1f494} \u0391\u03c6\u03b1\u03b9\u03c1\u03ad\u03b8\u03b7\u03ba\u03b5 \u03b1\u03c0\u03cc \u03b1\u03b3\u03b1\u03c0\u03b7\u03bc\u03ad\u03bd\u03b1', 'error');
    showFavorites(); // Re-render
  }
}

// ===== CART VIEW =====

function showCart() {
  const d = getData();
  if (!d) return;

  const cart = d.cart || [];
  if (!cart.length) {
    showModal('\u{1f6d2} \u039a\u03b1\u03bb\u03ac\u03b8\u03b9',
      '<p style="color:#6B5B7B;text-align:center;">\u03a4\u03bf \u03ba\u03b1\u03bb\u03ac\u03b8\u03b9 \u03c3\u03bf\u03c5 \u03b5\u03af\u03bd\u03b1\u03b9 \u03ac\u03b4\u03b5\u03b9\u03bf! \u{1f6d2} \u03a8\u03ac\u03be\u03b5 \u03b3\u03b9\u03b1 \u03b1\u03c0\u03af\u03b8\u03b1\u03bd\u03b1 \u03c0\u03c1\u03bf\u03ca\u03cc\u03bd\u03c4\u03b1!</p>'
    );
    return;
  }

  const total = cart.reduce(function(sum, c) { return sum + (c.price || 0); }, 0);

  const items = cart.map(function(c, i) {
    return '<div class="cart-item">' +
      '<div class="cart-img">\u{1f5bc}\ufe0f</div>' +
      '<div class="cart-info">' +
        '<div class="cart-name">' + escapeHtml(c.name) + '</div>' +
        '<div class="cart-price">\u20ac' + formatPrice(c.price) + '</div>' +
      '</div>' +
      '<button class="cart-remove" onclick="removeFromCart(' + i + ')">\u{1f5d1}\ufe0f</button>' +
    '</div>';
  }).join('');

  showModal('\u{1f6d2} \u039a\u03b1\u03bb\u03ac\u03b8\u03b9 (' + cart.length + ')',
    '<div style="margin-bottom:16px;">' + items + '</div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-top:2px solid #FFD4B8;margin-bottom:12px;">' +
      '<span style="font-weight:600;">\u03a3\u03cd\u03bd\u03bf\u03bb\u03bf:</span>' +
      '<span style="font-size:1.3rem;font-weight:700;color:#FF6B35;">\u20ac' + formatPrice(total) + '</span>' +
    '</div>' +
    '<button onclick="checkoutAll()" style="width:100%;padding:12px 28px;border:none;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:1rem;font-weight:600;cursor:pointer;background:linear-gradient(135deg,#FF6B35,#7B2D8E);color:#fff;">\u0391\u03b3\u03bf\u03c1\u03ac \u03cc\u03bb\u03c9\u03bd \u{1f680}</button>'
  );
}

function removeFromCart(idx) {
  let d = getData();
  if (!d) return;
  d.cart = d.cart || [];
  if (idx >= 0 && idx < d.cart.length) {
    d.cart.splice(idx, 1);
    saveData(d);
    updateCartBadge();
    showToast('\u{1f5d1}\ufe0f \u0391\u03c6\u03b1\u03b9\u03c1\u03ad\u03b8\u03b7\u03ba\u03b5 \u03b1\u03c0\u03cc \u03c4\u03bf \u03ba\u03b1\u03bb\u03ac\u03b8\u03b9', 'error');
    showCart(); // Re-render
  }
}

function checkoutAll() {
  let d = getData();
  if (!d || !d.cart || !d.cart.length) return;

  d.purchaseHistory = d.purchaseHistory || [];
  d.cart.forEach(function(c) {
    d.purchaseHistory.push(c);
  });

  const total = d.cart.reduce(function(sum, c) { return sum + (c.price || 0); }, 0);
  d.cart = [];
  saveData(d);
  updateCartBadge();
  checkBadges(d);

  closeModal();
  showToast('\u{1f389} \u0391\u03b3\u03cc\u03c1\u03b1\u03c3\u03b5\u03c2 \u03c4\u03b1 \u03c0\u03ac\u03bd\u03c4\u03b1! (\u20ac' + formatPrice(total) + ')', 'success');
  showConfetti();
}

// ===== SETTINGS =====

function showSettings() {
  const d = getData();
  if (!d) return;

  showModal('\u2699\ufe0f \u03a1\u03c5\u03b8\u03bc\u03af\u03c3\u03b5\u03b9\u03c2',
    '<div class="settings-group">' +
      '<h3>\u{1f511} API Key DeepSeek</h3>' +
      '<div class="form-group">' +
        '<input type="password" id="settingsApiKey" value="' + (d.apiKey || '') + '" placeholder="sk-..." style="width:100%;padding:12px 16px;border:2px solid #FFD4B8;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:0.95rem;background:#FFF8F0;color:#2D1B3D;box-sizing:border-box;">' +
      '</div>' +
      '<button onclick="saveSettingsApiKey()" style="padding:8px 16px;border:2px solid #FFD4B8;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;background:#FFF8F0;color:#2D1B3D;">\u0391\u03c0\u03bf\u03b8\u03ae\u03ba\u03b5\u03c5\u03c3\u03b7 \u{1f4be}</button>' +
    '</div>' +
    '<div class="settings-group">' +
      '<h3>\u{1f319} \u0395\u03bc\u03c6\u03ac\u03bd\u03b9\u03c3\u03b7</h3>' +
      '<button onclick="toggleDarkMode()" style="padding:8px 16px;border:2px solid #FFD4B8;border-radius:10px;font-family:\'Fredoka\',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;background:#FFF8F0;color:#2D1B3D;">' + (d.darkMode ? '\u2600\ufe0f \u03a6\u03c9\u03c4\u03b5\u03b9\u03bd\u03ae \u03bb\u03b5\u03b9\u03c4\u03bf\u03c5\u03c1\u03b3\u03af\u03b1' : '\u{1f319} \u03a3\u03ba\u03bf\u03c4\u03b5\u03b9\u03bd\u03ae \u03bb\u03b5\u03b9\u03c4\u03bf\u03c5\u03c1\u03b3\u03af\u03b1') + '</button>' +
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

function saveSettingsApiKey() {
  const key = document.getElementById('settingsApiKey').value.trim();
  if (!key) return showToast('\u26a0\ufe0f \u0393\u03c1\u03ac\u03c8\u03b5 \u03ad\u03bd\u03b1 API key', 'error');

  let d = getData() || getDefaultData();
  d.apiKey = key;
  saveData(d);
  showToast('\u2705 API key \u03b1\u03c0\u03bf\u03b8\u03b7\u03ba\u03b5\u03cd\u03c4\u03b7\u03ba\u03b5!', 'success');
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

// ===== UI HELPERS =====

function showLoading(show) {
  document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function showToast(message, type) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast ' + (type || '');
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(function() { toast.remove(); }, 300);
  }, 3000);
}

function showConfetti() {
  const container = document.getElementById('confettiContainer');
  if (!container) return;

  const colors = ['#FF6B35', '#7B2D8E', '#FFD700', '#2ECC71', '#E74C3C', '#3498DB', '#FF69B4'];

  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (Math.random() * 8 + 4) + 'px';
    piece.style.height = (Math.random() * 8 + 4) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
    piece.style.animationDelay = (Math.random() * 0.5) + 's';
    container.appendChild(piece);

    setTimeout(function() { piece.remove(); }, 4000);
  }
}

// ===== INIT =====

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded - initializing O tee mou');
  init();
});
