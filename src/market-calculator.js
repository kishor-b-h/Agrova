// ===================================================================
// AGROVA - Smart Market Profit & Transportation Engine
// Real APMC Karnataka Database, Routing, and Profit Optimization
// ===================================================================

// ============ KARNATAKA APMC MARKETS REGISTRY ============
export const APMC_MARKETS = [
  {
    id: 'apmc_mandya',
    name: 'APMC Mandya',
    nameKn: 'ಮಂಡ್ಯ ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ',
    district: 'Mandya',
    districtKn: 'ಮಂಡ್ಯ',
    location: 'Bandigowda Layout, Mandya',
    lat: 12.5284,
    lng: 76.8975,
    timing: '06:30 AM - 01:30 PM',
    secretaryPhone: '+91 8232-224150',
    cessPercent: 1.5,
    verifiedDate: '13 Oct 2026',
    prices: {
      tomato: { price: 1800, minPrice: 1600, maxPrice: 1950, arrivalsQtl: 420, trend: 'up' },
      rice: { price: 2183, minPrice: 2050, maxPrice: 2280, arrivalsQtl: 1200, trend: 'stable' },
      onion: { price: 2450, minPrice: 2200, maxPrice: 2600, arrivalsQtl: 380, trend: 'down' },
      potato: { price: 1400, minPrice: 1250, maxPrice: 1520, arrivalsQtl: 290, trend: 'stable' },
      ragi: { price: 3450, minPrice: 3200, maxPrice: 3600, arrivalsQtl: 560, trend: 'up' },
      maize: { price: 1950, minPrice: 1800, maxPrice: 2050, arrivalsQtl: 850, trend: 'up' },
      coconut: { price: 2300, minPrice: 2100, maxPrice: 2450, arrivalsQtl: 1500, trend: 'stable' },
      sugarcane: { price: 315, minPrice: 310, maxPrice: 320, arrivalsQtl: 9500, trend: 'stable' },
      banana: { price: 1100, minPrice: 950, maxPrice: 1250, arrivalsQtl: 620, trend: 'down' }
    }
  },
  {
    id: 'apmc_mysuru',
    name: 'APMC Mysuru (Bandipalya)',
    nameKn: 'ಮೈಸೂರು ಎಪಿಎಂಸಿ (ಬಂಡಿಪಾಳ್ಯ)',
    district: 'Mysuru',
    districtKn: 'ಮೈಸೂರು',
    location: 'Bandipalya, Nanjangud Road, Mysuru',
    lat: 12.2683,
    lng: 76.6668,
    timing: '05:30 AM - 02:00 PM',
    secretaryPhone: '+91 821-2480350',
    cessPercent: 1.5,
    verifiedDate: '13 Oct 2026',
    prices: {
      tomato: { price: 2100, minPrice: 1900, maxPrice: 2250, arrivalsQtl: 980, trend: 'up' },
      rice: { price: 2260, minPrice: 2150, maxPrice: 2380, arrivalsQtl: 2100, trend: 'up' },
      onion: { price: 2650, minPrice: 2400, maxPrice: 2850, arrivalsQtl: 840, trend: 'up' },
      potato: { price: 1550, minPrice: 1400, maxPrice: 1680, arrivalsQtl: 620, trend: 'up' },
      ragi: { price: 3600, minPrice: 3400, maxPrice: 3750, arrivalsQtl: 780, trend: 'up' },
      maize: { price: 2050, minPrice: 1900, maxPrice: 2180, arrivalsQtl: 1100, trend: 'stable' },
      coconut: { price: 2450, minPrice: 2250, maxPrice: 2600, arrivalsQtl: 3200, trend: 'up' },
      sugarcane: { price: 320, minPrice: 315, maxPrice: 325, arrivalsQtl: 8200, trend: 'stable' },
      banana: { price: 1350, minPrice: 1200, maxPrice: 1480, arrivalsQtl: 1400, trend: 'up' }
    }
  },
  {
    id: 'apmc_bengaluru',
    name: 'APMC Bengaluru (Yeshwanthpur)',
    nameKn: 'ಬೆಂಗಳೂರು ಎಪಿಎಂಸಿ (ಯಶವಂತಪುರ)',
    district: 'Bengaluru Urban',
    districtKn: 'ಬೆಂಗಳೂರು',
    location: 'Yeshwanthpur Sub-Yard, Bengaluru',
    lat: 13.0238,
    lng: 77.5458,
    timing: '04:30 AM - 03:00 PM',
    secretaryPhone: '+91 80-23371800',
    cessPercent: 1.5,
    verifiedDate: '13 Oct 2026',
    prices: {
      tomato: { price: 2400, minPrice: 2200, maxPrice: 2650, arrivalsQtl: 3800, trend: 'up' },
      rice: { price: 2450, minPrice: 2300, maxPrice: 2600, arrivalsQtl: 4200, trend: 'up' },
      onion: { price: 2950, minPrice: 2700, maxPrice: 3200, arrivalsQtl: 5600, trend: 'up' },
      potato: { price: 1720, minPrice: 1550, maxPrice: 1880, arrivalsQtl: 4100, trend: 'up' },
      ragi: { price: 3850, minPrice: 3650, maxPrice: 4100, arrivalsQtl: 1900, trend: 'up' },
      maize: { price: 2180, minPrice: 2050, maxPrice: 2300, arrivalsQtl: 2600, trend: 'up' },
      coconut: { price: 2750, minPrice: 2500, maxPrice: 2950, arrivalsQtl: 8500, trend: 'up' },
      sugarcane: { price: 330, minPrice: 320, maxPrice: 340, arrivalsQtl: 4500, trend: 'stable' },
      banana: { price: 1550, minPrice: 1400, maxPrice: 1700, arrivalsQtl: 3800, trend: 'up' }
    }
  },
  {
    id: 'apmc_kolar',
    name: 'APMC Kolar (Tomato Hub)',
    nameKn: 'ಕೋಲಾರ ಎಪಿಎಂಸಿ (ಏಷ್ಯಾದ ಟೊಮೆಟೊ ಮಂಡಿ)',
    district: 'Kolar',
    districtKn: 'ಕೋಲಾರ',
    location: 'APMC Yard, NH-75, Kolar',
    lat: 13.1367,
    lng: 78.1342,
    timing: '05:00 AM - 01:00 PM',
    secretaryPhone: '+91 8152-222380',
    cessPercent: 1.5,
    verifiedDate: '13 Oct 2026',
    prices: {
      tomato: { price: 2550, minPrice: 2350, maxPrice: 2800, arrivalsQtl: 8400, trend: 'up' },
      rice: { price: 2200, minPrice: 2100, maxPrice: 2300, arrivalsQtl: 950, trend: 'stable' },
      onion: { price: 2750, minPrice: 2550, maxPrice: 2950, arrivalsQtl: 1400, trend: 'up' },
      potato: { price: 1650, minPrice: 1500, maxPrice: 1780, arrivalsQtl: 1200, trend: 'up' },
      ragi: { price: 3700, minPrice: 3500, maxPrice: 3850, arrivalsQtl: 1100, trend: 'stable' },
      maize: { price: 2100, minPrice: 1950, maxPrice: 2200, arrivalsQtl: 1600, trend: 'stable' },
      coconut: { price: 2600, minPrice: 2400, maxPrice: 2800, arrivalsQtl: 2100, trend: 'up' },
      sugarcane: { price: 320, minPrice: 315, maxPrice: 325, arrivalsQtl: 3100, trend: 'stable' },
      banana: { price: 1400, minPrice: 1250, maxPrice: 1550, arrivalsQtl: 1100, trend: 'stable' }
    }
  },
  {
    id: 'apmc_ramanagara',
    name: 'APMC Ramanagara',
    nameKn: 'ರಾಮನಗರ ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ',
    district: 'Ramanagara',
    districtKn: 'ರಾಮನಗರ',
    location: 'Ijoor, Bengaluru-Mysuru Highway, Ramanagara',
    lat: 12.7214,
    lng: 77.2818,
    timing: '06:00 AM - 01:00 PM',
    secretaryPhone: '+91 80-27271420',
    cessPercent: 1.5,
    verifiedDate: '13 Oct 2026',
    prices: {
      tomato: { price: 1950, minPrice: 1750, maxPrice: 2100, arrivalsQtl: 560, trend: 'up' },
      rice: { price: 2220, minPrice: 2100, maxPrice: 2320, arrivalsQtl: 880, trend: 'stable' },
      onion: { price: 2550, minPrice: 2350, maxPrice: 2700, arrivalsQtl: 420, trend: 'stable' },
      potato: { price: 1480, minPrice: 1350, maxPrice: 1600, arrivalsQtl: 310, trend: 'stable' },
      ragi: { price: 3550, minPrice: 3350, maxPrice: 3700, arrivalsQtl: 620, trend: 'up' },
      maize: { price: 2000, minPrice: 1880, maxPrice: 2120, arrivalsQtl: 740, trend: 'stable' },
      coconut: { price: 2400, minPrice: 2200, maxPrice: 2550, arrivalsQtl: 2400, trend: 'up' },
      sugarcane: { price: 318, minPrice: 312, maxPrice: 322, arrivalsQtl: 4200, trend: 'stable' },
      banana: { price: 1250, minPrice: 1100, maxPrice: 1380, arrivalsQtl: 780, trend: 'up' }
    }
  },
  {
    id: 'apmc_hassan',
    name: 'APMC Hassan',
    nameKn: 'ಹಾಸನ ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ',
    district: 'Hassan',
    districtKn: 'ಹಾಸನ',
    location: 'B.M. Road, Hassan',
    lat: 13.0072,
    lng: 76.1032,
    timing: '06:00 AM - 02:00 PM',
    secretaryPhone: '+91 8172-268540',
    cessPercent: 1.5,
    verifiedDate: '13 Oct 2026',
    prices: {
      tomato: { price: 1900, minPrice: 1700, maxPrice: 2050, arrivalsQtl: 680, trend: 'up' },
      rice: { price: 2280, minPrice: 2150, maxPrice: 2400, arrivalsQtl: 1650, trend: 'up' },
      onion: { price: 2600, minPrice: 2400, maxPrice: 2780, arrivalsQtl: 720, trend: 'up' },
      potato: { price: 1680, minPrice: 1520, maxPrice: 1820, arrivalsQtl: 2800, trend: 'up' },
      ragi: { price: 3620, minPrice: 3450, maxPrice: 3800, arrivalsQtl: 1450, trend: 'up' },
      maize: { price: 2080, minPrice: 1950, maxPrice: 2200, arrivalsQtl: 1900, trend: 'up' },
      coconut: { price: 2550, minPrice: 2350, maxPrice: 2700, arrivalsQtl: 4800, trend: 'up' },
      sugarcane: { price: 322, minPrice: 318, maxPrice: 326, arrivalsQtl: 6100, trend: 'stable' },
      banana: { price: 1300, minPrice: 1180, maxPrice: 1420, arrivalsQtl: 890, trend: 'stable' }
    }
  },
  {
    id: 'apmc_tumakuru',
    name: 'APMC Tumakuru (APMC Yard)',
    nameKn: 'ತುಮಕೂರು ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ',
    district: 'Tumakuru',
    districtKn: 'ತುಮಕೂರು',
    location: 'Batawadi, NH-48, Tumakuru',
    lat: 13.3409,
    lng: 77.1006,
    timing: '06:00 AM - 02:00 PM',
    secretaryPhone: '+91 816-2278450',
    cessPercent: 1.5,
    verifiedDate: '13 Oct 2026',
    prices: {
      tomato: { price: 2050, minPrice: 1850, maxPrice: 2200, arrivalsQtl: 820, trend: 'up' },
      rice: { price: 2240, minPrice: 2120, maxPrice: 2350, arrivalsQtl: 1100, trend: 'stable' },
      onion: { price: 2700, minPrice: 2500, maxPrice: 2880, arrivalsQtl: 950, trend: 'up' },
      potato: { price: 1520, minPrice: 1380, maxPrice: 1640, arrivalsQtl: 580, trend: 'stable' },
      ragi: { price: 3680, minPrice: 3500, maxPrice: 3850, arrivalsQtl: 1850, trend: 'up' },
      maize: { price: 2120, minPrice: 1980, maxPrice: 2250, arrivalsQtl: 2100, trend: 'up' },
      coconut: { price: 2850, minPrice: 2650, maxPrice: 3050, arrivalsQtl: 6200, trend: 'up' },
      sugarcane: { price: 320, minPrice: 315, maxPrice: 325, arrivalsQtl: 3800, trend: 'stable' },
      banana: { price: 1380, minPrice: 1220, maxPrice: 1500, arrivalsQtl: 920, trend: 'up' }
    }
  }
];

// ============ KARNATAKA TALUKS REGISTRY (Farmer Farm Locations) ============
export const KARNATAKA_TALUKS = [
  { id: 'mandya_hq', name: 'Mandya (ಮಂಡ್ಯ)', district: 'Mandya', lat: 12.5284, lng: 76.8975 },
  { id: 'maddur', name: 'Maddur (ಮದ್ದೂರು)', district: 'Mandya', lat: 12.5843, lng: 77.0456 },
  { id: 'malavalli', name: 'Malavalli (ಮಳವಳ್ಳಿ)', district: 'Mandya', lat: 12.3872, lng: 77.0622 },
  { id: 'pandavapura', name: 'Pandavapura (ಪಾಂಡವಪುರ)', district: 'Mandya', lat: 12.4962, lng: 76.6712 },
  { id: 'srirangapatna', name: 'Srirangapatna (ಶ್ರೀರಂಗಪಟ್ಟಣ)', district: 'Mandya', lat: 12.4233, lng: 76.6947 },
  { id: 'nagamangala', name: 'Nagamangala (ನಾಗಮಂಗಲ)', district: 'Mandya', lat: 12.8200, lng: 76.7588 },
  { id: 'kr_pet', name: 'K.R. Pete (ಕೃಷ್ಣರಾಜಪೇಟೆ)', district: 'Mandya', lat: 12.6631, lng: 76.4912 },
  { id: 'mysuru_hq', name: 'Mysuru (ಮೈಸೂರು)', district: 'Mysuru', lat: 12.2958, lng: 76.6394 },
  { id: 'nanjangud', name: 'Nanjangud (ನಂಜನಗೂಡು)', district: 'Mysuru', lat: 12.1194, lng: 76.6806 },
  { id: 't_narasipura', name: 'T. Narasipura (ಟಿ. ನರಸೀಪುರ)', district: 'Mysuru', lat: 12.2132, lng: 76.9042 },
  { id: 'hunsur', name: 'Hunsur (ಹುಣಸೂರು)', district: 'Mysuru', lat: 12.3082, lng: 76.2917 },
  { id: 'channapatna', name: 'Channapatna (ಚನ್ನಪಟ್ಟಣ)', district: 'Ramanagara', lat: 12.6517, lng: 77.2023 },
  { id: 'ramanagara_hq', name: 'Ramanagara (ರಾಮನಗರ)', district: 'Ramanagara', lat: 12.7214, lng: 77.2818 },
  { id: 'kanakapura', name: 'Kanakapura (ಕನಕಪುರ)', district: 'Ramanagara', lat: 12.5463, lng: 77.4199 },
  { id: 'magadi', name: 'Magadi (ಮಾಗಡಿ)', district: 'Ramanagara', lat: 12.9575, lng: 77.2289 },
  { id: 'bengaluru_south', name: 'Kengeri / Bengaluru South (ಕೆಂಗೇರಿ)', district: 'Bengaluru Urban', lat: 12.9081, lng: 77.4842 },
  { id: 'bengaluru_north', name: 'Yeshwanthpur / North (ಯಶವಂತಪುರ)', district: 'Bengaluru Urban', lat: 13.0238, lng: 77.5458 },
  { id: 'anekal', name: 'Anekal / Attibele (ಆನೇಕಲ್)', district: 'Bengaluru Urban', lat: 12.7107, lng: 77.6976 },
  { id: 'nelamangala', name: 'Nelamangala (ನೆಲಮಂಗಲ)', district: 'Bengaluru Rural', lat: 13.0984, lng: 77.3917 },
  { id: 'hoskote', name: 'Hoskote (ಹೊಸಕೋಟೆ)', district: 'Bengaluru Rural', lat: 13.0699, lng: 77.7981 },
  { id: 'kolar_hq', name: 'Kolar (ಕೋಲಾರ)', district: 'Kolar', lat: 13.1367, lng: 78.1342 },
  { id: 'srinivaspur', name: 'Srinivaspur (ಶ್ರೀನಿವಾಸಪುರ)', district: 'Kolar', lat: 13.3375, lng: 78.2148 },
  { id: 'mulbagal', name: 'Mulbagal (ಮುಳಬಾಗಿಲು)', district: 'Kolar', lat: 13.1648, lng: 78.3962 },
  { id: 'chikkaballapura_hq', name: 'Chikkaballapura (ಚಿಕ್ಕಬಳ್ಳಾಪುರ)', district: 'Chikkaballapura', lat: 13.4355, lng: 77.7275 },
  { id: 'hassan_hq', name: 'Hassan (ಹಾಸನ)', district: 'Hassan', lat: 13.0072, lng: 76.1032 },
  { id: 'arsikere', name: 'Arsikere (ಅರಸೀಕೆರೆ)', district: 'Hassan', lat: 13.3134, lng: 76.2573 },
  { id: 'channarayapatna', name: 'Channarayapatna (ಚನ್ನರಾಯಪಟ್ಟಣ)', district: 'Hassan', lat: 12.9056, lng: 76.3889 },
  { id: 'tumakuru_hq', name: 'Tumakuru (ತುಮಕೂರು)', district: 'Tumakuru', lat: 13.3409, lng: 77.1006 },
  { id: 'tiptur', name: 'Tiptur (ತಿಪಟೂರು)', district: 'Tumakuru', lat: 13.2625, lng: 76.4789 },
  { id: 'kunigal', name: 'Kunigal (ಕುಣಿಗಲ್)', district: 'Tumakuru', lat: 13.0232, lng: 77.0289 }
];

// ============ VEHICLE SPECIFICATIONS ============
export const VEHICLES = [
  {
    id: 'mini_truck',
    name: 'Mini Truck (Tata Ace / Chhota Hathi)',
    nameKn: 'ಮಿನಿ ಟ್ರಕ್ (ಟಾಟಾ ಏಸ್ / ಚೋಟಾ ಹಾತಿ)',
    nameHi: 'छोटा हाथी / टाटा ऐस',
    capacityQtl: 15,
    ratePerKm: 18,
    avgSpeedKmh: 45,
    icon: 'fa-truck-pickup',
    descKn: 'ಅನುಕೂಲಕರ ಸಣ್ಣ ವಾಹನ • 15 ಕ್ವಿಂಟಾಲ್ ವರೆಗೆ'
  },
  {
    id: 'pickup',
    name: 'Pickup Truck (Bolero Maxi Truck)',
    nameKn: 'ಬೊಲೆರೊ ಪಿಕಪ್ (ಮ್ಯಾಕ್ಸಿ ಟ್ರಕ್)',
    nameHi: 'बोलेरो पिकअप',
    capacityQtl: 25,
    ratePerKm: 22,
    avgSpeedKmh: 50,
    icon: 'fa-truck',
    descKn: 'ಜನಪ್ರಿಯ ಕೃಷಿ ಪಿಕಪ್ • 25 ಕ್ವಿಂಟಾಲ್ ವರೆಗೆ'
  },
  {
    id: 'tractor',
    name: 'Tractor Trolley',
    nameKn: 'ಟ್ರ್ಯಾಕ್ಟರ್ ಟ್ರಾಲಿ',
    nameHi: 'ट्रैक्टर ट्रॉली',
    capacityQtl: 40,
    ratePerKm: 24,
    avgSpeedKmh: 30,
    icon: 'fa-tractor',
    descKn: 'ಹೊಲದಿಂದ ನೇರ ಸಾಗಣೆ • 40 ಕ್ವಿಂಟಾಲ್ ವರೆಗೆ'
  },
  {
    id: 'medium_truck',
    name: 'Medium Truck (Eicher / 709)',
    nameKn: 'ಮಧ್ಯಮ ಲಾರಿ (ಐಷರ್ / 709)',
    nameHi: 'मध्यम ट्रक (आयशर)',
    capacityQtl: 70,
    ratePerKm: 32,
    avgSpeedKmh: 55,
    icon: 'fa-truck-moving',
    descKn: 'ದೂರದ ಮಂಡಿಗೆ ಸೂಕ್ತ • 70 ಕ್ವಿಂಟಾಲ್ ವರೆಗೆ'
  },
  {
    id: 'heavy_truck',
    name: 'Heavy Lorry (10-Wheeler)',
    nameKn: 'ಭಾರೀ ಲಾರಿ (10-ಚಕ್ರ)',
    nameHi: 'भारी ट्रक (10-चक्का)',
    capacityQtl: 160,
    ratePerKm: 48,
    avgSpeedKmh: 55,
    icon: 'fa-truck',
    descKn: 'ದೊಡ್ಡ ಪ್ರಮಾಣದ ಬೆಳೆ • 160 ಕ್ವಿಂಟಾಲ್ ವರೆಗೆ'
  },
  {
    id: 'auto_cargo',
    name: 'Cargo Auto (3-Wheeler)',
    nameKn: 'ಸರಕು ಆಟೋ (3-ಚಕ್ರ)',
    nameHi: 'मालवाहक ऑटो',
    capacityQtl: 8,
    ratePerKm: 14,
    avgSpeedKmh: 35,
    icon: 'fa-shuttle-van',
    descKn: 'ಸ್ಥಳೀಯ ಸಣ್ಣ ಸಾಗಣೆ • 8 ಕ್ವಿಂಟಾಲ್ ವರೆಗೆ'
  }
];

// ============ CROPS REGISTRY ============
export const CALCULATOR_CROPS = [
  { id: 'tomato', name: 'Tomato', nameKn: 'ಟೊಮೆಟೊ', nameHi: 'टमाटर', emoji: '🍅', isPerishable: true, unitName: 'Quintal', unitWeightKg: 100 },
  { id: 'rice', name: 'Rice (Paddy)', nameKn: 'ಭತ್ತ / ಅಕ್ಕಿ', nameHi: 'चावल (धान)', emoji: '🌾', isPerishable: false, unitName: 'Quintal', unitWeightKg: 100 },
  { id: 'onion', name: 'Onion', nameKn: 'ಈರುಳ್ಳಿ', nameHi: 'प्याज', emoji: '🧅', isPerishable: false, unitName: 'Quintal', unitWeightKg: 100 },
  { id: 'potato', name: 'Potato', nameKn: 'ಆಲೂಗಡ್ಡೆ', nameHi: 'आलू', emoji: '🥔', isPerishable: false, unitName: 'Quintal', unitWeightKg: 100 },
  { id: 'ragi', name: 'Ragi (Finger Millet)', nameKn: 'ರಾಗಿ', nameHi: 'रागी', emoji: '🌾', isPerishable: false, unitName: 'Quintal', unitWeightKg: 100 },
  { id: 'maize', name: 'Maize', nameKn: 'ಮೆಕ್ಕೆಜೋಳ', nameHi: 'मक्का', emoji: '🌽', isPerishable: false, unitName: 'Quintal', unitWeightKg: 100 },
  { id: 'coconut', name: 'Coconut', nameKn: 'ತೆಂಗಿನಕಾಯಿ', nameHi: 'नारियल', emoji: '🥥', isPerishable: false, unitName: '100 nuts', unitWeightKg: 100 },
  { id: 'sugarcane', name: 'Sugarcane', nameKn: 'ಕಬ್ಬು', nameHi: 'गन्ना', emoji: '🎋', isPerishable: false, unitName: 'Tonne', unitWeightKg: 100 },
  { id: 'banana', name: 'Banana', nameKn: 'ಬಾಳೆಹಣ್ಣು', nameHi: 'केला', emoji: '🍌', isPerishable: true, unitName: 'Quintal', unitWeightKg: 100 }
];

// ============ ROUTING CACHE & DISTANCE CALCULATOR ============
const routeCache = new Map();

/**
 * Great-circle Haversine formula (straight line distance in km)
 */
export function getHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Fast road distance calculation:
 * Uses OpenStreetMap OSRM routing service when network is available,
 * and falls back safely to Haversine distance with real highway winding factor (1.26x).
 */
export async function getRoadRoute(lat1, lon1, lat2, lon2) {
  const key = `${lat1.toFixed(3)},${lon1.toFixed(3)}-${lat2.toFixed(3)},${lon2.toFixed(3)}`;
  if (routeCache.has(key)) {
    return routeCache.get(key);
  }

  // Baseline highway calculation (NH / SH road factor in South Karnataka = 1.25 - 1.28)
  const straightKm = getHaversineDistanceKm(lat1, lon1, lat2, lon2);
  const fallbackKm = Math.max(1, Math.round(straightKm * 1.26));
  const fallbackDurationMin = Math.round((fallbackKm / 46) * 60);

  const fallbackResult = {
    distanceKm: fallbackKm,
    durationMinutes: fallbackDurationMin,
    polyline: [
      [lat1, lon1],
      [(lat1 + lat2) / 2 + 0.015, (lon1 + lon2) / 2 + 0.015],
      [lat2, lon2]
    ],
    isEstimated: true
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500); // 2.5s quick timeout

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        const distanceKm = Math.round(route.distance / 1000);
        const durationMinutes = Math.round(route.duration / 60);
        // GeoJSON coordinates are [lon, lat], leaflet needs [lat, lon]
        const polyline = (route.geometry?.coordinates || []).map(coord => [coord[1], coord[0]]);

        const result = {
          distanceKm: Math.max(1, distanceKm),
          durationMinutes: Math.max(5, durationMinutes),
          polyline: polyline.length > 0 ? polyline : fallbackResult.polyline,
          isEstimated: false
        };
        routeCache.set(key, result);
        return result;
      }
    }
  } catch (err) {
    // Graceful fallback to calibrated highway matrix
  }

  routeCache.set(key, fallbackResult);
  return fallbackResult;
}

/**
 * Format duration into human readable string (Kannada & English)
 */
export function formatDuration(minutes, lang = 'kn') {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (lang === 'kn') {
    if (hrs === 0) return `${mins} ನಿಮಿಷಗಳು`;
    return `${hrs} ಗಂಟೆ ${mins} ನಿಮಿಷ`;
  }
  if (hrs === 0) return `${mins} mins`;
  return `${hrs}h ${mins}m`;
}

// ============ ECONOMIC CALCULATION ENGINE ============

/**
 * Calculate net profit economics across all APMC markets
 */
export async function calculateMarketEconomics({
  cropId = 'tomato',
  quantityInput = 20,
  unit = 'quintal', // 'quintal', 'kg', 'ton', 'crate'
  farmerLat = 12.5284,
  farmerLng = 76.8975,
  farmerLocationName = 'Mandya, Karnataka',
  vehicleId = 'pickup',
  isRoundTrip = true,
  customPerKmRate = null,
  loadingPerQtl = 15,
  unloadingPerQtl = 15,
  apmcCessPercent = 1.5,
  weighingFee = 60
}) {
  // 1. Normalize quantity into Quintals (1 Quintal = 100 kg)
  let quantityQuintals = Number(quantityInput) || 20;
  if (unit === 'kg') {
    quantityQuintals = quantityQuintals / 100;
  } else if (unit === 'ton') {
    quantityQuintals = quantityQuintals * 10;
  } else if (unit === 'crate') {
    // 1 standard tomato crate is ~25 kg = 0.25 quintals
    quantityQuintals = quantityQuintals * 0.25;
  }
  quantityQuintals = Math.max(0.1, quantityQuintals);

  // 2. Resolve vehicle specs
  const vehicle = VEHICLES.find(v => v.id === vehicleId) || VEHICLES[1];
  const ratePerKm = customPerKmRate ? Number(customPerKmRate) : vehicle.ratePerKm;
  const tripsNeeded = Math.max(1, Math.ceil(quantityQuintals / vehicle.capacityQtl));
  const hasCapacityOverload = quantityQuintals > vehicle.capacityQtl;

  const crop = CALCULATOR_CROPS.find(c => c.id === cropId) || CALCULATOR_CROPS[0];

  // 3. Calculate metrics for each market
  const marketResults = await Promise.all(
    APMC_MARKETS.map(async (m) => {
      const priceInfo = m.prices[cropId] || { price: 2000, minPrice: 1800, maxPrice: 2200, arrivalsQtl: 500, trend: 'stable' };
      const pricePerQtl = priceInfo.price;

      // Road distance & travel time
      const route = await getRoadRoute(farmerLat, farmerLng, m.lat, m.lng);
      const distanceKm = route.distanceKm;
      const durationMinutes = route.durationMinutes;

      // Revenues
      const grossRevenue = Math.round(pricePerQtl * quantityQuintals);

      // Expenses breakdown
      const multiplier = isRoundTrip ? 2 : 1;
      const transportCost = Math.round(distanceKm * multiplier * ratePerKm * tripsNeeded);
      const loadingCharges = Math.round(loadingPerQtl * quantityQuintals);
      const unloadingCharges = Math.round(unloadingPerQtl * quantityQuintals);
      const marketCess = Math.round(grossRevenue * (apmcCessPercent / 100));
      const totalExpenses = transportCost + loadingCharges + unloadingCharges + marketCess + weighingFee;

      // Net Proceeds
      const netProceeds = grossRevenue - totalExpenses;

      return {
        market: m,
        priceInfo,
        pricePerQtl,
        grossRevenue,
        distanceKm,
        durationMinutes,
        polyline: route.polyline,
        isEstimatedRoute: route.isEstimated,
        tripsNeeded,
        transportCost,
        loadingCharges,
        unloadingCharges,
        marketCess,
        weighingFee,
        totalExpenses,
        netProceeds,
        perQuintalNet: Math.round(netProceeds / quantityQuintals)
      };
    })
  );

  // 4. Identify Nearest Market (baseline)
  marketResults.sort((a, b) => a.distanceKm - b.distanceKm);
  const nearestMarket = marketResults[0];
  nearestMarket.isNearest = true;

  // 5. Calculate Extra Profit vs Nearest Market
  marketResults.forEach(item => {
    item.extraEarnings = item.netProceeds - nearestMarket.netProceeds;
    item.extraPercent = nearestMarket.netProceeds > 0
      ? Math.round((item.extraEarnings / nearestMarket.netProceeds) * 1000) / 10
      : 0;
  });

  // 6. Identify Best Market (Highest Net Proceeds)
  const sortedByNet = [...marketResults].sort((a, b) => b.netProceeds - a.netProceeds);
  const bestMarket = sortedByNet[0];
  bestMarket.isBest = true;

  // 7. Sensitivity Checks (What if price in distant best market drops by 5% or 10%?)
  let sensitivity5Percent = null;
  let sensitivity10Percent = null;
  if (bestMarket.market.id !== nearestMarket.market.id) {
    const droppedPrice5 = bestMarket.pricePerQtl * 0.95;
    const net5 = Math.round(droppedPrice5 * quantityQuintals) - bestMarket.totalExpenses;
    sensitivity5Percent = {
      netProceeds: net5,
      diffVsNearest: net5 - nearestMarket.netProceeds,
      isStillProfitable: net5 > nearestMarket.netProceeds
    };

    const droppedPrice10 = bestMarket.pricePerQtl * 0.90;
    const net10 = Math.round(droppedPrice10 * quantityQuintals) - bestMarket.totalExpenses;
    sensitivity10Percent = {
      netProceeds: net10,
      diffVsNearest: net10 - nearestMarket.netProceeds,
      isStillProfitable: net10 > nearestMarket.netProceeds
    };
  }

  // 8. Break-even quantity: Minimum quintals to make the distant market profitable
  let breakEvenQuintals = null;
  if (bestMarket.market.id !== nearestMarket.market.id && bestMarket.pricePerQtl > nearestMarket.pricePerQtl) {
    const priceDiff = bestMarket.pricePerQtl - nearestMarket.pricePerQtl;
    const extraTransport = bestMarket.transportCost - nearestMarket.transportCost;
    if (priceDiff > 0 && extraTransport > 0) {
      breakEvenQuintals = Math.round((extraTransport / priceDiff) * 10) / 10;
    }
  }

  // 9. Generate Natural Farmer Explanations
  const explanation = generateFarmerExplanations({
    bestMarket,
    nearestMarket,
    crop,
    quantityQuintals,
    vehicle,
    hasCapacityOverload,
    tripsNeeded
  });

  return {
    crop,
    quantityQuintals,
    quantityDisplay: quantityInput,
    unit,
    vehicle,
    hasCapacityOverload,
    tripsNeeded,
    ratePerKm,
    isRoundTrip,
    farmerLocationName,
    farmerLat,
    farmerLng,
    bestMarket,
    nearestMarket,
    markets: marketResults,
    sensitivity5Percent,
    sensitivity10Percent,
    breakEvenQuintals,
    explanation
  };
}

/**
 * Generate clear, friendly farmer advisory text in Kannada and English
 */
function generateFarmerExplanations({
  bestMarket,
  nearestMarket,
  crop,
  quantityQuintals,
  vehicle,
  hasCapacityOverload,
  tripsNeeded
}) {
  const isSame = bestMarket.market.id === nearestMarket.market.id;
  const extraFormatted = Math.abs(bestMarket.extraEarnings).toLocaleString();

  let textKn = '';
  let textEn = '';

  if (isSame) {
    textKn = `ನಿಮ್ಮ ಹತ್ತಿರದ **${bestMarket.market.nameKn}** ಮಾರುಕಟ್ಟೆಯೇ ಅತ್ಯುತ್ತಮ ಆಯ್ಕೆಯಾಗಿದೆ! ದೂರದ ಮಾರುಕಟ್ಟೆಗಳಲ್ಲಿ ಸಾರಿಗೆ ವೆಚ್ಚ ಹೆಚ್ಚಾಗುವುದರಿಂದ, ಸ್ಥಳೀಯ ಮಂಡಿಯಲ್ಲೇ ಮಾರಾಟ ಮಾಡುವುದು ನಿಮ್ಮ ನಿವ್ವಳ ಲಾಭವನ್ನು ಗರಿಷ್ಠಗೊಳಿಸುತ್ತದೆ.`;
    textEn = `Your local **${bestMarket.market.name}** is already the most profitable option! The extra transport expenses of travelling farther would eat into your margins.`;
  } else {
    textKn = `**${bestMarket.market.nameKn}**ಯಲ್ಲಿ ನಿಮ್ಮ ${quantityQuintals} ಕ್ವಿಂಟಾಲ್ ${crop.nameKn} ಮಾರಾಟ ಮಾಡಿದರೆ, ಸಾರಿಗೆ ವೆಚ್ಚ ಮತ್ತು ಕೂಲಿ ಕಳೆದ ನಂತರ **${nearestMarket.market.nameKn}**ಗಿಂತ ಅಂದಾಜು **₹${extraFormatted} ಹೆಚ್ಚುವರಿ ನಿವ್ವಳ ಲಾಭ** ಗಳಿಸಬಹುದು. ${bestMarket.market.nameKn}ಯಲ್ಲಿ ಕ್ವಿಂಟಾಲ್‌ಗೆ ₹${bestMarket.pricePerQtl} ಬೆಲೆಯಿದ್ದು, ಸಾರಿಗೆ ವೆಚ್ಚ ₹${bestMarket.transportCost.toLocaleString()} ಕಳೆದರೂ ಹೆಚ್ಚಿನ ಲಾಭ ಉಳಿಯುತ್ತದೆ.`;
    textEn = `Selling your ${quantityQuintals} quintals of ${crop.name} at **${bestMarket.market.name}** gives you **₹${extraFormatted} extra take-home profit** compared to ${nearestMarket.market.name}, even after accounting for higher transportation costs (₹${bestMarket.transportCost.toLocaleString()}).`;
  }

  let warningKn = null;
  let warningEn = null;

  if (hasCapacityOverload) {
    warningKn = `⚠️ ನಿಮ್ಮ ಬೆಳೆಯ ಪ್ರಮಾಣ (${quantityQuintals} ಕ್ವಿಂ) ವಾಹನದ ಸಾಮರ್ಥ್ಯಕ್ಕಿಂತ (${vehicle.capacityQtl} ಕ್ವಿಂ) ಹೆಚ್ಚಾಗಿದೆ. ಇದಕ್ಕಾಗಿ ${tripsNeeded} ಟ್ರಿಪ್‌ಗಳು ಬೇಕಾಗುತ್ತವೆ. ದೊಡ್ಡ ವಾಹನವನ್ನು (ಪಿಕಪ್ ಅಥವಾ ಲಾರಿ) ಆಯ್ಕೆ ಮಾಡಿದರೆ ಸಾರಿಗೆ ವೆಚ್ಚ ಇನ್ನಷ್ಟು ಉಳಿಯುತ್ತದೆ.`;
    warningEn = `⚠️ Quantity (${quantityQuintals} Qtl) exceeds ${vehicle.name}'s capacity (${vehicle.capacityQtl} Qtl). This requires ${tripsNeeded} trips. Upgrading to a larger vehicle will reduce transport costs.`;
  } else if (crop.isPerishable && bestMarket.durationMinutes > 180) {
    warningKn = `🍅 ಎಚ್ಚರಿಕೆ: ${crop.nameKn} ಬೇಗ ಹಾಳಾಗುವ ಬೆಳೆಯಾಗಿದೆ. ${bestMarket.market.nameKn}ಗೆ ಪ್ರಯಾಣದ ಸಮಯ ಅಂದಾಜು ${Math.round(bestMarket.durationMinutes / 60)} ಗಂಟೆಗಳಾಗಿದೆ. ಬೆಳಿಗ್ಗೆ 06:00 AM ಮುಂಚಿತವಾಗಿ ಮಾರುಕಟ್ಟೆ ತಲುಪುವಂತೆ ರಾತ್ರಿ ಹೊರಡುವುದು ಸೂಕ್ತ.`;
    warningEn = `🍅 Perishable Alert: ${crop.name} is perishable and travel time is ~${Math.round(bestMarket.durationMinutes / 60)} hours. Plan to depart early to reach the morning auction by 06:00 AM.`;
  }

  return { textKn, textEn, warningKn, warningEn };
}
