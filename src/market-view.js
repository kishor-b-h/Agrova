// ===================================================================
// AGROVA - Smart Market Profit Advisor View Component
// Farmer-friendly, Kannada-first, Interactive Map & Real Economics
// ===================================================================

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  APMC_MARKETS,
  KARNATAKA_TALUKS,
  VEHICLES,
  CALCULATOR_CROPS,
  calculateMarketEconomics,
  formatDuration
} from './market-calculator.js';

// Local UI state for the calculator
export const marketState = {
  activeTab: 'advisor', // 'advisor' | 'table'
  selectedCropId: 'tomato',
  quantity: 20,
  unit: 'quintal', // 'quintal' | 'kg' | 'ton' | 'crate'
  selectedTalukId: 'mandya_hq',
  farmerLocationName: 'Mandya, Karnataka',
  farmerLat: 12.5284,
  farmerLng: 76.8975,
  selectedVehicleId: 'pickup',
  isRoundTrip: true,
  customPerKmRate: '',
  loadingPerQtl: 15,
  unloadingPerQtl: 15,
  apmcCessPercent: 1.5,
  weighingFee: 60,
  showAdvanced: false,
  isCalculating: false,
  calculationResult: null,
  mapInstance: null,
  mapLayerGroup: null
};

// Check for saved farm location from profile
try {
  const savedLoc = localStorage.getItem('agrova-farm-location');
  if (savedLoc) {
    const parsed = JSON.parse(savedLoc);
    if (parsed.lat && parsed.lng) {
      marketState.farmerLat = parsed.lat;
      marketState.farmerLng = parsed.lng;
      marketState.farmerLocationName = parsed.name || marketState.farmerLocationName;
      if (parsed.talukId) marketState.selectedTalukId = parsed.talukId;
    }
  }
} catch (e) {
  // ignore
}

/**
 * Render the main Market view (Advisor + Standard Table toggle)
 */
export function renderMarketView(state, t) {
  const lang = state.lang || 'en';
  const isKn = lang === 'kn';
  const result = marketState.calculationResult;

  return `
    <div class="market-advisor-page">
      <!-- Page Header & Tab Toggle -->
      <div class="market-header-section">
        <div>
          <h2 class="market-main-title">
            <i class="fas fa-chart-line" style="color:var(--primary);margin-right:8px;"></i>
            ${isKn ? 'ಸ್ಮಾರ್ಟ್ ಮಾರುಕಟ್ಟೆ ಲಾಭ ಮತ್ತು ಸಾರಿಗೆ ಸಲಹೆಗಾರ' : t('marketPrices')}
          </h2>
          <p class="market-sub-title">
            ${isKn
              ? 'ಕೇವಲ ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ನೋಡಬೇಡಿ; ಸಾರಿಗೆ ಮತ್ತು ಕೂಲಿ ವೆಚ್ಚ ಕಳೆದ ನಂತರ ಗರಿಷ್ಠ ನಿವ್ವಳ ಲಾಭ ಕೊಡುವ ಮಂಡಿಯನ್ನು ಕಂಡುಕೊಳ್ಳಿ.'
              : 'Compare APMC market prices, calculate real transport expenses, and discover where your crop earns maximum net profit.'}
          </p>
        </div>

        <!-- Mode Toggle Tabs -->
        <div class="market-tabs-pill">
          <button type="button" class="tab-btn ${marketState.activeTab === 'advisor' ? 'active' : ''}" id="tabAdvisorBtn">
            <i class="fas fa-calculator"></i>
            <span>${isKn ? 'ಸ್ಮಾರ್ಟ್ ಲಾಭ ಸಲಹೆಗಾರ' : 'Smart Profit Advisor'}</span>
            <span class="pulse-badge">${isKn ? 'ಹೊಸದು' : 'New'}</span>
          </button>
          <button type="button" class="tab-btn ${marketState.activeTab === 'table' ? 'active' : ''}" id="tabTableBtn">
            <i class="fas fa-table"></i>
            <span>${isKn ? 'ಮಾರುಕಟ್ಟೆ ದರಗಳ ಪಟ್ಟಿ' : 'All Mandi Prices'}</span>
          </button>
        </div>
      </div>

      <!-- MAIN CONTENT: SMART PROFIT ADVISOR -->
      <div id="advisorSection" style="${marketState.activeTab === 'advisor' ? 'display:block;' : 'display:none;'}">
        <!-- Input Configuration Card -->
        <div class="advisor-input-card">
          <div class="input-card-header">
            <h3>
              <i class="fas fa-sliders-h" style="color:var(--primary);margin-right:6px;"></i>
              ${isKn ? 'ನಿಮ್ಮ ಬೆಳೆ ಮತ್ತು ಸಾರಿಗೆ ವಿವರಗಳು' : 'Your Crop & Transportation Details'}
            </h3>
            <span class="data-tag">
              <i class="fas fa-check-circle"></i> e-NAM & AGMARKNET ${isKn ? 'ದೃಢೀಕೃತ ದರಗಳು' : 'Verified Rates'}
            </span>
          </div>

          <form id="profitCalculatorForm" class="advisor-form-grid">
            <!-- 1. Farm Location -->
            <div class="form-col">
              <label class="field-label">
                <i class="fas fa-map-marker-alt" style="color:#ef4444;"></i>
                ${isKn ? 'ನಿಮ್ಮ ಹೊಲದ ಸ್ಥಳ (Farmer Location)' : 'Your Farm Location'}
              </label>
              <div class="location-select-wrap">
                <select id="talukSelect" class="form-select">
                  ${KARNATAKA_TALUKS.map(tItem => `
                    <option value="${tItem.id}" ${marketState.selectedTalukId === tItem.id ? 'selected' : ''}>
                      ${tItem.name} (${tItem.district})
                    </option>
                  `).join('')}
                </select>
                <button type="button" class="gps-btn" id="useGpsBtn" title="${isKn ? 'ಜಿಪಿಎಸ್ ಬಳಸಿ' : 'Detect Location'}">
                  <i class="fas fa-crosshairs"></i>
                  <span>${isKn ? 'ಜಿಪಿಎಸ್' : 'GPS'}</span>
                </button>
              </div>
              <div class="loc-subtext">
                <span>📍 ${marketState.farmerLocationName}</span>
                <button type="button" class="save-loc-link" id="saveFarmLocBtn">
                  <i class="fas fa-save"></i> ${isKn ? 'ಸ್ಥಳ ಉಳಿಸಿ' : 'Save'}
                </button>
              </div>
            </div>

            <!-- 2. Crop Selection -->
            <div class="form-col">
              <label class="field-label">
                <i class="fas fa-seedling" style="color:#16a34a;"></i>
                ${isKn ? 'ಬೆಳೆ ಆಯ್ಕೆ (Select Crop)' : 'Select Crop'}
              </label>
              <select id="cropSelect" class="form-select">
                ${CALCULATOR_CROPS.map(c => `
                  <option value="${c.id}" ${marketState.selectedCropId === c.id ? 'selected' : ''}>
                    ${c.emoji} ${isKn ? c.nameKn : c.name} (${c.name})
                  </option>
                `).join('')}
              </select>
              <div class="loc-subtext">
                <span id="cropPerishHint">
                  ${CALCULATOR_CROPS.find(c => c.id === marketState.selectedCropId)?.isPerishable
                    ? (isKn ? '⚠️ ಬೇಗ ಹಾಳಾಗುವ ಬೆಳೆ • ಬೆಳಿಗ್ಗೆ ಮಂಡಿ ತಲುಪುವುದು ಸೂಕ್ತ' : '⚠️ Perishable Crop • Best to sell in morning auction')
                    : (isKn ? '🌾 ಬಾಳಿಕೆ ಬರುವ ಬೆಳೆ' : '🌾 Non-perishable staple crop')}
                </span>
              </div>
            </div>

            <!-- 3. Quantity & Unit -->
            <div class="form-col">
              <label class="field-label">
                <i class="fas fa-weight-hanging" style="color:#f59e0b;"></i>
                ${isKn ? 'ಮಾರಾಟದ ಪ್ರಮಾಣ (Quantity)' : 'Total Quantity'}
              </label>
              <div class="qty-input-group">
                <input 
                  type="number" 
                  id="quantityInput" 
                  class="form-input" 
                  value="${marketState.quantity}" 
                  min="0.5" 
                  step="0.5" 
                  required 
                />
                <select id="unitSelect" class="form-select unit-select">
                  <option value="quintal" ${marketState.unit === 'quintal' ? 'selected' : ''}>${isKn ? 'ಕ್ವಿಂಟಾಲ್ (100 kg)' : 'Quintal (100kg)'}</option>
                  <option value="kg" ${marketState.unit === 'kg' ? 'selected' : ''}>${isKn ? 'ಕೆ.ಜಿ (Kilogram)' : 'Kilograms (kg)'}</option>
                  <option value="ton" ${marketState.unit === 'ton' ? 'selected' : ''}>${isKn ? 'ಟನ್ (1,000 kg)' : 'Tonnes'}</option>
                  <option value="crate" ${marketState.unit === 'crate' ? 'selected' : ''}>${isKn ? 'ಕ್ರೇಟ್ / ಬಾಕ್ಸ್ (25kg)' : 'Crates (25kg)'}</option>
                </select>
              </div>
              <div class="loc-subtext" id="qtyConversionHint">
                <span>≈ ${getNormalizedQuintals(marketState.quantity, marketState.unit)} ${isKn ? 'ಕ್ವಿಂಟಾಲ್ ಒಟ್ಟು ತೂಕ' : 'Quintals total'}</span>
              </div>
            </div>

            <!-- 4. Transportation Method -->
            <div class="form-col">
              <label class="field-label">
                <i class="fas fa-truck" style="color:#3b82f6;"></i>
                ${isKn ? 'ಸಾರಿಗೆ ವಾಹನ (Vehicle Type)' : 'Transport Vehicle'}
              </label>
              <select id="vehicleSelect" class="form-select">
                ${VEHICLES.map(v => `
                  <option value="${v.id}" ${marketState.selectedVehicleId === v.id ? 'selected' : ''}>
                    ${isKn ? v.nameKn : v.name} (${v.capacityQtl} Qtl • ₹${v.ratePerKm}/km)
                  </option>
                `).join('')}
              </select>
              <div class="loc-subtext">
                <span>${isKn ? 'ಸಾಮರ್ಥ್ಯ' : 'Capacity'}: ${VEHICLES.find(v => v.id === marketState.selectedVehicleId)?.capacityQtl || 25} Qtl</span>
              </div>
            </div>
          </form>

          <!-- Advanced Expenses Expander -->
          <div class="advanced-toggle-bar">
            <button type="button" id="toggleAdvancedBtn" class="link-toggle-btn">
              <i class="fas ${marketState.showAdvanced ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
              <span>${isKn ? 'ವೆಚ್ಚಗಳ ಹೆಚ್ಚಿನ ಸೆಟ್ಟಿಂಗ್‌ಗಳು (ಹೇರುವ ಕೂಲಿ, ಹಮಾಲಿ, ಸೆಸ್ ಶುಲ್ಕ)' : 'Advanced Cost Settings (Loading, Hamali, Cess %)'}</span>
            </button>
            <div class="round-trip-check">
              <label>
                <input type="checkbox" id="roundTripCheck" ${marketState.isRoundTrip ? 'checked' : ''} />
                <span>${isKn ? 'ದ್ವಿಮುಖ (ರಿಟರ್ನ್) ಇಂಧನ ವೆಚ್ಚ ಗಣನೆಗೆ ತೆಗೆದುಕೊಳ್ಳಿ' : 'Include Round-Trip Vehicle Distance'}</span>
              </label>
            </div>
          </div>

          <div id="advancedSettingsBox" class="advanced-settings-grid" style="${marketState.showAdvanced ? 'display:grid;' : 'display:none;'}">
            <div class="adv-field">
              <label>${isKn ? 'ಕಸ್ಟಮ್ ಸಾರಿಗೆ ದರ (₹/ಕಿ.ಮೀ)' : 'Custom Transport Rate (₹/km)'}</label>
              <input type="number" id="customRateInput" placeholder="Auto" value="${marketState.customPerKmRate}" />
            </div>
            <div class="adv-field">
              <label>${isKn ? 'ಹೇರುವ ಕೂಲಿ (₹/ಕ್ವಿಂಟಾಲ್)' : 'Loading Charge (₹/Qtl)'}</label>
              <input type="number" id="loadingInput" value="${marketState.loadingPerQtl}" />
            </div>
            <div class="adv-field">
              <label>${isKn ? 'ಇಳಿಸುವ ಕೂಲಿ / ಹಮಾಲಿ (₹/ಕ್ವಿಂಟಾಲ್)' : 'Unloading/Hamali (₹/Qtl)'}</label>
              <input type="number" id="unloadingInput" value="${marketState.unloadingPerQtl}" />
            </div>
            <div class="adv-field">
              <label>${isKn ? 'ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ ಸೆಸ್ (%)' : 'APMC Cess Fee (%)'}</label>
              <input type="number" id="cessInput" step="0.1" value="${marketState.apmcCessPercent}" />
            </div>
            <div class="adv-field">
              <label>${isKn ? 'ತೂಕ ಮತ್ತು ಇತರೆ ಶುಲ್ಕ (₹)' : 'Weighing & Misc (₹)'}</label>
              <input type="number" id="weighingInput" value="${marketState.weighingFee}" />
            </div>
          </div>

          <!-- Calculate CTA Button -->
          <div class="calculate-action-row">
            <button type="button" class="btn btn-primary calculate-btn" id="runCalculationBtn">
              <i class="fas fa-calculator"></i>
              <span>${isKn ? 'ಲಾಭ ಹೋಲಿಕೆ ಮತ್ತು ಉತ್ತಮ ಮಾರುಕಟ್ಟೆ ಹುಡುಕಿ' : 'Find Best Net Profit Market'}</span>
            </button>
          </div>
        </div>

        <!-- RESULTS DASHBOARD -->
        ${result ? renderResultsDashboard(result, isKn) : `
          <div class="advisor-loading-card">
            <i class="fas fa-spinner fa-spin"></i>
            <p>${isKn ? 'ಮಾರುಕಟ್ಟೆ ದರಗಳು ಮತ್ತು ಸಾರಿಗೆ ದೂರವನ್ನು ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ...' : 'Analyzing APMC market prices and road routes...'}</p>
          </div>
        `}
      </div>

      <!-- STANDARD TABLE SECTION -->
      <div id="tableSection" style="${marketState.activeTab === 'table' ? 'display:block;' : 'display:none;'}">
        <div class="market-table-container">
          <div class="table-actions-row">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input type="text" id="mandiSearchInput" placeholder="${isKn ? 'ಬೆಳೆ ಅಥವಾ ಮಂಡಿ ಹುಡುಕಿ...' : 'Search crop or market...'}" />
            </div>
            <div class="sort-box">
              <select id="mandiSortSelect" class="form-select">
                <option value="price-desc">${isKn ? 'ಬೆಲೆ: ಹೆಚ್ಚಿನಿಂದ ಕಡಿಮೆ' : 'Price: High to Low'}</option>
                <option value="price-asc">${isKn ? 'ಬೆಲೆ: ಕಡಿಮೆಯಿಂದ ಹೆಚ್ಚು' : 'Price: Low to High'}</option>
                <option value="crop">${isKn ? 'ಬೆಳೆ ಹೆಸರು' : 'Crop Name'}</option>
              </select>
            </div>
          </div>

          <div class="market-table-wrapper">
            <table class="market-table" id="allMandiTable">
              <thead>
                <tr>
                  <th>#</th>
                  <th>${isKn ? 'ಬೆಳೆ (Crop)' : 'Crop Name'}</th>
                  <th>${isKn ? 'ಮಾರುಕಟ್ಟೆ (APMC Market)' : 'APMC Market'}</th>
                  <th>${isKn ? 'ದರ (₹/ಕ್ವಿಂಟಾಲ್)' : 'Price (₹/Qtl)'}</th>
                  <th>${isKn ? 'ಕನಿಷ್ಠ - ಗರಿಷ್ಠ' : 'Min - Max'}</th>
                  <th>${isKn ? 'ಆವಕ (Arrivals)' : 'Daily Arrivals'}</th>
                  <th>${isKn ? 'ದಿನಾಂಕ' : 'Updated'}</th>
                  <th>${isKn ? 'ಕ್ರಿಯೆ' : 'Action'}</th>
                </tr>
              </thead>
              <tbody id="allMandiTableBody">
                ${renderAllMandiRows(isKn)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render the full results dashboard
 */
function renderResultsDashboard(res, isKn) {
  const {
    bestMarket,
    nearestMarket,
    crop,
    quantityQuintals,
    vehicle,
    markets,
    sensitivity5Percent,
    breakEvenQuintals,
    explanation,
    farmerLocationName,
    farmerLat,
    farmerLng
  } = res;

  const isDifferent = bestMarket.market.id !== nearestMarket.market.id;
  const extraFormatted = bestMarket.extraEarnings > 0
    ? `+₹${bestMarket.extraEarnings.toLocaleString()}`
    : '₹0';

  // Google Maps directions link for the best market
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${farmerLat},${farmerLng}&destination=${bestMarket.market.lat},${bestMarket.market.lng}&travelmode=driving`;

  return `
    <div class="results-dashboard-wrapper">
      <!-- 1. HERO RECOMMENDATION CARD -->
      <div class="hero-profit-card ${isDifferent ? 'winner-far' : 'winner-local'}">
        <div class="hero-top-ribbon">
          <span class="ribbon-badge">
            <i class="fas fa-crown"></i> ${isKn ? 'ಅತ್ಯುತ್ತಮ ನಿವ್ವಳ ಲಾಭದ ಮಾರುಕಟ್ಟೆ' : 'Highest Net Profit Market'}
          </span>
          <span class="update-stamp">
            <i class="fas fa-clock"></i> ${isKn ? 'ಇಂದಿನ ದರ' : 'Today'}: ${bestMarket.market.verifiedDate}
          </span>
        </div>

        <div class="hero-main-content">
          <div class="hero-text-col">
            <div class="market-brand-name">
              <h1>${isKn ? bestMarket.market.nameKn : bestMarket.market.name}</h1>
              <span class="district-pill">${isKn ? bestMarket.market.districtKn : bestMarket.market.district}</span>
            </div>

            <div class="profit-highlight-grid">
              <div class="profit-stat primary">
                <span class="label">${isKn ? 'ನಿವ್ವಳ ಲಾಭ (ಖರ್ಚು ಕಳೆದ ನಂತರ)' : 'Estimated Take-Home Net Profit'}</span>
                <span class="value">₹${bestMarket.netProceeds.toLocaleString()}</span>
                <span class="sub">${quantityQuintals} Qtl ${isKn ? crop.nameKn : crop.name}</span>
              </div>

              ${isDifferent ? `
                <div class="profit-stat bonus">
                  <span class="label">${isKn ? 'ಹತ್ತಿರದ ಮಂಡಿಗಿಂತ ಹೆಚ್ಚುವರಿ ಲಾಭ' : 'Extra Money vs Nearest Mandi'}</span>
                  <span class="value">${extraFormatted}</span>
                  <span class="sub">${isKn ? `${nearestMarket.market.nameKn}ಗಿಂತ +${bestMarket.extraPercent}% ಹೆಚ್ಚು` : `+${bestMarket.extraPercent}% extra earnings`}</span>
                </div>
              ` : `
                <div class="profit-stat bonus">
                  <span class="label">${isKn ? 'ಸಾರಿಗೆ ಉಳಿತಾಯ' : 'Local Savings'}</span>
                  <span class="value">₹${(bestMarket.grossRevenue - bestMarket.totalExpenses).toLocaleString()}</span>
                  <span class="sub">${isKn ? 'ಕನಿಷ್ಠ ಸಾರಿಗೆ ವೆಚ್ಚ' : 'Zero excessive travel cost'}</span>
                </div>
              `}

              <div class="profit-stat route-info">
                <span class="label">${isKn ? 'ಸಾರಿಗೆ ದೂರ ಮತ್ತು ಸಮಯ' : 'Travel Distance & Time'}</span>
                <span class="value">${bestMarket.distanceKm} km</span>
                <span class="sub"><i class="fas fa-car-side"></i> ${formatDuration(bestMarket.durationMinutes, isKn ? 'kn' : 'en')}</span>
              </div>
            </div>

            <!-- "Why This Market?" Natural Advisory -->
            <div class="why-advisory-box">
              <div class="advisory-title">
                <i class="fas fa-lightbulb"></i>
                <strong>${isKn ? 'ಈ ಮಾರುಕಟ್ಟೆಯನ್ನು ಏಕೆ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ?' : 'Why is this market recommended?'}</strong>
              </div>
              <p>${isKn ? explanation.textKn : explanation.textEn}</p>
            </div>

            ${explanation.warningKn ? `
              <div class="advisory-warning-box">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${isKn ? explanation.warningKn : explanation.warningEn}</span>
              </div>
            ` : ''}

            <!-- Directions CTA -->
            <div class="hero-actions-bar">
              <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary nav-cta-btn">
                <i class="fas fa-directions"></i>
                <span>${isKn ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್‌ನಲ್ಲಿ ದಾರಿ ನೋಡಿ (Get Directions)' : 'Get Directions in Google Maps'}</span>
              </a>
              <span class="mandi-timing-tag">
                <i class="fas fa-door-open"></i> ${isKn ? 'ಹರಾಜು ಸಮಯ' : 'Auction'}: ${bestMarket.market.timing}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. INTERACTIVE ROUTE MAP & SENSITIVITY GRID -->
      <div class="map-and-insights-row">
        <!-- Interactive Leaflet Map -->
        <div class="map-card-panel">
          <div class="panel-header">
            <h4>
              <i class="fas fa-route" style="color:var(--primary);margin-right:6px;"></i>
              ${isKn ? 'ಹೊಲದಿಂದ ಮಾರುಕಟ್ಟೆಗೆ ರಸ್ತೆ ಮಾರ್ಗ' : 'Road Route from Farm to Market'}
            </h4>
            <span class="map-badge">
              <i class="fas fa-map-marked-alt"></i> OpenStreetMap Live
            </span>
          </div>
          <div id="marketMap" class="market-leaflet-map" style="height: 380px; width: 100%; border-radius: 8px;"></div>
          <div class="map-legend">
            <span class="legend-item"><span class="legend-dot green"></span> ${isKn ? 'ನಿಮ್ಮ ಹೊಲ' : 'Your Farm'} (${farmerLocationName.split(',')[0]})</span>
            <span class="legend-item"><span class="legend-dot gold"></span> ${isKn ? 'ಅತ್ಯುತ್ತಮ ಮಂಡಿ' : 'Best Market'} (${isKn ? bestMarket.market.nameKn.split(' ')[0] : bestMarket.market.name})</span>
            <span class="legend-item"><span class="legend-dot blue"></span> ${isKn ? 'ಇತರೆ ಮಂಡಿಗಳು' : 'Other Mandis'}</span>
          </div>
        </div>

        <!-- Smart Decision Cards -->
        <div class="insights-card-panel">
          <div class="panel-header">
            <h4>
              <i class="fas fa-brain" style="color:#8b5cf6;margin-right:6px;"></i>
              ${isKn ? 'ಬುದ್ಧಿವಂತ ನಿರ್ಧಾರ ವಿಶ್ಲೇಷಣೆ' : 'Smart Decision Insights'}
            </h4>
          </div>

          <!-- Sensitivity Check -->
          ${sensitivity5Percent ? `
            <div class="insight-tile ${sensitivity5Percent.isStillProfitable ? 'safe' : 'caution'}">
              <div class="tile-icon"><i class="fas fa-chart-line"></i></div>
              <div class="tile-body">
                <strong>${isKn ? 'ದರ ಕುಸಿತದ ಅಪಾಯ ಪರೀಕ್ಷೆ (-5%)' : 'Price Drop Risk Test (-5%)'}</strong>
                <p>
                  ${isKn 
                    ? `ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಬೆಲೆ 5% ಇಳಿದರೂ (₹${Math.round(bestMarket.pricePerQtl * 0.95)}/ಕ್ವಿಂ), ನೀವು ಸ್ಥಳೀಯ ಮಂಡಿಗಿಂತ <strong>+₹${sensitivity5Percent.diffVsNearest.toLocaleString()} ಹೆಚ್ಚುವರಿ ಲಾಭ</strong> ಗಳಿಸುತ್ತೀರಿ.`
                    : `Even if ${bestMarket.market.name} price drops by 5% in transit, you still earn <strong>+₹${sensitivity5Percent.diffVsNearest.toLocaleString()} extra</strong> over the local mandi.`}
                </p>
              </div>
            </div>
          ` : ''}

          <!-- Break-even quantity -->
          ${breakEvenQuintals ? `
            <div class="insight-tile neutral">
              <div class="tile-icon"><i class="fas fa-balance-scale"></i></div>
              <div class="tile-body">
                <strong>${isKn ? 'ಕನಿಷ್ಠ ಲಾಭದಾಯಕ ಪ್ರಮಾಣ (Break-Even)' : 'Break-Even Minimum Quantity'}</strong>
                <p>
                  ${isKn
                    ? `ಈ ದೂರದ ಮಾರುಕಟ್ಟೆಗೆ ಸಾಗಿಸಲು ನೀವು ಕನಿಷ್ಠ <strong>${breakEvenQuintals} ಕ್ವಿಂಟಾಲ್</strong> ಮಾರಾಟ ಮಾಡಬೇಕು. ನಿಮ್ಮ ಪ್ರಮಾಣ (${quantityQuintals} ಕ್ವಿಂ) ಲಾಭದಾಯಕವಾಗಿದೆ.`
                    : `You need at least <strong>${breakEvenQuintals} Qtl</strong> to offset distant travel costs. Your quantity (${quantityQuintals} Qtl) is profitable.`}
                </p>
              </div>
            </div>
          ` : ''}

          <!-- Vehicle Trip Advice -->
          <div class="insight-tile neutral">
            <div class="tile-icon"><i class="fas fa-truck-loading"></i></div>
            <div class="tile-body">
              <strong>${isKn ? 'ವಾಹನ ಸಾಮರ್ಥ್ಯ ಮತ್ತು ಸಾರಿಗೆ ದರ' : 'Vehicle Utilization & Trips'}</strong>
              <p>
                ${isKn
                  ? `ಆಯ್ಕೆಮಾಡಿದ ವಾಹನ: <strong>${vehicle.nameKn}</strong> (${vehicle.capacityQtl} ಕ್ವಿಂ ಸಾಮರ್ಥ್ಯ). ಅಗತ್ಯವಿರುವ ಟ್ರಿಪ್‌ಗಳು: <strong>${res.tripsNeeded}</strong>.`
                  : `Selected: <strong>${vehicle.name}</strong> (${vehicle.capacityQtl} Qtl capacity). Total trips: <strong>${res.tripsNeeded}</strong>.`}
              </p>
            </div>
          </div>

          <!-- Perishability advice -->
          <div class="insight-tile ${crop.isPerishable ? 'caution' : 'neutral'}">
            <div class="tile-icon"><i class="fas ${crop.isPerishable ? 'fa-hourglass-half' : 'fa-check'}"></i></div>
            <div class="tile-body">
              <strong>${isKn ? 'ಬೆಳೆ ತಾಜಾತನ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಸಮಯ' : 'Perishability & Auction Hours'}</strong>
              <p>
                ${isKn
                  ? `ಮುಂಜಾನೆ ಹರಾಜಿನಲ್ಲಿ (06:00 - 09:00 AM) ಹೆಚ್ಚಿನ ವ್ಯಾಪಾರಿಗಳು ಭಾಗವಹಿಸುವುದರಿಂದ ಗರಿಷ್ಠ ಬೆಲೆ ಸಿಗುತ್ತದೆ.`
                  : `Morning auctions (06:00 AM - 09:00 AM) have highest buyer competition and better hammer prices.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. COMPREHENSIVE MARKET COMPARISON TABLE -->
      <div class="comparison-table-panel">
        <div class="panel-header">
          <div>
            <h3>
              <i class="fas fa-balance-scale-right" style="color:var(--primary);margin-right:6px;"></i>
              ${isKn ? 'ಎಲ್ಲಾ ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆಗಳ ಸಮಗ್ರ ವೆಚ್ಚ ಮತ್ತು ನಿವ್ವಳ ಲಾಭ ಹೋಲಿಕೆ' : 'All APMC Markets: Gross Revenue vs Net Proceeds Comparison'}
            </h3>
            <span class="sub">${quantityQuintals} Qtl ${isKn ? crop.nameKn : crop.name} • ${isKn ? 'ಹಸಿರು ಸಾಲು ಅತ್ಯಧಿಕ ಲಾಭ ನೀಡುತ್ತದೆ' : 'Green highlighted row offers the highest take-home earnings'}</span>
          </div>
        </div>

        <div class="table-responsive-box">
          <table class="market-comparison-table">
            <thead>
              <tr>
                <th>${isKn ? 'ಮಾರುಕಟ್ಟೆ (Market)' : 'APMC Market'}</th>
                <th>${isKn ? 'ದೂರ ಮತ್ತು ಸಮಯ' : 'Distance / Time'}</th>
                <th>${isKn ? 'ದರ (₹/ಕ್ವಿಂ)' : 'Price / Qtl'}</th>
                <th>${isKn ? 'ಒಟ್ಟು ಆದಾಯ' : 'Gross Revenue'}</th>
                <th>${isKn ? 'ಸಾರಿಗೆ ವೆಚ್ಚ' : 'Transport Cost'}</th>
                <th>${isKn ? 'ಮಾರುಕಟ್ಟೆ ಶುಲ್ಕ & ಕೂಲಿ' : 'Market Fees & Hamali'}</th>
                <th>${isKn ? 'ನಿವ್ವಳ ಲಾಭ (Net)' : 'Net Proceeds'}</th>
                <th>${isKn ? 'ಹೆಚ್ಚುವರಿ ಲಾಭ' : 'Extra Money'}</th>
                <th>${isKn ? 'ದಾರಿ' : 'Route'}</th>
              </tr>
            </thead>
            <tbody>
              ${markets.map((mItem, idx) => {
                const isBest = mItem.market.id === bestMarket.market.id;
                const isNearest = mItem.market.id === nearestMarket.market.id;
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${farmerLat},${farmerLng}&destination=${mItem.market.lat},${mItem.market.lng}&travelmode=driving`;

                return `
                  <tr class="${isBest ? 'winner-row' : ''}">
                    <td>
                      <div class="mandi-title-cell">
                        <strong>${isKn ? mItem.market.nameKn : mItem.market.name}</strong>
                        <div class="cell-badges">
                          ${isBest ? `<span class="badge-best">${isKn ? '🌟 ಅತ್ಯುತ್ತಮ ಲಾಭ' : '🌟 Best Net Profit'}</span>` : ''}
                          ${isNearest ? `<span class="badge-nearest">${isKn ? '📍 ಹತ್ತಿರದ ಮಂಡಿ' : '📍 Nearest Mandi'}</span>` : ''}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="cell-dist">
                        <strong>${mItem.distanceKm} km</strong>
                        <span>${formatDuration(mItem.durationMinutes, isKn ? 'kn' : 'en')}</span>
                      </div>
                    </td>
                    <td>
                      <strong class="cell-price">₹${mItem.pricePerQtl.toLocaleString()}</strong>
                    </td>
                    <td>₹${mItem.grossRevenue.toLocaleString()}</td>
                    <td>
                      <div class="cell-exp">
                        <span class="exp-val">₹${mItem.transportCost.toLocaleString()}</span>
                        <small>${mItem.tripsNeeded > 1 ? `(${mItem.tripsNeeded} trips)` : ''}</small>
                      </div>
                    </td>
                    <td>
                      <span class="exp-val">₹${(mItem.loadingCharges + mItem.unloadingCharges + mItem.marketCess + mItem.weighingFee).toLocaleString()}</span>
                    </td>
                    <td>
                      <div class="cell-net ${isBest ? 'highlight' : ''}">
                        <strong>₹${mItem.netProceeds.toLocaleString()}</strong>
                        <small>₹${mItem.perQuintalNet}/qtl net</small>
                      </div>
                    </td>
                    <td>
                      ${mItem.extraEarnings > 0 
                        ? `<span class="profit-gain">+₹${mItem.extraEarnings.toLocaleString()}</span>` 
                        : mItem.extraEarnings < 0 
                          ? `<span class="profit-loss">-₹${Math.abs(mItem.extraEarnings).toLocaleString()}</span>`
                          : `<span class="profit-base">${isKn ? 'ಆಧಾರ' : 'Base'}</span>`}
                    </td>
                    <td>
                      <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="tbl-dir-link" title="${isKn ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್‌ನಲ್ಲಿ ದಾರಿ' : 'Directions'}">
                        <i class="fas fa-external-link-alt"></i>
                      </a>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render All Mandi Rows for Tab 2
 */
function renderAllMandiRows(isKn) {
  let counter = 1;
  const rows = [];

  APMC_MARKETS.forEach(m => {
    Object.keys(m.prices).forEach(cropKey => {
      const crop = CALCULATOR_CROPS.find(c => c.id === cropKey);
      if (!crop) return;
      const priceInfo = m.prices[cropKey];

      rows.push(`
        <tr>
          <td>${counter++}</td>
          <td>
            <strong>${crop.emoji} ${isKn ? crop.nameKn : crop.name}</strong>
          </td>
          <td>
            <strong>${isKn ? m.nameKn : m.name}</strong>
            <div style="font-size:11px;color:var(--text-muted);">${m.district}</div>
          </td>
          <td><strong style="color:var(--primary-dark);font-size:15px;">₹${priceInfo.price.toLocaleString()}</strong></td>
          <td>₹${priceInfo.minPrice.toLocaleString()} - ₹${priceInfo.maxPrice.toLocaleString()}</td>
          <td>${priceInfo.arrivalsQtl} Qtl</td>
          <td><span style="font-size:11px;color:var(--text-muted);">${m.verifiedDate}</span></td>
          <td>
            <button type="button" class="btn-calc-crop" data-crop="${cropKey}" data-market="${m.id}" style="padding:4px 10px;font-size:11px;background:var(--primary);color:white;border:none;border-radius:4px;cursor:pointer;">
              <i class="fas fa-calculator"></i> ${isKn ? 'ಲಾಭ ಲೆಕ್ಕಿಸಿ' : 'Calc Profit'}
            </button>
          </td>
        </tr>
      `);
    });
  });

  return rows.join('');
}

/**
 * Normalizes input quantity into Quintals for display hints
 */
function getNormalizedQuintals(qty, unit) {
  const num = Number(qty) || 0;
  if (unit === 'kg') return (num / 100).toFixed(1);
  if (unit === 'ton') return (num * 10).toFixed(1);
  if (unit === 'crate') return (num * 0.25).toFixed(1);
  return num;
}

/**
 * Initialize Leaflet Map for the Recommended Route
 */
export function initMarketLeafletMap() {
  const mapContainer = document.getElementById('marketMap');
  if (!mapContainer || !marketState.calculationResult) return;

  const res = marketState.calculationResult;
  const { farmerLat, farmerLng, bestMarket, markets } = res;

  // Clean existing map instance if any
  if (marketState.mapInstance) {
    try {
      marketState.mapInstance.remove();
    } catch (e) {
      // ignore
    }
    marketState.mapInstance = null;
  }

  try {
    const map = L.map('marketMap', {
      zoomControl: true,
      scrollWheelZoom: false
    }).setView([farmerLat, farmerLng], 9);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    marketState.mapLayerGroup = layerGroup;

    // 1. Farmer Marker (Green Sprout)
    const farmIcon = L.divIcon({
      className: 'custom-map-pin farm-pin',
      html: `<div style="background:#16a34a;color:white;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:18px;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3);">🌾</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34]
    });

    L.marker([farmerLat, farmerLng], { icon: farmIcon })
      .bindPopup(`<strong>🌾 Your Farm (${marketState.farmerLocationName.split(',')[0]})</strong><br>Starting point for crop transportation.`)
      .addTo(layerGroup);

    // 2. APMC Market Markers
    markets.forEach(item => {
      const isBest = item.market.id === bestMarket.market.id;
      const pinColor = isBest ? '#eab308' : '#3b82f6';
      const pinIconChar = isBest ? '🌟' : '🏛️';

      const marketIcon = L.divIcon({
        className: 'custom-map-pin mandi-pin',
        html: `<div style="background:${pinColor};color:white;width:${isBest ? '38px' : '30px'};height:${isBest ? '38px' : '30px'};border-radius:50%;display:grid;place-items:center;font-size:${isBest ? '18px' : '14px'};border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3);">${pinIconChar}</div>`,
        iconSize: [isBest ? 38 : 30, isBest ? 38 : 30],
        iconAnchor: [isBest ? 19 : 15, isBest ? 38 : 30]
      });

      const popupHtml = `
        <div style="font-family:inherit;font-size:12px;min-width:180px;">
          <strong style="font-size:13px;display:block;margin-bottom:4px;">${item.market.name}</strong>
          <div>💰 Price: <strong>₹${item.pricePerQtl}/Qtl</strong></div>
          <div>🛣️ Distance: <strong>${item.distanceKm} km</strong></div>
          <div style="margin-top:4px;color:#16a34a;">🏆 Net Profit: <strong>₹${item.netProceeds.toLocaleString()}</strong></div>
          ${isBest ? `<div style="color:#ca8a04;font-weight:700;margin-top:2px;">★ Best Recommended Market</div>` : ''}
          <a href="https://www.google.com/maps/dir/?api=1&origin=${farmerLat},${farmerLng}&destination=${item.market.lat},${item.market.lng}&travelmode=driving" target="_blank" style="display:inline-block;margin-top:6px;color:#2563eb;font-weight:600;text-decoration:none;">Open in Google Maps &rarr;</a>
        </div>
      `;

      L.marker([item.market.lat, item.market.lng], { icon: marketIcon })
        .bindPopup(popupHtml)
        .addTo(layerGroup);
    });

    // 3. Draw Road Polyline to the Best Market
    if (bestMarket.polyline && bestMarket.polyline.length > 0) {
      const routeLine = L.polyline(bestMarket.polyline, {
        color: '#16a34a',
        weight: 5,
        opacity: 0.85,
        dashArray: null
      }).addTo(layerGroup);

      // Fit bounds to show farm + best market comfortably
      const groupBounds = L.latLngBounds([
        [farmerLat, farmerLng],
        [bestMarket.market.lat, bestMarket.market.lng]
      ]);
      map.fitBounds(groupBounds, { padding: [50, 50] });
    }

    marketState.mapInstance = map;
  } catch (err) {
    console.warn('Leaflet map error:', err);
  }
}

/**
 * Execute calculation and trigger re-render
 */
export async function executeMarketCalculation(onComplete) {
  marketState.isCalculating = true;

  try {
    const res = await calculateMarketEconomics({
      cropId: marketState.selectedCropId,
      quantityInput: marketState.quantity,
      unit: marketState.unit,
      farmerLat: marketState.farmerLat,
      farmerLng: marketState.farmerLng,
      farmerLocationName: marketState.farmerLocationName,
      vehicleId: marketState.selectedVehicleId,
      isRoundTrip: marketState.isRoundTrip,
      customPerKmRate: marketState.customPerKmRate || null,
      loadingPerQtl: marketState.loadingPerQtl,
      unloadingPerQtl: marketState.unloadingPerQtl,
      apmcCessPercent: marketState.apmcCessPercent,
      weighingFee: marketState.weighingFee
    });

    marketState.calculationResult = res;
  } catch (err) {
    console.error('Calculation error:', err);
  } finally {
    marketState.isCalculating = false;
    if (typeof onComplete === 'function') {
      onComplete();
    }
  }
}
