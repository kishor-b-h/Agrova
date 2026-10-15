// ========================================
// AGROVA - Main Application
// ========================================
import './style.css';
import './classic-chat.css';
import './market.css';
import './irrigation.css';
import { renderClassicChat, escapeHtml } from './chat-view.js';
import { renderIrrigationView, attachIrrigationEventListeners } from './irrigation-view.js';
import { translations, cropsData, governmentSchemes, marketPrices, getWeatherData, recommendCrops } from './data.js';
import {
  getConfig,
  saveConfig,
  getSupabaseClient,
  testSupabaseConnection,
  testGeminiConnection,
  callGemini
} from './config.js';
import {
  renderMarketView,
  marketState,
  initMarketLeafletMap,
  executeMarketCalculation
} from './market-view.js';
import { KARNATAKA_TALUKS, VEHICLES, CALCULATOR_CROPS } from './market-calculator.js';
import {
  multimodalState,
  addImageFiles,
  addDocFiles,
  removeAttachedImage,
  removeAttachedFile,
  clearAllAttachments,
  startVoiceRecognition,
  stopVoiceRecognition,
  playVoiceResponse,
  stopVoiceResponse,
  extractDiagnosisFromJson,
  matchLocalVisualDiagnosis
} from './chat-multimodal.js';

// ============ USER PROFILE DEFAULTS ============
const defaultUserProfile = {
  id: 'farmer_default',
  name: 'Ramesh Kumar',
  email: 'ramesh.farmer@agrova.in',
  phone: '+91 98765 43210',
  location: 'Mandya, Karnataka',
  district: 'Mandya',
  taluk: 'Pandavapura',
  farmSize: '5 Acres',
  primaryCrop: 'Rice (Paddy)',
  soilType: 'Red Loamy Soil',
  irrigationSource: 'Borewell & Drip',
  experienceYears: '12 Years',
  memberSince: 'October 2026'
};

function getActiveUser() {
  return {
    ...defaultUserProfile,
    ...(state.user || {})
  };
}

function persistActiveUser(updatedData) {
  state.user = {
    ...defaultUserProfile,
    ...(state.user || {}),
    ...updatedData
  };
  try {
    localStorage.setItem('agrova-user', JSON.stringify(state.user));
  } catch (e) {
    console.warn('Failed to save user:', e);
  }
}

// ============ NOTIFICATIONS STORE ============
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif_1',
    type: 'weather',
    title: 'Moderate Rainfall Advisory (Mandya)',
    titleKn: 'ಮಧ್ಯಮ ಮಳೆ ಮುನ್ಸೂಚನೆ (ಮಂಡ್ಯ ಜಿಲ್ಲೆ)',
    titleHi: 'मध्यम वर्षा की चेतावनी (मंड्या)',
    message: 'Expected 18-25mm rainfall over the next 48 hours. Postpone nitrogen top-dressing and chemical pesticide spraying on rice fields.',
    messageKn: 'ಮುಂದಿನ 48 ಗಂಟೆಗಳಲ್ಲಿ 18-25ಮಿಮೀ ಮಳೆ ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ. ಭತ್ತದ ಗದ್ದೆಗಳಲ್ಲಿ ಯೂರಿಯಾ ಸಿಂಪಡಣೆ ಮತ್ತು ಕೀಟನಾಶಕ ಸಿಂಪಡಣೆ ಮುಂದೂಡಿ.',
    messageHi: 'अगले 48 घंटों में 18-25 मिमी बारिश की संभावना। धान के खेतों में यूरिया और कीटनाशक छिड़काव स्थगित करें।',
    time: '12 min ago',
    timeKn: '12 ನಿಮಿಷಗಳ ಹಿಂದೆ',
    timeHi: '12 मिनट पहले',
    page: 'home',
    category: 'Weather Advisory',
    read: false
  },
  {
    id: 'notif_2',
    type: 'market',
    title: 'Market Surge: Tomato +₹420/Quintal',
    titleKn: 'ಮಾರುಕಟ್ಟೆ ಏರಿಕೆ: ಟೊಮೇಟೊ +₹420/ಕ್ವಿಂಟಾಲ್',
    titleHi: 'बाजार उछाल: टमाटर +₹420/क्विंटल',
    message: 'Kolar APMC modal rate touched ₹2,850/Qtl. High buyer demand recorded from Bengaluru wholesale market.',
    messageKn: 'ಕೋಲಾರ ಎಪಿಎಂಸಿಯಲ್ಲಿ ಟೊಮೇಟೊ ದರ ₹2,850/ಕ್ವಿಂಟಾಲ್‌ಗೆ ಏರಿದೆ. ಬೆಂಗಳೂರು ಮಾರುಕಟ್ಟೆಯಿಂದ ಉತ್ತಮ ಬೇಡಿಕೆ ಇದೆ.',
    messageHi: 'कोलार एपीएमसी में टमाटर का भाव ₹2,850/क्विंटल पहुंचा। बेंगलुरु थोक बाजार से मजबूत मांग।',
    time: '1 hour ago',
    timeKn: '1 ಗಂಟೆಯ ಹಿಂದೆ',
    timeHi: '1 घंटा पहले',
    page: 'market',
    category: 'Market Alert',
    read: false
  },
  {
    id: 'notif_3',
    type: 'irrigation',
    title: 'Water Wallet: Active Tillering Phase',
    titleKn: 'ವಾಟರ್ ವ್ಯಾಲೆಟ್: ಸಕ್ರಿಯ ಬೆಳವಣಿಗೆಯ ನೀರಾವರಿ ಎಚ್ಚರಿಕೆ',
    titleHi: 'वॉटर वॉलेट: कल्ले फूटने की अवस्था में सिंचाई',
    message: 'Your Rice (Paddy) is in active tillering stage. Recommended runtime: 45 min/day to conserve 22% groundwater while maintaining yield.',
    messageKn: 'ನಿಮ್ಮ ಭತ್ತದ ಬೆಳೆ ಸಕ್ರಿಯ ಬೆಳವಣಿಗೆಯ ಹಂತದಲ್ಲಿದೆ. ದಿನಕ್ಕೆ 45 ನಿಮಿಷಗಳ ನಿಗದಿತ ನೀರಾವರಿ ನೀಡಲು ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ.',
    messageHi: 'आपकी धान की फसल सक्रिय कल्ले निकलने की अवस्था में है। 22% भूजल बचत के साथ 45 मिनट/दिन सिंचाई करें।',
    time: '3 hours ago',
    timeKn: '3 ಗಂಟೆಗಳ ಹಿಂದೆ',
    timeHi: '3 घंटे पहले',
    page: 'irrigation',
    category: 'Water Wallet',
    read: false
  },
  {
    id: 'notif_4',
    type: 'scheme',
    title: 'PM-Kisan 19th Installment e-KYC',
    titleKn: 'ಪಿಎಂ-ಕಿಸಾನ್ 19ನೇ ಕಂತು: ಇ-ಕೆವೈಸಿ ಜ್ಞಾಪನೆ',
    titleHi: 'पीएम-किसान 19वीं किस्त: ई-केवाईसी अनुस्मारक',
    message: 'Complete Aadhaar bank seeding & land verification before month-end to ensure seamless ₹2,000 DB transfer.',
    messageKn: 'ತಿಂಗಳ ಅಂತ್ಯದ ಮೊದಲು ಆಧಾರ್ ಬ್ಯಾಂಕ್ ಸೀಡಿಂಗ್ ಮತ್ತು ಜಮೀನು ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಳಿಸಿ ₹2,000 ನೇರ ಜಮೆಗೆ ಅರ್ಹತೆ ಪಡೆಯಿರಿ.',
    messageHi: '₹2,000 की सीधी बैंक किस्त पाने के लिए महीने के अंत से पहले आधार बैंक सीडिंग पूरी करें।',
    time: 'Yesterday',
    timeKn: 'ನಿನ್ನೆ',
    timeHi: 'कल',
    page: 'schemes',
    category: 'Govt Scheme',
    read: true
  },
  {
    id: 'notif_5',
    type: 'alert',
    title: 'Soil Nutrient: Red Loamy Soil Balance',
    titleKn: 'ಮಣ್ಣಿನ ಪೋಷಕಾಂಶ: ಕೆಂಪು ಮಣ್ಣಿನ ಸಮತೋಲನ',
    titleHi: 'मृदा पोषक तत्व: लाल दोमट मिट्टी संतुलन',
    message: 'Potash and phosphorus levels optimal. Recommend applying Azospirillum biofertilizer before next watering cycle.',
    messageKn: 'ಪೊಟ್ಯಾಷ್ ಮತ್ತು ರಂಜಕ ಮಟ್ಟ ಸಮತೋಲನದಲ್ಲಿದೆ. ಮುಂದಿನ ನೀರಾವರಿ ಚಕ್ರಕ್ಕೆ ಮುನ್ನ ಅಜೋಸ್ಪಿರಿಲಮ್ ಜೈವಿಕ ಗೊಬ್ಬರ ಬಳಸಲು ಸಲಹೆ.',
    messageHi: 'पोटाश और फास्फोरस का स्तर उत्तम है। अगले सिंचाई चक्र से पहले एजोस्पिरिलम बायोफर्टिलाइजर का प्रयोग करें।',
    time: '2 days ago',
    timeKn: '2 ದಿನಗಳ ಹಿಂದೆ',
    timeHi: '2 दिन पहले',
    page: 'crops',
    category: 'Soil Advisory',
    read: true
  }
];

function loadNotifications() {
  const saved = localStorage.getItem('agrova-notifications');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.warn('Failed to parse notifications:', e);
    }
  }
  return [...DEFAULT_NOTIFICATIONS];
}

function saveNotifications() {
  try {
    localStorage.setItem('agrova-notifications', JSON.stringify(state.notifications));
  } catch (e) {
    console.warn('Failed to save notifications:', e);
  }
}

function getNotifTitle(n) {
  if (state.lang === 'kn') return n.titleKn || n.title;
  if (state.lang === 'hi') return n.titleHi || n.title;
  return n.title;
}

function getNotifMsg(n) {
  if (state.lang === 'kn') return n.messageKn || n.message;
  if (state.lang === 'hi') return n.messageHi || n.message;
  return n.message;
}

function getNotifTime(n) {
  if (state.lang === 'kn') return n.timeKn || n.time;
  if (state.lang === 'hi') return n.timeHi || n.time;
  return n.time;
}

function getNotifIcon(type) {
  switch (type) {
    case 'weather': return 'fas fa-cloud-sun-rain';
    case 'market': return 'fas fa-chart-line';
    case 'irrigation':
    case 'water': return 'fas fa-tint';
    case 'scheme': return 'fas fa-landmark';
    case 'alert': return 'fas fa-exclamation-triangle';
    default: return 'fas fa-bell';
  }
}

function getNotifCategory(n) {
  if (state.lang === 'kn') {
    switch (n.type) {
      case 'weather': return 'ಹವಾಮಾನ ಸಲಹೆ';
      case 'market': return 'ಮಾರುಕಟ್ಟೆ ಎಚ್ಚರಿಕೆ';
      case 'irrigation': return 'ವಾಟರ್ ವ್ಯಾಲೆಟ್';
      case 'scheme': return 'ಸರ್ಕಾರಿ ಯೋಜನೆ';
      case 'alert': return 'ಮಣ್ಣಿನ ಆರೋಗ್ಯ';
      default: return 'ಅಧಿಸೂಚನೆ';
    }
  }
  if (state.lang === 'hi') {
    switch (n.type) {
      case 'weather': return 'मौसम सलाह';
      case 'market': return 'बाजार सूचना';
      case 'irrigation': return 'वॉटर वॉलेट';
      case 'scheme': return 'सरकारी योजना';
      case 'alert': return 'मृदा स्वास्थ्य';
      default: return 'सूचना';
    }
  }
  return n.category || 'Agri Alert';
}

// ============ APP STATE ============
const state = {
  currentPage: 'login',
  user: null,
  lang: localStorage.getItem('agrova-lang') || 'en',
  theme: localStorage.getItem('agrova-theme') || 'light',
  selectedCrop: null,
  chatMessages: [],
  chatPending: false,
  chatDraft: '',
  weatherData: null,
  sidebarOpen: false,
  notifications: loadNotifications(),
  notificationOpen: false,
  editProfileModalOpen: false,
};

// ============ HELPER FUNCTIONS ============
function t(key) {
  return translations[state.lang]?.[key] || translations.en[key] || key;
}

function getCropName(crop) {
  if (state.lang === 'hi') return crop.nameHi || crop.name;
  if (state.lang === 'kn') return crop.nameKn || crop.name;
  return crop.name;
}

function getSchemeName(scheme) {
  if (state.lang === 'hi') return scheme.nameHi || scheme.name;
  if (state.lang === 'kn') return scheme.nameKn || scheme.name;
  return scheme.name;
}

function getSchemeDesc(scheme) {
  if (state.lang === 'hi') return scheme.descHi || scheme.description;
  if (state.lang === 'kn') return scheme.descKn || scheme.description;
  return scheme.description;
}

function getSchemeBenefit(scheme) {
  if (state.lang === 'hi') return scheme.benefitHi || scheme.benefit;
  if (state.lang === 'kn') return scheme.benefitKn || scheme.benefit;
  return scheme.benefit;
}

function getMarketCropName(item) {
  if (state.lang === 'hi') return item.cropHi || item.crop;
  if (state.lang === 'kn') return item.cropKn || item.crop;
  return item.crop;
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('agrova-theme', state.theme);
}

function applyLang() {
  document.body.setAttribute('data-lang', state.lang);
  localStorage.setItem('agrova-lang', state.lang);
}

// ============ SUPABASE AUTH ============
async function supabaseSignUp(email, password, name) {
  const supabase = getSupabaseClient();
  const { supabaseUrl, supabaseAnonKey } = getConfig();

  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin
      }
    });
    if (error) throw error;

    // Check if user account already exists
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('An account with this email already exists. Please enter your password to log in.');
    }

    // Require email verification before signing in:
    // If a session was automatically returned, sign out so the user must confirm email first
    if (data.session) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore signout error
      }
    }

    return {
      user: data.user,
      needsEmailConfirmation: true
    };
  }

  // Direct REST fallback
  const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({
      email,
      password,
      data: { full_name: name }
    })
  });
  const data = await res.json();
  if (data.error || data.msg || data.error_description) {
    throw new Error(data.error_description || data.error?.message || data.msg || 'Signup failed');
  }
  return {
    user: data.user || data,
    needsEmailConfirmation: true
  };
}

async function supabaseResendVerification(email) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not available.');
  }
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return true;
}

async function supabaseGoogleSignIn() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase is not configured. Please check your credentials.');
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
}

async function supabaseSignIn(email, password) {
  const supabase = getSupabaseClient();
  const { supabaseUrl, supabaseAnonKey } = getConfig();

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('not confirmed')) {
        const unconfirmedErr = new Error('Your email address has not been verified yet. Please check your inbox and click the verification link before logging in.');
        unconfirmedErr.isUnconfirmed = true;
        unconfirmedErr.email = email;
        throw unconfirmedErr;
      }
      throw error;
    }

    // Require email verification for standard email provider
    if (data.user && !data.user.email_confirmed_at && data.user.app_metadata?.provider === 'email') {
      await supabase.auth.signOut();
      const unconfirmedErr = new Error('Your email address has not been verified yet. Please check your inbox and click the verification link before logging in.');
      unconfirmedErr.isUnconfirmed = true;
      unconfirmedErr.email = email;
      throw unconfirmedErr;
    }

    return {
      user: data.user,
      session: data.session
    };
  }

  // Direct REST fallback
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.error || data.error_description || data.msg) {
    const msg = data.error_description || data.error?.message || data.msg || 'Invalid login credentials';
    if (msg.toLowerCase().includes('email not confirmed')) {
      const unconfirmedErr = new Error('Your email address has not been verified yet. Please check your inbox and click the verification link before logging in.');
      unconfirmedErr.isUnconfirmed = true;
      unconfirmedErr.email = email;
      throw unconfirmedErr;
    }
    throw new Error(msg);
  }
  return {
    user: data.user,
    session: data
  };
}

// ============ GEMINI CHATBOT ============
async function askGemini(question, options = {}) {
  return await callGemini(question, state.lang, options);
}

const generateBotResponse = askGemini;

// ============ RENDER FUNCTIONS ============

// -- Auth Pages --
function renderLogin() {
  return `
    <div class="auth-container">
      <div class="auth-left">
        <div class="auth-brand">
          <div class="auth-brand-logo">
            <div class="logo-icon">🌾</div>
            <h1>${t('appName')}</h1>
          </div>
          <p>${t('tagline')} — Smarter Farming, Healthier Tomorrow</p>
        </div>
        <div class="auth-features">
          <div class="auth-feature">
            <div class="icon green"><i class="fas fa-seedling"></i></div>
            <div class="text"><h3>${t('feat1Title')}</h3><p>${t('feat1Desc')}</p></div>
          </div>
          <div class="auth-feature">
            <div class="icon blue"><i class="fas fa-cloud-sun"></i></div>
            <div class="text"><h3>${t('feat2Title')}</h3><p>${t('feat2Desc')}</p></div>
          </div>
          <div class="auth-feature">
            <div class="icon orange"><i class="fas fa-hand-holding-usd"></i></div>
            <div class="text"><h3>${t('feat3Title')}</h3><p>${t('feat3Desc')}</p></div>
          </div>
          <div class="auth-feature">
            <div class="icon purple"><i class="fas fa-chart-line"></i></div>
            <div class="text"><h3>${t('feat4Title')}</h3><p>${t('feat4Desc')}</p></div>
          </div>
        </div>
      </div>
      <div class="auth-right">
        <div class="auth-card">
          <h2>${t('welcomeBack')}</h2>
          <p class="subtitle">${t('welcomeBackSub')}</p>
          <div class="auth-error" id="authError"><i class="fas fa-exclamation-circle"></i> <span></span></div>
          <div class="auth-info" id="authInfo"><i class="fas fa-info-circle"></i> <span></span></div>
          <form id="loginForm">
            <div class="form-group">
              <label>${t('email')}</label>
              <div class="input-wrapper">
                <i class="fas fa-envelope"></i>
                <input type="email" id="loginEmail" placeholder="farmer@example.com" required>
              </div>
            </div>
            <div class="form-group">
              <label>${t('password')}</label>
              <div class="input-wrapper">
                <i class="fas fa-lock"></i>
                <input type="password" id="loginPassword" placeholder="••••••••" required>
              </div>
            </div>
            <div class="form-options">
              <label><input type="checkbox"> ${t('rememberMe')}</label>
              <a href="#">${t('forgotPassword')}</a>
            </div>
            <button type="submit" class="btn btn-primary">${t('loginBtn')}</button>
            <button type="button" id="quickDemoLogin" class="btn btn-secondary" style="width:100%;margin-top:10px;background:var(--bg-secondary);border:1px solid var(--border-color);display:flex;align-items:center;justify-content:center;gap:8px;">
              <i class="fas fa-bolt" style="color:var(--accent-green);"></i> Quick Demo Login (Skip Password)
            </button>
          </form>
          <div class="divider">${t('orContinueWith')}</div>
          <div class="social-login" style="margin-top:12px;">
            <button type="button" class="social-btn google-auth-btn" id="loginGoogleBtn" style="width:100%;display:flex;align-items:center;justify-content:center;gap:10px;font-weight:600;padding:11px 16px;border:1px solid var(--border-color);border-radius:var(--border-radius);background:var(--bg-card);color:var(--text-primary);cursor:pointer;transition:all 0.2s;">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>
              <span>Continue with Google</span>
            </button>
          </div>
          <p class="auth-switch">${t('noAccount')} <a id="goToSignup">${t('signup')}</a></p>
        </div>
      </div>
    </div>
  `;
}

function renderSignup() {
  return `
    <div class="auth-container">
      <div class="auth-left">
        <div class="auth-brand">
          <div class="auth-brand-logo">
            <div class="logo-icon">🌾</div>
            <h1>${t('appName')}</h1>
          </div>
          <p>${t('tagline')} — Smarter Farming, Healthier Tomorrow</p>
        </div>
        <div class="auth-features">
          <div class="auth-feature">
            <div class="icon green"><i class="fas fa-seedling"></i></div>
            <div class="text"><h3>${t('feat1Title')}</h3><p>${t('feat1Desc')}</p></div>
          </div>
          <div class="auth-feature">
            <div class="icon blue"><i class="fas fa-cloud-sun"></i></div>
            <div class="text"><h3>${t('feat2Title')}</h3><p>${t('feat2Desc')}</p></div>
          </div>
          <div class="auth-feature">
            <div class="icon orange"><i class="fas fa-hand-holding-usd"></i></div>
            <div class="text"><h3>${t('feat3Title')}</h3><p>${t('feat3Desc')}</p></div>
          </div>
          <div class="auth-feature">
            <div class="icon purple"><i class="fas fa-chart-line"></i></div>
            <div class="text"><h3>${t('feat4Title')}</h3><p>${t('feat4Desc')}</p></div>
          </div>
        </div>
      </div>
      <div class="auth-right">
        <div class="auth-card">
          <h2>${t('createAccount')}</h2>
          <p class="subtitle">${t('createAccountSub')}</p>
          <div class="auth-error" id="authError"><i class="fas fa-exclamation-circle"></i> <span></span></div>
          <div class="auth-info" id="authInfo"><i class="fas fa-info-circle"></i> <span></span></div>
          <form id="signupForm">
            <div class="form-group">
              <label>${t('fullName')}</label>
              <div class="input-wrapper">
                <i class="fas fa-user"></i>
                <input type="text" id="signupName" placeholder="Ramesh Kumar" required>
              </div>
            </div>
            <div class="form-group">
              <label>${t('email')}</label>
              <div class="input-wrapper">
                <i class="fas fa-envelope"></i>
                <input type="email" id="signupEmail" placeholder="farmer@example.com" required>
              </div>
            </div>
            <div class="form-group">
              <label>${t('password')}</label>
              <div class="input-wrapper">
                <i class="fas fa-lock"></i>
                <input type="password" id="signupPassword" placeholder="e.g. Kisan@2026!" required minlength="6">
              </div>
              <small style="font-size:11px;color:var(--text-muted);display:block;margin-top:4px;">
                Required: 1 Uppercase, 1 Lowercase, 1 Number, 1 Symbol (e.g. <code>Kisan@2026!</code>)
              </small>
            </div>
            <div class="form-group">
              <label>${t('confirmPassword')}</label>
              <div class="input-wrapper">
                <i class="fas fa-lock"></i>
                <input type="password" id="signupConfirm" placeholder="••••••••" required minlength="6">
              </div>
            </div>
            <button type="submit" class="btn btn-primary">${t('signupBtn')}</button>
            <button type="button" id="quickDemoSignup" class="btn btn-secondary" style="width:100%;margin-top:10px;background:var(--bg-secondary);border:1px solid var(--border-color);display:flex;align-items:center;justify-content:center;gap:8px;">
              <i class="fas fa-bolt" style="color:var(--accent-green);"></i> Quick Demo Login (Skip Password)
            </button>
          </form>
          <div class="divider">${t('orContinueWith')}</div>
          <div class="social-login" style="margin-top:12px;">
            <button type="button" class="social-btn google-auth-btn" id="signupGoogleBtn" style="width:100%;display:flex;align-items:center;justify-content:center;gap:10px;font-weight:600;padding:11px 16px;border:1px solid var(--border-color);border-radius:var(--border-radius);background:var(--bg-card);color:var(--text-primary);cursor:pointer;transition:all 0.2s;">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>
              <span>Sign up with Google</span>
            </button>
          </div>
          <p class="auth-switch">${t('haveAccount')} <a id="goToLogin">${t('login')}</a></p>
        </div>
      </div>
    </div>
  `;
}

// -- Main App Layout --
function renderAppLayout(pageContent) {
  const user = getActiveUser();
  const userName = user.name || (state.lang === 'kn' ? 'ರಮೇಶ್ ಕುಮಾರ್' : 'Ramesh Kumar');
  const userInitial = userName.charAt(0).toUpperCase();
  const userLocation = user.location || (user.district ? `${user.district}, Karnataka` : 'Mandya, Karnataka');
  const notifications = state.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { id: 'home', icon: 'fa-home', label: t('home') },
    { id: 'chatbot', icon: 'fa-robot', label: t('askAgrova') },
    { id: 'weather', icon: 'fa-cloud-sun', label: t('weather') },
    { id: 'irrigation', icon: 'fa-faucet-drip', label: t('smartIrrigation'), badge: 'AI Wallet' },
    { id: 'schemes', icon: 'fa-landmark', label: t('govSchemes') },
    { id: 'cropcare', icon: 'fa-leaf', label: t('cropCare'), badge: 'New' },
    { id: 'market', icon: 'fa-chart-line', label: state.lang === 'kn' ? 'ಮಾರುಕಟ್ಟೆ ಮತ್ತು ಲಾಭ' : (t('marketPrices') || 'Market & Profit'), badge: state.lang === 'kn' ? 'ಸ್ಮಾರ್ಟ್' : 'Advisor' },
    { id: 'profile', icon: 'fa-user', label: t('myProfile') },
    { id: 'feedback', icon: 'fa-comment-dots', label: t('feedback') },
    { id: 'settings', icon: 'fa-cog', label: t('settings') },
  ];

  return `
    <div class="app-layout">
      <!-- Sidebar Overlay -->
      <div class="sidebar-overlay ${state.sidebarOpen ? 'show' : ''}" id="sidebarOverlay"></div>
      
      <!-- Sidebar -->
      <aside class="sidebar ${state.sidebarOpen ? 'open' : ''}" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <div class="logo-icon">🌾</div>
            <div class="logo-text">
              <h2>${t('appName')}</h2>
              <span>${t('tagline')}</span>
            </div>
          </div>
          <button class="sidebar-close" id="sidebarClose"><i class="fas fa-times"></i></button>
        </div>
        
        <nav class="sidebar-nav">
          <div class="nav-section">
            <div class="nav-section-title">Menu</div>
            ${navItems.map(item => `
              <div class="nav-item ${state.currentPage === item.id ? 'active' : ''}" data-page="${item.id}">
                <i class="fas ${item.icon}"></i>
                <span>${item.label}</span>
                ${item.badge ? `<span class="badge">${item.badge}</span>` : ''}
              </div>
            `).join('')}
          </div>
        </nav>
        
        <div class="sidebar-footer">
          <div class="lang-selector">
            <i class="fas fa-globe"></i>
            <select id="sidebarLang">
              <option value="en" ${state.lang === 'en' ? 'selected' : ''}>English</option>
              <option value="hi" ${state.lang === 'hi' ? 'selected' : ''}>हिंदी</option>
              <option value="kn" ${state.lang === 'kn' ? 'selected' : ''}>ಕನ್ನಡ</option>
            </select>
          </div>
          <div class="sidebar-user" id="sidebarUser" style="cursor:pointer;" title="${t('myProfile')}">
            <div class="avatar">${userInitial}</div>
            <div class="user-info">
              <div class="name">${escapeHtml(userName)}</div>
              <div class="tagline">${t('betterFarmers')}, ${t('brighterIndia')}</div>
            </div>
          </div>
        </div>
      </aside>
      
      <!-- Main Content -->
      <main class="main-content">
        <header class="top-header">
          <button class="menu-toggle" id="menuToggle"><i class="fas fa-bars"></i></button>
          <div class="header-brand">
            <div class="logo-icon">🌾</div>
            <h1>${t('appName')}</h1>
          </div>
          <div class="header-search">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="${t('search')}..." id="globalSearch">
          </div>
          <div class="header-actions">
            <div class="header-lang">
              <i class="fas fa-globe"></i>
              <select id="headerLang">
                <option value="en" ${state.lang === 'en' ? 'selected' : ''}>English</option>
                <option value="hi" ${state.lang === 'hi' ? 'selected' : ''}>हिंदी</option>
                <option value="kn" ${state.lang === 'kn' ? 'selected' : ''}>ಕನ್ನಡ</option>
              </select>
            </div>

            <!-- Notifications System -->
            <div class="header-notif-container" id="headerNotifContainer" style="position:relative;">
              <button class="notification-btn ${unreadCount > 0 ? 'has-unread' : ''}" id="headerNotificationBtn" aria-label="${t('notifications')}" title="${t('notifications')}">
                <i class="fas fa-bell"></i>
                ${unreadCount > 0 ? `<span class="notif-badge-dot"></span>` : ''}
                ${unreadCount > 0 ? `<span class="notif-badge-pill">${unreadCount > 9 ? '9+' : unreadCount}</span>` : ''}
              </button>

              <!-- Notifications Dropdown Panel -->
              <div class="notification-dropdown" id="notificationDropdown">
                <div class="notif-dropdown-header">
                  <div class="notif-dropdown-title">
                    <i class="fas fa-bell" style="color:var(--primary);"></i>
                    <h4>${t('notifications')}</h4>
                    ${unreadCount > 0 ? `<span class="notif-unread-pill">${unreadCount} ${t('unread')}</span>` : ''}
                  </div>
                  <div class="notif-header-actions">
                    ${unreadCount > 0 ? `
                      <button type="button" class="notif-btn-text" id="btnMarkAllNotifsRead" title="${t('markAllRead')}">
                        <i class="fas fa-check-double"></i> ${t('markAllRead')}
                      </button>
                    ` : ''}
                    ${notifications.length > 0 ? `
                      <button type="button" class="notif-btn-icon" id="btnClearAllNotifs" title="${t('clearAll')}">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    ` : ''}
                    <button type="button" class="notif-btn-icon" id="btnCloseNotificationDropdown" title="Close">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>

                <div class="notif-dropdown-body" id="notificationList">
                  ${notifications.length === 0 ? `
                    <div class="notif-empty">
                      <div class="notif-empty-icon">🌾</div>
                      <h4>${t('noNotifications')}</h4>
                      <p>${t('noNotificationsSub')}</p>
                    </div>
                  ` : notifications.map(n => `
                    <div class="notif-item ${n.read ? 'read' : 'unread'}" data-id="${n.id}" data-page="${n.page || ''}">
                      <div class="notif-type-icon ${n.type}">
                        <i class="${getNotifIcon(n.type)}"></i>
                      </div>
                      <div class="notif-text-area">
                        <div class="notif-item-top">
                          <span class="notif-item-title">${getNotifTitle(n)}</span>
                          ${!n.read ? '<span class="unread-dot"></span>' : ''}
                        </div>
                        <p class="notif-item-msg">${getNotifMsg(n)}</p>
                        <div class="notif-item-bottom">
                          <span class="notif-time-tag"><i class="far fa-clock"></i> ${getNotifTime(n)}</span>
                          <span class="notif-cat-badge ${n.type}">${getNotifCategory(n)}</span>
                          ${n.page ? `<span class="notif-link-hint">${state.lang === 'kn' ? 'ನೋಡಿ' : 'View'} →</span>` : ''}
                        </div>
                      </div>
                      <button type="button" class="notif-dismiss-btn" data-delete-id="${n.id}" title="Dismiss">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  `).join('')}
                </div>

                <div class="notif-dropdown-footer">
                  <span class="notif-status-info"><i class="fas fa-satellite-dish"></i> ${state.lang === 'kn' ? 'ಕೃಷಿ ಮುನ್ಸೂಚನೆ & ಮಾರುಕಟ್ಟೆ ಎಚ್ಚರಿಕೆಗಳು' : 'Live Farm Telemetry & Mandi Alerts'}</span>
                </div>
              </div>
            </div>

            <!-- Header Profile -->
            <div class="header-profile" id="headerProfile" style="cursor:pointer;" title="${t('myProfile')}">
              <div class="avatar">${userInitial}</div>
              <div class="profile-info">
                <span class="name">${escapeHtml(userName)}</span>
                <span class="location">${escapeHtml(userLocation)}</span>
              </div>
              <i class="fas fa-chevron-down" style="font-size:10px;color:var(--text-muted);"></i>
            </div>
          </div>
        </header>

        <div class="page-content page-enter">
          ${pageContent}
        </div>
      </main>

      <!-- Edit Profile Modal -->
      ${state.editProfileModalOpen ? renderEditProfileModal() : ''}
    </div>
  `;
}

// -- Dashboard --
function renderHome() {
  const user = getActiveUser();
  const userName = user.name || (state.lang === 'kn' ? 'ರಮೇಶ್' : 'Ramesh');
  const userLocation = user.location || (user.district ? `${user.district}, Karnataka` : 'Mandya, Karnataka');
  const weather = getWeatherData();
  state.weatherData = weather;
  const riceCrop = cropsData.find(c => c.id === 'rice');

  return renderAppLayout(`
    <div class="home-split-container">
      <!-- Main Content Column -->
      <div class="home-primary-col">
        <!-- Hero Banner -->
        <div class="hero-banner">
          <h1>${t('greeting')}, ${escapeHtml(userName)}! 🌿</h1>
          <p>${t('dashSubtitle')}</p>
          <div class="hero-location">
            <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(userLocation)}</span>
            <span>🌾 ${escapeHtml(user.primaryCrop || 'Rice (Paddy)')} • ${escapeHtml(user.farmSize || '5 Acres')}</span>
          </div>
          <div class="hero-slogan">Smarter Farming • Healthier Tomorrow</div>
        </div>

        <!-- Dashboard Cards 3 in row -->
        <div class="dashboard-grid">
          <!-- Current Weather -->
          <div class="dash-card">
            <div class="dash-card-header">
              <h3>${t('currentWeather')}</h3>
              <span style="font-size:12px;color:var(--text-muted);cursor:pointer;" data-page="weather">${weather.location} &gt;</span>
            </div>
            <div class="weather-main">
              <span class="weather-icon">${weather.icon}</span>
              <div>
                <div class="weather-temp">${weather.temp}°C</div>
                <div class="weather-desc">${weather.condition}</div>
              </div>
            </div>
            <div class="weather-details">
              <div class="weather-detail"><i class="fas fa-tint"></i> ${t('humidity')} ${weather.humidity}%</div>
              <div class="weather-detail"><i class="fas fa-wind"></i> ${t('wind')} ${weather.wind} km/h</div>
              <div class="weather-detail"><i class="fas fa-cloud-rain"></i> ${t('rainfall')} ${weather.rainfall} mm</div>
              <div class="weather-detail"><i class="fas fa-calendar"></i> Next 5 days</div>
            </div>
          </div>

          <!-- Your Crop with Real Photo -->
          <div class="dash-card">
            <div class="dash-card-header">
              <h3>${t('yourCrop')}</h3>
            </div>
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;">
              <img src="${riceCrop?.image || 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=200&q=80'}" alt="Paddy Rice" class="your-crop-thumb" loading="lazy" />
              <div>
                <h4 style="font-size:15px;font-weight:700;margin:0 0 2px;">Paddy (Rice)</h4>
                <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">Tillering Stage (Day 34)</div>
                <span style="background:var(--primary-100);color:var(--primary-dark);font-size:11px;font-weight:600;padding:2px 8px;border-radius:10px;">
                  Active Growth
                </span>
              </div>
            </div>
            <button class="btn btn-primary btn-sm" style="width:100%;" data-page="cropcare">
              <i class="fas fa-seedling"></i> Get Crop Advice →
            </button>
          </div>

          <!-- Quick Actions 2x2 grid -->
          <div class="dash-card">
            <div class="dash-card-header">
              <h3>${t('quickActions')}</h3>
            </div>
            <div class="quick-actions-2x2">
              <div class="quick-action-tile green" data-page="chatbot">
                <i class="fas fa-comments"></i>
                <span>${t('askQuestion')}</span>
              </div>
              <div class="quick-action-tile blue" data-page="schemes">
                <i class="fas fa-landmark"></i>
                <span>${t('viewSchemes')}</span>
              </div>
              <div class="quick-action-tile orange" data-page="weather">
                <i class="fas fa-cloud-sun"></i>
                <span>${t('checkWeather')}</span>
              </div>
              <div class="quick-action-tile purple" data-action="open-edit-profile" data-page="profile" title="${t('editProfile')}">
                <i class="fas fa-user-edit"></i>
                <span>${t('editProfile')}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Government Schemes Carousel -->
        <div class="section-header">
          <h2>${t('schemesForYou')}</h2>
          <span class="view-all" data-page="schemes">${t('viewAll')}</span>
        </div>
        <div class="schemes-scroll">
          ${governmentSchemes.slice(0, 5).map(scheme => `
            <div class="scheme-card" data-page="schemes" style="cursor:pointer;">
              <span class="scheme-badge central">${scheme.emoji} ${scheme.type}</span>
              <h3>${getSchemeName(scheme)}</h3>
              <p>${getSchemeDesc(scheme).substring(0, 95)}...</p>
              <div class="benefit"><strong>${t('benefit')}:</strong> ${getSchemeBenefit(scheme)}</div>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;">
                <span style="font-size:11px;color:var(--primary);font-weight:600;">
                  <i class="fas fa-users"></i> ${scheme.beneficiaries?.length || 2}+ Verified Farmers
                </span>
                <span class="scheme-apply-btn" style="padding:4px 10px;font-size:12px;">View →</span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Weather Forecast -->
        <div class="section-header">
          <h2>${t('weatherForecast')}</h2>
          <span class="view-all" data-page="weather">${t('viewMore')}</span>
        </div>
        <div class="forecast-grid">
          ${weather.forecast.map(day => `
            <div class="forecast-day">
              <div class="day-name">${day.day}</div>
              <div class="day-icon">${day.icon}</div>
              <div class="day-temp">${day.high}°/${day.low}°</div>
              <div class="day-rain"><i class="fas fa-tint"></i> ${day.rain} mm</div>
            </div>
          `).join('')}
        </div>

        <!-- Split Row: Farming Tips (Left) & Recent Questions (Right) -->
        <div class="split-cards-row">
          <div class="dash-card">
            <div class="dash-card-header">
              <h3><i class="fas fa-lightbulb" style="color:#eab308;"></i> ${t('farmingTips')}</h3>
            </div>
            <div class="tips-list">
              <div class="tip-item">
                <i class="fas fa-check-circle" style="color:var(--primary);"></i>
                <p>Optimal conditions for paddy tillering. Maintain 2-3 cm shallow water level.</p>
              </div>
              <div class="tip-item">
                <i class="fas fa-cloud-rain" style="color:var(--accent-blue);"></i>
                <p>Light showers predicted within 48 hours. Postpone urea top dressing by 2 days.</p>
              </div>
              <div class="tip-item">
                <i class="fas fa-bug" style="color:var(--accent-orange);"></i>
                <p>Inspect for brown plant hopper and stem borer at root base before applying fertilizers.</p>
              </div>
            </div>
          </div>

          <div class="dash-card">
            <div class="dash-card-header">
              <h3><i class="fas fa-history" style="color:var(--primary);"></i> Recent Questions</h3>
              <span style="font-size:12px;color:var(--text-muted);cursor:pointer;" data-page="chatbot">All &gt;</span>
            </div>
            <div>
              <div class="recent-question-item" data-q="What fertilizer is best for paddy tillering?">
                <span class="q-text"><i class="fas fa-comment-dots"></i> Best fertilizer for paddy at tillering?</span>
                <span class="q-time">2h ago</span>
              </div>
              <div class="recent-question-item" data-q="How to get 60% PM-KUSUM solar pump subsidy?">
                <span class="q-text"><i class="fas fa-comment-dots"></i> How to apply for PM-KUSUM solar subsidy?</span>
                <span class="q-time">Yesterday</span>
              </div>
              <div class="recent-question-item" data-q="How to grow oyster mushrooms indoors?">
                <span class="q-text"><i class="fas fa-comment-dots"></i> Step-by-step oyster mushroom cultivation?</span>
                <span class="q-time">2d ago</span>
              </div>
              <div class="recent-question-item" data-q="How to prevent tomato leaf curl virus?">
                <span class="q-text"><i class="fas fa-comment-dots"></i> How to prevent yellow leaf curl in tomato?</span>
                <span class="q-time">3d ago</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Helpful Resources -->
        <div class="section-header">
          <h2>Helpful Farming Resources</h2>
        </div>
        <div class="helpful-resources-grid">
          <div class="resource-card-tile green" data-page="cropcare">
            <i class="fas fa-seedling"></i>
            <h4>ICAR Crop Advisory</h4>
            <p>Seasonal cultivation bulletins</p>
          </div>
          <div class="resource-card-tile red" data-page="schemes">
            <i class="fas fa-solar-panel"></i>
            <h4>PM-KUSUM Solar</h4>
            <p>60% subsidy pump installation</p>
          </div>
          <div class="resource-card-tile purple" data-page="market">
            <i class="fas fa-chart-line"></i>
            <h4>${state.lang === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ಮಾರುಕಟ್ಟೆ ಲಾಭ' : 'Smart Market Advisor'}</h4>
            <p>${state.lang === 'kn' ? 'ಸಾರಿಗೆ ವೆಚ್ಚ ಕಳೆದು ಗರಿಷ್ಠ ಲಾಭ ಕಂಡುಕೊಳ್ಳಿ' : 'Real transport & highest profit calculator'}</p>
          </div>
        </div>
      </div>

      <!-- Right Column: Embedded Ask Agrova Chat Panel -->
      <aside class="home-chat-panel">
        <div class="home-chat-header">
          <div class="logo-sprout"><i class="fas fa-seedling"></i></div>
          <div class="title-wrap">
            <h3>${t('askAgrova')}</h3>
            <span><span class="status-dot"></span> ${t('online')} — ${t('aiAssistant')}</span>
          </div>
        </div>

        <div class="home-chat-body" id="homeChatBody">
          <!-- Ramesh User Message -->
          <div class="home-chat-msg user">
            <div class="avatar" style="background:#16a34a;color:white;">R</div>
            <div class="bubble">
              How often should I water my paddy field during tillering?
              <div style="font-size:10px;color:var(--text-muted);text-align:right;margin-top:4px;">10:14 AM</div>
            </div>
          </div>

          <!-- Agrova AI Response -->
          <div class="home-chat-msg bot">
            <div class="avatar">🌾</div>
            <div class="bubble">
              During the active tillering stage (25-45 days after transplanting), follow these ICAR irrigation guidelines:
              <ol style="margin:8px 0 8px 18px;padding:0;font-size:12px;line-height:1.5;">
                <li><strong>Maintain Shallow Ponding</strong>: Keep 2-3 cm standing water in field.</li>
                <li><strong>Drain for 48 Hours</strong>: Drain water 2 days before applying urea or zinc top-dressing.</li>
                <li><strong>AWD Technique</strong>: Allow hairline surface cracks before re-watering to boost root aeration.</li>
              </ol>
              <div class="home-guidance-box">
                <i class="fas fa-info-circle"></i>
                <div><strong>Advisory:</strong> 4mm rain forecast in 48 hours. You can reduce tubewell running hours by 2 hrs today.</div>
              </div>
              <div style="font-size:10px;color:var(--text-muted);margin-top:6px;">10:15 AM • ICAR Verified</div>
            </div>
          </div>
        </div>

        <!-- Suggestion Chips -->
        <div style="padding:8px 12px;display:flex;gap:6px;overflow-x:auto;border-top:1px solid var(--border-color);background:var(--bg-secondary);">
          <button class="chat-suggestion" data-q="What crops are suitable for sandy soil?" style="font-size:11px;padding:4px 8px;white-space:nowrap;">🌱 Sandy Soil</button>
          <button class="chat-suggestion" data-q="How to get 60% PM-KUSUM solar subsidy?" style="font-size:11px;padding:4px 8px;white-space:nowrap;">☀️ Solar Subsidy</button>
          <button class="chat-suggestion" data-q="How to grow mushrooms indoors step by step?" style="font-size:11px;padding:4px 8px;white-space:nowrap;">🍄 Mushroom Guide</button>
        </div>

        <!-- Input Footer -->
        <div class="home-chat-footer">
          <input type="text" id="homeChatInput" placeholder="${t('typeQuestion')}" />
          <button class="send-btn" id="homeChatSend" title="Send Question"><i class="fas fa-paper-plane"></i></button>
        </div>
      </aside>
    </div>
  `);
}

// -- Chatbot --
function renderChatbot() {
  return renderAppLayout(renderClassicChat(state, t));
}

// -- Weather Page --
function renderWeather() {
  const weather = state.weatherData || getWeatherData();
  const crops = recommendCrops(weather.temp, weather.humidity);

  return renderAppLayout(`
    <h2 style="font-size:22px;font-weight:700;margin-bottom:20px;">${t('weather')} & ${t('cropRecommendation')}</h2>
    
    <div class="location-search">
      <input type="text" id="locationInput" placeholder="${t('enterLocation')}" value="Mandya, Karnataka">
      <button class="btn btn-primary" id="analyzeBtn"><i class="fas fa-search"></i> ${t('analyze')}</button>
    </div>

    <div class="weather-current-card" style="margin-bottom:20px;">
      <div class="location-name"><i class="fas fa-map-marker-alt"></i> ${weather.location}</div>
      <div class="temp-display">
        <span class="temp-big">${weather.temp}°C</span>
        <span class="temp-icon">${weather.icon}</span>
        <div>
          <div style="font-size:20px;font-weight:600;">${weather.condition}</div>
          <div style="opacity:0.8;font-size:14px;">Today, ${new Date().toLocaleDateString()}</div>
        </div>
      </div>
      <div class="weather-stats">
        <div class="stat"><i class="fas fa-tint"></i> ${t('humidity')}: ${weather.humidity}%</div>
        <div class="stat"><i class="fas fa-wind"></i> ${t('wind')}: ${weather.wind} km/h</div>
        <div class="stat"><i class="fas fa-cloud-rain"></i> ${t('rainfall')}: ${weather.rainfall} mm</div>
      </div>
    </div>

    <div class="section-header">
      <h2>${t('weatherForecast')}</h2>
    </div>
    <div class="forecast-grid" style="margin-bottom:24px;">
      ${weather.forecast.map(day => `
        <div class="forecast-day">
          <div class="day-name">${day.day}</div>
          <div class="day-icon">${day.icon}</div>
          <div class="day-temp">${day.high}°/${day.low}°</div>
          <div class="day-rain"><i class="fas fa-tint"></i> ${day.rain} mm</div>
        </div>
      `).join('')}
    </div>

    <div class="crop-recommendation-card" style="margin-bottom:24px;">
      <h3>🌾 ${t('suitableCrops')} (${weather.temp}°C, ${weather.humidity}% ${t('humidity')})</h3>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">Based on current temperature and humidity, these crops are recommended for your area:</p>
      <div class="flex flex-wrap gap-8">
        ${crops.map(crop => `
          <span class="crop-tag" data-crop="${crop.id}">
            <span class="emoji">${crop.emoji}</span> ${getCropName(crop)}
          </span>
        `).join('')}
      </div>
    </div>
  `);
}

// -- Government Schemes --
function renderSchemes() {
  return renderAppLayout(`
    <h2 style="font-size:22px;font-weight:700;margin-bottom:8px;">${t('govSchemes')}</h2>
    <p style="font-size:14px;color:var(--text-secondary);margin-bottom:20px;">Explore all ongoing government schemes and subsidies available for farmers</p>
    
    <div class="market-search" style="margin-bottom:24px;">
      <input type="text" id="schemeSearch" placeholder="${t('searchSchemes')}">
      <select id="schemeFilter">
        <option value="all">${t('allCategories')}</option>
        <option value="income">Income Support</option>
        <option value="irrigation">Irrigation</option>
        <option value="insurance">Insurance</option>
        <option value="solar">Solar/Energy</option>
        <option value="credit">Credit</option>
        <option value="organic">Organic Farming</option>
        <option value="machinery">Farm Machinery</option>
      </select>
    </div>

    <div class="schemes-page-grid" id="schemesGrid">
      ${governmentSchemes.map(scheme => `
        <div class="scheme-detail-card" data-category="${scheme.category}">
          <div class="scheme-image">
            <span>${scheme.emoji}</span>
          </div>
          <div class="scheme-content">
            <div class="scheme-meta">
              <span class="scheme-meta-tag" style="background:var(--primary-100);color:var(--primary-700);">${scheme.type}</span>
              <span class="scheme-meta-tag" style="background:var(--accent-blue-light);color:var(--accent-blue);">${scheme.category}</span>
            </div>
            <h3>${getSchemeName(scheme)}</h3>
            <p>${getSchemeDesc(scheme)}</p>
            <div class="benefit" style="font-size:14px;margin-bottom:14px;">
              <strong style="color:var(--primary-dark);">${t('benefit')}:</strong> ${getSchemeBenefit(scheme)}
            </div>
            <a href="${scheme.url}" target="_blank" class="scheme-apply-btn">${t('applyNow')} <i class="fas fa-external-link-alt"></i></a>
            
            <div class="beneficiary-section" style="margin-top:16px;border-top:1px solid var(--border-color);padding-top:14px;">
              <h4 style="font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:10px;display:flex;align-items:center;gap:6px;">
                <i class="fas fa-user-check" style="color:var(--primary);"></i> Beneficiary Farmers Who Already Received Benefit
              </h4>
              <div class="beneficiary-cards-list">
                ${(scheme.beneficiaries || []).map(b => `
                  <div class="beneficiary-farmer-card">
                    <img src="${b.photo}" alt="${b.name}" class="beneficiary-farmer-avatar" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'">
                    <div style="flex:1;">
                      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:2px;flex-wrap:wrap;">
                        <strong style="font-size:13px;color:var(--text-primary);">${b.name}</strong>
                        <span class="verified-tag"><i class="fas fa-check-circle"></i> ${b.amount}</span>
                      </div>
                      <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">
                        <i class="fas fa-map-marker-alt" style="font-size:10px;"></i> ${b.village}
                      </div>
                      <p style="font-size:12px;color:var(--text-secondary);font-style:italic;margin:0;line-height:1.4;">
                        "${b.quote}"
                      </p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `);
}

// -- Crop Care / Learning --
function renderCropCare() {
  const categories = [
    { key: 'all', label: t('allCategories') },
    { key: 'stapleGrains', label: t('stapleGrains') },
    { key: 'vegetables', label: t('vegetables') },
    { key: 'legumes', label: t('legumes') },
    { key: 'cashCrops', label: t('cashCrops') },
    { key: 'spices', label: t('spices') },
    { key: 'oilseeds', label: t('oilseeds') },
    { key: 'fruits', label: t('fruits') },
    { key: 'plantation', label: t('plantation') },
    { key: 'medicinal', label: t('medicinal') },
    { key: 'agroforestry', label: t('agroforestry') },
  ];

  const mushroomCrop = cropsData.find(c => c.id === 'mushroom');

  return renderAppLayout(`
    <h2 style="font-size:22px;font-weight:700;margin-bottom:8px;">${t('cropCare')} — ${t('cropGuide')}</h2>
    <p style="font-size:14px;color:var(--text-secondary);margin-bottom:20px;">Learn how to grow, maintain, and protect various crops from seed to harvest with verified photography</p>

    <!-- Featured Mushroom Cultivation Masterclass Spotlight -->
    <div class="mushroom-spotlight-card" data-crop="mushroom" style="cursor:pointer;">
      <img src="${mushroomCrop?.image || 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=600&q=80'}" alt="Mushroom Farming" loading="lazy">
      <div style="flex:1;">
        <span style="background:#f59e0b;color:white;font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;text-transform:uppercase;">
          🍄 Farmer Masterclass Guide
        </span>
        <h3 style="font-size:18px;font-weight:700;margin:6px 0 4px;color:#92400e;">How to Grow Mushrooms (Oyster & Button) — High Profit Indoor Crop</h3>
        <p style="font-size:13px;color:#78350f;margin-bottom:10px;">
          Learn indoor substrate preparation, straw sterilization, dark room mycelium growth, pinning humidity, and multi-flush harvesting for regular monthly farm income.
        </p>
        <button class="btn btn-sm btn-primary" style="width:auto;padding:6px 14px;background:#d97706;border:none;">
          Open Complete Mushroom Guide →
        </button>
      </div>
    </div>

    <div class="market-search" style="margin-bottom:16px;">
      <input type="text" id="cropSearch" placeholder="${t('searchCrops')}">
    </div>

    <div class="crop-categories" id="cropCategories">
      ${categories.map(cat => `
        <button class="crop-category-btn ${cat.key === 'all' ? 'active' : ''}" data-cat="${cat.key}">${cat.label}</button>
      `).join('')}
    </div>

    <div class="crop-cards-grid" id="cropGrid">
      ${cropsData.map(crop => `
        <div class="crop-learn-card" data-crop="${crop.id}" data-category="${crop.category}">
          <div class="crop-image" style="position:relative;height:180px;overflow:hidden;background:#f3f4f6;">
            <img src="${crop.image}" alt="${getCropName(crop)}" class="crop-card-real-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80'">
            <span class="crop-card-badge">${crop.emoji}</span>
          </div>
          <div class="crop-info">
            <h3>${getCropName(crop)}</h3>
            <p>${crop.description}</p>
            <div class="crop-meta">
              <span><i class="fas fa-clock"></i> ${crop.growTime} ${t('months')}</span>
              <span><i class="fas fa-thermometer-half"></i> ${crop.temp}</span>
              <span><i class="fas fa-tint"></i> ${crop.water}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `);
}

// -- Crop Detail --
function renderCropDetail(cropId) {
  const crop = cropsData.find(c => c.id === cropId);
  if (!crop) return renderCropCare();

  return renderAppLayout(`
    <div class="crop-detail">
      <div class="crop-detail-header" style="background: linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.7)), url('${crop.image}') center/cover no-repeat; color: white;">
        <div class="back-btn" data-page="cropcare" style="color: white; background: rgba(0,0,0,0.4);"><i class="fas fa-arrow-left"></i> Back to Crops</div>
        <h1 style="color: white;">${crop.emoji} ${getCropName(crop)}</h1>
        <p class="crop-subtitle" style="color: rgba(255,255,255,0.9); font-size: 15px;">${crop.description}</p>
        <div style="display:flex;gap:12px;margin-top:12px;flex-wrap:wrap;">
          <span style="background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:14px;font-size:12px;"><i class="fas fa-clock"></i> ${crop.growTime} Months Duration</span>
          <span style="background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:14px;font-size:12px;"><i class="fas fa-thermometer-half"></i> ${crop.temp}</span>
          <span style="background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:14px;font-size:12px;"><i class="fas fa-tint"></i> ${crop.humidity} Humidity</span>
        </div>
      </div>
      <div class="crop-detail-body">
        <!-- Requirements -->
        <h2 style="font-size:20px;font-weight:700;margin-bottom:16px;">📋 ${t('requirements')}</h2>
        <div class="crop-requirements">
          <div class="requirement-card"><div class="req-icon">🌡️</div><h4>${t('temperature')}</h4><p>${crop.temp}</p></div>
          <div class="requirement-card"><div class="req-icon">💧</div><h4>${t('humidity')}</h4><p>${crop.humidity}</p></div>
          <div class="requirement-card"><div class="req-icon">🌍</div><h4>Soil / Substrate</h4><p>${crop.soil}</p></div>
          <div class="requirement-card"><div class="req-icon">🚿</div><h4>Water Needs</h4><p>${crop.water}</p></div>
          <div class="requirement-card"><div class="req-icon">📅</div><h4>Season</h4><p>${crop.season}</p></div>
          <div class="requirement-card"><div class="req-icon">🌾</div><h4>Yield / Output</h4><p>${crop.yieldPerAcre}</p></div>
          <div class="requirement-card"><div class="req-icon">☁️</div><h4>Climate</h4><p>${crop.climate}</p></div>
          <div class="requirement-card"><div class="req-icon">⏰</div><h4>${t('growingTime')}</h4><p>${crop.growTime} ${t('months')}</p></div>
        </div>

        <!-- Growth Timeline with Stage Photos -->
        <div class="crop-timeline">
          <h2>📈 ${t('growthTimeline')} — Month-by-Month Visual Progress</h2>
          <div class="timeline-visual-grid">
            ${crop.timeline.map((stage, idx) => `
              <div class="timeline-card">
                ${stage.stagePhoto ? `
                  <div class="timeline-stage-img-wrap">
                    <img src="${stage.stagePhoto}" alt="${stage.stage}" class="timeline-stage-img" loading="lazy">
                    <span class="stage-num-badge">Stage ${idx + 1}</span>
                  </div>
                ` : `
                  <div class="timeline-stage-img-wrap">
                    <img src="${crop.image}" alt="${stage.stage}" class="timeline-stage-img" loading="lazy">
                    <span class="stage-num-badge">Stage ${idx + 1}</span>
                  </div>
                `}
                <div class="timeline-stage-body">
                  <h4>${stage.stage}</h4>
                  <div class="timeline-period"><i class="fas fa-calendar-alt"></i> ${stage.period}</div>
                  <p>${stage.desc}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Pest & Insect Management -->
        <div class="pest-management">
          <h2>🐛 ${t('pestManagement')} & Disease Maintenance</h2>
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">
            Protect your crop from insects, fungal infections, and common diseases with these recommended organic and chemical treatments.
          </p>
          <div class="pest-cards">
            ${crop.pests.map(pest => `
              <div class="pest-card">
                <h4>${pest.name}</h4>
                <p><strong>Treatment & Maintenance:</strong> ${pest.solution}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Video Resources -->
        ${crop.videos && crop.videos.length > 0 ? `
        <div class="video-resources">
          <h2>🎬 ${t('videoResources')}</h2>
          <div class="video-grid">
            ${crop.videos.map(vid => `
              <a href="${vid.url}" target="_blank" class="video-card">
                <div class="video-thumb" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url('${crop.image}') center/cover no-repeat;">
                  <div class="play-icon"><i class="fas fa-play"></i></div>
                </div>
                <div class="video-info">
                  <h4>${vid.title}</h4>
                  <p><i class="fab fa-youtube" style="color:red;"></i> ${vid.source}</p>
                </div>
              </a>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Related Schemes -->
        <div style="margin-top:32px;">
          <h2 style="font-size:20px;font-weight:700;margin-bottom:16px;">🏛️ Related Government Schemes</h2>
          <div class="schemes-scroll">
            ${governmentSchemes.slice(0, 3).map(scheme => `
              <div class="scheme-card">
                <span class="scheme-badge central">${scheme.emoji} ${scheme.type}</span>
                <h3>${getSchemeName(scheme)}</h3>
                <p>${getSchemeDesc(scheme).substring(0, 80)}...</p>
                <a href="${scheme.url}" target="_blank" class="scheme-apply-btn">${t('applyNow')}</a>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `);
}

// -- Market Prices & Smart Profit Advisor --
function renderMarket() {
  // If calculation hasn't run yet, run it in background
  if (!marketState.calculationResult && !marketState.isCalculating) {
    executeMarketCalculation(() => {
      if (state.currentPage === 'market') {
        render();
      }
    });
  }
  return renderAppLayout(renderMarketView(state, t));
}

// -- Smart Irrigation & Water Wallet --
function renderIrrigation() {
  return renderAppLayout(renderIrrigationView(state, t));
}

// -- Profile --
function renderProfile() {
  const user = getActiveUser();
  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'F';
  return renderAppLayout(`
    <div class="profile-page-container">
      <div class="profile-page-header">
        <div>
          <h2 style="font-size:24px;font-weight:700;margin:0 0 4px;color:var(--text-primary);">${t('profileTitle')}</h2>
          <p style="margin:0;font-size:13px;color:var(--text-secondary);">${state.lang === 'kn' ? 'ನಿಮ್ಮ ಕೃಷಿ ಖಾತೆ ಮತ್ತು ಹೊಲದ ವಿವರಗಳು' : 'Manage your farming identity, land holdings, and cultivation preferences'}</p>
        </div>
        <button class="btn btn-primary" id="btnOpenEditProfile" style="display:inline-flex;align-items:center;gap:8px;">
          <i class="fas fa-user-edit"></i> ${t('editProfile')}
        </button>
      </div>

      <div class="profile-card">
        <div class="profile-banner">
          <div class="profile-banner-badge">
            <i class="fas fa-shield-alt"></i> Verified Farmer
          </div>
          <div class="profile-avatar-wrapper">
            <div class="avatar-lg">${initial}</div>
          </div>
        </div>
        
        <div class="profile-content">
          <div class="profile-content-header">
            <div>
              <h2>${escapeHtml(user.name)}</h2>
              <p class="profile-subtitle">
                <span><i class="fas fa-envelope"></i> ${escapeHtml(user.email)}</span>
                <span>•</span>
                <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(user.location || (user.district + ', Karnataka'))}</span>
              </p>
            </div>
          </div>

          <!-- Quick Stat Chips -->
          <div class="profile-stats-chips">
            <div class="profile-stat-chip">
              <i class="fas fa-vector-square" style="color:var(--primary);"></i>
              <div>
                <span class="chip-val">${escapeHtml(user.farmSize || '5 Acres')}</span>
                <span class="chip-lbl">${t('farmSize')}</span>
              </div>
            </div>
            <div class="profile-stat-chip">
              <i class="fas fa-seedling" style="color:var(--accent-green);"></i>
              <div>
                <span class="chip-val">${escapeHtml(user.primaryCrop || 'Rice (Paddy)')}</span>
                <span class="chip-lbl">${t('primaryCrop')}</span>
              </div>
            </div>
            <div class="profile-stat-chip">
              <i class="fas fa-tint" style="color:var(--accent-teal);"></i>
              <div>
                <span class="chip-val">${escapeHtml(user.irrigationSource || 'Borewell & Drip')}</span>
                <span class="chip-lbl">${t('irrigationSource')}</span>
              </div>
            </div>
            <div class="profile-stat-chip">
              <i class="fas fa-layer-group" style="color:var(--accent-amber);"></i>
              <div>
                <span class="chip-val">${escapeHtml(user.soilType || 'Red Loamy Soil')}</span>
                <span class="chip-lbl">${t('soilType')}</span>
              </div>
            </div>
          </div>

          <!-- Detailed Info Grid -->
          <div class="profile-section-heading">
            <i class="fas fa-user"></i> ${t('personalDetails')}
          </div>
          <div class="profile-details">
            <div class="profile-detail">
              <label>${t('fullName')}</label>
              <p>${escapeHtml(user.name)}</p>
            </div>
            <div class="profile-detail">
              <label>${t('email')}</label>
              <p>${escapeHtml(user.email)}</p>
            </div>
            <div class="profile-detail">
              <label>${t('phone')}</label>
              <p>${escapeHtml(user.phone || '+91 98765 43210')}</p>
            </div>
            <div class="profile-detail">
              <label>${t('language')}</label>
              <p>${state.lang === 'en' ? 'English' : state.lang === 'hi' ? 'Hindi' : 'ಕನ್ನಡ (Kannada)'}</p>
            </div>
          </div>

          <div class="profile-section-heading" style="margin-top:20px;">
            <i class="fas fa-tractor"></i> ${t('farmDetails')}
          </div>
          <div class="profile-details">
            <div class="profile-detail">
              <label>${t('location')}</label>
              <p>${escapeHtml(user.location || (user.district + ', Karnataka'))}</p>
            </div>
            <div class="profile-detail">
              <label>${t('district')}</label>
              <p>${escapeHtml(user.district || 'Mandya')}</p>
            </div>
            <div class="profile-detail">
              <label>${t('taluk')}</label>
              <p>${escapeHtml(user.taluk || 'Mandya')}</p>
            </div>
            <div class="profile-detail">
              <label>${t('farmSize')}</label>
              <p>${escapeHtml(user.farmSize || '5 Acres')}</p>
            </div>
            <div class="profile-detail">
              <label>${t('primaryCrop')}</label>
              <p>${escapeHtml(user.primaryCrop || 'Rice (Paddy)')}</p>
            </div>
            <div class="profile-detail">
              <label>${t('soilType')}</label>
              <p>${escapeHtml(user.soilType || 'Red Loamy Soil')}</p>
            </div>
            <div class="profile-detail">
              <label>${t('irrigationSource')}</label>
              <p>${escapeHtml(user.irrigationSource || 'Borewell & Drip')}</p>
            </div>
            <div class="profile-detail">
              <label>${t('memberSince')}</label>
              <p>${escapeHtml(user.memberSince || 'October 2026')}</p>
            </div>
          </div>

          <div class="profile-actions-bar" style="margin-top:28px;display:flex;gap:12px;flex-wrap:wrap;">
            <button class="btn btn-primary" id="btnOpenEditProfileBottom">
              <i class="fas fa-user-edit"></i> ${t('editProfile')}
            </button>
            <button class="btn btn-outline" id="logoutBtn">
              <i class="fas fa-sign-out-alt"></i> ${t('logout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  `);
}

function renderEditProfileModal() {
  const user = getActiveUser();
  const isKn = state.lang === 'kn';

  const DISTRICTS = [
    'Mandya', 'Mysuru', 'Hassan', 'Tumakuru', 'Kolar', 'Chikkaballapur',
    'Belagavi', 'Shivamogga', 'Davanagere', 'Chitradurga', 'Ballari',
    'Dharwad', 'Kalaburagi', 'Raichur', 'Bagalkote', 'Vijayapura',
    'Haveri', 'Gadag', 'Koppal', 'Chamarajanagar', 'Ramanagara',
    'Bengaluru Rural', 'Udupi', 'Dakshina Kannada', 'Uttara Kannada', 'Kodagu'
  ];

  const CROPS = [
    'Rice (Paddy)', 'Ragi (Finger Millet)', 'Sugarcane', 'Maize',
    'Tomato', 'Cotton', 'Banana', 'Onion', 'Groundnut', 'Arecanut',
    'Coconut', 'Coffee', 'Chilli', 'Turmeric', 'Ginger', 'Sunflower'
  ];

  const SOILS = [
    'Red Loamy Soil', 'Black Cotton Soil', 'Clayey Loam', 'Alluvial Soil',
    'Laterite Soil', 'Sandy Loam', 'Red Sandy Soil'
  ];

  const IRRIGATIONS = [
    'Borewell & Drip', 'Canal Irrigation', 'Open Well & Sprinkler',
    'Borewell & Flood', 'Drip Irrigation', 'Rainfed / Natural Rainfall', 'Sprinkler System'
  ];

  return `
    <div class="agro-modal-backdrop" id="editProfileModalBackdrop">
      <div class="agro-modal-card" id="editProfileModalCard" role="dialog" aria-modal="true" aria-labelledby="editProfileModalTitle">
        <div class="agro-modal-header">
          <div class="agro-modal-title-wrap">
            <div class="agro-modal-icon-badge">
              <i class="fas fa-user-edit"></i>
            </div>
            <div>
              <h3 id="editProfileModalTitle">${t('editProfile')}</h3>
              <p class="agro-modal-sub">${isKn ? 'ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಮತ್ತು ಕೃಷಿ ವಿವರಗಳನ್ನು ಬದಲಾಯಿಸಿ' : 'Update your personal profile, farm land size and crops'}</p>
            </div>
          </div>
          <button type="button" class="agro-modal-close-btn" id="btnCloseEditProfileModal" aria-label="Close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form id="formEditProfile" class="agro-modal-form">
          <div class="agro-modal-body">
            <!-- Personal Info Section -->
            <div class="agro-form-section-label">
              <i class="fas fa-id-card"></i> ${t('personalDetails')}
            </div>
            
            <div class="agro-form-grid">
              <div class="agro-form-group">
                <label for="editProfileName">${t('fullName')} <span class="required">*</span></label>
                <div class="agro-input-wrapper">
                  <i class="fas fa-user agro-input-icon"></i>
                  <input type="text" id="editProfileName" name="name" value="${escapeHtml(user.name)}" required placeholder="e.g. Ramesh Kumar">
                </div>
              </div>

              <div class="agro-form-group">
                <label for="editProfilePhone">${t('phone')} <span class="required">*</span></label>
                <div class="agro-input-wrapper">
                  <i class="fas fa-phone agro-input-icon"></i>
                  <input type="tel" id="editProfilePhone" name="phone" value="${escapeHtml(user.phone || '+91 98765 43210')}" required placeholder="+91 98765 43210">
                </div>
              </div>
            </div>

            <!-- Farm & Land Section -->
            <div class="agro-form-section-label" style="margin-top:16px;">
              <i class="fas fa-map-marked-alt"></i> ${t('farmDetails')}
            </div>

            <div class="agro-form-grid">
              <div class="agro-form-group">
                <label for="editProfileDistrict">${t('district')}</label>
                <div class="agro-input-wrapper">
                  <i class="fas fa-map agro-input-icon"></i>
                  <select id="editProfileDistrict" name="district">
                    ${DISTRICTS.map(d => `<option value="${d}" ${user.district === d ? 'selected' : ''}>${d}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div class="agro-form-group">
                <label for="editProfileTaluk">${t('taluk')}</label>
                <div class="agro-input-wrapper">
                  <i class="fas fa-map-marker-alt agro-input-icon"></i>
                  <input type="text" id="editProfileTaluk" name="taluk" value="${escapeHtml(user.taluk || 'Mandya')}" placeholder="e.g. Pandavapura / Maddur">
                </div>
              </div>

              <div class="agro-form-group">
                <label for="editProfileLocation">${t('location')}</label>
                <div class="agro-input-wrapper">
                  <i class="fas fa-location-arrow agro-input-icon"></i>
                  <input type="text" id="editProfileLocation" name="location" value="${escapeHtml(user.location || 'Mandya, Karnataka')}" placeholder="e.g. Mandya, Karnataka">
                </div>
              </div>

              <div class="agro-form-group">
                <label for="editProfileFarmSize">${t('farmSize')} <span class="required">*</span></label>
                <div class="agro-input-wrapper">
                  <i class="fas fa-vector-square agro-input-icon"></i>
                  <input type="text" id="editProfileFarmSize" name="farmSize" value="${escapeHtml(user.farmSize || '5 Acres')}" required placeholder="e.g. 5 Acres or 2 Hectares">
                </div>
              </div>

              <div class="agro-form-group">
                <label for="editProfileCrop">${t('primaryCrop')}</label>
                <div class="agro-input-wrapper">
                  <i class="fas fa-seedling agro-input-icon"></i>
                  <select id="editProfileCrop" name="primaryCrop">
                    ${CROPS.map(c => `<option value="${c}" ${user.primaryCrop === c ? 'selected' : ''}>${c}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div class="agro-form-group">
                <label for="editProfileSoil">${t('soilType')}</label>
                <div class="agro-input-wrapper">
                  <i class="fas fa-mountain agro-input-icon"></i>
                  <select id="editProfileSoil" name="soilType">
                    ${SOILS.map(s => `<option value="${s}" ${user.soilType === s ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div class="agro-form-group full-width">
                <label for="editProfileIrrigation">${t('irrigationSource')}</label>
                <div class="agro-input-wrapper">
                  <i class="fas fa-tint agro-input-icon"></i>
                  <select id="editProfileIrrigation" name="irrigationSource">
                    ${IRRIGATIONS.map(ir => `<option value="${ir}" ${user.irrigationSource === ir ? 'selected' : ''}>${ir}</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="agro-modal-footer">
            <button type="button" class="btn btn-outline" id="btnCancelEditProfile">
              ${t('cancel')}
            </button>
            <button type="submit" class="btn btn-primary" id="btnSubmitEditProfile">
              <i class="fas fa-save"></i> ${t('saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// -- Feedback --
function renderFeedback() {
  return renderAppLayout(`
    <div class="feedback-form">
      <h2>${t('feedbackTitle')}</h2>
      <p class="subtitle">${t('feedbackSub')}</p>
      <div style="margin-bottom:20px;">
        <label style="display:block;font-size:14px;font-weight:600;margin-bottom:8px;">${t('rateExperience')}</label>
        <div class="rating-stars" id="ratingStars">
          <i class="fas fa-star" data-star="1"></i>
          <i class="fas fa-star" data-star="2"></i>
          <i class="fas fa-star" data-star="3"></i>
          <i class="fas fa-star" data-star="4"></i>
          <i class="fas fa-star" data-star="5"></i>
        </div>
      </div>
      <textarea placeholder="${t('writeReview')}" id="feedbackText"></textarea>
      <button class="btn btn-primary" id="submitFeedback"><i class="fas fa-paper-plane"></i> ${t('submitFeedback')}</button>
    </div>
  `);
}

// -- Settings --
function renderSettings() {
  return renderAppLayout(`
    <h2 style="font-size:22px;font-weight:700;margin-bottom:20px;">${t('settings')}</h2>
    <div class="settings-grid">
      <!-- Appearance -->
      <div class="settings-section">
        <h3><i class="fas fa-palette"></i> ${t('appearance')}</h3>
        <div class="setting-item">
          <div class="setting-info">
            <h4>${t('darkMode')}</h4>
            <p>Switch between light and dark themes</p>
          </div>
          <div class="toggle-switch ${state.theme === 'dark' ? 'active' : ''}" id="darkModeToggle"></div>
        </div>
      </div>

      <!-- Language -->
      <div class="settings-section">
        <h3><i class="fas fa-globe"></i> ${t('language')}</h3>
        <div class="setting-item">
          <div class="setting-info">
            <h4>Select Language / भाषा चुनें / ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ</h4>
            <p>Choose your preferred language for the app</p>
          </div>
        </div>
        <div class="lang-options" id="langOptions">
          <button class="lang-option ${state.lang === 'en' ? 'active' : ''}" data-lang="en">🇬🇧 English</button>
          <button class="lang-option ${state.lang === 'hi' ? 'active' : ''}" data-lang="hi">🇮🇳 हिंदी</button>
          <button class="lang-option ${state.lang === 'kn' ? 'active' : ''}" data-lang="kn">🇮🇳 ಕನ್ನಡ</button>
        </div>
      </div>

      <!-- Notifications -->
      <div class="settings-section">
        <h3><i class="fas fa-bell"></i> ${t('notifications')}</h3>
        <div class="setting-item">
          <div class="setting-info"><h4>Weather Alerts</h4><p>Get notified about weather changes</p></div>
          <div class="toggle-switch active" id="weatherNotif"></div>
        </div>
        <div class="setting-item">
          <div class="setting-info"><h4>Scheme Updates</h4><p>New government scheme notifications</p></div>
          <div class="toggle-switch active" id="schemeNotif"></div>
        </div>
        <div class="setting-item">
          <div class="setting-info"><h4>Market Price Alerts</h4><p>Price change notifications for your crops</p></div>
          <div class="toggle-switch active" id="priceNotif"></div>
        </div>
        <div class="setting-item">
          <div class="setting-info"><h4>Crop Care Reminders</h4><p>Timely reminders for crop activities</p></div>
          <div class="toggle-switch" id="cropNotif"></div>
        </div>
      </div>

      <!-- Account -->
      <div class="settings-section">
        <h3><i class="fas fa-user-cog"></i> Account</h3>
        <div class="setting-item">
          <div class="setting-info"><h4>${t('editProfile')}</h4><p>${state.lang === 'kn' ? 'ನಿಮ್ಮ ಹೆಸರು, ಸ್ಥಳ, ಹೊಲದ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಿ' : 'Update your name, location, farm details'}</p></div>
          <button class="btn btn-outline btn-sm" id="btnSettingsEditProfile" data-action="open-edit-profile">Edit →</button>
        </div>
        <div class="setting-item">
          <div class="setting-info"><h4>Change Password</h4><p>Update your account password</p></div>
          <button class="btn btn-outline btn-sm">Change →</button>
        </div>
        <div class="setting-item">
          <div class="setting-info"><h4>${t('logout')}</h4><p>Sign out of your account</p></div>
          <button class="btn btn-outline btn-sm" id="settingsLogout" style="color:var(--accent-red);border-color:var(--accent-red);">
            <i class="fas fa-sign-out-alt"></i> ${t('logout')}
          </button>
        </div>
      </div>
    </div>
  `);
}

// ============ NAVIGATION & RENDERING ============
function navigateTo(page, extra) {
  state.currentPage = page;
  if (extra) state.selectedCrop = extra;
  if (page === 'chatbot' && window._agrovaInitialChatDraft) {
    state.chatDraft = window._agrovaInitialChatDraft;
    window._agrovaInitialChatDraft = null;
  }
  if (page === 'market' && !marketState.calculationResult && !marketState.isCalculating) {
    executeMarketCalculation(() => {
      if (state.currentPage === 'market') render();
    });
  }
  render();
}

function render() {
  const app = document.getElementById('app');
  applyTheme();
  applyLang();

  switch (state.currentPage) {
    case 'login': app.innerHTML = renderLogin(); break;
    case 'signup': app.innerHTML = renderSignup(); break;
    case 'home': app.innerHTML = renderHome(); break;
    case 'chatbot': app.innerHTML = renderChatbot(); break;
    case 'weather': app.innerHTML = renderWeather(); break;
    case 'schemes': app.innerHTML = renderSchemes(); break;
    case 'cropcare': app.innerHTML = renderCropCare(); break;
    case 'cropdetail': app.innerHTML = renderCropDetail(state.selectedCrop); break;
    case 'market': app.innerHTML = renderMarket(); break;
    case 'irrigation': app.innerHTML = renderIrrigation(); break;
    case 'profile': app.innerHTML = renderProfile(); break;
    case 'feedback': app.innerHTML = renderFeedback(); break;
    case 'settings': app.innerHTML = renderSettings(); break;
    default: app.innerHTML = renderHome();
  }

  attachEventListeners();

  // If on Market page in advisor mode with results, initialize Leaflet Map after DOM is ready
  if (state.currentPage === 'market' && marketState.activeTab === 'advisor' && marketState.calculationResult) {
    setTimeout(() => {
      initMarketLeafletMap();
    }, 80);
  }
}

// ============ EVENT LISTENERS ============
function attachEventListeners() {
  // Navigation clicks (sidebar + inline)
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const page = el.getAttribute('data-page');
      state.sidebarOpen = false;
      if (el.getAttribute('data-action') === 'open-edit-profile') {
        state.editProfileModalOpen = true;
      }
      navigateTo(page);
    });
  });

  // Direct modal trigger without page change
  document.querySelectorAll('[data-action="open-edit-profile"]:not([data-page])').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      state.editProfileModalOpen = true;
      render();
    });
  });

  // Crop card clicks
  document.querySelectorAll('[data-crop]').forEach(el => {
    el.addEventListener('click', () => {
      const cropId = el.getAttribute('data-crop');
      navigateTo('cropdetail', cropId);
    });
  });

  // Auth forms
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    if (state.authNotice) {
      const infoEl = document.getElementById('authInfo');
      if (infoEl) {
        infoEl.classList.add('show');
        const nEmail = typeof state.authNotice === 'object' ? state.authNotice.email : '';
        const nMsg = typeof state.authNotice === 'object' ? state.authNotice.message : state.authNotice;
        infoEl.innerHTML = `
          <i class="fas fa-envelope-open-text" style="color:var(--primary);font-size:18px;"></i>
          <div style="flex:1;">
            <div>${nMsg}</div>
            ${nEmail ? `<button type="button" class="btn-resend-confirm" data-email="${nEmail}" style="margin-top:8px;padding:6px 12px;background:var(--primary);color:white;border:none;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i class="fas fa-paper-plane"></i> Resend Verification Email</button>` : ''}
          </div>
        `;
      }
      state.authNotice = null;
    }

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      const errEl = document.getElementById('authError');
      const infoEl = document.getElementById('authInfo');
      if (errEl) errEl.classList.remove('show');
      if (infoEl) infoEl.classList.remove('show');

      if (!email || !password) {
        if (errEl) {
          errEl.classList.add('show');
          errEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> <span>Please fill in all fields</span>';
        }
        return;
      }

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const origBtnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
      }

      try {
        const result = await supabaseSignIn(email, password);
        state.user = {
          id: result.user?.id,
          email: result.user?.email || email,
          name: result.user?.user_metadata?.full_name || email.split('@')[0],
        };
        localStorage.setItem('agrova-user', JSON.stringify(state.user));
        showToast(`Welcome back, ${state.user.name}!`);
        navigateTo('home');
      } catch (err) {
        console.error('Sign in error:', err);
        if (errEl) {
          errEl.classList.add('show');
          if (err.isUnconfirmed) {
            errEl.innerHTML = `
              <i class="fas fa-exclamation-triangle" style="font-size:18px;color:#e11d48;"></i>
              <div style="flex:1;">
                <div>${err.message}</div>
                <button type="button" class="btn-resend-confirm" data-email="${err.email}" style="margin-top:8px;padding:6px 12px;background:#e11d48;color:white;border:none;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i class="fas fa-paper-plane"></i> Resend Verification Email</button>
              </div>
            `;
          } else {
            errEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> <span>${err.message || 'Invalid email or password'}</span>`;
          }
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = origBtnText;
        }
      }
    });
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const confirm = document.getElementById('signupConfirm').value;

      const errEl = document.getElementById('authError');
      const infoEl = document.getElementById('authInfo');
      if (errEl) errEl.classList.remove('show');
      if (infoEl) infoEl.classList.remove('show');

      if (!name || !email || !password) {
        if (errEl) {
          errEl.classList.add('show');
          errEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> <span>Please fill in all required fields</span>';
        }
        return;
      }

      if (password.length < 6) {
        if (errEl) {
          errEl.classList.add('show');
          errEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> <span>Password must be at least 6 characters long</span>';
        }
        return;
      }

      if (password !== confirm) {
        if (errEl) {
          errEl.classList.add('show');
          errEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> <span>Passwords do not match</span>';
        }
        return;
      }

      const submitBtn = signupForm.querySelector('button[type="submit"]');
      const origBtnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
      }

      try {
        await supabaseSignUp(email, password, name);
        showToast('Verification email sent! Please check your inbox.', 'success');
        state.authNotice = {
          email,
          message: `Verification email sent to <strong>${email}</strong>.<br>Please verify your email address before logging in.<br><em>(Check your Spam/Junk folder if not found in Inbox)</em>`
        };
        navigateTo('login');
      } catch (err) {
        console.error('Sign up error:', err);
        if (errEl) {
          let msg = err.message || 'Failed to create account. Please try again.';
          if (msg.includes('weak_password') || msg.includes('characters') || msg.includes('Password should contain')) {
            msg = 'Password is too simple! Please include: 1 Uppercase (A-Z), 1 Lowercase (a-z), 1 Number (0-9), and 1 Symbol (e.g. Kisan@2026!)';
          }
          errEl.classList.add('show');
          errEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> <span>${msg}</span>`;
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = origBtnText;
        }
      }
    });
  }

  // Google OAuth button handlers
  const handleGoogleAuth = async (btn) => {
    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting to Google...';
      }
      await supabaseGoogleSignIn();
    } catch (err) {
      console.error('Google Sign In error:', err);
      showToast(err.message || 'Failed to start Google sign in', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>
          <span>Continue with Google</span>
        `;
      }
    }
  };

  document.getElementById('loginGoogleBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    handleGoogleAuth(e.currentTarget);
  });
  document.getElementById('signupGoogleBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    handleGoogleAuth(e.currentTarget);
  });

  // Resend verification email click handler
  document.addEventListener('click', async (e) => {
    const resendBtn = e.target.closest('.btn-resend-confirm');
    if (resendBtn) {
      e.preventDefault();
      const targetEmail = resendBtn.getAttribute('data-email');
      if (!targetEmail) return;
      try {
        resendBtn.disabled = true;
        resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        await supabaseResendVerification(targetEmail);
        showToast('New verification email sent! Please check your inbox.', 'success');
        resendBtn.innerHTML = '<i class="fas fa-check"></i> Email Resent!';
      } catch (err) {
        showToast(err.message || 'Failed to resend verification email', 'error');
        resendBtn.disabled = false;
        resendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Resend Verification Email';
      }
    }
  });

  // Quick Demo Login buttons
  const handleQuickDemo = () => {
    persistActiveUser({
      id: 'demo_farmer_' + Date.now(),
      email: 'kishor.farmer@agrova.in',
      name: 'Kishor Patel',
      district: 'Mandya',
      location: 'Mandya, Karnataka',
      taluk: 'Pandavapura',
      farmSize: '5.5 Acres',
      primaryCrop: 'Rice (Paddy)',
      soilType: 'Red Loamy Soil',
      irrigationSource: 'Borewell & Drip'
    });
    showToast(`Logged in as Demo Farmer: ${state.user.name}!`);
    navigateTo('home');
  };

  document.getElementById('quickDemoLogin')?.addEventListener('click', handleQuickDemo);
  document.getElementById('quickDemoSignup')?.addEventListener('click', handleQuickDemo);

  // Auth switch links
  document.getElementById('goToSignup')?.addEventListener('click', () => navigateTo('signup'));
  document.getElementById('goToLogin')?.addEventListener('click', () => navigateTo('login'));

  // Language selectors
  ['sidebarLang', 'headerLang'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', (e) => {
      state.lang = e.target.value;
      render();
    });
  });

  // Sidebar toggle
  document.getElementById('menuToggle')?.addEventListener('click', () => {
    state.sidebarOpen = true;
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sidebarOverlay')?.classList.add('show');
  });

  document.getElementById('sidebarClose')?.addEventListener('click', () => {
    state.sidebarOpen = false;
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('show');
  });

  document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
    state.sidebarOpen = false;
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('show');
  });

  // Multimodal Chat: keep the pending state across renders and prevent duplicate sends.
  const chatInput = document.getElementById('chatInput');
  const scrollChat = () => {
    setTimeout(() => {
      const messages = document.getElementById('chatMessages');
      if (messages) messages.scrollTop = messages.scrollHeight;
    }, 50);
  };

  async function sendChat(text, customOptions = {}) {
    if (state.chatPending) return;

    const attachedImages = [...multimodalState.attachedImages];
    const attachedFiles = [...multimodalState.attachedFiles];
    const rawQuestion = (text || '').trim();

    if (!rawQuestion && attachedImages.length === 0 && attachedFiles.length === 0) {
      return;
    }

    // Default question if farmer uploaded image or voice without typing
    let displayQuestion = rawQuestion;
    if (!displayQuestion) {
      if (attachedImages.length > 0) {
        displayQuestion = state.lang === 'kn' ? 'ಬೆಳೆ ರೋಗ ಮತ್ತು ಎಲೆ ಲಕ್ಷಣಗಳ ತಪಾಸಣೆ' : 'Crop Disease Diagnosis & Health Check';
      } else if (attachedFiles.length > 0) {
        displayQuestion = state.lang === 'kn' ? 'ಮಣ್ಣು / ಕೃಷಿ ದಾಖಲೆ ವಿಶ್ಲೇಷಣೆ' : 'Agricultural Document & Soil Report Analysis';
      } else {
        displayQuestion = state.lang === 'kn' ? 'ಧ್ವನಿ ಪ್ರಶ್ನೆ' : 'Voice Farming Inquiry';
      }
    }

    // Push user message
    const userMsgId = 'msg_u_' + Date.now();
    state.chatMessages.push({
      id: userMsgId,
      type: 'user',
      text: displayQuestion,
      images: attachedImages,
      files: attachedFiles,
      isVoice: Boolean(customOptions.isVoice),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // Clear composer state immediately
    state.chatDraft = '';
    clearAllAttachments();
    state.chatPending = true;
    state.chatPendingVision = attachedImages.length > 0;

    render();
    scrollChat();

    try {
      const response = await askGemini(displayQuestion, {
        images: attachedImages,
        files: attachedFiles,
        history: state.chatMessages,
        lastDiagnosis: multimodalState.lastDiagnosisContext
      });

      // Check for crop disease diagnosis
      let diagnosisData = null;
      let diagnosisImgThumb = '';

      if (attachedImages.length > 0) {
        diagnosisData = extractDiagnosisFromJson(response) || matchLocalVisualDiagnosis(attachedImages[0].name, displayQuestion, state.lang);
        diagnosisImgThumb = attachedImages[0].dataUrl;
        if (diagnosisData) {
          multimodalState.lastDiagnosisContext = {
            crop: diagnosisData.crop,
            cropKn: diagnosisData.cropKn,
            disease: diagnosisData.disease,
            diseaseKn: diagnosisData.diseaseKn
          };
        }
      }

      state.chatMessages.push({
        id: 'msg_b_' + Date.now(),
        type: 'bot',
        text: response,
        diagnosis: diagnosisData,
        diagnosisImage: diagnosisImgThumb,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) {
      console.warn('Chat error:', err);
      state.chatMessages.push({
        id: 'msg_b_' + Date.now(),
        type: 'bot',
        text: state.lang === 'kn'
          ? 'ಕ್ಷಮಿಸಿ, ಕೃಷಿ ಸಲಹೆ ಪಡೆಯುವಲ್ಲಿ ದೋಷ ಕಂಡುಬಂದಿದೆ. ದಯವಿಟ್ಟು ಪುನಃ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ.'
          : 'Sorry, I encountered an issue analyzing your farming inquiry. Please check your network and try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } finally {
      state.chatPending = false;
      state.chatPendingVision = false;
      if (state.currentPage === 'chatbot') {
        render();
        scrollChat();
        document.getElementById('chatInput')?.focus();
      }
    }
  }

  // Form submit & Enter key
  document.getElementById('chatForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    sendChat(chatInput?.value);
  });
  chatInput?.addEventListener('input', () => { state.chatDraft = chatInput.value; });
  chatInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      sendChat(chatInput.value);
    }
  });

  // Clear chat
  document.getElementById('chatNew')?.addEventListener('click', () => {
    if (state.chatPending) return;
    state.chatMessages = [];
    state.chatDraft = '';
    clearAllAttachments();
    stopVoiceRecognition();
    stopVoiceResponse();
    multimodalState.lastDiagnosisContext = null;
    render();
    document.getElementById('chatInput')?.focus();
  });

  // Multimodal Attachment Button Triggers
  document.getElementById('chatFileBtn')?.addEventListener('click', () => {
    document.getElementById('chatFileInput')?.click();
  });
  document.getElementById('chatImageBtn')?.addEventListener('click', () => {
    document.getElementById('chatImageInput')?.click();
  });
  document.getElementById('chatCameraBtn')?.addEventListener('click', () => {
    document.getElementById('chatCameraInput')?.click();
  });

  // Hidden File Inputs Change Listeners
  document.getElementById('chatFileInput')?.addEventListener('change', async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await addDocFiles(e.target.files, (err) => showToast(err, 'error'));
      render();
    }
  });

  document.getElementById('chatImageInput')?.addEventListener('change', async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await addImageFiles(e.target.files, (err) => showToast(err, 'error'));
      render();
    }
  });

  document.getElementById('chatCameraInput')?.addEventListener('change', async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await addImageFiles(e.target.files, (err) => showToast(err, 'error'));
      render();
    }
  });

  // Remove Attachment Buttons
  document.querySelectorAll('.btn-remove-image').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      removeAttachedImage(id);
      render();
    });
  });

  document.querySelectorAll('.btn-remove-file').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      removeAttachedFile(id);
      render();
    });
  });

  // Voice Microphone Recording Controls
  let voiceTimer = null;
  let voiceSeconds = 0;

  document.getElementById('chatMicBtn')?.addEventListener('click', () => {
    if (multimodalState.isRecordingVoice) {
      stopVoiceRecognition();
      if (voiceTimer) clearInterval(voiceTimer);
      multimodalState.isRecordingVoice = false;
      render();
      return;
    }

    voiceSeconds = 0;
    multimodalState.isRecordingVoice = true;
    render();

    const timerEl = document.getElementById('voiceRecordingTimer');
    voiceTimer = setInterval(() => {
      voiceSeconds++;
      const mins = String(Math.floor(voiceSeconds / 60)).padStart(2, '0');
      const secs = String(voiceSeconds % 60).padStart(2, '0');
      if (timerEl) timerEl.textContent = `${mins}:${secs}`;
    }, 1000);

    startVoiceRecognition({
      lang: state.lang,
      onInterim: (text) => {
        const input = document.getElementById('chatInput');
        if (input) input.value = text;
        state.chatDraft = text;
      },
      onFinal: (text) => {
        const input = document.getElementById('chatInput');
        if (input) input.value = text;
        state.chatDraft = text;
      },
      onError: (err) => {
        showToast(err, 'error');
        if (voiceTimer) clearInterval(voiceTimer);
        multimodalState.isRecordingVoice = false;
        render();
      },
      onEnd: () => {
        if (voiceTimer) clearInterval(voiceTimer);
        multimodalState.isRecordingVoice = false;
        render();
      }
    });
  });

  document.getElementById('btnVoiceCancel')?.addEventListener('click', () => {
    stopVoiceRecognition();
    if (voiceTimer) clearInterval(voiceTimer);
    multimodalState.isRecordingVoice = false;
    state.chatDraft = '';
    render();
  });

  document.getElementById('btnVoiceDone')?.addEventListener('click', () => {
    stopVoiceRecognition();
    if (voiceTimer) clearInterval(voiceTimer);
    multimodalState.isRecordingVoice = false;
    const txt = state.chatDraft || document.getElementById('chatInput')?.value || '';
    sendChat(txt, { isVoice: true });
  });

  // TTS Read Aloud Buttons
  document.querySelectorAll('.btn-tts-speak').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const msgId = btn.getAttribute('data-msg-id');
      const textToSpeak = btn.getAttribute('data-speak-text') || '';

      if (multimodalState.currentlyPlayingAudioId === msgId) {
        stopVoiceResponse();
        render();
      } else {
        multimodalState.currentlyPlayingAudioId = msgId;
        render();
        playVoiceResponse(
          textToSpeak,
          state.lang,
          () => {},
          () => { render(); }
        );
      }
    });
  });

  // "Ask More About This Disease" CTA
  document.querySelectorAll('.btn-ask-more').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const disease = btn.getAttribute('data-disease') || '';
      const crop = btn.getAttribute('data-crop') || '';
      const followUp = state.lang === 'kn'
        ? `${crop} ಬೆಳೆಯಲ್ಲಿ ${disease} ಹತೋಟಿಗೆ ಬೇವಿನ ಎಣ್ಣೆ ಅಥವಾ ಜೈವಿಕ ಕೀಟನಾಶಕ ಸಿಂಪಡಿಸುವುದು ಹೇಗೆ?`
        : `How can I treat and control ${disease} in ${crop} using organic remedies and approved bio-fungicides?`;
      sendChat(followUp);
    });
  });


  // Home Embedded Chat Panel
  const homeChatSend = document.getElementById('homeChatSend');
  const homeChatInput = document.getElementById('homeChatInput');
  const homeChatBody = document.getElementById('homeChatBody');

  async function sendHomeChat(text) {
    if (!text || !text.trim() || !homeChatBody) return;
    const q = text.trim();
    if (homeChatInput) homeChatInput.value = '';

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message
    const userMsgEl = document.createElement('div');
    userMsgEl.className = 'home-chat-msg user';
    userMsgEl.innerHTML = `
      <div class="avatar" style="background:#16a34a;color:white;">${(state.user?.name || 'R')[0]}</div>
      <div class="bubble">
        ${q}
        <div style="font-size:10px;color:var(--text-muted);text-align:right;margin-top:4px;">${timeStr}</div>
      </div>
    `;
    homeChatBody.appendChild(userMsgEl);
    homeChatBody.scrollTop = homeChatBody.scrollHeight;

    // Loading indicator
    const loadingEl = document.createElement('div');
    loadingEl.className = 'home-chat-msg bot';
    loadingEl.innerHTML = `
      <div class="avatar">🌾</div>
      <div class="bubble" style="font-style:italic;color:var(--text-muted);">
        Agrova AI is analyzing your farm inquiry...
      </div>
    `;
    homeChatBody.appendChild(loadingEl);
    homeChatBody.scrollTop = homeChatBody.scrollHeight;

    const response = await generateBotResponse(q);
    loadingEl.remove();

    const botMsgEl = document.createElement('div');
    botMsgEl.className = 'home-chat-msg bot';
    botMsgEl.innerHTML = `
      <div class="avatar">🌾</div>
      <div class="bubble">
        ${response.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
        <div style="font-size:10px;color:var(--text-muted);margin-top:6px;">${timeStr} • Agrova AI</div>
      </div>
    `;
    homeChatBody.appendChild(botMsgEl);
    homeChatBody.scrollTop = homeChatBody.scrollHeight;
  }

  homeChatSend?.addEventListener('click', () => {
    sendHomeChat(homeChatInput?.value);
  });

  homeChatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendHomeChat(homeChatInput?.value);
  });

  // Recent Question Clicks
  document.querySelectorAll('.recent-question-item').forEach(item => {
    item.addEventListener('click', () => {
      const q = item.getAttribute('data-q');
      if (document.getElementById('homeChatBody')) {
        sendHomeChat(q);
      } else {
        navigateTo('chatbot');
        setTimeout(() => sendChat(q), 80);
      }
    });
  });

  // Chat suggestions
  document.querySelectorAll('.chat-suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-q');
      if (document.getElementById('homeChatBody')) {
        sendHomeChat(q);
      } else {
        sendChat(q);
      }
    });
  });

  // Dark mode toggle
  document.getElementById('darkModeToggle')?.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    render();
  });

  // Language options in settings
  document.getElementById('langOptions')?.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', () => {
      state.lang = btn.getAttribute('data-lang');
      render();
    });
  });

  // Toggle switches
  document.querySelectorAll('.toggle-switch').forEach(toggle => {
    if (toggle.id === 'darkModeToggle') return; // handled above
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
    });
  });

  // Rating stars
  document.getElementById('ratingStars')?.querySelectorAll('i').forEach(star => {
    star.addEventListener('click', () => {
      const rating = parseInt(star.getAttribute('data-star'));
      document.getElementById('ratingStars').querySelectorAll('i').forEach((s, i) => {
        s.classList.toggle('active', i < rating);
      });
    });
  });

  // Submit feedback
  document.getElementById('submitFeedback')?.addEventListener('click', () => {
    const text = document.getElementById('feedbackText')?.value;
    if (text?.trim()) {
      showToast('Thank you for your feedback! 🙏');
      document.getElementById('feedbackText').value = '';
    }
  });

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
  document.getElementById('settingsLogout')?.addEventListener('click', handleLogout);

  // Crop category filter
  document.getElementById('cropCategories')?.querySelectorAll('.crop-category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.crop-category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-cat');
      document.querySelectorAll('.crop-learn-card').forEach(card => {
        if (cat === 'all' || card.getAttribute('data-category') === cat) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Crop search
  document.getElementById('cropSearch')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.crop-learn-card').forEach(card => {
      const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
      card.style.display = (name.includes(query) || desc.includes(query)) ? '' : 'none';
    });
  });

  // ============ MARKET PROFIT ADVISOR LISTENERS ============
  // 1. Tab switching
  document.getElementById('tabAdvisorBtn')?.addEventListener('click', () => {
    marketState.activeTab = 'advisor';
    render();
  });
  document.getElementById('tabTableBtn')?.addEventListener('click', () => {
    marketState.activeTab = 'table';
    render();
  });

  // 2. Location selection (Taluks & GPS)
  document.getElementById('talukSelect')?.addEventListener('change', (e) => {
    const talukId = e.target.value;
    marketState.selectedTalukId = talukId;
    const taluk = KARNATAKA_TALUKS.find(t => t.id === talukId);
    if (taluk) {
      marketState.farmerLat = taluk.lat;
      marketState.farmerLng = taluk.lng;
      marketState.farmerLocationName = `${taluk.name}, ${taluk.district}, Karnataka`;
      const sub = document.querySelector('.advisor-input-card .loc-subtext span');
      if (sub) sub.textContent = `📍 ${marketState.farmerLocationName}`;
    }
  });

  document.getElementById('useGpsBtn')?.addEventListener('click', () => {
    const btn = document.getElementById('useGpsBtn');
    if (!navigator.geolocation) {
      showToast(state.lang === 'kn' ? 'ನಿಮ್ಮ ಬ್ರೌಸರ್ ಜಿಪಿಎಸ್ ಬೆಂಬಲಿಸುವುದಿಲ್ಲ' : 'Browser geolocation not supported', 'error');
      return;
    }
    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        marketState.farmerLat = pos.coords.latitude;
        marketState.farmerLng = pos.coords.longitude;
        marketState.farmerLocationName = state.lang === 'kn'
          ? `ಜಿಪಿಎಸ್ ಹೊಲ (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`
          : `GPS Farm (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`;
        showToast(state.lang === 'kn' ? 'ಸ್ಥಳ ಯಶಸ್ವಿಯಾಗಿ ಪತ್ತೆಯಾಗಿದೆ!' : 'GPS Farm Location detected!');
        executeMarketCalculation(() => render());
      },
      (err) => {
        if (btn) btn.innerHTML = `<i class="fas fa-crosshairs"></i> <span>${state.lang === 'kn' ? 'ಜಿಪಿಎಸ್' : 'GPS'}</span>`;
        showToast(state.lang === 'kn' ? 'ಜಿಪಿಎಸ್ ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ. ತಾಲೂಕು ಆಯ್ಕೆಮಾಡಿ.' : 'GPS unavailable. Please select Taluk manually.', 'error');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  });

  document.getElementById('saveFarmLocBtn')?.addEventListener('click', () => {
    try {
      localStorage.setItem('agrova-farm-location', JSON.stringify({
        lat: marketState.farmerLat,
        lng: marketState.farmerLng,
        name: marketState.farmerLocationName,
        talukId: marketState.selectedTalukId
      }));
      showToast(state.lang === 'kn' ? 'ಹೊಲದ ಸ್ಥಳ ಉಳಿಸಲಾಗಿದೆ!' : 'Farm location saved to profile!');
    } catch (e) {
      showToast('Could not save location', 'error');
    }
  });

  // 3. Crop selection
  document.getElementById('cropSelect')?.addEventListener('change', (e) => {
    marketState.selectedCropId = e.target.value;
    const crop = CALCULATOR_CROPS.find(c => c.id === e.target.value);
    const hint = document.getElementById('cropPerishHint');
    if (hint && crop) {
      hint.textContent = crop.isPerishable
        ? (state.lang === 'kn' ? '⚠️ ಬೇಗ ಹಾಳಾಗುವ ಬೆಳೆ • ಬೆಳಿಗ್ಗೆ ಮಂಡಿ ತಲುಪುವುದು ಸೂಕ್ತ' : '⚠️ Perishable Crop • Best to sell in morning auction')
        : (state.lang === 'kn' ? '🌾 ಬಾಳಿಕೆ ಬರುವ ಬೆಳೆ' : '🌾 Non-perishable staple crop');
    }
  });

  // 4. Quantity & Unit
  const updateQtyHint = () => {
    const qHint = document.getElementById('qtyConversionHint');
    if (qHint) {
      let qtls = marketState.quantity;
      if (marketState.unit === 'kg') qtls = (qtls / 100).toFixed(1);
      else if (marketState.unit === 'ton') qtls = (qtls * 10).toFixed(1);
      else if (marketState.unit === 'crate') qtls = (qtls * 0.25).toFixed(1);
      qHint.innerHTML = `<span>≈ ${qtls} ${state.lang === 'kn' ? 'ಕ್ವಿಂಟಾಲ್ ಒಟ್ಟು ತೂಕ' : 'Quintals total'}</span>`;
    }
  };

  document.getElementById('quantityInput')?.addEventListener('input', (e) => {
    marketState.quantity = parseFloat(e.target.value) || 0;
    updateQtyHint();
  });

  document.getElementById('unitSelect')?.addEventListener('change', (e) => {
    marketState.unit = e.target.value;
    updateQtyHint();
  });

  // 5. Vehicle & Advanced settings
  document.getElementById('vehicleSelect')?.addEventListener('change', (e) => {
    marketState.selectedVehicleId = e.target.value;
    const vObj = VEHICLES.find(v => v.id === e.target.value);
    const capHint = e.target.closest('.form-col')?.querySelector('.loc-subtext span');
    if (capHint && vObj) {
      capHint.textContent = `${state.lang === 'kn' ? 'ಸಾಮರ್ಥ್ಯ' : 'Capacity'}: ${vObj.capacityQtl} Qtl`;
    }
  });

  document.getElementById('toggleAdvancedBtn')?.addEventListener('click', () => {
    marketState.showAdvanced = !marketState.showAdvanced;
    const advBox = document.getElementById('advancedSettingsBox');
    const btnIcon = document.querySelector('#toggleAdvancedBtn i');
    if (advBox) advBox.style.display = marketState.showAdvanced ? 'grid' : 'none';
    if (btnIcon) btnIcon.className = `fas ${marketState.showAdvanced ? 'fa-chevron-up' : 'fa-chevron-down'}`;
  });

  document.getElementById('roundTripCheck')?.addEventListener('change', (e) => {
    marketState.isRoundTrip = e.target.checked;
  });

  document.getElementById('customRateInput')?.addEventListener('input', (e) => {
    marketState.customPerKmRate = e.target.value;
  });
  document.getElementById('loadingInput')?.addEventListener('input', (e) => {
    marketState.loadingPerQtl = parseFloat(e.target.value) || 0;
  });
  document.getElementById('unloadingInput')?.addEventListener('input', (e) => {
    marketState.unloadingPerQtl = parseFloat(e.target.value) || 0;
  });
  document.getElementById('cessInput')?.addEventListener('input', (e) => {
    marketState.apmcCessPercent = parseFloat(e.target.value) || 0;
  });
  document.getElementById('weighingInput')?.addEventListener('input', (e) => {
    marketState.weighingFee = parseFloat(e.target.value) || 0;
  });

  // 6. Calculate CTA
  document.getElementById('runCalculationBtn')?.addEventListener('click', () => {
    const btn = document.getElementById('runCalculationBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>${state.lang === 'kn' ? 'ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ...' : 'Calculating...'}</span>`;
    }
    executeMarketCalculation(() => {
      render();
      showToast(state.lang === 'kn' ? 'ಲಾಭದ ಲೆಕ್ಕಾಚಾರ ಪೂರ್ಣಗೊಂಡಿದೆ!' : 'Market profit calculation completed!');
    });
  });

  // 7. Calculate crop from table row
  document.querySelectorAll('.btn-calc-crop').forEach(btn => {
    btn.addEventListener('click', () => {
      const cropId = btn.getAttribute('data-crop-id');
      if (cropId) {
        marketState.selectedCropId = cropId;
        marketState.activeTab = 'advisor';
        executeMarketCalculation(() => {
          render();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    });
  });

  // 8. Mandi Table Search & Sort
  document.getElementById('mandiSearchInput')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('#allMandiTableBody tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  });

  document.getElementById('mandiSortSelect')?.addEventListener('change', (e) => {
    const sortVal = e.target.value;
    const tbody = document.getElementById('allMandiTableBody');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.sort((a, b) => {
      if (sortVal === 'price-desc') {
        const pA = parseInt(a.querySelector('.price-highlight')?.textContent.replace(/[^0-9]/g, '') || 0);
        const pB = parseInt(b.querySelector('.price-highlight')?.textContent.replace(/[^0-9]/g, '') || 0);
        return pB - pA;
      } else if (sortVal === 'price-asc') {
        const pA = parseInt(a.querySelector('.price-highlight')?.textContent.replace(/[^0-9]/g, '') || 0);
        const pB = parseInt(b.querySelector('.price-highlight')?.textContent.replace(/[^0-9]/g, '') || 0);
        return pA - pB;
      } else if (sortVal === 'crop') {
        const cA = a.querySelector('strong')?.textContent || '';
        const cB = b.querySelector('strong')?.textContent || '';
        return cA.localeCompare(cB);
      }
      return 0;
    });
    rows.forEach(r => tbody.appendChild(r));
  });

  // Scheme search
  document.getElementById('schemeSearch')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.scheme-detail-card').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(query) ? '' : 'none';
    });
  });

  // Scheme filter
  document.getElementById('schemeFilter')?.addEventListener('change', (e) => {
    const cat = e.target.value;
    document.querySelectorAll('.scheme-detail-card').forEach(card => {
      if (cat === 'all' || card.getAttribute('data-category') === cat) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });

  // Weather analyze
  document.getElementById('analyzeBtn')?.addEventListener('click', () => {
    const location = document.getElementById('locationInput')?.value || 'Mandya, Karnataka';
    state.weatherData = getWeatherData(location);
    render();
    showToast(`Weather analyzed for ${location}`);
  });

  // Password show/hide toggles in settings
  document.querySelectorAll('.btn-toggle-pwd').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btn.innerHTML = `<i class="fas fa-${isPass ? 'eye-slash' : 'eye'}"></i>`;
      }
    });
  });

  // Test Supabase Connection
  document.getElementById('testSupabaseBtn')?.addEventListener('click', async () => {
    const resEl = document.getElementById('supabaseTestResult');
    const url = document.getElementById('supabaseUrl')?.value?.trim();
    const key = document.getElementById('supabaseKey')?.value?.trim();

    if (resEl) {
      resEl.style.display = 'block';
      resEl.style.color = '#2563eb';
      resEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing Supabase connection...';
    }

    const res = await testSupabaseConnection(url, key);
    if (resEl) {
      resEl.style.color = res.ok ? '#16a34a' : '#dc2626';
      resEl.innerHTML = `<i class="fas fa-${res.ok ? 'check-circle' : 'times-circle'}"></i> ${res.message}`;
    }
  });

  // Test Gemini Connection
  document.getElementById('testGeminiBtn')?.addEventListener('click', async () => {
    const resEl = document.getElementById('geminiTestResult');
    const gemini = document.getElementById('geminiKey')?.value?.trim();

    if (resEl) {
      resEl.style.display = 'block';
      resEl.style.color = '#2563eb';
      resEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying Gemini 2.0 Flash API...';
    }

    const res = await testGeminiConnection(gemini);
    if (resEl) {
      resEl.style.color = res.ok ? '#16a34a' : '#dc2626';
      resEl.innerHTML = `<i class="fas fa-${res.ok ? 'check-circle' : 'times-circle'}"></i> ${res.message}`;
    }
  });

  // Save API & Integration config
  document.getElementById('saveApiConfig')?.addEventListener('click', () => {
    const url = document.getElementById('supabaseUrl')?.value?.trim() || '';
    const key = document.getElementById('supabaseKey')?.value?.trim() || '';
    const gemini = document.getElementById('geminiKey')?.value?.trim() || '';

    saveConfig({
      supabaseUrl: url,
      supabaseAnonKey: key,
      geminiApiKey: gemini
    });

    showToast('✅ Integrations saved! Supabase and Gemini are now active.');
    render();
  });

  // Header profile click
  document.getElementById('headerProfile')?.addEventListener('click', () => {
    navigateTo('profile');
  });

  // Sidebar user click
  document.getElementById('sidebarUser')?.addEventListener('click', () => {
    navigateTo('profile');
  });

  // ============ NOTIFICATIONS LISTENERS ============
  const notifBtn = document.getElementById('headerNotificationBtn');
  const notifDropdown = document.getElementById('notificationDropdown');
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('show');
    });
  }

  document.getElementById('btnCloseNotificationDropdown')?.addEventListener('click', (e) => {
    e.stopPropagation();
    notifDropdown?.classList.remove('show');
  });

  document.getElementById('btnMarkAllNotifsRead')?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.notifications.forEach(n => { n.read = true; });
    saveNotifications();
    showToast(state.lang === 'kn' ? 'ಎಲ್ಲಾ ಅಧಿಸೂಚನೆಗಳನ್ನು ಓದಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ' : 'All notifications marked as read', 'success');
    render();
    setTimeout(() => {
      document.getElementById('notificationDropdown')?.classList.add('show');
    }, 10);
  });

  document.getElementById('btnClearAllNotifs')?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.notifications = [];
    saveNotifications();
    showToast(state.lang === 'kn' ? 'ಎಲ್ಲಾ ಅಧಿಸೂಚನೆಗಳನ್ನು ಅಳಿಸಲಾಗಿದೆ' : 'All notifications cleared', 'success');
    render();
    setTimeout(() => {
      document.getElementById('notificationDropdown')?.classList.add('show');
    }, 10);
  });

  document.querySelectorAll('.notif-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.notif-dismiss-btn')) return;
      const notifId = item.getAttribute('data-id');
      const targetPage = item.getAttribute('data-page');
      const notif = state.notifications.find(n => n.id === notifId);
      if (notif) {
        notif.read = true;
        saveNotifications();
      }
      notifDropdown?.classList.remove('show');
      if (targetPage && targetPage !== state.currentPage) {
        navigateTo(targetPage);
      } else {
        render();
      }
    });
  });

  document.querySelectorAll('.notif-dismiss-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const deleteId = btn.getAttribute('data-delete-id');
      state.notifications = state.notifications.filter(n => n.id !== deleteId);
      saveNotifications();
      render();
      setTimeout(() => {
        document.getElementById('notificationDropdown')?.classList.add('show');
      }, 10);
    });
  });

  // ============ EDIT PROFILE MODAL LISTENERS ============
  const openEditProfile = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    state.editProfileModalOpen = true;
    render();
  };

  document.getElementById('btnOpenEditProfile')?.addEventListener('click', openEditProfile);
  document.getElementById('btnOpenEditProfileBottom')?.addEventListener('click', openEditProfile);
  document.getElementById('btnSettingsEditProfile')?.addEventListener('click', openEditProfile);

  const closeEditProfile = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    state.editProfileModalOpen = false;
    render();
  };

  document.getElementById('btnCloseEditProfileModal')?.addEventListener('click', closeEditProfile);
  document.getElementById('btnCancelEditProfile')?.addEventListener('click', closeEditProfile);

  const modalBackdrop = document.getElementById('editProfileModalBackdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeEditProfile(e);
      }
    });
  }

  const editProfileForm = document.getElementById('formEditProfile');
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('editProfileName')?.value.trim();
      const phone = document.getElementById('editProfilePhone')?.value.trim();
      const district = document.getElementById('editProfileDistrict')?.value.trim();
      const taluk = document.getElementById('editProfileTaluk')?.value.trim();
      const location = document.getElementById('editProfileLocation')?.value.trim() || `${taluk ? taluk + ', ' : ''}${district}, Karnataka`;
      const farmSize = document.getElementById('editProfileFarmSize')?.value.trim();
      const primaryCrop = document.getElementById('editProfileCrop')?.value.trim();
      const soilType = document.getElementById('editProfileSoil')?.value.trim();
      const irrigationSource = document.getElementById('editProfileIrrigation')?.value.trim();

      if (!name) {
        showToast('Please enter your full name', 'error');
        return;
      }

      persistActiveUser({
        name,
        phone,
        district,
        taluk,
        location,
        farmSize,
        primaryCrop,
        soilType,
        irrigationSource
      });

      // Try background update with Supabase if authenticated
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          supabase.auth.updateUser({
            data: {
              full_name: name,
              phone,
              district,
              taluk,
              location,
              farmSize,
              primaryCrop,
              soilType,
              irrigationSource
            }
          }).catch(err => console.warn('Supabase profile sync notice:', err));
        } catch (err) {}
      }

      state.editProfileModalOpen = false;
      showToast(state.lang === 'kn' ? '✅ ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ! 🌾' : '✅ Profile updated successfully! 🌾', 'success');
      render();
    });
  }

  // Market sort
  document.getElementById('marketSort')?.addEventListener('change', (e) => {
    const tbody = document.querySelector('#marketTable tbody');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.sort((a, b) => {
      const val = e.target.value;
      if (val === 'price-high') {
        return parseInt(b.cells[2].textContent.replace(/[₹,]/g, '')) - parseInt(a.cells[2].textContent.replace(/[₹,]/g, ''));
      }
      if (val === 'price-low') {
        return parseInt(a.cells[2].textContent.replace(/[₹,]/g, '')) - parseInt(b.cells[2].textContent.replace(/[₹,]/g, ''));
      }
      if (val === 'change') {
        return parseFloat(b.cells[3].textContent) - parseFloat(a.cells[3].textContent);
      }
      return a.cells[1].textContent.localeCompare(b.cells[1].textContent);
    });
    rows.forEach((row, i) => {
      row.cells[0].textContent = i + 1;
      tbody.appendChild(row);
    });
  });

  // Smart Irrigation & Water Wallet Event Listeners
  if (state.currentPage === 'irrigation') {
    attachIrrigationEventListeners(render, navigateTo, showToast);
  }
}

async function handleLogout() {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
  }
  state.user = null;
  localStorage.removeItem('agrova-user');
  state.chatMessages = [];
  showToast('Logged out successfully');
  navigateTo('login');
}

// Global outside click listener for notifications dropdown
document.addEventListener('click', (e) => {
  const container = document.getElementById('headerNotifContainer');
  if (container && !container.contains(e.target)) {
    document.getElementById('notificationDropdown')?.classList.remove('show');
  }
});

// Global Escape listener to close modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.editProfileModalOpen) {
    state.editProfileModalOpen = false;
    render();
  }
});

// ============ INIT ============
function init() {
  // Handle URL errors or confirmation links in the address bar
  if (window.location.hash.includes('error=')) {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const desc = params.get('error_description') || 'Authentication failed or verification link expired.';
    showToast(desc.replace(/\+/g, ' '), 'error');
    window.history.replaceState(null, '', window.location.pathname);
  }

  // Check for saved user
  const savedUser = localStorage.getItem('agrova-user');
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      state.user = {
        ...defaultUserProfile,
        ...parsed
      };
      state.currentPage = 'home';
    } catch (e) {
      localStorage.removeItem('agrova-user');
    }
  }

  // Supabase Auth listener (for email link confirmation redirects, Google OAuth & session sync)
  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        persistActiveUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          ...(session.user.user_metadata || {})
        });
        if (state.currentPage === 'login' || state.currentPage === 'signup') {
          navigateTo('home');
        }
      }
    });

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        persistActiveUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          ...(session.user.user_metadata || {})
        });
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        if (state.currentPage === 'login' || state.currentPage === 'signup') {
          showToast(`Signed in successfully! Welcome, ${state.user.name}!`, 'success');
          navigateTo('home');
        }
      } else if (event === 'SIGNED_OUT') {
        state.user = null;
        localStorage.removeItem('agrova-user');
      }
    });
  }

  // Apply saved settings
  applyTheme();
  applyLang();

  render();
}

init();
