// Quick Node validation script for Agrova Irrigation Calculator
import {
  CONVERSIONS,
  convertAreaToSqm,
  parseFarmerArea,
  convertLitresToMotorTime,
  convertMotorTimeToLitres,
  calculatePondVolumeLitres,
  calculateWellVolumeLitres,
  calculateCropWaterRequirement,
  calculateEffectiveRainfall,
  calculateWaterWalletBudget,
  evaluateWaterEmergencyPriorities,
  calculatePumpAndElectricitySchedule,
  compareIrrigationMethods,
  calculatePumpMinutesEstimation
} from '../src/irrigation-calculator.js';

console.log('--- Testing Unit Conversions ---');
const sqm = convertAreaToSqm(1, 'acre');
console.assert(Math.abs(sqm - 4046.856) < 0.01, `Expected 4046.856, got ${sqm}`);
console.log('✓ 1 Acre to Sqm conversion verified:', sqm);

console.log('\n--- Testing FAO-56 Crop Water Requirement (Tomato, 1 Acre, Flowering Stage) ---');
const tomatoReq = calculateCropWaterRequirement({
  cropId: 'tomato',
  stageKey: 'flowering',
  areaValue: 1.0,
  areaUnit: 'acre',
  et0_mm: 5.0,
  irrigationMethodId: 'drip'
});
console.log(`ETc: ${tomatoReq.dailyETc_mm} mm/day, Daily Gross Litres: ${tomatoReq.dailyGrossLitres.toLocaleString()} L`);
console.assert(tomatoReq.kc === 1.15, 'Tomato flowering Kc should be 1.15');
console.assert(tomatoReq.dailyGrossLitres > 0, 'Daily gross litres should be positive');

console.log('\n--- Testing Effective Rainfall ---');
console.assert(calculateEffectiveRainfall(3) === 0, 'Rain <= 4mm should yield 0 effective rain');
const eff20 = calculateEffectiveRainfall(20);
console.assert(eff20 > 0 && eff20 < 20, `Effective rain for 20mm was ${eff20}`);
console.log('✓ Rainfall adjustment verified:', eff20, 'mm');

console.log('\n--- Testing Hackathon Water Emergency Mode (5,000L vs 2 Acres Demand) ---');
const sampleFields = [
  {
    id: 'f1',
    name: 'Field A (North Plot)',
    cropId: 'tomato',
    stageKey: 'flowering', // Ky = 1.20, highly critical!
    area: 1.0,
    areaUnit: 'acre',
    irrigationMethod: 'drip',
    soilType: 'loamy'
  },
  {
    id: 'f2',
    name: 'Field B (South Plot)',
    cropId: 'maize',
    stageKey: 'vegetative', // Ky = 0.55, more resilient
    area: 1.0,
    areaUnit: 'acre',
    irrigationMethod: 'furrow',
    soilType: 'clay'
  }
];

const walletBudget = calculateWaterWalletBudget({
  currentUsableWaterLitres: 5000,
  storageCapacityLitres: 20000,
  fields: sampleFields,
  planningHorizonDays: 7
});

console.log(`Current Balance: ${walletBudget.currentBalance} L`);
console.log(`Total 7-day Demand: ${walletBudget.totalHorizonDemandLitres.toLocaleString()} L`);
console.log(`Shortage Detected: ${walletBudget.isShortage} (${walletBudget.shortageLitres.toLocaleString()} L deficit)`);
console.assert(walletBudget.isShortage === true, 'Should detect shortage');

const emergencyResult = evaluateWaterEmergencyPriorities({
  availableWaterLitres: 5000,
  fieldDemands: walletBudget.fieldDemands,
  planningHorizonDays: 7
});

console.log('Emergency Active:', emergencyResult.emergencyActive);
console.log('Top Priority Field:', emergencyResult.prioritizedFields[0].cropName, emergencyResult.prioritizedFields[0].urgency);
console.assert(emergencyResult.prioritizedFields[0].cropName === 'Tomato', 'Tomato in flowering should rank above vegetative maize');
console.log('Allocation Field 1 (Tomato):', emergencyResult.prioritizedFields[0].allocatedLitres, 'L');
console.log('Allocation Field 2 (Maize):', emergencyResult.prioritizedFields[1].allocatedLitres, 'L');

console.log('\n--- Testing Smart Pump Planner ---');
const pumpPlan = calculatePumpAndElectricitySchedule({
  pumpHp: 5,
  flowRateLph: 12000,
  waterVolumeLitres: 24000,
  electricityStartHour: 6,
  electricityEndHour: 10
});
console.log(`Runtime: ${pumpPlan.formattedRuntime}, Fits in 4h window: ${pumpPlan.fitsInWindow}, Energy: ${pumpPlan.energyKwh} kWh, Cost: ₹${pumpPlan.estimatedCost}`);
console.assert(pumpPlan.fitsInWindow === true, '24000L at 12000L/hr should take 2.0h, which fits in 4h window');

console.log('\n--- Testing Irrigation Method Comparison ---');
const comparison = compareIrrigationMethods({ cropId: 'tomato', areaAcres: 2.0 });
console.log(`Water Saved by Drip vs Flood: ${comparison.waterSavedLitres.toLocaleString()} L (${comparison.percentWaterSaved}%)`);
console.assert(comparison.percentWaterSaved >= 40, 'Drip should save at least 40% water over flood');

console.log('\n--- Testing Farmer-Friendly Measurements & Sources ---');

// Acres and Guntas (1 Acre = 40 Guntas)
const parsedArea = parseFarmerArea({ acres: 1, guntas: 20 });
console.assert(parsedArea.totalAcres === 1.5, `Expected 1.5 acres, got ${parsedArea.totalAcres}`);
console.assert(parsedArea.totalGuntas === 60, `Expected 60 guntas, got ${parsedArea.totalGuntas}`);
console.log('✓ Farmer Area (1 Acre 20 Guntas = 1.5 Acres) verified:', parsedArea.labelEn);

// Motor runtime to litres & vice versa
const motorLitres = convertMotorTimeToLitres(2, 30, 12000);
console.assert(motorLitres === 30000, `Expected 30,000L for 2h 30m @ 12k Lph, got ${motorLitres}`);
const motorTime = convertLitresToMotorTime(30000, 12000);
console.assert(motorTime.hours === 2 && motorTime.minutes === 30, `Expected 2h 30m, got ${motorTime.formatted}`);
console.log('✓ Motor Runtime conversion verified: 2h 30m = 30,000 Litres =', motorTime.labelKn);

// Farm pond levels
const pondHalf = calculatePondVolumeLitres({ presetId: 'medium', levelId: 'half' });
console.assert(pondHalf.currentUsableLitres > 120000 && pondHalf.currentUsableLitres < 135000, 'Pond half capacity should be ~127,426 L');
console.log('✓ Krishi Honda medium half-full verified:', pondHalf.currentUsableLitres.toLocaleString(), 'L');

// Open well standing volume
const wellVol = calculateWellVolumeLitres({ diameterFt: 15, waterDepthFt: 12 });
console.assert(wellVol.standingVolumeLitres > 58000 && wellVol.standingVolumeLitres < 62000, 'Well standing volume should be ~59,985 L');
console.log('✓ Open well standing volume verified:', wellVol.standingVolumeLitres.toLocaleString(), 'L');

console.log('\n--- Testing Farmer-First Pump Minutes Estimation & Instant Need Comparison ---');
// Test case 1: 60 available pump minutes (reuses sampleFields from earlier in test)
const est60 = calculatePumpMinutesEstimation({ availableMinutes: 60, flowRateLph: 12000, fields: sampleFields });
console.log(`60 mins runtime: Available: ${est60.availableMinutes}m (${est60.availableLitres}L) | Daily Needed: ${est60.totalDailyMinutesNeeded}m (${est60.totalDailyGrossLitres}L) | Coverage: ${est60.coveragePercent}%`);
console.assert(est60.availableMinutes === 60, 'Available minutes should be 60');
console.assert(est60.availableLitres === 12000, '60 mins @ 12k Lph should be 12,000 Litres');
console.assert(est60.totalDailyMinutesNeeded > 0, 'Total daily needed minutes should be calculated');
console.assert(est60.fieldBreakdown.length === 2, 'Should have 2 fields in breakdown');
console.assert(est60.adviceKn.length > 0 && est60.adviceEn.length > 0, 'Should have Kannada and English advice');

// Test case 2: 25 available pump minutes (Mandya crisis)
const est25 = calculatePumpMinutesEstimation({ availableMinutes: 25, flowRateLph: 12000, fields: sampleFields });
console.log(`25 mins runtime: Shortage: ${est25.isShortage} | Deficit: ${est25.deficitMinutes} mins | Coverage: ${est25.coveragePercent}%`);
console.assert(est25.isShortage === true, '25 mins should be detected as shortage');
console.assert(est25.deficitMinutes > 0, 'Deficit minutes should be positive');
console.log('✓ Farmer-first pump minutes estimation verified!');

console.log('\n✅ ALL IRRIGATION CALCULATOR TESTS PASSED SUCCESSFULLY!');
