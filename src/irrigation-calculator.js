// ===================================================================
// AGROVA - Smart Irrigation & Water Science Calculation Engine
// Based on FAO-56 Irrigation Guidelines, Water Wallet Budgeting,
// and AI Agricultural Priority & Emergency Rationing Models.
// ===================================================================

/**
 * Standard Physical & Unit Conversions
 */
export const CONVERSIONS = {
  SQM_PER_ACRE: 4046.8564224,
  SQM_PER_HECTARE: 10000.0,
  SQFT_PER_ACRE: 43560.0,
  GUNTAS_PER_ACRE: 40.0,
  SQM_PER_GUNTA: 101.17141, // 4046.856 / 40
  LITRES_PER_MM_PER_SQM: 1.0, // 1 mm across 1 m² = exactly 1 Litre
  LITRES_PER_CUBIC_FOOT: 28.3168, // 1 cu ft = 28.32 Litres
  KW_PER_HP: 0.7457
};

/**
 * Calibrated Pump Pipe Delivery Flow Rates
 * Typical agricultural borewell flow rates in Karnataka based on pipe outlet diameter
 */
export const PIPE_FLOW_RATES = {
  '1.5_inch': {
    id: '1.5_inch',
    inches: 1.5,
    labelEn: '1.5 Inch Delivery Pipe (~7,200 L/hr)',
    labelKn: '1.5 ಇಂಚು ಪೈಪ್ (ಗಂಟೆಗೆ ~7,200 ಲೀಟರ್)',
    flowLph: 7200
  },
  '2.0_inch': {
    id: '2.0_inch',
    inches: 2.0,
    labelEn: '2.0 Inch Delivery Pipe (Standard ~12,000 L/hr)',
    labelKn: '2.0 ಇಂಚು ಪೈಪ್ (ಸಾಮಾನ್ಯ ಬೋರ್‌ವೆಲ್ ~12,000 L/ಗಂಟೆ)',
    flowLph: 12000
  },
  '2.5_inch': {
    id: '2.5_inch',
    inches: 2.5,
    labelEn: '2.5 Inch Delivery Pipe (~18,000 L/hr)',
    labelKn: '2.5 ಇಂಚು ಪೈಪ್ (ಗಂಟೆಗೆ ~18,000 ಲೀಟರ್)',
    flowLph: 18000
  },
  '3.0_inch': {
    id: '3.0_inch',
    inches: 3.0,
    labelEn: '3.0 Inch Delivery Pipe (High Yield ~28,000 L/hr)',
    labelKn: '3.0 ಇಂಚು ಪೈಪ್ (ಹೆಚ್ಚಿನ ಇಳುವರಿ ~28,000 L/ಗಂಟೆ)',
    flowLph: 28000
  }
};

/**
 * Qualitative Tank / Farm Pond Storage Levels
 */
export const TANK_LEVEL_PRESETS = {
  full: { id: 'full', ratio: 1.0, labelEn: 'Full (100% capacity)', labelKn: 'ಪೂರ್ಣ ತುಂಬಿದೆ (100%)' },
  three_fourths: { id: 'three_fourths', ratio: 0.75, labelEn: '3/4 Full (75% capacity)', labelKn: 'ಮುಕ್ಕಾಲು ತುಂಬಿದೆ (75%)' },
  half: { id: 'half', ratio: 0.50, labelEn: 'Half Full (50% capacity)', labelKn: 'ಅರ್ಧ ತುಂಬಿದೆ (50%)' },
  one_fourth: { id: 'one_fourth', ratio: 0.25, labelEn: '1/4 Low (25% capacity)', labelKn: 'ಕಾಲು ಭಾಗ (25%)' },
  low: { id: 'low', ratio: 0.10, labelEn: 'Very Low / Near Empty (10%)', labelKn: 'ತುಂಬಾ ಕಡಿಮೆ (10%)' }
};

/**
 * Standard Karnataka Krishi Honda (Farm Pond) Dimensions
 */
export const KRISHI_HONDA_PRESETS = {
  small: { id: 'small', labelEn: 'Small Pond (20 × 20 × 10 ft)', labelKn: 'ಸಣ್ಣ ಕೃಷಿ ಹೊಂಡ (20 × 20 × 10 ಅಡಿ)', capacityLitres: 113000 },
  medium: { id: 'medium', labelEn: 'Medium Pond (30 × 30 × 10 ft)', labelKn: 'ಮಧ್ಯಮ ಕೃಷಿ ಹೊಂಡ (30 × 30 × 10 ಅಡಿ)', capacityLitres: 255000 },
  large: { id: 'large', labelEn: 'Large Pond (40 × 40 × 10 ft)', labelKn: 'ದೊಡ್ಡ ಕೃಷಿ ಹೊಂಡ (40 × 40 × 10 ಅಡಿ)', capacityLitres: 453000 },
  tanker: { id: 'tanker', labelEn: 'Tractor Tanker (5,000 L per trip)', labelKn: 'ಟ್ರಾಕ್ಟರ್ ಟ್ಯಾಂಕರ್ (5,000 L ಪ್ರತಿ ಟ್ರಿಪ್)', capacityLitres: 5000 },
  custom: { id: 'custom', labelEn: 'Custom Dimensions (Feet)', labelKn: 'ಅಳತೆಗಳು (ಅಡಿಗಳಲ್ಲಿ)' }
};

/**
 * Irrigation Method Efficiencies (Application & Conveyance)
 * Source: FAO Irrigation & Drainage Paper No. 24 & 56
 */
export const IRRIGATION_METHODS = {
  drip: {
    id: 'drip',
    nameEn: 'Drip Irrigation',
    nameKn: 'ಹನಿ ನೀರಾವರಿ',
    efficiency: 0.90, // 90% water reaching root zone
    laborReduction: 0.70, // 70% lower labour
    energyRequirement: 'Medium',
    subsidyPercent: 75, // Under PMKSY (Per Drop More Crop)
    capitalCostPerAcre: 35000,
    maintenancePerAcreYear: 1800
  },
  sprinkler: {
    id: 'sprinkler',
    nameEn: 'Sprinkler / Micro-Sprinkler',
    nameKn: 'ತುಂತುರು ನೀರಾವರಿ',
    efficiency: 0.75, // 75%
    laborReduction: 0.50,
    energyRequirement: 'High',
    subsidyPercent: 55,
    capitalCostPerAcre: 22000,
    maintenancePerAcreYear: 1200
  },
  flood: {
    id: 'flood',
    nameEn: 'Flood / Basin Irrigation',
    nameKn: 'ಹರಿವು / ಬಸಿ ನೀರಾವರಿ',
    efficiency: 0.50, // 50% (50% lost to deep percolation & runoff)
    laborReduction: 0.0,
    energyRequirement: 'Low',
    subsidyPercent: 0,
    capitalCostPerAcre: 3000,
    maintenancePerAcreYear: 3500
  },
  furrow: {
    id: 'furrow',
    nameEn: 'Furrow Irrigation',
    nameKn: 'ಸಾಲು ನೀರಾವರಿ',
    efficiency: 0.60, // 60%
    laborReduction: 0.20,
    energyRequirement: 'Low',
    subsidyPercent: 0,
    capitalCostPerAcre: 5000,
    maintenancePerAcreYear: 3000
  }
};

/**
 * Soil Water Characteristics
 * Available Water Capacity (AWC) in mm of water per meter of soil depth
 */
export const SOIL_PROPERTIES = {
  sandy: {
    id: 'sandy',
    nameEn: 'Sandy Soil',
    nameKn: 'ಮರಳು ಮಿಶ್ರಿತ ಮಣ್ಣು',
    awc_mm_per_m: 70, // low retention, fast drainage
    infiltrationRate: 'High (20-30 mm/hr)',
    suggestedFrequency: 'Frequent light irrigations'
  },
  loamy: {
    id: 'loamy',
    nameEn: 'Loamy Soil (Ideal)',
    nameKn: 'ಗೋಡು ಮಣ್ಣು',
    awc_mm_per_m: 140, // balanced retention & aeration
    infiltrationRate: 'Medium (10-15 mm/hr)',
    suggestedFrequency: 'Moderate intervals'
  },
  clay: {
    id: 'clay',
    nameEn: 'Clay Soil / Black Cotton',
    nameKn: 'ಕಪ್ಪು / ಜೇಡಿ ಮಣ್ಣು',
    awc_mm_per_m: 180, // high water holding, poor aeration if waterlogged
    infiltrationRate: 'Slow (2-5 mm/hr)',
    suggestedFrequency: 'Longer intervals, avoid waterlogging'
  },
  red_loam: {
    id: 'red_loam',
    nameEn: 'Red Loam Soil (Karnataka Typical)',
    nameKn: 'ಕೆಂಪು ಗೋಡು ಮಣ್ಣು',
    awc_mm_per_m: 120,
    infiltrationRate: 'Medium-High (12-18 mm/hr)',
    suggestedFrequency: 'Every 3-5 days in dry season'
  }
};

/**
 * FAO-56 Crop Coefficients (Kc) and Crop Stages
 * Includes Yield Response Factor (Ky) to water deficit
 * Ky > 1: crop is sensitive to water deficit (heavy yield loss if stressed)
 * Ky < 1: crop is more tolerant to deficit
 */
export const CROP_IRRIGATION_PROFILES = {
  tomato: {
    id: 'tomato',
    nameEn: 'Tomato',
    nameKn: 'ಟೊಮೆಟೊ',
    totalDays: 120,
    rootDepth_m: 0.6,
    stages: {
      initial: { labelEn: 'Initial / Nursery', labelKn: 'ಆರಂಭಿಕ / ಸಸಿ ಹಂತ', days: 20, kc: 0.60, ky: 0.40 },
      vegetative: { labelEn: 'Vegetative Growth', labelKn: 'ಸಸ್ಯ ಬೆಳವಣಿಗೆ ಹಂತ', days: 30, kc: 0.85, ky: 0.70 },
      flowering: { labelEn: 'Flowering & Fruit Set', labelKn: 'ಹೂವು ಮತ್ತು ಕಾಯಿ ಕಟ್ಟುವ ಹಂತ', days: 40, kc: 1.15, ky: 1.20 }, // High critical sensitivity!
      maturity: { labelEn: 'Ripening & Harvest', labelKn: 'ಕಾಯಿ ಮಾಗುವಿಕೆ ಮತ್ತು ಕೊಯ್ಲು', days: 30, kc: 0.80, ky: 0.50 }
    },
    criticalStage: 'flowering',
    criticalWarningEn: 'Water deficit during flowering causes blossom drop and Blossom End Rot (BER). Do not delay.',
    criticalWarningKn: 'ಹೂ ಬಿಡುವ ಹಂತದಲ್ಲಿ ನೀರು ಕಡಿಮೆಯಾದರೆ ಹೂವು ಉದುರಿ ಇಳುವರಿ ಶೇ. 40-50% ಕುಸಿಯುತ್ತದೆ.',
    maxMoistureDepletion: 0.40 // MAD = 40% before stress
  },
  maize: {
    id: 'maize',
    nameEn: 'Maize / Corn',
    nameKn: 'ಮೆಕ್ಕೆಜೋಳ',
    totalDays: 110,
    rootDepth_m: 0.8,
    stages: {
      initial: { labelEn: 'Initial Emergence', labelKn: 'ಮೊಳಕೆ ಹಂತ', days: 20, kc: 0.40, ky: 0.35 },
      vegetative: { labelEn: 'Vegetative / Knee High', labelKn: 'ಮಧ್ಯಮ ಬೆಳವಣಿಗೆ ಹಂತ', days: 35, kc: 0.80, ky: 0.55 },
      silking: { labelEn: 'Tasseling / Silking', labelKn: 'ತೆನೆ ಹೂವು / ಜೊಂಡು ಕಟ್ಟುವ ಹಂತ', days: 30, kc: 1.20, ky: 1.25 }, // Extremely sensitive
      maturity: { labelEn: 'Grain Filling & Maturity', labelKn: 'ಕಾಳು ತುಂಬುವ ಹಂತ', days: 25, kc: 0.65, ky: 0.50 }
    },
    criticalStage: 'silking',
    criticalWarningEn: 'Moisture stress during tasseling/silking leads to poor pollination and missing grains on cob.',
    criticalWarningKn: 'ತೆನೆ ಮೂಡುವಾಗ ನೀರು ಕಡಿಮೆಯಾದರೆ ಕಾಳು ಕಟ್ಟುವುದಿಲ್ಲ; ಪೊಳ್ಳು ತೆನೆಗಳು ಉಂಟಾಗುತ್ತವೆ.',
    maxMoistureDepletion: 0.50
  },
  rice: {
    id: 'rice',
    nameEn: 'Paddy (Rice)',
    nameKn: 'ಭತ್ತ',
    totalDays: 135,
    rootDepth_m: 0.4,
    stages: {
      initial: { labelEn: 'Transplanting / Nursery', labelKn: 'ನಾಟಿ ಹಂತ', days: 25, kc: 1.10, ky: 0.80 },
      tillering: { labelEn: 'Active Tillering', labelKn: 'ಕವಲು ಒಡೆಯುವ ಹಂತ', days: 35, kc: 1.25, ky: 0.90 },
      panicle: { labelEn: 'Panicle Initiation & Flowering', labelKn: 'ತೆನೆ ಒಡೆಯುವ ಮತ್ತು ಹೂ ಹಂತ', days: 45, kc: 1.35, ky: 1.30 },
      maturity: { labelEn: 'Grain Ripening', labelKn: 'ಕಾಳು ಮಾಗುವ ಹಂತ', days: 30, kc: 0.95, ky: 0.50 }
    },
    criticalStage: 'panicle',
    criticalWarningEn: 'Panicle emergence requires saturated soil; water stress causes sterile spikelets.',
    criticalWarningKn: 'ತೆನೆ ಬರುವಾಗ ಗದ್ದೆಯಲ್ಲಿ ತೇವಾಂಶ ಕೊರತೆಯಾದರೆ ಕಾಳು ಜೊಳ್ಳಾಗುತ್ತದೆ.',
    maxMoistureDepletion: 0.20
  },
  sugarcane: {
    id: 'sugarcane',
    nameEn: 'Sugarcane',
    nameKn: 'ಕಬ್ಬು',
    totalDays: 360,
    rootDepth_m: 1.0,
    stages: {
      initial: { labelEn: 'Germination & Establishment', labelKn: 'ಮೊಳಕೆಯೊಡೆಯುವ ಹಂತ', days: 45, kc: 0.45, ky: 0.60 },
      tillering: { labelEn: 'Tillering Phase', labelKn: 'ಕಬ್ಬಿನ ಕವಲು ಹಂತ', days: 90, kc: 0.85, ky: 0.75 },
      grand_growth: { labelEn: 'Grand Growth / Cane Elongation', labelKn: 'ತೀವ್ರ ಬೆಳವಣಿಗೆ ಹಂತ', days: 150, kc: 1.25, ky: 1.10 },
      ripening: { labelEn: 'Maturity & Sugar Synthesis', labelKn: 'ಪಕ್ವತೆ ಹಂತ', days: 75, kc: 0.70, ky: 0.40 }
    },
    criticalStage: 'grand_growth',
    criticalWarningEn: 'Water stress in grand growth curtails internode length and cane tonnage severely.',
    criticalWarningKn: 'ಬೆಳವಣಿಗೆಯ ಹಂತದಲ್ಲಿ ನೀರು ಕಡಿಮೆಯಾದರೆ ಕಬ್ಬಿನ ಗಿಣ್ಣುಗಳು ಚಿಕ್ಕದಾಗಿ ತೂಕ ಕಡಿಮೆಯಾಗುತ್ತದೆ.',
    maxMoistureDepletion: 0.55
  },
  cotton: {
    id: 'cotton',
    nameEn: 'Cotton',
    nameKn: 'ಹತ್ತಿ',
    totalDays: 160,
    rootDepth_m: 0.9,
    stages: {
      initial: { labelEn: 'Seedling', labelKn: 'ಸಸಿ ಹಂತ', days: 25, kc: 0.45, ky: 0.35 },
      vegetative: { labelEn: 'Vegetative Branching', labelKn: 'ಕೊಂಬೆ ಒಡೆಯುವ ಹಂತ', days: 40, kc: 0.75, ky: 0.60 },
      flowering: { labelEn: 'Flowering & Boll Formation', labelKn: 'ಹೂವು ಮತ್ತು ಕಾಯಿ ಹಂತ', days: 60, kc: 1.15, ky: 1.15 },
      maturity: { labelEn: 'Boll Opening', labelKn: 'ಹತ್ತಿ ಕಾಯಿ ಒಡೆಯುವ ಹಂತ', days: 35, kc: 0.65, ky: 0.40 }
    },
    criticalStage: 'flowering',
    criticalWarningEn: 'Boll shedding increases up to 60% if water deficit occurs during peak flowering.',
    criticalWarningKn: 'ಹೂವು-ಕಾಯಿ ಹಂತದಲ್ಲಿ ನೀರಿನ ಒತ್ತಡ ಉಂಟಾದರೆ ಮೊಗ್ಗುಗಳು ಉದುರಿ ನಷ್ಟವಾಗುತ್ತದೆ.',
    maxMoistureDepletion: 0.50
  },
  coconut: {
    id: 'coconut',
    nameEn: 'Coconut',
    nameKn: 'ತೆಂಗು',
    totalDays: 365,
    rootDepth_m: 1.2,
    stages: {
      uniform: { labelEn: 'Perennial Palm (Flowering & Nut bearing)', labelKn: 'ನಿರಂತರ ಇಳುವರಿ ಹಂತ', days: 365, kc: 0.75, ky: 0.85 }
    },
    criticalStage: 'uniform',
    criticalWarningEn: 'Severe summer moisture stress causes button shedding and reduced nut size after 6 months.',
    criticalWarningKn: 'ಬೇಸಿಗೆಯಲ್ಲಿ ನೀರು ಕಡಿಮೆಯಾದರೆ ಚಿಗುರು ಮತ್ತು ಎಳೆಗಾಯಿ ಉದುರಿ ಮುಂದಿನ ವರ್ಷದ ಇಳುವರಿ ಕಡಿಮೆಯಾಗುತ್ತದೆ.',
    maxMoistureDepletion: 0.50
  },
  onion: {
    id: 'onion',
    nameEn: 'Onion',
    nameKn: 'ಈರುಳ್ಳಿ',
    totalDays: 110,
    rootDepth_m: 0.4,
    stages: {
      initial: { labelEn: 'Initial Growth', labelKn: 'ಆರಂಭಿಕ ಹಂತ', days: 20, kc: 0.50, ky: 0.45 },
      vegetative: { labelEn: 'Foliage Growth', labelKn: 'ಎಲೆ ಬೆಳವಣಿಗೆ ಹಂತ', days: 30, kc: 0.80, ky: 0.65 },
      bulb: { labelEn: 'Bulb Enlargement', labelKn: 'ಗೆಡ್ಡೆ ಕಟ್ಟುವ ಹಂತ', days: 40, kc: 1.05, ky: 1.20 },
      maturity: { labelEn: 'Maturation', labelKn: 'ಪಕ್ವತೆ ಹಂತ', days: 20, kc: 0.75, ky: 0.40 }
    },
    criticalStage: 'bulb',
    criticalWarningEn: 'Bulb enlargement phase needs steady moisture; dry spell splits bulbs and reduces size.',
    criticalWarningKn: 'ಗೆಡ್ಡೆ ದೊಡ್ಡದಾಗುವ ಹಂತದಲ್ಲಿ ನೀರು ಕಡಿಮೆಯಾದರೆ ಗಾತ್ರ ಕುಗ್ಗುತ್ತದೆ ಮತ್ತು ಗೆಡ್ಡೆ ಸೀಳುತ್ತದೆ.',
    maxMoistureDepletion: 0.35
  },
  ragi: {
    id: 'ragi',
    nameEn: 'Finger Millet (Ragi)',
    nameKn: 'ರಾಗಿ',
    totalDays: 105,
    rootDepth_m: 0.5,
    stages: {
      initial: { labelEn: 'Initial', labelKn: 'ಆರಂಭಿಕ', days: 20, kc: 0.40, ky: 0.30 },
      vegetative: { labelEn: 'Vegetative Tillering', labelKn: 'ಕವಲೊಡೆಯುವ ಹಂತ', days: 30, kc: 0.75, ky: 0.50 },
      flowering: { labelEn: 'Earhead Emergence', labelKn: 'ತೆನೆ ಬರುವ ಹಂತ', days: 35, kc: 1.10, ky: 1.05 },
      maturity: { labelEn: 'Maturity', labelKn: 'ಮಾಗುವ ಹಂತ', days: 20, kc: 0.60, ky: 0.35 }
    },
    criticalStage: 'flowering',
    criticalWarningEn: 'Drought hardy crop; 1-2 protective irrigations at earhead emergence ensure full grain yield.',
    criticalWarningKn: 'ತೆನೆ ಬರುವಾಗ 1-2 ರಕ್ಷಣಾತ್ಮಕ ನೀರಾವರಿ ನೀಡಿದರೆ ಉತ್ತಮ ಇಳುವರಿ ಸಿಗುತ್ತದೆ.',
    maxMoistureDepletion: 0.60
  }
};

/**
 * 1. Convert Area to Square Meters
 */
export function convertAreaToSqm(area, unit = 'acre') {
  const a = parseFloat(area) || 0;
  if (a <= 0) return 0;
  switch (unit.toLowerCase()) {
    case 'acre':
    case 'acres':
      return a * CONVERSIONS.SQM_PER_ACRE;
    case 'hectare':
    case 'hectares':
    case 'ha':
      return a * CONVERSIONS.SQM_PER_HECTARE;
    case 'sqm':
    case 'm2':
      return a;
    case 'gunta':
    case 'guntas':
      return a * (CONVERSIONS.SQM_PER_ACRE / 40.0); // 1 acre = 40 guntas in Karnataka
    default:
      return a * CONVERSIONS.SQM_PER_ACRE;
  }
}

/**
 * Parse Farmer Land Area (Acres and Guntas)
 * In Karnataka & South India, land is universally measured in Acres & Guntas (1 Acre = 40 Guntas)
 */
export function parseFarmerArea({ acres = 1, guntas = 0, unit = 'acre_gunta' }) {
  let totalAcres = 0;
  if (unit === 'gunta') {
    totalAcres = (parseFloat(guntas) || 0) / CONVERSIONS.GUNTAS_PER_ACRE;
  } else if (unit === 'hectare') {
    totalAcres = (parseFloat(acres) || 0) * 2.47105;
  } else {
    // acre or acre_gunta
    totalAcres = (parseFloat(acres) || 0) + ((parseFloat(guntas) || 0) / CONVERSIONS.GUNTAS_PER_ACRE);
  }

  const roundedAcres = Math.floor(totalAcres);
  const remainingGuntas = Math.round((totalAcres - roundedAcres) * CONVERSIONS.GUNTAS_PER_ACRE);

  return {
    totalAcres: parseFloat(totalAcres.toFixed(3)),
    totalGuntas: Math.round(totalAcres * CONVERSIONS.GUNTAS_PER_ACRE),
    acres: roundedAcres,
    guntas: remainingGuntas,
    sqm: Math.round(totalAcres * CONVERSIONS.SQM_PER_ACRE),
    labelEn: `${roundedAcres} Acre ${remainingGuntas > 0 ? remainingGuntas + ' Gunta' : ''}`.trim() || '0 Acre',
    labelKn: `${roundedAcres} ಎಕರೆ ${remainingGuntas > 0 ? remainingGuntas + ' ಗುಂಟೆ' : ''}`.trim() || '0 ಎಕರೆ'
  };
}

/**
 * Convert Litres to Motor Running Time
 * Tells the farmer how many hours & minutes to run their motor at their pump's delivery flow rate
 */
export function convertLitresToMotorTime(litres, flowRateLph = 12000) {
  const l = Math.max(0, parseFloat(litres) || 0);
  const flow = Math.max(500, parseFloat(flowRateLph) || 12000);
  const totalHours = l / flow;
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  let labelEn = `${hours}h ${minutes}m motor run`;
  let labelKn = `${hours} ಗಂಟೆ ${minutes} ನಿಮಿಷ ಮೋಟಾರ್`;
  if (hours === 0) {
    labelEn = `${minutes} mins motor run`;
    labelKn = `${minutes} ನಿಮಿಷ ಮೋಟಾರ್`;
  }

  return {
    totalHours: parseFloat(totalHours.toFixed(2)),
    hours,
    minutes,
    labelEn,
    labelKn,
    litres: Math.round(l),
    flowRateLph: flow
  };
}

/**
 * Convert Motor Running Time to Litres
 * Calculates water volume delivered based on calibrated pump flow rate and motor runtime
 */
export function convertMotorTimeToLitres(hours = 0, minutes = 0, flowRateLph = 12000) {
  const h = (parseFloat(hours) || 0) + ((parseFloat(minutes) || 0) / 60);
  const flow = Math.max(500, parseFloat(flowRateLph) || 12000);
  return Math.round(h * flow);
}

/**
 * Calculate Farm Pond (Krishi Honda) Volume from Dimensions & Qualitative Fill Level
 */
export function calculatePondVolumeLitres({
  presetId = 'medium',
  lengthFt = 30,
  widthFt = 30,
  depthFt = 10,
  levelKey = 'full',
  levelId = null
}) {
  const key = levelId || levelKey || 'full';
  const level = TANK_LEVEL_PRESETS[key] || TANK_LEVEL_PRESETS.full;
  let totalCapacity = 0;

  if (presetId && KRISHI_HONDA_PRESETS[presetId] && presetId !== 'custom') {
    totalCapacity = KRISHI_HONDA_PRESETS[presetId].capacityLitres;
  } else {
    // V = L * W * D * 28.317 (ponds have ~1:1 slope banks, so average volume is ~80% of cuboid)
    const cuFt = (parseFloat(lengthFt) || 30) * (parseFloat(widthFt) || 30) * (parseFloat(depthFt) || 10);
    totalCapacity = Math.round(cuFt * 0.80 * CONVERSIONS.LITRES_PER_CUBIC_FOOT);
  }

  const usableLitres = Math.round(totalCapacity * level.ratio);

  return {
    totalCapacityLitres: totalCapacity,
    maxCapacityLitres: totalCapacity,
    usableLitres,
    currentUsableLitres: usableLitres,
    fillRatio: level.ratio,
    levelLabelEn: level.labelEn,
    levelLabelKn: level.labelKn
  };
}

/**
 * Calculate Open Well Water Volume from Diameter and Water Depth in Feet
 * Safeguard: Does NOT equate water depth with sustainable yield without knowing recharge rate.
 */
export function calculateWellVolumeLitres({
  diameterFt = 15,
  waterDepthFt = 12
}) {
  const d = Math.max(3, parseFloat(diameterFt) || 15);
  const depth = Math.max(0, parseFloat(waterDepthFt) || 0);
  const radius = d / 2;
  const cylinderCuFt = Math.PI * radius * radius * depth;
  const litres = Math.round(cylinderCuFt * CONVERSIONS.LITRES_PER_CUBIC_FOOT);

  return {
    litres,
    standingVolumeLitres: litres,
    usableLitres: Math.round(litres * 0.85),
    diameterFt: d,
    waterDepthFt: depth,
    rechargeNoteEn: `Standing volume estimated at ~${litres.toLocaleString()} L. Sustainable pumping depends on ground recharge.`,
    rechargeNoteKn: `ಬಾವಿಯಲ್ಲಿ ಸದ್ಯ ಸುಮಾರು ${litres.toLocaleString()} L ನೀರಿದೆ. ಬಾವಿ ಮರುಪೂರಣ (ನೆಲದ ಊಟೆ) ಸಾಮರ್ಥ್ಯಕ್ಕೆ ತಕ್ಕಂತೆ ಪಂಪ್ ಮಾಡಿ.`
  };
}

/**
 * 2. Calculate Effective Rainfall (USDA SCS Method)
 * Not all fallen rain is usable; light drizzle evaporates, heavy downpour runs off.
 */
export function calculateEffectiveRainfall(rainfall_mm) {
  const r = Math.max(0, parseFloat(rainfall_mm) || 0);
  if (r <= 4) return 0; // negligible penetration
  if (r <= 25) {
    return Math.max(0, (r - 4) * 0.8);
  }
  // For rain > 25 mm: max soil storage rate tapers
  return (21 * 0.8) + (r - 25) * 0.5;
}

/**
 * 3. Crop Evapotranspiration (ETc = ET0 * Kc) & Irrigation Demand (FAO-56)
 */
export function calculateCropWaterRequirement({
  cropId = 'tomato',
  stageKey = 'flowering',
  areaValue = 1.0,
  areaAcres = undefined,
  areaGuntas = 0,
  areaUnit = 'acre',
  et0_mm = 4.8, // Reference evapotranspiration (default 4.8 mm/day for Southern Karnataka)
  irrigationMethodId = 'drip',
  soilId = 'loamy',
  recentRainfall_mm = 0,
  soilMoisturePercent = null, // e.g. 45% measured
  flowRateLph = 12000 // Measured or calibrated pump flow rate
}) {
  const crop = CROP_IRRIGATION_PROFILES[cropId] || CROP_IRRIGATION_PROFILES.tomato;
  const stage = crop.stages[stageKey] || Object.values(crop.stages)[0];
  const method = IRRIGATION_METHODS[irrigationMethodId] || IRRIGATION_METHODS.drip;
  const soil = SOIL_PROPERTIES[soilId] || SOIL_PROPERTIES.loamy;

  // Farmer area calculation
  const effectiveAcres = areaAcres !== undefined ? (parseFloat(areaAcres) || 0) + ((parseFloat(areaGuntas) || 0) / 40.0) : parseFloat(areaValue) || 1.0;
  const farmerArea = parseFarmerArea({ acres: effectiveAcres, guntas: 0, unit: 'acre' });
  const areaSqm = farmerArea.sqm;

  const kc = stage.kc;
  // Daily Crop Evapotranspiration (mm/day)
  const dailyETc_mm = et0_mm * kc;

  // Effective rainfall credit (mm)
  const peff_mm = calculateEffectiveRainfall(recentRainfall_mm);

  // Net irrigation depth needed (mm/day)
  let netDepth_mm = Math.max(0, dailyETc_mm - peff_mm);

  // If soil moisture reading is provided, adjust requirement:
  let moistureAdjustmentFactor = 1.0;
  let soilMoistureStatus = 'Optimal';
  let soilMoistureStatusKn = 'ಉತ್ತಮ ತೇವಾಂಶ';

  if (soilMoisturePercent !== null && !isNaN(soilMoisturePercent)) {
    const sm = parseFloat(soilMoisturePercent);
    if (sm >= 75) {
      moistureAdjustmentFactor = 0.35; // Wet, delay heavy irrigation
      soilMoistureStatus = 'Wet / High Moisture';
      soilMoistureStatusKn = 'ಹೆಚ್ಚು ತೇವಾಂಶವಿದೆ (ನೀರು ಸಾಕು)';
    } else if (sm >= 55) {
      moistureAdjustmentFactor = 0.80; // Adequate
      soilMoistureStatus = 'Adequate';
      soilMoistureStatusKn = 'ಸಾಕಷ್ಟು ತೇವಾಂಶ';
    } else if (sm >= 35) {
      moistureAdjustmentFactor = 1.05; // Normal depletion
      soilMoistureStatus = 'Moderate';
      soilMoistureStatusKn = 'ಮಧ್ಯಮ ತೇವಾಂಶ';
    } else {
      moistureAdjustmentFactor = 1.35; // Deficit stress, root zone dry
      soilMoistureStatus = 'Critically Dry';
      soilMoistureStatusKn = 'ಅತ್ಯಂತ ಒಣ ಮಣ್ಣು (ತುರ್ತು ನೀರು ಬೇಕು)';
    }
  }

  netDepth_mm = netDepth_mm * moistureAdjustmentFactor;

  // Gross irrigation depth accounting for irrigation application efficiency
  const grossDepth_mm = netDepth_mm / method.efficiency;

  // Litres = mm × m² × 1 L/(mm·m²)
  const dailyNetLitres = Math.round(netDepth_mm * areaSqm);
  const dailyGrossLitres = Math.round(grossDepth_mm * areaSqm);

  // Single irrigation event recommendation (typically 2-3 days interval for drip, 6-8 days for furrow)
  let irrigationIntervalDays = 2;
  if (method.id === 'drip') {
    irrigationIntervalDays = soil.id === 'sandy' ? 1.5 : 2;
  } else if (method.id === 'sprinkler') {
    irrigationIntervalDays = 3;
  } else {
    irrigationIntervalDays = soil.id === 'clay' ? 7 : 5;
  }

  const perEventGrossLitres = Math.round(dailyGrossLitres * irrigationIntervalDays);

  // Farmer-friendly Motor Running Time
  const dailyMotorRuntime = convertLitresToMotorTime(dailyGrossLitres, flowRateLph);
  const perEventMotorRuntime = convertLitresToMotorTime(perEventGrossLitres, flowRateLph);

  return {
    crop,
    stage,
    kc,
    et0_mm,
    dailyETc_mm: parseFloat(dailyETc_mm.toFixed(2)),
    effectiveRainfall_mm: parseFloat(peff_mm.toFixed(2)),
    netDepth_mm: parseFloat(netDepth_mm.toFixed(2)),
    grossDepth_mm: parseFloat(grossDepth_mm.toFixed(2)),
    efficiency: method.efficiency,
    areaSqm: Math.round(areaSqm),
    farmerArea,
    dailyNetLitres,
    dailyGrossLitres,
    irrigationIntervalDays,
    perEventGrossLitres,
    dailyMotorRuntime,
    perEventMotorRuntime,
    soilMoistureStatus,
    soilMoistureStatusKn,
    isCriticalStage: crop.criticalStage === stageKey,
    criticalWarningEn: crop.criticalWarningEn,
    criticalWarningKn: crop.criticalWarningKn
  };
}

/**
 * 4. Automatic Growth Stage Calculator from Sowing Date
 */
export function estimateCropStageFromSowingDate(cropId, sowingDateStr) {
  const crop = CROP_IRRIGATION_PROFILES[cropId] || CROP_IRRIGATION_PROFILES.tomato;
  if (!sowingDateStr) {
    const defaultStageKey = Object.keys(crop.stages)[0];
    return { stageKey: defaultStageKey, daysElapsed: 0, stage: crop.stages[defaultStageKey] };
  }

  const sowingDate = new Date(sowingDateStr);
  const today = new Date();
  const diffTime = today.getTime() - sowingDate.getTime();
  const daysElapsed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  let cumulativeDays = 0;
  for (const [key, stage] of Object.entries(crop.stages)) {
    cumulativeDays += stage.days;
    if (daysElapsed <= cumulativeDays) {
      return { stageKey: key, daysElapsed, stage };
    }
  }

  // If elapsed exceeds total, return maturity stage
  const lastKey = Object.keys(crop.stages).pop();
  return { stageKey: lastKey, daysElapsed, stage: crop.stages[lastKey] };
}

/**
 * 5. Water Wallet Budgeting Engine
 * Balance = Initial Usable Water + Recorded Inflow - Planned Irrigation Outflows - Other Recorded Uses
 */
export function calculateWaterWalletBudget({
  currentUsableWaterLitres = 5000,
  storageCapacityLitres = 20000,
  expectedInflows = [], // Array of { date, litres, source, confirmed }
  fields = [], // Registered fields
  planningHorizonDays = 7,
  otherRecordedUsesLitres = 0,
  flowRateLph = 12000,
  isDailyReplenishable = false,
  sourceType = 'motor_minutes'
}) {
  const currentBalance = Math.max(0, parseFloat(currentUsableWaterLitres) || 0);
  const capacity = Math.max(currentBalance, parseFloat(storageCapacityLitres) || 0);

  // Confirmed inflows in the planning horizon
  const totalExpectedInflow = expectedInflows.reduce((sum, item) => sum + (parseFloat(item.litres) || 0), 0);

  // Compute total planned irrigation across all registered fields
  let totalDailyGrossLitres = 0;
  let totalAcresSum = 0;

  const fieldDemands = fields.map(field => {
    const areaAcres = field.areaAcres !== undefined ? field.areaAcres : (field.area || 1.0);
    const areaGuntas = field.areaGuntas || 0;
    const effectiveAcres = (parseFloat(areaAcres) || 0) + ((parseFloat(areaGuntas) || 0) / 40.0);
    totalAcresSum += effectiveAcres;

    const req = calculateCropWaterRequirement({
      cropId: field.cropId || 'tomato',
      stageKey: field.stageKey || 'flowering',
      areaValue: effectiveAcres,
      areaAcres,
      areaGuntas,
      areaUnit: 'acre',
      et0_mm: field.et0_mm || 4.8,
      irrigationMethodId: field.irrigationMethod || 'drip',
      soilId: field.soilType || 'loamy',
      recentRainfall_mm: field.recentRainfall_mm || 0,
      soilMoisturePercent: field.soilMoisture !== undefined ? field.soilMoisture : null,
      flowRateLph
    });
    totalDailyGrossLitres += req.dailyGrossLitres;

    return {
      fieldId: field.id,
      fieldName: field.name,
      cropName: req.crop.nameEn,
      cropNameKn: req.crop.nameKn,
      stageName: req.stage.labelEn,
      stageNameKn: req.stage.labelKn,
      farmerArea: req.farmerArea,
      dailyDemandLitres: req.dailyGrossLitres,
      horizonDemandLitres: req.dailyGrossLitres * planningHorizonDays,
      perEventLitres: req.perEventGrossLitres,
      dailyMotorRuntime: req.dailyMotorRuntime,
      perEventMotorRuntime: req.perEventMotorRuntime,
      horizonMotorRuntime: convertLitresToMotorTime(req.dailyGrossLitres * planningHorizonDays, flowRateLph),
      isCriticalStage: req.isCriticalStage,
      ky: req.stage.ky,
      requirement: req
    };
  });

  const totalHorizonDemandLitres = totalDailyGrossLitres * planningHorizonDays;
  
  // Daily sources (like pump running hours or borewell daily supply) replenish every day
  const isDaily = isDailyReplenishable || sourceType === 'motor_minutes' || sourceType === 'borewell';
  const totalWaterAvailableInHorizon = isDaily
    ? (currentBalance * planningHorizonDays) + totalExpectedInflow
    : currentBalance + totalExpectedInflow;

  const projectedRemainingLitres = totalWaterAvailableInHorizon - totalHorizonDemandLitres - (parseFloat(otherRecordedUsesLitres) || 0);

  // If no fields registered, there is no water shortage
  const isShortage = fields.length === 0
    ? false
    : (isDaily
        ? (currentBalance < totalDailyGrossLitres || projectedRemainingLitres < 0)
        : (projectedRemainingLitres < 0));

  const shortageLitres = isShortage
    ? Math.abs(isDaily && currentBalance < totalDailyGrossLitres ? (totalDailyGrossLitres - currentBalance) * planningHorizonDays : projectedRemainingLitres)
    : 0;

  const daysOfWaterRemaining = fields.length === 0
    ? 999
    : (totalDailyGrossLitres > 0
        ? (isDaily && currentBalance >= totalDailyGrossLitres ? 999 : parseFloat((currentBalance / totalDailyGrossLitres).toFixed(1)))
        : 999);

  // Percentage of capacity currently occupied
  const fillPercentage = capacity > 0 ? Math.min(100, Math.round((currentBalance / capacity) * 100)) : 0;

  // Farmer-friendly conversions: Motor Running Time and Irrigable Area
  const motorHoursAvailable = convertLitresToMotorTime(currentBalance, flowRateLph);
  const dailyMotorHoursAvailable = convertLitresToMotorTime(currentBalance, flowRateLph);
  const dailyMotorHoursNeeded = convertLitresToMotorTime(totalDailyGrossLitres, flowRateLph);
  const horizonMotorHoursNeeded = convertLitresToMotorTime(totalHorizonDemandLitres, flowRateLph);
  const shortageMotorHours = convertLitresToMotorTime(shortageLitres, flowRateLph);
  const dailyNetLitres = Math.abs(currentBalance - totalDailyGrossLitres);
  const dailyNetMotorHours = convertLitresToMotorTime(dailyNetLitres, flowRateLph);
  const dailyShortageLitres = isDaily ? Math.max(0, totalDailyGrossLitres - currentBalance) : Math.round(shortageLitres / planningHorizonDays);
  const dailySurplusLitres = isDaily ? Math.max(0, currentBalance - totalDailyGrossLitres) : Math.max(0, Math.round(projectedRemainingLitres / planningHorizonDays));

  // Irrigable Area: how many acres/guntas can be irrigated with current available water
  const avgLitresPerAcreDaily = totalAcresSum > 0 ? (totalDailyGrossLitres / totalAcresSum) : 25000;
  const irrigableAcres = avgLitresPerAcreDaily > 0 ? (currentBalance / avgLitresPerAcreDaily) : 0;
  const irrigableArea = parseFarmerArea({ acres: irrigableAcres, guntas: 0, unit: 'acre' });

  return {
    currentBalance,
    capacity,
    fillPercentage,
    totalExpectedInflow,
    totalDailyGrossLitres,
    planningHorizonDays,
    totalHorizonDemandLitres,
    otherRecordedUsesLitres,
    projectedRemainingLitres,
    isShortage,
    shortageLitres,
    daysOfWaterRemaining,
    fieldDemands,
    isDailyReplenishable: isDaily,
    // Farmer-Friendly Primary Metrics
    motorHoursAvailable,
    dailyMotorHoursAvailable,
    dailyMotorHoursNeeded,
    dailyNetMotorHours,
    dailyShortageLitres,
    dailySurplusLitres,
    horizonMotorHoursNeeded,
    shortageMotorHours,
    irrigableArea,
    totalAcresSum: parseFloat(totalAcresSum.toFixed(2)),
    flowRateLph
  };
}

/**
 * 6. AI Water Emergency Mode Prioritization & Rationing Engine
 * When usable water < total demand, dynamically ranks fields based on:
 * - Yield response factor Ky (biological sensitivity of current stage)
 * - Soil moisture stress (if readings available)
 * - Economic risk & perishability (e.g. Tomato vs Maize)
 * - Farmer custom priority tag
 * Allocates available water scientifically to prevent catastrophic crop failure.
 */
export function evaluateWaterEmergencyPriorities({
  availableWaterLitres = 5000,
  fieldDemands = [],
  planningHorizonDays = 7,
  farmerNotes = '',
  flowRateLph = 12000,
  isDailyReplenishable = false,
  totalDailyGrossLitres = null
}) {
  const currentAvailable = Math.max(0, parseFloat(availableWaterLitres) || 0);

  if (!fieldDemands || fieldDemands.length === 0) {
    const availTime = convertLitresToMotorTime(currentAvailable, flowRateLph);
    return {
      emergencyActive: false,
      status: 'No fields registered',
      totalDemand: 0,
      availableWaterLitres: currentAvailable,
      shortageLitres: 0,
      shortageMotorRuntime: { hours: 0, minutes: 0, labelEn: '0m', labelKn: '0 ನಿಮಿಷ' },
      availableMotorRuntime: availTime,
      prioritizedFields: [],
      totalAllocated: 0,
      unallocatedRemainder: currentAvailable,
      recommendationSummaryEn: 'No crop fields registered. Water demand is 0 L. Add fields in "My Fields" to see crop water requirements and priority rationing.',
      recommendationSummaryKn: 'ಯಾವುದೇ ಹೊಲಗಳು ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿಲ್ಲ. ನೀರಿನ ಬೇಡಿಕೆ 0 ಲೀಟರ್ ಆಗಿದೆ. ನೀರಿನ ಅಗತ್ಯತೆ ತಿಳಿಯಲು "ನನ್ನ ಹೊಲಗಳು" ಟ್ಯಾಬ್‌ನಲ್ಲಿ ಹೊಲ ಸೇರಿಸಿ.'
    };
  }

  const totalDemand = fieldDemands.reduce((sum, f) => sum + f.horizonDemandLitres, 0);
  const totalDailyDemand = totalDailyGrossLitres !== null ? totalDailyGrossLitres : fieldDemands.reduce((sum, f) => sum + f.dailyDemandLitres, 0);

  // If daily replenishable source (e.g. borewell or pump runtime), check daily sufficiency
  const effectiveHorizonAvailable = isDailyReplenishable ? (currentAvailable * planningHorizonDays) : currentAvailable;
  const emergencyActive = isDailyReplenishable
    ? (currentAvailable < totalDailyDemand || effectiveHorizonAvailable < totalDemand)
    : (currentAvailable < totalDemand);

  const totalShortageLitres = emergencyActive
    ? Math.max(0, isDailyReplenishable ? (totalDailyDemand - currentAvailable) * planningHorizonDays : totalDemand - currentAvailable)
    : 0;

  // Score each field for urgency (0 to 100)
  const scoredFields = fieldDemands.map(field => {
    let score = 0;
    const req = field.requirement;
    const cropProfile = req.crop;
    const ky = field.ky || 1.0;

    // 1. Biological Sensitivity (Ky * 30 points)
    const biologicalScore = Math.min(35, (ky / 1.3) * 35);
    score += biologicalScore;

    // 2. Critical Stage Bonus (25 points)
    const stageBonus = req.isCriticalStage ? 25 : 8;
    score += stageBonus;

    // 3. Soil Moisture Depletion (up to 25 points)
    let moistureScore = 12;
    if (req.soilMoistureStatus === 'Critically Dry') moistureScore = 25;
    else if (req.soilMoistureStatus === 'Moderate') moistureScore = 15;
    else if (req.soilMoistureStatus === 'Adequate') moistureScore = 8;
    else if (req.soilMoistureStatus === 'Wet / High Moisture') moistureScore = 2;
    score += moistureScore;

    // 4. Crop Market Perishability & Water Use Efficiency (15 points)
    let cropValueScore = 10;
    if (['tomato', 'onion'].includes(cropProfile.id)) cropValueScore = 15;
    else if (['rice'].includes(cropProfile.id)) cropValueScore = 13;
    else if (['maize', 'ragi'].includes(cropProfile.id)) cropValueScore = 8;
    score += cropValueScore;

    // Determine Urgency Category
    let urgency = 'Moderate';
    let urgencyKn = 'ಮಧ್ಯಮ ಆದ್ಯತೆ';
    let badgeClass = 'warning';
    if (score >= 70) {
      urgency = 'Critical (Inspect Urgently)';
      urgencyKn = 'ಅತ್ಯಂತ ತುರ್ತು (ತಕ್ಷಣ ಗಮನಿಸಿ)';
      badgeClass = 'danger';
    } else if (score >= 50) {
      urgency = 'High Priority';
      urgencyKn = 'ಹೆಚ್ಚಿನ ಆದ್ಯತೆ';
      badgeClass = 'high';
    } else if (score < 35) {
      urgency = 'Low / Delay Feasible';
      urgencyKn = 'ಕಡಿಮೆ (ನೀರಾವರಿ ಮುಂದೂಡಬಹುದು)';
      badgeClass = 'low';
    }

    // Expected consequence of delay
    let consequenceEn = `Mild growth slowing; recheck soil moisture in 48 hours.`;
    let consequenceKn = `ಸಾಧಾರಣ ಬೆಳವಣಿಗೆ ನಿಧಾನವಾಗಬಹುದು; 48 ಗಂಟೆಗಳ ನಂತರ ಮಣ್ಣಿನ ತೇವಾಂಶ ಮರುಪರಿಶೀಲಿಸಿ.`;
    if (req.isCriticalStage) {
      consequenceEn = `${req.criticalWarningEn}`;
      consequenceKn = `${req.criticalWarningKn}`;
    } else if (cropProfile.id === 'maize') {
      consequenceEn = `Leaves may curl slightly during peak sun; vegetative plants can recover if irrigated within 3-4 days.`;
      consequenceKn = `ಬಿಸಿಲಿನಲ್ಲಿ ಎಲೆಗಳು ಸುರುಟಿಕೊಳ್ಳಬಹುದು; 3-4 ದಿನಗಳಲ್ಲಿ ನೀರು ನೀಡಿದರೆ ಸಸ್ಯ ಚೇತರಿಸಿಕೊಳ್ಳುತ್ತದೆ.`;
    }

    return {
      ...field,
      urgencyScore: Math.round(score),
      urgency,
      urgencyKn,
      badgeClass,
      biologicalScore: Math.round(biologicalScore),
      stageBonus,
      consequenceEn,
      consequenceKn,
      suggestedNextInspection: req.isCriticalStage ? 'Within 24 hours' : 'Within 48-72 hours',
      suggestedNextInspectionKn: req.isCriticalStage ? '24 ಗಂಟೆಗಳ ಒಳಗೆ' : '48-72 ಗಂಟೆಗಳ ಒಳಗೆ'
    };
  });

  // Sort descending by urgencyScore
  scoredFields.sort((a, b) => b.urgencyScore - a.urgencyScore);

  // Proportional scientific water allocation
  let waterPool = isDailyReplenishable ? (currentAvailable * planningHorizonDays) : currentAvailable;
  const prioritizedFields = scoredFields.map((field, idx) => {
    let allocatedLitres = 0;
    let deficitLitres = 0;
    let allocationPercentOfDemand = 0;

    if (!emergencyActive) {
      allocatedLitres = field.horizonDemandLitres;
      deficitLitres = 0;
      allocationPercentOfDemand = 100;
    } else {
      const targetSurvivalDemand = Math.round(field.horizonDemandLitres * (field.isCriticalStage ? 0.75 : 0.50));
      if (waterPool >= targetSurvivalDemand) {
        allocatedLitres = targetSurvivalDemand;
        waterPool -= targetSurvivalDemand;
      } else {
        allocatedLitres = waterPool;
        waterPool = 0;
      }
      deficitLitres = Math.max(0, field.horizonDemandLitres - allocatedLitres);
      allocationPercentOfDemand = field.horizonDemandLitres > 0
        ? Math.round((allocatedLitres / field.horizonDemandLitres) * 100)
        : 0;
    }

    const allocatedMotorRuntime = convertLitresToMotorTime(allocatedLitres, flowRateLph);
    const deficitMotorRuntime = convertLitresToMotorTime(deficitLitres, flowRateLph);

    return {
      ...field,
      rank: idx + 1,
      allocatedLitres,
      deficitLitres,
      allocationPercentOfDemand,
      allocatedMotorRuntime,
      deficitMotorRuntime
    };
  });

  const totalAllocated = prioritizedFields.reduce((sum, f) => sum + f.allocatedLitres, 0);
  const unallocatedRemainder = Math.max(0, (isDailyReplenishable ? currentAvailable * planningHorizonDays : currentAvailable) - totalAllocated);
  const shortageMotorRuntime = convertLitresToMotorTime(totalShortageLitres, flowRateLph);
  const availableMotorRuntime = convertLitresToMotorTime(currentAvailable, flowRateLph);

  const topField = prioritizedFields[0];
  const secondField = prioritizedFields[1];

  let recommendationSummaryEn = '';
  let recommendationSummaryKn = '';

  if (emergencyActive) {
    recommendationSummaryEn = `Water deficit of ${shortageMotorRuntime.labelEn} (~${totalShortageLitres.toLocaleString()} L in 7 days${isDailyReplenishable ? ` • ~${Math.round(totalShortageLitres/7).toLocaleString()} L/day` : ''}) detected. Prioritize ${topField?.cropName || 'top'} field with ${topField?.allocatedMotorRuntime.labelEn} due to critical growth stage. Delay second crop by 2-3 days.`;
    recommendationSummaryKn = `ಸುಮಾರು ${shortageMotorRuntime.labelKn} (~${totalShortageLitres.toLocaleString()} ಲೀಟರ್ ಕೊರತೆ${isDailyReplenishable ? ` • ದಿನಕ್ಕೆ ~${Math.round(totalShortageLitres/7).toLocaleString()} L` : ''}) ಕಂಡುಬಂದಿದೆ. ಸೂಕ್ಷ್ಮ ಹಂತದಲ್ಲಿರುವ ${topField?.cropNameKn || 'ಮೊದಲ'} ಬೆಳೆಗೆ ಮೊದಲು ${topField?.allocatedMotorRuntime.labelKn} ನೀರು ನೀಡಿ. ${secondField ? secondField.cropNameKn + ' ಬೆಳೆಗೆ 2-3 ದಿನ ಮುಂದೂಡಬಹುದು.' : ''}`;
  } else {
    recommendationSummaryEn = isDailyReplenishable
      ? `Daily water supply (~${currentAvailable.toLocaleString()} L/day, ${availableMotorRuntime.labelEn}/day) is fully sufficient for all ${fieldDemands.length} fields. Proceed with normal irrigation schedule.`
      : `Available water supply (~${currentAvailable.toLocaleString()} L, ${availableMotorRuntime.labelEn}) is fully sufficient for all ${fieldDemands.length} fields. Proceed with normal irrigation schedule.`;
    recommendationSummaryKn = isDailyReplenishable
      ? `ದೈನಂದಿನ ನೀರಿನ ಪೂರೈಕೆ (~${currentAvailable.toLocaleString()} ಲೀಟರ್/ದಿನ, ${availableMotorRuntime.labelKn}/ದಿನ) ಎಲ್ಲಾ ${fieldDemands.length} ಹೊಲಗಳ ಅಗತ್ಯಕ್ಕೆ ಸಂಪೂರ್ಣ ಸಾಕಾಗುತ್ತದೆ. ಸಾಮಾನ್ಯ ನೀರಾವರಿ ವೇಳಾಪಟ್ಟಿ ಮುಂದುವರಿಸಿ.`
      : `ಲಭ್ಯವಿರುವ ನೀರಿನ ಪೂರೈಕೆ (~${currentAvailable.toLocaleString()} ಲೀಟರ್, ${availableMotorRuntime.labelKn}) ಎಲ್ಲಾ ${fieldDemands.length} ಹೊಲಗಳ ಅಗತ್ಯಕ್ಕೆ ಸಂಪೂರ್ಣ ಸಾಕಾಗುತ್ತದೆ. ಸಾಮಾನ್ಯ ನೀರಾವರಿ ವೇಳಾಪಟ್ಟಿ ಮುಂದುವರಿಸಿ.`;
  }

  return {
    emergencyActive,
    totalDemand,
    availableWaterLitres: currentAvailable,
    shortageLitres: totalShortageLitres,
    shortageMotorRuntime,
    availableMotorRuntime,
    prioritizedFields,
    totalAllocated,
    unallocatedRemainder,
    recommendationSummaryEn,
    recommendationSummaryKn
  };
}

/**
 * 7. Smart Pump & Electricity Planner
 * Calculates runtime, power usage, cost, and checks if schedule fits electricity availability
 */
export function calculatePumpAndElectricitySchedule({
  pumpHp = 5,
  pumpType = 'submersible', // 'submersible' | 'open_well' | 'centrifugal' | 'diesel'
  flowRateLph = 12000, // Measured or rated Litres Per Hour
  waterVolumeLitres = 24000,
  powerSource = 'electricity', // 'electricity' | 'diesel'
  electricityStartHour = 6, // 6:00 AM
  electricityEndHour = 10, // 10:00 AM (4 hours available)
  electricityRatePerKwh = 3.5, // ₹3.50/unit (or 0 for free agri supply)
  dieselPricePerLitre = 92, // ₹92/L
  dieselConsumptionLph = 1.25 // L of diesel per hour for 5HP engine
}) {
  const hp = parseFloat(pumpHp) || 5;
  const flow = Math.max(500, parseFloat(flowRateLph) || 10000);
  const targetLitres = Math.max(0, parseFloat(waterVolumeLitres) || 0);

  // Runtime required in hours
  const runtimeHours = targetLitres > 0 ? parseFloat((targetLitres / flow).toFixed(2)) : 0;
  const runtimeMinutes = Math.round(runtimeHours * 60);

  // Available window duration
  let availableWindowHours = 0;
  if (electricityEndHour > electricityStartHour) {
    availableWindowHours = electricityEndHour - electricityStartHour;
  } else {
    // Crosses midnight e.g. 10 PM to 4 AM
    availableWindowHours = (24 - electricityStartHour) + electricityEndHour;
  }

  const fitsInWindow = runtimeHours <= availableWindowHours;
  const scheduleConflict = !fitsInWindow && targetLitres > 0;
  const deficitHours = scheduleConflict ? parseFloat((runtimeHours - availableWindowHours).toFixed(2)) : 0;

  // Power & Cost
  const kw = hp * CONVERSIONS.KW_PER_HP;
  let energyKwh = 0;
  let estimatedCost = 0;

  if (powerSource === 'electricity') {
    energyKwh = parseFloat((kw * runtimeHours).toFixed(2));
    estimatedCost = Math.round(energyKwh * (parseFloat(electricityRatePerKwh) || 0));
  } else {
    // Diesel
    const totalDieselLitres = parseFloat((dieselConsumptionLph * runtimeHours).toFixed(2));
    estimatedCost = Math.round(totalDieselLitres * (parseFloat(dieselPricePerLitre) || 92));
  }

  return {
    pumpHp: hp,
    pumpType,
    powerSource,
    flowRateLph: flow,
    targetLitres,
    runtimeHours,
    runtimeMinutes,
    availableWindowHours,
    fitsInWindow,
    scheduleConflict,
    deficitHours,
    energyKwh,
    estimatedCost,
    formattedRuntime: `${Math.floor(runtimeMinutes / 60)}h ${runtimeMinutes % 60}m`,
    windowLabel: `${String(electricityStartHour).padStart(2, '0')}:00 - ${String(electricityEndHour).padStart(2, '0')}:00 (${availableWindowHours} hrs)`
  };
}

/**
 * 8. Comprehensive Irrigation Cost Calculator
 */
export function calculateIrrigationEconomics({
  pumpingCostPerEvent = 150,
  labourCostPerEvent = 200,
  waterPurchaseCost = 0,
  otherCost = 0,
  eventsPerWeek = 2,
  weeksInSeason = 16,
  totalAcres = 2.0
}) {
  const costPerEvent = pumpingCostPerEvent + labourCostPerEvent + waterPurchaseCost + otherCost;
  const weeklyCost = costPerEvent * eventsPerWeek;
  const monthlyCost = weeklyCost * 4.33;
  const seasonalCost = weeklyCost * weeksInSeason;
  const costPerAcrePerSeason = totalAcres > 0 ? Math.round(seasonalCost / totalAcres) : seasonalCost;

  return {
    costPerEvent: Math.round(costPerEvent),
    weeklyCost: Math.round(weeklyCost),
    monthlyCost: Math.round(monthlyCost),
    seasonalCost: Math.round(seasonalCost),
    costPerAcrePerSeason,
    breakdown: {
      pumping: pumpingCostPerEvent * eventsPerWeek * weeksInSeason,
      labour: labourCostPerEvent * eventsPerWeek * weeksInSeason,
      waterPurchase: waterPurchaseCost * eventsPerWeek * weeksInSeason,
      other: otherCost * eventsPerWeek * weeksInSeason
    }
  };
}

/**
 * 9. Irrigation Method Comparison Engine (Drip vs Sprinkler vs Flood)
 */
export function compareIrrigationMethods({
  cropId = 'tomato',
  areaAcres = 2.0,
  seasonalWaterDemandLitres = 400000 // Seasonal requirement under 100% efficiency
}) {
  const methods = ['flood', 'sprinkler', 'drip'].map(key => {
    const m = IRRIGATION_METHODS[key];
    const grossWaterNeeded = Math.round(seasonalWaterDemandLitres / m.efficiency);
    const pumpingHours = Math.round(grossWaterNeeded / 12000); // at 12,000 L/hr pump
    const energyCost = Math.round(pumpingHours * 3.73 * 3.5); // 5HP pump ~ 3.73 kW
    const labourEvents = key === 'drip' ? 20 : (key === 'sprinkler' ? 25 : 35);
    const labourCost = labourEvents * 300;
    const totalOperatingCost = energyCost + labourCost;
    const initialInvestment = Math.round(m.capitalCostPerAcre * areaAcres);
    const governmentSubsidy = Math.round(initialInvestment * (m.subsidyPercent / 100));
    const netFarmerInvestment = initialInvestment - governmentSubsidy;

    return {
      id: m.id,
      nameEn: m.nameEn,
      nameKn: m.nameKn,
      efficiencyPercent: Math.round(m.efficiency * 100),
      grossWaterNeededLitres: grossWaterNeeded,
      pumpingHours,
      totalOperatingCost,
      initialInvestment,
      governmentSubsidy,
      netFarmerInvestment,
      subsidyPercent: m.subsidyPercent
    };
  });

  const floodMethod = methods.find(m => m.id === 'flood');
  const dripMethod = methods.find(m => m.id === 'drip');

  const waterSavedLitres = floodMethod.grossWaterNeededLitres - dripMethod.grossWaterNeededLitres;
  const percentWaterSaved = Math.round((waterSavedLitres / floodMethod.grossWaterNeededLitres) * 100);
  const annualOperatingSavings = floodMethod.totalOperatingCost - dripMethod.totalOperatingCost;
  const paybackYears = annualOperatingSavings > 0
    ? parseFloat((dripMethod.netFarmerInvestment / annualOperatingSavings).toFixed(1))
    : 1.5;

  return {
    methods,
    waterSavedLitres,
    percentWaterSaved,
    annualOperatingSavings,
    paybackYears
  };
}

/**
 * 13. Farmer-Friendly Pump Minutes Estimation Engine
 * Takes available pump running minutes as primary first information,
 * then calculates estimated crop water need, priority rationing, and alternative source options.
 */
export function calculatePumpMinutesEstimation({
  availableMinutes = 60,
  flowRateLph = 12000,
  fields = []
}) {
  const mins = Math.max(0, parseFloat(availableMinutes) || 0);
  const flow = Math.max(500, parseFloat(flowRateLph) || 12000);
  const litresPerMinute = flow / 60;
  const availableLitres = Math.round(mins * litresPerMinute);

  let totalDailyGrossLitres = 0;
  const fieldBreakdown = fields.map(f => {
    const acres = (f.areaAcres !== undefined ? f.areaAcres : (f.area || 1)) + ((f.areaGuntas || 0) / 40);
    const req = calculateCropWaterRequirement({
      cropId: f.cropId || 'tomato',
      stageKey: f.stageKey || 'flowering',
      areaValue: acres,
      areaAcres: f.areaAcres,
      areaGuntas: f.areaGuntas,
      soilId: f.soilType || 'loamy',
      irrigationMethodId: f.irrigationMethod || 'drip',
      flowRateLph: flow
    });
    totalDailyGrossLitres += req.dailyGrossLitres;
    const neededMinutes = Math.round((req.dailyGrossLitres / flow) * 60);

    return {
      fieldId: f.id,
      fieldName: f.name,
      fieldNameKn: f.nameKn || f.name,
      cropId: f.cropId,
      cropName: req.crop.nameEn,
      cropNameKn: req.crop.nameKn,
      stageKey: f.stageKey,
      stageName: req.stage.labelEn,
      stageNameKn: req.stage.labelKn,
      isCritical: req.isCriticalStage,
      ky: req.stage.ky,
      neededMinutes,
      neededHoursFormatted: convertLitresToMotorTime(req.dailyGrossLitres, flow),
      neededLitres: req.dailyGrossLitres,
      method: req.efficiency >= 0.85 ? 'Drip' : 'Surface'
    };
  });

  const totalDailyMinutesNeeded = Math.round((totalDailyGrossLitres / flow) * 60);
  const netMinutes = mins - totalDailyMinutesNeeded;
  const isShortage = netMinutes < 0;
  const deficitMinutes = isShortage ? Math.abs(netMinutes) : 0;
  const surplusMinutes = !isShortage ? netMinutes : 0;
  const coveragePercent = totalDailyMinutesNeeded > 0 ? Math.min(100, Math.round((mins / totalDailyMinutesNeeded) * 100)) : 100;

  // Irrigable land area with current available pump minutes
  const avgLitresPerAcre = totalDailyGrossLitres > 0 && fields.length > 0 ? (totalDailyGrossLitres / fields.length) : 20000;
  const irrigableAcres = avgLitresPerAcre > 0 ? (availableLitres / avgLitresPerAcre) : 0;
  const irrigableArea = parseFarmerArea({ acres: irrigableAcres, guntas: 0, unit: 'acre' });

  // Priority allocation advice
  let adviceKn = '';
  let adviceEn = '';
  if (isShortage) {
    const criticalField = fieldBreakdown.find(f => f.isCritical) || fieldBreakdown[0];
    const secondField = fieldBreakdown.find(f => f.fieldId !== criticalField?.fieldId);
    if (criticalField && secondField) {
      adviceKn = `⚠️ ${deficitMinutes} ನಿಮಿಷಗಳ ಕೊರತೆ! ಲಭ್ಯವಿರುವ ${mins} ನಿಮಿಷಗಳನ್ನು ${criticalField.cropNameKn} (${criticalField.stageNameKn}) ಬೆಳೆಗೆ ಪೂರ್ಣ ನೀಡಿ. ${secondField.cropNameKn} ಬೆಳೆಗೆ 3 ದಿನ ಮುಂದೂಡಿ.`;
      adviceEn = `⚠️ ${deficitMinutes} mins deficit! Allocate all ${mins} available minutes to ${criticalField.cropName} (${criticalField.stageName}). Postpone ${secondField.cropName} by 3 days.`;
    } else {
      adviceKn = `⚠️ ${deficitMinutes} ನಿಮಿಷಗಳ ಕೊರತೆ! ಲಭ್ಯವಿರುವ ${mins} ನಿಮಿಷಗಳಲ್ಲಿ ಪ್ರಮುಖ ಹೂ ಬಿಡುವ ಬೆಳೆಗೆ ಆದ್ಯತೆ ನೀಡಿ.`;
      adviceEn = `⚠️ ${deficitMinutes} mins deficit! Prioritize critical flowering crops with available ${mins} mins.`;
    }
  } else {
    adviceKn = `✅ ನಿಮ್ಮಲ್ಲಿರುವ ${mins} ನಿಮಿಷಗಳು ಇಂದಿನ ಎಲ್ಲಾ ಬೆಳೆಗಳ ಅಗತ್ಯವನ್ನು (${totalDailyMinutesNeeded} ನಿಮಿಷ) ಪೂರೈಸಲು ಸಂಪೂರ್ಣ ಸಾಕು!`;
    adviceEn = `✅ Your ${mins} available minutes are fully sufficient for all crops today (${totalDailyMinutesNeeded} mins needed)!`;
  }

  return {
    availableMinutes: mins,
    availableLitres,
    totalDailyMinutesNeeded,
    totalDailyGrossLitres,
    netMinutes,
    isShortage,
    deficitMinutes,
    surplusMinutes,
    coveragePercent,
    irrigableArea,
    fieldBreakdown,
    adviceKn,
    adviceEn,
    flowRateLph: flow
  };
}

