// ===================================================================
// AGROVA - Smart Irrigation & Water Wallet View Component
// 12-Section Comprehensive Agricultural Water Management System
// Supporting Kannada, English, Hindi, Voice, AI & Hackathon Demo Mode
// ===================================================================

import {
  CROP_IRRIGATION_PROFILES,
  IRRIGATION_METHODS,
  SOIL_PROPERTIES,
  PIPE_FLOW_RATES,
  TANK_LEVEL_PRESETS,
  KRISHI_HONDA_PRESETS,
  convertAreaToSqm,
  parseFarmerArea,
  convertLitresToMotorTime,
  convertMotorTimeToLitres,
  calculatePondVolumeLitres,
  calculateWellVolumeLitres,
  calculateCropWaterRequirement,
  estimateCropStageFromSowingDate,
  calculateWaterWalletBudget,
  evaluateWaterEmergencyPriorities,
  calculatePumpAndElectricitySchedule,
  calculateIrrigationEconomics,
  compareIrrigationMethods,
  calculatePumpMinutesEstimation
} from './irrigation-calculator.js';

import {
  startVoiceRecognition,
  stopVoiceRecognition,
  playVoiceResponse,
  stopVoiceResponse
} from './chat-multimodal.js';

import { getWeatherData } from './data.js';

// Default initial state & storage key
const STORAGE_KEY_FIELDS = 'agrova-irrigation-fields';
const STORAGE_KEY_WALLET = 'agrova-irrigation-wallet';
const STORAGE_KEY_HISTORY = 'agrova-irrigation-history';
const STORAGE_KEY_PUMP = 'agrova-irrigation-pump';
const STORAGE_KEY_SENSORS = 'agrova-irrigation-sensors';

// Initial state
export const irrigationState = {
  activeTab: 'overview', // 'overview' | 'fields' | 'wallet' | 'emergency' | 'scheduler' | 'calculator' | 'weather' | 'soil_moisture' | 'pump' | 'cost' | 'savings' | 'comparison'
  isDemoMode: false,
  locationName: 'Mandya, Karnataka',
  lat: 12.5284,
  lng: 76.8975,
  weather: null,

  // Water Wallet
  wallet: {
    sourceType: 'motor_minutes', // 'motor_minutes' | 'borewell' | 'pond' | 'well' | 'canal'
    availableMinutes: 60, // Primary first information: How many minutes waterpump can run!
    currentWaterLitres: 12000,
    storageCapacityLitres: 20000,
    waterSource: 'Waterpump Runtime (60 mins)',
    waterSourceKn: 'ವಾಟರ್ ಪಂಪ್ ಚಾಲನಾ ಸಮಯ (60 ನಿಮಿಷ)',
    estimatedRefillDate: '2026-10-20',
    expectedInflows: [
      { id: 'inf_1', date: '2026-10-18', litres: 3000, source: 'Canal Supply / ನಾಲೆ ನೀರು', confirmed: true }
    ],
    otherUsesLitres: 500, // livestock/domestic
    isMeasured: false, // false = farmer reported / estimated

    // Farmer-friendly water source parameters
    borewellDailyHours: 4,
    borewellDailyMinutes: 0,
    pipeSize: '2.0_inch', // PIPE_FLOW_RATES
    measuredFlowRate: 12000,

    pondPreset: 'medium', // 30x30x10 ft
    pondLevel: 'full', // TANK_LEVEL_PRESETS
    pondLengthFt: 30,
    pondWidthFt: 30,
    pondDepthFt: 10,

    wellDiameterFt: 15,
    wellDepthFt: 12,

    canalHours: 6,
    canalIntervalDays: 10
  },

  // Registered Fields (Acres & Guntas: 1 Acre = 40 Guntas)
  fields: [
    {
      id: 'field_tomato_1',
      name: 'Field A (North Plot)',
      nameKn: 'ಹೊಲ ಎ (ಉತ್ತರ ಭಾಗ)',
      cropId: 'tomato',
      variety: 'Arka Rakshak (High Yield)',
      sowingDate: '2026-08-25',
      stageKey: 'flowering',
      areaAcres: 1,
      areaGuntas: 0,
      area: 1.0,
      areaUnit: 'acre',
      soilType: 'loamy',
      irrigationMethod: 'drip',
      waterSource: 'Borewell & Farm Pond',
      soilMoisture: 38, // % measured
      condition: 'Good flowering, requires steady moisture',
      conditionKn: 'ಉತ್ತಮ ಹೂ ಬಿಟ್ಟಿದೆ; ನಿಯಮಿತ ತೇವಾಂಶ ಅಗತ್ಯ'
    },
    {
      id: 'field_maize_2',
      name: 'Field B (South Plot)',
      nameKn: 'ಹೊಲ ಬಿ (ದಕ್ಷಿಣ ಭಾಗ)',
      cropId: 'maize',
      variety: 'Kaveri 50',
      sowingDate: '2026-09-10',
      stageKey: 'vegetative',
      areaAcres: 1,
      areaGuntas: 0,
      area: 1.0,
      areaUnit: 'acre',
      soilType: 'clay',
      irrigationMethod: 'furrow',
      waterSource: 'Borewell',
      soilMoisture: 48,
      condition: 'Vegetative growth (knee high)',
      conditionKn: 'ಮಧ್ಯಮ ಸಸ್ಯ ಬೆಳವಣಿಗೆ ಹಂತ'
    }
  ],

  // Pump & Electricity
  pump: {
    hp: 5,
    type: 'submersible',
    flowRateLph: 12000, // 12,000 Litres/hour
    powerSource: 'electricity',
    electricityStartHour: 6,
    electricityEndHour: 10, // 4 hours window from BESCOM/CHESCOM
    tariffPerKwh: 3.5,
    dieselPricePerLitre: 92,
    dieselLph: 1.25
  },

  // Soil & IoT Sensors
  sensors: {
    deviceConnected: false,
    deviceId: 'AGROVA-IOT-MDY-042',
    lastSync: 'Just now (Simulated)',
    soilMoistureReading: 38.5,
    depthCm: 25,
    waterLevelMeterLitres: 4850,
    pumpStatus: 'OFF',
    batteryLevel: '94%'
  },

  // Completed Irrigation History
  history: [
    {
      id: 'hist_1',
      date: '2026-10-10',
      fieldId: 'field_tomato_1',
      fieldName: 'Field A (Tomato)',
      litresUsed: 12000,
      durationMinutes: 60,
      method: 'Drip Irrigation',
      pumpCost: 35,
      weather: 'Sunny (28°C)',
      notes: 'Flowering stage morning cycle completed.'
    },
    {
      id: 'hist_2',
      date: '2026-10-07',
      fieldId: 'field_maize_2',
      fieldName: 'Field B (Maize)',
      litresUsed: 18000,
      durationMinutes: 90,
      method: 'Furrow Irrigation',
      pumpCost: 52,
      weather: 'Partly cloudy (27°C)',
      notes: 'Second vegetative furrow cycle.'
    }
  ],

  // Interactive Calculator temporary form
  calcInput: {
    cropId: 'tomato',
    stageKey: 'flowering',
    area: 1.0,
    areaUnit: 'acre',
    soilType: 'loamy',
    irrigationMethod: 'drip',
    et0: 5.0,
    recentRain: 0,
    soilMoisture: 40
  },

  // Active Modals & Voice UI
  activeModal: null, // 'addField' | 'recordSupply' | 'logIrrigation' | 'voiceAdvisor'
  editingFieldId: null,
  voiceModal: {
    isOpen: false,
    isListening: false,
    transcript: '',
    aiReply: '',
    isSpeaking: false
  }
};

// Load saved data from localStorage if available
try {
  const savedFields = localStorage.getItem(STORAGE_KEY_FIELDS);
  if (savedFields) irrigationState.fields = JSON.parse(savedFields);

  const savedWallet = localStorage.getItem(STORAGE_KEY_WALLET);
  if (savedWallet) irrigationState.wallet = { ...irrigationState.wallet, ...JSON.parse(savedWallet) };

  const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
  if (savedHistory) irrigationState.history = JSON.parse(savedHistory);

  const savedPump = localStorage.getItem(STORAGE_KEY_PUMP);
  if (savedPump) irrigationState.pump = { ...irrigationState.pump, ...JSON.parse(savedPump) };
} catch (e) {
  console.warn('Could not restore irrigation state from localStorage:', e);
}

function saveStateToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_FIELDS, JSON.stringify(irrigationState.fields));
    localStorage.setItem(STORAGE_KEY_WALLET, JSON.stringify(irrigationState.wallet));
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(irrigationState.history));
    localStorage.setItem(STORAGE_KEY_PUMP, JSON.stringify(irrigationState.pump));
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

/**
 * Main Render Entry Point for Smart Irrigation View
 */
export function renderIrrigationView(globalState, t) {
  const lang = globalState.lang || 'en';
  const isKn = lang === 'kn';
  const isHi = lang === 'hi';

  // Make sure weather is populated
  if (!irrigationState.weather) {
    irrigationState.weather = globalState.weatherData || getWeatherData(irrigationState.locationName);
  }
  const weather = irrigationState.weather;

  // Ensure fields have farmer-friendly areaAcres & areaGuntas
  irrigationState.fields.forEach(f => {
    if (f.areaAcres === undefined) {
      const parsed = parseFarmerArea({ acres: f.area || 1, guntas: 0, unit: f.areaUnit || 'acre' });
      f.areaAcres = parsed.acres;
      f.areaGuntas = parsed.guntas;
    }
  });

  // Calculate current Water Wallet budget (including motor runtime & irrigable acres/guntas)
  const isDailyReplenishable = irrigationState.wallet.sourceType === 'borewell' || irrigationState.wallet.sourceType === 'motor_minutes';

  const budget = calculateWaterWalletBudget({
    currentUsableWaterLitres: irrigationState.wallet.currentWaterLitres,
    storageCapacityLitres: irrigationState.wallet.storageCapacityLitres,
    expectedInflows: irrigationState.wallet.expectedInflows,
    fields: irrigationState.fields,
    planningHorizonDays: 7,
    otherRecordedUsesLitres: irrigationState.wallet.otherUsesLitres,
    flowRateLph: irrigationState.pump.flowRateLph,
    isDailyReplenishable,
    sourceType: irrigationState.wallet.sourceType
  });

  // Calculate AI Water Emergency Prioritization with motor runtime allocations
  const emergency = evaluateWaterEmergencyPriorities({
    availableWaterLitres: irrigationState.wallet.currentWaterLitres,
    fieldDemands: budget.fieldDemands,
    planningHorizonDays: 7,
    flowRateLph: irrigationState.pump.flowRateLph,
    isDailyReplenishable,
    totalDailyGrossLitres: budget.totalDailyGrossLitres
  });

  // Farmer-first available pump minutes estimation & instant crop demand comparison
  const pumpEstimation = calculatePumpMinutesEstimation({
    availableMinutes: irrigationState.wallet.availableMinutes !== undefined ? irrigationState.wallet.availableMinutes : 60,
    flowRateLph: irrigationState.pump.flowRateLph,
    fields: irrigationState.fields
  });

  // Calculate Pump & Electricity Planner for upcoming requirement
  const topDemandField = budget.fieldDemands[0];
  const targetWaterEvent = topDemandField ? topDemandField.perEventLitres : 15000;
  const pumpPlan = calculatePumpAndElectricitySchedule({
    pumpHp: irrigationState.pump.hp,
    flowRateLph: irrigationState.pump.flowRateLph,
    waterVolumeLitres: targetWaterEvent,
    powerSource: irrigationState.pump.powerSource,
    electricityStartHour: irrigationState.pump.electricityStartHour,
    electricityEndHour: irrigationState.pump.electricityEndHour,
    electricityRatePerKwh: irrigationState.pump.tariffPerKwh,
    dieselPricePerLitre: irrigationState.pump.dieselPricePerLitre
  });

  return `
    <div class="irrigation-page">
      <!-- 1. Top Hero Banner -->
      <div class="irrigation-hero">
        <div class="irrigation-hero-top">
          <div class="irrigation-title-area">
            <div class="irrigation-icon-badge">
              <i class="fas fa-faucet-drip"></i>
            </div>
            <div class="irrigation-title-text">
              <h1>
                Agrova Smart Irrigation
                <span style="font-size:14px;background:var(--primary-100);color:var(--primary-dark);padding:2px 8px;border-radius:12px;font-weight:700;">
                  v2.0 AI
                </span>
              </h1>
              <span class="kannada-sub">ಪ್ರತಿ ಹನಿಯೂ ಅಮೂಲ್ಯ – AI ಆಧಾರಿತ ನೀರಾವರಿ ನಿರ್ವಹಣೆ</span>
              <p class="tagline">
                ${isKn
                  ? 'ನೀರಿನ ಲಭ್ಯತೆ, ಬೆಳೆಯ ಹಂತ, ವಿದ್ಯುತ್ ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ಹವಾಮಾನ ಆಧರಿಸಿ ನೀರಿನ ಬಜೆಟ್ ನಿರ್ವಹಿಸಿ.'
                  : 'Every Drop Matters: Manage water like a financial budget with AI Water Emergency Rationing.'}
              </p>
            </div>
          </div>

          <div class="irrigation-hero-actions">
            <!-- Hackathon Demo Mode Button -->
            <button class="btn-demo-mode" id="btnToggleDemoMode" title="Trigger Mandya Hackathon Water Crisis Demo">
              <i class="fas fa-bolt"></i>
              <span>${irrigationState.isDemoMode ? (isKn ? 'ನೈಜ ಮೋಡ್‌ಗೆ ಬದಲಾಯಿಸಿ' : 'Exit Demo Mode') : (isKn ? 'ಡೆಮೊ ಮೋಡ್ (ಮಂಡ್ಯ)' : 'Hackathon Demo Mode')}</span>
            </button>

            <!-- Voice Irrigation Advisor Button -->
            <button class="btn-voice-advisor" id="btnOpenVoiceAdvisor">
              <i class="fas fa-microphone"></i>
              <span>${isKn ? 'ಧ್ವನಿ ಸಲಹೆಗಾರ' : 'Voice Advisor'}</span>
            </button>

            <!-- Ask Agrova AI Button -->
            <button class="btn-ask-ai" id="btnAskAgrovaIrrigation">
              <i class="fas fa-robot"></i>
              <span>${isKn ? 'AI ಪ್ರಶ್ನೆ ಕೇಳಿ' : 'Ask Agrova AI'}</span>
            </button>
          </div>
        </div>

        <!-- Simulated vs Real Banner -->
        ${irrigationState.isDemoMode ? `
          <div style="background:rgba(245,158,11,0.18);border:1px dashed #f59e0b;padding:8px 14px;border-radius:8px;font-size:12px;color:#fef3c7;display:flex;align-items:center;justify-content:space-between;margin-top:10px;">
            <span><i class="fas fa-flask"></i> <strong>${isKn ? 'ಸಿಮ್ಯುಲೇಟೆಡ್ ಹ್ಯಾಕಥಾನ್ ಡೆಮೊ ಸಕ್ರಿಯವಾಗಿದೆ:' : 'Simulated Hackathon Demo Active:'}</strong> Mandya (Field A: Tomato 1 Acre, Field B: Maize 1 Acre, Water: 5,000L Storage Tank).</span>
            <span style="font-size:11px;opacity:0.9;">${isKn ? 'ಲೆಕ್ಕಾಚಾರಗಳು ಜೀವಂತವಾಗಿವೆ' : 'Live calculations active'}</span>
          </div>
        ` : ''}
      </div>

      <!-- 2. Sub-Navigation Tabs Bar (12 Sections in 1 screen) -->
      <div class="irrigation-nav-bar">
        <button class="irr-nav-btn ${irrigationState.activeTab === 'overview' ? 'active' : ''}" data-irrtab="overview">
          <i class="fas fa-tachometer-alt"></i> ${isKn ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' : 'Overview'}
        </button>
        <button class="irr-nav-btn ${irrigationState.activeTab === 'fields' ? 'active' : ''}" data-irrtab="fields">
          <i class="fas fa-seedling"></i> ${isKn ? 'ನನ್ನ ಹೊಲಗಳು' : 'My Fields'} (${irrigationState.fields.length})
        </button>
        <button class="irr-nav-btn ${irrigationState.activeTab === 'wallet' ? 'active' : ''}" data-irrtab="wallet">
          <i class="fas fa-wallet"></i> ${isKn ? 'ನೀರಿನ ಖಾತೆ' : 'Water Wallet'}
        </button>
        <button class="irr-nav-btn emergency-tab ${budget.isShortage ? 'alert-active' : ''} ${irrigationState.activeTab === 'emergency' ? 'active' : ''}" data-irrtab="emergency">
          <i class="fas fa-triangle-exclamation" style="color:${budget.isShortage ? 'var(--emergency-red)' : 'inherit'}"></i>
          ${isKn ? 'ತುರ್ತು ನಿರ್ವಹಣೆ' : 'Water Emergency'}
          ${budget.isShortage ? '<span class="emergency-pulse-dot"></span>' : ''}
        </button>
        <button class="irr-nav-btn ${irrigationState.activeTab === 'scheduler' ? 'active' : ''}" data-irrtab="scheduler">
          <i class="fas fa-calendar-check"></i> ${isKn ? 'ವೇಳಾಪಟ್ಟಿ' : 'Scheduler'}
        </button>
        <button class="irr-nav-btn ${irrigationState.activeTab === 'calculator' ? 'active' : ''}" data-irrtab="calculator">
          <i class="fas fa-calculator"></i> ${isKn ? 'ಕ್ಯಾಲ್ಕುಲೇಟರ್' : 'Water Calculator'}
        </button>
        <button class="irr-nav-btn ${irrigationState.activeTab === 'weather' ? 'active' : ''}" data-irrtab="weather">
          <i class="fas fa-cloud-rain"></i> ${isKn ? 'ಹವಾಮಾನ' : 'Weather'}
        </button>
        <button class="irr-nav-btn ${irrigationState.activeTab === 'soil_moisture' ? 'active' : ''}" data-irrtab="soil_moisture">
          <i class="fas fa-wave-square"></i> ${isKn ? 'ಮಣ್ಣಿನ ತೇವಾಂಶ & IoT' : 'Soil & IoT'}
        </button>
        <button class="irr-nav-btn ${irrigationState.activeTab === 'pump' ? 'active' : ''}" data-irrtab="pump">
          <i class="fas fa-bolt"></i> ${isKn ? 'ಪಂಪ್ & ವಿದ್ಯುತ್' : 'Pump Planner'}
        </button>
        <button class="irr-nav-btn ${irrigationState.activeTab === 'cost' ? 'active' : ''}" data-irrtab="cost">
          <i class="fas fa-indian-rupee-sign"></i> ${isKn ? 'ವೆಚ್ಚ ಲೆಕ್ಕಾಚಾರ' : 'Cost Calculator'}
        </button>
        <button class="irr-nav-btn ${irrigationState.activeTab === 'savings' ? 'active' : ''}" data-irrtab="savings">
          <i class="fas fa-chart-line"></i> ${isKn ? 'ಉಳಿತಾಯ & ಇತಿಹಾಸ' : 'Savings & History'}
        </button>
        <button class="irr-nav-btn ${irrigationState.activeTab === 'comparison' ? 'active' : ''}" data-irrtab="comparison">
          <i class="fas fa-scale-balanced"></i> ${isKn ? 'ಪದ್ಧತಿ ಹೋಲಿಕೆ' : 'Method Comparison'}
        </button>
      </div>

      <!-- 3. Sub-View Container -->
      <div class="irr-subview-content">
        ${renderActiveSubView(irrigationState.activeTab, budget, emergency, pumpPlan, weather, pumpEstimation, isKn)}
      </div>

      <!-- 4. Modals Container -->
      ${renderActiveModal(irrigationState.activeModal, isKn)}
    </div>
  `;
}

/**
 * Switcher for Internal Sub-Views
 */
function renderActiveSubView(tab, budget, emergency, pumpPlan, weather, pumpEstimation, isKn) {
  switch (tab) {
    case 'overview':
      return renderOverviewTab(budget, emergency, pumpPlan, weather, pumpEstimation, isKn);
    case 'fields':
      return renderFieldsTab(budget, isKn);
    case 'wallet':
      return renderWaterWalletTab(budget, isKn);
    case 'emergency':
      return renderEmergencyModeTab(budget, emergency, isKn);
    case 'scheduler':
      return renderSchedulerTab(budget, pumpPlan, isKn);
    case 'calculator':
      return renderCalculatorTab(isKn);
    case 'weather':
      return renderWeatherIntelligenceTab(weather, isKn);
    case 'soil_moisture':
      return renderSoilMoistureTab(isKn);
    case 'pump':
      return renderPumpPlannerTab(budget, pumpPlan, isKn);
    case 'cost':
      return renderCostCalculatorTab(budget, pumpPlan, isKn);
    case 'savings':
      return renderSavingsHistoryTab(budget, isKn);
    case 'comparison':
      return renderMethodComparisonTab(isKn);
    default:
      return renderOverviewTab(budget, emergency, pumpPlan, weather, pumpEstimation, isKn);
  }
}

/**
 * 1. Overview Dashboard Tab (Farmer-First Available Pump Minutes, Instant Need & 8 Summary Cards)
 */
function renderOverviewTab(budget, emergency, pumpPlan, weather, pumpEstimation, isKn) {
  const rainForecastTotal = weather.forecast.reduce((sum, d) => sum + (d.rain || 0), 0);
  const fieldsNeedingAttention = emergency.prioritizedFields.filter(f => f.urgencyScore >= 50).length;

  return `
    <div class="irr-overview-container">
      <!-- Water Emergency Alert Banner if shortage detected -->
      ${budget.isShortage ? `
        <div class="water-emergency-banner">
          <div class="emergency-banner-left">
            <div class="emergency-banner-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="emergency-banner-text">
              <h3>${isKn ? '⚠️ ನೀರಿನ ಕೊರತೆ ಪತ್ತೆಯಾಗಿದೆ – ತುರ್ತು ನಿರ್ವಹಣೆ ಮೋಡ್' : '⚠️ Water Shortage Detected – AI Emergency Mode Active'}</h3>
              <p>
                ${isKn
                  ? `ಲಭ್ಯವಿರುವ ಮೋಟಾರ್ ಸಮಯ (${budget.motorHoursAvailable.labelKn}) ಮುಂದಿನ 7 ದಿನಗಳ ಅಗತ್ಯಕ್ಕಿಂತ (${budget.horizonMotorHoursNeeded.labelKn}) ಕಡಿಮೆಯಾಗಿದೆ. ${budget.shortageMotorHours.labelKn} ಕೊರತೆ (~${emergency.shortageLitres.toLocaleString()} L).`
                  : `Available motor runtime (${budget.motorHoursAvailable.labelEn}) is insufficient for 7-day crop demand (${budget.horizonMotorHoursNeeded.labelEn}). Deficit: ${budget.shortageMotorHours.labelEn} (~${emergency.shortageLitres.toLocaleString()} L).`}
              </p>
            </div>
          </div>
          <button class="btn-open-emergency" id="btnGoToEmergencyTab">
            <i class="fas fa-arrow-right"></i> ${isKn ? 'ತುರ್ತು ಹಂಚಿಕೆ ಪರಿಶೀಲಿಸಿ' : 'Review Emergency Allocations'}
          </button>
        </div>
      ` : ''}

      <!-- Scientific Safeguard Advisory Banner -->
      <div class="irr-science-banner">
        <i class="fas fa-circle-info"></i>
        <div>
          <h4>${isKn ? 'ರೈತರ ಗಮನಕ್ಕೆ – ನಿಖರ ನೀರಾವರಿ ಅಳತೆ ಮತ್ತು ಪಂಪ್ ಮಾರ್ಗದರ್ಶಿ' : 'Farmer Advisory – Scientific Water & Pump Mechanics'}</h4>
          <p>
            ${isKn
              ? 'ಅಗ್ರೋವಾ ಪಂಪ್ ಪೈಪ್ ಹರಿವಿನ ದರ (2 ಇಂಚು ಪೈಪ್‌ಗೆ ಗಂಟೆಗೆ ~12,000 ಲೀಟರ್) ಮತ್ತು ಮೋಟಾರ್ ಚಾಲನಾ ಸಮಯವನ್ನು ಆಧರಿಸಿ ನೀರಿನ ಪ್ರಮಾಣವನ್ನು ಅಂದಾಜಿಸುತ್ತದೆ. <strong>ಮೋಟಾರ್ ಕುದುರೆ ಶಕ್ತಿ (HP) ಅಥವಾ ಚಾಲನಾ ಸಮಯ ಮಾತ್ರ ನಿಖರವಾದ ನೀರಿನ ಪ್ರಮಾಣವನ್ನು ನೀಡುವುದಿಲ್ಲ.</strong> ಬಾವಿ ಅಥವಾ ಕೊಳವೆಬಾವಿಯ ನೀರಿನ ಆಳವು ನೆಲದ ಊಟೆ (ಮರುಪೂರಣ) ತಿಳಿಯದೆ ನಿರಂತರ ನೀರು ಲಭ್ಯತೆಯನ್ನು ಖಾತರಿಪಡಿಸುವುದಿಲ್ಲ. ಲೀಟರ್ ಪ್ರಮಾಣವನ್ನು ಹಿನ್ನೆಲೆಯ ತಾಂತ್ರಿಕ ಅಳತೆಯಾಗಿ ಇರಿಸಲಾಗಿದೆ.'
              : 'Agrova estimates water usage from measured or calibrated delivery pipe flow rates (~12,000 L/hr for standard 2-inch pipe) and motor runtime. <strong>The AI must never pretend that motor horsepower (HP) or running time alone gives an accurate water quantity.</strong> For open wells and borewells, standing water depth does not equal continuous pumping capacity without knowing groundwater recharge rate. Litres are maintained as an optional background reference.'}
          </p>
        </div>
      </div>

      <!-- 🌟 FARMER-FIRST STEP 1: AVAILABLE WATER PUMP MINUTES CONTROLLER (PER DAY) -->
      <div class="farmer-pump-hero">
        <div class="pump-hero-header">
          <div class="pump-hero-tag">
            <i class="fas fa-bolt"></i> ${isKn ? 'ಹಂತ 1: ಪ್ರತಿದಿನ ಲಭ್ಯವಿರುವ ನೀರು (Daily Available Water)' : 'Step 1: Daily Available Water (Per Day)'}
          </div>
          <button class="btn btn-sm" id="btnHeroOpenSupplyModal" style="background:rgba(2,132,199,0.25);border:1px solid var(--water-blue-border);color:var(--water-blue-light);border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700;cursor:pointer;">
            <i class="fas fa-sliders"></i> ${isKn ? 'ಇನ್ನಿತರ ಮೂಲಗಳು (Another Options)' : 'Another Options'}
          </button>
        </div>

        <div class="pump-hero-title">
          <h3>
            <i class="fas fa-gauge-high" style="color:var(--water-blue-light);"></i>
            ${isKn ? 'ಪ್ರತಿದಿನ ಎಷ್ಟು ನಿಮಿಷ/ಗಂಟೆ ವಾಟರ್ ಪಂಪ್ ಓಡಿಸಲು ನೀರಿದೆ?' : 'How many minutes can you run your water pump per day?'}
          </h3>
          <p>
            ${isKn
              ? 'ಪ್ರತಿದಿನ ಲಭ್ಯವಿರುವ 3-ಫೇಸ್ ವಿದ್ಯುತ್ ಅಥವಾ ಬೋರ್‌ವೆಲ್ ನೀರಿಗೆ ತಕ್ಕಂತೆ ದಿನಕ್ಕೆ ಎಷ್ಟು ನಿಮಿಷ ಪಂಪ್ ಓಡಿಸಬಹುದು ಎಂಬುದನ್ನು ಆರಿಸಿ — ಅಗ್ರೋವಾ ದಿನದ ಬೆಳೆಗಳ ನೀರಿನ ಅಗತ್ಯ, ಉಳಿಕೆ ಅಥವಾ ಕೊರತೆಯನ್ನು ನಿಖರವಾಗಿ ಲೆಕ್ಕಾಚಾರ ಮಾಡುತ್ತದೆ.'
              : 'Specify your available pump runtime per day (based on daily 3-phase electricity or borewell recharge) — Agrova automatically compares it against your crops\' daily transpiration demand to calculate surplus or rationing:'}
          </p>
        </div>

        <!-- Quick Minute Preset Chips & Custom Input -->
        <div class="pump-minutes-selector-row">
          <div class="pump-chips-container">
            ${[15, 30, 45, 60, 90, 120, 180, 240].map(m => `
              <button class="pump-min-chip ${pumpEstimation.availableMinutes === m ? 'active' : ''}" data-mins="${m}">
                <span>${m >= 60 ? (m % 60 === 0 ? `${m/60}h/day` : `${Math.floor(m/60)}h ${m%60}m/day`) : `${m}m/day`}</span>
                <span class="chip-kn">${m >= 60 ? `${Math.floor(m/60)} ಗಂ/ದಿನ` : `${m} ನಿಮಿಷ/ದಿನ`}</span>
              </button>
            `).join('')}
          </div>

          <div class="pump-custom-input-box">
            <label>${isKn ? 'ದಿನಕ್ಕೆ ಲಭ್ಯವಿರುವ ನಿಮಿಷಗಳು:' : 'Daily Available Minutes:'}</label>
            <div class="input-with-unit">
              <input type="number" id="quickAvailableMinutes" min="5" max="1440" step="5" value="${pumpEstimation.availableMinutes}">
              <span>${isKn ? 'ನಿಮಿಷ/ದಿನ' : 'mins/day'}</span>
            </div>
          </div>
        </div>

        <!-- 📊 STEP 2: INSTANT CROP WATER NEED & COMPARISON RESULTS -->
        <div class="instant-need-results-box">
          <div class="instant-need-header">
            <h4>
              <i class="fas fa-calculator"></i>
              ${isKn ? 'ಹಂತ 2: ದಿನದ ಬೆಳೆ ಬೇಡಿಕೆ ಮತ್ತು ಲಭ್ಯವಿರುವ ನೀರಿನ ಹೋಲಿಕೆ' : 'Step 2: Daily Crop Water Need vs. Available Water (Per Day)'}
            </h4>
            <span style="font-size:12px;color:var(--water-blue-light);font-weight:700;">
              ${pumpEstimation.isShortage
                ? (isKn ? `⚠️ ದಿನಕ್ಕೆ ${pumpEstimation.deficitMinutes} ನಿಮಿಷಗಳ ಕೊರತೆ` : `⚠️ ${pumpEstimation.deficitMinutes} mins/day deficit`)
                : (isKn ? `✅ ದಿನಕ್ಕೆ ${pumpEstimation.surplusMinutes} ನಿಮಿಷ ಹೆಚ್ಚುವರಿ` : `✅ ${pumpEstimation.surplusMinutes} mins/day surplus`)}
            </span>
          </div>

          <!-- 4 Metrics Strip -->
          <div class="instant-metrics-strip">
            <div class="instant-metric-cell">
              <span class="cell-lbl">${isKn ? 'ದಿನಕ್ಕೆ ಲಭ್ಯವಿರುವ ಪಂಪ್ ಸಮಯ' : 'Daily Available Pump Time'}</span>
              <div class="cell-val" style="color:var(--water-blue-light);">
                ⏱️ ${pumpEstimation.availableMinutes} ${isKn ? 'ನಿಮಿಷ/ದಿನ' : 'mins/day'}
              </div>
              <div class="cell-sub">
                ~${pumpEstimation.availableLitres.toLocaleString()} L/day @ ${Math.round(pumpEstimation.flowRateLph/60)} L/m
              </div>
            </div>

            <div class="instant-metric-cell">
              <span class="cell-lbl">${isKn ? 'ಇಂದಿನ ಬೆಳೆಗಳ ದೈನಂದಿನ ಬೇಡಿಕೆ' : 'Today\'s Crop Water Need (Per Day)'}</span>
              <div class="cell-val" style="color:${pumpEstimation.isShortage ? '#f87171' : 'var(--primary)'};">
                🌱 ${pumpEstimation.totalDailyMinutesNeeded} ${isKn ? 'ನಿಮಿಷ/ದಿನ' : 'mins/day'}
              </div>
              <div class="cell-sub">
                ~${Math.round(pumpEstimation.totalDailyGrossLitres).toLocaleString()} L/day across ${pumpEstimation.fieldBreakdown.length} fields
              </div>
            </div>

            <div class="instant-metric-cell">
              <span class="cell-lbl">${isKn ? 'ದಿನದ ನೀರಿನಲ್ಲಿ ನೀರಾವರಿ ವಿಸ್ತೀರ್ಣ' : 'Daily Irrigable Land Area'}</span>
              <div class="cell-val" style="color:#fff;">
                🌾 ${isKn ? pumpEstimation.irrigableArea.labelKn : pumpEstimation.irrigableArea.labelEn}
              </div>
              <div class="cell-sub">
                ${isKn ? 'ಪೂರ್ಣ ಪ್ರಮಾಣದ ನೀರಾವರಿಯೊಂದಿಗೆ' : 'At full crop dosage'}
              </div>
            </div>

            <div class="instant-metric-cell">
              <span class="cell-lbl">${isKn ? 'ದೈನಂದಿನ ನೀರಿನ ಪೂರೈಕೆ ದರ' : 'Daily Demand Coverage'}</span>
              <div class="cell-val" style="color:${pumpEstimation.coveragePercent < 100 ? '#fbbf24' : '#4ade80'};">
                ${pumpEstimation.coveragePercent}%
              </div>
              <div class="cell-sub">
                ${pumpEstimation.isShortage ? (isKn ? 'ಭಾಗಶಃ ರೇಷನಿಂಗ್' : 'Partial rationing') : (isKn ? '100% ಪೂರ್ಣ ಪೂರೈಕೆ' : '100% fully fulfilled')}
              </div>
            </div>
          </div>

          <!-- Balance Comparison Progress Bar -->
          <div class="pump-balance-bar-wrap">
            <div class="pump-balance-bar-header">
              <span style="color:var(--text-muted);">${isKn ? 'ಲಭ್ಯತೆ vs ಇಂದಿನ ಅಗತ್ಯ' : 'Available vs Daily Demand'}</span>
              <span style="color:${pumpEstimation.isShortage ? '#f87171' : '#4ade80'};">
                ${pumpEstimation.availableMinutes}m / ${pumpEstimation.totalDailyMinutesNeeded}m (${pumpEstimation.coveragePercent}%)
              </span>
            </div>
            <div class="pump-balance-bar-track">
              <div class="pump-balance-bar-fill" style="width:${Math.min(100, pumpEstimation.coveragePercent)}%;background:${pumpEstimation.isShortage ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #0284c7, #22c55e)'};"></div>
            </div>
          </div>

          <!-- Field-by-Field Breakdown Chips -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
            ${pumpEstimation.fieldBreakdown.map(fb => `
              <div style="background:rgba(30,41,59,0.7);border:1px solid ${fb.isCritical ? 'rgba(239,68,68,0.4)' : 'rgba(51,65,85,0.6)'};border-radius:8px;padding:6px 12px;font-size:12px;display:flex;align-items:center;gap:8px;">
                <span style="font-weight:700;color:#fff;">${fb.fieldName}</span>
                <span style="color:var(--water-blue-light);font-size:11px;">(${isKn ? fb.cropNameKn : fb.cropName} - ${isKn ? fb.stageNameKn : fb.stageName})</span>
                <span style="font-weight:800;color:${fb.isCritical ? '#f87171' : 'var(--primary)'};">⏱️ ${fb.neededMinutes}m</span>
                ${fb.isCritical ? `<span style="background:rgba(239,68,68,0.2);color:#ef4444;font-size:10px;font-weight:800;padding:1px 6px;border-radius:6px;">${isKn ? 'ಅತ್ಯಗತ್ಯ' : 'CRITICAL'}</span>` : ''}
              </div>
            `).join('')}
          </div>

          <!-- AI Priority Rationing Advice -->
          <div class="instant-ai-advice-pill ${pumpEstimation.isShortage ? 'shortage' : 'sufficient'}">
            <i class="fas fa-${pumpEstimation.isShortage ? 'triangle-exclamation' : 'circle-check'}" style="font-size:16px;margin-top:2px;"></i>
            <div>
              <strong>${isKn ? 'ಅಗ್ರೋವಾ ಎಐ ನಿರ್ಧಾರ & ಸಲಹೆ:' : 'Agrova AI Action Advice:'}</strong>
              ${isKn ? pumpEstimation.adviceKn : pumpEstimation.adviceEn}
            </div>
          </div>
        </div>

        <!-- 🌟 ANOTHER OPTIONS DRAWER (ಇನ್ನಿತರ ಆಯ್ಕೆಗಳು) -->
        <details class="another-options-drawer">
          <summary>
            <i class="fas fa-layer-group"></i> ${isKn ? 'ಇನ್ನಿತರ ಆಯ್ಕೆಗಳು: ಕೊಳವೆಬಾವಿ, ಕೃಷಿ ಹೊಂಡ, ತೆರೆದ ಬಾವಿ, ಅಥವಾ ಹನಿ ನೀರಾವರಿ ಉಳಿತಾಯ' : 'Another Options: Borewell Calibration, Farm Pond, Open Well, or Drip Savings'}
          </summary>
          <div class="another-options-grid">
            <div class="another-option-card" data-opt="borewell">
              <div class="opt-hdr"><i class="fas fa-bore-hole" style="color:var(--water-blue-light);"></i> ${isKn ? 'ಆಯ್ಕೆ B: ಕೊಳವೆಬಾವಿ ಪೈಪ್ ಅಳತೆ' : 'Option B: Borewell Pipe Calibration'}</div>
              <p class="opt-desc">${isKn ? '2 ಇಂಚು (12k L/hr), 2.5 ಇಂಚು (18k L/hr) ಪೈಪ್ ಹರಿವಿನ ನಿಖರ ಅಳತೆ.' : 'Calibrate flow rate by delivery pipe diameter (1.5", 2", 2.5", 3").'}</p>
            </div>

            <div class="another-option-card" data-opt="pond">
              <div class="opt-hdr"><i class="fas fa-water" style="color:var(--water-cyan);"></i> ${isKn ? 'ಆಯ್ಕೆ C: ಕೃಷಿ ಹೊಂಡ / ಟ್ಯಾಂಕ್ ಮಟ್ಟ' : 'Option C: Farm Pond / Krishi Honda'}</div>
              <p class="opt-desc">${isKn ? 'ಪೂರ್ಣ, ಮುಕ್ಕಾಲು, ಅರ್ಧ ಅಥವಾ ಕಡಿಮೆ ಮಟ್ಟದಿಂದ ಪಂಪ್ ಸಮಯ ಪಡೆಯಿರಿ.' : 'Derive pump minutes from verified pond dimensions & water levels.'}</p>
            </div>

            <div class="another-option-card" data-opt="well">
              <div class="opt-hdr"><i class="fas fa-circle-dot" style="color:#a78bfa;"></i> ${isKn ? 'ಆಯ್ಕೆ D: ತೆರೆದ ಬಾವಿಯ ನೀರಿನ ಆಳ' : 'Option D: Open Well Water Depth'}</div>
              <p class="opt-desc">${isKn ? 'ಬಾವಿಯ ವ್ಯಾಸ ಮತ್ತು ನೀರಿನ ಆಳ (ಅಡಿಗಳಲ್ಲಿ) ಆಧರಿಸಿ ಅಂದಾಜು ಮಾಡಿ.' : 'Cylinder geometry estimate with groundwater safety factor.'}</p>
            </div>

            <div class="another-option-card" data-opt="canal">
              <div class="opt-hdr"><i class="fas fa-faucet-drip" style="color:#38bdf8;"></i> ${isKn ? 'ಆಯ್ಕೆ E: ನಾಲೆ ಸರದಿ ವೇಳಾಪಟ್ಟಿ' : 'Option E: Canal Turn Schedule'}</div>
              <p class="opt-desc">${isKn ? 'ನಾಲೆ ನೀರಿನ ಸರದಿ ಗಂಟೆಗಳು ಮತ್ತು ದಿನಗಳ ಅಂತರವನ್ನು ಹೊಂದಿಸಿ.' : 'Calculate irrigation budget per rotational canal supply turn.'}</p>
            </div>

            <div class="another-option-card" data-opt="drip_saving">
              <div class="opt-hdr"><i class="fas fa-shield-halved" style="color:#4ade80;"></i> ${isKn ? 'ಆಯ್ಕೆ F: ಹನಿ ನೀರಾವರಿ (44% ಉಳಿತಾಯ)' : 'Option F: Drip vs Surface Savings'}</div>
              <p class="opt-desc">${isKn ? 'ಹನಿ ನೀರಾವರಿಗೆ ಬದಲಾಯಿಸಿ 44% ಮೋಟಾರ್ ಚಾಲನಾ ಸಮಯವನ್ನು ಉಳಿಸಿ!' : 'Switching to Drip stretches 60m into the equivalent of 105m flood!'}</p>
            </div>

            <div class="another-option-card" data-opt="voice">
              <div class="opt-hdr"><i class="fas fa-microphone" style="color:#f43f5e;"></i> ${isKn ? 'ಆಯ್ಕೆ G: ಧ್ವನಿ ಮೂಲಕ ಪ್ರಶ್ನೆ ಕೇಳಿ' : 'Option G: Ask by Voice in Kannada'}</div>
              <p class="opt-desc">${isKn ? '"ನನ್ನಲ್ಲಿ 60 ನಿಮಿಷ ನೀರಿದೆ, ಯಾವ ಬೆಳೆಗೆ ಸಾಕು?" ಎಂದು ಕೇಳಿ.' : 'Speak your available pump minutes in Kannada and hear AI reply.'}</p>
            </div>
          </div>
        </details>
      </div>

      <!-- 8 Summary Cards Grid -->
      <div class="irrigation-summary-grid">
        <!-- 1. Available Water -->
        <div class="irr-summary-card">
          <div class="irr-card-top">
            <span class="irr-card-label">${isKn ? 'ಲಭ್ಯವಿರುವ ಮೋಟಾರ್ ಸಮಯ' : 'Available Water (Motor Run)'}</span>
            <div class="irr-card-icon icon-blue"><i class="fas fa-water"></i></div>
          </div>
          <div class="farmer-metric-hero">${isKn ? budget.motorHoursAvailable.labelKn : budget.motorHoursAvailable.labelEn}</div>
          <div class="farmer-metric-badge">
            <i class="fas fa-layer-group"></i> ${isKn ? budget.irrigableArea.labelKn : budget.irrigableArea.labelEn} ${isKn ? 'ನೀರಾವರಿ ಮಾಡಬಹುದು' : 'irrigable'}
          </div>
          <div class="irr-card-sub" style="margin-top:8px;">
            <i class="fas fa-warehouse"></i> ${isKn ? (irrigationState.wallet.waterSourceKn || irrigationState.wallet.waterSource) : irrigationState.wallet.waterSource} <span style="opacity:0.75;">(~${budget.currentBalance.toLocaleString()} L)</span>
          </div>
        </div>

        <!-- 2. Water Requirement -->
        <div class="irr-summary-card">
          <div class="irr-card-top">
            <span class="irr-card-label">${isKn ? 'ದೈನಂದಿನ ಮೋಟಾರ್ ಅಗತ್ಯ' : 'Est. Water Need (Motor Run)'}</span>
            <div class="irr-card-icon icon-cyan"><i class="fas fa-droplet"></i></div>
          </div>
          <div class="farmer-metric-hero">${isKn ? budget.dailyMotorHoursNeeded.labelKn : budget.dailyMotorHoursNeeded.labelEn} / ${isKn ? 'ದಿನಕ್ಕೆ' : 'day'}</div>
          <div class="farmer-metric-badge" style="color:var(--water-blue-light);background:rgba(2,132,199,0.15);border-color:var(--water-blue-border);">
            <i class="fas fa-calendar-week"></i> 7-Day: ${isKn ? budget.horizonMotorHoursNeeded.labelKn : budget.horizonMotorHoursNeeded.labelEn}
          </div>
          <div class="irr-card-sub" style="margin-top:8px;">
            <i class="fas fa-clock"></i> ~${Math.round(budget.totalDailyGrossLitres).toLocaleString()} L/day across ${irrigationState.fields.length} fields
          </div>
        </div>

        <!-- 3. Next Recommended Irrigation -->
        <div class="irr-summary-card">
          <div class="irr-card-top">
            <span class="irr-card-label">${isKn ? 'ಮುಂದಿನ ನೀರಾವರಿ ಸಮಯ' : 'Next Irrigation'}</span>
            <div class="irr-card-icon icon-green"><i class="fas fa-calendar-day"></i></div>
          </div>
          <div class="irr-card-val" style="font-size:19px;">Tomorrow, 06:30 AM</div>
          <div class="farmer-metric-badge" style="color:var(--primary);background:rgba(34,197,94,0.12);">
            <i class="fas fa-stopwatch"></i> ${budget.fieldDemands[0] ? (isKn ? budget.fieldDemands[0].perEventMotorRuntime.labelKn : budget.fieldDemands[0].perEventMotorRuntime.labelEn) : '1h 00m'}
          </div>
          <div class="irr-card-sub" style="margin-top:6px;">
            <i class="fas fa-bell"></i> Morning slot recommended (cooler ET0)
          </div>
        </div>

        <!-- 4. Upcoming Rainfall -->
        <div class="irr-summary-card">
          <div class="irr-card-top">
            <span class="irr-card-label">${isKn ? 'ಮುಂದಿನ ಮಳೆ ಮುನ್ಸೂಚನೆ' : 'Upcoming Rainfall'}</span>
            <div class="irr-card-icon icon-amber"><i class="fas fa-cloud-showers-heavy"></i></div>
          </div>
          <div class="irr-card-val">${rainForecastTotal} mm</div>
          <div class="irr-card-sub">
            ${rainForecastTotal > 5
              ? (isKn ? 'ಮಳೆ ಸಾಧ್ಯತೆ ಇದೆ; ~45 ನಿಮಿಷ ಮೋಟಾರ್ ಸಮಯ ಉಳಿತಾಯವಾಗಲಿದೆ.' : 'Rain forecast: saves ~45m motor run if rain falls.')
              : (isKn ? 'ಮಳೆ ಸಾಧ್ಯತೆ ಕಡಿಮೆ; ನಿಗದಿತ ವೇಳಾಪಟ್ಟಿಯಂತೆ ನೀರು ಹಾಯಿಸಿ.' : 'Low rain chance; continue scheduled irrigation.')}
          </div>
        </div>

        <!-- 5. Estimated Water Savings -->
        <div class="irr-summary-card">
          <div class="irr-card-top">
            <span class="irr-card-label">${isKn ? 'ಉಳಿಸಿದ ಅಂದಾಜು ನೀರು' : 'Est. Water Savings'}</span>
            <div class="irr-card-icon icon-green"><i class="fas fa-shield-halved"></i></div>
          </div>
          <div class="irr-card-val">44% Saved</div>
          <div class="farmer-metric-badge" style="color:var(--primary);background:rgba(34,197,94,0.12);">
            <i class="fas fa-bolt"></i> Saves ~1h 30m / acre vs flood
          </div>
          <div class="irr-card-sub" style="margin-top:6px;">
            <i class="fas fa-check-circle"></i> Using drip efficiency (90%) vs flood (50%)
          </div>
        </div>

        <!-- 6. Estimated Irrigation Cost -->
        <div class="irr-summary-card">
          <div class="irr-card-top">
            <span class="irr-card-label">${isKn ? 'ಅಂದಾಜು ನೀರಾವರಿ ವೆಚ್ಚ' : 'Est. Pumping Cost'}</span>
            <div class="irr-card-icon icon-purple"><i class="fas fa-indian-rupee-sign"></i></div>
          </div>
          <div class="irr-card-val">₹${pumpPlan.estimatedCost} / event</div>
          <div class="irr-card-sub">
            <i class="fas fa-bolt"></i> ${pumpPlan.formattedRuntime} @ ₹${irrigationState.pump.tariffPerKwh}/unit
          </div>
        </div>

        <!-- 7. Fields Needing Attention -->
        <div class="irr-summary-card">
          <div class="irr-card-top">
            <span class="irr-card-label">${isKn ? 'ಗಮನ ಬೇಕಿರುವ ಹೊಲಗಳು' : 'Fields Needing Care'}</span>
            <div class="irr-card-icon ${fieldsNeedingAttention > 0 ? 'icon-red' : 'icon-green'}">
              <i class="fas fa-bell"></i>
            </div>
          </div>
          <div class="irr-card-val" style="color:${fieldsNeedingAttention > 0 ? 'var(--emergency-red)' : 'var(--primary)'}">
            ${fieldsNeedingAttention} ${isKn ? 'ಹೊಲ' : (fieldsNeedingAttention === 1 ? 'Field' : 'Fields')}
          </div>
          <div class="irr-card-sub">
            ${emergency.prioritizedFields[0]
              ? `${emergency.prioritizedFields[0].cropName} (${isKn ? emergency.prioritizedFields[0].allocatedMotorRuntime.labelKn : emergency.prioritizedFields[0].allocatedMotorRuntime.labelEn})`
              : 'All fields optimal'}
          </div>
        </div>

        <!-- 8. Pump Availability -->
        <div class="irr-summary-card">
          <div class="irr-card-top">
            <span class="irr-card-label">${isKn ? 'ವಿದ್ಯುತ್ & ಪಂಪ್ ಲಭ್ಯತೆ' : 'Pump Availability'}</span>
            <div class="irr-card-icon ${pumpPlan.fitsInWindow ? 'icon-cyan' : 'icon-amber'}">
              <i class="fas fa-plug-circle-bolt"></i>
            </div>
          </div>
          <div class="irr-card-val" style="font-size:18px;">${pumpPlan.windowLabel}</div>
          <div class="irr-card-sub">
            ${pumpPlan.fitsInWindow
              ? (isKn ? `ಸಾಧ್ಯ: ${pumpPlan.formattedRuntime} ಚಾಲನಾ ಸಮಯ ಸಾಕು.` : `Feasible: ${pumpPlan.formattedRuntime} needed.`)
              : (isKn ? `ಎಚ್ಚರಿಕೆ: ${pumpPlan.deficitHours} ಗಂಟೆ ಹೆಚ್ಚಿನ ಸಮಯ ಬೇಕು.` : `Conflict: needs ${pumpPlan.deficitHours}h more power.`)}
          </div>
        </div>
      </div>

      <!-- Quick Action Buttons Row -->
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
        <button class="btn btn-primary" id="btnQuickAddField">
          <i class="fas fa-plus"></i> ${isKn ? 'ಹೊಸ ಹೊಲ ಸೇರಿಸಿ (ಎಕರೆ-ಗುಂಟೆ)' : 'Register New Field (Acres & Guntas)'}
        </button>
        <button class="btn btn-secondary" id="btnQuickRecordWater" style="background:var(--bg-card);border:1px solid var(--border-color);color:var(--text-primary);">
          <i class="fas fa-pen"></i> ${isKn ? 'ನೀರಿನ ಮೂಲ / ಲಭ್ಯತೆ ನವೀಕರಿಸಿ' : 'Update Water Source'}
        </button>
        <button class="btn btn-secondary" id="btnQuickLogIrrigation" style="background:var(--bg-card);border:1px solid var(--border-color);color:var(--text-primary);">
          <i class="fas fa-faucet"></i> ${isKn ? 'ಮೋಟಾರ್ ಚಾಲನೆ ದಾಖಲಿಸಿ' : 'Log Motor Runtime'}
        </button>
        <button class="btn btn-secondary" id="btnDownloadReport" style="background:var(--bg-card);border:1px solid var(--border-color);color:var(--text-primary);">
          <i class="fas fa-download"></i> ${isKn ? 'ವರದಿ ಡೌನ್‌ಲೋಡ್ (CSV)' : 'Download Report (CSV)'}
        </button>
      </div>

      <!-- Priority Action Banner for Farmers -->
      <div class="wallet-budget-card" style="border-left:4px solid ${budget.isShortage ? 'var(--emergency-red)' : 'var(--primary)'};">
        <h3 style="font-size:16px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:8px;">
          <i class="fas fa-brain" style="color:${budget.isShortage ? 'var(--emergency-red)' : 'var(--primary)'};"></i>
          ${isKn ? 'ಅಗ್ರೋವಾ AI ನೀರಾವರಿ ಶಿಫಾರಸು:' : 'Agrova AI Irrigation Recommendation:'}
        </h3>
        <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;margin-bottom:12px;">
          ${isKn ? emergency.recommendationSummaryKn : emergency.recommendationSummaryEn}
        </p>
        <div style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <span><i class="fas fa-calculator"></i> ${isKn ? 'ವಿಜ್ಞಾನ ಸೂತ್ರ: FAO-56 Penman-Monteith (ETc = ET0 × Kc)' : 'Science Model: FAO-56 Penman-Monteith (ETc = ET0 × Kc)'}</span>
          <span><i class="fas fa-ruler-combined"></i> 1 Acre = 40 Guntas (4,046.86 m²) • 1 mm/m² = 1 L</span>
          <span><i class="fas fa-location-dot"></i> ${irrigationState.locationName}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * 2. My Fields Tab (Field Registration & Management)
 */
function renderFieldsTab(budget, isKn) {
  return `
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);margin:0 0 4px;">
            <i class="fas fa-seedling" style="color:var(--primary);margin-right:8px;"></i>
            ${isKn ? 'ನೋಂದಾಯಿತ ಹೊಲಗಳು' : 'Registered Fields & Crops'}
          </h2>
          <p style="font-size:13px;color:var(--text-secondary);margin:0;">
            ${isKn
              ? 'ನಿಮ್ಮ ಹೊಲಗಳು, ಬೆಳೆಗಳು, ಮಣ್ಣಿನ ವಿಧ ಮತ್ತು ನೀರಾವರಿ ಪದ್ಧತಿಯನ್ನು ನಿರ್ವಹಿಸಿ.'
              : 'Add, update or manage fields. Crop stages and water demands are calculated automatically.'}
          </p>
        </div>
        <button class="btn btn-primary" id="btnOpenAddFieldModal">
          <i class="fas fa-plus"></i> ${isKn ? 'ಹೊಸ ಹೊಲ ಸೇರಿಸಿ' : 'Add New Field'}
        </button>
      </div>

      <div class="fields-cards-grid">
        ${irrigationState.fields.length === 0 ? `
          <div class="empty-fields-state" style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; background: var(--bg-card); border: 2px dashed var(--card-border-navy); border-radius: 14px;">
            <i class="fas fa-seedling" style="font-size: 42px; color: var(--primary); margin-bottom: 16px; opacity: 0.85;"></i>
            <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0 0 8px;">
              ${isKn ? 'ಯಾವುದೇ ಹೊಲಗಳು ನೋಂದಾಯಿಸಲಾಗಿಲ್ಲ' : 'No Fields Registered'}
            </h3>
            <p style="font-size: 14px; color: var(--text-secondary); max-width: 520px; margin: 0 auto 20px;">
              ${isKn
                ? 'ಎಲ್ಲಾ ಹೊಲಗಳನ್ನು ತೆಗೆದುಹಾಕಲಾಗಿದೆ. ನೀರಿನ ಒಟ್ಟು ಅಗತ್ಯ 0 ಲೀಟರ್ ಆಗಿದೆ. ಬೆಳೆ ನೀರಿನ ಅಗತ್ಯತೆಗಳನ್ನು ಲೆಕ್ಕಹಾಕಲು ಹೊಸ ಹೊಲವನ್ನು ಸೇರಿಸಿ.'
                : 'All fields have been removed. Total crop water requirement is 0 Litres. Add a field anytime to track water demands and schedule irrigation.'}
            </p>
            <button class="btn btn-primary" id="btnOpenAddFieldEmpty" style="padding: 10px 22px; font-weight: 600;">
              <i class="fas fa-plus" style="margin-right: 6px;"></i> ${isKn ? 'ಮೊದಲ ಹೊಲ ಸೇರಿಸಿ' : 'Add First Field'}
            </button>
          </div>
        ` : irrigationState.fields.map(field => {
          const req = calculateCropWaterRequirement({
            cropId: field.cropId,
            stageKey: field.stageKey,
            areaValue: field.area,
            areaAcres: field.areaAcres !== undefined ? field.areaAcres : field.area,
            areaGuntas: field.areaGuntas || 0,
            areaUnit: 'acre',
            irrigationMethodId: field.irrigationMethod,
            soilId: field.soilType,
            soilMoisturePercent: field.soilMoisture,
            flowRateLph: irrigationState.pump.flowRateLph
          });

          return `
            <div class="field-card" data-fieldid="${field.id}">
              <div class="field-card-header">
                <div>
                  <h3 class="field-card-title">${isKn && field.nameKn ? field.nameKn : field.name}</h3>
                  <div class="field-card-crop">
                    <i class="fas fa-leaf"></i> ${req.crop.nameEn} (${req.crop.nameKn}) ${field.variety ? `• ${field.variety}` : ''}
                  </div>
                </div>
                <span class="field-stage-badge ${req.isCriticalStage ? 'critical' : ''}">
                  ${req.isCriticalStage ? '⚠️ ' : ''}${isKn ? req.stage.labelKn : req.stage.labelEn}
                </span>
              </div>

              <div class="field-meta-row">
                <div class="field-meta-item">
                  ${isKn ? 'ವಿಸ್ತೀರ್ಣ (ಎಕರೆ-ಗುಂಟೆ)' : 'Land Area'}:
                  <strong>${isKn ? req.farmerArea.labelKn : req.farmerArea.labelEn} <span style="font-size:11px;opacity:0.75;">(${req.areaSqm.toLocaleString()} m²)</span></strong>
                </div>
                <div class="field-meta-item">
                  ${isKn ? 'ಮಣ್ಣಿನ ವಿಧ' : 'Soil Type'}: <strong>${field.soilType}</strong>
                </div>
                <div class="field-meta-item">
                  ${isKn ? 'ನೀರಾವರಿ ಪದ್ಧತಿ' : 'Method'}: <strong>${field.irrigationMethod} (${Math.round(req.efficiency * 100)}% eff.)</strong>
                </div>
                <div class="field-meta-item">
                  ${isKn ? 'ನೀರಿನ ಮೂಲ' : 'Water Source'}: <strong>${field.waterSource}</strong>
                </div>
                <div class="field-meta-item">
                  ${isKn ? 'ದೈನಂದಿನ ಮೋಟಾರ್ ಅಗತ್ಯ' : 'Daily Motor Demand'}:
                  <strong style="color:var(--water-blue-light);">${isKn ? req.dailyMotorRuntime.labelKn : req.dailyMotorRuntime.labelEn}</strong>
                </div>
                <div class="field-meta-item">
                  ${isKn ? 'ಮಣ್ಣಿನ ತೇವಾಂಶ' : 'Soil Moisture'}: <strong>${field.soilMoisture ? field.soilMoisture + '%' : 'Not Measured'}</strong>
                </div>
              </div>

              <div style="background:rgba(15,23,42,0.5);padding:10px 12px;border-radius:8px;font-size:12px;color:var(--text-secondary);margin-bottom:12px;">
                <i class="fas fa-info-circle" style="color:var(--water-blue-light);margin-right:4px;"></i>
                ${isKn ? (field.conditionKn || field.condition) : field.condition}
              </div>

              <div class="field-card-footer">
                <span style="font-size:13px;font-weight:700;color:var(--water-blue-light);display:inline-flex;align-items:center;gap:6px;">
                  <i class="fas fa-stopwatch"></i> ${isKn ? req.perEventMotorRuntime.labelKn : req.perEventMotorRuntime.labelEn} / cycle
                  <span style="font-size:11px;color:var(--text-muted);font-weight:400;">(~${req.perEventGrossLitres.toLocaleString()} L)</span>
                </span>
                <div style="display:flex;gap:8px;">
                  <button class="btn btn-sm btn-outline-danger btn-delete-field" data-deleteid="${field.id}" style="padding:4px 10px;font-size:12px;background:transparent;border:1px solid #ef4444;color:#ef4444;border-radius:6px;cursor:pointer;">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * 3. Water Wallet Tab (Financial-style Water Budget)
 */
function renderWaterWalletTab(budget, isKn) {
  const isDailyReplenishable = irrigationState.wallet.sourceType === 'borewell' || irrigationState.wallet.sourceType === 'motor_minutes';

  return `
    <div class="water-wallet-tab-container">
      <div class="wallet-header-row">
        <div>
          <h2 class="wallet-main-title">
            <i class="fas fa-wallet wallet-title-icon"></i>
            ${isKn ? 'ಅಗ್ರೋವಾ ನೀರಿನ ಖಾತೆ (Farmer Water Wallet)' : 'Agrova Farmer Water Wallet'}
          </h2>
          <p class="wallet-main-desc">
            ${isKn
              ? 'ನೀರಿನ ಸಂಗ್ರಹವನ್ನು ಮೋಟಾರ್ ಚಾಲನಾ ಸಮಯ (ಗಂಟೆ-ನಿಮಿಷ) ಮತ್ತು ಎಕರೆ-ಗುಂಟೆಗಳ ರೂಪದಲ್ಲಿ ನಿರ್ವಹಿಸಿ: ಲಭ್ಯವಿರುವ ಮೋಟಾರ್ ಸಮಯ + ಒಳಹರಿವು - ಯೋಜಿತ ಬಳಕೆ = ಉಳಿಕೆ ಸಮಯ.'
              : 'Manage water like a financial budget in motor runtime (hours & minutes) and irrigable area: Available Motor Time + Confirmed Inflow - Planned Irrigation = Buffer Time.'}
          </p>
        </div>
        <button class="btn btn-primary" id="btnUpdateWalletBalance">
          <i class="fas fa-plus-circle"></i> ${isKn ? 'ನೀರಿನ ಮೂಲ / ಲಭ್ಯತೆ ನವೀಕರಿಸಿ' : 'Update Source & Supply'}
        </button>
      </div>

      <!-- Financial Equation Card in Motor Hours -->
      <div class="wallet-budget-card">
        <h3 class="wallet-section-title">
          ${isKn ? '7-ದಿನಗಳ ನೀರಿನ ಬಜೆಟ್ ಸಮೀಕರಣ (ಮೋಟಾರ್ ಚಾಲನಾ ಸಮಯ)' : '7-Day Water Budget Reconciliation (Motor Runtime)'}
        </h3>
        <p class="wallet-section-subtitle">
          *${isKn ? 'ಪಂಪ್ ಹರಿವಿನ ದರ (2 ಇಂಚು ಪೈಪ್ ~12,000 L/ಗಂ) ಮತ್ತು ಮೋಟಾರ್ ಚಾಲನಾ ಸಮಯ ಆಧಾರಿತ ಲೆಕ್ಕಾಚಾರ.' : 'Estimated from calibrated pump flow rate (~12,000 L/hr for standard 2" pipe) and motor runtime.'}
        </p>

        <div class="wallet-equation-row">
          <!-- 1. Available Water -->
          <div class="equation-box positive">
            <div class="eq-label">${isDailyReplenishable ? (isKn ? 'ದೈನಂದಿನ ಲಭ್ಯ ಮೋಟಾರ್ ಸಮಯ' : 'Daily Available Motor Run') : (isKn ? 'ಪ್ರಸ್ತುತ ಮೋಟಾರ್ ಸಮಯ' : 'Available Motor Run')}</div>
            <div class="eq-value">${isKn ? budget.motorHoursAvailable.labelKn : budget.motorHoursAvailable.labelEn}${isDailyReplenishable ? (isKn ? ' /ದಿನ' : ' /day') : ''}</div>
            <div class="eq-irrigable-tag">
              ${isKn ? budget.irrigableArea.labelKn : budget.irrigableArea.labelEn} ${isKn ? 'ನೀರಾವರಿ/ದಿನ' : 'irrigable/day'}
            </div>
            <div class="eq-sub">
              ${isDailyReplenishable
                ? `(~${budget.currentBalance.toLocaleString()} L/day • 7-Day: ~${((budget.currentBalance * 7) + budget.totalExpectedInflow).toLocaleString()} L)`
                : `(~${budget.currentBalance.toLocaleString()} L) • ${irrigationState.wallet.isMeasured ? 'Measured' : 'Estimated'}`}
            </div>
          </div>

          <!-- + Expected Inflow -->
          <div class="equation-box positive inflow">
            <div class="eq-label">${isKn ? '+ ಖಚಿತ ಒಳಹರಿವು' : '+ Confirmed Inflow'}</div>
            <div class="eq-value">+${isKn ? convertLitresToMotorTime(budget.totalExpectedInflow, budget.flowRateLph).labelKn : convertLitresToMotorTime(budget.totalExpectedInflow, budget.flowRateLph).labelEn}</div>
            <div class="eq-sub">
              (+${budget.totalExpectedInflow.toLocaleString()} L) • Refill: ${irrigationState.wallet.estimatedRefillDate}
            </div>
          </div>

          <!-- - Planned Irrigation -->
          <div class="equation-box negative">
            <div class="eq-label">${isKn ? '- ಯೋಜಿತ ಮೋಟಾರ್ ಸಮಯ' : '- Planned Motor Run'}</div>
            <div class="eq-value">-${isKn ? budget.horizonMotorHoursNeeded.labelKn : budget.horizonMotorHoursNeeded.labelEn}</div>
            <div class="eq-sub">
              (-${budget.totalHorizonDemandLitres.toLocaleString()} L) • ${irrigationState.fields.length} Fields (7-Day)
            </div>
          </div>

          <!-- - Other Uses -->
          <div class="equation-box other">
            <div class="eq-label">${isKn ? '- ಇತರ ಬಳಕೆ' : '- Other Uses'}</div>
            <div class="eq-value">-${isKn ? convertLitresToMotorTime(budget.otherRecordedUsesLitres, budget.flowRateLph).labelKn : convertLitresToMotorTime(budget.otherRecordedUsesLitres, budget.flowRateLph).labelEn}</div>
            <div class="eq-sub">
              (-${budget.otherRecordedUsesLitres.toLocaleString()} L) • Cattle & home
            </div>
          </div>

          <!-- = Projected Balance -->
          <div class="equation-box ${budget.isShortage ? 'negative result-deficit' : 'positive result-surplus'}">
            <div class="eq-label">${isKn ? '= ಉಳಿಕೆ ಸಮಯ / ಕೊರತೆ' : '= Buffer / Deficit Runtime'}</div>
            <div class="eq-value">
              ${budget.isShortage ? '-' : '+'}${isKn ? budget.shortageMotorHours.labelKn : budget.shortageMotorHours.labelEn}
            </div>
            <div class="eq-sub eq-result-sub">
              ${budget.isShortage
                ? (isDailyReplenishable
                    ? `DEFICIT (~${budget.shortageLitres.toLocaleString()} L in 7d • ~${Math.round(budget.shortageLitres / 7).toLocaleString()} L/day)`
                    : `DEFICIT (~${budget.shortageLitres.toLocaleString()} L)`)
                : (isDailyReplenishable
                    ? `SURPLUS (~${budget.projectedRemainingLitres.toLocaleString()} L in 7d • ~${Math.round(budget.projectedRemainingLitres / 7).toLocaleString()} L/day)`
                    : `SURPLUS (~${budget.projectedRemainingLitres.toLocaleString()} L)`)}
            </div>
          </div>
        </div>

        <!-- Fill Level Progress Bar -->
        <div class="wallet-fill-section">
          <div class="wallet-fill-header">
            <span>${isKn ? 'ಸಂಗ್ರಹಾಗಾರ / ಪಂಪ್ ಸಾಮರ್ಥ್ಯ ಭರ್ತಿ' : 'Storage / Pumping Capacity Filled'} (${budget.currentBalance.toLocaleString()} / ${budget.capacity.toLocaleString()} L)</span>
            <span class="wallet-fill-pct">${budget.fillPercentage}%</span>
          </div>
          <div class="wallet-progress-bar-wrap">
            <div class="wallet-progress-bar-fill ${budget.fillPercentage < 25 ? 'danger' : ''}" style="width:${budget.fillPercentage}%;"></div>
          </div>
        </div>

        <!-- 3 Metric Boxes -->
        <div class="wallet-stats-grid">
          <div class="wallet-stat-card">
            <div class="wallet-stat-label">${isKn ? 'ನೀರಿನ ಲಭ್ಯತೆಯ ದಿನಗಳು' : 'Days of Water Remaining'}</div>
            <div class="wallet-stat-val">
              ${budget.daysOfWaterRemaining >= 900 ? '∞' : budget.daysOfWaterRemaining} ${isKn ? 'ದಿನಗಳು' : 'Days'}
            </div>
            <div class="wallet-stat-sub">${isDailyReplenishable ? (isKn ? 'ದೈನಂದಿನ ಮರುಪೂರಣ ಲಭ್ಯ' : 'Sustainable Daily Yield') : (isKn ? 'ಪ್ರಸ್ತುತ ಬೆಳೆ ಮೋಟಾರ್ ಚಾಲನೆ ಆಧಾರಿತ' : 'At current crop motor runtime')}</div>
          </div>

          <div class="wallet-stat-card">
            <div class="wallet-stat-label">${isKn ? 'ದೈನಂದಿನ ಮೋಟಾರ್ ಬೇಡಿಕೆ' : 'Daily Farm Motor Demand'}</div>
            <div class="wallet-stat-val val-demand">
              ${isKn ? budget.dailyMotorHoursNeeded.labelKn : budget.dailyMotorHoursNeeded.labelEn}
            </div>
            <div class="wallet-stat-sub">~${Math.round(budget.totalDailyGrossLitres).toLocaleString()} L / day across ${irrigationState.fields.length} fields</div>
          </div>

          <div class="wallet-stat-card">
            <div class="wallet-stat-label">${isKn ? 'ನೀರಿನ ಖಾತೆಯ ಸ್ಥಿತಿ' : 'Water Wallet Health'}</div>
            <div class="wallet-stat-val ${budget.isShortage ? 'val-shortage' : 'val-healthy'}">
              ${budget.isShortage ? (isKn ? '⚠️ ತುರ್ತು ಕೊರತೆ' : '⚠️ Critical Deficit') : (isKn ? '✅ ಸಾಕಷ್ಟು ನೀರಿದೆ' : '✅ Sufficient Supply')}
            </div>
            <div class="wallet-stat-sub">
              ${budget.isShortage ? (isKn ? 'ನೀರಿನ ತುರ್ತು ನಿರ್ವಹಣೆ ಸಕ್ರಿಯವಾಗಿದೆ' : 'Water Emergency Mode Triggered') : (isKn ? 'ಸಾಮಾನ್ಯ ನೀರಾವರಿ ವೇಳಾಪಟ್ಟಿ' : 'Normal Irrigation Schedule')}
            </div>
          </div>
        </div>

        <!-- Source Calibration Breakdown Card -->
        <div class="irr-science-banner" style="margin-top:20px;">
          <i class="fas fa-faucet-drip"></i>
          <div>
            <h4>${isKn ? 'ನೀರಿನ ಮೂಲದ ಲೆಕ್ಕಾಚಾರದ ವಿವರಣೆ:' : 'How Agrova Estimates Your Available Water:'}</h4>
            <p>
              ${irrigationState.wallet.sourceType === 'borewell'
                ? (isKn
                  ? `ಕೊಳವೆಬಾವಿ: ಮೋಟಾರ್ ಚಾಲನೆ ${irrigationState.wallet.borewellDailyHours !== undefined ? irrigationState.wallet.borewellDailyHours : 4} ಗಂಟೆ ${irrigationState.wallet.borewellDailyMinutes || 0} ನಿಮಿಷ ಮತ್ತು 2 ಇಂಚು ಪೈಪ್ (ಗಂಟೆಗೆ ~12,000 ಲೀಟರ್). ಅಂದಾಜು ದಿನದ ನೀರು: ~${budget.currentBalance.toLocaleString()} ಲೀಟರ್. (ಮೋಟಾರ್ ಕುದುರೆ ಶಕ್ತಿ ಮಾತ್ರವಲ್ಲದೆ ಪೈಪ್ ಹರಿವಿನ ದರ ಆಧರಿಸಿದೆ).`
                  : `Borewell: Based on ${irrigationState.wallet.borewellDailyHours !== undefined ? irrigationState.wallet.borewellDailyHours : 4}h ${irrigationState.wallet.borewellDailyMinutes || 0}m daily runtime through calibrated delivery pipe (~12,000 L/hr). Estimated daily supply: ~${budget.currentBalance.toLocaleString()} L.`)
                : irrigationState.wallet.sourceType === 'pond'
                ? (isKn
                  ? `ಕೃಷಿ ಹೊಂಡ: ಅಳತೆ ಮತ್ತು ಸಂಗ್ರಹ ಮಟ್ಟ (${TANK_LEVEL_PRESETS[irrigationState.wallet.pondLevel || 'full'] ? TANK_LEVEL_PRESETS[irrigationState.wallet.pondLevel || 'full'].labelKn : 'ಭರ್ತಿ'}). ಅಂದಾಜು ನೀರು: ~${budget.currentBalance.toLocaleString()} ಲೀಟರ್.`
                  : `Farm Pond: Calculated from verified pond dimensions and water level (${TANK_LEVEL_PRESETS[irrigationState.wallet.pondLevel || 'full'] ? TANK_LEVEL_PRESETS[irrigationState.wallet.pondLevel || 'full'].labelEn : 'Full'}). Estimated usable storage: ~${budget.currentBalance.toLocaleString()} L.`)
                : irrigationState.wallet.sourceType === 'well'
                ? (isKn
                  ? `ತೆರೆದ ಬಾವಿ: ವ್ಯಾಸ ${irrigationState.wallet.wellDiameterFt || 15} ಅಡಿ, ನೀರಿನ ಆಳ ${irrigationState.wallet.wellDepthFt || 12} ಅಡಿ. ಸದ್ಯ ಸಂಗ್ರಹ: ~${budget.currentBalance.toLocaleString()} ಲೀಟರ್.`
                  : `Open Well: Diameter ${irrigationState.wallet.wellDiameterFt || 15} ft, standing water depth ${irrigationState.wallet.wellDepthFt || 12} ft. Standing cylinder volume: ~${budget.currentBalance.toLocaleString()} L.`)
                : (isKn ? 'ನಾಲೆ ಅಥವಾ ನೇರ ಪಂಪ್ ಸಮಯ ಆಧಾರಿತ ಲಭ್ಯತೆ.' : 'Canal rotational turn or direct pump minutes allocation.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 4. AI Water Emergency Mode Tab (Hackathon Core Feature)
 */
function renderEmergencyModeTab(budget, emergency, isKn) {
  return `
    <div class="emergency-mode-tab-container">
      <div class="emergency-tab-header">
        <h2 class="emergency-main-title">
          <span class="emergency-title-badge ${emergency.emergencyActive ? 'alert' : 'normal'}">
            ${emergency.emergencyActive ? 'AI EMERGENCY' : 'AI MONITOR'}
          </span>
          ${isKn ? 'ನೀರಿನ ತುರ್ತು ನಿರ್ವಹಣೆ ಮೋಡ್ & ಬೆಳೆ ರೇಷನಿಂಗ್' : 'AI Water Emergency Mode & Crop Rationing'}
        </h2>
        <p class="emergency-main-desc">
          ${isKn
            ? 'ನೀರಿನ ಸಂಗ್ರಹ ಕೊರತೆಯಾದಾಗ ಬೆಳೆ ಹಾನಿಯಾಗದಂತೆ ಯಾವ ಬೆಳೆಗೆ ಮೊದಲು ನೀರು ಹಾಕಬೇಕು ಎಂದು ಜೈವಿಕ ಸೂಕ್ಷ್ಮತೆ (Ky), ಹಂತದ ಪ್ರಾಮುಖ್ಯತೆ ಮತ್ತು ಮಣ್ಣಿನ ತೇವಾಂಶ ಆಧರಿಸಿ ವೈಜ್ಞಾನಿಕವಾಗಿ ಲೆಕ್ಕಾಚಾರ ಮಾಡುತ್ತದೆ.'
            : 'When water is scarce, Agrova scientifically prioritizes fields by biological yield sensitivity (Ky), growth stage vulnerability, soil moisture depletion, and economic risk to prevent crop loss.'}
        </p>
      </div>

      <!-- Emergency Status Alert Banner -->
      <div class="emergency-status-banner ${emergency.emergencyActive ? 'alert-active' : 'normal-active'}">
        <div class="emergency-banner-content">
          <div class="emergency-banner-info">
            <div class="emergency-banner-tag">
              <i class="fas fa-${emergency.emergencyActive ? 'triangle-exclamation' : 'circle-check'}"></i>
              ${emergency.emergencyActive ? (isKn ? 'ತುರ್ತು ರೇಷನಿಂಗ್ ಮೋಡ್ ಸಕ್ರಿಯ' : 'EMERGENCY RATIONING ACTIVE') : (isKn ? 'ಸಾಮಾನ್ಯ ನೀರಿನ ಲಭ್ಯತೆ' : 'WATER SUPPLY ADEQUATE')}
            </div>
            <div class="emergency-banner-headline">
              ${emergency.emergencyActive
                ? `${emergency.shortageLitres.toLocaleString()} L ${isKn ? 'ನೀರಿನ ಕೊರತೆ ಪತ್ತೆಯಾಗಿದೆ' : 'Water Deficit Detected'} (${emergency.shortageMotorRuntime ? emergency.shortageMotorRuntime.labelEn : ''})`
                : (isKn ? 'ಎಲ್ಲಾ ಹೊಲಗಳಿಗೆ ನೀರು ಸಂಪೂರ್ಣ ಸಾಕಾಗುತ್ತದೆ' : 'Water Supply is Adequate for All Fields')}
            </div>
            <p class="emergency-banner-summary">
              ${isKn ? emergency.recommendationSummaryKn : emergency.recommendationSummaryEn}
            </p>
          </div>

          <div class="emergency-banner-metrics">
            <div class="emergency-metric-block">
              <span class="metric-block-label">${isKn ? 'ಲಭ್ಯವಿರುವ ನೀರು' : 'Water for Allocation'}</span>
              <span class="metric-block-val val-water">~${emergency.availableWaterLitres.toLocaleString()} L</span>
              <span class="metric-block-sub">⏱️ ${emergency.availableMotorRuntime ? emergency.availableMotorRuntime.labelEn : ''} runtime</span>
            </div>
            <div class="emergency-metric-block">
              <span class="metric-block-label">${isKn ? 'ಒಟ್ಟು ಬೆಳೆ ಬೇಡಿಕೆ' : 'Total Crop Demand'}</span>
              <span class="metric-block-val ${emergency.emergencyActive ? 'val-deficit' : 'val-demand'}">~${emergency.totalDemand.toLocaleString()} L</span>
              <span class="metric-block-sub">${emergency.prioritizedFields ? emergency.prioritizedFields.length : 0} active registered fields</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Field-by-Field Prioritization Cards -->
      <div class="emergency-prioritization-section">
        <div class="prioritization-section-header">
          <h3>
            <i class="fas fa-list-ol"></i>
            ${isKn ? 'ಹೊಲಗಳ ವೈಜ್ಞಾನಿಕ ಆದ್ಯತೆ ಮತ್ತು ರೇಷನಿಂಗ್ ಹಂಚಿಕೆ ಪಟ್ಟಿ' : 'Scientific Field Prioritization & Recommended Rationing'}
          </h3>
          <span class="prioritization-count-badge">
            ${emergency.prioritizedFields ? emergency.prioritizedFields.length : 0} ${isKn ? 'ಹೊಲಗಳು' : 'Fields'}
          </span>
        </div>

        ${!emergency.prioritizedFields || emergency.prioritizedFields.length === 0 ? `
          <div class="emergency-empty-fields-card">
            <i class="fas fa-seedling"></i>
            <h4>${isKn ? 'ಯಾವುದೇ ಬೆಳೆ ಹೊಲಗಳು ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿಲ್ಲ' : 'No Crop Fields Registered'}</h4>
            <p>${isKn ? 'ಹೊಲಗಳನ್ನು ನೋಂದಾಯಿಸಲು "ನನ್ನ ಹೊಲಗಳು" ಟ್ಯಾಬ್‌ಗೆ ಹೋಗಿ. ಬೆಳೆಗಳನ್ನು ಸೇರಿಸಿದ ತಕ್ಷಣ ಅಗ್ರೋವಾ ನೀರಿನ ಬೇಡಿಕೆ ಮತ್ತು ತುರ್ತು ರೇಷನಿಂಗ್ ಅನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಿದ್ಧಪಡಿಸುತ್ತದೆ.' : 'Go to "My Fields" tab to add your crops and land area. Once added, Agrova will automatically compute real-time water needs and priority rationing.'}</p>
          </div>
        ` : `
          <div class="priority-fields-list">
            ${emergency.prioritizedFields.map((field, idx) => `
              <div class="priority-field-item rank-${field.rank}">
                <div class="rank-badge rank-${field.rank}">#${field.rank}</div>
                
                <div class="priority-field-col-info">
                  <div class="priority-field-title">${field.fieldName}</div>
                  <div class="priority-field-crop">
                    🌾 ${field.cropName} (${field.requirement.crop.nameKn}) • ${field.stageName}
                  </div>
                  <div class="priority-field-meta">
                    Bio-Sensitivity Ky: <strong>${field.ky}</strong> • Stage: <strong>${field.isCriticalStage ? 'CRITICAL SENSITIVITY' : 'Tolerant'}</strong>
                  </div>
                </div>

                <div class="priority-field-col-urgency">
                  <div class="priority-label">${isKn ? 'ಆದ್ಯತೆ ಮಟ್ಟ' : 'Urgency Level'}</div>
                  <div class="priority-urgency-badge ${field.urgencyScore >= 70 ? 'badge-danger' : (field.urgencyScore >= 50 ? 'badge-warning' : 'badge-safe')}">
                    ${isKn ? field.urgencyKn : field.urgency}
                  </div>
                  <div class="priority-urgency-score">Score: ${field.urgencyScore}/100</div>
                </div>

                <div class="priority-field-col-allocation">
                  <div class="priority-label">${isKn ? 'ಶಿಫಾರಸು ಮೋಟಾರ್ ಸಮಯ' : 'Allocated Motor Time'}</div>
                  <div class="priority-allocated-time">
                    ⏱️ ${isKn ? field.allocatedMotorRuntime.labelKn : field.allocatedMotorRuntime.labelEn}
                  </div>
                  <div class="priority-allocated-status ${field.deficitLitres > 0 ? 'status-deficit' : 'status-fulfilled'}">
                    ${field.deficitLitres > 0
                      ? (isKn ? `-${field.deficitMotorRuntime.labelKn} ಕೊರತೆ (~${field.allocatedLitres.toLocaleString()} L)` : `-${field.deficitMotorRuntime.labelEn} deficit (~${field.allocatedLitres.toLocaleString()} L)`)
                      : (isKn ? `✅ ಪೂರ್ಣ ಪೂರೈಕೆ (~${field.allocatedLitres.toLocaleString()} L)` : `✅ 100% Fulfilled (~${field.allocatedLitres.toLocaleString()} L)`)}
                  </div>
                </div>

                <div class="priority-field-col-inspection">
                  <div class="priority-label">${isKn ? 'ಮುಂದಿನ ಪರಿಶೀಲನೆ' : 'Next Inspection'}</div>
                  <div class="priority-inspection-val">
                    ${isKn ? field.suggestedNextInspectionKn : field.suggestedNextInspection}
                  </div>
                </div>
              </div>

              <!-- Consequence of Delay Box -->
              <div class="priority-consequence-card ${field.urgencyScore >= 70 ? 'consequence-critical' : 'consequence-moderate'}">
                <i class="fas fa-triangle-exclamation"></i>
                <div>
                  <strong>${isKn ? 'ನೀರಾವರಿ ವಿಳಂಬವಾದರೆ ಉಂಟಾಗುವ ಪರಿಣಾಮ:' : 'Consequence of Delaying Irrigation:'}</strong>
                  ${isKn ? field.consequenceKn : field.consequenceEn}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Action Confirmation Box -->
      <div class="emergency-action-box">
        <div class="action-box-text">
          <h4>
            <i class="fas fa-calendar-check" style="color:var(--primary);margin-right:6px;"></i>
            ${isKn ? 'ಈ ತುರ್ತು ಹಂಚಿಕೆಯನ್ನು ನೀರಾವರಿ ವೇಳಾಪಟ್ಟಿಗೆ ಅನ್ವಯಿಸಬೇಕೇ?' : 'Apply this Emergency Allocation to Irrigation Schedule?'}
          </h4>
          <p>
            ${isKn ? 'ಇದು ನಿಮ್ಮ ವೇಳಾಪಟ್ಟಿಯನ್ನು ಹೊಂದಿಸುತ್ತದೆ ಮತ್ತು ಲಭ್ಯವಿರುವ ನೀರನ್ನು ಮೀರದಂತೆ ನಿಯಂತ್ರಿಸುತ್ತದೆ.' : 'This will update your daily irrigation schedule without exceeding available Water Wallet funds.'}
          </p>
        </div>
        <button class="btn btn-primary" id="btnApplyEmergencySchedule">
          <i class="fas fa-check"></i> ${isKn ? 'ತುರ್ತು ವೇಳಾಪಟ್ಟಿ ದೃಢೀಕರಿಸಿ' : 'Confirm & Apply Schedule'}
        </button>
      </div>
    </div>
  `;
}

/**
 * 5. Smart Irrigation Scheduler Tab
 */
function renderSchedulerTab(budget, pumpPlan, isKn) {
  const days = ['Today (Tue)', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'];

  return `
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);margin:0 0 4px;">
            <i class="fas fa-calendar-check" style="color:var(--primary);margin-right:8px;"></i>
            ${isKn ? 'ಸ್ಮಾರ್ಟ್ ನೀರಾವರಿ ವೇಳಾಪಟ್ಟಿ (7-ದಿನಗಳ ಕ್ಯಾಲೆಂಡರ್)' : 'Smart Irrigation Scheduler & Calendar'}
          </h2>
          <p style="font-size:13px;color:var(--text-secondary);margin:0;">
            ${isKn
              ? 'ಬೆಳೆ, ಮಣ್ಣಿನ ತೇವಾಂಶ, ವಿದ್ಯುತ್ ಲಭ್ಯತೆ ಮತ್ತು ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ ಆಧರಿಸಿದ ವೇಳಾಪಟ್ಟಿ.'
              : 'Daily schedule tailored to crop water demand, available electricity slots, and rain forecasts.'}
          </p>
        </div>
        <button class="btn btn-primary" id="btnScheduleComplete">
          <i class="fas fa-circle-check"></i> ${isKn ? 'ಇಂದಿನ ನೀರಾವರಿ ಮುಗಿದಿದೆ' : 'Mark Today Completed'}
        </button>
      </div>

      <!-- Weekly Schedule Grid -->
      <div style="display:grid;grid-template-columns:repeat(7, 1fr);gap:10px;margin-bottom:24px;overflow-x:auto;">
        ${days.map((day, idx) => {
          const isToday = idx === 0;
          const hasEvent = idx % 2 === 0; // Every 2 days
          const field = irrigationState.fields[idx % irrigationState.fields.length];

          return `
            <div style="background:var(--bg-card);border:1px solid ${isToday ? 'var(--water-blue-light)' : 'var(--border-color)'};border-radius:var(--border-radius);padding:14px;min-width:130px;text-align:center;">
              <div style="font-size:12px;font-weight:700;color:${isToday ? 'var(--water-blue-light)' : 'var(--text-muted)'};margin-bottom:8px;">
                ${day}
              </div>

              ${hasEvent ? `
                <div style="background:rgba(2,132,199,0.15);border:1px solid rgba(56,189,248,0.3);border-radius:8px;padding:8px 6px;margin-bottom:6px;">
                  <div style="font-size:11px;font-weight:700;color:#38bdf8;">
                    ${field ? field.name : 'Field A'}
                  </div>
                  <div style="font-size:12px;font-weight:800;color:#fff;margin:4px 0;">
                    ${field ? (field.cropId === 'tomato' ? '12,000 L' : '15,000 L') : '10,000 L'}
                  </div>
                  <div style="font-size:10px;color:var(--text-muted);">
                    <i class="fas fa-clock"></i> 6:30 - 8:30 AM
                  </div>
                </div>
                <span style="font-size:10px;color:var(--primary);font-weight:600;">
                  <i class="fas fa-faucet"></i> Scheduled
                </span>
              ` : `
                <div style="color:var(--text-muted);font-size:11px;padding:24px 0;">
                  Rest Day / Moisture Retained
                </div>
              `}
            </div>
          `;
        }).join('')}
      </div>

      <!-- Today's Action Checklist -->
      <div class="wallet-budget-card">
        <h3 style="font-size:16px;font-weight:700;margin-bottom:12px;">
          ${isKn ? 'ಇಂದಿನ ನೀರಾವರಿ ಕ್ರಿಯಾ ಯೋಜನೆ (Today\'s Action Plan)' : 'Today\'s Irrigation Action Plan'}
        </h3>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:rgba(15,23,42,0.5);border-radius:8px;margin-bottom:10px;flex-wrap:wrap;gap:12px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <input type="checkbox" id="checkIrrigToday" style="width:18px;height:18px;cursor:pointer;">
            <div>
              <div style="font-size:14px;font-weight:700;color:var(--text-primary);">
                Field A (Tomato - 1 Acre) • Flowering Stage Drip Cycle
              </div>
              <div style="font-size:12px;color:var(--text-secondary);">
                Target: 12,000 Litres • Pump Runtime: 1h 00m • Power Slot: 06:00 - 10:00 AM
              </div>
            </div>
          </div>
          <button class="btn btn-sm btn-primary" id="btnLogTodayAction">
            ${isKn ? 'ಖಾತೆಗೆ ದಾಖಲಿಸಿ (Deduct from Wallet)' : 'Log & Deduct Water'}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 6. Water Requirement Calculator Tab (FAO-56 Interactive)
 */
function renderCalculatorTab(isKn) {
  const c = irrigationState.calcInput;
  const result = calculateCropWaterRequirement({
    cropId: c.cropId,
    stageKey: c.stageKey,
    areaValue: c.area,
    areaAcres: c.areaAcres !== undefined ? c.areaAcres : c.area,
    areaGuntas: c.areaGuntas || 0,
    areaUnit: 'acre',
    et0_mm: c.et0,
    irrigationMethodId: c.irrigationMethod,
    soilId: c.soilType,
    recentRainfall_mm: c.recentRain,
    soilMoisturePercent: c.soilMoisture,
    flowRateLph: irrigationState.pump.flowRateLph
  });

  return `
    <div>
      <div style="margin-bottom:20px;">
        <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);margin:0 0 4px;">
          <i class="fas fa-calculator" style="color:var(--primary);margin-right:8px;"></i>
          ${isKn ? 'ಸ್ಮಾರ್ಟ್ ಬೆಳೆ ನೀರು ಬೇಡಿಕೆ ಕ್ಯಾಲ್ಕುಲೇಟರ್ (ಎಕರೆ & ಗುಂಟೆ)' : 'FAO-56 Smart Water Requirement Calculator (Acres & Guntas)'}
        </h2>
        <p style="font-size:13px;color:var(--text-secondary);margin:0;">
          ${isKn
            ? 'ಎಫ್‌ಎಒ-56 ಮಾನದಂಡಗಳ ಆಧಾರದ ಮೇಲೆ ಬೆಳೆಯ ನೀರಾವರಿ ಬೇಡಿಕೆ ಮತ್ತು ಅಗತ್ಯವಿರುವ ಮೋಟಾರ್ ಚಾಲನಾ ಸಮಯವನ್ನು ಲೆಕ್ಕಾಚಾರ ಮಾಡಿ.'
            : 'Scientific calculation using FAO-56 Penman-Monteith crop evapotranspiration, displayed in motor running time and guntas.'}
        </p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <!-- Input Form Card -->
        <div class="wallet-budget-card">
          <h3 style="font-size:15px;font-weight:700;margin-bottom:16px;">
            ${isKn ? 'ಬೆಳೆ ಮತ್ತು ಹೊಲದ ವಿವರಗಳು' : 'Field & Meteorological Inputs'}
          </h3>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="irr-form-group">
              <label>${isKn ? 'ಬೆಳೆ' : 'Crop'}</label>
              <select class="irr-form-control" id="calcCrop">
                ${Object.values(CROP_IRRIGATION_PROFILES).map(crop => `
                  <option value="${crop.id}" ${crop.id === c.cropId ? 'selected' : ''}>
                    ${crop.nameEn} (${crop.nameKn})
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="irr-form-group">
              <label>${isKn ? 'ಬೆಳವಣಿಗೆಯ ಹಂತ' : 'Growth Stage'}</label>
              <select class="irr-form-control" id="calcStage">
                ${Object.entries(result.crop.stages).map(([k, s]) => `
                  <option value="${k}" ${k === c.stageKey ? 'selected' : ''}>
                    ${isKn ? s.labelKn : s.labelEn} (Kc: ${s.kc})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Land Area in Acres & Guntas -->
          <div style="background:rgba(15,23,42,0.5);border:1px solid var(--card-border-navy);border-radius:8px;padding:12px;margin-bottom:14px;">
            <label style="display:block;font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:8px;">
              <i class="fas fa-ruler-combined" style="color:var(--primary);"></i> ${isKn ? 'ಹೊಲದ ವಿಸ್ತೀರ್ಣ (ಎಕರೆ ಮತ್ತು ಗುಂಟೆ)' : 'Land Area (Acres & Guntas)'}
            </label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="irr-form-group" style="margin-bottom:0;">
                <label style="font-size:11px;color:var(--text-muted);">${isKn ? 'ಎಕರೆ (Acres)' : 'Acres'}</label>
                <input type="number" min="0" step="1" class="irr-form-control" id="calcAreaAcres" value="${c.areaAcres !== undefined ? c.areaAcres : Math.floor(c.area || 1)}">
              </div>
              <div class="irr-form-group" style="margin-bottom:0;">
                <label style="font-size:11px;color:var(--text-muted);">${isKn ? 'ಗುಂಟೆ (Guntas 0-39)' : 'Guntas (0-39)'}</label>
                <input type="number" min="0" max="39" step="1" class="irr-form-control" id="calcAreaGuntas" value="${c.areaGuntas || 0}">
              </div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="irr-form-group">
              <label>${isKn ? 'ಮಣ್ಣಿನ ವಿಧ' : 'Soil Type'}</label>
              <select class="irr-form-control" id="calcSoil">
                ${Object.values(SOIL_PROPERTIES).map(s => `
                  <option value="${s.id}" ${s.id === c.soilType ? 'selected' : ''}>${s.nameEn} (${s.nameKn})</option>
                `).join('')}
              </select>
            </div>

            <div class="irr-form-group">
              <label>${isKn ? 'ನೀರಾವರಿ ವಿಧಾನ' : 'Irrigation Method'}</label>
              <select class="irr-form-control" id="calcMethod">
                ${Object.values(IRRIGATION_METHODS).map(m => `
                  <option value="${m.id}" ${m.id === c.irrigationMethod ? 'selected' : ''}>${m.nameEn} (${m.nameKn} - ${Math.round(m.efficiency * 100)}%)</option>
                `).join('')}
              </select>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
            <div class="irr-form-group">
              <label>Ref. ET0 (mm/day)</label>
              <input type="number" step="0.1" class="irr-form-control" id="calcEt0" value="${c.et0}">
            </div>
            <div class="irr-form-group">
              <label>${isKn ? 'ಮಳೆ (mm)' : 'Recent Rain (mm)'}</label>
              <input type="number" step="1" class="irr-form-control" id="calcRain" value="${c.recentRain}">
            </div>
            <div class="irr-form-group">
              <label>${isKn ? 'ತೇವಾಂಶ (%)' : 'Soil Moisture (%)'}</label>
              <input type="number" step="1" class="irr-form-control" id="calcMoisture" value="${c.soilMoisture}">
            </div>
          </div>
        </div>

        <!-- Calculated Result Card -->
        <div class="wallet-budget-card" style="border-color:var(--water-blue-light);">
          <h3 style="font-size:15px;font-weight:700;color:var(--water-blue-light);margin-bottom:16px;">
            <i class="fas fa-square-poll-vertical"></i> ${isKn ? 'ಲೆಕ್ಕಾಚಾರದ ಫಲಿತಾಂಶ (ಮೋಟಾರ್ ಚಾಲನೆ)' : 'Calculation Results (Motor Runtime)'}
          </h3>

          <div style="background:rgba(2,132,199,0.1);padding:16px;border-radius:8px;border:1px solid var(--water-blue-border);margin-bottom:16px;">
            <div style="font-size:12px;color:var(--text-muted);">${isKn ? 'ಪ್ರತಿ ನೀರಾವರಿಗೆ ಅಗತ್ಯವಿರುವ ಮೋಟಾರ್ ಸಮಯ' : 'Single Irrigation Event Runtime'}</div>
            <div style="font-size:26px;font-weight:800;color:#fff;margin:4px 0;">
              ⏱️ ${isKn ? result.perEventMotorRuntime.labelKn : result.perEventMotorRuntime.labelEn}
            </div>
            <div style="font-size:12px;color:var(--text-secondary);">
              ${isKn ? 'ದೈನಂದಿನ ಅಗತ್ಯ:' : 'Daily Requirement:'} <strong>${isKn ? result.dailyMotorRuntime.labelKn : result.dailyMotorRuntime.labelEn}</strong> • <span style="opacity:0.8;">(~${result.perEventGrossLitres.toLocaleString()} L / cycle)</span>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
            <div style="background:rgba(15,23,42,0.5);padding:12px;border-radius:8px;">
              <div style="font-size:11px;color:var(--text-muted);">${isKn ? 'ನೀರಾವರಿ ಅಂತರ' : 'Irrigation Interval'}</div>
              <div style="font-size:18px;font-weight:800;color:var(--text-primary);margin-top:2px;">
                ${isKn ? `ಪ್ರತಿ ${result.irrigationIntervalDays} ದಿನಕ್ಕೊಮ್ಮೆ` : `Every ${result.irrigationIntervalDays} days`}
              </div>
              <div style="font-size:10px;color:var(--text-muted);">Based on soil water capacity</div>
            </div>

            <div style="background:rgba(15,23,42,0.5);padding:12px;border-radius:8px;">
              <div style="font-size:11px;color:var(--text-muted);">${isKn ? 'ಪದ್ಧತಿ ದಕ್ಷತೆ & ವಿಸ್ತೀರ್ಣ' : 'Method Efficiency'}</div>
              <div style="font-size:18px;font-weight:800;color:var(--primary);margin-top:2px;">
                ${Math.round(result.efficiency * 100)}%
              </div>
              <div style="font-size:10px;color:var(--text-muted);">${isKn ? result.farmerArea.labelKn : result.farmerArea.labelEn} (${result.areaSqm.toLocaleString()} m²)</div>
            </div>
          </div>

          <!-- Formula & Assumptions Box -->
          <div style="background:rgba(15,23,42,0.6);border:1px solid var(--border-color);border-radius:8px;padding:12px;font-size:11px;color:var(--text-muted);line-height:1.6;">
            <strong>FAO-56 Formula Used:</strong><br>
            • ETc = ET0 (${result.et0_mm} mm) × Kc (${result.kc}) = ${result.dailyETc_mm} mm/day<br>
            • Gross Depth = Net Depth / Efficiency (${Math.round(result.efficiency * 100)}%) = ${result.grossDepth_mm} mm<br>
            • Volume = Depth × Area (${result.areaSqm} m²) = <strong>${result.dailyGrossLitres.toLocaleString()} L/day</strong><br>
            • Motor Runtime = Volume / Calibrated Flow Rate (~12,000 L/hr) = <strong>${result.dailyMotorRuntime.labelEn}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 7. Weather Intelligence Tab
 */
function renderWeatherIntelligenceTab(weather, isKn) {
  return `
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);margin:0 0 4px;">
            <i class="fas fa-cloud-sun-rain" style="color:var(--water-blue-light);margin-right:8px;"></i>
            ${isKn ? 'ಹವಾಮಾನ ಮತ್ತು ನೀರಾವರಿ ಬುದ್ಧಿಮತ್ತೆ' : 'Weather Intelligence & Rain Advisory'}
          </h2>
          <p style="font-size:13px;color:var(--text-secondary);margin:0;">
            ${isKn
              ? 'ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ ಮತ್ತು ಮಳೆಯ ಸಾಧ್ಯತೆಯ ಆಧಾರದ ಮೇಲೆ ನೀರಾವರಿಯನ್ನು ಹೊಂದಿಸಿ.'
              : 'Real-time weather data and 7-day evapotranspiration forecasts to prevent unnecessary pumping.'}
          </p>
        </div>
        <button class="btn btn-primary" id="btnLogManualRain">
          <i class="fas fa-cloud-rain"></i> ${isKn ? 'ಬಿದ್ದ ಮಳೆ ದಾಖಲಿಸಿ' : 'Record Actual Rain (mm)'}
        </button>
      </div>

      <!-- Current Weather Status -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px;">
        <div class="irr-summary-card">
          <div class="irr-card-top">
            <span class="irr-card-label">Current Temperature</span>
            <div class="irr-card-icon icon-amber"><i class="fas fa-temperature-half"></i></div>
          </div>
          <div class="irr-card-val">${weather.temp}°C</div>
          <div class="irr-card-sub">${weather.condition}</div>
        </div>

        <div class="irr-summary-card">
          <div class="irr-card-top">
            <span class="irr-card-label">Relative Humidity</span>
            <div class="irr-card-icon icon-blue"><i class="fas fa-tint"></i></div>
          </div>
          <div class="irr-card-val">${weather.humidity}%</div>
          <div class="irr-card-sub">Higher humidity reduces ETc demand</div>
        </div>

        <div class="irr-summary-card">
          <div class="irr-card-top">
            <span class="irr-card-label">Wind Velocity</span>
            <div class="irr-card-icon icon-cyan"><i class="fas fa-wind"></i></div>
          </div>
          <div class="irr-card-val">${weather.wind} km/h</div>
          <div class="irr-card-sub">Affects sprinkler drift efficiency</div>
        </div>

        <div class="irr-summary-card">
          <div class="irr-card-top">
            <span class="irr-card-label">Daily ET0 Index</span>
            <div class="irr-card-icon icon-green"><i class="fas fa-sun"></i></div>
          </div>
          <div class="irr-card-val">4.8 mm/day</div>
          <div class="irr-card-sub">Reference evapotranspiration (FAO)</div>
        </div>
      </div>

      <!-- 7-Day Forecast Cards -->
      <h3 style="font-size:16px;font-weight:700;margin-bottom:12px;">7-Day Weather Forecast & Rain Risk</h3>
      <div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:12px;margin-bottom:24px;">
        ${weather.forecast.map(d => `
          <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--border-radius);padding:14px;text-align:center;">
            <div style="font-size:13px;font-weight:700;color:var(--text-primary);">${d.day}</div>
            <div style="font-size:26px;margin:8px 0;">${d.icon}</div>
            <div style="font-size:14px;font-weight:700;color:var(--text-primary);">${d.high}° / ${d.low}°</div>
            <div style="font-size:12px;color:var(--water-blue-light);margin-top:4px;">
              <i class="fas fa-droplet"></i> Rain: ${d.rain} mm
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * 8. Soil Moisture Monitoring & IoT Tab
 */
function renderSoilMoistureTab(isKn) {
  const s = irrigationState.sensors;

  return `
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);margin:0 0 4px;">
            <i class="fas fa-wave-square" style="color:var(--primary);margin-right:8px;"></i>
            ${isKn ? 'ಮಣ್ಣಿನ ತೇವಾಂಶ ಮತ್ತು IoT ಸಂವೇದಕಗಳು' : 'Soil Moisture Monitoring & IoT Sensors'}
          </h2>
          <p style="font-size:13px;color:var(--text-secondary);margin:0;">
            ${isKn
              ? 'ಮ್ಯಾನುಯಲ್ ನಮೂದು ಅಥವಾ ನೈಜ/ಸಿಮ್ಯುಲೇಟೆಡ್ IoT ಮಣ್ಣಿನ ಸೆನ್ಸಾರ್ ಮಾಹಿತಿ.'
              : 'Mode A: Manual farmer entry. Mode B: Optional IoT moisture telemetry & flow meters.'}
          </p>
        </div>
        <button class="btn btn-primary" id="btnRecordSoilMoisture">
          <i class="fas fa-pen"></i> ${isKn ? 'ಮಣ್ಣಿನ ತೇವಾಂಶ ದಾಖಲಿಸಿ' : 'Log Soil Moisture'}
        </button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
        <!-- Mode A: Manual Entry Display -->
        <div class="wallet-budget-card">
          <h3 style="font-size:16px;font-weight:700;margin-bottom:12px;">
            <i class="fas fa-hand-holding-droplet" style="color:var(--primary);margin-right:6px;"></i>
            Mode A: Manual Soil Condition
          </h3>
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">
            Farmers without electronic sensors can record soil feel (Dry, Moist, Saturated) to adjust irrigation doses.
          </p>

          <div style="display:flex;flex-direction:column;gap:12px;">
            ${irrigationState.fields.map(f => `
              <div style="background:rgba(15,23,42,0.5);padding:12px 16px;border-radius:8px;display:flex;align-items:center;justify-content:space-between;">
                <div>
                  <div style="font-size:14px;font-weight:700;color:var(--text-primary);">${f.name} (${f.cropId})</div>
                  <div style="font-size:12px;color:var(--text-muted);">Root depth: 30-50 cm</div>
                </div>
                <div style="text-align:right;">
                  <span style="font-size:18px;font-weight:800;color:${f.soilMoisture < 40 ? '#f87171' : 'var(--primary)'};">
                    ${f.soilMoisture || 40}%
                  </span>
                  <div style="font-size:11px;color:var(--text-muted);">
                    ${f.soilMoisture < 40 ? 'Depleted (Water Needed)' : 'Optimal Moisture'}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Mode B: IoT Integration -->
        <div class="wallet-budget-card" style="border-color:${s.deviceConnected ? 'var(--primary)' : 'var(--border-color)'};">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <h3 style="font-size:16px;font-weight:700;">
              <i class="fas fa-tower-broadcast" style="color:var(--water-blue-light);margin-right:6px;"></i>
              Mode B: IoT Telemetry
            </h3>
            <span style="padding:3px 8px;border-radius:10px;font-size:11px;font-weight:700;background:${s.deviceConnected ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.2)'};color:${s.deviceConnected ? '#4ade80' : '#94a3b8'};">
              ${s.deviceConnected ? 'CONNECTED' : 'DISCONNECTED / STANDALONE'}
            </span>
          </div>

          <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">
            *Notice: Agrova never displays fake connected status. You can toggle test telemetry below.
          </p>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
            <div style="background:rgba(15,23,42,0.5);padding:12px;border-radius:8px;">
              <div style="font-size:11px;color:var(--text-muted);">Sensor Reading</div>
              <div style="font-size:20px;font-weight:800;color:var(--water-blue-light);margin-top:2px;">
                ${s.soilMoistureReading}%
              </div>
              <div style="font-size:10px;color:var(--text-muted);">Depth: ${s.depthCm} cm</div>
            </div>

            <div style="background:rgba(15,23,42,0.5);padding:12px;border-radius:8px;">
              <div style="font-size:11px;color:var(--text-muted);">Tank Level Sensor</div>
              <div style="font-size:20px;font-weight:800;color:#fff;margin-top:2px;">
                ${s.waterLevelMeterLitres.toLocaleString()} L
              </div>
              <div style="font-size:10px;color:var(--text-muted);">Ultrasonic telemetry</div>
            </div>
          </div>

          <button class="btn btn-secondary" id="btnToggleIoTSim" style="width:100%;background:rgba(15,23,42,0.7);border:1px solid var(--border-color);color:var(--text-primary);">
            <i class="fas fa-satellite-dish"></i> ${s.deviceConnected ? 'Disconnect IoT Device' : 'Simulate IoT Sensor Stream'}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 9. Smart Pump & Electricity Planner Tab
 */
function renderPumpPlannerTab(budget, pumpPlan, isKn) {
  return `
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);margin:0 0 4px;">
            <i class="fas fa-bolt" style="color:var(--primary);margin-right:8px;"></i>
            ${isKn ? 'ಸ್ಮಾರ್ಟ್ ಪಂಪ್ ಮತ್ತು ವಿದ್ಯುತ್ ಯೋಜಕ' : 'Smart Pump & Electricity Planner'}
          </h2>
          <p style="font-size:13px;color:var(--text-secondary);margin:0;">
            ${isKn
              ? 'ಕೃಷಿ ವಿದ್ಯುತ್ ಸರಬರಾಜು ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ಪಂಪ್ ಸಾಮರ್ಥ್ಯಕ್ಕೆ ತಕ್ಕಂತೆ ನೀರಾವರಿ ಆಯೋಜಿಸಿ.'
              : 'Fit planned irrigation runtime into 3-phase electricity hours (e.g. BESCOM/CHESCOM 6 AM - 10 AM).'}
          </p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <!-- Pump Parameters Form -->
        <div class="wallet-budget-card">
          <h3 style="font-size:15px;font-weight:700;margin-bottom:16px;">
            ${isKn ? 'ಪಂಪ್ ಮತ್ತು ವಿದ್ಯುತ್ ವಿವರಗಳು' : 'Pump & Energy Parameters'}
          </h3>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="irr-form-group">
              <label>${isKn ? 'ಪಂಪ್ ಸಾಮರ್ಥ್ಯ (HP)' : 'Pump Power (HP)'}</label>
              <input type="number" step="0.5" class="irr-form-control" id="pumpHp" value="${irrigationState.pump.hp}">
            </div>

            <div class="irr-form-group">
              <label>${isKn ? 'ನೀರಿನ ಹರಿವು (L/ಗಂಟೆಗೆ)' : 'Measured Flow (L/Hour)'}</label>
              <input type="number" step="1000" class="irr-form-control" id="pumpFlow" value="${irrigationState.pump.flowRateLph}">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="irr-form-group">
              <label>${isKn ? 'ವಿದ್ಯುತ್ ಆರಂಭದ ಸಮಯ' : 'Power Start Hour'}</label>
              <select class="irr-form-control" id="pumpStartHour">
                ${Array.from({ length: 24 }).map((_, i) => `
                  <option value="${i}" ${i === irrigationState.pump.electricityStartHour ? 'selected' : ''}>
                    ${String(i).padStart(2, '0')}:00
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="irr-form-group">
              <label>${isKn ? 'ವಿದ್ಯುತ್ ಮುಕ್ತಾಯದ ಸಮಯ' : 'Power End Hour'}</label>
              <select class="irr-form-control" id="pumpEndHour">
                ${Array.from({ length: 24 }).map((_, i) => `
                  <option value="${i}" ${i === irrigationState.pump.electricityEndHour ? 'selected' : ''}>
                    ${String(i).padStart(2, '0')}:00
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="irr-form-group">
              <label>${isKn ? 'ವಿದ್ಯುತ್ ದರ (₹/ಯೂನಿಟ್)' : 'Tariff (₹/kWh)'}</label>
              <input type="number" step="0.5" class="irr-form-control" id="pumpTariff" value="${irrigationState.pump.tariffPerKwh}">
            </div>

            <div class="irr-form-group">
              <label>${isKn ? 'ವಿದ್ಯುತ್ ಮೂಲ' : 'Power Source'}</label>
              <select class="irr-form-control" id="pumpPowerSource">
                <option value="electricity" ${irrigationState.pump.powerSource === 'electricity' ? 'selected' : ''}>Electricity (Grid)</option>
                <option value="diesel" ${irrigationState.pump.powerSource === 'diesel' ? 'selected' : ''}>Diesel Engine</option>
              </select>
            </div>
          </div>

          <button class="btn btn-primary" id="btnSavePumpSettings" style="width:100%;margin-top:10px;">
            <i class="fas fa-save"></i> ${isKn ? 'ಪಂಪ್ ಸೆಟ್ಟಿಂಗ್ಸ್ ಉಳಿಸಿ' : 'Save Pump Configuration'}
          </button>
        </div>

        <!-- Calculated Feasibility Card -->
        <div class="wallet-budget-card" style="border-color:${pumpPlan.fitsInWindow ? 'var(--primary)' : 'var(--emergency-amber)'};">
          <h3 style="font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:16px;">
            ${isKn ? 'ವೇಳಾಪಟ್ಟಿ ಸಾಧ್ಯತೆಯ ವಿಶ್ಲೇಷಣೆ' : 'Feasibility & Energy Analysis'}
          </h3>

          <div style="background:rgba(15,23,42,0.5);padding:14px;border-radius:8px;margin-bottom:14px;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:13px;color:var(--text-muted);">${isKn ? 'ವಿದ್ಯುತ್ ಲಭ್ಯತೆ ಕಿಟಕಿ' : 'Power Window'}</span>
              <span style="font-size:14px;font-weight:700;color:var(--text-primary);">${pumpPlan.windowLabel}</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
              <span style="font-size:13px;color:var(--text-muted);">${isKn ? 'ಅಗತ್ಯವಿರುವ ಪಂಪ್ ಸಮಯ' : 'Required Runtime'}</span>
              <span style="font-size:16px;font-weight:800;color:var(--water-blue-light);">${pumpPlan.formattedRuntime}</span>
            </div>
          </div>

          <div style="background:${pumpPlan.fitsInWindow ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.15)'};border:1px solid ${pumpPlan.fitsInWindow ? 'rgba(34,197,94,0.3)' : '#f59e0b'};border-radius:8px;padding:14px;margin-bottom:16px;">
            <div style="font-size:14px;font-weight:800;color:${pumpPlan.fitsInWindow ? 'var(--primary)' : '#fef08a'};">
              ${pumpPlan.fitsInWindow
                ? (isKn ? '✓ ವೇಳಾಪಟ್ಟಿ ಹೊಂದಾಣಿಕೆಯಾಗುತ್ತದೆ' : '✓ Irrigation Fits Within Power Window')
                : (isKn ? '⚠️ ವಿದ್ಯುತ್ ಸಮಯ ಸಾಕಾಗುವುದಿಲ್ಲ' : '⚠️ Schedule Conflict: Insufficient Power Window')}
            </div>
            <p style="font-size:12px;color:var(--text-secondary);margin:4px 0 0;">
              ${pumpPlan.fitsInWindow
                ? `Pumping ${pumpPlan.targetLitres.toLocaleString()} L takes ${pumpPlan.formattedRuntime}, easily finishing before the ${pumpPlan.availableWindowHours}h window ends.`
                : `You need ${pumpPlan.deficitHours} more hours of power. Consider splitting into two cycles or throttling flow.`}
            </p>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div style="background:rgba(15,23,42,0.5);padding:12px;border-radius:8px;">
              <div style="font-size:11px;color:var(--text-muted);">Energy Consumed</div>
              <div style="font-size:18px;font-weight:800;color:var(--text-primary);margin-top:2px;">
                ${pumpPlan.energyKwh} kWh
              </div>
            </div>
            <div style="background:rgba(15,23,42,0.5);padding:12px;border-radius:8px;">
              <div style="font-size:11px;color:var(--text-muted);">Cost Per Cycle</div>
              <div style="font-size:18px;font-weight:800;color:var(--primary);margin-top:2px;">
                ₹${pumpPlan.estimatedCost}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 10. Irrigation Cost Calculator Tab
 */
function renderCostCalculatorTab(budget, pumpPlan, isKn) {
  const econ = calculateIrrigationEconomics({
    pumpingCostPerEvent: pumpPlan.estimatedCost || 120,
    labourCostPerEvent: 250,
    waterPurchaseCost: 0,
    otherCost: 50,
    eventsPerWeek: 2,
    weeksInSeason: 16,
    totalAcres: 2.0
  });

  return `
    <div>
      <div style="margin-bottom:20px;">
        <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);margin:0 0 4px;">
          <i class="fas fa-indian-rupee-sign" style="color:var(--primary);margin-right:8px;"></i>
          ${isKn ? 'ನೀರಾವರಿ ವೆಚ್ಚ ಲೆಕ್ಕಾಚಾರ' : 'Comprehensive Irrigation Cost Calculator'}
        </h2>
        <p style="font-size:13px;color:var(--text-secondary);margin:0;">
          ${isKn
            ? 'ವಿದ್ಯುತ್, ಡೀಸೆಲ್, ಕೂಲಿ ಮತ್ತು ನಿರ್ವಹಣಾ ವೆಚ್ಚಗಳನ್ನು ಎಕರೆಗೆ ಮತ್ತು ಋತುವಿಗೆ ಲೆಕ್ಕ ಹಾಕಿ.'
            : 'Detailed financial breakdown of pumping, labor, maintenance, and seasonal irrigation expenditures in Indian Rupees (₹).'}
        </p>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px;">
        <div class="irr-summary-card">
          <div class="irr-card-top">
            <span class="irr-card-label">Cost Per Event</span>
            <div class="irr-card-icon icon-blue"><i class="fas fa-receipt"></i></div>
          </div>
          <div class="irr-card-val">₹${econ.costPerEvent}</div>
          <div class="irr-card-sub">Per irrigation cycle</div>
        </div>

        <div class="irr-summary-card">
          <div class="irr-card-top">
            <span class="irr-card-label">Weekly Cost</span>
            <div class="irr-card-icon icon-cyan"><i class="fas fa-calendar-week"></i></div>
          </div>
          <div class="irr-card-val">₹${econ.weeklyCost}</div>
          <div class="irr-card-sub">At 2 cycles per week</div>
        </div>

        <div class="irr-summary-card">
          <div class="irr-card-top">
            <span class="irr-card-label">Seasonal Total</span>
            <div class="irr-card-icon icon-green"><i class="fas fa-wallet"></i></div>
          </div>
          <div class="irr-card-val">₹${econ.seasonalCost.toLocaleString()}</div>
          <div class="irr-card-sub">Full 16-week crop season</div>
        </div>

        <div class="irr-summary-card">
          <div class="irr-card-top">
            <span class="irr-card-label">Cost Per Acre</span>
            <div class="irr-card-icon icon-purple"><i class="fas fa-chart-pie"></i></div>
          </div>
          <div class="irr-card-val">₹${econ.costPerAcrePerSeason.toLocaleString()}</div>
          <div class="irr-card-sub">Per acre seasonal expense</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 11. Water Savings & History Tracker Tab
 */
function renderSavingsHistoryTab(budget, isKn) {
  return `
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);margin:0 0 4px;">
            <i class="fas fa-chart-line" style="color:var(--primary);margin-right:8px;"></i>
            ${isKn ? 'ನೀರಿನ ಉಳಿತಾಯ ಮತ್ತು ಇತಿಹಾಸ' : 'Water Savings & Historical Records'}
          </h2>
          <p style="font-size:13px;color:var(--text-secondary);margin:0;">
            ${isKn
              ? 'ಹಿಂದಿನ ನೀರಾವರಿ ಘಟನೆಗಳು, ಉಳಿಸಿದ ನೀರಿನ ಪ್ರಮಾಣ ಮತ್ತು ಸಿಎಸ್‌ವಿ ವರದಿ.'
              : 'Log of recorded irrigation events with water saved vs flood irrigation baseline.'}
          </p>
        </div>
        <button class="btn btn-primary" id="btnExportCSV">
          <i class="fas fa-file-csv"></i> ${isKn ? 'ವರದಿ ಡೌನ್‌ಲೋಡ್ (CSV)' : 'Export CSV Report'}
        </button>
      </div>

      <!-- History Table -->
      <div class="wallet-budget-card">
        <h3 style="font-size:15px;font-weight:700;margin-bottom:16px;">
          ${isKn ? 'ಕಳೆದ ನೀರಾವರಿ ಇತಿಹಾಸ' : 'Irrigation Activity Log'}
        </h3>

        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left;">
            <thead>
              <tr style="border-bottom:1px solid var(--border-color);color:var(--text-muted);">
                <th style="padding:10px 12px;">Date</th>
                <th style="padding:10px 12px;">Field</th>
                <th style="padding:10px 12px;">Water Used (L)</th>
                <th style="padding:10px 12px;">Duration</th>
                <th style="padding:10px 12px;">Method</th>
                <th style="padding:10px 12px;">Cost (₹)</th>
                <th style="padding:10px 12px;">Notes</th>
              </tr>
            </thead>
            <tbody>
              ${irrigationState.history.map(item => `
                <tr style="border-bottom:1px solid rgba(51,65,85,0.4);">
                  <td style="padding:12px;font-weight:700;color:var(--text-primary);">${item.date}</td>
                  <td style="padding:12px;color:var(--water-blue-light);">${item.fieldName}</td>
                  <td style="padding:12px;font-weight:700;">${item.litresUsed.toLocaleString()} L</td>
                  <td style="padding:12px;">${item.durationMinutes} mins</td>
                  <td style="padding:12px;">${item.method}</td>
                  <td style="padding:12px;color:var(--primary);">₹${item.pumpCost}</td>
                  <td style="padding:12px;color:var(--text-muted);font-size:12px;">${item.notes}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * 12. Irrigation Method Comparison Tab (Drip vs Sprinkler vs Flood)
 */
function renderMethodComparisonTab(isKn) {
  const comp = compareIrrigationMethods({ cropId: 'tomato', areaAcres: 2.0 });

  return `
    <div>
      <div style="margin-bottom:20px;">
        <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);margin:0 0 4px;">
          <i class="fas fa-scale-balanced" style="color:var(--primary);margin-right:8px;"></i>
          ${isKn ? 'ಹನಿ vs ತುಂತುರು vs ಹರಿವು ನೀರಾವರಿ ಪದ್ಧತಿಗಳ ಹೋಲಿಕೆ' : 'Drip vs Sprinkler vs Flood Irrigation Comparison'}
        </h2>
        <p style="font-size:13px;color:var(--text-secondary);margin:0;">
          ${isKn
            ? 'ನೀರಿನ ದಕ್ಷತೆ, ಉಪಕರಣ ವೆಚ್ಚ, ಸರ್ಕಾರಿ ಸಬ್ಸಿಡಿ (PMKSY) ಮತ್ತು ಮರುಪಾವತಿ ಅವಧಿಯ ವಸ್ತುನಿಷ್ಠ ಹೋಲಿಕೆ.'
            : 'Comparative economics, water application efficiency, and government subsidy under PMKSY (Per Drop More Crop).'}
        </p>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:18px;margin-bottom:24px;">
        ${comp.methods.map(m => `
          <div class="wallet-budget-card" style="border-color:${m.id === 'drip' ? 'var(--primary)' : 'var(--border-color)'};position:relative;">
            ${m.id === 'drip' ? `
              <span style="position:absolute;top:14px;right:16px;background:var(--primary);color:#fff;font-size:10px;font-weight:800;padding:2px 8px;border-radius:10px;">
                RECOMMENDED
              </span>
            ` : ''}

            <h3 style="font-size:16px;font-weight:800;color:var(--text-primary);margin-bottom:4px;">
              ${m.nameEn}
            </h3>
            <div style="font-size:12px;color:var(--water-blue-light);font-weight:600;margin-bottom:14px;">
              ${m.nameKn}
            </div>

            <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;">
              <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(51,65,85,0.4);padding-bottom:6px;">
                <span style="color:var(--text-muted);">Water Efficiency:</span>
                <strong style="color:var(--primary);font-size:15px;">${m.efficiencyPercent}%</strong>
              </div>
              <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(51,65,85,0.4);padding-bottom:6px;">
                <span style="color:var(--text-muted);">Seasonal Water:</span>
                <strong>${m.grossWaterNeededLitres.toLocaleString()} L</strong>
              </div>
              <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(51,65,85,0.4);padding-bottom:6px;">
                <span style="color:var(--text-muted);">Govt Subsidy:</span>
                <strong style="color:var(--water-blue-light);">${m.subsidyPercent}% (PMKSY)</strong>
              </div>
              <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(51,65,85,0.4);padding-bottom:6px;">
                <span style="color:var(--text-muted);">Net Farmer Cost:</span>
                <strong>₹${m.netFarmerInvestment.toLocaleString()}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;padding-top:4px;">
                <span style="color:var(--text-muted);">Operating Cost:</span>
                <strong>₹${m.totalOperatingCost.toLocaleString()} / season</strong>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Modals Renderer
 */
function renderActiveModal(modalType, isKn) {
  if (modalType === 'addField') {
    return renderAddFieldModal(isKn);
  }
  if (modalType === 'recordSupply') {
    return renderRecordSupplyModal(isKn);
  }
  if (modalType === 'logIrrigation') {
    return renderLogIrrigationModal(isKn);
  }
  if (modalType === 'voiceAdvisor') {
    return renderVoiceAdvisorModal(isKn);
  }
  return '';
}

function renderAddFieldModal(isKn) {
  return `
    <div class="irr-modal-backdrop" id="modalBackdrop">
      <div class="irr-modal-card">
        <div class="irr-modal-header">
          <h3>
            <i class="fas fa-seedling" style="color:var(--primary);margin-right:8px;"></i>
            ${isKn ? 'ಹೊಸ ಹೊಲ ನೋಂದಾಯಿಸಿ (ಎಕರೆ & ಗುಂಟೆ)' : 'Register New Field (Acres & Guntas)'}
          </h3>
          <button class="btn btn-sm" id="btnCloseModal" style="background:transparent;border:none;color:#fff;font-size:18px;cursor:pointer;">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form id="formAddField">
          <div class="irr-form-group">
            <label>${isKn ? 'ಹೊಲದ ಹೆಸರು' : 'Field Name'}</label>
            <input type="text" class="irr-form-control" id="newFieldName" placeholder="e.g. Field C (South Pond Plot)" required>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="irr-form-group">
              <label>${isKn ? 'ಬೆಳೆ' : 'Crop'}</label>
              <select class="irr-form-control" id="newFieldCrop">
                ${Object.values(CROP_IRRIGATION_PROFILES).map(c => `
                  <option value="${c.id}">${c.nameEn} (${c.nameKn})</option>
                `).join('')}
              </select>
            </div>
            <div class="irr-form-group">
              <label>${isKn ? 'ತಳಿ (ಐಚ್ಛಿಕ)' : 'Variety (Optional)'}</label>
              <input type="text" class="irr-form-control" id="newFieldVariety" placeholder="e.g. Hybrid / Arka Rakshak">
            </div>
          </div>

          <!-- Land Area in Acres & Guntas -->
          <div style="background:rgba(15,23,42,0.5);border:1px solid var(--card-border-navy);border-radius:8px;padding:12px;margin-bottom:14px;">
            <label style="display:block;font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:8px;">
              <i class="fas fa-ruler-combined" style="color:var(--primary);"></i> ${isKn ? 'ಹೊಲದ ವಿಸ್ತೀರ್ಣ (ಎಕರೆ ಮತ್ತು ಗುಂಟೆ)' : 'Land Area (Acres & Guntas)'}
            </label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="irr-form-group" style="margin-bottom:0;">
                <label style="font-size:11px;color:var(--text-muted);">${isKn ? 'ಎಕರೆ (Acres)' : 'Acres'}</label>
                <input type="number" min="0" step="1" class="irr-form-control" id="newFieldAcres" value="1" required>
              </div>
              <div class="irr-form-group" style="margin-bottom:0;">
                <label style="font-size:11px;color:var(--text-muted);">${isKn ? 'ಗುಂಟೆ (Guntas 0-39)' : 'Guntas (0-39)'}</label>
                <input type="number" min="0" max="39" step="1" class="irr-form-control" id="newFieldGuntas" value="0">
              </div>
            </div>
            <div style="font-size:11px;color:var(--water-blue-light);margin-top:6px;" id="newFieldAreaPreview">
              ${isKn ? 'ಒಟ್ಟು ವಿಸ್ತೀರ್ಣ: 1 ಎಕರೆ 0 ಗುಂಟೆ (~4,047 ಚ.ಮೀ)' : 'Total Area: 1 Acre 0 Gunta (~4,047 m²)'}
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="irr-form-group">
              <label>${isKn ? 'ಬಿತ್ತನೆ ದಿನಾಂಕ' : 'Sowing / Planting Date'}</label>
              <input type="date" class="irr-form-control" id="newFieldSowingDate" value="2026-09-01">
            </div>
            <div class="irr-form-group">
              <label>${isKn ? 'ಮಣ್ಣಿನ ವಿಧ' : 'Soil Type'}</label>
              <select class="irr-form-control" id="newFieldSoil">
                ${Object.values(SOIL_PROPERTIES).map(s => `
                  <option value="${s.id}">${s.nameEn} (${s.nameKn})</option>
                `).join('')}
              </select>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="irr-form-group">
              <label>${isKn ? 'ನೀರಾವರಿ ವಿಧಾನ' : 'Irrigation Method'}</label>
              <select class="irr-form-control" id="newFieldMethod">
                ${Object.values(IRRIGATION_METHODS).map(m => `
                  <option value="${m.id}">${m.nameEn} (${m.nameKn} - ${Math.round(m.efficiency * 100)}%)</option>
                `).join('')}
              </select>
            </div>
            <div class="irr-form-group">
              <label>${isKn ? 'ನೀರಿನ ಮೂಲ' : 'Water Source'}</label>
              <select class="irr-form-control" id="newFieldWaterSource">
                <option value="Borewell">${isKn ? 'ಕೊಳವೆಬಾವಿ (Borewell)' : 'Borewell'}</option>
                <option value="Farm Storage Tank">${isKn ? 'ಕೃಷಿ ಹೊಂಡ / ಟ್ಯಾಂಕ್ (Pond/Tank)' : 'Farm Pond / Tank'}</option>
                <option value="Open Well">${isKn ? 'ತೆರೆದ ಬಾವಿ (Open Well)' : 'Open Well'}</option>
                <option value="Canal">${isKn ? 'ನಾಲೆ ನೀರು (Canal)' : 'Canal Water'}</option>
              </select>
            </div>
          </div>

          <div class="irr-form-group">
            <label>${isKn ? 'ಮಣ್ಣಿನ ತೇವಾಂಶ % (ಐಚ್ಛಿಕ)' : 'Soil Moisture % (Optional)'}</label>
            <input type="number" class="irr-form-control" id="newFieldMoisture" placeholder="e.g. 40">
          </div>

          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;">
            <button type="button" class="btn btn-secondary" id="btnCancelModal">${isKn ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}</button>
            <button type="submit" class="btn btn-primary">${isKn ? 'ಉಳಿಸಿ' : 'Save Field'}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderRecordSupplyModal(isKn) {
  const currentSource = irrigationState.wallet.sourceType || 'motor_minutes';

  return `
    <div class="irr-modal-backdrop" id="modalBackdrop">
      <div class="irr-modal-card" style="max-width:680px;">
        <div class="irr-modal-header">
          <h3>
            <i class="fas fa-hand-holding-droplet" style="color:var(--water-blue-light);margin-right:8px;"></i>
            ${isKn ? 'ನೀರಿನ ಲಭ್ಯತೆ ಮತ್ತು ಮೂಲ ನವೀಕರಿಸಿ' : 'Update Available Water & Source'}
          </h3>
          <button class="btn btn-sm" id="btnCloseModal" style="background:transparent;border:none;color:#fff;font-size:18px;cursor:pointer;">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <p style="font-size:13px;color:var(--text-secondary);margin:-10px 0 18px;">
          ${isKn
            ? 'ಲೀಟರ್‌ಗಳನ್ನು ಲೆಕ್ಕ ಹಾಕುವ ಅಗತ್ಯವಿಲ್ಲ! ನಿಮ್ಮ ಪಂಪ್ ಓಡುವ ನಿಮಿಷಗಳು ಅಥವಾ ನೀರಿನ ಮೂಲವನ್ನು ಆರಿಸಿ.'
            : 'No need to enter water in litres! Directly enter how many minutes your pump can run, or select a source.'}
        </p>

        <!-- Source Selector Tabs -->
        <div class="source-selector-grid">
          <div class="source-option-btn ${currentSource === 'motor_minutes' ? 'active' : ''}" data-source="motor_minutes">
            <i class="fas fa-stopwatch"></i>
            <span class="opt-title">Pump Runtime</span>
            <span class="opt-kn">ಪಂಪ್ ನಿಮಿಷಗಳು</span>
          </div>

          <div class="source-option-btn ${currentSource === 'borewell' ? 'active' : ''}" data-source="borewell">
            <i class="fas fa-bore-hole"></i>
            <span class="opt-title">Borewell Pipe</span>
            <span class="opt-kn">ಕೊಳವೆಬಾವಿ</span>
          </div>

          <div class="source-option-btn ${currentSource === 'pond' ? 'active' : ''}" data-source="pond">
            <i class="fas fa-water"></i>
            <span class="opt-title">Farm Pond</span>
            <span class="opt-kn">ಕೃಷಿ ಹೊಂಡ / ಟ್ಯಾಂಕ್</span>
          </div>

          <div class="source-option-btn ${currentSource === 'well' ? 'active' : ''}" data-source="well">
            <i class="fas fa-circle-dot"></i>
            <span class="opt-title">Open Well</span>
            <span class="opt-kn">ತೆರೆದ ಬಾವಿ</span>
          </div>

          <div class="source-option-btn ${currentSource === 'canal' ? 'active' : ''}" data-source="canal">
            <i class="fas fa-faucet-drip"></i>
            <span class="opt-title">Canal Turn</span>
            <span class="opt-kn">ನಾಲೆ ಸರದಿ</span>
          </div>
        </div>

        <form id="formRecordSupply">
          <!-- 0. Direct Water Pump Minutes Section (First & Primary Option) -->
          <div id="sectionMotorMinutes" style="display:${currentSource === 'motor_minutes' ? 'block' : 'none'};">
            <div style="background:rgba(15,23,42,0.5);border:1px solid var(--card-border-navy);border-radius:8px;padding:14px;margin-bottom:14px;">
              <h4 style="font-size:14px;font-weight:700;margin:0 0 10px;color:var(--water-blue-light);">
                <i class="fas fa-stopwatch"></i> ${isKn ? 'ಮೊದಲ ಮಾಹಿತಿ: ಪ್ರತಿದಿನ ಎಷ್ಟು ನಿಮಿಷ ವಾಟರ್ ಪಂಪ್ ಓಡಿಸಲು ಸಾಧ್ಯವಿದೆ?' : 'First Information: How Many Minutes Can You Run The Water Pump Per Day?'}
              </h4>
              <p style="font-size:12px;color:var(--text-secondary);margin:0 0 14px;">
                ${isKn
                  ? 'ನಿಮ್ಮ ತೋಟದಲ್ಲಿ ಪ್ರತಿದಿನ ಲಭ್ಯವಿರುವ 3-ಫೇಸ್ ಕರೆಂಟ್ ಅಥವಾ ಬೋರ್‌ವೆಲ್ ನೀರಿಗೆ ತಕ್ಕಂತೆ ದಿನಕ್ಕೆ ಎಷ್ಟು ನಿಮಿಷ/ಗಂಟೆ ಪಂಪ್ ಓಡಿಸಬಹುದು ಎಂಬುದನ್ನು ನೇರವಾಗಿ ನಮೂದಿಸಿ:'
                  : 'Directly specify how many minutes you can run your pump each day (e.g. daily 3-phase power or well recharge) — Agrova will compare against daily crop transpiration:'}
              </p>

              <div class="irr-form-group">
                <label>${isKn ? 'ದೈನಂದಿನ ಲಭ್ಯವಿರುವ ಪಂಪ್ ಚಾಲನಾ ಸಮಯ (ನಿಮಿಷಗಳು / ಪ್ರತಿದಿನ)' : 'Daily Available Pump Runtime (Minutes Per Day)'}</label>
                <input type="number" min="0" max="1440" step="5" class="irr-form-control" id="supplyDirectPumpMinutes" value="${irrigationState.wallet.availableMinutes !== undefined ? irrigationState.wallet.availableMinutes : 60}" style="font-size:18px;font-weight:800;color:var(--water-blue-light);">
              </div>

              <!-- Quick buttons -->
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 14px;">
                ${[15, 30, 45, 60, 90, 120, 180, 240].map(m => `
                  <button type="button" class="btn btn-sm modal-quick-min-btn ${(irrigationState.wallet.availableMinutes || 60) === m ? 'btn-primary' : 'btn-secondary'}" data-mins="${m}" style="padding:4px 10px;font-size:12px;">
                    ${m >= 60 ? (m % 60 === 0 ? `${m/60}h/day` : `${m}m/day`) : `${m}m/day`}
                  </button>
                `).join('')}
              </div>

              <div class="live-calc-preview" id="pumpMinutesLivePreview">
                <div class="live-calc-icon"><i class="fas fa-gauge-high"></i></div>
                <div class="live-calc-text">
                  <span>${isKn ? 'ದೈನಂದಿನ ಅಂದಾಜು ನೀರು:' : 'Estimated Daily Water Delivery:'} <strong id="txtPumpMinutesLitresPreview">~${((irrigationState.wallet.availableMinutes || 60) * 200).toLocaleString()} Litres / day</strong></span><br>
                  <span style="font-size:11px;color:var(--text-muted);">${isKn ? 'ಪ್ರಮಾಣಿತ ಪಂಪ್ ಹರಿವು (12,000 L/ಗಂ ಅಥವಾ 200 L/ನಿಮಿಷ) ಆಧಾರಿತ • 7 ದಿನಗಳ ಅಂದಾಜು: ~' + (((irrigationState.wallet.availableMinutes || 60) * 200 * 7).toLocaleString()) + ' L' : 'Based on 200 L/min pump discharge • 7-day sustainable yield: ~' + (((irrigationState.wallet.availableMinutes || 60) * 200 * 7).toLocaleString()) + ' L'}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 1. Borewell Section -->
          <div id="sectionBorewell" style="display:${currentSource === 'borewell' ? 'block' : 'none'};">
            <div style="background:rgba(15,23,42,0.5);border:1px solid var(--card-border-navy);border-radius:8px;padding:14px;margin-bottom:14px;">
              <h4 style="font-size:14px;font-weight:700;margin:0 0 12px;color:var(--water-blue-light);">
                <i class="fas fa-clock"></i> ${isKn ? 'ಮೋಟಾರ್ ಚಾಲನಾ ಸಮಯ ಮತ್ತು ಪೈಪ್ ಅಳತೆ' : 'Motor Running Time & Delivery Pipe'}
              </h4>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="irr-form-group">
                  <label>${isKn ? 'ಮೋಟಾರ್ ಚಾಲನೆ ಗಂಟೆಗಳು' : 'Motor Running Hours'}</label>
                  <input type="number" min="0" max="24" class="irr-form-control" id="supplyBorewellHours" value="${irrigationState.wallet.borewellDailyHours !== undefined ? irrigationState.wallet.borewellDailyHours : 4}">
                </div>

                <div class="irr-form-group">
                  <label>${isKn ? 'ನಿಮಿಷಗಳು' : 'Minutes'}</label>
                  <input type="number" min="0" max="59" step="5" class="irr-form-control" id="supplyBorewellMinutes" value="${irrigationState.wallet.borewellDailyMinutes !== undefined ? irrigationState.wallet.borewellDailyMinutes : 0}">
                </div>
              </div>

              <div class="irr-form-group">
                <label>${isKn ? 'ನೀರು ಬರುವ ಪೈಪ್ ಅಳತೆ (ಡೆಲಿವರಿ ಪೈಪ್)' : 'Delivery Pipe Outlet Diameter'}</label>
                <select class="irr-form-control" id="supplyBorewellPipe">
                  ${Object.values(PIPE_FLOW_RATES).map(p => `
                    <option value="${p.id}" ${p.id === (irrigationState.wallet.pipeSize || '2.0_inch') ? 'selected' : ''}>
                      ${isKn ? p.labelKn : p.labelEn}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="live-calc-preview" id="borewellLivePreview">
                <div class="live-calc-icon"><i class="fas fa-calculator"></i></div>
                <div class="live-calc-text">
                  <span>${isKn ? 'ಅಂದಾಜು ನೀರಿನ ಪ್ರಮಾಣ:' : 'Estimated Water Delivery:'} <strong id="txtBorewellLitresPreview">~48,000 Litres</strong></span><br>
                  <span style="font-size:11px;color:var(--text-muted);">${isKn ? 'ಪಂಪ್ ಹರಿವಿನ ದರ ಮತ್ತು ಮೋಟಾರ್ ಚಾಲನೆ ಆಧಾರಿತ ಲೆಕ್ಕಾಚಾರ.' : 'Calculated from calibrated pipe flow and runtime.'}</span>
                </div>
              </div>

              <div class="irr-science-banner" style="margin:8px 0 0;padding:10px 14px;">
                <i class="fas fa-triangle-exclamation" style="font-size:16px;color:var(--emergency-amber);"></i>
                <p style="font-size:11px;">
                  ${isKn
                    ? 'ಗಮನಿಸಿ: ಮೋಟಾರ್ ಕುದುರೆ ಶಕ್ತಿ (HP) ಅಥವಾ ಚಾಲನಾ ಸಮಯ ಮಾತ್ರ ನಿಖರ ನೀರನ್ನು ನೀಡುವುದಿಲ್ಲ; ಭೂಮಿಯ ಆಳ ಮತ್ತು ಅಂತರ್ಜಲ ಮಟ್ಟಕ್ಕೆ ತಕ್ಕಂತೆ ನೈಜ ನೀರು ಬದಲಾಗಬಹುದು.'
                    : 'Notice: Motor horsepower or runtime alone does not give exact water quantity without calibrated flow measurement.'}
                </p>
              </div>
            </div>
          </div>

          <!-- 2. Farm Pond / Tank Section -->
          <div id="sectionPond" style="display:${currentSource === 'pond' ? 'block' : 'none'};">
            <div style="background:rgba(15,23,42,0.5);border:1px solid var(--card-border-navy);border-radius:8px;padding:14px;margin-bottom:14px;">
              <h4 style="font-size:14px;font-weight:700;margin:0 0 12px;color:var(--water-blue-light);">
                <i class="fas fa-water"></i> ${isKn ? 'ಕೃಷಿ ಹೊಂಡ / ಸಂಗ್ರಹ ಟ್ಯಾಂಕ್ ವಿವರಗಳು' : 'Krishi Honda / Farm Pond Dimensions & Level'}
              </h4>

              <div class="irr-form-group">
                <label>${isKn ? 'ಹೊಂಡದ ಗಾತ್ರ / ಮಾದರಿ' : 'Pond Size Preset'}</label>
                <select class="irr-form-control" id="supplyPondPreset">
                  ${Object.values(KRISHI_HONDA_PRESETS).map(p => `
                    <option value="${p.id}" ${p.id === (irrigationState.wallet.pondPreset || 'medium') ? 'selected' : ''}>
                      ${isKn ? p.labelKn : p.labelEn} ${p.capacityLitres ? `(~${p.capacityLitres.toLocaleString()} L)` : ''}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div id="customPondDimensions" style="display:${irrigationState.wallet.pondPreset === 'custom' ? 'grid' : 'none'};grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px;">
                <div class="irr-form-group">
                  <label>${isKn ? 'ಉದ್ದ (ಅಡಿ)' : 'Length (ft)'}</label>
                  <input type="number" class="irr-form-control" id="supplyPondLength" value="${irrigationState.wallet.pondLengthFt || 30}">
                </div>
                <div class="irr-form-group">
                  <label>${isKn ? 'ಅಗಲ (ಅಡಿ)' : 'Width (ft)'}</label>
                  <input type="number" class="irr-form-control" id="supplyPondWidth" value="${irrigationState.wallet.pondWidthFt || 30}">
                </div>
                <div class="irr-form-group">
                  <label>${isKn ? 'ಆಳ (ಅಡಿ)' : 'Depth (ft)'}</label>
                  <input type="number" class="irr-form-control" id="supplyPondDepth" value="${irrigationState.wallet.pondDepthFt || 10}">
                </div>
              </div>

              <div class="irr-form-group">
                <label>${isKn ? 'ಪ್ರಸ್ತುತ ನೀರಿನ ಮಟ್ಟ' : 'Current Water Level'}</label>
                <select class="irr-form-control" id="supplyPondLevel">
                  ${Object.values(TANK_LEVEL_PRESETS).map(l => `
                    <option value="${l.id}" ${l.id === (irrigationState.wallet.pondLevel || 'full') ? 'selected' : ''}>
                      ${isKn ? l.labelKn : l.labelEn}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="live-calc-preview">
                <div class="live-calc-icon"><i class="fas fa-droplet"></i></div>
                <div class="live-calc-text">
                  <span>${isKn ? 'ಲಭ್ಯವಿರುವ ನೀರು:' : 'Available Water:'} <strong id="txtPondLitresPreview">~2,55,000 Litres</strong></span><br>
                  <span style="font-size:11px;color:var(--text-muted);">${isKn ? 'ಹೊಂಡದ ಅಳತೆ ಮತ್ತು ನೀರಿನ ಮಟ್ಟ ಆಧರಿಸಿ ಲೆಕ್ಕ ಹಾಕಲಾಗಿದೆ.' : 'Calculated only with verified dimensions and water-level ratio.'}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Open Well Section -->
          <div id="sectionWell" style="display:${currentSource === 'well' ? 'block' : 'none'};">
            <div style="background:rgba(15,23,42,0.5);border:1px solid var(--card-border-navy);border-radius:8px;padding:14px;margin-bottom:14px;">
              <h4 style="font-size:14px;font-weight:700;margin:0 0 12px;color:var(--water-blue-light);">
                <i class="fas fa-circle-dot"></i> ${isKn ? 'ತೆರೆದ ಬಾವಿಯ ಅಳತೆಗಳು' : 'Open Well Water Depth & Diameter'}
              </h4>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="irr-form-group">
                  <label>${isKn ? 'ಬಾವಿಯ ವ್ಯಾಸ (ಅಡಿಗಳಲ್ಲಿ)' : 'Well Diameter (Feet)'}</label>
                  <input type="number" step="1" class="irr-form-control" id="supplyWellDiameter" value="${irrigationState.wallet.wellDiameterFt || 15}">
                </div>
                <div class="irr-form-group">
                  <label>${isKn ? 'ನೀರಿನ ಆಳ (ಅಡಿಗಳಲ್ಲಿ)' : 'Standing Water Depth (Feet)'}</label>
                  <input type="number" step="1" class="irr-form-control" id="supplyWellDepth" value="${irrigationState.wallet.wellDepthFt || 12}">
                </div>
              </div>

              <div class="live-calc-preview">
                <div class="live-calc-icon"><i class="fas fa-oil-well"></i></div>
                <div class="live-calc-text">
                  <span>${isKn ? 'ಬಾವಿಯಲ್ಲಿ ಸಂಗ್ರಹಿತ ನೀರು:' : 'Standing Water Volume:'} <strong id="txtWellLitresPreview">~59,000 Litres</strong></span><br>
                  <span style="font-size:11px;color:var(--text-muted);">${isKn ? 'ಬಾವಿಯ ಸಿಲಿಂಡರ್ ಅಳತೆಯ ಅಂದಾಜು.' : 'Standing cylinder volume estimate.'}</span>
                </div>
              </div>

              <div class="irr-science-banner" style="margin:8px 0 0;padding:10px 14px;">
                <i class="fas fa-triangle-exclamation" style="font-size:16px;color:var(--emergency-amber);"></i>
                <p style="font-size:11px;">
                  ${isKn
                    ? 'ವಿಜ್ಞಾನ ಸೂತ್ರ: ಬಾವಿಯ ನೀರಿನ ಆಳವು ನೆಲದ ಊಟೆ (ಮರುಪೂರಣ ಸಾಮರ್ಥ್ಯ) ತಿಳಿಯದೆ ನಿರಂತರ ನೀರೆಂದು ಪರಿಗಣಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ಬಾವಿ ಬತ್ತದಂತೆ ಜಾಗರೂಕತೆಯಿಂದ ಪಂಪ್ ಮಾಡಿ.'
                    : 'Hydrological Law: Standing water depth does NOT equate to available volume without knowing geometry and replenishment rates.'}
                </p>
              </div>
            </div>
          </div>

          <!-- 4. Canal Section -->
          <div id="sectionCanal" style="display:${currentSource === 'canal' ? 'block' : 'none'};">
            <div style="background:rgba(15,23,42,0.5);border:1px solid var(--card-border-navy);border-radius:8px;padding:14px;margin-bottom:14px;">
              <h4 style="font-size:14px;font-weight:700;margin:0 0 12px;color:var(--water-blue-light);">
                <i class="fas fa-water"></i> ${isKn ? 'ನಾಲೆ ಸರದಿ ನೀರಾವರಿ ವೇಳಾಪಟ್ಟಿ' : 'Canal Turn & Supply Schedule'}
              </h4>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="irr-form-group">
                  <label>${isKn ? 'ಸರದಿಯ ನೀರು ಬರುವ ಗಂಟೆಗಳು' : 'Supply Duration per Turn (Hours)'}</label>
                  <input type="number" min="1" max="72" class="irr-form-control" id="supplyCanalHours" value="${irrigationState.wallet.canalHours || 6}">
                </div>
                <div class="irr-form-group">
                  <label>${isKn ? 'ಸರದಿಯ ಅಂತರ (ದಿನಗಳು)' : 'Turn Interval (Days)'}</label>
                  <input type="number" min="1" max="30" class="irr-form-control" id="supplyCanalDays" value="${irrigationState.wallet.canalIntervalDays || 10}">
                </div>
              </div>

              <div class="live-calc-preview">
                <div class="live-calc-icon"><i class="fas fa-calendar-check"></i></div>
                <div class="live-calc-text">
                  <span>${isKn ? 'ಪ್ರತಿ ಸರದಿಗೆ ಅಂದಾಜು ನೀರು:' : 'Estimated Supply per Turn:'} <strong>~1,80,000 Litres</strong></span><br>
                  <span style="font-size:11px;color:var(--text-muted);">${isKn ? 'ನಾಲೆ ಹರಿವಿನ ಸರದಿ ವೇಳಾಪಟ್ಟಿ.' : 'Scheduled rotational canal turn volume.'}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Common Next Refill Date -->
          <div class="irr-form-group" style="margin-top:14px;">
            <label>${isKn ? 'ಮುಂದಿನ ನೀರಿನ ಲಭ್ಯತೆ / ಮರುಪೂರಣ ದಿನಾಂಕ' : 'Estimated Next Supply / Refill Date'}</label>
            <input type="date" class="irr-form-control" id="walletRefillDate" value="${irrigationState.wallet.estimatedRefillDate || '2026-10-20'}">
          </div>

          <!-- Optional Technical Direct Litre Override (Collapsed by default) -->
          <details style="margin:14px 0;background:rgba(15,23,42,0.4);border:1px solid var(--card-border-navy);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--text-secondary);">
            <summary style="cursor:pointer;font-weight:700;color:var(--water-blue-light);">
              ${isKn ? '⚙️ ತಾಂತ್ರಿಕ ವಿವರಗಳು: ಲೀಟರ್‌ಗಳನ್ನು ನೇರವಾಗಿ ನಮೂದಿಸಬೇಕೇ? (ಐಚ್ಛಿಕ)' : '⚙️ Technical Override: Enter Litres Directly (Optional)'}
            </summary>
            <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="irr-form-group">
                <label>${isKn ? 'ಪ್ರಸ್ತುತ ನೀರು (ಲೀಟರ್)' : 'Current Litres'}</label>
                <input type="number" step="500" class="irr-form-control" id="walletWaterLitresManual" placeholder="e.g. 5000">
              </div>
              <div class="irr-form-group">
                <label>${isKn ? 'ಗರಿಷ್ಠ ಸಾಮರ್ಥ್ಯ (ಲೀಟರ್)' : 'Max Storage Capacity (L)'}</label>
                <input type="number" step="1000" class="irr-form-control" id="walletCapacityLitresManual" placeholder="e.g. 20000">
              </div>
            </div>
          </details>

          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;">
            <button type="button" class="btn btn-secondary" id="btnCancelModal">${isKn ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}</button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-check"></i> ${isKn ? 'ನೀರಿನ ಖಾತೆ ಉಳಿಸಿ' : 'Save Water Wallet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderLogIrrigationModal(isKn) {
  return `
    <div class="irr-modal-backdrop" id="modalBackdrop">
      <div class="irr-modal-card">
        <div class="irr-modal-header">
          <h3>
            <i class="fas fa-faucet-drip" style="color:var(--water-blue-light);margin-right:8px;"></i>
            ${isKn ? 'ಪೂರ್ಣಗೊಂಡ ನೀರಾವರಿ ದಾಖಲಿಸಿ (ಮೋಟಾರ್ ಚಾಲನೆ)' : 'Log Completed Irrigation (Motor Runtime)'}
          </h3>
          <button class="btn btn-sm" id="btnCloseModal" style="background:transparent;border:none;color:#fff;font-size:18px;cursor:pointer;">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <p style="font-size:13px;color:var(--text-secondary);margin:-10px 0 16px;">
          ${isKn
            ? 'ಲೀಟರ್‌ಗಳನ್ನು ನಮೂದಿಸುವ ಅಗತ್ಯವಿಲ್ಲ. ಮೋಟಾರ್ ಓಡಿದ ಗಂಟೆ ಮತ್ತು ನಿಮಿಷಗಳನ್ನು ನಮೂದಿಸಿ.'
            : 'No need to enter litres. Simply log how many hours and minutes your motor ran.'}
        </p>

        <form id="formLogIrrigation">
          <div class="irr-form-group">
            <label>${isKn ? 'ಹೊಲ ಆಯ್ಕೆಮಾಡಿ' : 'Select Field'}</label>
            <select class="irr-form-control" id="logFieldId">
              ${irrigationState.fields.map(f => `
                <option value="${f.id}">${f.name} (${f.cropId}) • ${f.areaAcres !== undefined ? `${f.areaAcres}A ${f.areaGuntas || 0}G` : `${f.area}A`}</option>
              `).join('')}
            </select>
          </div>

          <!-- Motor Running Duration -->
          <div style="background:rgba(15,23,42,0.5);border:1px solid var(--card-border-navy);border-radius:8px;padding:14px;margin-bottom:14px;">
            <label style="display:block;font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:8px;">
              <i class="fas fa-clock" style="color:var(--water-blue-light);"></i> ${isKn ? 'ಮೋಟಾರ್ ಓಡಿದ ಸಮಯ' : 'Motor Running Duration'}
            </label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="irr-form-group" style="margin-bottom:0;">
                <label style="font-size:11px;color:var(--text-muted);">${isKn ? 'ಗಂಟೆಗಳು' : 'Hours'}</label>
                <input type="number" min="0" max="24" class="irr-form-control" id="logDurationHours" value="1">
              </div>
              <div class="irr-form-group" style="margin-bottom:0;">
                <label style="font-size:11px;color:var(--text-muted);">${isKn ? 'ನಿಮಿಷಗಳು' : 'Minutes'}</label>
                <input type="number" min="0" max="59" step="5" class="irr-form-control" id="logDurationMinutes" value="0">
              </div>
            </div>

            <div class="live-calc-preview" style="margin:12px 0 0;">
              <div class="live-calc-icon"><i class="fas fa-droplet"></i></div>
              <div class="live-calc-text">
                <span>${isKn ? 'ಅಂದಾಜು ಬಳಸಿದ ನೀರು:' : 'Estimated Water Used:'} <strong id="logEstimatedLitres">~12,000 Litres</strong></span><br>
                <span style="font-size:11px;color:var(--text-muted);">${isKn ? 'ಪಂಪ್ ಹರಿವು (ಗಂಟೆಗೆ ~12,000 L) ಆಧಾರಿತ.' : 'Based on calibrated 2-inch pump flow (~12,000 L/hr).'}</span>
              </div>
            </div>
          </div>

          <div class="irr-form-group">
            <label>${isKn ? 'ಟಿಪ್ಪಣಿಗಳು / ಷರಾ' : 'Notes / Remarks'}</label>
            <input type="text" class="irr-form-control" id="logNotes" placeholder="e.g. Regular morning drip cycle completed.">
          </div>

          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;">
            <button type="button" class="btn btn-secondary" id="btnCancelModal">${isKn ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}</button>
            <button type="submit" class="btn btn-primary">${isKn ? 'ಖಾತೆಯಿಂದ ಕಡಿತಗೊಳಿಸಿ' : 'Log & Deduct from Wallet'}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderVoiceAdvisorModal(isKn) {
  const v = irrigationState.voiceModal;

  return `
    <div class="voice-advisor-modal" id="modalVoiceBackdrop">
      <div class="voice-modal-content">
        <button id="btnCloseVoiceModal" style="position:absolute;top:16px;right:16px;background:transparent;border:none;color:#fff;font-size:20px;cursor:pointer;">
          <i class="fas fa-times"></i>
        </button>

        <h3 style="font-size:18px;font-weight:800;color:#fff;margin-bottom:6px;">
          <i class="fas fa-microphone" style="color:var(--water-blue-light);margin-right:8px;"></i>
          ${isKn ? 'ಅಗ್ರೋವಾ ಧ್ವನಿ ನೀರಾವರಿ ಸಲಹೆಗಾರ' : 'Agrova Kannada Voice Irrigation Advisor'}
        </h3>
        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:20px;">
          ${isKn
            ? 'ಮೈಕ್ರೊಫೋನ್ ಒತ್ತಿ ನಿಮ್ಮ ನೀರಾವರಿ ಪ್ರಶ್ನೆಯನ್ನು ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ (ಮೋಟಾರ್ ಸಮಯ, ಬೆಳೆ, ಹೊಂಡ/ಬಾವಿ ನೀರು).'
            : 'Click the microphone to speak your irrigation question in Kannada or English.'}
        </p>

        <div class="voice-pulse-circle ${v.isListening ? 'recording' : ''}" id="btnToggleVoiceRecord">
          <i class="fas fa-${v.isListening ? 'stop' : 'microphone'}"></i>
        </div>

        <div style="font-size:13px;font-weight:700;color:${v.isListening ? '#ef4444' : 'var(--text-muted)'};margin-bottom:14px;">
          ${v.isListening
            ? (isKn ? 'ಧ್ವನಿ ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದೆ... ಮಾತನಾಡಿ' : 'Listening... Speak now')
            : (isKn ? 'ಪ್ರಾರಂಭಿಸಲು ಮೈಕ್ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ' : 'Tap mic to start speaking')}
        </div>

        <!-- Transcript box -->
        <div class="voice-transcript-box">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">
            ${isKn ? 'ನೀವು ಹೇಳಿದ ಪ್ರಶ್ನೆ:' : 'You said:'}
          </div>
          <div>${v.transcript || (isKn ? 'ಉದಾಹರಣೆ: "ಟೊಮೇಟೊ ಬೆಳೆಗೆ ಎಷ್ಟು ಸಮಯ ಮೋಟಾರ್ ಓಡಿಸಬೇಕು?"' : 'e.g. "How long should I run the motor for tomato?"')}</div>
        </div>

        <!-- Quick Question Chips -->
        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:16px;">
          <button class="voice-chip-btn" data-vprompt="ಟೊಮೇಟೊ ಬೆಳೆಗೆ ಎಷ್ಟು ಸಮಯ ಮೋಟಾರ್ ಓಡಿಸಬೇಕು?" style="background:rgba(15,23,42,0.8);border:1px solid #334155;color:var(--text-secondary);padding:4px 10px;border-radius:12px;font-size:11px;cursor:pointer;">
            🍅 ${isKn ? 'ಟೊಮೇಟೊ ಮೋಟಾರ್ ಸಮಯ' : 'Tomato Motor Time'}
          </button>
          <button class="voice-chip-btn" data-vprompt="ಮೆಕ್ಕೆಜೋಳಕ್ಕೆ ಇವತ್ತು ನೀರು ಬೇಕಾ?" style="background:rgba(15,23,42,0.8);border:1px solid #334155;color:var(--text-secondary);padding:4px 10px;border-radius:12px;font-size:11px;cursor:pointer;">
            🌽 ${isKn ? 'ಮೆಕ್ಕೆಜೋಳ ನೀರು ಬೇಕಾ?' : 'Maize Water Need?'}
          </button>
          <button class="voice-chip-btn" data-vprompt="ಮಳೆ ಬಂದರೆ ಮೋಟಾರ್ ಹಾಕಬೇಕಾ?" style="background:rgba(15,23,42,0.8);border:1px solid #334155;color:var(--text-secondary);padding:4px 10px;border-radius:12px;font-size:11px;cursor:pointer;">
            🌧️ ${isKn ? 'ಮಳೆ ಮುನ್ಸೂಚನೆ & ಮೋಟಾರ್' : 'Rain Forecast'}
          </button>
        </div>

        <!-- AI Voice Reply Box -->
        ${v.aiReply ? `
          <div class="voice-ai-reply-box">
            <div style="font-size:11px;color:var(--water-blue-light);font-weight:700;margin-bottom:4px;">
              ${isKn ? 'ಅಗ್ರೋವಾ ಎಐ ಧ್ವನಿ ಉತ್ತರ:' : 'Agrova AI Voice Answer:'}
            </div>
            <div>${v.aiReply}</div>
            <button class="btn btn-sm" id="btnPlayTTS" style="margin-top:10px;background:var(--primary);color:#fff;border:none;padding:5px 12px;border-radius:6px;cursor:pointer;">
              <i class="fas fa-volume-high"></i> ${isKn ? 'ಮತ್ತೆ ಆಲಿಸಿ' : 'Listen Again'}
            </button>
          </div>
        ` : ''}

        <div style="display:flex;justify-content:center;gap:10px;margin-top:10px;">
          <button class="btn btn-secondary" id="btnCloseVoiceAdvisor" style="background:#334155;border:none;color:#fff;">
            ${isKn ? 'ಮುಚ್ಚಿ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Event Listeners for Smart Irrigation View
 */
export function attachIrrigationEventListeners(renderApp, navigateTo, showToast) {
  const isKn = (localStorage.getItem('agrova-lang') || 'en') === 'kn';

  // Sub-navigation clicks
  document.querySelectorAll('[data-irrtab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-irrtab');
      irrigationState.activeTab = tab;
      renderApp();
    });
  });

  // Emergency banner jump
  document.getElementById('btnGoToEmergencyTab')?.addEventListener('click', () => {
    irrigationState.activeTab = 'emergency';
    renderApp();
  });

  // Toggle Hackathon Demo Mode
  document.getElementById('btnToggleDemoMode')?.addEventListener('click', () => {
    irrigationState.isDemoMode = !irrigationState.isDemoMode;

    if (irrigationState.isDemoMode) {
      // Seed Mandya 5,000L Water Crisis Scenario
      irrigationState.locationName = 'Mandya, Karnataka';
      irrigationState.wallet.availableMinutes = 25; // 25 mins available vs 105 mins needed -> 80 min shortage!
      irrigationState.wallet.currentWaterLitres = 5000;
      irrigationState.wallet.storageCapacityLitres = 20000;
      irrigationState.wallet.sourceType = 'motor_minutes';
      irrigationState.wallet.waterSource = 'Farm Storage Tank (25 mins Crisis)';
      irrigationState.wallet.waterSourceKn = 'ಕೃಷಿ ಹೊಂಡ (25 ನಿಮಿಷ ತುರ್ತು ಬಿಕ್ಕಟ್ಟು)';
      irrigationState.fields = [
        {
          id: 'field_tomato_demo',
          name: 'Field A (North Plot)',
          nameKn: 'ಹೊಲ ಎ (ಉತ್ತರ ಭಾಗ)',
          cropId: 'tomato',
          variety: 'Arka Rakshak',
          sowingDate: '2026-08-25',
          stageKey: 'flowering',
          area: 1.0,
          areaUnit: 'acre',
          soilType: 'loamy',
          irrigationMethod: 'drip',
          waterSource: 'Farm Storage Tank',
          soilMoisture: 32, // Dry!
          condition: 'Critical flowering phase; water deficit will cause blossom drop',
          conditionKn: 'ಹೂ ಬಿಡುವ ಹಂತ; ತೇವಾಂಶ ಕೊರತೆಯಾದರೆ ಹೂವು ಉದುರುತ್ತದೆ'
        },
        {
          id: 'field_maize_demo',
          name: 'Field B (South Plot)',
          nameKn: 'ಹೊಲ ಬಿ (ದಕ್ಷಿಣ ಭಾಗ)',
          cropId: 'maize',
          variety: 'Kaveri 50',
          sowingDate: '2026-09-15',
          stageKey: 'vegetative',
          area: 1.0,
          areaUnit: 'acre',
          soilType: 'clay',
          irrigationMethod: 'furrow',
          waterSource: 'Farm Storage Tank',
          soilMoisture: 45,
          condition: 'Early vegetative; can tolerate 3-4 days delay',
          conditionKn: 'ಆರಂಭಿಕ ಬೆಳವಣಿಗೆ ಹಂತ; 3-4 ದಿನ ವಿಳಂಬ ಸಹಿಸಿಕೊಳ್ಳಬಲ್ಲದು'
        }
      ];
      irrigationState.activeTab = 'emergency';
      showToast(isKn ? 'ಮಂಡ್ಯ ಹ್ಯಾಕಥಾನ್ ಡೆಮೊ ಸಕ್ರಿಯವಾಗಿದೆ! ನೀರಿನ ತುರ್ತು ಮೋಡ್ ಪರಿಶೀಲಿಸಿ.' : 'Mandya Water Crisis Demo Loaded! AI Emergency Mode triggered.', 'warning');
    } else {
      // Reset back to standard state
      irrigationState.wallet.availableMinutes = 60;
      irrigationState.wallet.currentWaterLitres = 18000;
      irrigationState.wallet.sourceType = 'motor_minutes';
      irrigationState.wallet.waterSource = 'Water Pump (60 mins runtime)';
      irrigationState.wallet.waterSourceKn = 'ವಾಟರ್ ಪಂಪ್ (60 ನಿಮಿಷ ಲಭ್ಯ)';
      irrigationState.activeTab = 'overview';
      showToast(isKn ? 'ನೈಜ ಡೇಟಾ ಮೋಡ್‌ಗೆ ಮರಳಿದೆ.' : 'Returned to standard data mode.', 'success');
    }
    saveStateToStorage();
    renderApp();
  });

  // 🌟 Step 1: Farmer Available Pump Minutes Preset Chips (Overview Tab - Per Day)
  document.querySelectorAll('.pump-min-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = parseInt(btn.getAttribute('data-mins'), 10) || 60;
      irrigationState.wallet.availableMinutes = mins;
      const flow = irrigationState.pump.flowRateLph || 12000;
      irrigationState.wallet.currentWaterLitres = convertMotorTimeToLitres(0, mins, flow);
      irrigationState.wallet.sourceType = 'motor_minutes';
      irrigationState.wallet.waterSource = `Water Pump (${mins} mins/day available)`;
      irrigationState.wallet.waterSourceKn = `ವಾಟರ್ ಪಂಪ್ (${mins} ನಿಮಿಷ/ದಿನ ಲಭ್ಯವಿದೆ)`;
      saveStateToStorage();
      renderApp();
      showToast(
        isKn
          ? `ದೈನಂದಿನ ಪಂಪ್ ಸಮಯ: ದಿನಕ್ಕೆ ${mins} ನಿಮಿಷ (~${((mins * 200)).toLocaleString()} L/ದಿನ) ಎಂದು ನಿಗದಿಪಡಿಸಲಾಗಿದೆ!`
          : `Daily pump runtime set to ${mins} mins/day (~${((mins * 200)).toLocaleString()} L/day)!`,
        'info'
      );
    });
  });

  // 🌟 Step 1: Custom Minutes Input (Overview Tab - Per Day)
  const quickInput = document.getElementById('quickAvailableMinutes');
  if (quickInput) {
    const handleQuickMinutesChange = () => {
      const mins = Math.max(0, parseInt(quickInput.value, 10) || 0);
      irrigationState.wallet.availableMinutes = mins;
      const flow = irrigationState.pump.flowRateLph || 12000;
      irrigationState.wallet.currentWaterLitres = convertMotorTimeToLitres(0, mins, flow);
      irrigationState.wallet.sourceType = 'motor_minutes';
      irrigationState.wallet.waterSource = `Water Pump (${mins} mins/day available)`;
      irrigationState.wallet.waterSourceKn = `ವಾಟರ್ ಪಂಪ್ (${mins} ನಿಮಿಷ/ದಿನ ಲಭ್ಯವಿದೆ)`;
      saveStateToStorage();
      renderApp();
      showToast(
        isKn
          ? `ದೈನಂದಿನ ಪಂಪ್ ಸಮಯ: ದಿನಕ್ಕೆ ${mins} ನಿಮಿಷ (~${((mins * 200)).toLocaleString()} L/ದಿನ) ಎಂದು ನಿಗದಿಪಡಿಸಲಾಗಿದೆ!`
          : `Daily pump runtime set to ${mins} mins/day (~${((mins * 200)).toLocaleString()} L/day)!`,
        'info'
      );
    };
    quickInput.addEventListener('change', handleQuickMinutesChange);
  }

  // 🌟 Hero Open Another Options Button
  document.getElementById('btnHeroOpenSupplyModal')?.addEventListener('click', () => {
    irrigationState.activeModal = 'recordSupply';
    renderApp();
  });

  // 🌟 Another Options Drawer Cards
  document.querySelectorAll('.another-option-card').forEach(card => {
    card.addEventListener('click', () => {
      const opt = card.getAttribute('data-opt');
      if (opt === 'drip_saving') {
        irrigationState.activeTab = 'comparison';
        renderApp();
      } else if (opt === 'voice') {
        irrigationState.activeModal = 'voiceAdvisor';
        irrigationState.voiceModal.isOpen = true;
        renderApp();
      } else {
        // borewell, pond, well, canal
        irrigationState.wallet.sourceType = opt;
        irrigationState.activeModal = 'recordSupply';
        renderApp();
      }
    });
  });

  // Ask Agrova About Irrigation button (integrates with Agrova chatbot!)
  document.getElementById('btnAskAgrovaIrrigation')?.addEventListener('click', () => {
    // Navigate to chatbot with preloaded context
    const budget = calculateWaterWalletBudget({
      currentUsableWaterLitres: irrigationState.wallet.currentWaterLitres,
      storageCapacityLitres: irrigationState.wallet.storageCapacityLitres,
      expectedInflows: irrigationState.wallet.expectedInflows,
      fields: irrigationState.fields,
      planningHorizonDays: 7
    });

    const contextPrompt = isKn
      ? `ನನ್ನ ಹೊಲದಲ್ಲಿ ${irrigationState.wallet.currentWaterLitres.toLocaleString()} ಲೀಟರ್ ನೀರು ಇದೆ. ಹೊಲ A ಯಲ್ಲಿ 1 ಎಕರೆ ಟೊಮೇಟೊ (ಹೂ ಬಿಡುವ ಹಂತ) ಮತ್ತು ಹೊಲ B ಯಲ್ಲಿ 1 ಎಕರೆ ಮೆಕ್ಕೆಜೋಳ ಇದೆ. ನೀರನ್ನು ಹೇಗೆ ಹಂಚಿಕೆ ಮಾಡಬೇಕು?`
      : `I have ${irrigationState.wallet.currentWaterLitres.toLocaleString()} L water available in my storage tank. I have 1 acre Tomato (flowering) and 1 acre Maize (vegetative). How should I prioritize and ration my irrigation?`;

    // Switch page to chatbot and populate draft
    window._agrovaInitialChatDraft = contextPrompt;
    navigateTo('chatbot');
  });

  // Open Add Field Modal
  document.getElementById('btnOpenAddFieldModal')?.addEventListener('click', () => {
    irrigationState.activeModal = 'addField';
    renderApp();
  });
  document.getElementById('btnOpenAddFieldEmpty')?.addEventListener('click', () => {
    irrigationState.activeModal = 'addField';
    renderApp();
  });
  document.getElementById('btnQuickAddField')?.addEventListener('click', () => {
    irrigationState.activeModal = 'addField';
    renderApp();
  });

  // Open Record Supply Modal
  document.getElementById('btnUpdateWalletBalance')?.addEventListener('click', () => {
    irrigationState.activeModal = 'recordSupply';
    renderApp();
  });
  document.getElementById('btnQuickRecordWater')?.addEventListener('click', () => {
    irrigationState.activeModal = 'recordSupply';
    renderApp();
  });

  // Open Log Completed Irrigation Modal
  document.getElementById('btnQuickLogIrrigation')?.addEventListener('click', () => {
    irrigationState.activeModal = 'logIrrigation';
    renderApp();
  });

  // Open Voice Advisor Modal
  document.getElementById('btnOpenVoiceAdvisor')?.addEventListener('click', () => {
    irrigationState.activeModal = 'voiceAdvisor';
    irrigationState.voiceModal.isOpen = true;
    renderApp();
  });

  // Close modals
  const closeModal = () => {
    irrigationState.activeModal = null;
    irrigationState.voiceModal.isOpen = false;
    stopVoiceRecognition();
    stopVoiceResponse();
    renderApp();
  };

  document.getElementById('btnCloseModal')?.addEventListener('click', closeModal);
  document.getElementById('btnCancelModal')?.addEventListener('click', closeModal);
  document.getElementById('modalBackdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalBackdrop') closeModal();
  });

  document.getElementById('btnCloseVoiceModal')?.addEventListener('click', closeModal);
  document.getElementById('btnCloseVoiceAdvisor')?.addEventListener('click', closeModal);
  document.getElementById('modalVoiceBackdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalVoiceBackdrop') closeModal();
  });

  // Source selection state in Record Supply Modal
  let selectedSupplySource = irrigationState.wallet.sourceType || 'motor_minutes';

  // Toggle water source tabs in Record Supply Modal
  document.querySelectorAll('.source-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.source-option-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const src = btn.getAttribute('data-source');
      selectedSupplySource = src;

      ['sectionMotorMinutes', 'sectionBorewell', 'sectionPond', 'sectionWell', 'sectionCanal'].forEach(secId => {
        const sec = document.getElementById(secId);
        if (sec) sec.style.display = 'none';
      });

      if (src === 'motor_minutes') document.getElementById('sectionMotorMinutes')?.style.setProperty('display', 'block');
      if (src === 'borewell') document.getElementById('sectionBorewell')?.style.setProperty('display', 'block');
      if (src === 'pond') document.getElementById('sectionPond')?.style.setProperty('display', 'block');
      if (src === 'well') document.getElementById('sectionWell')?.style.setProperty('display', 'block');
      if (src === 'canal') document.getElementById('sectionCanal')?.style.setProperty('display', 'block');
    });
  });

  // Modal quick minute preset buttons
  document.querySelectorAll('.modal-quick-min-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = parseInt(btn.getAttribute('data-mins'), 10) || 60;
      const input = document.getElementById('supplyDirectPumpMinutes');
      if (input) {
        input.value = mins;
        input.dispatchEvent(new Event('input'));
      }
    });
  });

  // Live preview for Direct Pump Minutes in Record Supply Modal (Per Day)
  const updatePumpMinutesPreview = () => {
    const mins = parseFloat(document.getElementById('supplyDirectPumpMinutes')?.value) || 0;
    const flow = irrigationState.pump.flowRateLph || 12000;
    const dailyLitres = convertMotorTimeToLitres(0, mins, flow);
    const weeklyLitres = dailyLitres * 7;
    const el = document.getElementById('txtPumpMinutesLitresPreview');
    if (el) {
      el.textContent = isKn
        ? `~${dailyLitres.toLocaleString()} L/ದಿನ (7 ದಿನಗಳಲ್ಲಿ: ~${weeklyLitres.toLocaleString()} L)`
        : `~${dailyLitres.toLocaleString()} Litres / day (7-day yield: ~${weeklyLitres.toLocaleString()} L)`;
    }
  };
  document.getElementById('supplyDirectPumpMinutes')?.addEventListener('input', updatePumpMinutesPreview);
  document.getElementById('supplyDirectPumpMinutes')?.addEventListener('change', updatePumpMinutesPreview);

  // Live Preview Calculations in Record Supply Modal
  const updateBorewellPreview = () => {
    const h = parseFloat(document.getElementById('supplyBorewellHours')?.value || document.getElementById('supplyBorewellDailyHours')?.value) || 0;
    const m = parseFloat(document.getElementById('supplyBorewellMinutes')?.value || document.getElementById('supplyBorewellDailyMinutes')?.value) || 0;
    const pipe = document.getElementById('supplyBorewellPipe')?.value || document.getElementById('supplyBorewellPipeSize')?.value || '2.0_inch';
    const flow = PIPE_FLOW_RATES[pipe]?.flowRateLph || 12000;
    const litres = convertMotorTimeToLitres(h, m, flow);
    const el = document.getElementById('txtBorewellLitresPreview');
    if (el) {
      el.textContent = `~${litres.toLocaleString()} Litres`;
    }
  };

  ['supplyBorewellHours', 'supplyBorewellMinutes', 'supplyBorewellPipe', 'supplyBorewellDailyHours', 'supplyBorewellDailyMinutes', 'supplyBorewellPipeSize'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateBorewellPreview);
    document.getElementById(id)?.addEventListener('change', updateBorewellPreview);
  });

  const updatePondPreview = () => {
    const preset = document.getElementById('supplyPondPreset')?.value || 'medium';
    const customDiv = document.getElementById('customPondDimensions');
    if (customDiv) {
      customDiv.style.display = preset === 'custom' ? 'grid' : 'none';
    }
    const lengthFt = parseFloat(document.getElementById('supplyPondLength')?.value) || 30;
    const widthFt = parseFloat(document.getElementById('supplyPondWidth')?.value) || 30;
    const depthFt = parseFloat(document.getElementById('supplyPondDepth')?.value) || 10;
    const levelId = document.getElementById('supplyPondLevel')?.value || 'full';
    const vol = calculatePondVolumeLitres({ lengthFt, widthFt, depthFt, levelId, presetId: preset });
    const el = document.getElementById('txtPondLitresPreview');
    if (el) {
      el.textContent = `~${vol.currentUsableLitres.toLocaleString()} Litres`;
    }
  };

  ['supplyPondPreset', 'supplyPondLength', 'supplyPondWidth', 'supplyPondDepth', 'supplyPondLevel'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updatePondPreview);
    document.getElementById(id)?.addEventListener('change', updatePondPreview);
  });

  const updateWellPreview = () => {
    const dia = parseFloat(document.getElementById('supplyWellDiameter')?.value) || 15;
    const dep = parseFloat(document.getElementById('supplyWellDepth')?.value) || 12;
    const vol = calculateWellVolumeLitres({ diameterFt: dia, waterDepthFt: dep });
    const el = document.getElementById('txtWellLitresPreview');
    if (el) {
      el.textContent = `~${vol.standingVolumeLitres.toLocaleString()} Litres`;
    }
  };

  ['supplyWellDiameter', 'supplyWellDepth'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateWellPreview);
    document.getElementById(id)?.addEventListener('change', updateWellPreview);
  });

  // Live Preview in Add Field Modal (Acres & Guntas)
  const updateNewFieldAreaPreview = () => {
    const acres = parseInt(document.getElementById('newFieldAcres')?.value, 10) || 0;
    const guntas = parseInt(document.getElementById('newFieldGuntas')?.value, 10) || 0;
    const totalM2 = Math.round((acres + guntas / 40) * 4046.86);
    const prev = document.getElementById('newFieldAreaPreview');
    if (prev) {
      prev.textContent = isKn
        ? `ಒಟ್ಟು ವಿಸ್ತೀರ್ಣ: ${acres} ಎಕರೆ ${guntas} ಗುಂಟೆ (~${totalM2.toLocaleString()} ಚ.ಮೀ)`
        : `Total Area: ${acres} Acre ${guntas} Gunta (~${totalM2.toLocaleString()} m²)`;
    }
  };

  document.getElementById('newFieldAcres')?.addEventListener('input', updateNewFieldAreaPreview);
  document.getElementById('newFieldGuntas')?.addEventListener('input', updateNewFieldAreaPreview);

  // Live Preview in Log Irrigation Modal (Motor runtime -> Litres)
  const updateLogPreview = () => {
    const h = parseFloat(document.getElementById('logDurationHours')?.value) || 0;
    const m = parseFloat(document.getElementById('logDurationMinutes')?.value) || 0;
    const flow = irrigationState.pump.flowRateLph || 12000;
    const litres = convertMotorTimeToLitres(h, m, flow);
    const el = document.getElementById('logEstimatedLitres');
    if (el) {
      el.textContent = `~${litres.toLocaleString()} Litres`;
    }
  };

  ['logDurationHours', 'logDurationMinutes'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateLogPreview);
    document.getElementById(id)?.addEventListener('change', updateLogPreview);
  });

  // Form: Add Field (Acres and Guntas)
  document.getElementById('formAddField')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newFieldName')?.value.trim() || 'New Field';
    const cropId = document.getElementById('newFieldCrop')?.value || 'tomato';
    const variety = document.getElementById('newFieldVariety')?.value.trim() || 'Standard';
    const acres = parseInt(document.getElementById('newFieldAcres')?.value, 10) || 0;
    const guntas = parseInt(document.getElementById('newFieldGuntas')?.value, 10) || 0;
    const totalAcres = acres + (guntas / 40);
    const area = totalAcres > 0 ? totalAcres : 1.0;
    const sowingDate = document.getElementById('newFieldSowingDate')?.value || '2026-09-01';
    const soilType = document.getElementById('newFieldSoil')?.value || 'loamy';
    const irrigationMethod = document.getElementById('newFieldMethod')?.value || 'drip';
    const waterSource = document.getElementById('newFieldWaterSource')?.value || 'Borewell';
    const soilMoisture = parseFloat(document.getElementById('newFieldMoisture')?.value) || 40;

    // Automatic growth stage calculation
    const stageResult = estimateCropStageFromSowingDate(cropId, sowingDate);

    const newField = {
      id: 'field_' + Date.now(),
      name,
      nameKn: name,
      cropId,
      variety,
      sowingDate,
      stageKey: stageResult.stageKey,
      areaAcres: acres,
      areaGuntas: guntas,
      area,
      areaUnit: 'acre',
      soilType,
      irrigationMethod,
      waterSource,
      soilMoisture,
      condition: `Day ${stageResult.daysElapsed} (${stageResult.stage.labelEn})`,
      conditionKn: `${stageResult.daysElapsed}ನೇ ದಿನ (${stageResult.stage.labelKn})`
    };

    irrigationState.fields.push(newField);
    saveStateToStorage();
    closeModal();
    showToast(isKn ? `ಹೊಸ ಹೊಲ ನೋಂದಾಯಿಸಲಾಗಿದೆ: ${acres} ಎಕರೆ ${guntas} ಗುಂಟೆ!` : `Field registered: ${acres} Acre ${guntas} Gunta!`, 'success');
  });

  // Form: Record Supply (Farmer-friendly Water Sources)
  document.getElementById('formRecordSupply')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const manualLitres = parseFloat(document.getElementById('walletWaterLitresManual')?.value);
    const manualCap = parseFloat(document.getElementById('walletCapacityLitresManual')?.value);
    const refill = document.getElementById('walletRefillDate')?.value || '2026-10-20';

    irrigationState.wallet.sourceType = selectedSupplySource;
    irrigationState.wallet.estimatedRefillDate = refill;

    if (!isNaN(manualLitres) && manualLitres > 0) {
      const flow = irrigationState.pump.flowRateLph || 12000;
      irrigationState.wallet.currentWaterLitres = manualLitres;
      irrigationState.wallet.storageCapacityLitres = !isNaN(manualCap) && manualCap > 0 ? manualCap : Math.max(manualLitres, 20000);
      irrigationState.wallet.availableMinutes = Math.round((manualLitres / flow) * 60);
      irrigationState.wallet.isMeasured = true;
    } else if (selectedSupplySource === 'motor_minutes') {
      const mins = parseFloat(document.getElementById('supplyDirectPumpMinutes')?.value) || 60;
      const flow = irrigationState.pump.flowRateLph || 12000;
      const litres = convertMotorTimeToLitres(0, mins, flow);

      irrigationState.wallet.availableMinutes = mins;
      irrigationState.wallet.currentWaterLitres = litres;
      irrigationState.wallet.storageCapacityLitres = Math.max(litres * 3, 30000);
      irrigationState.wallet.waterSource = `Water Pump (${mins} mins available)`;
      irrigationState.wallet.waterSourceKn = `ವಾಟರ್ ಪಂಪ್ (${mins} ನಿಮಿಷ ಲಭ್ಯವಿದೆ)`;
      irrigationState.wallet.isMeasured = false;
    } else if (selectedSupplySource === 'borewell') {
      const h = parseFloat(document.getElementById('supplyBorewellHours')?.value || document.getElementById('supplyBorewellDailyHours')?.value) || 0;
      const m = parseFloat(document.getElementById('supplyBorewellMinutes')?.value || document.getElementById('supplyBorewellDailyMinutes')?.value) || 0;
      const pipe = document.getElementById('supplyBorewellPipe')?.value || document.getElementById('supplyBorewellPipeSize')?.value || '2.0_inch';
      const pipeRate = PIPE_FLOW_RATES[pipe]?.flowRateLph || 12000;
      const dailyL = convertMotorTimeToLitres(h, m, pipeRate);
      const totalMins = Math.round(h * 60 + m);

      irrigationState.wallet.borewellDailyHours = h;
      irrigationState.wallet.borewellDailyMinutes = m;
      irrigationState.wallet.pipeSize = pipe;
      irrigationState.wallet.currentWaterLitres = dailyL;
      irrigationState.wallet.availableMinutes = totalMins;
      irrigationState.wallet.storageCapacityLitres = Math.max(dailyL * 3, 30000);
      irrigationState.wallet.waterSource = `Borewell (${PIPE_FLOW_RATES[pipe]?.nameEn || '2" pipe'})`;
      irrigationState.wallet.waterSourceKn = `ಕೊಳವೆಬಾವಿ (${PIPE_FLOW_RATES[pipe]?.nameKn || '2 ಇಂಚು'})`;
      irrigationState.wallet.isMeasured = false;
    } else if (selectedSupplySource === 'pond') {
      const flow = irrigationState.pump.flowRateLph || 12000;
      const preset = document.getElementById('supplyPondPreset')?.value || 'medium';
      const lengthFt = parseFloat(document.getElementById('supplyPondLength')?.value) || 30;
      const widthFt = parseFloat(document.getElementById('supplyPondWidth')?.value) || 30;
      const depthFt = parseFloat(document.getElementById('supplyPondDepth')?.value) || 10;
      const levelId = document.getElementById('supplyPondLevel')?.value || 'full';
      const vol = calculatePondVolumeLitres({ lengthFt, widthFt, depthFt, levelId, presetId: preset });

      irrigationState.wallet.pondPreset = preset;
      irrigationState.wallet.pondLengthFt = lengthFt;
      irrigationState.wallet.pondWidthFt = widthFt;
      irrigationState.wallet.pondDepthFt = depthFt;
      irrigationState.wallet.pondLevel = levelId;
      irrigationState.wallet.currentWaterLitres = vol.currentUsableLitres;
      irrigationState.wallet.storageCapacityLitres = vol.maxCapacityLitres;
      irrigationState.wallet.availableMinutes = Math.round((vol.currentUsableLitres / flow) * 60);
      irrigationState.wallet.waterSource = `Farm Pond (${TANK_LEVEL_PRESETS[levelId]?.labelEn || 'Level'})`;
      irrigationState.wallet.waterSourceKn = `ಕೃಷಿ ಹೊಂಡ (${TANK_LEVEL_PRESETS[levelId]?.labelKn || 'ಮಟ್ಟ'})`;
      irrigationState.wallet.isMeasured = true;
    } else if (selectedSupplySource === 'well') {
      const flow = irrigationState.pump.flowRateLph || 12000;
      const dia = parseFloat(document.getElementById('supplyWellDiameter')?.value) || 15;
      const dep = parseFloat(document.getElementById('supplyWellDepth')?.value) || 12;
      const vol = calculateWellVolumeLitres({ diameterFt: dia, waterDepthFt: dep });

      irrigationState.wallet.wellDiameterFt = dia;
      irrigationState.wallet.wellDepthFt = dep;
      irrigationState.wallet.currentWaterLitres = vol.usableLitres;
      irrigationState.wallet.storageCapacityLitres = vol.standingVolumeLitres;
      irrigationState.wallet.availableMinutes = Math.round((vol.usableLitres / flow) * 60);
      irrigationState.wallet.waterSource = `Open Well (${dep}ft standing water)`;
      irrigationState.wallet.waterSourceKn = `ತೆರೆದ ಬಾವಿ (${dep} ಅಡಿ ನೀರು)`;
      irrigationState.wallet.isMeasured = true;
    } else if (selectedSupplySource === 'canal') {
      const flow = irrigationState.pump.flowRateLph || 12000;
      const hours = parseFloat(document.getElementById('supplyCanalHours')?.value) || 6;
      const intervalDays = parseFloat(document.getElementById('supplyCanalDays')?.value) || 10;
      const vol = Math.round(hours * 30000);

      irrigationState.wallet.canalHours = hours;
      irrigationState.wallet.canalIntervalDays = intervalDays;
      irrigationState.wallet.currentWaterLitres = vol;
      irrigationState.wallet.storageCapacityLitres = vol * 2;
      irrigationState.wallet.availableMinutes = Math.round((vol / flow) * 60);
      irrigationState.wallet.waterSource = `Canal Turn (${hours}h turn every ${intervalDays}d)`;
      irrigationState.wallet.waterSourceKn = `ನಾಲೆ ಸರದಿ (${hours} ಗಂಟೆ ಪ್ರತಿ ${intervalDays} ದಿನಕ್ಕೆ)`;
      irrigationState.wallet.isMeasured = false;
    }

    saveStateToStorage();
    closeModal();
    showToast(isKn ? 'ನೀರಿನ ಖಾತೆ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!' : 'Water Wallet updated successfully from farmer inputs!', 'success');
  });

  // Form: Log Completed Irrigation (Hours and Minutes)
  document.getElementById('formLogIrrigation')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fieldId = document.getElementById('logFieldId')?.value;
    const h = parseFloat(document.getElementById('logDurationHours')?.value) || 0;
    const m = parseFloat(document.getElementById('logDurationMinutes')?.value) || 0;
    const duration = Math.round(h * 60 + m);
    const flow = irrigationState.pump.flowRateLph || 12000;
    const litres = convertMotorTimeToLitres(h, m, flow);
    const notes = document.getElementById('logNotes')?.value.trim();
    const field = irrigationState.fields.find(f => f.id === fieldId);

    // Deduct from water wallet
    irrigationState.wallet.currentWaterLitres = Math.max(0, irrigationState.wallet.currentWaterLitres - litres);

    // Add to history
    irrigationState.history.unshift({
      id: 'hist_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      fieldId,
      fieldName: field ? field.name : 'Registered Field',
      litresUsed: litres,
      durationMinutes: duration,
      method: field ? field.irrigationMethod : 'Drip',
      pumpCost: Math.round((duration / 60) * 35),
      weather: 'Clear (28°C)',
      notes: notes || `Motor ran for ${h}h ${m}m (~${litres.toLocaleString()} L)`
    });

    saveStateToStorage();
    closeModal();
    showToast(
      isKn
        ? `ದಾಖಲಾಗಿದೆ! ಮೋಟಾರ್ ${h} ಗಂಟೆ ${m} ನಿಮಿಷ ಓಡಿದೆ (~${litres.toLocaleString()} L ಕಡಿತ).`
        : `Logged! Motor ran ${h}h ${m}m (~${litres.toLocaleString()} L deducted from Water Wallet).`,
      'success'
    );
  });

  // Delete Field
  document.querySelectorAll('.btn-delete-field').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-deleteid');
      if (confirm(isKn ? 'ಈ ಹೊಲವನ್ನು ತೆಗೆದುಹಾಕಬೇಕೇ?' : 'Are you sure you want to delete this field?')) {
        irrigationState.fields = irrigationState.fields.filter(f => f.id !== id);
        saveStateToStorage();
        renderApp();
        showToast(isKn ? 'ಹೊಲವನ್ನು ತೆಗೆದುಹಾಕಲಾಗಿದೆ.' : 'Field deleted.', 'success');
      }
    });
  });

  // Calculator inputs real-time change (Supports Acres & Guntas)
  ['calcCrop', 'calcStage', 'calcAreaAcres', 'calcAreaGuntas', 'calcSoil', 'calcMethod', 'calcEt0', 'calcRain', 'calcMoisture'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        irrigationState.calcInput.cropId = document.getElementById('calcCrop')?.value;
        irrigationState.calcInput.stageKey = document.getElementById('calcStage')?.value;
        const a = parseInt(document.getElementById('calcAreaAcres')?.value, 10) || 0;
        const g = parseInt(document.getElementById('calcAreaGuntas')?.value, 10) || 0;
        irrigationState.calcInput.areaAcres = a;
        irrigationState.calcInput.areaGuntas = g;
        irrigationState.calcInput.area = a + (g / 40);
        irrigationState.calcInput.soilType = document.getElementById('calcSoil')?.value;
        irrigationState.calcInput.irrigationMethod = document.getElementById('calcMethod')?.value;
        irrigationState.calcInput.et0 = parseFloat(document.getElementById('calcEt0')?.value) || 5.0;
        irrigationState.calcInput.recentRain = parseFloat(document.getElementById('calcRain')?.value) || 0;
        irrigationState.calcInput.soilMoisture = parseFloat(document.getElementById('calcMoisture')?.value) || 40;
        renderApp();
      });
    }
  });

  // Apply Emergency Allocation to Scheduler
  document.getElementById('btnApplyEmergencySchedule')?.addEventListener('click', () => {
    irrigationState.activeTab = 'scheduler';
    showToast(
      isKn
        ? 'ತುರ್ತು ನೀರು ಹಂಚಿಕೆಯನ್ನು ವೇಳಾಪಟ್ಟಿಗೆ ಅನ್ವಯಿಸಲಾಗಿದೆ!'
        : 'Emergency water allocation applied to 7-day schedule!',
      'success'
    );
    renderApp();
  });

  // Log Scheduled Today's Action
  document.getElementById('btnLogTodayAction')?.addEventListener('click', () => {
    const field = irrigationState.fields[0];
    const litres = 12000;
    irrigationState.wallet.currentWaterLitres = Math.max(0, irrigationState.wallet.currentWaterLitres - litres);
    irrigationState.history.unshift({
      id: 'hist_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      fieldId: field ? field.id : 'field_1',
      fieldName: field ? field.name : 'Field A',
      litresUsed: litres,
      durationMinutes: 60,
      method: field ? field.irrigationMethod : 'Drip',
      pumpCost: 35,
      weather: 'Clear (28°C)',
      notes: 'Scheduled 1-hour morning drip cycle marked completed.'
    });
    saveStateToStorage();
    showToast(
      isKn
        ? 'ಇಂದಿನ ನೀರಾವರಿ ಪೂರ್ಣಗೊಂಡಿದೆ! 1 ಗಂಟೆ ಮೋಟಾರ್ ಚಾಲನೆ ದಾಖಲಾಗಿದೆ.'
        : 'Today\'s irrigation completed! 1 hour motor runtime logged.',
      'success'
    );
    renderApp();
  });

  // Save Pump Configuration
  document.getElementById('btnSavePumpSettings')?.addEventListener('click', () => {
    irrigationState.pump.hp = parseFloat(document.getElementById('pumpHp')?.value) || 5;
    irrigationState.pump.flowRateLph = parseFloat(document.getElementById('pumpFlow')?.value) || 12000;
    irrigationState.pump.electricityStartHour = parseInt(document.getElementById('pumpStartHour')?.value, 10);
    irrigationState.pump.electricityEndHour = parseInt(document.getElementById('pumpEndHour')?.value, 10);
    irrigationState.pump.tariffPerKwh = parseFloat(document.getElementById('pumpTariff')?.value) || 3.5;
    irrigationState.pump.powerSource = document.getElementById('pumpPowerSource')?.value;

    saveStateToStorage();
    renderApp();
    showToast(isKn ? 'ಪಂಪ್ ಸೆಟ್ಟಿಂಗ್ಸ್ ಉಳಿಸಲಾಗಿದೆ!' : 'Pump configuration saved!', 'success');
  });

  // Export CSV Report
  const handleExportCSV = () => {
    let csv = 'Date,Field,Water_Used_Litres,Duration_Mins,Method,Cost_INR,Notes\n';
    irrigationState.history.forEach(h => {
      csv += `"${h.date}","${h.fieldName}",${h.litresUsed},${h.durationMinutes},"${h.method}",${h.pumpCost},"${h.notes}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Agrova_Irrigation_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast(isKn ? 'ವರದಿ ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!' : 'Report downloaded successfully!', 'success');
  };

  document.getElementById('btnExportCSV')?.addEventListener('click', handleExportCSV);
  document.getElementById('btnDownloadReport')?.addEventListener('click', handleExportCSV);

  // Toggle IoT Simulation
  document.getElementById('btnToggleIoTSim')?.addEventListener('click', () => {
    irrigationState.sensors.deviceConnected = !irrigationState.sensors.deviceConnected;
    showToast(
      irrigationState.sensors.deviceConnected
        ? (isKn ? 'IoT ಸೆನ್ಸಾರ್ ಸಂಪರ್ಕಗೊಂಡಿದೆ!' : 'IoT Sensor Telemetry Connected!')
        : (isKn ? 'IoT ಸಂಪರ್ಕ ಕಡಿತಗೊಂಡಿದೆ.' : 'IoT Telemetry Disconnected.'),
      'info'
    );
    renderApp();
  });

  // Quick Voice Question Chips
  document.querySelectorAll('.voice-chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.getAttribute('data-vprompt');
      const v = irrigationState.voiceModal;
      v.transcript = prompt;
      v.isListening = false;

      const q = prompt.toLowerCase();
      let replyKn = '';
      let replyEn = '';

      if (q.includes('ಟೊಮೇಟೊ') || q.includes('tomato')) {
        replyKn = 'ನಿಮ್ಮ 1 ಎಕರೆ ಟೊಮೇಟೊ ಬೆಳೆಗೆ ಹೂ ಬಿಡುವ ಹಂತದಲ್ಲಿ ದಿನಕ್ಕೆ ಸುಮಾರು 1 ಗಂಟೆ ಹನಿ ನೀರಾವರಿ ಮೋಟಾರ್ ಓಡಿಸುವುದು ಅಗತ್ಯ. ನೀರಿನ ಕೊರತೆಯಾದರೆ ಹೂವು ಉದುರುತ್ತದೆ.';
        replyEn = 'For your 1 acre Tomato crop in flowering stage, run your drip motor for about 1 hour daily. Water deficit now causes blossom drop.';
      } else if (q.includes('ಮೆಕ್ಕೆಜೋಳ') || q.includes('maize')) {
        replyKn = 'ಮೆಕ್ಕೆಜೋಳ ಸದ್ಯಕ್ಕೆ ಸಸ್ಯ ಬೆಳವಣಿಗೆ ಹಂತದಲ್ಲಿದ್ದು 3 ರಿಂದ 4 ದಿನಗಳ ಕಾಲ ನೀರಾವರಿ ವಿಳಂಬವನ್ನು ಸಹಿಸಿಕೊಳ್ಳಬಲ್ಲದು. ನೀರು ಕಡಿಮೆಯಿದ್ದರೆ ಮೊದಲು ಟೊಮೇಟೊಗೆ ನೀರು ಹಾಯಿಸಿ.';
        replyEn = 'Maize is in vegetative stage and can safely tolerate a 3 to 4 day irrigation delay. Prioritize tomato first in water shortage.';
      } else if (q.includes('ಮಳೆ') || q.includes('rain')) {
        replyKn = 'ಮುಂದಿನ 48 ಗಂಟೆಗಳಲ್ಲಿ ಸಾಧಾರಣ ಮಳೆಯ ಮುನ್ಸೂಚನೆ ಇದೆ. ಇವತ್ತು ಮೋಟಾರ್ ಹಾಕುವುದನ್ನು ಮುಂದೂಡಿ, ಮಳೆಯಾದ ನಂತರ ಮಣ್ಣಿನ ತೇವಾಂಶ ನೋಡಿ ನಿರ್ಧರಿಸಿ.';
        replyEn = 'Moderate rain is forecast in the next 48 hours. Postpone running your motor today and check soil moisture after rain.';
      } else {
        const timeAvail = convertLitresToMotorTime(irrigationState.wallet.currentWaterLitres, irrigationState.pump.flowRateLph);
        replyKn = `ನಿಮ್ಮ ನೀರಿನ ಖಾತೆಯಲ್ಲಿ ಸುಮಾರು ${timeAvail.labelKn} ಮೋಟಾರ್ ಓಡಿಸುವಷ್ಟು ನೀರು ಲಭ್ಯವಿದೆ. ಹೂ ಬಿಡುವ ಹಂತದ ಬೆಳೆಗೆ ಮೊದಲ ಆದ್ಯತೆ ನೀಡಿ.`;
        replyEn = `You have about ${timeAvail.labelEn} of motor running water available in your wallet. Prioritize crops in critical flowering stages.`;
      }

      v.aiReply = isKn ? replyKn : replyEn;
      renderApp();
      playVoiceResponse(v.aiReply, isKn ? 'kn' : 'en');
    });
  });

  // Voice Speech Recognition Handler
  document.getElementById('btnToggleVoiceRecord')?.addEventListener('click', () => {
    const v = irrigationState.voiceModal;
    if (v.isListening) {
      stopVoiceRecognition();
      v.isListening = false;
      renderApp();
    } else {
      v.isListening = true;
      v.transcript = '';
      v.aiReply = '';
      renderApp();

      startVoiceRecognition({
        lang: isKn ? 'kn' : 'en',
        onInterim: (text) => {
          v.transcript = text;
          const box = document.querySelector('.voice-transcript-box div:last-child');
          if (box) box.textContent = text;
        },
        onFinal: (text) => {
          v.transcript = text;
          v.isListening = false;

          const q = text.toLowerCase();
          let replyKn = '';
          let replyEn = '';
          const timeAvail = convertLitresToMotorTime(irrigationState.wallet.currentWaterLitres, irrigationState.pump.flowRateLph);

          if (q.includes('ಟೊಮೇಟೊ') || q.includes('tomato')) {
            replyKn = 'ನಿಮ್ಮ 1 ಎಕರೆ ಟೊಮೇಟೊ ಬೆಳೆಗೆ ಹೂ ಬಿಡುವ ಹಂತದಲ್ಲಿ ದಿನಕ್ಕೆ ಸುಮಾರು 1 ಗಂಟೆ ಹನಿ ನೀರಾವರಿ ಮೋಟಾರ್ ಓಡಿಸುವುದು ಸೂಕ್ತ. ನೀರಿನ ಕೊರತೆಯಾದರೆ ಹೂವು ಉದುರುತ್ತದೆ.';
            replyEn = 'For your 1 acre Tomato crop in flowering stage, run your drip motor for about 1 hour daily. Water stress causes flower drop.';
          } else if (q.includes('ಮೆಕ್ಕೆಜೋಳ') || q.includes('maize')) {
            replyKn = 'ಮೆಕ್ಕೆಜೋಳ ಬೆಳವಣಿಗೆ ಹಂತದಲ್ಲಿದ್ದು 3 ರಿಂದ 4 ದಿನಗಳ ಕಾಲ ನೀರಾವರಿ ವಿಳಂಬವನ್ನು ಸಹಿಸಿಕೊಳ್ಳಬಲ್ಲದು. ತುರ್ತು ಸ್ಥಿತಿಯಲ್ಲಿ ಟೊಮೇಟೊಗೆ ಮೊದಲ ಆದ್ಯತೆ ನೀಡಿ.';
            replyEn = 'Maize is currently in vegetative growth and can tolerate a 3-4 day irrigation delay. In water emergency, prioritize tomato first.';
          } else if (q.includes('ಮಳೆ') || q.includes('rain')) {
            replyKn = 'ಮುಂದಿನ 48 ಗಂಟೆಗಳಲ್ಲಿ ಸಾಧಾರಣ ಮಳೆಯ ಸಾಧ್ಯತೆ ಇದೆ. ಪಂಪ್ ಚಾಲನೆ ಮಾಡುವ ಮುನ್ನ ಮಣ್ಣಿನ ತೇವಾಂಶವನ್ನು ಪರೀಕ್ಷಿಸಿ, ನೀರು ಉಳಿಸಿ.';
            replyEn = 'Moderate rain is forecast in the next 48 hours. Please check soil moisture before running your pump to conserve water.';
          } else {
            replyKn = `ನಿಮ್ಮ ಪ್ರಶ್ನೆಗಾಗಿ: ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ಸುಮಾರು ${timeAvail.labelKn} ಮೋಟಾರ್ ಓಡಿಸುವಷ್ಟು ನೀರು ಲಭ್ಯವಿದೆ. ಹೂ ಬಿಡುವ ಹಂತದ ಬೆಳೆಗೆ ಮೊದಲ ಆದ್ಯತೆ ನೀಡಿ.`;
            replyEn = `For your query: You have about ${timeAvail.labelEn} of motor runtime in your Water Wallet. Prioritize crops in critical flowering stages.`;
          }

          v.aiReply = isKn ? replyKn : replyEn;
          renderApp();
          playVoiceResponse(v.aiReply, isKn ? 'kn' : 'en');
        },
        onError: (err) => {
          v.isListening = false;
          showToast(err, 'error');
          renderApp();
        }
      });
    }
  });

  // Replay TTS
  document.getElementById('btnPlayTTS')?.addEventListener('click', () => {
    if (irrigationState.voiceModal.aiReply) {
      playVoiceResponse(irrigationState.voiceModal.aiReply, isKn ? 'kn' : 'en');
    }
  });
}
