/* ============================================================
   IMAGES - Free AI product images via Pollinations.ai
   ------------------------------------------------------------
   • Δεν χρειάζεται API key (εντελώς δωρεάν).
   • Το URL είναι deterministic (σταθερό seed από το product id),
     οπότε η ίδια εικόνα επιστρέφεται πάντα -> αποθηκεύεται στο
     product object και ΔΕΝ ξανα-δημιουργείται.
   • Το CDN στέλνει "Cache-Control: immutable, max-age=1y" + CORS *,
     άρα browser & Pollinations κρατούν την εικόνα στην cache.
   ============================================================ */

'use strict';

const IMAGE_BASE = 'https://image.pollinations.ai/prompt/';
const IMAGE_SIZE = 256; // χαμηλή ανάλυση - οι εικόνες μένουν μικρές

// Σταθερό, θετικό seed από οποιοδήποτε string (FNV-1a)
function imageSeedFromString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 2147483647;
}

function imagesEnabled() {
  const d = getData();
  return !d || d.imagesEnabled !== false;
}

function buildImagePrompt(product) {
  const name = (product && product.name) || '';
  const desc = (product && product.description) || '';
  const prompt =
    'Product photo of ' + name + '. ' + desc +
    '. Studio product shot, plain bright background, centered, cute absurd parody item, ' +
    'high detail, e-commerce listing';
  return prompt.replace(/\s+/g, ' ').trim().slice(0, 380);
}

// Deterministic URL -> ίδιο seed & prompt => ίδια εικόνα, cached για 1 χρόνο.
function buildProductImageUrl(product) {
  const seed = imageSeedFromString(getProductId(product));
  return IMAGE_BASE + encodeURIComponent(buildImagePrompt(product)) +
    '?width=' + IMAGE_SIZE + '&height=' + IMAGE_SIZE +
    '&seed=' + seed + '&nologo=true&referrer=oteemou';
}

// Επιστρέφει (και θυμάται πάνω στο product) το URL της εικόνας.
function getProductImage(product) {
  if (!product || !imagesEnabled()) return '';
  if (!product.image) product.image = buildProductImageUrl(product);
  return product.image;
}

// Διαβάζει το image url που τυχόν είναι ήδη φορτωμένο στην κάρτα.
function readCardImage(card) {
  const img = card && card.querySelector('.product-image img');
  return (img && (img.getAttribute('src') || img.src)) || '';
}

// Markup εικόνας για κάρτα προϊόντος (async φόρτωση, με placeholder).
function productImageHTML(product) {
  const url = getProductImage(product);
  if (!url) {
    return '<span class="product-img-ph" style="font-size:4rem;opacity:0.5;">\u{1f5bc}\ufe0f</span>';
  }
  return '<span class="product-img-ph" style="font-size:4rem;opacity:0.5;">\u{1f5bc}\ufe0f</span>' +
    '<img class="product-img" src="' + url + '" alt="" loading="lazy" decoding="async" ' +
    'onload="this.parentNode.classList.add(\'has-img\')" onerror="this.remove()">';
}

// Markup εικόνας για λίστες (καλάθι / αγαπημένα).
function thumbImageHTML(item) {
  const url = imagesEnabled() ? (item && item.image ? item.image : getProductImage(item)) : '';
  if (!url) return '<div class="cart-img">\u{1f5bc}\ufe0f</div>';
  return '<div class="cart-img">' +
    '<img src="' + url + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">' +
    '</div>';
}
