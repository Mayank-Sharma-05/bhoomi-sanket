-- ═══════════════════════════════════════════════════════════════
-- BHOOMI SANKET — DEMO SEED DATA (Synthetic Dataset)
-- All entries explicitly flagged with is_demo_data = TRUE
-- ═══════════════════════════════════════════════════════════════

-- Reference States
INSERT INTO states (state_code, state_name) VALUES
  ('UP', 'Uttar Pradesh'),
  ('MH', 'Maharashtra'),
  ('KA', 'Karnataka')
ON CONFLICT (state_code) DO NOTHING;

-- Reference Districts
INSERT INTO districts (id, district_name, state_code) VALUES
  (101, 'Agra', 'UP'),
  (102, 'Lucknow', 'UP'),
  (103, 'Varanasi', 'UP'),
  (201, 'Pune', 'MH'),
  (202, 'Nagpur', 'MH'),
  (301, 'Bengaluru Rural', 'KA')
ON CONFLICT (district_name, state_code) DO NOTHING;

-- Sample Infrastructure Projects (Multi-Case)
INSERT INTO projects (
  id, project_name, project_type, funding_model, implementing_agency,
  district_id, state_code, land_area_ha, num_affected_families, budget_crore,
  project_start_date, description, is_demo_data
) VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    'Agra-Gwalior High-Speed Expressway Extension',
    'highway', 'government', 'NHAI',
    101, 'UP', 450.50, 1240, 1850.00,
    '2024-03-01', 'Four-lane Greenfield expressway section traversing 18 revenue villages.', TRUE
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    'Lucknow Outer Ring Road Phase II',
    'highway', 'PPP', 'State PWD',
    102, 'UP', 280.00, 890, 920.00,
    '2023-11-15', 'Peripheral arterial bypass relieving transit congestion.', TRUE
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    'Pune Industrial Corridor & Freight Terminal',
    'industrial', 'government', 'MIDC',
    201, 'MH', 620.00, 1450, 2400.00,
    '2024-01-10', 'Industrial smart city zone and multi-modal logistics hub.', TRUE
  ),
  (
    'a4444444-4444-4444-4444-444444444444',
    'Nagpur-Nagbhid Gauge Conversion Rail Link',
    'railway', 'government', 'Ministry of Railways',
    202, 'MH', 195.40, 420, 560.00,
    '2023-08-01', 'Broad-gauge freight route upgrade.', TRUE
  ),
  (
    'a5555555-5555-5555-5555-555555555555',
    'Bengaluru Aerospace Park & SEZ Acquisition',
    'industrial', 'private', 'KIADB',
    301, 'KA', 340.00, 680, 1420.00,
    '2024-04-12', 'Aviation manufacturing zone near Devanahalli.', TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- Multi-Case Acquisition Packages (1:many relation)
INSERT INTO acquisition_cases (
  id, project_id, case_number, case_title, current_stage, stage_entry_date,
  statutory_deadline_date, benchmark_deadline_date, sia_started, public_hearing_held,
  legal_cases_pending, court_stay_active, comp_awarded_crore, comp_disbursed_crore,
  comp_disputes_pending, max_pending_days_comp, rr_plan_approved, families_resettled,
  clear_title_percent, forest_land_involved, tribal_area, stakeholder_meetings_count,
  overall_status
) VALUES
  -- Project 1, Case 1 (High Risk due to litigation & compensation disputes)
  (
    'c1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'PKG-01', 'Section A: KM 0 to KM 25',
    'AWARD', '2024-04-15',
    '2025-04-15', '2024-07-14',
    TRUE, TRUE,
    4, TRUE, 140.00, 24.50,
    18, 160, FALSE, 45,
    62.50, FALSE, FALSE, 6,
    'ACTIVE'
  ),
  -- Project 1, Case 2 (On Track)
  (
    'c1111111-1111-1111-1111-111111111112',
    'a1111111-1111-1111-1111-111111111111',
    'PKG-02', 'Section B: KM 25 to KM 52',
    'SECTION_19', '2024-08-01',
    '2025-08-01', NULL,
    TRUE, TRUE,
    0, FALSE, NULL, 0.00,
    0, 0, FALSE, 0,
    94.00, FALSE, FALSE, 4,
    'ACTIVE'
  ),
  -- Project 2, Case 1 (Critical delay: prolonged compensation standstill)
  (
    'c2222222-2222-2222-2222-222222222221',
    'a2222222-2222-2222-2222-222222222222',
    'PHASE-01', 'Bypass Western Sector',
    'AWARD', '2023-12-10',
    '2024-12-10', '2024-03-10',
    TRUE, TRUE,
    5, FALSE, 95.00, 12.00,
    34, 210, FALSE, 80,
    48.00, TRUE, FALSE, 8,
    'ACTIVE'
  ),
  -- Project 3, Case 1 (Medium Risk: Environmental clearance pending)
  (
    'c3333333-3333-3333-3333-333333333331',
    'a3333333-3333-3333-3333-333333333333',
    'HUB-01', 'Logistics Terminal Core Land',
    'SECTION_11', '2024-06-01',
    '2025-06-01', NULL,
    TRUE, FALSE,
    1, FALSE, NULL, 0.00,
    2, 0, FALSE, 0,
    78.00, TRUE, TRUE, 3,
    'ACTIVE'
  ),
  -- Project 4, Case 1 (Low Risk: On schedule)
  (
    'c4444444-4444-4444-4444-444444444441',
    'a4444444-4444-4444-4444-444444444444',
    'RAIL-PKG-1', 'Nagpur Rural Junction parcels',
    'SECTION_19', '2024-07-15',
    '2025-07-15', NULL,
    TRUE, TRUE,
    0, FALSE, NULL, 0.00,
    0, 0, FALSE, 0,
    98.50, FALSE, FALSE, 5,
    'ACTIVE'
  )
ON CONFLICT (id) DO NOTHING;

-- Synthetic Risk Assessment Records (Baseline snapshot)
INSERT INTO risk_assessments (
  id, case_id, assessed_at, model_version, schema_version, trigger_event,
  risk_probability, risk_level, confidence, prediction_quality,
  base_probability, top_factors, recommendations
) VALUES
  (
    'r1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    now() - INTERVAL '1 day',
    'stub_v0', 'v1', 'BATCH_REFRESH',
    0.78, 'HIGH', 'HIGH', 'STUB',
    0.32,
    '[
      {"feature": "court_stay_active", "value": 1, "shap_value": 0.28, "label": "Active court stay order restraining possession", "direction": "INCREASES_RISK"},
      {"feature": "comp_disbursement_ratio", "value": 0.175, "shap_value": 0.22, "label": "Only 17.5% compensation disbursed despite award declaration", "direction": "INCREASES_RISK"},
      {"feature": "max_pending_days_comp", "value": 160, "shap_value": 0.16, "label": "Compensation disbursement pending for 160 days", "direction": "INCREASES_RISK"},
      {"feature": "clear_title_percent", "value": 62.5, "shap_value": 0.11, "label": "37.5% parcels have disputed ownership titles", "direction": "INCREASES_RISK"}
    ]'::jsonb,
    '[
      {"priority": 1, "category": "LEGAL", "action": "File Stay Vacation Application", "detail": "Instruct Government Pleader to file urgent petition for vacating high court stay.", "driven_by_feature": "court_stay_active"},
      {"priority": 2, "category": "COMPENSATION", "action": "Treasury Payment Clearance", "detail": "Reconcile escrow funds with District Treasury to accelerate delayed award payments.", "driven_by_feature": "comp_disbursement_ratio"}
    ]'::jsonb
  ),
  (
    'r2222222-2222-2222-2222-222222222221',
    'c2222222-2222-2222-2222-222222222221',
    now() - INTERVAL '1 day',
    'stub_v0', 'v1', 'BATCH_REFRESH',
    0.86, 'CRITICAL', 'HIGH', 'STUB',
    0.32,
    '[
      {"feature": "max_pending_days_comp", "value": 210, "shap_value": 0.32, "label": "Compensation delayed over 210 days", "direction": "INCREASES_RISK"},
      {"feature": "legal_cases_pending", "value": 5, "shap_value": 0.24, "label": "5 ongoing litigation disputes before district court", "direction": "INCREASES_RISK"},
      {"feature": "clear_title_percent", "value": 48.0, "shap_value": 0.18, "label": "More than half of acquisition parcels possess contested titles", "direction": "INCREASES_RISK"}
    ]'::jsonb,
    '[
      {"priority": 1, "category": "ADMINISTRATIVE", "action": "Establish Special Lok Adalat", "detail": "Convene mediation camp for consensual compensation settlement of valuation disputes.", "driven_by_feature": "legal_cases_pending"}
    ]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Initial Alerts
INSERT INTO alerts (
  id, case_id, alert_type, severity, title, message, created_at
) VALUES
  (
    'b1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'COURT_STAY', 'HIGH',
    'Court Stay Activated on Section A',
    'Stay order reported in Writ Petition 4821/2024 at High Court. Possession proceedings halted.',
    now() - INTERVAL '3 hours'
  ),
  (
    'b2222222-2222-2222-2222-222222222221',
    'c2222222-2222-2222-2222-222222222221',
    'RISK_ESCALATION', 'CRITICAL',
    'Risk Tier Escalated to CRITICAL',
    'Bypass Western Sector escalated to CRITICAL risk (86%) due to prolonged 210-day compensation stagnation.',
    now() - INTERVAL '6 hours'
  )
ON CONFLICT (id) DO NOTHING;
