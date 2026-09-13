# Bhoomi Sanket — Local Setup & Development Runbook

### Prerequisites
- Node.js 18.x or 20.x+
- Python 3.10+
- (Optional) PostgreSQL 15+ with PostGIS extension

---

## 1. Running the Next.js Frontend Application

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 2. Running the FastAPI ML Inference Service

```bash
# 1. Navigate to ML service directory
cd ml_service

# 2. Install requirements
pip install -r requirements.txt

# 3. Run unit tests
python test_service.py

# 4. Start the inference service
python main.py
```

The ML service will be accessible at [http://localhost:8000](http://localhost:8000).  
Interactive OpenAPI documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 3. Database Setup (Optional for Supabase Cloud)

If using a local or cloud PostgreSQL instance:
1. Connect via `psql` or Supabase SQL Editor.
2. Run `database/schema.sql` to initialize tables, extensions, views, and RLS policies.
3. Run `database/seeds/demo_seed.sql` to populate realistic synthetic benchmark data.
