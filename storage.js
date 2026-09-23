/* ============================================================
   STORAGE - localStorage helpers + default state
   ============================================================ */

'use strict';

const STORAGE_KEY = 'oteemou_data';
const CACHE_KEY = 'oteemou_cache';
const MAX_CACHE = 20;

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
    provider: 'deepseek',
    apiKey: '',
    apiModel: 'deepseek-chat',
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
