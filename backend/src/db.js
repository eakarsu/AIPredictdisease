import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'outbreak_predict',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'analyst',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS disease_outbreaks (
        id SERIAL PRIMARY KEY,
        disease_name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        region VARCHAR(255) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        cases_reported INTEGER NOT NULL,
        deaths INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        start_date DATE NOT NULL,
        end_date DATE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS vaccination_campaigns (
        id SERIAL PRIMARY KEY,
        campaign_name VARCHAR(255) NOT NULL,
        disease_target VARCHAR(255) NOT NULL,
        region VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        target_population INTEGER NOT NULL,
        vaccinated_count INTEGER DEFAULT 0,
        vaccine_type VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'planned',
        budget DECIMAL(15,2),
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS regional_risks (
        id SERIAL PRIMARY KEY,
        region VARCHAR(255) NOT NULL,
        country VARCHAR(255) NOT NULL,
        risk_level VARCHAR(50) NOT NULL,
        risk_score DECIMAL(5,2) NOT NULL,
        population INTEGER NOT NULL,
        healthcare_capacity VARCHAR(50) NOT NULL,
        primary_threats TEXT,
        last_outbreak_date DATE,
        infrastructure_rating VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS surveillance_reports (
        id SERIAL PRIMARY KEY,
        report_title VARCHAR(255) NOT NULL,
        disease VARCHAR(255) NOT NULL,
        region VARCHAR(255) NOT NULL,
        report_date DATE NOT NULL,
        reporter VARCHAR(255) NOT NULL,
        case_count INTEGER NOT NULL,
        trend VARCHAR(50) NOT NULL,
        confidence_level VARCHAR(50) NOT NULL,
        data_source VARCHAR(255),
        summary TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS resource_allocations (
        id SERIAL PRIMARY KEY,
        resource_name VARCHAR(255) NOT NULL,
        resource_type VARCHAR(100) NOT NULL,
        allocated_to VARCHAR(255) NOT NULL,
        region VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'allocated',
        priority VARCHAR(50) NOT NULL,
        cost DECIMAL(15,2),
        allocation_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public_health_alerts (
        id SERIAL PRIMARY KEY,
        alert_title VARCHAR(255) NOT NULL,
        alert_type VARCHAR(100) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        region VARCHAR(255) NOT NULL,
        disease VARCHAR(255),
        issued_date TIMESTAMP NOT NULL,
        expiry_date TIMESTAMP,
        issued_by VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS epidemiological_data (
        id SERIAL PRIMARY KEY,
        disease VARCHAR(255) NOT NULL,
        region VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL,
        week_number INTEGER,
        cases INTEGER NOT NULL,
        deaths INTEGER DEFAULT 0,
        recovery_rate DECIMAL(5,2),
        transmission_rate DECIMAL(5,2),
        age_group VARCHAR(50),
        data_source VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS vaccine_inventory (
        id SERIAL PRIMARY KEY,
        vaccine_name VARCHAR(255) NOT NULL,
        manufacturer VARCHAR(255) NOT NULL,
        batch_number VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL,
        storage_location VARCHAR(255) NOT NULL,
        storage_temp VARCHAR(50) NOT NULL,
        manufacture_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'available',
        unit_cost DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS healthcare_facilities (
        id SERIAL PRIMARY KEY,
        facility_name VARCHAR(255) NOT NULL,
        facility_type VARCHAR(100) NOT NULL,
        region VARCHAR(255) NOT NULL,
        address VARCHAR(500) NOT NULL,
        capacity INTEGER NOT NULL,
        current_occupancy INTEGER DEFAULT 0,
        icu_beds INTEGER DEFAULT 0,
        ventilators INTEGER DEFAULT 0,
        staff_count INTEGER NOT NULL,
        contact_number VARCHAR(50),
        status VARCHAR(50) DEFAULT 'operational',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Forecasts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS forecasts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        endpoint VARCHAR(100),
        disease VARCHAR(100),
        region VARCHAR(100),
        result TEXT,
        result_json JSONB,
        predicted_cases INTEGER,
        confidence_low INTEGER,
        confidence_high INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Alert subscribers
    await client.query(`
      CREATE TABLE IF NOT EXISTS alert_subscribers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        region VARCHAR(255),
        disease VARCHAR(255),
        min_severity VARCHAR(50) DEFAULT 'medium',
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Alert dispatches
    await client.query(`
      CREATE TABLE IF NOT EXISTS alert_dispatches (
        id SERIAL PRIMARY KEY,
        alert_id INTEGER,
        subscriber_id INTEGER,
        sent_at TIMESTAMP DEFAULT NOW(),
        channel VARCHAR(50) DEFAULT 'email',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Patient history tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS patient_history (
        id SERIAL PRIMARY KEY,
        patient_id VARCHAR(255) NOT NULL,
        symptom_report JSONB NOT NULL,
        prediction_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // AI results table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        endpoint VARCHAR(150),
        patient_id VARCHAR(255),
        result TEXT,
        result_json JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // HIPAA audit log
    await client.query(`
      CREATE TABLE IF NOT EXISTS hipaa_audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(150),
        patient_id VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent TEXT,
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ All tables created successfully');
  } finally {
    client.release();
  }
}

export async function seedDatabase() {
  const client = await pool.connect();
  try {
    // Check if data already exists
    const { rows } = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(rows[0].count) > 0) {
      console.log('📦 Database already seeded, skipping...');
      return;
    }

    // Seed users
    const hashedPassword = await bcrypt.hash(process.env.DEFAULT_PASSWORD || 'admin123', 10);
    await client.query(`
      INSERT INTO users (email, password, name, role) VALUES
      ($1, $2, 'Admin User', 'admin')
    `, [process.env.DEFAULT_EMAIL || 'admin@outbreakpredict.com', hashedPassword]);

    // Seed disease outbreaks (15+ items)
    await client.query(`
      INSERT INTO disease_outbreaks (disease_name, location, region, severity, cases_reported, deaths, status, start_date, end_date, description) VALUES
      ('Influenza A (H1N1)', 'New York City', 'North America', 'high', 12500, 89, 'active', '2025-10-15', NULL, 'Seasonal flu outbreak with higher than expected severity in metropolitan areas'),
      ('Influenza B', 'London', 'Europe', 'moderate', 8200, 34, 'active', '2025-11-01', NULL, 'Moderate flu season with increased cases in elderly populations'),
      ('COVID-19 Variant XBB.3', 'Tokyo', 'Asia Pacific', 'high', 45000, 230, 'active', '2025-09-20', NULL, 'New variant showing increased transmissibility in dense urban areas'),
      ('Dengue Fever', 'Mumbai', 'South Asia', 'critical', 67000, 890, 'active', '2025-06-01', NULL, 'Monsoon-driven dengue epidemic with record case numbers'),
      ('Malaria', 'Lagos', 'West Africa', 'critical', 120000, 3400, 'active', '2025-04-01', NULL, 'Persistent malaria burden exacerbated by flooding events'),
      ('Cholera', 'Dhaka', 'South Asia', 'high', 23000, 456, 'contained', '2025-07-15', '2025-12-01', 'Waterborne outbreak following infrastructure damage'),
      ('Measles', 'São Paulo', 'South America', 'moderate', 5600, 12, 'active', '2025-08-10', NULL, 'Measles resurgence linked to declining vaccination rates'),
      ('Ebola', 'Kinshasa', 'Central Africa', 'critical', 340, 145, 'contained', '2025-03-01', '2025-08-15', 'Contained Ebola outbreak with rapid response deployment'),
      ('Zika Virus', 'Miami', 'North America', 'low', 890, 0, 'monitoring', '2025-07-01', NULL, 'Low-level Zika transmission detected via mosquito surveillance'),
      ('RSV', 'Berlin', 'Europe', 'moderate', 15000, 67, 'active', '2025-10-01', NULL, 'Respiratory syncytial virus surge in pediatric populations'),
      ('Tuberculosis', 'Manila', 'Southeast Asia', 'high', 89000, 5600, 'active', '2025-01-01', NULL, 'Endemic TB with drug-resistant strain emergence'),
      ('Hepatitis A', 'Cairo', 'Middle East', 'moderate', 4500, 23, 'contained', '2025-05-01', '2025-09-30', 'Hepatitis A outbreak linked to contaminated water supply'),
      ('Norovirus', 'Sydney', 'Oceania', 'low', 7800, 5, 'resolved', '2025-06-15', '2025-08-01', 'Seasonal norovirus outbreak in cruise ship and hospitality sector'),
      ('West Nile Virus', 'Dallas', 'North America', 'moderate', 1200, 45, 'monitoring', '2025-07-20', NULL, 'Mosquito-borne WNV cases rising with warmer temperatures'),
      ('Avian Influenza H5N1', 'Hanoi', 'Southeast Asia', 'high', 78, 23, 'active', '2025-11-15', NULL, 'Zoonotic avian flu with human transmission concerns'),
      ('Mpox', 'Paris', 'Europe', 'low', 560, 2, 'monitoring', '2025-09-01', NULL, 'Low-level mpox transmission in urban centers')
    `);

    // Seed vaccination campaigns (15+ items)
    await client.query(`
      INSERT INTO vaccination_campaigns (campaign_name, disease_target, region, start_date, end_date, target_population, vaccinated_count, vaccine_type, status, budget, description) VALUES
      ('Winter Flu Shield 2025', 'Influenza', 'North America', '2025-09-01', '2026-03-31', 150000000, 89000000, 'Quadrivalent Influenza', 'active', 2500000000.00, 'Annual influenza vaccination campaign targeting high-risk groups'),
      ('COVID Booster Wave 5', 'COVID-19', 'Global', '2025-10-01', '2026-06-30', 500000000, 120000000, 'mRNA Bivalent', 'active', 8000000000.00, 'Fifth wave booster targeting new XBB variants'),
      ('Africa Malaria Initiative', 'Malaria', 'Sub-Saharan Africa', '2025-01-01', '2026-12-31', 80000000, 23000000, 'RTS,S/AS01', 'active', 3200000000.00, 'Landmark malaria vaccine rollout for children under 5'),
      ('Dengue Shield Southeast Asia', 'Dengue', 'Southeast Asia', '2025-04-01', '2025-12-31', 25000000, 18000000, 'Dengvaxia', 'active', 890000000.00, 'Pre-monsoon dengue vaccination in endemic regions'),
      ('Measles Catch-Up Americas', 'Measles', 'South America', '2025-06-01', '2026-05-31', 15000000, 4500000, 'MMR', 'active', 450000000.00, 'Catch-up campaign to restore measles immunity gaps'),
      ('Cholera Response Bangladesh', 'Cholera', 'South Asia', '2025-07-20', '2025-12-31', 5000000, 4200000, 'Oral Cholera Vaccine', 'completed', 120000000.00, 'Emergency cholera vaccination in flood-affected areas'),
      ('HPV Elimination Program', 'HPV', 'Europe', '2025-01-01', '2027-12-31', 20000000, 8900000, 'Gardasil 9', 'active', 1800000000.00, 'School-based HPV vaccination for cervical cancer elimination'),
      ('Ebola Ring Vaccination DRC', 'Ebola', 'Central Africa', '2025-03-05', '2025-09-01', 200000, 185000, 'rVSV-ZEBOV', 'completed', 45000000.00, 'Ring vaccination strategy around confirmed Ebola cases'),
      ('Pneumococcal Elderly Shield', 'Pneumonia', 'North America', '2025-09-15', '2026-04-30', 45000000, 12000000, 'PCV20', 'active', 670000000.00, 'Pneumococcal vaccination for adults over 65'),
      ('Polio Eradication Final Push', 'Polio', 'South Asia', '2025-01-01', '2026-12-31', 120000000, 95000000, 'bOPV + IPV', 'active', 1200000000.00, 'Final eradication campaign in remaining endemic regions'),
      ('Hepatitis B Universal', 'Hepatitis B', 'Southeast Asia', '2025-03-01', '2026-12-31', 30000000, 11000000, 'Recombinant HepB', 'active', 560000000.00, 'Universal hepatitis B vaccination for newborns'),
      ('RSV Infant Protection', 'RSV', 'Europe', '2025-08-01', '2026-03-31', 8000000, 2100000, 'Nirsevimab', 'active', 920000000.00, 'Monoclonal antibody program for infant RSV protection'),
      ('Yellow Fever Africa Belt', 'Yellow Fever', 'West Africa', '2025-02-01', '2025-12-31', 35000000, 28000000, 'YF-17D', 'active', 340000000.00, 'Preventive yellow fever campaign in endemic belt'),
      ('Typhoid Conjugate South Asia', 'Typhoid', 'South Asia', '2025-05-01', '2026-04-30', 18000000, 6700000, 'Vi-TCV', 'active', 230000000.00, 'Typhoid conjugate vaccine in high-burden urban settings'),
      ('Japanese Encephalitis Campaign', 'Japanese Encephalitis', 'East Asia', '2025-04-01', '2025-10-31', 12000000, 9800000, 'SA 14-14-2', 'completed', 180000000.00, 'Pre-season JE vaccination in rice-farming communities'),
      ('Rabies Post-Exposure Program', 'Rabies', 'South Asia', '2025-01-01', '2025-12-31', 3000000, 1800000, 'PVRV', 'active', 95000000.00, 'Expanded post-exposure prophylaxis access in rural areas')
    `);

    // Seed regional risks (15+ items)
    await client.query(`
      INSERT INTO regional_risks (region, country, risk_level, risk_score, population, healthcare_capacity, primary_threats, last_outbreak_date, infrastructure_rating, notes) VALUES
      ('Northeast US', 'United States', 'moderate', 6.2, 56000000, 'high', 'Influenza, COVID-19, Lyme Disease', '2025-10-15', 'excellent', 'Dense urban centers increase transmission risk despite strong healthcare'),
      ('Sub-Saharan West Africa', 'Nigeria', 'critical', 9.1, 220000000, 'low', 'Malaria, Cholera, Lassa Fever', '2025-04-01', 'poor', 'Limited healthcare access and infrastructure create persistent vulnerability'),
      ('South Asia - Bengal Delta', 'Bangladesh', 'critical', 8.8, 170000000, 'low', 'Cholera, Dengue, Typhoid', '2025-07-15', 'poor', 'Climate-driven flooding amplifies waterborne disease risk'),
      ('Western Europe', 'Germany', 'low', 3.1, 84000000, 'high', 'Influenza, RSV, COVID-19', '2025-10-01', 'excellent', 'Strong surveillance and healthcare systems mitigate risk'),
      ('Southeast Asia - Mekong', 'Vietnam', 'high', 7.5, 100000000, 'moderate', 'Dengue, Avian Influenza, JE', '2025-11-15', 'moderate', 'Tropical climate and animal agriculture increase zoonotic risk'),
      ('East Africa - Horn', 'Ethiopia', 'critical', 8.5, 125000000, 'low', 'Cholera, Measles, Malaria', '2025-05-20', 'poor', 'Conflict and displacement create ideal conditions for outbreaks'),
      ('South America - Amazon', 'Brazil', 'high', 7.2, 215000000, 'moderate', 'Dengue, Zika, Yellow Fever', '2025-08-10', 'moderate', 'Deforestation driving increased vector-borne disease contact'),
      ('Central Asia', 'Kazakhstan', 'moderate', 5.4, 19000000, 'moderate', 'Tuberculosis, Plague, Anthrax', '2024-06-15', 'moderate', 'Legacy biocontainment concerns and drug-resistant TB'),
      ('Pacific Islands', 'Fiji', 'high', 7.0, 900000, 'low', 'Dengue, Leptospirosis, Typhoid', '2025-02-20', 'poor', 'Isolation limits healthcare access and supply chains'),
      ('Middle East - Levant', 'Lebanon', 'high', 7.3, 5500000, 'moderate', 'Cholera, Leishmaniasis, COVID-19', '2025-04-10', 'moderate', 'Refugee populations and infrastructure strain increase vulnerability'),
      ('Northern Europe - Scandinavia', 'Sweden', 'low', 2.5, 10500000, 'high', 'Influenza, TBE', '2024-11-01', 'excellent', 'Excellent public health infrastructure and low population density'),
      ('Caribbean Islands', 'Haiti', 'critical', 9.3, 11500000, 'low', 'Cholera, Dengue, Malaria', '2025-06-01', 'poor', 'Post-disaster vulnerability with minimal healthcare infrastructure'),
      ('East Asia - Urban', 'Japan', 'low', 3.5, 125000000, 'high', 'Influenza, COVID-19, RSV', '2025-09-20', 'excellent', 'Aging population increases severity risk despite strong systems'),
      ('Central Africa - Congo Basin', 'DR Congo', 'critical', 9.5, 100000000, 'low', 'Ebola, Malaria, Measles, Mpox', '2025-03-01', 'poor', 'Ongoing conflict zones with limited surveillance capability'),
      ('Oceania - Australia', 'Australia', 'low', 2.8, 26000000, 'high', 'Influenza, JE, Murray Valley Encephalitis', '2025-06-15', 'excellent', 'Strong surveillance but climate change expanding vector ranges'),
      ('South Asia - Indo-Gangetic', 'India', 'high', 8.0, 600000000, 'moderate', 'Dengue, Malaria, TB, Cholera', '2025-06-01', 'moderate', 'Massive population density with improving but strained healthcare')
    `);

    // Seed surveillance reports (15+ items)
    await client.query(`
      INSERT INTO surveillance_reports (report_title, disease, region, report_date, reporter, case_count, trend, confidence_level, data_source, summary) VALUES
      ('Weekly Flu Surveillance - NYC', 'Influenza A', 'North America', '2025-12-15', 'CDC Atlanta', 3200, 'increasing', 'high', 'ILINet Sentinel Surveillance', 'Influenza activity continues to rise above baseline with H1N1 predominating'),
      ('COVID-19 Wastewater Signal Alert', 'COVID-19', 'Europe', '2025-12-10', 'ECDC Stockholm', 0, 'increasing', 'moderate', 'Wastewater Genomic Surveillance', 'Wastewater viral loads increasing 3x in Western European cities before clinical cases'),
      ('Dengue Monthly Report - SEA', 'Dengue', 'Southeast Asia', '2025-12-01', 'WHO SEARO', 45000, 'stable', 'high', 'National Reporting Systems', 'Post-monsoon dengue cases stabilizing but remain above 5-year average'),
      ('Malaria Sentinel Site Report', 'Malaria', 'West Africa', '2025-11-28', 'WHO AFRO', 89000, 'increasing', 'moderate', 'Sentinel Health Facilities', 'Rainy season driving increased malaria transmission in Sahel region'),
      ('RSV Pediatric Surveillance', 'RSV', 'Europe', '2025-12-08', 'ECDC', 8900, 'increasing', 'high', 'Hospital Sentinel Network', 'RSV hospitalizations in under-2s exceeding previous winter peaks'),
      ('Avian Flu Zoonotic Alert', 'H5N1', 'Southeast Asia', '2025-12-12', 'FAO/OIE', 12, 'stable', 'moderate', 'Joint Animal-Human Surveillance', 'Sporadic human H5N1 cases linked to live poultry markets'),
      ('TB Drug Resistance Report', 'Tuberculosis', 'South Asia', '2025-11-30', 'WHO SEARO', 15000, 'increasing', 'moderate', 'National TB Programs', 'MDR-TB proportion rising to 4.2% of new cases in the region'),
      ('Cholera Situation Update', 'Cholera', 'East Africa', '2025-12-05', 'WHO EMRO', 12000, 'decreasing', 'high', 'Disease Early Warning System', 'Cholera cases declining following emergency WASH interventions'),
      ('Measles Immunity Gap Analysis', 'Measles', 'South America', '2025-11-25', 'PAHO', 2300, 'increasing', 'high', 'National Immunization Programs', 'Measles susceptibility growing in 5-15 age cohort due to pandemic disruptions'),
      ('West Nile Virus Season Summary', 'West Nile Virus', 'North America', '2025-11-15', 'CDC Fort Collins', 890, 'decreasing', 'high', 'ArboNET Surveillance', 'WNV season winding down with total cases 30% above 10-year average'),
      ('Mpox Global Situation Report', 'Mpox', 'Global', '2025-12-01', 'WHO HQ Geneva', 340, 'stable', 'moderate', 'IHR Focal Point Reports', 'Low-level mpox transmission continuing in multiple regions'),
      ('Hepatitis A Cluster Investigation', 'Hepatitis A', 'Middle East', '2025-11-20', 'WHO EMRO', 780, 'decreasing', 'high', 'Outbreak Investigation Team', 'Hepatitis A cluster traced to contaminated imported produce'),
      ('Influenza B Lineage Report', 'Influenza B', 'East Asia', '2025-12-14', 'WHO CC Tokyo', 5600, 'increasing', 'high', 'Global Influenza Surveillance', 'Victoria lineage B predominating with good vaccine match'),
      ('Plague Surveillance Summary', 'Plague', 'East Africa', '2025-11-10', 'Institut Pasteur', 45, 'stable', 'moderate', 'Sentinel Surveillance Network', 'Seasonal plague cases within expected range in highland regions'),
      ('Leptospirosis Post-Flood Alert', 'Leptospirosis', 'Southeast Asia', '2025-12-03', 'DOH Philippines', 2100, 'increasing', 'moderate', 'Hospital-based Surveillance', 'Post-typhoon leptospirosis surge in flood-affected provinces'),
      ('Rotavirus Hospital Surveillance', 'Rotavirus', 'South Asia', '2025-11-28', 'ICDDR,B', 6700, 'stable', 'high', 'Hospital Sentinel Sites', 'Rotavirus remains leading cause of severe pediatric diarrhea')
    `);

    // Seed resource allocations (15+ items)
    await client.query(`
      INSERT INTO resource_allocations (resource_name, resource_type, allocated_to, region, quantity, unit, status, priority, cost, allocation_date, notes) VALUES
      ('N95 Respirator Masks', 'PPE', 'NYC Health + Hospitals', 'North America', 500000, 'units', 'delivered', 'high', 750000.00, '2025-10-20', 'Emergency stockpile deployment for flu season surge'),
      ('Tamiflu (Oseltamivir)', 'Antiviral', 'UK NHS Trusts', 'Europe', 200000, 'courses', 'in-transit', 'high', 3400000.00, '2025-11-15', 'Antiviral distribution for severe influenza treatment'),
      ('Oral Rehydration Salts', 'Medical Supply', 'Bangladesh MoH', 'South Asia', 2000000, 'packets', 'delivered', 'critical', 180000.00, '2025-07-25', 'Cholera outbreak emergency supply'),
      ('Rapid Diagnostic Test Kits', 'Diagnostic', 'WHO Africa Office', 'West Africa', 1000000, 'kits', 'allocated', 'high', 5600000.00, '2025-11-01', 'Malaria RDTs for community health workers'),
      ('Ventilators', 'Equipment', 'Mumbai Municipal Corp', 'South Asia', 350, 'units', 'delivered', 'critical', 8750000.00, '2025-06-15', 'ICU capacity expansion for dengue hemorrhagic cases'),
      ('Insecticide-Treated Bed Nets', 'Prevention', 'PMI Distribution', 'Sub-Saharan Africa', 5000000, 'nets', 'in-transit', 'high', 25000000.00, '2025-08-01', 'Mass distribution campaign ahead of rainy season'),
      ('Cold Chain Equipment', 'Storage', 'UNICEF Supply Division', 'Global', 500, 'units', 'allocated', 'moderate', 12000000.00, '2025-09-01', 'Solar-powered vaccine refrigerators for remote clinics'),
      ('PCR Testing Machines', 'Diagnostic', 'Thailand MoPH', 'Southeast Asia', 50, 'units', 'deployed', 'high', 2500000.00, '2025-11-20', 'H5N1 diagnostic capacity expansion'),
      ('Emergency Field Hospitals', 'Infrastructure', 'MSF Operations', 'Central Africa', 5, 'facilities', 'deployed', 'critical', 15000000.00, '2025-03-10', 'Ebola treatment center deployment'),
      ('Antibiotics (Doxycycline)', 'Pharmaceutical', 'Philippines DOH', 'Southeast Asia', 100000, 'courses', 'delivered', 'high', 450000.00, '2025-12-05', 'Leptospirosis treatment for flood-affected areas'),
      ('Chlorine Water Tablets', 'WASH', 'UNICEF Bangladesh', 'South Asia', 10000000, 'tablets', 'delivered', 'critical', 95000.00, '2025-07-30', 'Water purification for cholera prevention'),
      ('Mobile Lab Units', 'Diagnostic', 'CDC Rapid Response', 'Global', 8, 'units', 'standby', 'moderate', 4800000.00, '2025-01-15', 'Deployable BSL-3 laboratory capacity'),
      ('Isolation Gowns', 'PPE', 'Lagos State Hospitals', 'West Africa', 300000, 'units', 'in-transit', 'high', 420000.00, '2025-11-10', 'Healthcare worker protection for Lassa fever cases'),
      ('Oxygen Concentrators', 'Equipment', 'Ethiopia FMoH', 'East Africa', 200, 'units', 'allocated', 'critical', 1200000.00, '2025-05-25', 'Pneumonia and COVID treatment capacity'),
      ('Epidemiology Field Teams', 'Personnel', 'WHO GOARN', 'Global', 25, 'teams', 'deployed', 'high', 3750000.00, '2025-12-01', 'Rapid response teams for outbreak investigation'),
      ('Vaccine Transport Drones', 'Logistics', 'Zipline Rwanda', 'East Africa', 15, 'drones', 'operational', 'moderate', 900000.00, '2025-06-01', 'Last-mile vaccine delivery to remote health posts')
    `);

    // Seed public health alerts (15+ items)
    await client.query(`
      INSERT INTO public_health_alerts (alert_title, alert_type, severity, region, disease, issued_date, expiry_date, issued_by, status, message) VALUES
      ('Influenza Season Elevated Activity', 'seasonal', 'high', 'North America', 'Influenza A', '2025-12-01 08:00:00', '2026-03-31 23:59:59', 'CDC', 'active', 'Influenza activity has exceeded epidemic threshold in 38 states. Healthcare providers should prioritize vaccination and antiviral treatment for high-risk patients.'),
      ('COVID-19 New Variant Detection', 'emerging threat', 'high', 'Asia Pacific', 'COVID-19 XBB.3', '2025-09-25 10:00:00', '2026-01-31 23:59:59', 'WHO', 'active', 'Novel SARS-CoV-2 variant XBB.3 detected with mutations in receptor binding domain. Enhanced surveillance and genomic sequencing recommended.'),
      ('Dengue Epidemic Declaration', 'epidemic', 'critical', 'South Asia', 'Dengue', '2025-06-15 06:00:00', '2025-12-31 23:59:59', 'India MoHFW', 'active', 'National dengue epidemic declared. All states directed to activate emergency response plans and ensure adequate supplies of IV fluids and platelet concentrates.'),
      ('Ebola Outbreak - PHEIC', 'PHEIC', 'critical', 'Central Africa', 'Ebola', '2025-03-05 12:00:00', '2025-09-01 23:59:59', 'WHO Director-General', 'resolved', 'Public Health Emergency of International Concern declared for Ebola outbreak in DRC. IHR Emergency Committee recommendations in effect.'),
      ('Cholera Water Safety Advisory', 'advisory', 'high', 'South Asia', 'Cholera', '2025-07-20 14:00:00', '2025-12-31 23:59:59', 'Bangladesh DGHS', 'active', 'Unsafe water advisory for 12 districts following flooding. Boil all drinking water. ORS stations established at community health centers.'),
      ('H5N1 Zoonotic Transmission Warning', 'warning', 'high', 'Southeast Asia', 'Avian Influenza', '2025-11-20 09:00:00', '2026-03-31 23:59:59', 'WHO WPRO', 'active', 'Confirmed human cases of H5N1 linked to poultry exposure. Enhanced biosecurity measures required at live bird markets.'),
      ('Measles Outbreak School Alert', 'outbreak', 'moderate', 'South America', 'Measles', '2025-08-15 11:00:00', '2026-02-28 23:59:59', 'PAHO', 'active', 'Measles clusters identified in schools across 3 countries. Urgent catch-up vaccination recommended for children aged 1-15 with incomplete immunization.'),
      ('RSV Hospital Capacity Warning', 'capacity', 'high', 'Europe', 'RSV', '2025-10-20 07:00:00', '2026-02-28 23:59:59', 'ECDC', 'active', 'Pediatric ICU capacity reaching critical levels due to RSV surge. Hospitals advised to activate surge plans and consider elective procedure postponement.'),
      ('West Nile Virus Mosquito Season', 'seasonal', 'moderate', 'North America', 'West Nile Virus', '2025-06-01 08:00:00', '2025-11-30 23:59:59', 'CDC', 'resolved', 'West Nile virus season underway. Use EPA-registered insect repellents and eliminate standing water around homes.'),
      ('TB Drug Shortage Alert', 'supply chain', 'high', 'Global', 'Tuberculosis', '2025-11-01 10:00:00', '2026-06-30 23:59:59', 'Global Drug Facility', 'active', 'Global shortage of rifampicin-isoniazid fixed-dose combinations. Countries advised to implement conservation strategies and identify alternative suppliers.'),
      ('Mpox Travel Advisory', 'travel', 'low', 'Global', 'Mpox', '2025-09-05 12:00:00', '2026-03-31 23:59:59', 'WHO', 'active', 'Travelers to affected regions advised to avoid close contact with symptomatic individuals. Pre-travel vaccination recommended for high-risk groups.'),
      ('Plague Seasonal Advisory', 'seasonal', 'moderate', 'East Africa', 'Plague', '2025-09-01 08:00:00', '2026-01-31 23:59:59', 'Madagascar MoPH', 'active', 'Annual plague season advisory. Community awareness campaigns active. Health facilities stocked with antibiotics for early treatment.'),
      ('Hepatitis A Food Safety Alert', 'food safety', 'moderate', 'Middle East', 'Hepatitis A', '2025-05-10 09:00:00', '2025-10-31 23:59:59', 'WHO EMRO', 'resolved', 'Hepatitis A cases linked to imported frozen berries. Product recall initiated. Vaccination recommended for food handlers.'),
      ('Leptospirosis Flood Warning', 'natural disaster', 'high', 'Southeast Asia', 'Leptospirosis', '2025-11-28 06:00:00', '2026-02-28 23:59:59', 'Philippines DOH', 'active', 'Post-typhoon leptospirosis risk elevated. Avoid wading in floodwaters. Prophylactic doxycycline available at local health units.'),
      ('Polio Detection - Environmental', 'surveillance', 'high', 'South Asia', 'Polio', '2025-10-15 10:00:00', '2026-04-30 23:59:59', 'GPEI', 'active', 'Vaccine-derived poliovirus type 2 detected in environmental samples. Supplementary immunization activities to commence immediately.'),
      ('Antimicrobial Resistance Alert', 'AMR', 'high', 'Global', NULL, '2025-11-18 08:00:00', '2026-11-18 23:59:59', 'WHO AMR Division', 'active', 'New carbapenem-resistant Enterobacterales clone detected in 15 countries. Enhanced infection prevention and antimicrobial stewardship urgently needed.')
    `);

    // Seed epidemiological data (15+ items)
    await client.query(`
      INSERT INTO epidemiological_data (disease, region, year, week_number, cases, deaths, recovery_rate, transmission_rate, age_group, data_source) VALUES
      ('Influenza A', 'North America', 2025, 48, 12500, 89, 98.50, 1.80, 'all ages', 'CDC ILINet'),
      ('Influenza A', 'North America', 2025, 47, 10200, 72, 98.60, 1.75, 'all ages', 'CDC ILINet'),
      ('Influenza A', 'North America', 2025, 46, 8100, 55, 98.70, 1.65, 'all ages', 'CDC ILINet'),
      ('COVID-19', 'Asia Pacific', 2025, 48, 45000, 230, 97.80, 2.10, 'all ages', 'WHO Dashboard'),
      ('COVID-19', 'Europe', 2025, 48, 32000, 156, 98.10, 1.90, 'all ages', 'ECDC TESSy'),
      ('Dengue', 'South Asia', 2025, 44, 15000, 210, 96.50, 2.50, '15-45', 'National IDSP'),
      ('Dengue', 'Southeast Asia', 2025, 44, 12000, 145, 96.80, 2.30, '10-40', 'WHO DengueNet'),
      ('Malaria', 'West Africa', 2025, 40, 89000, 3400, 92.00, 3.20, 'under 5', 'WHO GMP'),
      ('Malaria', 'East Africa', 2025, 40, 45000, 1800, 93.50, 2.80, 'under 5', 'WHO GMP'),
      ('Cholera', 'South Asia', 2025, 36, 5600, 112, 94.00, 2.90, 'all ages', 'WHO GTFCC'),
      ('Measles', 'South America', 2025, 42, 1200, 4, 99.20, 15.00, '1-15', 'PAHO ISIS'),
      ('RSV', 'Europe', 2025, 48, 8900, 67, 97.50, 2.40, 'under 2', 'ECDC Resp Surveillance'),
      ('Tuberculosis', 'South Asia', 2025, 48, 22000, 1400, 85.00, 1.10, '25-55', 'WHO GTB'),
      ('Ebola', 'Central Africa', 2025, 20, 45, 19, 55.00, 1.80, 'all ages', 'WHO Ebola Dashboard'),
      ('H5N1', 'Southeast Asia', 2025, 47, 8, 3, 62.50, 0.30, 'adults', 'FAO EMPRES'),
      ('West Nile Virus', 'North America', 2025, 35, 230, 12, 94.00, 0.80, 'over 50', 'CDC ArboNET'),
      ('Mpox', 'Global', 2025, 48, 120, 1, 99.20, 0.70, '25-45', 'WHO MPOX Dashboard')
    `);

    // Seed vaccine inventory (15+ items)
    await client.query(`
      INSERT INTO vaccine_inventory (vaccine_name, manufacturer, batch_number, quantity, storage_location, storage_temp, manufacture_date, expiry_date, status, unit_cost, notes) VALUES
      ('Fluzone Quadrivalent', 'Sanofi Pasteur', 'FLU-2025-A4821', 2500000, 'CDC Strategic National Stockpile', '2-8°C', '2025-07-15', '2026-07-14', 'available', 22.50, 'Standard dose for adults 18-64'),
      ('Fluzone High-Dose', 'Sanofi Pasteur', 'FLU-HD-2025-B991', 800000, 'McKesson Distribution Hub', '2-8°C', '2025-07-20', '2026-07-19', 'available', 68.00, 'High-dose formulation for adults 65+'),
      ('Comirnaty XBB.3 Booster', 'Pfizer-BioNTech', 'COV-XBB-25-C334', 15000000, 'WHO COVAX Facility', '-25 to -15°C', '2025-08-01', '2026-02-01', 'available', 26.00, 'Updated mRNA booster targeting XBB.3 variant'),
      ('Spikevax Bivalent', 'Moderna', 'MOD-BIV-25-D127', 8000000, 'EU Joint Procurement Stock', '-25 to -15°C', '2025-08-15', '2026-02-15', 'available', 25.50, 'Bivalent COVID booster for European distribution'),
      ('RTS,S/AS01 (Mosquirix)', 'GSK', 'MAL-RTS-25-E556', 5000000, 'UNICEF Supply Hub Accra', '2-8°C', '2025-04-01', '2027-03-31', 'available', 9.30, 'Malaria vaccine for children 5-17 months'),
      ('Dengvaxia', 'Sanofi Pasteur', 'DEN-25-F882', 3000000, 'Philippine DOH Central', '2-8°C', '2025-03-15', '2027-03-14', 'available', 45.00, 'Dengue vaccine for seropositive individuals 9-45'),
      ('MMR II', 'Merck', 'MMR-25-G441', 4500000, 'PAHO Revolving Fund', '2-8°C', '2025-05-01', '2027-04-30', 'available', 18.75, 'Measles-Mumps-Rubella combination vaccine'),
      ('rVSV-ZEBOV (Ervebo)', 'Merck', 'EBO-25-H223', 500000, 'WHO Emergency Stockpile', '-80 to -60°C', '2025-02-01', '2027-01-31', 'reserved', 110.00, 'Ebola vaccine reserved for ring vaccination strategy'),
      ('Prevnar 20 (PCV20)', 'Pfizer', 'PCV-25-I667', 6000000, 'US Federal Supply Schedule', '2-8°C', '2025-06-01', '2027-05-31', 'available', 245.00, 'Pneumococcal conjugate vaccine for adults'),
      ('bOPV', 'Bio Farma', 'POL-25-J998', 120000000, 'UNICEF Supply Division', '2-8°C', '2025-01-15', '2027-01-14', 'available', 0.14, 'Bivalent oral polio vaccine for supplementary immunization'),
      ('Nirsevimab (Beyfortus)', 'AstraZeneca/Sanofi', 'RSV-NI-25-K445', 2000000, 'EU Strategic Reserve', '2-8°C', '2025-07-01', '2027-06-30', 'available', 395.00, 'RSV monoclonal antibody for infant protection'),
      ('Gardasil 9', 'Merck', 'HPV-25-L112', 8000000, 'Gavi Alliance Pool', '2-8°C', '2025-03-01', '2028-02-29', 'available', 4.50, 'HPV vaccine at Gavi negotiated pricing'),
      ('Typbar-TCV', 'Bharat Biotech', 'TYP-25-M778', 10000000, 'WHO Prequalified Stock', '2-8°C', '2025-04-15', '2028-04-14', 'available', 1.50, 'Typhoid conjugate vaccine for endemic settings'),
      ('YF-17D', 'Institut Pasteur Dakar', 'YF-25-N334', 15000000, 'ICG Emergency Stock', '2-8°C', '2025-01-01', '2027-12-31', 'available', 1.20, 'Yellow fever vaccine for emergency response'),
      ('SA 14-14-2', 'Chengdu Institute', 'JE-25-O556', 6000000, 'PATH JE Vaccine Stock', '2-8°C', '2025-03-20', '2028-03-19', 'available', 0.67, 'Japanese encephalitis live attenuated vaccine'),
      ('BCG Vaccine', 'Serum Institute India', 'BCG-25-P889', 50000000, 'UNICEF Global Pool', '2-8°C', '2025-02-01', '2027-01-31', 'available', 0.08, 'Bacillus Calmette-Guérin vaccine for TB prevention')
    `);

    // Seed healthcare facilities (15+ items)
    await client.query(`
      INSERT INTO healthcare_facilities (facility_name, facility_type, region, address, capacity, current_occupancy, icu_beds, ventilators, staff_count, contact_number, status) VALUES
      ('Bellevue Hospital Center', 'tertiary hospital', 'North America', '462 First Avenue, New York, NY 10016', 844, 712, 120, 85, 3200, '+1-212-562-4141', 'operational'),
      ('Royal London Hospital', 'tertiary hospital', 'Europe', 'Whitechapel Road, London E1 1FR, UK', 750, 623, 95, 70, 2800, '+44-20-7377-7000', 'operational'),
      ('AIIMS New Delhi', 'teaching hospital', 'South Asia', 'Sri Aurobindo Marg, Ansari Nagar, New Delhi 110029', 2500, 2150, 200, 150, 8500, '+91-11-2658-8500', 'operational'),
      ('Lagos University Teaching Hospital', 'teaching hospital', 'West Africa', 'Idi-Araba, Surulere, Lagos, Nigeria', 761, 698, 30, 15, 2100, '+234-1-585-0591', 'strained'),
      ('Dhaka Medical College Hospital', 'tertiary hospital', 'South Asia', 'Secretariat Road, Dhaka 1000, Bangladesh', 2600, 2890, 45, 20, 3500, '+880-2-955-0851', 'over-capacity'),
      ('Hôpital Necker-Enfants Malades', 'pediatric hospital', 'Europe', '149 Rue de Sèvres, 75015 Paris, France', 450, 389, 60, 40, 1800, '+33-1-44-49-40-00', 'operational'),
      ('Tokyo Metropolitan Hospital', 'general hospital', 'East Asia', '3-18-22 Honkomagome, Bunkyo-ku, Tokyo', 800, 680, 80, 65, 2400, '+81-3-3941-3211', 'operational'),
      ('MSF Field Hospital - Goma', 'field hospital', 'Central Africa', 'Ndosho District, Goma, North Kivu, DRC', 150, 142, 8, 4, 120, 'MSF-OCA-Radio', 'strained'),
      ('Hospital das Clínicas - USP', 'teaching hospital', 'South America', 'Av. Dr. Enéas Carvalho de Aguiar, São Paulo', 2200, 1850, 180, 130, 7500, '+55-11-2661-0000', 'operational'),
      ('Cho Ray Hospital', 'tertiary hospital', 'Southeast Asia', '201B Nguyen Chi Thanh, District 5, HCMC', 1800, 1650, 90, 55, 4200, '+84-28-3855-4137', 'operational'),
      ('Kenyatta National Hospital', 'national referral', 'East Africa', 'Hospital Road, Upper Hill, Nairobi, Kenya', 1800, 1620, 50, 25, 5000, '+254-20-272-6300', 'operational'),
      ('Karolinska University Hospital', 'teaching hospital', 'Europe', 'Eugeniavägen 3, 171 76 Solna, Sweden', 1340, 890, 150, 120, 4800, '+46-8-517-700-00', 'operational'),
      ('CDC Emergency Operations Center', 'operations center', 'North America', '1600 Clifton Rd, Atlanta, GA 30329', 0, 0, 0, 0, 450, '+1-770-488-7100', 'operational'),
      ('Suva Colonial War Memorial Hospital', 'general hospital', 'Oceania', 'Extension Street, Suva, Fiji', 300, 245, 12, 6, 420, '+679-331-3444', 'operational'),
      ('Rafik Hariri University Hospital', 'university hospital', 'Middle East', 'Bir Hassan, Beirut, Lebanon', 400, 380, 35, 20, 950, '+961-1-830-000', 'strained'),
      ('Institut Pasteur de Dakar', 'research institute', 'West Africa', '36 Avenue Pasteur, BP 220, Dakar, Senegal', 50, 20, 5, 2, 350, '+221-33-839-9200', 'operational')
    `);

    console.log('✅ Database seeded with all data successfully');
  } finally {
    client.release();
  }
}

export default pool;
