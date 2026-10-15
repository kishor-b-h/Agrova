// ===================================================================
// AGROVA - Modern Multimodal Chatbot View
// ChatGPT-Style Composer, Photo Upload, Camera, Voice & Disease Cards
// ===================================================================

import {
  multimodalState,
  renderDiseaseDiagnosisCard
} from './chat-multimodal.js';

export const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));

/**
 * Clean raw JSON fences from bot response text so only clean markdown is displayed
 */
export function cleanBotText(rawText = '') {
  if (!rawText) return '';
  return rawText.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
}

/**
 * Format markdown response for crisp display (bold, lists, headings)
 */
export function formatBotText(rawText = '') {
  const text = cleanBotText(rawText);
  if (!text) return '';
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gim, '<h4 class="chat-md-h4">$1</h4>')
    .replace(/^## (.*$)/gim, '<h4 class="chat-md-h4">$1</h4>')
    .replace(/^\s*[-*]\s+(.*$)/gim, '<div class="chat-md-li"><span class="chat-bullet">•</span><span>$1</span></div>')
    .replace(/^\s*(\d+)\.\s+(.*$)/gim, '<div class="chat-md-li"><span class="chat-num">$1.</span><span>$2</span></div>')
    .replace(/\n\n/g, '<div class="chat-paragraph-gap"></div>')
    .replace(/\n/g, '<br>');
}

const localizedPrompts = {
  en: {
    title: 'Ask Agrova',
    subtitle: 'AI Farm Agronomist & Vision Diagnostics',
    online: 'Online & Ready',
    clearChat: 'Clear Chat',
    welcomeBadge: '🌾 Agrova Farm Multimodal Intelligence',
    welcomeHeading: 'How can I assist your farm today?',
    welcomeSub: 'Ask anything, upload crop photos for disease diagnosis 📷, attach soil test reports 📎, or speak directly in Kannada/English 🎤.',
    typePlaceholder: 'Ask a question or upload crop photo (e.g. What disease is on this tomato leaf?)...',
    send: 'Send',
    hint: 'Press Enter to send · 📎 Attach files · 📷 Take crop photo · 🎤 Speak in Kannada or English',
    thinking: 'Agrova AI is formulating crop advisory...',
    analyzingImage: 'Agrova AI Vision is analyzing crop symptoms...',
    voiceQuestion: 'Voice Message',
    listen: 'Listen',
    stop: 'Stop',
    starters: [
      {
        title: 'Crop Disease Diagnosis',
        desc: 'Upload crop photos to detect blight, curl, rot or rust',
        icon: 'camera',
        color: 'green',
        query: 'What are the early visual symptoms of tomato blight and how can I treat it?'
      },
      {
        title: 'Irrigation & Moisture',
        desc: 'Optimal watering schedule for paddy tillering',
        icon: 'tint',
        color: 'blue',
        query: 'What is the optimal irrigation schedule for paddy during the active tillering stage?'
      },
      {
        title: 'Nutrient & Soil Health',
        desc: 'Dosage of urea, DAP & soil card analysis',
        icon: 'seedling',
        color: 'orange',
        query: 'How to interpret soil test report pH and organic carbon for fertilizer dosage?'
      },
      {
        title: 'Government Subsidies',
        desc: 'PM-KUSUM 60% solar pump & PMFBY',
        icon: 'landmark',
        color: 'purple',
        query: 'How can I apply for the PM-KUSUM 60% solar water pump subsidy in Karnataka?'
      }
    ],
    quickPills: [
      { label: '📷 Diagnose Crop Photo', q: 'How does Agrova AI detect crop diseases from photos?' },
      { label: '🍅 Tomato Leaf Curl', q: 'How to control yellow leaf curl and whitefly on tomato plants?' },
      { label: '💧 Irrigation Guide', q: 'When should I irrigate my crops during tillering?' },
      { label: '🌾 Fertilizer Top-Dressing', q: 'What is the best fertilizer dose for paddy?' },
      { label: '🐛 Organic Pest Spray', q: 'How to prepare neem oil spray for pest control?' },
      { label: '☀️ Solar Pump Subsidy', q: 'How to get 60% PM-KUSUM solar subsidy in Karnataka?' }
    ]
  },
  kn: {
    title: 'ಅಗ್ರೋವಾ ಕೃಷಿ ಸಲಹೆಗಾರ',
    subtitle: 'ಎಐ ಬೆಳೆ ರೋಗ ತಪಾಸಣೆ ಮತ್ತು ಮಾರ್ಗದರ್ಶನ',
    online: 'ಸಕ್ರಿಯವಾಗಿದೆ',
    clearChat: 'ಹೊಸ ಚಾಟ್',
    welcomeBadge: '🌾 ಅಗ್ರೋವಾ ರೈತರ ಮಲ್ಟಿಮೋಡಲ್ ನೆರವು',
    welcomeHeading: 'ಇಂದು ನಿಮ್ಮ ಕೃಷಿಗೆ ನಾನು ಹೇಗೆ ನೆರವಾಗಬಹುದು?',
    welcomeSub: 'ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ, ಬೆಳೆ ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ ರೋಗ ಪತ್ತೆಹಚ್ಚಿ 📷, ಮಣ್ಣು ಪರೀಕ್ಷೆ ವರದಿ ಲಗತ್ತಿಸಿ 📎, ಅಥವಾ ಕನ್ನಡದಲ್ಲೇ ಮಾತನಾಡಿ 🎤.',
    typePlaceholder: 'ಬೆಳೆ ಪ್ರಶ್ನೆ ಕೇಳಿ ಅಥವಾ ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ (ಉದಾ. ಈ ಟೊಮೇಟೊ ಎಲೆಗೆ ಏನಾಗಿದೆ?)...',
    send: 'ಕಳುಹಿಸಿ',
    hint: 'ಕಳುಹಿಸಲು Enter ಒತ್ತಿರಿ · 📎 ದಾಖಲೆ · 📷 ಫೋಟೋ · 🎤 ಕನ್ನಡ ಧ್ವನಿ',
    thinking: 'ಅಗ್ರೋವಾ ಎಐ ಉತ್ತರ ಸಿದ್ಧಪಡಿಸುತ್ತಿದೆ...',
    analyzingImage: 'ಅಗ್ರೋವಾ ಎಐ ಬೆಳೆ ಫೋಟೋ ರೋಗ ತಪಾಸಣೆ ಮಾಡುತ್ತಿದೆ...',
    voiceQuestion: 'ಧ್ವನಿ ಸಂದೇಶ',
    listen: 'ಧ್ವನಿ ಕೇಳಿ',
    stop: 'ನಿಲ್ಲಿಸಿ',
    starters: [
      {
        title: 'ಬೆಳೆ ರೋಗ ತಪಾಸಣೆ',
        desc: 'ಎಲೆಗಳ ಫೋಟೋ ಹಾಕಿ ರೋಗ ಮತ್ತು ಮದ್ದು ತಿಳಿಯಿರಿ',
        icon: 'camera',
        color: 'green',
        query: 'ಟೊಮೆಟೊ ಎಲೆ ಸುರುಟು ರೋಗಕ್ಕೆ ಲಕ್ಷಣಗಳು ಮತ್ತು ನಿಯಂತ್ರಣ ಕ್ರಮಗಳು ಯಾವುವು?'
      },
      {
        title: 'ನೀರಾವರಿ ನಿರ್ವಹಣೆ',
        desc: 'ಭತ್ತದ ಕವಲೊಡೆಯುವ ಹಂತದ ನೀರಾವರಿ',
        icon: 'tint',
        color: 'blue',
        query: 'ಭತ್ತದ ಕವಲೊಡೆಯುವ ಹಂತದಲ್ಲಿ ನೀರಾವರಿ ನಿರ್ವಹಣೆ ಹೇಗೆ ಮಾಡಬೇಕು?'
      },
      {
        title: 'ಗೊಬ್ಬರ ಮತ್ತು ಪೋಷಕಾಂಶ',
        desc: 'ಯೂರಿಯಾ ಮತ್ತು ಡಿಎಪಿ ಸರಿಯಾದ ಪ್ರಮಾಣ',
        icon: 'seedling',
        color: 'orange',
        query: 'ಭತ್ತದ ಬೆಳೆಗೆ ಶಿಫಾರಸು ಮಾಡಲಾದ ರಸಗೊಬ್ಬರ ಪ್ರಮಾಣ ಎಷ್ಟು?'
      },
      {
        title: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು',
        desc: 'ಪಿಎಂ-ಕುಸುಮ್ 60% ಸೋಲಾರ್ ಪಂಪ್ ಸಬ್ಸಿಡಿ',
        icon: 'landmark',
        color: 'purple',
        query: 'ಪಿಎಂ-ಕುಸುಮ್ 60% ಸೌರ ಕೃಷಿ ಪಂಪ್ ಸಬ್ಸಿಡಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು ಹೇಗೆ?'
      }
    ],
    quickPills: [
      { label: '📷 ಬೆಳೆ ರೋಗ ಪತ್ತೆ', q: 'ಬೆಳೆ ಫೋಟೋ ಮೂಲಕ ರೋಗ ಪತ್ತೆಹಚ್ಚುವುದು ಹೇಗೆ?' },
      { label: '🍅 ಟೊಮೆಟೊ ಎಲೆ ಸುರುಟು', q: 'ಟೊಮೆಟೊ ಎಲೆ ಸುರುಟು ರೋಗಕ್ಕೆ ಮದ್ದು ಏನು?' },
      { label: '💧 ನೀರಾವರಿ ಸಲಹೆ', q: 'ಭತ್ತಕ್ಕೆ ಯಾವಾಗ ನೀರುಣಿಸಬೇಕು?' },
      { label: '🌾 ಗೊಬ್ಬರದ ಪ್ರಮಾಣ', q: 'ಭತ್ತದ ಬೆಳೆಗೆ ರಸಗೊಬ್ಬರ ಪ್ರಮಾಣ ಎಷ್ಟು?' },
      { label: '🐛 ಬೇವಿನ ಎಣ್ಣೆ ಸಿಂಪಡಣೆ', q: 'ಬೇವಿನ ಎಣ್ಣೆ ಕೀಟನಾಶಕ ಬಳಕೆ ಹೇಗೆ?' },
      { label: '☀️ ಸೋಲಾರ್ ಪಂಪ್ ಸಬ್ಸಿಡಿ', q: 'ಪಿಎಂ-ಕುಸುಮ್ ಸೋಲಾರ್ ಪಂಪ್ ಸಬ್ಸಿಡಿ ಪಡೆಯುವುದು ಹೇಗೆ?' }
    ]
  },
  hi: {
    title: 'अग्रोवा कृषि सलाहकार',
    subtitle: 'एआई फसल रोग विशेषज्ञ एवं परामर्शदाता',
    online: 'सक्रिय एवं तैयार',
    clearChat: 'नई बातचीत',
    welcomeBadge: '🌾 अग्रोवा किसान मल्टीमॉडल सहायक',
    welcomeHeading: 'आज मैं आपकी खेती में क्या मदद कर सकता हूँ?',
    welcomeSub: 'फसल की फोटो अपलोड करके रोग पहचानें 📷, मिट्टी जांच रिपोर्ट जोड़ें 📎, या बोलकर प्रश्न पूछें 🎤।',
    typePlaceholder: 'कृषि प्रश्न लिखें या फसल की फोटो लगाएं (उदा. टमाटर के पत्ते में क्या रोग है?)...',
    send: 'भेजें',
    hint: 'Enter दबाकर भेजें · 📎 फाइल · 📷 कैमरा · 🎤 बोलकर पूछें',
    thinking: 'अग्रोवा एआई आपकी सलाह तैयार कर रहा है...',
    analyzingImage: 'अग्रोवा एआई फसल फोटो की जांच कर रहा है...',
    voiceQuestion: 'आवाज़ संदेश',
    listen: 'सुनें',
    stop: 'रोकें',
    starters: [
      {
        title: 'फसल रोग जांच',
        desc: 'पत्तियों की फोटो से रोग व उपचार जानें',
        icon: 'camera',
        color: 'green',
        query: 'टमाटर के झुलसा रोग के लक्षण और उसका उपचार क्या है?'
      },
      {
        title: 'सिंचाई एवं जल प्रबंधन',
        desc: 'धान में कल्ले फूटते समय सिंचाई का नियम',
        icon: 'tint',
        color: 'blue',
        query: 'धान में कल्ले फूटते समय सिंचाई और जल प्रबंधन कैसे करें?'
      },
      {
        title: 'उर्वरक एवं खाद',
        desc: 'यूरिया, डीएपी और पोटाश की सही मात्रा',
        icon: 'seedling',
        color: 'orange',
        query: 'धान की फसल के लिए अनुशंसित उर्वरक और यूरिया की मात्रा क्या है?'
      },
      {
        title: 'सरकारी योजनाएं व सब्सिडी',
        desc: 'पीएम-कुसुम सोलर पंप 60% सब्सिडी',
        icon: 'landmark',
        color: 'purple',
        query: 'पीएम-कुसुम 60% सोलर पंप सब्सिडी योजना के लिए आवेदन कैसे करें?'
      }
    ],
    quickPills: [
      { label: '📷 फसल रोग पहचानें', q: 'फसल की फोटो से रोग कैसे पहचानें?' },
      { label: '🍅 टमाटर लीफ कर्ल', q: 'टमाटर के पौधों में लीफ कर्ल वायरस कैसे रोकें?' },
      { label: '💧 सिंचाई सलाह', q: 'धान में कल्ले फूटते समय सिंचाई कब करें?' },
      { label: '🌾 यूरिया खुराक', q: 'धान की फसल में यूरिया की सही मात्रा क्या है?' },
      { label: '🐛 जैविक कीट नियंत्रण', q: 'नीम के तेल से जैविक कीटनाशक कैसे बनाएं?' },
      { label: '☀️ सोलर पंप सब्सिडी', q: 'पीएम-कुसुम सोलर योजना का लाभ कैसे लें?' }
    ]
  }
};

/**
 * Render Modern Multimodal Chatbot Page View
 */
export function renderClassicChat(state, t) {
  const lang = state.lang || 'en';
  const isKn = lang === 'kn';
  const langCopy = localizedPrompts[lang] || localizedPrompts.en;
  const hasMessages = state.chatMessages && state.chatMessages.length > 0;
  const userInitial = (state.user?.name || 'Farmer').charAt(0).toUpperCase();

  const hasAttachments = multimodalState.attachedImages.length > 0 || multimodalState.attachedFiles.length > 0;

  return `
    <div class="modern-chat-wrapper">
      <!-- Chat Header -->
      <header class="modern-chat-header">
        <div class="bot-profile">
          <div class="bot-avatar-circle">🌾</div>
          <div class="bot-meta">
            <h2>
              ${langCopy.title}
              <span class="badge-vision"><i class="fas fa-eye"></i> Vision AI</span>
            </h2>
            <div class="bot-status">
              <span class="status-indicator"></span>
              <span>${langCopy.subtitle} • ${langCopy.online}</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button type="button" class="chat-reset-btn" id="chatNew" title="${langCopy.clearChat}">
            <i class="fas fa-trash-alt"></i>
            <span>${langCopy.clearChat}</span>
          </button>
        </div>
      </header>

      <!-- Messages Scroll Area -->
      <div class="modern-chat-scroll" id="chatMessages">
        ${!hasMessages ? `
          <div class="chat-welcome-banner">
            <div class="welcome-badge">
              <i class="fas fa-seedling"></i>
              <span>${langCopy.welcomeBadge}</span>
            </div>
            <h1>${langCopy.welcomeHeading}</h1>
            <p>${langCopy.welcomeSub}</p>

            <div class="chat-starters-grid">
              ${langCopy.starters.map(s => `
                <div class="chat-starter-card chat-suggestion" data-q="${escapeHtml(s.query)}">
                  <div class="icon-box ${s.color}">
                    <i class="fas fa-${s.icon}"></i>
                  </div>
                  <div class="text-box">
                    <strong>${escapeHtml(s.title)}</strong>
                    <span>${escapeHtml(s.desc)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          ${state.chatMessages.map(msg => `
            <div class="modern-chat-msg ${msg.type}">
              <div class="msg-avatar">
                ${msg.type === 'bot' ? '🌾' : userInitial}
              </div>
              <div class="msg-bubble-box">
                <div class="msg-bubble">
                  ${msg.type === 'user' ? `
                    <!-- User Image Attachments -->
                    ${msg.images && msg.images.length > 0 ? `
                      <div class="user-attached-images-grid">
                        ${msg.images.map(img => `
                          <div class="user-img-thumb">
                            <img src="${img.dataUrl}" alt="${escapeHtml(img.name)}" />
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}

                    <!-- User File Attachments -->
                    ${msg.files && msg.files.length > 0 ? `
                      <div class="user-attached-files-list">
                        ${msg.files.map(f => `
                          <div class="user-file-chip">
                            <i class="fas fa-file-pdf"></i>
                            <span>${escapeHtml(f.name)}</span>
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}

                    <!-- Voice Query Indicator -->
                    ${msg.isVoice ? `
                      <div class="user-voice-tag">
                        <i class="fas fa-microphone"></i>
                        <span>${langCopy.voiceQuestion}</span>
                      </div>
                    ` : ''}

                    ${msg.text ? `<div>${escapeHtml(msg.text).replace(/\n/g, '<br>')}</div>` : ''}
                  ` : `
                    <!-- Bot Response: Crop Disease Diagnosis Card (if vision detected) -->
                    ${msg.diagnosis ? renderDiseaseDiagnosisCard(msg.diagnosis, lang, msg.diagnosisImage) : ''}

                    <!-- Bot Text Explanation -->
                    <div class="bot-text-content">
                      ${formatBotText(msg.text)}
                    </div>

                    <!-- TTS Audio Action Button -->
                    <div class="bot-msg-actions">
                      <button 
                        type="button" 
                        class="btn-tts-speak ${multimodalState.currentlyPlayingAudioId === msg.id ? 'speaking' : ''}" 
                        data-msg-id="${msg.id}" 
                        data-speak-text="${escapeHtml(cleanBotText(msg.text))}"
                        title="${isKn ? 'ಧ್ವನಿ ಮೂಲಕ ಆಲಿಸಿ' : 'Listen aloud'}"
                      >
                        <i class="fas ${multimodalState.currentlyPlayingAudioId === msg.id ? 'fa-stop-circle' : 'fa-volume-up'}"></i>
                        <span>${multimodalState.currentlyPlayingAudioId === msg.id ? langCopy.stop : langCopy.listen}</span>
                        ${multimodalState.currentlyPlayingAudioId === msg.id ? `
                          <span class="audio-wave-anim">
                            <span></span><span></span><span></span>
                          </span>
                        ` : ''}
                      </button>
                    </div>
                  `}
                </div>
                <div class="msg-time">
                  ${escapeHtml(msg.time || '')} ${msg.type === 'bot' ? '• Agrova AI' : ''}
                </div>
              </div>
            </div>
          `).join('')}
        `}

        ${state.chatPending ? `
          <div class="modern-chat-msg bot">
            <div class="msg-avatar">🌾</div>
            <div class="msg-bubble-box">
              <div class="modern-typing-bubble">
                <span>${state.chatPendingVision ? langCopy.analyzingImage : langCopy.thinking}</span>
                <span class="modern-dots">
                  <span></span><span></span><span></span>
                </span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Quick Suggestion Pills -->
      <div class="modern-suggestions-bar">
        ${langCopy.quickPills.map(p => `
          <button type="button" class="modern-sugg-pill chat-suggestion" data-q="${escapeHtml(p.q)}">
            ${escapeHtml(p.label)}
          </button>
        `).join('')}
      </div>

      <!-- Multimodal Composer Footer -->
      <footer class="modern-chat-composer">
        <form id="chatForm">
          <!-- 1. Attachment Previews Strip -->
          <div id="attachmentPreviewStrip" class="attachment-previews-strip" style="${hasAttachments ? 'display:flex;' : 'display:none;'}">
            ${multimodalState.attachedImages.map(img => `
              <div class="preview-item image-preview" data-id="${img.id}">
                <img src="${img.dataUrl}" alt="Crop Preview" />
                <button type="button" class="btn-remove-attachment btn-remove-image" data-id="${img.id}" title="Remove image">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            `).join('')}
            ${multimodalState.attachedFiles.map(f => `
              <div class="preview-item file-preview" data-id="${f.id}">
                <i class="fas fa-file-pdf"></i>
                <span class="file-name">${escapeHtml(f.name)}</span>
                <button type="button" class="btn-remove-attachment btn-remove-file" data-id="${f.id}" title="Remove file">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            `).join('')}
          </div>

          <!-- 2. Voice Recording Active Overlay -->
          <div id="voiceRecordingBar" class="voice-recording-banner" style="${multimodalState.isRecordingVoice ? 'display:flex;' : 'display:none;'}">
            <div class="voice-pulse-indicator">
              <span class="pulse-ring"></span>
              <i class="fas fa-microphone"></i>
            </div>
            <div class="voice-status-text">
              <span class="recording-label">${isKn ? 'ಧ್ವನಿ ಮುದ್ರಿಸಲಾಗುತ್ತಿದೆ... ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ' : 'Recording voice in Kannada / English...'}</span>
              <span class="recording-timer" id="voiceRecordingTimer">00:00</span>
            </div>
            <div class="voice-actions">
              <button type="button" class="btn-voice-cancel" id="btnVoiceCancel" title="Cancel recording">
                <i class="fas fa-times"></i> <span>${isKn ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}</span>
              </button>
              <button type="button" class="btn-voice-done" id="btnVoiceDone" title="Stop and transcribe">
                <i class="fas fa-check"></i> <span>${isKn ? 'ಮುಗಿಸಿ' : 'Done'}</span>
              </button>
            </div>
          </div>

          <!-- 3. ChatGPT-Style Composer Box -->
          <div class="modern-composer-box">
            <!-- Hidden native file inputs -->
            <input type="file" id="chatFileInput" accept=".pdf,.doc,.docx,.txt,.csv" style="display:none;" />
            <input type="file" id="chatImageInput" accept="image/png,image/jpeg,image/webp,image/jpg" multiple style="display:none;" />
            <input type="file" id="chatCameraInput" accept="image/*" capture="environment" style="display:none;" />

            <!-- Left Actions: Attach, Image, Camera -->
            <div class="composer-btn-cluster">
              <button type="button" class="composer-icon-btn" id="chatFileBtn" title="${isKn ? 'ದಾಖಲೆ / ಮಣ್ಣು ವರದಿ ಲಗತ್ತಿಸಿ' : 'Attach File / Soil Report (PDF, DOC)'}">
                <i class="fas fa-paperclip"></i>
              </button>
              <button type="button" class="composer-icon-btn" id="chatImageBtn" title="${isKn ? 'ಬೆಳೆ ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ' : 'Upload Crop Photo'}">
                <i class="fas fa-image"></i>
              </button>
              <button type="button" class="composer-icon-btn" id="chatCameraBtn" title="${isKn ? 'ಕ್ಯಾಮರಾದಿಂದ ಫೋಟೋ ತೆಗೆಯಿರಿ' : 'Capture Photo with Camera'}">
                <i class="fas fa-camera"></i>
              </button>
            </div>

            <!-- Text Input -->
            <input 
              type="text" 
              id="chatInput" 
              class="modern-composer-input" 
              placeholder="${escapeHtml(langCopy.typePlaceholder)}" 
              value="${escapeHtml(state.chatDraft || '')}" 
              autocomplete="off" 
              ${state.chatPending ? 'disabled' : ''}
            />

            <!-- Right Actions: Mic & Send -->
            <div class="composer-btn-cluster-right">
              <button 
                type="button" 
                class="composer-icon-btn btn-mic ${multimodalState.isRecordingVoice ? 'recording' : ''}" 
                id="chatMicBtn" 
                title="${isKn ? 'ಧ್ವನಿ ಮೂಲಕ ಮಾತನಾಡಿ (ಕನ್ನಡ/ಇಂಗ್ಲಿಷ್)' : 'Voice Input (Kannada or English)'}"
              >
                <i class="fas fa-microphone"></i>
              </button>
              <button 
                type="submit" 
                id="chatSend" 
                class="modern-composer-send-btn" 
                title="${langCopy.send}" 
                ${state.chatPending ? 'disabled' : ''}
              >
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>

          <div class="modern-composer-hint">
            ${langCopy.hint}
          </div>
        </form>
      </footer>
    </div>
  `;
}
