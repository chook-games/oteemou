/* ============================================================
   JAVASCRIPT - O tee mou Complete Application
   Parody e-commerce site (Temu parody: Orange + Purple + Chaos)
   ============================================================ */

const DEFAULT_API_KEY = '__DEEPSEEK_API_KEY__';
const STORAGE_KEY = 'oteemou_data';
const CACHE_KEY = 'oteemou_cache';
const MAX_CACHE = 20;

// ===== LOCAL STORAGE HELPERS =====

function getData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function saveData(d) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch (e) {
    showToast('⚠️ Πρόβλημα με την αποθήκευση.', 'error');
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
  let d = getData() || getDefaultData();
  if (!getData()) saveData(d);

  if (d.darkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  if (d.user) {
    showApp();
  } else {
    document.getElementById('setupScreen').classList.add('active');
  }

  if (d.apiKey && d.apiKey !== DEFAULT_API_KEY) {
    document.getElementById('apiKeyInput').value = d.apiKey;
  }

  generateRecentDiscoveries();
}

// ===== AUTH =====

function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginBtn = document.getElementById('loginTabBtn');
  const signupBtn = document.getElementById('signupTabBtn');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    loginBtn.style.background = 'var(--purple)';
    loginBtn.style.color = '#fff';
    signupBtn.style.background = 'var(--bg)';
    signupBtn.style.color = 'var(--text)';
  } else {
    signupForm.style.display = 'block';
    loginForm.style.display = 'none';
    signupBtn.style.background = 'var(--purple)';
    signupBtn.style.color = '#fff';
    loginBtn.style.background = 'var(--bg)';
    loginBtn.style.color = 'var(--text)';
  }
}

function handleSignup() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value.trim();

  if (!name || !email || !password) {
    return showToast('⚠️ Συμπλήρωσε όλα τα πεδία!', 'error');
  }

  let d = getData() || getDefaultData();
  d.user = { name: name, email: email, password: password };
  saveData(d);

  // Generate leaderboard via AI on first signup (fire and forget - showApp regardless)
  generateLeaderboard(d).catch(function() {}).finally(function() {
    showApp();
  });
}

function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!email || !password) {
    return showToast('⚠️ Συμπλήρωσε email και κωδικό!', 'error');
  }

  let d = getData();
  if (!d || !d.user || d.user.email !== email || d.user.password !== password) {
    return showToast('❌ Λάθος email ή κωδικός!', 'error');
  }

  showApp();
}

function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (!key) return showToast('⚠️ Γράψε ένα API key', 'error');

  let d = getData() || getDefaultData();
  d.apiKey = key;
  saveData(d);
  showToast('✅ API key αποθηκεύτηκε!', 'success');
}

function showApp() {
  document.getElementById('setupScreen').classList.remove('active');
  document.getElementById('appScreen').classList.add('active');

  const d = getData();
  if (d && d.user) {
    document.getElementById('headerUserName').textContent = d.user.name;
  }
  updateCartBadge();
}

function showScreen(screen) {
  document.querySelectorAll('#appScreen .screen').forEach(function(el) {
    el.classList.remove('active');
  });

  if (screen === 'home') {
    document.getElementById('homeScreen').classList.add('active');
  } else if (screen === 'results') {
    document.getElementById('resultsScreen').classList.add('active');
  }
}

// ===== RECENT DISCOVERIES =====

const FAKE_USERS = ['Μαρία', 'Δημήτρης', 'Κατερίνα', 'Γιώργος', 'Ελένη', 'Νίκος', 'Σοφία', 'Αλέξης', 'Άννα', 'Πέτρος'];

const FAKE_DISCOVERIES = [
  { name: 'Αόρατο καπέλο για γάτες', rarity: 92 },
  { name: 'Νερό σε σκόνη', rarity: 45 },
  { name: 'Πιρούνι που τραγουδάει', rarity: 78 },
  { name: 'Χαλί που πετάει (με ζώνη ασφαλείας)', rarity: 88 },
  { name: 'Κουτάλι που μετράει θερμίδες', rarity: 55 },
  { name: 'Ψηφιακό κατοικίδιο-πίτσα', rarity: 97 }
];

function generateRecentDiscoveries() {
  const list = document.getElementById('recentList');
  list.innerHTML = '';

  const shuffled = [...FAKE_DISCOVERIES].sort(function() {
    return Math.random() - 0.5;
  }).slice(0, 5);

  shuffled.forEach(function(d, i) {
    const tag = document.createElement('span');
    tag.className = 'recent-tag';
    tag.innerHTML = FAKE_USERS[i % FAKE_USERS.length] + ' βρήκε: "' + d.name + '" <span class="rarity-badge">⭐' + d.rarity + '</span>';
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
  if (!query) return showToast('⚠️ Γράψε κάτι για αναζήτηση!', 'error');

  // Check cache
  const cache = getCache();
  const cacheKey = query.toLowerCase().trim();
  if (cache[cacheKey]) {
    displayResults(cache[cacheKey], query);
    showToast('📦 Από την κρυφή μνήμη! (cache)', 'success');
    return;
  }

  const d = getData();
  const apiKey = d.apiKey || DEFAULT_API_KEY;

  showLoading(true);
  try {
    const systemPrompt = 'You are an absurd product generator for a parody e-commerce site. Given a search query, create 2-5 fake products. Respond ONLY with a valid JSON object (no markdown, no extra text) in this exact structure: \n' +
      '{"products":[\n' +
      '  {"name":"Πετούμενο ψυγείο με φωνητική υποστήριξη","description":"Διατηρεί τα τρόφιμα δροσερά και σου λέει αν ξέχασες το γάλα.","price":3.42,"rarity":87,"ratingBreakdown":{"1":2,"2":3,"3":10,"4":25,"5":60},"totalPurchases":1324,"reviews":[{"username":"Γιάννης","rating":5,"text":"Μιλάει πιο καθαρά από το αφεντικό μου!","date":"2025-08-12"}]}\n' +
      ']}\n' +
      'Rarity must be 1-100. Number of reviews inversely proportional to rarity: 90-100→1-2 reviews, 70-89→2-3, 40-69→3-4, <40→4-5. ratingBreakdown must sum to 100%. totalPurchases 200-5000. All text in Greek. Usernames common Greek first names.';

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
    showToast('😅 Ο αλγόριθμος πήγε για καφέ. Δοκίμασε ξανά!', 'error');
  } finally {
    showLoading(false);
  }
}

function displayResults(products, query) {
  document.getElementById('resultsTitle').textContent = 'Αποτελέσματα για: "' + query + '"';

  // Calculate points
  const totalRarity = products.reduce(function(sum, p) {
    return sum + (p.rarity || 0);
  }, 0);
  document.getElementById('pointsEarned').textContent = '+' + totalRarity + ' πόντοι';

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
        '<span class="missing-icon">🖼️</span>' +
        (p.rarity === 100 ? '<span class="crown">👑</span>' : '') +
      '</div>' +
      '<div class="product-body">' +
        '<div class="product-name">' + escapeHtml(p.name) + '</div>' +
        '<div class="product-desc">' + escapeHtml(p.description) + '</div>' +
        '<div class="product-price">€' + formatPrice(p.price) + '</div>' +
        '<div class="product-rarity">⭐ Σπανιότητα: ' + p.rarity + '/100</div>' +
        '<div class="product-stars">' +
          '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars) +
          '<span style="font-size:0.8rem;color:var(--text-light);margin-left:4px;">(' + totalReviews + ' κριτικές)</span>' +
        '</div>' +
        '<div class="product-meta">🛒 ' + (p.totalPurchases || 0) + ' αγορές</div>' +
        '<div class="product-actions">' +
          '<button class="btn ' + (isFav ? 'btn-fav active' : 'btn-secondary') + '" onclick="toggleFav(' + i + ')">' + (isFav ? '❤️' : '🤍') + ' Αγαπημένα</button>' +
          '<button class="btn ' + (inCart ? 'btn-secondary' : 'btn-cart') + '" onclick="toggleCart(' + i + ')">' + (inCart ? '✅' : '🛒') + ' ' + (inCart ? 'Στο καλάθι' : 'Καλάθι') + '</button>' +
          '<button class="btn btn-buy" onclick="buyNow(' + i + ')">Αγορά τώρα</button>' +
        '</div>' +
        '<div class="reviews-section">' +
          '<h4>💬 Κριτικές (' + totalReviews + ')</h4>' +
          allReviews.map(function(r) {
            return '<div class="review-item">' +
              '<div class="review-header">' +
                '<span class="review-user">' + escapeHtml(r.username) + '</span>' +
                '<span>' + '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) + '</span>' +
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
        showToast('🔥 Σπάνιο εύρημα! "' + p.name + '" (⭐' + p.rarity + ') θα μπεις στο Hall of Fame;', 'warning');
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
  const price = parseFloat(card.querySelector('.product-price')?.textContent?.replace('€', '').replace(',', '.'));
  const rarity = parseInt(card.querySelector('.product-rarity')?.textContent?.match(/\d+/)?.[0]);
  const product = { name: name, description: desc, price: price, rarity: rarity };

  let d = getData();
  if (!d) return;

  const pid = getProductId(product);
  const existing = d.favorites.findIndex(function(f) { return getProductId(f) === pid; });

  if (existing >= 0) {
    d.favorites.splice(existing, 1);
    showToast('💔 Αφαιρέθηκε από αγαπημένα', 'error');
  } else {
    d.favorites.push(product);
    showToast('❤️ Προστέθηκε στα αγαπημένα!', 'success');
  }

  saveData(d);
  checkBadges(d);

  // Re-render
  const products = getCurrentProducts();
  if (products) {
    const title = document.getElementById('resultsTitle').textContent;
    const q = title.replace('Αποτελέσματα για: "', '').replace('"', '');
    displayResults(products, q);
  }
}

// ===== CART =====

function toggleCart(idx) {
  const card = document.getElementById('product-' + idx);
  if (!card) return;

  const name = card.querySelector('.product-name')?.textContent;
  const desc = card.querySelector('.product-desc')?.textContent;
  const price = parseFloat(card.querySelector('.product-price')?.textContent?.replace('€', '').replace(',', '.'));
  const rarity = parseInt(card.querySelector('.product-rarity')?.textContent?.match(/\d+/)?.[0]);
  const product = { name: name, description: desc, price: price, rarity: rarity };

  let d = getData();
  if (!d) return;

  const pid = getProductId(product);
  const existing = d.cart.findIndex(function(c) { return getProductId(c) === pid; });

  if (existing >= 0) {
    d.cart.splice(existing, 1);
    showToast('🗑️ Αφαιρέθηκε από το καλάθι', 'error');
  } else {
    d.cart.push(product);
    showToast('🛒 Προστέθηκε στο καλάθι!', 'success');
  }

  saveData(d);
  updateCartBadge();

  const products = getCurrentProducts();
  if (products) {
    const title = document.getElementById('resultsTitle').textContent;
    const q = title.replace('Αποτελέσματα για: "', '').replace('"', '');
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
    const price = parseFloat(card.querySelector('.product-price')?.textContent?.replace('€', '').replace(',', '.'));
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
  const price = parseFloat(card.querySelector('.product-price')?.textContent?.replace('€', '').replace(',', '.'));
  const rarity = parseInt(card.querySelector('.product-rarity')?.textContent?.match(/\d+/)?.[0]);
  const product = { name: name, description: desc, price: price, rarity: rarity };

  lastPurchasedProduct = product;
  document.getElementById('purchaseProductName').textContent = '"' + name + '" έρχεται... από άλλη διάσταση! 🚀';
  document.getElementById('purchaseOverlay').classList.add('active');

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
  document.getElementById('purchaseOverlay').classList.remove('active');
  lastPurchasedProduct = null;
}

function closePurchaseAndReview() {
  document.getElementById('purchaseOverlay').classList.remove('active');
  if (lastPurchasedProduct) showReviewForm(lastPurchasedProduct);
  lastPurchasedProduct = null;
}

// ===== REVIEWS =====

function showReviewForm(product) {
  const pid = getProductId(product);
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  modalTitle.textContent = '✍️ Κριτική για: ' + product.name;
  modalBody.innerHTML =
    '<div class="review-form">' +
      '<div class="star-selector" id="starSelector">' +
        [1, 2, 3, 4, 5].map(function(s) {
          return '<span data-star="' + s + '" onclick="setReviewStar(' + s + ')">☆</span>';
        }).join('') +
      '</div>' +
      '<textarea id="reviewText" placeholder="Γράψε την κριτική σου..." rows="3"></textarea>' +
      '<button class="btn btn-primary" onclick="submitReview(\'' + pid + '\')">Υποβολή ✅</button>' +
    '</div>';

  document.getElementById('modalOverlay').classList.add('active');
  window._reviewStar = 5;
  setReviewStar(5);
}

function setReviewStar(star) {
  window._reviewStar = star;
  document.querySelectorAll('#starSelector span').forEach(function(el) {
    el.textContent = parseInt(el.dataset.star) <= star ? '★' : '☆';
  });
}

function submitReview(pid) {
  const text = document.getElementById('reviewText').value.trim();
  if (!text) return showToast('⚠️ Γράψε κάτι!', 'error');

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
  showToast('✅ Κριτική προστέθηκε!', 'success');
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
  { id: 'explorer', name: 'Εξερευνητής', icon: '🔍', desc: 'Πρώτη αναζήτηση', check: function(d) { return (d.points || 0) >= 10; } },
  { id: 'collector', name: 'Συλλέκτης', icon: '📦', desc: '500+ πόντοι', check: function(d) { return (d.points || 0) >= 500; } },
  { id: 'legend', name: 'Θρύλος του O tee mou', icon: '👑', desc: 'Βρες rarity 100', check: function(d) { return d.rareFinds && d.rareFinds.some(function(r) { return r.rarity === 100; }); } },
  { id: 'hearts', name: 'Καρδούλες', icon: '💖', desc: '5 αγαπημένα', check: function(d) { return d.favorites && d.favorites.length >= 5; } },
  { id: 'shopaholic', name: 'Shopaholic', icon: '🛍️', desc: '3 αγορές', check: function(d) { return d.purchaseHistory && d.purchaseHistory.length >= 3; } },
  { id: 'hunter', name: 'Κυνηγός Σπανίων', icon: '🏆', desc: '3 σπάνια ευρήματα', check: function(d) { return d.rareFinds && d.rareFinds.length >= 3; } },
  { id: 'hoarder', name: 'Μαζεύτρια', icon: '🗄️', desc: '10 στο καλάθι', check: function(d) { return d.cart && d.cart.length >= 10; } },
  { id: 'reviewer', name: 'Κριτικός', icon: '📝', desc: 'Γράψε 3 κριτικές', check: function(d) {
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
      showToast('🏅 Νέο badge: ' + b.name + '!', 'success');
    }
  });

  if (changed) saveData(d);
}

// ===== LEADERBOARD (AI generated) =====

async function generateLeaderboard(d) {
  if (d.leaderboard) return; // Already generated

  const apiKey = d.apiKey || DEFAULT_API_KEY;

  try {
    const systemPrompt = 'Generate a JSON array of 10 fake Greek users with scores for a leaderboard. Respond ONLY with valid JSON array: [{"name":"Μαρία","score":987},...]. Scores 100-1000. Names common Greek first names.';
    const raw = await callDeepSeek(systemPrompt, 'Generate leaderboard', apiKey);
    const cleaned = raw.replace(/```json?/gi, '').replace(/```/g, '').trim();
    const lb = JSON.parse(cleaned);

    if (Array.isArray(lb) && lb.length >= 5) {
      d.leaderboard = lb.slice(0, 10);
      saveData(d);
    }
  } catch (e) {
    // Fallback: generate fake leaderboard locally
    const fallback = ['Μαρία', 'Δημήτρης', 'Κατερίνα', 'Γιώργος', 'Ελένη', 'Νίκος', 'Σοφία', 'Αλέξης', 'Άννα', 'Πέτρος'];
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
  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
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

  showModal('👤 ' + d.user.name,
    '<div class="text-center mb-16">' +
      '<div style="font-size:3rem;">⭐</div>' +
      '<h3>' + (d.points || 0) + ' πόντοι</h3>' +
      '<p style="color:var(--text-light);font-size:0.85rem;">Εξερεύνησε για να κερδίσεις περισσότερους!</p>' +
    '</div>' +
    '<h3 style="margin-bottom:10px;">🏅 Badges (' + badges.length + '/' + BADGE_DEFS.length + ')</h3>' +
    '<div class="badge-grid">' + allBadges + '</div>' +
    '<div class="mt-16 flex gap-8" style="flex-wrap:wrap;">' +
      '<button class="btn btn-secondary btn-small" onclick="showLeaderboard()">🏆 Leaderboard</button>' +
      '<button class="btn btn-secondary btn-small" onclick="showHallOfFame()">🎖️ Hall of Fame</button>' +
      '<button class="btn btn-secondary btn-small" onclick="exportData()">📤 Εξαγωγή</button>' +
      '<button class="btn btn-secondary btn-small" onclick="document.getElementById(\'importFile\').click()">📥 Εισαγωγή</button>' +
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
  const allEntries = lb.concat([{ name: d.user.name + ' (εσύ)', score: userPoints, isUser: true }]);
  allEntries.sort(function(a, b) { return b.score - a.score; });

  const items = allEntries.slice(0, 15).map(function(e, i) {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    const isUser = e.isUser;
    return '<div class="leaderboard-item ' + (isUser ? 'current-user' : '') + '">' +
      '<span class="rank ' + rankClass + '">' + (i + 1) + '</span>' +
      '<span class="lb-name">' + e.name + '</span>' +
      '<span class="lb-points">' + e.score + ' πόντοι</span>' +
    '</div>';
  }).join('');

  showModal('🏆 Top Ευρήματα (Leaderboard)',
    '<p style="color:var(--text-light);margin-bottom:16px;">Οι κορυφαίοι εξερευνητές του O tee mou!</p>' +
    items
  );
}

// ===== HALL OF FAME =====

function showHallOfFame() {
  const d = getData();
  if (!d) return;

  const rare = d.rareFinds || [];
  if (!rare.length) {
    showModal('🎖️ Hall of Fame', '<p style="color:var(--text-light);">Δεν έχεις βρει ακόμα σπάνια ευρήματα! Συνέχισε να ψάχνεις! 🔍</p>');
    return;
  }

  const items = rare.map(function(r) {
    return '<div class="hall-item">' +
      '<div class="trophy">🏆</div>' +
      '<div class="hall-name">' + escapeHtml(r.name) + '</div>' +
      '<div class="hall-rarity">⭐ Σπανιότητα: ' + r.rarity + '/100</div>' +
    '</div>';
  }).join('');

  showModal('🎖️ Hall of Fame', '<div class="hall-grid">' + items + '</div>');
}

// ===== FAVORITES VIEW =====

function showFavorites() {
  const d = getData();
  if (!d || !d.favorites || !d.favorites.length) {
    showModal('❤️ Αγαπημένα', '<p style="color:var(--text-light);">Δεν έχεις αγαπημένα ακόμα! Πρόσθεσε με το κουμπί 🤍</p>');
    return;
  }

  const items = d.favorites.map(function(f) {
    return '<div class="cart-item">' +
      '<div class="cart-img">🖼️</div>' +
      '<div class="cart-info">' +
        '<div class="cart-name">' + escapeHtml(f.name) + '</div>' +
        '<div class="cart-price">€' + formatPrice(f.price || 0) + '</div>' +
      '</div>' +
      '<button class="cart-remove" onclick="removeFav(\'' + getProductId(f) + '\')">✕</button>' +
    '</div>';
  }).join('');

  showModal('❤️ Αγαπημένα', items);
}

function removeFav(pid) {
  let d = getData();
  if (!d) return;
  d.favorites = d.favorites.filter(function(f) { return getProductId(f) !== pid; });
  saveData(d);
  showFavorites();
}

// ===== CART VIEW =====

function showCart() {
  const d = getData();
  if (!d || !d.cart || !d.cart.length) {
    showModal('🛒 Καλάθι', '<p style="color:var(--text-light);">Το καλάθι σου είναι άδειο! Ψάξε για απίθανα προϊόντα! 🔍</p>');
    return;
  }

  const total = d.cart.reduce(function(s, c) { return s + (c.price || 0); }, 0);
  const items = d.cart.map(function(c) {
    return '<div class="cart-item">' +
      '<div class="cart-img">🖼️</div>' +
      '<div class="cart-info">' +
        '<div class="cart-name">' + escapeHtml(c.name) + '</div>' +
        '<div class="cart-price">€' + formatPrice(c.price || 0) + '</div>' +
      '</div>' +
      '<button class="cart-remove" onclick="removeFromCart(\'' + getProductId(c) + '\')">✕</button>' +
    '</div>';
  }).join('');

  showModal('🛒 Καλάθι',
    items +
    '<div class="mt-16" style="text-align:right;font-size:1.2rem;font-weight:700;">Σύνολο: €' + formatPrice(total) + '</div>' +
    '<button class="btn btn-primary mt-16" onclick="checkoutAll()">Αγορά όλων 🎉</button>'
  );
}

function removeFromCart(pid) {
  let d = getData();
  if (!d) return;
  d.cart = d.cart.filter(function(c) { return getProductId(c) !== pid; });
  saveData(d);
  updateCartBadge();
  showCart();
}

function checkoutAll() {
  let d = getData();
  if (!d || !d.cart || !d.cart.length) return;

  d.purchaseHistory = d.purchaseHistory || [];
  d.cart.forEach(function(c) { d.purchaseHistory.push(c); });
  const total = d.cart.reduce(function(s, c) { return s + (c.price || 0); }, 0);
  d.cart = [];
  saveData(d);
  updateCartBadge();
  closeModal();
  showConfetti();
  showToast('🎉 Αγόρασες τα πάντα! Σύνολο: €' + formatPrice(total) + ' (ψεύτικα, φυσικά!)', 'success');
  checkBadges(d);
}

// ===== SETTINGS =====

function showSettings() {
  const d = getData();
  const isDark = d && d.darkMode;

  showModal('⚙️ Ρυθμίσεις',
    '<div class="settings-group">' +
      '<h3>🔑 API Key</h3>' +
      '<div class="form-group">' +
        '<input type="password" id="settingsApiKey" value="' + (d.apiKey || '') + '" placeholder="sk-...">' +
      '</div>' +
      '<button class="btn btn-secondary btn-small" onclick="saveSettingsApiKey()">Αποθήκευση 💾</button>' +
    '</div>' +
    '<div class="settings-group">' +
      '<h3>🎨 Θέμα</h3>' +
      '<button class="btn ' + (isDark ? 'btn-primary' : 'btn-secondary') + '" onclick="toggleDarkMode()" style="width:100%;">' +
        (isDark ? '☀️ Φωτεινή λειτουργία' : '🌙 Σκοτεινή λειτουργία') +
      '</button>' +
    '</div>' +
    '<div class="settings-group">' +
      '<h3>🗑️ Δεδομένα</h3>' +
      '<button class="btn btn-danger" onclick="clearAllData()" style="width:100%;">Διαγραφή όλων των δεδομένων ⚠️</button>' +
    '</div>'
  );
}

function saveSettingsApiKey() {
  const key = document.getElementById('settingsApiKey').value.trim();
  if (!key) return showToast('⚠️ Γράψε API key', 'error');

  let d = getData();
  if (d) {
    d.apiKey = key;
    saveData(d);
    showToast('✅ Αποθηκεύτηκε!', 'success');
  }
}

function toggleDarkMode() {
  let d = getData();
  if (!d) return;

  d.darkMode = !d.darkMode;
  saveData(d);

  if (d.darkMode) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  showSettings();
}

function clearAllData() {
  if (!confirm('Σίγουρα θέλεις να διαγράψεις όλα τα δεδομένα; Αυτή η ενέργεια είναι μη αναστρέψιμη!')) return;
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
  a.download = 'oteemou_backup.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('📤 Δεδομένα εξήχθησαν!', 'success');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.user) throw new Error('Invalid data');
      if (!confirm('Αυτό θα αντικαταστήσει όλα τα τρέχοντα δεδομένα. Συνέχεια;')) return;
      saveData(data);
      showToast('📥 Δεδομένα εισήχθησαν!', 'success');
      setTimeout(function() { location.reload(); }, 1000);
    } catch (err) {
      showToast('❌ Μη έγκυρο αρχείο!', 'error');
    }
  };
  reader.readAsText(file);
}

// ===== UI HELPERS =====

function showLoading(show) {
  document.getElementById('loadingOverlay').classList.toggle('active', show);
}

function showToast(msg, type) {
  type = type || '';
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(function() {
    toast.style.opacity = '0';
    setTimeout(function() { toast.remove(); }, 300);
  }, 3000);
}

function showConfetti() {
  const container = document.getElementById('confettiContainer');
  const colors = ['#FF6B35', '#7B2D8E', '#FFD700', '#2ECC71', '#E74C3C', '#3498DB'];

  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (Math.random() * 8 + 4) + 'px';
    piece.style.height = (Math.random() * 8 + 4) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    piece.style.animationDuration = (Math.random() * 2 + 1) + 's';
    piece.style.animationDelay = Math.random() * 0.5 + 's';
    container.appendChild(piece);
    setTimeout(function() { piece.remove(); }, 3000);
  }
}

// ===== INIT ON LOAD =====
document.addEventListener('DOMContentLoaded', init);
