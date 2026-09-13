"""
Bhoomi Sanket — Showcase Dataset Generator
Generates ~270 projects across 17 Indian states (78 districts) for presentation:
- Tier A: 6 ML-supported states (43 districts) evaluated with XGBoost model
- Tier B: 11 GIS-extended states (35 districts) with assessment_json = None (Assessment Unavailable)
"""

import os
import sys
import json
import random
from datetime import datetime, timedelta

# Add ml_service to path
ml_service_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ml_service")
sys.path.insert(0, ml_service_dir)

from predictor import MLPredictor
from schemas import PredictionRequest, PredictionFeatures

random.seed(42)

# Geographic catalog
ML_STATES = [
    {
        "code": "GJ",
        "name": "Gujarat",
        "districts": ["Ahmedabad", "Bharuch", "Gandhinagar", "Kutch", "Rajkot", "Surat", "Vadodara"],
    },
    {
        "code": "KA",
        "name": "Karnataka",
        "districts": ["Ballari", "Belagavi", "Bengaluru Urban", "Dharwad", "Mangaluru", "Mysuru", "Tumakuru"],
    },
    {
        "code": "MH",
        "name": "Maharashtra",
        "districts": ["Aurangabad", "Nagpur", "Nashik", "Pune", "Raigad", "Thane"],
    },
    {
        "code": "OD",
        "name": "Odisha",
        "districts": ["Angul", "Balasore", "Cuttack", "Ganjam", "Jajpur", "Khordha", "Puri", "Sambalpur", "Sundargarh"],
    },
    {
        "code": "TN",
        "name": "Tamil Nadu",
        "districts": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Tiruvallur"],
    },
    {
        "code": "UP",
        "name": "Uttar Pradesh",
        "districts": ["Agra", "Gautam Buddha Nagar", "Kanpur Nagar", "Lucknow", "Meerut", "Prayagraj", "Varanasi"],
    },
]

GIS_STATES = [
    {
        "code": "RJ",
        "name": "Rajasthan",
        "districts": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
    },
    {
        "code": "MP",
        "name": "Madhya Pradesh",
        "districts": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
    },
    {
        "code": "TG",
        "name": "Telangana",
        "districts": ["Hyderabad", "Warangal", "Rangareddy", "Karimnagar"],
    },
    {
        "code": "AP",
        "name": "Andhra Pradesh",
        "districts": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati"],
    },
    {
        "code": "KL",
        "name": "Kerala",
        "districts": ["Thiruvananthapuram", "Ernakulam", "Kozhikode", "Thrissur"],
    },
    {
        "code": "WB",
        "name": "West Bengal",
        "districts": ["Kolkata", "Howrah", "Darjeeling", "Paschim Medinipur"],
    },
    {
        "code": "BR",
        "name": "Bihar",
        "districts": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur"],
    },
    {
        "code": "PB",
        "name": "Punjab",
        "districts": ["Ludhiana", "Amritsar", "Jalandhar"],
    },
    {
        "code": "HR",
        "name": "Haryana",
        "districts": ["Gurugram", "Faridabad", "Panipat"],
    },
    {
        "code": "AS",
        "name": "Assam",
        "districts": ["Kamrup Metro", "Dibrugarh", "Silchar"],
    },
    {
        "code": "DL",
        "name": "Delhi",
        "districts": ["New Delhi", "South Delhi"],
    },
]

PROJECT_TEMPLATES = [
    ("{district} Industrial Corridor & Multi-Modal Logistics Hub", "industrial", "MIDC / KIADB / RIICO"),
    ("{district} Outer Ring Expressway Section", "highway", "NHAI"),
    ("{district} High-Speed Suburban Rail Link", "railway", "Ministry of Railways"),
    ("{district} Green Energy & Solar Park Infrastructure", "power", "SECI / State Solar Corp"),
    ("{district} Water Transmission & Irrigation Feeder Canal", "irrigation", "Water Resources Dept"),
    ("{district} Smart Urban Expansion & IT Park Zone", "urban", "State Urban Development Authority"),
    ("{district}-Peripheral Bypass Highway Package", "highway", "NHAI"),
    ("{district} Multi-Modal Freight Terminal & Rail Siding", "railway", "Dedicated Freight Corridor (DFCCIL)"),
]

STAGES = ["SIA", "SECTION_11", "SECTION_19", "AWARD", "POSSESSION", "RR", "CLOSED"]

def generate():
    predictor = MLPredictor()
    predictor.load_artifacts()

    all_states = []
    all_districts = []
    all_projects = []
    all_cases = []

    district_id_counter = 1
    project_id_counter = 100
    case_id_counter = 1000

    # 1. Process States & Districts
    # First ML states
    for s in ML_STATES:
        all_states.append({"state_code": s["code"], "state_name": s["name"]})
        for d in s["districts"]:
            all_districts.append({
                "id": district_id_counter,
                "district_name": d,
                "state_code": s["code"],
                "state_name": s["name"],
                "is_ml_supported": True,
            })
            district_id_counter += 1

    # Then GIS-extended states
    for s in GIS_STATES:
        all_states.append({"state_code": s["code"], "state_name": s["name"]})
        for d in s["districts"]:
            all_districts.append({
                "id": district_id_counter,
                "district_name": d,
                "state_code": s["code"],
                "state_name": s["name"],
                "is_ml_supported": False,
            })
            district_id_counter += 1

    # 2. Generate Projects
    for dist in all_districts:
        is_ml = dist["is_ml_supported"]
        # In ML districts: 4 to 5 projects (target ~185)
        # In GIS districts: 2 to 3 projects (target ~85)
        count = random.randint(4, 5) if is_ml else random.randint(2, 3)

        sampled_templates = random.sample(PROJECT_TEMPLATES, min(count, len(PROJECT_TEMPLATES)))

        for t_idx, (name_tmpl, p_type, agency) in enumerate(sampled_templates):
            project_id_counter += 1
            prj_id = f"PRJ-{dist['state_code']}-{project_id_counter}"
            prj_name = name_tmpl.format(district=dist["district_name"])
            funding = random.choice(["government", "PPP", "government", "private"])
            land_area = round(random.uniform(45.0, 850.0), 2)
            families = random.randint(40, 1800)
            budget = round(random.uniform(120.0, 4200.0), 2)
            
            # Start date between 2022 and 2024
            start_year = random.choice([2022, 2023, 2024])
            start_month = random.randint(1, 12)
            start_day = random.randint(1, 28)
            start_date_str = f"{start_year:04d}-{start_month:02d}-{start_day:02d}"

            desc = f"Strategic infrastructure initiative in {dist['district_name']} ({dist['state_name']}). Acquisition package encompassing {land_area} ha across key revenue blocks. [Showcase Dataset: synthetic_showcase]"

            all_projects.append({
                "id": prj_id,
                "project_name": prj_name,
                "project_type": p_type,
                "funding_model": funding,
                "implementing_agency": agency,
                "district_id": dist["id"],
                "district_name": dist["district_name"],
                "state_code": dist["state_code"],
                "state_name": dist["state_name"],
                "land_area_ha": land_area,
                "num_affected_families": families,
                "budget_crore": budget,
                "project_start_date": start_date_str,
                "description": desc,
                "is_demo_data": True,
            })

            # Cases for this project (1 to 3 cases)
            case_count = random.randint(1, 3) if is_ml else random.randint(1, 2)
            for c_idx in range(case_count):
                case_id_counter += 1
                case_id = f"CASE-{prj_id}-{c_idx+1:02d}"
                pkg_num = f"PKG-{c_idx+1:02d}"
                pkg_title = f"{prj_name} - Section {chr(65+c_idx)} (Chainage KM {c_idx*25} to {(c_idx+1)*25})"

                # Stage
                stage = random.choice(["SIA", "SECTION_11", "SECTION_19", "AWARD", "POSSESSION", "RR"])
                entry_date = datetime.now() - timedelta(days=random.randint(15, 380))
                entry_date_str = entry_date.strftime("%Y-%m-%d")
                
                # Statutory / benchmark deadlines
                statutory_deadline = (entry_date + timedelta(days=365)).strftime("%Y-%m-%d") if stage in ["SECTION_11", "SECTION_19"] else None
                benchmark_deadline = (entry_date + timedelta(days=180)).strftime("%Y-%m-%d") if stage in ["SIA", "AWARD", "POSSESSION"] else None

                # Workflow parameters
                sia_started = stage != "SIA" or random.choice([True, False])
                public_hearing = stage not in ["SIA"] or random.choice([True, False])
                objections = random.randint(0, 25)
                legal_cases = random.randint(0, 6) if random.random() < 0.4 else 0
                court_stay = legal_cases > 2 and random.choice([True, False])
                avg_dispute_age = random.randint(30, 450) if legal_cases > 0 else 0
                
                comp_awarded = round(budget * random.uniform(0.15, 0.45), 2) if stage in ["AWARD", "POSSESSION", "RR", "CLOSED"] else None
                comp_disbursed = round(comp_awarded * random.uniform(0.1, 0.95), 2) if comp_awarded else 0.0
                comp_disputes = random.randint(0, 15) if comp_awarded else 0
                max_pending_days = random.randint(15, 240) if comp_disputes > 0 else 0

                rr_plan = stage in ["RR", "POSSESSION", "CLOSED"] or (stage == "AWARD" and random.choice([True, False]))
                families_resettled = int(families * random.uniform(0.1, 0.8)) if rr_plan else 0
                clear_title = round(random.uniform(65.0, 98.0), 2)
                forest_land = random.random() < 0.25
                tribal_area = random.random() < 0.20
                stakeholder_meetings = random.randint(1, 14)

                assessment_json_str = None

                # ML INFERENCE ONLY FOR TIER A (ML SUPPORTED)
                if is_ml:
                    days_at_stage = (datetime.now() - entry_date).days
                    stage_ratio = round(min(2.5, days_at_stage / 180.0), 2)
                    disburse_ratio = round(comp_disbursed / comp_awarded, 2) if (comp_awarded and comp_awarded > 0) else -1
                    resettle_ratio = round(families_resettled / families, 2) if (families and families > 0 and rr_plan) else -1

                    b_bucket = "large" if budget > 1000 else ("medium" if budget > 300 else "small")

                    features = PredictionFeatures(
                        project_type=p_type,
                        funding_model=funding,
                        land_area_ha=land_area,
                        num_affected_families=families,
                        budget_crore_bucket=b_bucket,
                        state_code=dist["state_code"],
                        district_id=dist["id"],
                        current_stage=stage,
                        days_at_current_stage=days_at_stage,
                        stage_deadline_ratio=stage_ratio,
                        milestone_completion_rate=0.5,
                        legal_cases_pending=legal_cases,
                        court_stay_active=1 if court_stay else 0,
                        avg_dispute_age_days=float(avg_dispute_age),
                        comp_disbursement_ratio=float(disburse_ratio),
                        comp_disputes_pending=comp_disputes,
                        max_pending_days_comp=max_pending_days,
                        rr_plan_approved=1 if rr_plan else 0,
                        resettlement_ratio=float(resettle_ratio),
                        clear_title_percent=clear_title,
                        forest_land_involved=1 if forest_land else 0,
                        tribal_area=1 if tribal_area else 0,
                        district_historical_delay_rate=0.35,
                        public_hearing_held=1 if public_hearing else 0,
                        objections_filed_count=objections,
                        stakeholder_meetings_count=stakeholder_meetings,
                    )

                    req = PredictionRequest(
                        case_id=case_id,
                        schema_version="v1",
                        trigger="BATCH_REFRESH",
                        requested_at=datetime.now().isoformat(),
                        features=features,
                    )

                    # Predict with unchanged XGBoost model
                    pred_res = predictor.predict(req)
                    assessment_json_str = pred_res.model_dump_json()

                all_cases.append({
                    "id": case_id,
                    "project_id": prj_id,
                    "case_number": pkg_num,
                    "case_title": pkg_title,
                    "current_stage": stage,
                    "stage_entry_date": entry_date_str,
                    "statutory_deadline_date": statutory_deadline,
                    "benchmark_deadline_date": benchmark_deadline,
                    "sia_started": sia_started,
                    "public_hearing_held": public_hearing,
                    "objections_filed_count": objections,
                    "legal_cases_pending": legal_cases,
                    "court_stay_active": court_stay,
                    "avg_dispute_age_days": avg_dispute_age,
                    "comp_awarded_crore": comp_awarded,
                    "comp_disbursed_crore": comp_disbursed,
                    "comp_disputes_pending": comp_disputes,
                    "max_pending_days_comp": max_pending_days,
                    "rr_plan_approved": rr_plan,
                    "families_resettled": families_resettled,
                    "clear_title_percent": clear_title,
                    "forest_land_involved": forest_land,
                    "tribal_area": tribal_area,
                    "stakeholder_meetings_count": stakeholder_meetings,
                    "overall_status": "ACTIVE",
                    "assessment_json": assessment_json_str,
                })

    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "showcase_dataset.json")
    dataset = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "provenance": "synthetic_showcase",
            "total_states": len(all_states),
            "total_districts": len(all_districts),
            "ml_districts": len([d for d in all_districts if d["is_ml_supported"]]),
            "gis_districts": len([d for d in all_districts if not d["is_ml_supported"]]),
            "total_projects": len(all_projects),
            "ml_projects": len([p for p in all_projects if any(d["id"] == p["district_id"] and d["is_ml_supported"] for d in all_districts)]),
            "gis_projects": len([p for p in all_projects if any(d["id"] == p["district_id"] and not d["is_ml_supported"] for d in all_districts)]),
            "total_cases": len(all_cases),
            "ml_assessed_cases": len([c for c in all_cases if c["assessment_json"] is not None]),
            "unassessed_cases": len([c for c in all_cases if c["assessment_json"] is None]),
        },
        "states": all_states,
        "districts": all_districts,
        "projects": all_projects,
        "cases": all_cases,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)

    print("Showcase dataset generated successfully!")
    print(json.dumps(dataset["metadata"], indent=2))

if __name__ == "__main__":
    generate()
