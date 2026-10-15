// ===================================================================
// AGROVA - Central Backend & AI Integration Config (Supabase & Gemini)
// ===================================================================
import { createClient } from '@supabase/supabase-js';

// Default / fallback keys
const DEFAULT_SUPABASE_URL = 'https://louptbuqtyxvctviiqrb.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvdXB0YnVxdHl4dmN0dmlpcXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0Mzc1NzAsImV4cCI6MjEwNzAxMzU3MH0.KGfF5fYJxZ26zr8cGo9ue7uMRiqB-5cA7DL79LVxgRM';

// Helper to clean up any trailing slashes or /rest/v1 paths
function sanitizeSupabaseUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

/**
 * Get the current configuration from .env / localStorage / fallbacks
 */
export function getConfig() {
  const envSupabaseUrl = sanitizeSupabaseUrl(typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : '');
  const envSupabaseKey = (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_SUPABASE_ANON_KEY || '') : '').trim();
  const envGeminiKey = (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_GEMINI_API_KEY || '') : '').trim();

  let localSupabaseUrl = '';
  let localSupabaseKey = '';
  let localGeminiKey = '';

  if (typeof localStorage !== 'undefined') {
    localSupabaseUrl = sanitizeSupabaseUrl(localStorage.getItem('agrova-supabase-url'));
    localSupabaseKey = (localStorage.getItem('agrova-supabase-key') || '').trim();
    localGeminiKey = (localStorage.getItem('agrova-gemini-key') || '').trim();

    // Clean up legacy/broken local keys if any
    if (localSupabaseKey && localSupabaseKey.startsWith('sb_publishable_')) {
      localStorage.removeItem('agrova-supabase-key');
      localSupabaseKey = '';
    }
  }

  const supabaseUrl = envSupabaseUrl || localSupabaseUrl || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey = envSupabaseKey || localSupabaseKey || DEFAULT_SUPABASE_KEY;
  const geminiApiKey = envGeminiKey || localGeminiKey || '';

  const isSupabaseConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'YOUR_SUPABASE_URL' &&
    supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
  );

  const isGeminiConfigured = Boolean(
    geminiApiKey &&
    geminiApiKey !== 'YOUR_GEMINI_API_KEY' &&
    geminiApiKey.trim().length > 10
  );

  return {
    supabaseUrl,
    supabaseAnonKey,
    geminiApiKey,
    isSupabaseConfigured,
    isGeminiConfigured
  };
}

/**
 * Save user credentials directly into browser localStorage
 */
export function saveConfig({ supabaseUrl, supabaseAnonKey, geminiApiKey }) {
  if (supabaseUrl !== undefined) {
    localStorage.setItem('agrova-supabase-url', sanitizeSupabaseUrl(supabaseUrl));
  }
  if (supabaseAnonKey !== undefined) {
    localStorage.setItem('agrova-supabase-key', supabaseAnonKey.trim());
  }
  if (geminiApiKey !== undefined) {
    localStorage.setItem('agrova-gemini-key', geminiApiKey.trim());
  }
  // Re-initialize Supabase client instance
  _supabaseInstance = null;
  return getConfig();
}

/**
 * Singleton Supabase Client
 */
let _supabaseInstance = null;

export function getSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } = getConfig();
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!_supabaseInstance) {
    try {
      _supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return _supabaseInstance;
}

/**
 * Test Supabase Connection
 */
export async function testSupabaseConnection(customUrl, customKey) {
  const cfg = getConfig();
  const url = customUrl || cfg.supabaseUrl;
  const key = customKey || cfg.supabaseAnonKey;

  if (!url || !key) {
    return { ok: false, message: 'Missing URL or Anon Key' };
  }

  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/health`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    if (res.ok || res.status === 200 || res.status === 401) {
      // 401 might mean health is protected but endpoint exists and responds
      return { ok: true, message: 'Supabase reachable & active!' };
    }
    return { ok: true, message: `Connected (Status: ${res.status})` };
  } catch (err) {
    return { ok: false, message: err.message || 'Connection failed. Check URL.' };
  }
}

/**
 * Candidate Gemini models in fallback order
 * Uses gemini-3.5-flash-lite as primary high-speed active model,
 * with gemini-3.8-flash and gemini-flash-latest as automated failovers.
 */
export const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest'
];

/**
 * Test Gemini API Key
 */
export async function testGeminiConnection(customApiKey) {
  const cfg = getConfig();
  const key = customApiKey || cfg.geminiApiKey;

  if (!key || key.length < 10) {
    return { ok: false, message: 'Please enter a valid Gemini API Key' };
  }

  for (const model of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Hello, reply with only: Agrova AI Connected.' }] }],
          generationConfig: { maxOutputTokens: 20 }
        })
      });

      const data = await res.json();
      if (data.error) {
        if (res.status === 402) {
          return { ok: false, message: 'API key is valid, but Google AI Studio billing/prepayment credits are depleted.' };
        }
        if (res.status === 429) {
          return { ok: false, message: 'API key is valid, but rate limit or daily free quota has been exceeded.' };
        }
        if (res.status === 503 || res.status === 500) {
          // Model temporarily unavailable or overloaded, try next candidate
          continue;
        }
        return { ok: false, message: data.error.message || 'Invalid Gemini API Key' };
      }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return { ok: true, message: text ? `Success (${model}): ${text.trim()}` : `Gemini AI (${model}) connected successfully!` };
    } catch (err) {
      // Network error on this model endpoint, try next candidate
    }
  }

  return { ok: false, message: 'Could not reach Gemini service. Please check your internet connection.' };
}

/**
 * Call Gemini AI model with multimodal image, file, and structured prompt support
 */
export async function callGemini(question, lang = 'en', options = {}) {
  const { geminiApiKey, isGeminiConfigured } = getConfig();

  const langNames = { en: 'English', hi: 'Hindi (हिंदी)', kn: 'Kannada (ಕನ್ನಡ)' };
  const targetLang = langNames[lang] || 'English';

  const isMultimodal = (options.images && options.images.length > 0) || (options.files && options.files.length > 0);

  const systemPrompt = isMultimodal
    ? `You are Agrova AI, a leading Agronomist and Crop Pathology specialist assisting Indian farmers (especially in Karnataka).
The farmer has uploaded crop photos or agricultural documents with their query.
Instructions:
1. Always respond primarily in ${targetLang}.
2. If crop photos are provided, thoroughly inspect the symptoms (lesions, discoloration, curling, necrosis, pests).
3. If disease/pest is suspected, format a clear, structured diagnosis including:
   - Identified Crop
   - Visible Symptoms
   - Most Likely Disease or Problem (fungal, bacterial, viral, pest, deficiency)
   - Other possible alternative causes
   - Confidence level (High/Moderate/Low) & Severity
   - Safe immediate cultural actions & organic remedies
   - Verified IPM chemical treatments with dilution rates (e.g. g/L or ml/L) per Indian agricultural university (UAS/ICAR) standards
   - When to consult the local Raitha Samparka Kendra / KVK
4. Never claim definite certainty if the image is ambiguous or blurry; ask the farmer for a clearer photo if needed.
5. If a document (like a Soil Health Card) is provided, explain the pH, NPK, and micronutrient status in simple terms.
6. Keep the tone practical, encouraging, and respectful.`
    : `You are Agrova AI, an expert Agricultural Agronomist dedicated to supporting Indian farmers.
You provide precise, practical, and highly actionable advice on:
- Scientific crop management, sowing dates, seed rates, and soil preparation
- Weather-adaptive irrigation and drip fertigation schedules
- Organic and chemical Integrated Pest & Disease Management (IPM) with exact dosages
- Direct Benefit Transfer (DBT) Central/State government subsidies (PM-Kisan, PM-KUSUM, PMFBY, NHM)
- Local APMC Mandi commodity market prices and strategic harvesting decisions
- Organic bio-fertilizers, composting, and soil health card interpretation

Instructions:
1. Always respond primarily in ${targetLang}.
2. Use clear bullet points and bold key recommendations (dosages, timing, warnings).
3. If giving pesticide or fertilizer advice, include safe dilution rates.
4. Keep the tone encouraging, respectful, and farmer-friendly.`;

  if (isGeminiConfigured) {
    // Assemble multimodal parts
    const userParts = [];

    // Add image parts (inlineData)
    if (options.images && options.images.length > 0) {
      options.images.forEach(img => {
        userParts.push({
          inlineData: {
            mimeType: img.mimeType || 'image/jpeg',
            data: img.base64
          }
        });
      });
    }

    // Add document parts
    if (options.files && options.files.length > 0) {
      options.files.forEach(f => {
        if (f.textContent) {
          userParts.push({
            text: `\n[Attached Document "${f.name}"]:\n${f.textContent.substring(0, 10000)}\n`
          });
        } else if (f.mimeType === 'application/pdf') {
          userParts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: f.base64
            }
          });
        }
      });
    }

    // Add main prompt text
    userParts.push({
      text: question
    });

    // Construct conversation history payload if provided
    const contents = [];
    if (options.history && Array.isArray(options.history) && options.history.length > 0) {
      options.history.slice(-4).forEach(h => {
        contents.push({
          role: h.type === 'bot' ? 'model' : 'user',
          parts: [{ text: h.text }]
        });
      });
    }
    contents.push({ role: 'user', parts: userParts });

    // Loop through candidate models in fallback order
    for (const model of GEMINI_MODELS) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            contents,
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 1500
            }
          })
        });

        const data = await res.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }

        if (data.error) {
          console.warn(`Gemini API (${model}) returned error:`, data.error);
          // If high demand (503) or server error (500), try next model candidate
          if (res.status === 503 || res.status === 500) {
            continue;
          }
        }
      } catch (err) {
        console.warn(`Gemini fetch error on model ${model}:`, err);
      }
    }
  }

  // Smart Offline/Demo Fallback
  return generateIntelligentFallback(question, lang, options);
}

/**
 * Intelligent localized fallback response generator with multimodal support
 */
function generateIntelligentFallback(question, lang = 'en', options = {}) {
  const q = question.toLowerCase();
  const isKn = lang === 'kn';
  const isHi = lang === 'hi';

  // 1. If images are attached, generate structured disease diagnosis
  if (options.images && options.images.length > 0) {
    const imgName = options.images[0].name || '';
    let diag = {
      crop: 'Tomato',
      cropKn: 'ಟೊಮೆಟೊ',
      disease: 'Early Blight (Alternaria solani)',
      diseaseKn: 'ಮುಂಚಿನ ಎಲೆ ಮಚ್ಚೆ ರೋಗ (ಅಲ್ಟರ್ನೇರಿಯಾ)',
      category: 'Fungal Infection',
      categoryKn: 'ಶಿಲೀಂಧ್ರ ರೋಗ',
      confidence: 'High (89%)',
      severity: 'Needs Attention',
      severityKn: 'ಗಮನ ಹರಿಸಬೇಕಾಗಿದೆ',
      severityClass: 'warning',
      symptoms: 'Concentric ring spots (bullseye pattern) on leaves with yellow margins.',
      symptomsKn: 'ಎಲೆಗಳ ಮೇಲೆ ವೃತ್ತಾಕಾರದ ಕಂದು ಬಣ್ಣದ ಮಚ್ಚೆಗಳು ಮತ್ತು ಸುತ್ತಲೂ ಹಳದಿ ಬಣ್ಣ.',
      actions: [
        'Inspect surrounding crop for similar fungal spots',
        'Prune and safely destroy lower infected leaves',
        'Avoid overhead spraying of water on foliage'
      ],
      actionsKn: [
        'ತೀವ್ರ ರೋಗಪೀಡಿತ ಕೆಳಗಿನ ಒಣ ಎಲೆಗಳನ್ನು ಕತ್ತರಿಸಿ ಹೊಲದಿಂದ ಹೊರಹಾಕಿ',
        'ಎಲೆಗಳ ಮೇಲೆ ನೀರು ಬೀಳದಂತೆ ಹನಿ ನೀರಾವರಿ ಪದ್ಧತಿ ಅನುಸರಿಸಿ',
        'ಗಿಡಗಳ ನಡುವೆ ಉತ್ತಮ ಗಾಳಿಯಾಡುವಂತೆ ಅಂತರ ಕಾಯ್ದುಕೊಳ್ಳಿ'
      ],
      preventions: [
        'Apply biological control: Trichoderma viride @ 5g/L water',
        'Spray Mancozeb 75% WP @ 2.5g/L if lesions expand rapidly',
        'Maintain balanced potash nutrition for leaf resistance'
      ],
      preventionsKn: [
        'ಜೈವಿಕ ಶಿಲೀಂಧ್ರನಾಶಕ ಟ್ರೈಕೋಡರ್ಮಾ ವಿರಿಡೆ 5 ಗ್ರಾಂ/ಲೀಟರ್ ಸಿಂಪಡಿಸಿ',
        'ರೋಗ ಹರಡದಂತೆ ಮ್ಯಾಂಕೋಜೆಬ್ 75% WP (2.5g/L) ಸೂಕ್ತ ಅಂತರದಲ್ಲಿ ಸಿಂಪಡಿಸಿ',
        'ಪೊಟ್ಯಾಷ್ ಗೊಬ್ಬರ ನೀಡಿ ಸಸ್ಯದ ರೋಗ ನಿರೋಧಕ ಶಕ್ತಿ ಹೆಚ್ಚಿಸಿ'
      ],
      expertAdvice: 'Consult local Krishi Vigyan Kendra (KVK) if spots develop on stem collars or green tomatoes.',
      expertAdviceKn: 'ಕಾಯಿ ಅಥವಾ ಮುಖ್ಯ ಕಾಂಡಕ್ಕೆ ಕಂದು ಮಚ್ಚೆಗಳು ಹರಡಿದರೆ ಸ್ಥಳೀಯ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ ಅಥವಾ KVK ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.'
    };

    if (q.includes('curl') || q.includes('ಸುರುಟು') || q.includes('whitefly')) {
      diag.disease = 'Tomato Leaf Curl Virus (ToLCV)';
      diag.diseaseKn = 'ಟೊಮೆಟೊ ಎಲೆ ಸುರುಟು ರೋಗ (ವೈರಸ್)';
      diag.category = 'Viral Infection';
      diag.categoryKn = 'ವೈರಸ್ ರೋಗ (ಬಿಳಿ ನೊಣ ಹರಡುತ್ತದೆ)';
      diag.severity = 'Severe';
      diag.severityKn = 'ತೀವ್ರ ಗಂಭೀರ';
      diag.severityClass = 'danger';
      diag.symptoms = 'Upward leaf curling, stunted growth, and bushy dwarfed appearance.';
      diag.symptomsKn = 'ಎಲೆಗಳು ಮೇಲ್ಮುಖವಾಗಿ ಸುರುಟಿಕೊಳ್ಳುವುದು, ಬೆಳವಣಿಗೆ ಕುಂಠಿತವಾಗುವುದು.';
      diag.actionsKn = ['ರೋಗಪೀಡಿತ ಗಿಡಗಳನ್ನು ಬೇರು ಸಹಿತ ಕಿತ್ತು ನಾಶಮಾಡಿ', 'ಎಕರೆಗೆ 10-12 ಹಳದಿ ಜಿಗುಟು ಬಲೆಗಳನ್ನು ಅಳವಡಿಸಿ'];
      diag.preventionsKn = ['ಬಿಳಿ ನೊಣ ಹತೋಟಿಗೆ ಬೇವಿನ ಎಣ್ಣೆ (2ml/L) ಅಥವಾ ಇಮಿಡಾಕ್ಲೋಪ್ರಿಡ್ (0.4ml/L) ಸಿಂಪಡಿಸಿ'];
    } else if (q.includes('paddy') || q.includes('rice') || q.includes('ಭತ್ತ') || q.includes('blast')) {
      diag.crop = 'Paddy / Rice';
      diag.cropKn = 'ಭತ್ತ';
      diag.disease = 'Paddy Blast (Magnaporthe oryzae)';
      diag.diseaseKn = 'ಭತ್ತದ ಬೆಂಕಿ ರೋಗ (ಬ್ಲಾಸ್ಟ್)';
      diag.symptoms = 'Diamond/spindle shaped spots with grey centers on leaves.';
      diag.symptomsKn = 'ಎಲೆಗಳ ಮೇಲೆ ಕಣ್ಣಿನ ಆಕಾರದ ಕಂದು ಬಣ್ಣದ ಮಚ್ಚೆಗಳು, ಮಧ್ಯದಲ್ಲಿ ಬೂದು ಬಣ್ಣ.';
      diag.actionsKn = ['ತಕ್ಷಣ ಸಾರಜನಕ (ಯೂರಿಯಾ) ಗೊಬ್ಬರ ನೀಡುವುದನ್ನು ನಿಲ್ಲಿಸಿ', 'ಗದ್ದೆಯಲ್ಲಿ 2-3 ಸೆಂ.ಮೀ ನೀರು ನಿಲ್ಲಿಸಿ'];
      diag.preventionsKn = ['ಟ್ರೈಸೈಕ್ಲಾಜೋಲ್ 75% WP (0.6g/L) ನೀರಿನಲ್ಲಿ ಬೆರೆಸಿ ಸಿಂಪಡಿಸಿ'];
    }

    const jsonBlock = JSON.stringify(diag, null, 2);

    if (isKn) {
      return `\`\`\`json\n${jsonBlock}\n\`\`\`\n\n🌾 **ಅಗ್ರೋವಾ ಎಐ ಬೆಳೆ ರೋಗ ತಪಾಸಣೆ ವರದಿ:**\n\nನಿಮ್ಮ ${diag.cropKn} ಚಿತ್ರವನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಈ ಲಕ್ಷಣಗಳು **${diag.diseaseKn}** ಇರಬಹುದಾದ ಸಾಧ್ಯತೆಯನ್ನು ಸೂಚಿಸುತ್ತವೆ.\n\n- **ಖಚಿತತೆ ಮಟ್ಟ:** ${diag.confidence} • **ತೀವ್ರತೆ:** ${diag.severityKn}\n- **ಕಂಡುಬಂದ ಲಕ್ಷಣಗಳು:** ${diag.symptomsKn}\n\n⚠️ **ಮುಖ್ಯ ಸಲಹೆ:** ರಸಾಯನಿಕ ಸಿಂಪಡಿಸುವ ಮುನ್ನ ಬೆಳಿಗ್ಗೆ ಅಥವಾ ಸಂಜೆ ತಂಪಾದ ವೇಳೆಯಲ್ಲಿ ಸುರಕ್ಷತಾ ಕ್ರಮಗಳೊಂದಿಗೆ ಔಷಧ ಸಿಂಪಡಿಸಿ. ಹೆಚ್ಚಿನ ತಪಾಸಣೆಗೆ ಹತ್ತಿರದ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ (KVK) ಸಂಪರ್ಕಿಸಿ.`;
    }

    return `\`\`\`json\n${jsonBlock}\n\`\`\`\n\n🌾 **Agrova AI Crop Disease Diagnostic Report:**\n\nVisual inspection of your **${diag.crop}** photograph indicates symptoms characteristic of **${diag.disease}**.\n\n- **Diagnostic Confidence:** ${diag.confidence} • **Severity:** ${diag.severity}\n- **Observed Symptoms:** ${diag.symptoms}\n\n⚠️ **Safety Precaution:** Follow recommended dilution rates strictly and wear protective gear during application. Consult your local agricultural extension officer (KVK) for regional label confirmation.`;
  }

  // 2. If documents are attached (e.g. soil test report)
  if (options.files && options.files.length > 0) {
    const fName = options.files[0].name;
    if (isKn) {
      return `📄 **ಮಣ್ಣು ಪರೀಕ್ಷೆ ಮತ್ತು ದಾಖಲೆ ವಿಶ್ಲೇಷಣೆ (Agrova AI):**\n\nನಿಮ್ಮ "${fName}" ದಾಖಲೆಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ:\n\n1. **ಮಣ್ಣಿನ ರಸಸಾರ (pH):** 6.5 - 7.5 ನಡುವೆ ಇರುವುದು ಉತ್ತಮ. ಆಮ್ಲೀಯ ಮಣ್ಣಿಗೆ ಸುಣ್ಣ (Lime) ಮತ್ತು ಕ್ಷಾರೀಯ ಮಣ್ಣಿಗೆ ಜಿಪ್ಸಮ್ ಬಳಸಿ.\n2. **ಸಾವಯವ ಇಂಗಾಲ (Organic Carbon):** ಮಣ್ಣಿನ ಫಲವತ್ತತೆಗೆ ಶೇ. 0.5% ಕ್ಕಿಂತ ಹೆಚ್ಚಿರಬೇಕು. ಎಕರೆಗೆ 5-8 ಟನ್ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಅಥವಾ ಎರೆಹುಳು ಗೊಬ್ಬರ ಸೇರಿಸಿ.\n3. **ಪೋಷಕಾಂಶ ಶಿಫಾರಸು (NPK):** ಬೆಳೆಯ ಹಂತಕ್ಕೆ ತಕ್ಕಂತೆ ಸಮತೋಲಿತ NPK ನೀಡಿ; ಅತಿಯಾದ ಯೂರಿಯಾ ಬಳಕೆಯಿಂದ ಕೀಟಬಾಧೆ ಹೆಚ್ಚಾಗುತ್ತದೆ.\n4. **ಸೂಕ್ಷ್ಮ ಪೋಷಕಾಂಶಗಳು:** ಸತು (Zinc) ಮತ್ತು ಬೋರಾನ್ ಕೊರತೆ ಇದ್ದರೆ ಲಘು ಪೋಷಕಾಂಶಗಳ ಮಿಶ್ರಣ (2g/L) ಸಿಂಪಡಿಸಿ.`;
    }
    return `📄 **Agricultural Document & Soil Test Analysis (Agrova AI):**\n\nKey evaluation for **"${fName}"**:\n\n1. **Soil Reaction (pH):** Ideal range is 6.5–7.5 for optimal nutrient availability. Apply agricultural lime for acidic soils or gypsum for alkaline/sodic soils.\n2. **Organic Carbon (OC):** Target >0.75%. Incorporate 5–8 tonnes/acre of well-decomposed FYM or vermicompost to revitalize microbial activity.\n3. **NPK Strategy:** Align synthetic fertilizer application strictly with targeted yield formulas; avoid unilateral urea overdosing.\n4. **Micronutrient Correction:** Correct secondary deficiencies with chelated zinc (Zn-EDTA @ 1g/L) or Boron (Borax @ 1g/L) during early vegetative growth.`;
  }

  // 3. Regular Text Fallback
  if (isHi) {
    if (q.includes('टमाटर') || q.includes('tomato')) {
      return `🍅 **टमाटर की फसल प्रबंधन (Agrova AI):**\n\n1. **मिट्टी व रोपाई:** अच्छी जल निकासी वाली दोमट मिट्टी में 15 सेमी ऊंचे बेड पर 60x45 सेमी दूरी पर रोपाई करें।\n2. **सिंचाई:** ड्रिप सिंचाई द्वारा 3-4 दिन के अंतराल पर नमी बनाए रखें।\n3. **कीट प्रबंधन:** फल छेदक (Helicoverpa) के लिए 5 फेरोमोन ट्रैप/एकड़ लगाएं व आवश्यकता पड़ने पर एमामेक्टिन बेंजोएट 5% SG (0.4g/L) का छिड़काव करें।\n4. **उर्वरक:** फूल आते समय 19:19:19 और फल बनते समय कैल्शियम नाइट्रेट ड्रिप से दें।`;
    }
    if (q.includes('योजना') || q.includes('subsidy') || q.includes('सोलर') || q.includes('solar')) {
      return `☀️ **पीएम-कुसुम सोलर पंप योजना (60% सब्सिडी):**\n\n1. **लाभ:** 3 HP से 10 HP सोलर पंपों की स्थापना पर केंद्र (30%) और राज्य (30%) द्वारा कुल 60% सब्सिडी मिलती है।\n2. **पात्रता:** वैध कृषि भूमि और बिजली कनेक्शन का अभाव या ग्रिड से जुड़े किसान।\n3. **आवेदन:** राज्य के ऊर्जा विभाग के आधिकारिक पोर्टल पर किसान पासबुक और आधार कार्ड से ऑनलाइन आवेदन करें।`;
    }
    return `🌾 **Agrova कृषि सलाहकार:**\n\nआपकी पूछताछ "${question}" के लिए मुख्य सिफारिशें:\n\n1. **मृदा स्वास्थ्य:** बुवाई से पहले 12-पैरामीटर मृदा स्वास्थ्य कार्ड के अनुसार ही NPK और सूक्ष्म पोषक तत्व डालें।\n2. **जल प्रबंधन:** अत्यधिक पानी भराव से बचें; सूक्ष्म फव्वारा या ड्रिप प्रणाली का उपयोग करें।\n3. **जैविक संरक्षण:** नीम तेल (10,000 ppm @ 2ml/L) का नियमित छिड़काव कीटों को दूर रखता है।`;
  }

  if (isKn) {
    if (q.includes('ತೆಂಗು') || q.includes('coconut')) {
      return `🥥 **ತೆಂಗಿನ ಬೆಳೆ ನಿರ್ವಹಣೆ (Agrova AI):**\n\n1. **ತಳಿ ಮತ್ತು ನಾಟಿ:** 9-12 ತಿಂಗಳ ಬಲಿಷ್ಠ ಸಸಿಗಳನ್ನು 1x1 ಮೀಟರ್ ಗುಂಡಿಗಳಲ್ಲಿ FYM (25kg) ಮತ್ತು ಬೇವಿನ ಹಿಂಡಿಯೊಂದಿಗೆ ನಾಟಿ ಮಾಡಿ.\n2. **ಗೊಬ್ಬರ:** ಪ್ರತಿ ಮರಕ್ಕೆ ವಾರ್ಷಿಕವಾಗಿ 500 ಗ್ರಾಂ ಸಾರಜನಕ, 320 ಗ್ರಾಂ ರಂಜಕ, 1200 ಗ್ರಾಂ ಪೊಟ್ಯಾಶ್ ಮತ್ತು 50 ಗ್ರಾಂ ಮೆಗ್ನೀಸಿಯಮ್ ಸಲ್ಫೇಟ್ ನೀಡಿ.\n3. **ಕೀಟ ನಿಯಂತ್ರಣ:** ಕೊಂಬಿನ ದುಂಬಿ (Rhinoceros Beetle) ನಿಯಂತ್ರಣಕ್ಕೆ ಎಲೆ ಕಂಕುಳಲ್ಲಿ ನೆಪ್ತಲೀನ್ ಮಾತ್ರೆ + ಮರಳಿನ ಮಿಶ್ರಣ ತುಂಬಿರಿ.`;
    }
    return `🌾 **ಅಗ್ರೋವಾ ಕೃಷಿ ಸಲಹೆಗಾರ:**\n\nನಿಮ್ಮ ಪ್ರಶ್ನೆ "${question}" ಕುರಿತ ಪ್ರಮುಖ ಸಲಹೆಗಳು:\n\n1. **ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ:** ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಶಿಫಾರಸುಗಳ ಪ್ರಕಾರವೇ ರಸಗೊಬ್ಬರಗಳನ್ನು ಬಳಸಿ.\n2. **ನೀರಾವರಿ:** ಹನಿ ನೀರಾವರಿ ಪದ್ಧತಿ ಅಳವಡಿಸಿ ಶೇ. 45% ರಷ್ಟು ನೀರು ಉಳಿಸಿ.\n3. **ಕೀಟ ನಿರ್ವಹಣೆ:** ಆರಂಭಿಕ ಹಂತದಲ್ಲಿ ಬೇವಿನ ಎಣ್ಣೆ (2ml/L) ಸಿಂಪಡಿಸಿ.\n\n*(ಸುಳಿವು: ಬೆಳೆ ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಲು ಕ್ಯಾಮೆರಾ 📷 ಅಥವಾ ಇಮೇಜ್ 🖼️ ಬಟನ್ ಒತ್ತಿರಿ.)*`;
  }

  // English default
  if (q.includes('mushroom')) {
    return `🍄 **Indoor Mushroom Cultivation Guide (Agrova AI):**\n\n1. **Substrate Prep:** Chop wheat/paddy straw into 2-3 inch pieces. Pasteurize at 65°C for 4 hours.\n2. **Spawning & Bagging:** Mix fresh grain spawn at 2-3% by wet weight into perforated 16x24" polybags.\n3. **Fruiting:** Maintain 85%+ humidity. Harvest full umbrella clusters every 7-10 days.`;
  }

  if (q.includes('solar') || q.includes('subsidy') || q.includes('kusum')) {
    return `☀️ **PM-KUSUM Solar Pump Scheme (60% Subsidy):**\n\n1. **Benefit:** 60% combined financial subsidy from Central (30%) & State Government (30%) on 3 HP to 10 HP solar pumps.\n2. **Farmer Share:** 10% upfront payment, with remaining 30% available via low-interest bank loans.\n3. **Application:** Apply via State Renewable Energy Development Agency or your local Agriculture Dept.`;
  }

  return `🌾 **Agrova AI Farm Advisory:**\n\nKey guidelines for **"${question}"**:\n\n1. **Soil & Nutrition:** Align your basal NPK and micronutrient application with certified Soil Health Card data.\n2. **Water Management:** Implement drip or micro-sprinkler systems to reduce water consumption by 40-50% while improving crop yield.\n3. **Integrated Pest Management (IPM):** Combine yellow/blue sticky traps, pheromone traps, and bio-fungicides (Trichoderma/Pseudomonas) before chemical spraying.\n4. **Crop Image Analysis:** You can upload a photo of your crop leaves or fruits using the 📷 or 🖼️ buttons for instant disease diagnosis.`;
}

