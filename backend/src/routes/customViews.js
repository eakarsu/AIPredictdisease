// Custom Views: Risk Score Gauge + Family History Tree
// Endpoints:
//   GET /api/custom-views/risk-scores     -> patients + 0-100 risk scores
//   GET /api/custom-views/family-history  -> family members + diagnoses
//
// Backed by synthesized, plausible data (no schema dependency required).

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// -------- Synthesized patient roster (stable across requests) --------
const PATIENTS = [
  { id: 'P-1001', name: 'Eleanor Whitfield',  age: 67, sex: 'F', risk_score: 78, primary_concern: 'Type 2 Diabetes',
    biomarkers: { hba1c: 8.1, ldl: 162, bp_systolic: 148, bmi: 31.2 } },
  { id: 'P-1002', name: 'Marcus Chen',        age: 54, sex: 'M', risk_score: 64, primary_concern: 'Cardiovascular Disease',
    biomarkers: { hba1c: 6.4, ldl: 171, bp_systolic: 152, bmi: 29.8 } },
  { id: 'P-1003', name: 'Aisha Patel',        age: 41, sex: 'F', risk_score: 42, primary_concern: 'Breast Cancer (BRCA1)',
    biomarkers: { hba1c: 5.6, ldl: 118, bp_systolic: 124, bmi: 24.1 } },
  { id: 'P-1004', name: 'Diego Hernandez',    age: 33, sex: 'M', risk_score: 21, primary_concern: 'General Wellness',
    biomarkers: { hba1c: 5.2, ldl: 96,  bp_systolic: 118, bmi: 22.7 } },
  { id: 'P-1005', name: 'Sofia Bergström',    age: 72, sex: 'F', risk_score: 83, primary_concern: 'Alzheimer\'s Disease',
    biomarkers: { hba1c: 6.0, ldl: 134, bp_systolic: 138, bmi: 26.5 } },
  { id: 'P-1006', name: 'James O\'Sullivan',  age: 58, sex: 'M', risk_score: 55, primary_concern: 'Colorectal Cancer',
    biomarkers: { hba1c: 5.9, ldl: 142, bp_systolic: 131, bmi: 28.4 } },
  { id: 'P-1007', name: 'Yuki Tanaka',        age: 29, sex: 'F', risk_score: 14, primary_concern: 'None',
    biomarkers: { hba1c: 5.0, ldl: 88,  bp_systolic: 112, bmi: 21.5 } },
  { id: 'P-1008', name: 'Rashid Al-Mansoori', age: 49, sex: 'M', risk_score: 47, primary_concern: 'Hypertension',
    biomarkers: { hba1c: 5.7, ldl: 128, bp_systolic: 144, bmi: 27.1 } },
];

// -------- Family history per patient (relatives + diagnoses) --------
// Tree shape: nodes positioned for SVG rendering
const FAMILY_TREES = {
  'P-1001': {
    patient: PATIENTS[0],
    members: [
      { id: 'gf1', relation: 'Paternal Grandfather', name: 'Edward W.',  age_at_dx: 68, deceased: true,  conditions: ['Type 2 Diabetes', 'Heart Disease'], generation: 0, x: 1 },
      { id: 'gm1', relation: 'Paternal Grandmother', name: 'Margaret W.', age_at_dx: 72, deceased: true,  conditions: ['Hypertension'],                  generation: 0, x: 2 },
      { id: 'gf2', relation: 'Maternal Grandfather', name: 'Harold B.',   age_at_dx: 70, deceased: true,  conditions: ['Stroke'],                        generation: 0, x: 3 },
      { id: 'gm2', relation: 'Maternal Grandmother', name: 'Beatrice B.', age_at_dx: 80, deceased: false, conditions: ['Type 2 Diabetes'],               generation: 0, x: 4 },
      { id: 'f',   relation: 'Father',               name: 'Richard W.',  age_at_dx: 62, deceased: false, conditions: ['Type 2 Diabetes', 'Hypertension'], generation: 1, x: 1.5 },
      { id: 'm',   relation: 'Mother',               name: 'Helen W.',    age_at_dx: 58, deceased: false, conditions: ['Hypertension'],                  generation: 1, x: 3.5 },
      { id: 'p',   relation: 'Patient',              name: 'Eleanor W.',  age_at_dx: 65, deceased: false, conditions: ['Type 2 Diabetes'],               generation: 2, x: 2.5, isPatient: true },
      { id: 's1',  relation: 'Brother',              name: 'Thomas W.',   age_at_dx: 64, deceased: false, conditions: ['Type 2 Diabetes'],               generation: 2, x: 1.5 },
      { id: 's2',  relation: 'Sister',               name: 'Diana W.',    age_at_dx: null, deceased: false, conditions: [],                              generation: 2, x: 3.5 },
      { id: 'c1',  relation: 'Daughter',             name: 'Sarah W.',    age_at_dx: null, deceased: false, conditions: [],                              generation: 3, x: 2.0 },
      { id: 'c2',  relation: 'Son',                  name: 'Michael W.',  age_at_dx: 42, deceased: false, conditions: ['Pre-diabetes'],                  generation: 3, x: 3.0 },
    ],
    edges: [
      { from: 'gf1', to: 'f' }, { from: 'gm1', to: 'f' },
      { from: 'gf2', to: 'm' }, { from: 'gm2', to: 'm' },
      { from: 'f', to: 'p' }, { from: 'm', to: 'p' },
      { from: 'f', to: 's1' }, { from: 'm', to: 's1' },
      { from: 'f', to: 's2' }, { from: 'm', to: 's2' },
      { from: 'p', to: 'c1' }, { from: 'p', to: 'c2' },
    ],
  },
  'P-1002': {
    patient: PATIENTS[1],
    members: [
      { id: 'gf1', relation: 'Paternal Grandfather', name: 'Wei Chen',     age_at_dx: 65, deceased: true, conditions: ['Heart Disease'],          generation: 0, x: 1 },
      { id: 'gm1', relation: 'Paternal Grandmother', name: 'Mei Chen',     age_at_dx: 78, deceased: true, conditions: ['Stroke'],                 generation: 0, x: 2 },
      { id: 'gf2', relation: 'Maternal Grandfather', name: 'Robert Lee',   age_at_dx: 60, deceased: true, conditions: ['Heart Disease', 'Hypertension'], generation: 0, x: 3 },
      { id: 'gm2', relation: 'Maternal Grandmother', name: 'Linda Lee',    age_at_dx: 82, deceased: false, conditions: ['Hypertension'],          generation: 0, x: 4 },
      { id: 'f',   relation: 'Father',               name: 'David Chen',   age_at_dx: 58, deceased: true, conditions: ['Heart Disease'],          generation: 1, x: 1.5 },
      { id: 'm',   relation: 'Mother',               name: 'Susan Chen',   age_at_dx: 56, deceased: false, conditions: ['Hypertension'],          generation: 1, x: 3.5 },
      { id: 'p',   relation: 'Patient',              name: 'Marcus Chen',  age_at_dx: 52, deceased: false, conditions: ['Hypertension'],          generation: 2, x: 2.5, isPatient: true },
      { id: 's1',  relation: 'Sister',               name: 'Jenny Chen',   age_at_dx: null, deceased: false, conditions: [],                      generation: 2, x: 3.5 },
      { id: 'c1',  relation: 'Son',                  name: 'Kevin Chen',   age_at_dx: null, deceased: false, conditions: [],                      generation: 3, x: 2.5 },
    ],
    edges: [
      { from: 'gf1', to: 'f' }, { from: 'gm1', to: 'f' },
      { from: 'gf2', to: 'm' }, { from: 'gm2', to: 'm' },
      { from: 'f', to: 'p' }, { from: 'm', to: 'p' },
      { from: 'f', to: 's1' }, { from: 'm', to: 's1' },
      { from: 'p', to: 'c1' },
    ],
  },
  'P-1003': {
    patient: PATIENTS[2],
    members: [
      { id: 'gm1', relation: 'Paternal Grandmother', name: 'Priya Patel',   age_at_dx: 55, deceased: true, conditions: ['Breast Cancer'],         generation: 0, x: 2 },
      { id: 'gf1', relation: 'Paternal Grandfather', name: 'Arjun Patel',   age_at_dx: 70, deceased: false, conditions: ['Hypertension'],         generation: 0, x: 1 },
      { id: 'gm2', relation: 'Maternal Grandmother', name: 'Rita Shah',     age_at_dx: 62, deceased: true, conditions: ['Ovarian Cancer'],        generation: 0, x: 4 },
      { id: 'gf2', relation: 'Maternal Grandfather', name: 'Vinod Shah',    age_at_dx: 75, deceased: false, conditions: [],                       generation: 0, x: 3 },
      { id: 'f',   relation: 'Father',               name: 'Raj Patel',     age_at_dx: null, deceased: false, conditions: [],                     generation: 1, x: 1.5 },
      { id: 'm',   relation: 'Mother',               name: 'Anjali Patel',  age_at_dx: 48, deceased: false, conditions: ['Breast Cancer'],        generation: 1, x: 3.5 },
      { id: 'a1',  relation: 'Maternal Aunt',        name: 'Meera Shah',    age_at_dx: 50, deceased: false, conditions: ['Breast Cancer'],        generation: 1, x: 4.5 },
      { id: 'p',   relation: 'Patient',              name: 'Aisha Patel',   age_at_dx: null, deceased: false, conditions: ['BRCA1+ (carrier)'],   generation: 2, x: 2.5, isPatient: true },
      { id: 's1',  relation: 'Sister',               name: 'Priti Patel',   age_at_dx: 38, deceased: false, conditions: ['Breast Cancer'],        generation: 2, x: 3.5 },
      { id: 'c1',  relation: 'Daughter',             name: 'Maya Patel',    age_at_dx: null, deceased: false, conditions: [],                     generation: 3, x: 2.5 },
    ],
    edges: [
      { from: 'gf1', to: 'f' }, { from: 'gm1', to: 'f' },
      { from: 'gf2', to: 'm' }, { from: 'gm2', to: 'm' },
      { from: 'gf2', to: 'a1' }, { from: 'gm2', to: 'a1' },
      { from: 'f', to: 'p' }, { from: 'm', to: 'p' },
      { from: 'f', to: 's1' }, { from: 'm', to: 's1' },
      { from: 'p', to: 'c1' },
    ],
  },
  'P-1004': {
    patient: PATIENTS[3],
    members: [
      { id: 'gf1', relation: 'Paternal Grandfather', name: 'Carlos H.',    age_at_dx: 78, deceased: false, conditions: [],                        generation: 0, x: 1 },
      { id: 'gm1', relation: 'Paternal Grandmother', name: 'Rosa H.',      age_at_dx: 76, deceased: false, conditions: ['Hypertension'],          generation: 0, x: 2 },
      { id: 'gf2', relation: 'Maternal Grandfather', name: 'Pedro G.',     age_at_dx: 80, deceased: true, conditions: ['Stroke'],                 generation: 0, x: 3 },
      { id: 'gm2', relation: 'Maternal Grandmother', name: 'Lucia G.',     age_at_dx: 79, deceased: false, conditions: [],                        generation: 0, x: 4 },
      { id: 'f',   relation: 'Father',               name: 'Miguel H.',    age_at_dx: null, deceased: false, conditions: [],                      generation: 1, x: 1.5 },
      { id: 'm',   relation: 'Mother',               name: 'Elena H.',     age_at_dx: null, deceased: false, conditions: [],                      generation: 1, x: 3.5 },
      { id: 'p',   relation: 'Patient',              name: 'Diego H.',     age_at_dx: null, deceased: false, conditions: [],                      generation: 2, x: 2.5, isPatient: true },
    ],
    edges: [
      { from: 'gf1', to: 'f' }, { from: 'gm1', to: 'f' },
      { from: 'gf2', to: 'm' }, { from: 'gm2', to: 'm' },
      { from: 'f', to: 'p' }, { from: 'm', to: 'p' },
    ],
  },
  'P-1005': {
    patient: PATIENTS[4],
    members: [
      { id: 'gf1', relation: 'Paternal Grandfather', name: 'Lars B.',      age_at_dx: 72, deceased: true, conditions: ['Alzheimer\'s Disease'],   generation: 0, x: 1 },
      { id: 'gm1', relation: 'Paternal Grandmother', name: 'Ingrid B.',    age_at_dx: 80, deceased: true, conditions: ['Heart Disease'],          generation: 0, x: 2 },
      { id: 'gf2', relation: 'Maternal Grandfather', name: 'Olof S.',      age_at_dx: 68, deceased: true, conditions: ['Stroke'],                 generation: 0, x: 3 },
      { id: 'gm2', relation: 'Maternal Grandmother', name: 'Astrid S.',    age_at_dx: 75, deceased: true, conditions: ['Alzheimer\'s Disease'],   generation: 0, x: 4 },
      { id: 'f',   relation: 'Father',               name: 'Erik B.',      age_at_dx: 70, deceased: true, conditions: ['Alzheimer\'s Disease'],   generation: 1, x: 1.5 },
      { id: 'm',   relation: 'Mother',               name: 'Karin B.',     age_at_dx: 65, deceased: false, conditions: ['Hypertension'],          generation: 1, x: 3.5 },
      { id: 'p',   relation: 'Patient',              name: 'Sofia B.',     age_at_dx: 70, deceased: false, conditions: ['Mild Cognitive Impairment'], generation: 2, x: 2.5, isPatient: true },
      { id: 's1',  relation: 'Brother',              name: 'Henrik B.',    age_at_dx: null, deceased: false, conditions: [],                      generation: 2, x: 3.5 },
    ],
    edges: [
      { from: 'gf1', to: 'f' }, { from: 'gm1', to: 'f' },
      { from: 'gf2', to: 'm' }, { from: 'gm2', to: 'm' },
      { from: 'f', to: 'p' }, { from: 'm', to: 'p' },
      { from: 'f', to: 's1' }, { from: 'm', to: 's1' },
    ],
  },
};

// Color mapping for conditions (used by frontend to legend-color tree nodes)
const CONDITION_COLORS = {
  'Type 2 Diabetes':              '#f59e0b',
  'Pre-diabetes':                 '#fbbf24',
  'Hypertension':                 '#ef4444',
  'Heart Disease':                '#dc2626',
  'Stroke':                       '#7c3aed',
  'Breast Cancer':                '#ec4899',
  'Ovarian Cancer':               '#db2777',
  'BRCA1+ (carrier)':             '#a21caf',
  'Colorectal Cancer':            '#06b6d4',
  'Alzheimer\'s Disease':         '#6366f1',
  'Mild Cognitive Impairment':    '#818cf8',
};

// -------- Endpoint 1: Risk Scores --------
router.get('/risk-scores', authenticateToken, (req, res) => {
  res.json({
    ok: true,
    generated_at: new Date().toISOString(),
    scoring_method: 'composite (biomarkers + family history + lifestyle)',
    zones: { green: '0-29', amber: '30-60', red: '61-100' },
    patients: PATIENTS,
  });
});

// -------- Endpoint 2: Family History --------
router.get('/family-history', authenticateToken, (req, res) => {
  const patientId = req.query.patient_id || 'P-1001';
  const tree = FAMILY_TREES[patientId] || FAMILY_TREES['P-1001'];
  res.json({
    ok: true,
    patient_id: patientId,
    available_patients: Object.keys(FAMILY_TREES).map(id => ({
      id, name: FAMILY_TREES[id].patient.name,
    })),
    condition_colors: CONDITION_COLORS,
    tree,
  });
});

// -------- LOINC / SNOMED reference maps for FHIR encoding --------
const BIOMARKER_LOINC = {
  hba1c:       { code: '4548-4',  display: 'Hemoglobin A1c/Hemoglobin.total in Blood',     unit: '%',     ucum: '%' },
  ldl:         { code: '13457-7', display: 'Cholesterol in LDL [Mass/volume] in Serum',    unit: 'mg/dL', ucum: 'mg/dL' },
  bp_systolic: { code: '8480-6',  display: 'Systolic blood pressure',                      unit: 'mmHg',  ucum: 'mm[Hg]' },
  bmi:         { code: '39156-5', display: 'Body mass index (BMI) [Ratio]',                unit: 'kg/m2', ucum: 'kg/m2' },
};

const CONDITION_SNOMED = {
  'Type 2 Diabetes':              { code: '44054006',  display: 'Diabetes mellitus type 2' },
  'Pre-diabetes':                 { code: '714628002', display: 'Prediabetes' },
  'Hypertension':                 { code: '38341003',  display: 'Hypertensive disorder' },
  'Heart Disease':                { code: '56265001',  display: 'Heart disease' },
  'Cardiovascular Disease':       { code: '49601007',  display: 'Disorder of cardiovascular system' },
  'Stroke':                       { code: '230690007', display: 'Cerebrovascular accident' },
  'Breast Cancer':                { code: '254837009', display: 'Malignant neoplasm of breast' },
  'Breast Cancer (BRCA1)':        { code: '254837009', display: 'Malignant neoplasm of breast (BRCA1 carrier)' },
  'Ovarian Cancer':               { code: '363443007', display: 'Malignant neoplasm of ovary' },
  'BRCA1+ (carrier)':             { code: '445333001', display: 'BRCA1 gene mutation positive' },
  'Colorectal Cancer':            { code: '363406005', display: 'Malignant neoplasm of colon' },
  "Alzheimer's Disease":          { code: '26929004',  display: "Alzheimer's disease" },
  'Mild Cognitive Impairment':    { code: '386805003', display: 'Mild cognitive disorder' },
  'General Wellness':             { code: '102499006', display: 'General health assessment' },
  'None':                         { code: '160245001', display: 'No current problems or disability' },
};

function buildFhirBundle(patient) {
  const now = new Date().toISOString();
  const patientResourceId = `pat-${patient.id}`;
  const [first, ...rest] = (patient.name || '').split(' ');
  const family = rest.join(' ') || '';

  const patientResource = {
    fullUrl: `urn:uuid:${patientResourceId}`,
    resource: {
      resourceType: 'Patient',
      id: patientResourceId,
      identifier: [{ system: 'urn:outbreakpredict:patient-id', value: patient.id }],
      name: [{ use: 'official', given: [first], family }],
      gender: patient.sex === 'M' ? 'male' : patient.sex === 'F' ? 'female' : 'unknown',
      birthDate: new Date(new Date().getFullYear() - patient.age, 0, 1).toISOString().slice(0, 10),
    },
  };

  const observationEntries = Object.entries(patient.biomarkers || {}).map(([key, value]) => {
    const meta = BIOMARKER_LOINC[key] || { code: key, display: key, unit: '', ucum: '' };
    const obsId = `obs-${patient.id}-${key}`;
    return {
      fullUrl: `urn:uuid:${obsId}`,
      resource: {
        resourceType: 'Observation',
        id: obsId,
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'laboratory', display: 'Laboratory',
          }],
        }],
        code: {
          coding: [{ system: 'http://loinc.org', code: meta.code, display: meta.display }],
          text: meta.display,
        },
        subject: { reference: `urn:uuid:${patientResourceId}` },
        effectiveDateTime: now,
        valueQuantity: { value, unit: meta.unit, system: 'http://unitsofmeasure.org', code: meta.ucum },
      },
    };
  });

  const conditions = [patient.primary_concern].filter(Boolean);
  const conditionEntries = conditions.map((cName, idx) => {
    const meta = CONDITION_SNOMED[cName] || { code: '000000', display: cName };
    const condId = `cond-${patient.id}-${idx}`;
    return {
      fullUrl: `urn:uuid:${condId}`,
      resource: {
        resourceType: 'Condition',
        id: condId,
        clinicalStatus: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: 'active', display: 'Active',
          }],
        },
        verificationStatus: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: 'confirmed', display: 'Confirmed',
          }],
        },
        code: {
          coding: [{ system: 'http://snomed.info/sct', code: meta.code, display: meta.display }],
          text: cName,
        },
        subject: { reference: `urn:uuid:${patientResourceId}` },
        recordedDate: now,
      },
    };
  });

  return {
    resourceType: 'Bundle',
    id: `bundle-${patient.id}-${Date.now()}`,
    type: 'collection',
    timestamp: now,
    entry: [patientResource, ...observationEntries, ...conditionEntries],
  };
}

// -------- Endpoint 3: FHIR Bundle Export --------
router.get('/fhir-bundle', authenticateToken, (req, res) => {
  const patientId = req.query.patient_id || PATIENTS[0].id;
  const patient = PATIENTS.find(p => p.id === patientId) || PATIENTS[0];
  const bundle = buildFhirBundle(patient);
  res.json({
    ok: true,
    patient_id: patient.id,
    available_patients: PATIENTS.map(p => ({ id: p.id, name: p.name })),
    fhir_version: '4.0.1',
    profile: 'HL7 FHIR R4 Bundle (collection)',
    bundle,
  });
});

// -------- Endpoint 4: Disease Risk Calculator --------
router.post('/calculate-risk', authenticateToken, (req, res) => {
  const body = req.body || {};
  const age      = Number(body.age) || 0;
  const sex      = String(body.sex || 'U');
  const family   = body.family_history || {};
  const lifestyle = body.lifestyle || {};
  const bio      = body.biomarkers || {};

  // ---- Weighted scoring ----
  let score = 0;
  const breakdown = [];

  // Age (max ~22)
  let agePts = 0;
  if (age >= 75)      agePts = 22;
  else if (age >= 65) agePts = 18;
  else if (age >= 55) agePts = 13;
  else if (age >= 45) agePts = 8;
  else if (age >= 35) agePts = 4;
  else                agePts = 1;
  score += agePts;
  breakdown.push({ category: 'Age', points: agePts, max: 22, note: `Age ${age}` });

  // Family history (max ~22)
  let famPts = 0;
  if (family.diabetes)              famPts += 5;
  if (family.heart_disease)         famPts += 6;
  if (family.cancer)                famPts += 5;
  if (family.stroke)                famPts += 3;
  if (family.alzheimers)            famPts += 3;
  famPts = Math.min(famPts, 22);
  score += famPts;
  breakdown.push({ category: 'Family History', points: famPts, max: 22, note: `${Object.values(family).filter(Boolean).length} risk factors` });

  // Lifestyle (max ~24)
  let lifePts = 0;
  if (lifestyle.smoker)             lifePts += 8;
  if (lifestyle.heavy_alcohol)      lifePts += 5;
  if (lifestyle.sedentary)          lifePts += 5;
  if (lifestyle.poor_diet)          lifePts += 4;
  if (lifestyle.high_stress)        lifePts += 2;
  lifePts = Math.min(lifePts, 24);
  score += lifePts;
  breakdown.push({ category: 'Lifestyle', points: lifePts, max: 24, note: `${Object.values(lifestyle).filter(Boolean).length} risk behaviors` });

  // Biomarkers (max ~32)
  let bioPts = 0;
  const hba1c = Number(bio.hba1c) || 0;
  const ldl   = Number(bio.ldl) || 0;
  const bp    = Number(bio.bp_systolic) || 0;
  const bmi   = Number(bio.bmi) || 0;
  if (hba1c >= 6.5)      bioPts += 9;
  else if (hba1c >= 5.7) bioPts += 5;
  if (ldl >= 160)        bioPts += 8;
  else if (ldl >= 130)   bioPts += 4;
  if (bp >= 140)         bioPts += 8;
  else if (bp >= 130)    bioPts += 4;
  if (bmi >= 30)         bioPts += 7;
  else if (bmi >= 25)    bioPts += 3;
  bioPts = Math.min(bioPts, 32);
  score += bioPts;
  breakdown.push({ category: 'Biomarkers', points: bioPts, max: 32, note: `HbA1c ${hba1c}, LDL ${ldl}, BP ${bp}, BMI ${bmi}` });

  // Sex modifier (small)
  if (sex === 'M' && age >= 45) {
    score += 2;
    breakdown.push({ category: 'Sex/Age Modifier', points: 2, max: 2, note: 'Male ≥ 45' });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Band
  let band, bandColor;
  if (score < 30)       { band = 'Low';      bandColor = '#10b981'; }
  else if (score <= 60) { band = 'Moderate'; bandColor = '#f59e0b'; }
  else                  { band = 'High';     bandColor = '#ef4444'; }

  // Recommendations
  const recommendations = [];
  if (hba1c >= 5.7)            recommendations.push('Schedule HbA1c re-test in 3 months; consider dietitian referral.');
  if (ldl >= 130)              recommendations.push('Initiate lipid-lowering therapy review with primary care.');
  if (bp >= 130)               recommendations.push('Begin daily BP monitoring; assess sodium intake.');
  if (bmi >= 25)               recommendations.push('Structured weight-management plan: 150 min/week moderate activity.');
  if (lifestyle.smoker)        recommendations.push('Smoking cessation: NRT + counseling per USPSTF.');
  if (lifestyle.heavy_alcohol) recommendations.push('AUDIT-C screening; reduce intake to < 14 drinks/week.');
  if (lifestyle.sedentary)     recommendations.push('Gradual activity ramp: 7,500 → 10,000 steps/day over 8 weeks.');
  if (family.cancer)           recommendations.push('Age-appropriate cancer screening (mammo / colonoscopy / PSA).');
  if (family.heart_disease)    recommendations.push('Coronary calcium score for refined CV risk stratification.');
  if (family.alzheimers && age >= 60) recommendations.push('Annual cognitive screening (MoCA / MMSE).');
  if (score >= 61)             recommendations.push('Specialist referral recommended within 30 days.');
  if (score < 30 && recommendations.length === 0) recommendations.push('Continue annual preventive visits; maintain current lifestyle.');

  res.json({
    ok: true,
    score,
    band,
    band_color: bandColor,
    breakdown,
    recommendations,
    computed_at: new Date().toISOString(),
    method: 'Composite weighted score (age + family hx + lifestyle + biomarkers), 0-100.',
  });
});

export default router;
