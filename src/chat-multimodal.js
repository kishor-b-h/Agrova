// ===================================================================
// AGROVA - Multimodal AI Farm Assistant Engine
// Image Vision, Crop Disease Diagnosis, Voice STT/TTS & File Parsing
// ===================================================================

/**
 * Supported MIME types and max size limits
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_DOC_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
export const MAX_IMAGES_PER_MESSAGE = 4;

/**
 * Multimodal input state
 */
export const multimodalState = {
  attachedImages: [], // [{ id, file, name, dataUrl, base64, mimeType, size }]
  attachedFiles: [],  // [{ id, file, name, dataUrl, base64, mimeType, textContent, size }]
  isRecordingVoice: false,
  voiceDurationSec: 0,
  voiceTimerInterval: null,
  speechRecognitionInstance: null,
  currentlyPlayingAudioId: null,
  lastDiagnosisContext: null, // Keeps track of crop & disease for follow-up questions
  activeCameraStream: null
};

/**
 * Read File as Data URL and Base64
 */
export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      resolve({ dataUrl, base64 });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Read text content from readable text/csv files
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}

/**
 * Validate and attach images
 */
export async function addImageFiles(files, onError) {
  if (!files || files.length === 0) return [];
  const added = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (multimodalState.attachedImages.length >= MAX_IMAGES_PER_MESSAGE) {
      if (onError) onError(`Maximum ${MAX_IMAGES_PER_MESSAGE} images allowed per message.`);
      break;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      if (onError) onError(`Unsupported image format: "${file.name}". Please use JPG, PNG, or WebP.`);
      continue;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      if (onError) onError(`"${file.name}" exceeds the 15MB size limit.`);
      continue;
    }

    try {
      const { dataUrl, base64 } = await readFileAsBase64(file);
      const imageObj = {
        id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        file,
        name: file.name,
        dataUrl,
        base64,
        mimeType: file.type || 'image/jpeg',
        size: file.size
      };
      multimodalState.attachedImages.push(imageObj);
      added.push(imageObj);
    } catch (err) {
      if (onError) onError(`Failed to read "${file.name}".`);
    }
  }

  return added;
}

/**
 * Validate and attach document files
 */
export async function addDocFiles(files, onError) {
  if (!files || files.length === 0) return [];
  const added = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (file.size > MAX_DOC_SIZE_BYTES) {
      if (onError) onError(`"${file.name}" exceeds 20MB document size limit.`);
      continue;
    }

    try {
      const { dataUrl, base64 } = await readFileAsBase64(file);
      let textContent = '';

      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        textContent = await readFileAsText(file);
      }

      const docObj = {
        id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        file,
        name: file.name,
        dataUrl,
        base64,
        mimeType: file.type || 'application/octet-stream',
        textContent: textContent ? textContent.substring(0, 15000) : '',
        size: file.size
      };

      multimodalState.attachedFiles.push(docObj);
      added.push(docObj);
    } catch (err) {
      if (onError) onError(`Could not process "${file.name}".`);
    }
  }

  return added;
}

/**
 * Remove an attached image
 */
export function removeAttachedImage(id) {
  multimodalState.attachedImages = multimodalState.attachedImages.filter(img => img.id !== id);
}

/**
 * Remove an attached file
 */
export function removeAttachedFile(id) {
  multimodalState.attachedFiles = multimodalState.attachedFiles.filter(f => f.id !== id);
}

/**
 * Clear all current attachments
 */
export function clearAllAttachments() {
  multimodalState.attachedImages = [];
  multimodalState.attachedFiles = [];
}

// ===================================================================
// VOICE SPEECH-TO-TEXT (STT) SYSTEM
// ===================================================================

/**
 * Check if browser supports Web Speech API
 */
export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

/**
 * Start Speech-To-Text Recognition in Kannada / English / Hindi
 */
export function startVoiceRecognition({
  lang = 'kn',
  onInterim,
  onFinal,
  onError,
  onEnd
}) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (onError) onError('Speech recognition is not supported in this browser. Please type your message.');
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Language mapping
    if (lang === 'kn') {
      recognition.lang = 'kn-IN'; // Kannada (India)
    } else if (lang === 'hi') {
      recognition.lang = 'hi-IN'; // Hindi (India)
    } else {
      recognition.lang = 'en-IN'; // Indian English
    }

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript && onFinal) {
        onFinal(finalTranscript);
      } else if (interimTranscript && onInterim) {
        onInterim(interimTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      let errorMsg = 'Speech recognition error.';
      if (event.error === 'not-allowed') {
        errorMsg = lang === 'kn'
          ? 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಮೈಕ್ ಅನುಮತಿಸಿ.'
          : 'Microphone permission denied. Please allow microphone access in your browser.';
      } else if (event.error === 'no-speech') {
        errorMsg = lang === 'kn' ? 'ಯಾವುದೇ ಧ್ವನಿ ಕೇಳಿಸಲಿಲ್ಲ. ಪುನಃ ಪ್ರಯತ್ನಿಸಿ.' : 'No speech detected. Please speak clearly.';
      }
      if (onError) onError(errorMsg);
    };

    recognition.onend = () => {
      multimodalState.isRecordingVoice = false;
      if (onEnd) onEnd();
    };

    recognition.start();
    multimodalState.isRecordingVoice = true;
    multimodalState.speechRecognitionInstance = recognition;
    return recognition;
  } catch (err) {
    if (onError) onError(err.message || 'Could not start microphone.');
    return null;
  }
}

/**
 * Stop active voice recognition
 */
export function stopVoiceRecognition() {
  if (multimodalState.speechRecognitionInstance) {
    try {
      multimodalState.speechRecognitionInstance.stop();
    } catch (e) {
      // ignore
    }
    multimodalState.speechRecognitionInstance = null;
  }
  multimodalState.isRecordingVoice = false;
}

// ===================================================================
// AI VOICE READ ALOUD (TEXT-TO-SPEECH)
// ===================================================================

/**
 * Read bot response text aloud in Kannada / English
 */
export function playVoiceResponse(text, lang = 'kn', onStart, onEnd) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech synthesis not supported');
    return false;
  }

  // If already speaking, stop first
  window.speechSynthesis.cancel();

  // Strip markdown symbols and emojis for clean speech
  const cleanText = text
    .replace(/[#*_~`>]/g, '')
    .replace(/\b(https?:\/\/[^\s]+)/g, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
    .trim();

  if (!cleanText) return false;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 0.92; // Slightly slower for clarity
  utterance.pitch = 1.0;

  // Find best matching voice
  const voices = window.speechSynthesis.getVoices();
  const targetCode = lang === 'kn' ? 'kn' : (lang === 'hi' ? 'hi' : 'en');
  const matchedVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(targetCode));

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }
  utterance.lang = lang === 'kn' ? 'kn-IN' : (lang === 'hi' ? 'hi-IN' : 'en-IN');

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    multimodalState.currentlyPlayingAudioId = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    multimodalState.currentlyPlayingAudioId = null;
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Stop active speech synthesis
 */
export function stopVoiceResponse() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  multimodalState.currentlyPlayingAudioId = null;
}

// ===================================================================
// CROP DISEASE KNOWLEDGE BASE & STRUCTURED DIAGNOSIS
// ===================================================================

/**
 * Verified Indian Crop Disease Profiles for Visual Diagnosis & Fallback Engine
 */
export const CROP_DISEASE_DB = {
  tomato_early_blight: {
    crop: 'Tomato',
    cropKn: 'ಟೊಮೆಟೊ',
    disease: 'Early Blight (Alternaria solani)',
    diseaseKn: 'ಮುಂಚಿನ ಎಲೆ ಮಚ್ಚೆ ರೋಗ (ಅಲ್ಟರ್ನೇರಿಯಾ)',
    category: 'Fungal Infection',
    categoryKn: 'ಶಿಲೀಂಧ್ರ ರೋಗ',
    symptoms: 'Concentric ring spots (bullseye pattern) on older leaves, surrounded by yellow chlorotic halos, eventual defoliation.',
    symptomsKn: 'ಹಳೆಯ ಎಲೆಗಳ ಮೇಲೆ ವೃತ್ತಾಕಾರದ ಕಂದು ಮಚ್ಚೆಗಳು (ಬುಲ್ಸ್‌ಐ ಮಾದರಿ), ಮಚ್ಚೆಯ ಸುತ್ತ ಹಳದಿ ಬಣ್ಣ, ಎಲೆಗಳು ಒಣಗಿ ಉದುರುವುದು.',
    confidence: 'High (88%)',
    severity: 'Needs Attention',
    severityKn: 'ಗಮನ ಹರಿಸಬೇಕಾಗಿದೆ',
    severityClass: 'warning',
    immediateActions: [
      'Remove and safely dispose of severely infected lower leaves away from the field.',
      'Avoid overhead sprinkler watering; keep foliage completely dry.',
      'Ensure 50-60 cm spacing between plants for adequate airflow.'
    ],
    immediateActionsKn: [
      'ತೀವ್ರವಾಗಿ ಬಾಧಿತವಾದ ಕೆಳಗಿನ ಒಣ ಎಲೆಗಳನ್ನು ಕತ್ತರಿಸಿ ಹೊಲದಿಂದ ದೂರ ಹಾಕಿ.',
      'ಎಲೆಗಳ ಮೇಲೆ ನೇರವಾಗಿ ನೀರು ಚಿಮುಕಿಸಬೇಡಿ; ಹನಿ ನೀರಾವರಿ ಬಳಸಿ.',
      'ಗಿಡಗಳ ನಡುವೆ ಗಾಳಿಯಾಡುವಂತೆ 50-60 ಸೆಂ.ಮೀ ಅಂತರ ಕಾಪಾಡಿ.'
    ],
    preventiveMeasures: [
      'Practice crop rotation avoiding Solanaceous crops (potato, brinjal, chilli) for 2 years.',
      'Apply organic bio-fungicide: Trichoderma viride @ 5g/L water during early vegetative stage.',
      'Spray Mancozeb 75% WP @ 2.5g/L or Chlorothalonil @ 2g/L at first appearance of spots.'
    ],
    preventiveMeasuresKn: [
      'ಆಲೂಗಡ್ಡೆ, ಬದನೆ ಅಥವಾ ಮೆಣಸಿನಕಾಯಿ ಹೊರತುಪಡಿಸಿ ಬೆಳೆ ಪರಿವರ್ತನೆ ಮಾಡಿ.',
      'ಟ್ರೈಕೋಡರ್ಮಾ ವಿರಿಡೆ (Trichoderma viride) 5 ಗ್ರಾಂ/ಲೀಟರ್ ಬೆರೆಸಿ ಸಿಂಪಡಿಸಿ.',
      'ರೋಗ ತೀವ್ರವಾಗಿದ್ದರೆ ಮ್ಯಾಂಕೋಜೆಬ್ 75% WP (Mancozeb) 2.5 ಗ್ರಾಂ/ಲೀಟರ್ ಸಿಂಪಡಿಸಿ.'
    ],
    expertAdvisory: 'If lesions spread to stems or green fruit collars within 48 hours, immediately visit the nearest Taluk Raitha Samparka Kendra (RSK) or KVK.',
    expertAdvisoryKn: 'ರೋಗದ ಮಚ್ಚೆಗಳು ಕಾಂಡ ಅಥವಾ ಕಾಯಿಗಳಿಗೆ ಹರಡಿದರೆ ತಕ್ಷಣ ಹತ್ತಿರದ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ ಅಥವಾ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ (KVK) ಸಂಪರ್ಕಿಸಿ.'
  },

  tomato_leaf_curl: {
    crop: 'Tomato',
    cropKn: 'ಟೊಮೆಟೊ',
    disease: 'Tomato Leaf Curl Virus (ToLCV)',
    diseaseKn: 'ಟೊಮೆಟೊ ಎಲೆ ಸುರುಟು ರೋಗ (ವೈರಸ್)',
    category: 'Viral Disease (Whitefly Transmitted)',
    categoryKn: 'ವೈರಸ್ ರೋಗ (ಬಿಳಿ ನೊಣ ಹರಡುತ್ತದೆ)',
    symptoms: 'Upward curling and puckering of leaves, stunted plant growth, vein clearing, small bushy appearance with reduced fruit setting.',
    symptomsKn: 'ಎಲೆಗಳು ಮೇಲ್ಮುಖವಾಗಿ ಸುರುಟಿಕೊಳ್ಳುವುದು, ಗಿಡದ ಬೆಳವಣಿಗೆ ಕುಂಠಿತವಾಗುವುದು, ಹಳದಿ ರೇಖೆಗಳು ಮತ್ತು ಹೂವು ಕಾಯಿ ಕಟ್ಟದಿರುವುದು.',
    confidence: 'High (92%)',
    severity: 'Severe',
    severityKn: 'ತೀವ್ರ ಗಂಭೀರ',
    severityClass: 'danger',
    immediateActions: [
      'Uproot and destroy severely stunted viral-infected plants to prevent spread to healthy plants.',
      'Install yellow sticky traps (10-12 traps per acre) to trap whitefly vectors immediately.'
    ],
    immediateActionsKn: [
      'ತೀವ್ರ ರೋಗಪೀಡಿತ ಗಿಡಗಳನ್ನು ಬೇರು ಸಮೇತ ಕಿತ್ತು ಹೊಲದಿಂದ ಹೊರಗೆ ಗುಂಡಿ ತೋಡಿ ಮುಚ್ಚಿ.',
      'ಬಿಳಿ ನೊಣಗಳನ್ನು ಆಕರ್ಷಿಸಿ ನಾಶಪಡಿಸಲು ಎಕರೆಗೆ 10-12 ಹಳದಿ ಜಿಗುಟು ಬಲೆಗಳನ್ನು ಅಳವಡಿಸಿ.'
    ],
    preventiveMeasures: [
      'Control whitefly vectors: Spray Neem oil (10,000 ppm) @ 2ml/L or Imidacloprid 17.8% SL @ 0.4ml/L.',
      'Erect nylon net border (40-50 mesh) around the nursery bed.',
      'Grow resistant hybrids like Arka Rakshak or Arka Samrat in endemic seasons.'
    ],
    preventiveMeasuresKn: [
      'ಬಿಳಿ ನೊಣ ನಿಯಂತ್ರಣಕ್ಕೆ ಬೇವಿನ ಎಣ್ಣೆ (2ml/L) ಅಥವಾ ಇಮಿಡಾಕ್ಲೋಪ್ರಿಡ್ 17.8% SL (0.4ml/L) ಸಿಂಪಡಿಸಿ.',
      'ಮುಂದಿನ ಬೆಳೆಗೆ ರೋಗ ನಿರೋಧಕ ಅರ್ಕ ರಕ್ಷಕ್ ಅಥವಾ ಅರ್ಕ ಸಾಮ್ರಾಟ್ ತಳಿಗಳನ್ನು ಆಯ್ದುಕೊಳ್ಳಿ.'
    ],
    expertAdvisory: 'Viruses cannot be cured once inside the plant; focus strictly on vector suppression and consult your agricultural extension officer.',
    expertAdvisoryKn: 'ವೈರಸ್ ರೋಗಕ್ಕೆ ನೇರ ಔಷಧವಿಲ್ಲ; ಬಿಳಿ ನೊಣಗಳನ್ನು ನಾಶಮಾಡುವುದೊಂದೇ ಏಕೈಕ ಪರಿಹಾರ.'
  },

  paddy_blast: {
    crop: 'Paddy / Rice',
    cropKn: 'ಭತ್ತ',
    disease: 'Paddy Blast (Magnaporthe oryzae)',
    diseaseKn: 'ಭತ್ತದ ಬೆಂಕಿ ರೋಗ (ಬ್ಲಾಸ್ಟ್)',
    category: 'Fungal Infection',
    categoryKn: 'ಶಿಲೀಂಧ್ರ ರೋಗ',
    symptoms: 'Spindle-shaped or diamond-shaped spots on leaves with greyish-white centers and dark brown margins, neck blast causing chaffy grains.',
    symptomsKn: 'ಎಲೆಗಳ ಮೇಲೆ ಕಣ್ಣಿನ ಅಥವಾ ದೋಣಿ ಆಕಾರದ ಕಂದು ಮಚ್ಚೆಗಳು, ಮಚ್ಚೆಯ ಮಧ್ಯ ಬಿಳಿ ಬಣ್ಣ, ಕುತ್ತಿಗೆ ಬ್ಲಾಸ್ಟ್‌ನಿಂದ ತೆನೆ ಜೊಳ್ಳಾಗುವುದು.',
    confidence: 'High (90%)',
    severity: 'Severe',
    severityKn: 'ತೀವ್ರ ಗಂಭೀರ',
    severityClass: 'danger',
    immediateActions: [
      'Temporarily stop top-dressing with Urea/Nitrogen fertilizers as excess N accelerates blast spread.',
      'Maintain continuous 2-3 cm shallow water layer in the field; do not let soil crack.'
    ],
    immediateActionsKn: [
      'ತಕ್ಷಣ ಯೂರಿಯಾ (ಸಾರಜನಕ) ಗೊಬ್ಬರ ಹಾಕುವುದನ್ನು ನಿಲ್ಲಿಸಿ, ಏಕೆಂದರೆ ಇದು ರೋಗವನ್ನು ಇನ್ನಷ್ಟು ಹೆಚ್ಚಿಸುತ್ತದೆ.',
      'ಗದ್ದೆಯಲ್ಲಿ 2-3 ಸೆಂ.ಮೀ ನೀರು ನಿಲ್ಲಿಸಿ, ಗದ್ದೆ ಒಣಗದಂತೆ ನೋಡಿಕೊಳ್ಳಿ.'
    ],
    preventiveMeasures: [
      'Seed treatment with Tricyclazole 75% WP @ 2g/kg seed before sowing.',
      'Foliar spray of Tricyclazole 75% WP @ 0.6g/L water or Isoprothiolane 40% EC @ 1.5ml/L.',
      'Apply balanced N:P:K with recommended Potash and Silica for leaf sheath strength.'
    ],
    preventiveMeasuresKn: [
      'ಟ್ರೈಸೈಕ್ಲಾಜೋಲ್ 75% WP (Tricyclazole) 0.6 ಗ್ರಾಂ/ಲೀಟರ್ ನೀರಿನಲ್ಲಿ ಬೆರೆಸಿ ಎಲೆಗಳ ಮೇಲೆ ಸಿಂಪಡಿಸಿ.',
      'ಪೊಟ್ಯಾಷ್ ಮತ್ತು ಸಿಲಿಕಾನ್ ಪೋಷಕಾಂಶಗಳನ್ನು ನೀಡಿ ಎಲೆಗಳ ಬಲ ಹೆಚ್ಚಿಸಿ.'
    ],
    expertAdvisory: 'If neck blast symptoms appear during panicle emergence, immediate fungicide application within 24 hours is critical to prevent total yield loss.',
    expertAdvisoryKn: 'ತೆನೆ ಹೊರಬರುವ ಹಂತದಲ್ಲಿ ಕುತ್ತಿಗೆ ರೋಗ ಕಂಡರೆ ತಕ್ಷಣ 24 ಗಂಟೆಯೊಳಗೆ ಸಿಂಪಡಣೆ ಮಾಡಿ.'
  },

  chilli_anthracnose: {
    crop: 'Chilli',
    cropKn: 'ಮೆಣಸಿನಕಾಯಿ',
    disease: 'Fruit Rot & Dieback (Colletotrichum capsici)',
    diseaseKn: 'ಮೆಣಸಿನಕಾಯಿ ಕಾಯಿ ಕೊಳೆ ರೋಗ ಮತ್ತು ತುದಿ ಒಣಗು ರೋಗ',
    category: 'Fungal Infection',
    categoryKn: 'ಶಿಲೀಂಧ್ರ ರೋಗ',
    symptoms: 'Circular sunken black spots on ripening pods with concentric rings of acervuli; twig die-back starting from top downwards.',
    symptomsKn: 'ಹಣ್ಣು ಮೆಣಸಿನಕಾಯಿ ಮೇಲೆ ಕಪ್ಪು ಗುಳಿ ಬಿದ್ದ ಮಚ್ಚೆಗಳು, ರೆಂಬೆಯ ತುದಿಯಿಂದ ಕೆಳಕ್ಕೆ ಒಣಗುತ್ತಾ ಬರುವುದು (ಡೈ-ಬ್ಯಾಕ್).',
    confidence: 'Moderate (85%)',
    severity: 'Needs Attention',
    severityKn: 'ಗಮನ ಹರಿಸಬೇಕಾಗಿದೆ',
    severityClass: 'warning',
    immediateActions: [
      'Collect and burn shriveled, infected chilli fruits and dried top twigs.',
      'Avoid harvesting when morning dew is on the plants.'
    ],
    immediateActionsKn: [
      'ರೋಗಪೀಡಿತ ಕೊಳೆತ ಕಾಯಿಗಳನ್ನು ಮತ್ತು ಒಣಗಿದ ಕಡ್ಡಿಗಳನ್ನು ಕಿತ್ತು ನಾಶಮಾಡಿ.',
      'ಮಂಜು ಇರುವಾಗ ಕಾಯಿ ಬಿಡಿಸಬೇಡಿ.'
    ],
    preventiveMeasures: [
      'Spray Azoxystrobin 23% SC @ 1ml/L or Difenoconazole 25% EC @ 0.5ml/L at flowering and fruit set.',
      'Seed treatment with Thiram or Captan @ 3g/kg.'
    ],
    preventiveMeasuresKn: [
      'ಅಜಾಕ್ಸಿಸ್ಟ್ರೋಬಿನ್ 23% SC (Azoxystrobin) 1ml/ಲೀಟರ್ ಅಥವಾ ಡೈಫೆನೊಕೊನಜೋಲ್ 0.5ml/ಲೀಟರ್ ಸಿಂಪಡಿಸಿ.'
    ],
    expertAdvisory: 'Ensure rapid drying of harvested red chillies on clean polythene sheets to avoid post-harvest fungal contamination.',
    expertAdvisoryKn: 'ಕೊಯ್ದ ಮೆಣಸಿನಕಾಯಿಯನ್ನು ಶುದ್ಧ ಪಾಲಿಥಿನ್ ಶೀಟ್ ಮೇಲೆ ಹರಡಿ ಚೆನ್ನಾಗಿ ಒಣಗಿಸಿ.'
  },

  general_nutrient_deficiency: {
    crop: 'Crop Leaf / ಸಸ್ಯ',
    cropKn: 'ಬೆಳೆ',
    disease: 'Nitrogen & Iron Chlorosis (Nutrient Deficiency)',
    diseaseKn: 'ಪೋಷಕಾಂಶಗಳ ಕೊರತೆ (ಸಾರಜನಕ ಮತ್ತು ಕಬ್ಬಿಣಾಂಶ)',
    category: 'Physiological Deficiency',
    categoryKn: 'ಪೋಷಕಾಂಶಗಳ ಕೊರತೆ',
    symptoms: 'Uniform pale yellowing of older leaves (Nitrogen deficiency) or interveinal yellowing with green veins on younger upper leaves (Iron/Zinc deficiency).',
    symptomsKn: 'ಹಳೆಯ ಎಲೆಗಳು ಸಂಪೂರ್ಣ ಹಳದಿಯಾಗುವುದು (ಸಾರಜನಕ ಕೊರತೆ) ಅಥವಾ ಎಳೆಯ ಎಲೆಗಳ ನರಗಳು ಹಸರಾಗಿದ್ದು ಉಳಿದ ಭಾಗ ಹಳದಿಯಾಗುವುದು (ಕಬ್ಬಿಣಾಂಶ ಕೊರತೆ).',
    confidence: 'Moderate (82%)',
    severity: 'Mild to Moderate',
    severityKn: 'ಮಧ್ಯಮ',
    severityClass: 'info',
    immediateActions: [
      'Check root zone for waterlogging or high soil salinity which hinders nutrient absorption.',
      'Apply 19:19:19 water-soluble foliar spray @ 5g/L water in early morning.'
    ],
    immediateActionsKn: [
      'ಬುಡದಲ್ಲಿ ನೀರು ನಿಂತಿದ್ದರೆ ಬಸಿದು ಹೋಗುವಂತೆ ಮಾಡಿ.',
      '19:19:19 ಕರಗುವ ಗೊಬ್ಬರವನ್ನು 5 ಗ್ರಾಂ/ಲೀಟರ್ ನೀರಿನಲ್ಲಿ ಬೆರೆಸಿ ಮುಂಜಾನೆ ಎಲೆಗಳಿಗೆ ಸಿಂಪಡಿಸಿ.'
    ],
    preventiveMeasures: [
      'Soil test based nutrient application.',
      'Foliar spray of Chelated Micronutrient mixture @ 2g/L or Ferrous Sulphate (FeSO4) @ 5g/L + Lime 2.5g/L.'
    ],
    preventiveMeasuresKn: [
      'ಲಘು ಪೋಷಕಾಂಶಗಳ ಮಿಶ್ರಣ (Micronutrient Mix) 2 ಗ್ರಾಂ/ಲೀಟರ್ ಸಿಂಪಡಿಸಿ.',
      'ಮಣ್ಣು ಪರೀಕ್ಷೆ ನಡೆಸಿ ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಶಿಫಾರಸಿನಂತೆ ಗೊಬ್ಬರ ನೀಡಿ.'
    ],
    expertAdvisory: 'Upload your soil health card report to Agrova for a customized micronutrient prescription.',
    expertAdvisoryKn: 'ನಿಮ್ಮ ಮಣ್ಣು ಪರೀಕ್ಷಾ ವರದಿಯನ್ನು ಅಪ್ಲೋಡ್ ಮಾಡಿ ನಿಖರ ಗೊಬ್ಬರದ ಸಲಹೆ ಪಡೆಯಿರಿ.'
  }
};

/**
 * Construct specialized Gemini Vision Agronomist Prompt
 */
export function buildGeminiVisionPrompt({ userQuestion = '', lang = 'kn', hasFile = false }) {
  const isKn = lang === 'kn';
  const targetLanguage = isKn ? 'Kannada (ಕನ್ನಡ)' : 'English';

  return `You are Agrova AI, a leading Agronomist and Crop Pathology specialist assisting Indian farmers (especially in Karnataka).
The farmer has uploaded a crop photograph ${hasFile ? 'and/or an agricultural document' : ''}.

Farmer's specific question: "${userQuestion || 'Please examine this crop image, diagnose any disease/pest/deficiency, and provide safe remedies.'}"

Analyze the image carefully with agricultural rigour:
1. Identify the crop if recognizable.
2. Observe all visible symptoms on leaves, stems, fruit, or roots (lesions, curling, chlorosis, necrosis, spores, pest damage).
3. Determine the most likely disease/pest or deficiency.
4. Note other possible alternative causes (differential diagnosis).
5. State your confidence level (High, Moderate, Low). If the image is unclear or out of focus, transparently tell the farmer to upload a closer, clearer photo.
6. Rate severity (Mild, Moderate, Needs Attention, Severe).
7. Detail safe, immediately actionable steps (cultural/biological first).
8. Detail preventive IPM management (organic solutions, correct chemical dosages in grams/ml per liter of water according to Indian ICAR/KAU/UAS recommendations).
9. Specify when to contact the local Krishi Vigyan Kendra (KVK) or Raitha Samparka Kendra.

IMPORTANT FORMATTING INSTRUCTIONS:
- First, output a structured JSON block inside a \`\`\`json\`\`\` code fence with these exact keys:
{
  "crop": "Crop Name in English",
  "cropKn": "ಬೆಳೆ ಹೆಸರು ಕನ್ನಡದಲ್ಲಿ",
  "disease": "Disease Name in English",
  "diseaseKn": "ರೋಗದ ಹೆಸರು ಕನ್ನಡದಲ್ಲಿ",
  "category": "Fungal / Viral / Bacterial / Pest / Deficiency",
  "categoryKn": "ಶಿಲೀಂಧ್ರ / ವೈರಸ್ / ಬ್ಯಾಕ್ಟೀರಿಯಾ / ಕೀಟ / ಪೋಷಕಾಂಶ ಕೊರತೆ",
  "confidence": "High (90%) / Moderate (75%) / Low (50%)",
  "severity": "Needs Attention / Severe / Moderate / Mild",
  "severityKn": "ಗಮನ ಹರಿಸಬೇಕಾಗಿದೆ / ತೀವ್ರ ಗಂಭೀರ / ಮಧ್ಯಮ",
  "severityClass": "danger / warning / info",
  "symptoms": "Brief symptoms in English",
  "symptomsKn": "ಲಕ್ಷಣಗಳು ಕನ್ನಡದಲ್ಲಿ",
  "actions": ["Action 1", "Action 2"],
  "actionsKn": ["ಕ್ರಮ 1", "ಕ್ರಮ 2"],
  "preventions": ["Prevention 1", "Prevention 2"],
  "preventionsKn": ["ಮುನ್ನೆಚ್ಚರಿಕೆ 1", "ಮುನ್ನೆಚ್ಚರಿಕೆ 2"],
  "expertAdvice": "When to consult expert in English",
  "expertAdviceKn": "ತಜ್ಞರನ್ನು ಯಾವಾಗ ಸಂಪರ್ಕಿಸಬೇಕು ಕನ್ನಡದಲ್ಲಿ"
}

- Below the JSON block, provide a warm, respectful, practical explanation primarily in **${targetLanguage}**.
- Always include safe application warnings (e.g. spray in morning/evening, wear protective mask, check local approved labels).
- Never invent scientific names or false data.`;
}

/**
 * Parse structured disease diagnosis out of Gemini AI response
 */
export function extractDiagnosisFromJson(responseText) {
  if (!responseText) return null;
  try {
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.disease || parsed.crop) {
        return parsed;
      }
    }
  } catch (err) {
    // console.warn('JSON parse error from vision response:', err);
  }
  return null;
}

/**
 * Intelligent Local Fallback Vision Matcher (when offline or before API key setup)
 */
export function matchLocalVisualDiagnosis(fileName = '', questionText = '', lang = 'kn') {
  const q = (fileName + ' ' + questionText).toLowerCase();

  let match = CROP_DISEASE_DB.tomato_early_blight; // Default illustrative fallback

  if (q.includes('curl') || q.includes('ಸುರುಟು') || q.includes('whitefly') || q.includes('ಹಳದಿ')) {
    match = CROP_DISEASE_DB.tomato_leaf_curl;
  } else if (q.includes('paddy') || q.includes('rice') || q.includes('ಭತ್ತ') || q.includes('blast') || q.includes('ಬೆಂಕಿ')) {
    match = CROP_DISEASE_DB.paddy_blast;
  } else if (q.includes('chilli') || q.includes('ಮೆಣಸಿನಕಾಯಿ') || q.includes('rot') || q.includes('dieback')) {
    match = CROP_DISEASE_DB.chilli_anthracnose;
  } else if (q.includes('yellow') || q.includes('fertilizer') || q.includes('nutrient') || q.includes('ಕೊರತೆ') || q.includes('ಗೊಬ್ಬರ')) {
    match = CROP_DISEASE_DB.general_nutrient_deficiency;
  }

  const isKn = lang === 'kn';
  return {
    crop: match.crop,
    cropKn: match.cropKn,
    disease: match.disease,
    diseaseKn: match.diseaseKn,
    category: match.category,
    categoryKn: match.categoryKn,
    confidence: match.confidence,
    severity: match.severity,
    severityKn: match.severityKn,
    severityClass: match.severityClass,
    symptoms: match.symptoms,
    symptomsKn: match.symptomsKn,
    actions: match.immediateActions,
    actionsKn: match.immediateActionsKn,
    preventions: match.preventiveMeasures,
    preventionsKn: match.preventiveMeasuresKn,
    expertAdvice: match.expertAdvisory,
    expertAdviceKn: match.expertAdvisoryKn,
    isLocalFallback: true
  };
}

/**
 * Render Disease Diagnosis Card Component
 */
export function renderDiseaseDiagnosisCard(diagnosis, lang = 'kn', imageThumbnail = '') {
  if (!diagnosis) return '';
  const isKn = lang === 'kn';

  const cropName = isKn ? (diagnosis.cropKn || diagnosis.crop) : diagnosis.crop;
  const diseaseName = isKn ? (diagnosis.diseaseKn || diagnosis.disease) : diagnosis.disease;
  const categoryName = isKn ? (diagnosis.categoryKn || diagnosis.category) : diagnosis.category;
  const severityName = isKn ? (diagnosis.severityKn || diagnosis.severity) : diagnosis.severity;
  const symptoms = isKn ? (diagnosis.symptomsKn || diagnosis.symptoms) : diagnosis.symptoms;
  const actions = isKn ? (diagnosis.actionsKn || diagnosis.actions) : diagnosis.actions;
  const preventions = isKn ? (diagnosis.preventionsKn || diagnosis.preventions) : diagnosis.preventions;
  const expertAdvice = isKn ? (diagnosis.expertAdviceKn || diagnosis.expertAdvice) : diagnosis.expertAdvice;

  const severityBadgeClass = diagnosis.severityClass || 'warning';

  return `
    <div class="crop-diagnosis-card ${severityBadgeClass}">
      <div class="diagnosis-card-header">
        <div class="header-main">
          <div class="crop-tag">
            <i class="fas fa-leaf"></i> <span>${cropName}</span>
          </div>
          <span class="severity-badge ${severityBadgeClass}">
            <i class="fas fa-exclamation-circle"></i> ${severityName}
          </span>
        </div>
        <div class="confidence-tag">
          <i class="fas fa-microscope"></i> ${isKn ? 'ಖಚಿತತೆ' : 'Confidence'}: ${diagnosis.confidence}
        </div>
      </div>

      <div class="diagnosis-card-body">
        ${imageThumbnail ? `
          <div class="diagnosis-image-preview">
            <img src="${imageThumbnail}" alt="Analyzed crop photo" />
            <span class="scan-overlay-tag"><i class="fas fa-check-circle"></i> AI Analyzed</span>
          </div>
        ` : ''}

        <div class="disease-title-row">
          <div class="disease-meta">
            <span class="cat-label">${categoryName}</span>
            <h3 class="disease-name">${diseaseName}</h3>
          </div>
        </div>

        <div class="diagnosis-section symptoms">
          <h4><i class="fas fa-search-plus"></i> ${isKn ? 'ಕಂಡುಬಂದ ಲಕ್ಷಣಗಳು (Observed Symptoms)' : 'Observed Symptoms'}</h4>
          <p>${symptoms}</p>
        </div>

        ${actions && actions.length > 0 ? `
          <div class="diagnosis-section actions">
            <h4><i class="fas fa-hand-holding-medical"></i> ${isKn ? 'ತಕ್ಷಣದ ಸುರಕ್ಷಿತ ಕ್ರಮಗಳು (Immediate Actions)' : 'Safe Immediate Actions'}</h4>
            <ul>
              ${actions.map(act => `<li><i class="fas fa-check"></i> <span>${act}</span></li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${preventions && preventions.length > 0 ? `
          <div class="diagnosis-section prevention">
            <h4><i class="fas fa-shield-alt"></i> ${isKn ? 'ರೋಗ ನಿಯಂತ್ರಣ ಮತ್ತು ಮುನ್ನೆಚ್ಚರಿಕೆ (IPM Treatment)' : 'Control & Prevention (IPM)'}</h4>
            <ul>
              ${preventions.map(prev => `<li><i class="fas fa-shield-virus"></i> <span>${prev}</span></li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${expertAdvice ? `
          <div class="diagnosis-section advisory">
            <i class="fas fa-user-md"></i>
            <div>
              <strong>${isKn ? 'ಕೃಷಿ ತಜ್ಞರ ಸಲಹೆ:' : 'Expert Advisory:'}</strong>
              <span>${expertAdvice}</span>
            </div>
          </div>
        ` : ''}
      </div>

      <div class="diagnosis-card-footer">
        <button type="button" class="btn-ask-more" data-disease="${diseaseName}" data-crop="${cropName}">
          <i class="fas fa-comments"></i>
          <span>${isKn ? 'ಈ ರೋಗದ ಬಗ್ಗೆ ಇನ್ನಷ್ಟು ಕೇಳಿ (Ask More)' : 'Ask More About This Disease'}</span>
        </button>
      </div>
    </div>
  `;
}
