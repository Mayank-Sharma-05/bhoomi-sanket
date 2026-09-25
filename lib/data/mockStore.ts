/**
 * Bhoomi Sanket — Data Store & Database Layer
 * Backed DIRECTLY by Supabase PostgreSQL (Prisma removed).
 * Real records are persisted directly to Supabase PostgreSQL.
 * Fast in-memory cache with transparent direct database synchronization.
 */

import fs from "fs";
import path from "path";
import { supabaseDb, DbProject, DbCase, DbAlert, DbAuditLog, DbDataImport } from "@/lib/supabase/db";
import {
  ProjectType,
  FundingModel,
  AcquisitionStage,
  RiskLevel,
  PredictionResponse,
} from "@/shared/types/ml-contract";

export type DemoProject = DbProject;
export type DemoCase = DbCase;
export type DemoAlert = DbAlert;
export type DemoAuditLog = DbAuditLog;
export type DemoDataImport = DbDataImport;

interface StoreData {
  demoProjects: DemoProject[];
  demoAlerts: DemoAlert[];
  demoAuditLogs: DemoAuditLog[];
  demoDataImports: DemoDataImport[];
}

function getCandidateStoreFiles(): string[] {
  return [
    path.join(process.cwd(), ".data", "bhoomi_store.json"),
    path.join(process.cwd(), "Bhoomi Nigrani (2)", "Bhoomi Nigrani", ".data", "bhoomi_store.json"),
    path.resolve(__dirname, "../../.data/bhoomi_store.json"),
    path.resolve(__dirname, "../../../.data/bhoomi_store.json"),
    path.resolve(__dirname, "../../../../.data/bhoomi_store.json"),
    path.join(process.cwd(), "prisma", "backup", "sqlite_export_latest.json"),
    path.join(process.cwd(), "Bhoomi Nigrani (2)", "Bhoomi Nigrani", "prisma", "backup", "sqlite_export_latest.json"),
  ];
}

function resolveStoreFile(): string {
  for (const p of getCandidateStoreFiles()) {
    try {
      if (fs.existsSync(p)) {
        return p;
      }
    } catch {}
  }
  return path.join(process.cwd(), ".data", "bhoomi_store.json");
}

function resolveDataDir(): string {
  const storePath = resolveStoreFile();
  return path.dirname(storePath);
}

// Attach to globalThis to ensure single instance across Next.js API route bundles
const globalForStore = globalThis as unknown as {
  __bhoomi_store?: StoreData;
};

function parseStoreContent(content: string): StoreData | null {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.demoProjects) && parsed.demoProjects.length > 0) {
      return {
        demoProjects: parsed.demoProjects,
        demoAlerts: Array.isArray(parsed.demoAlerts) ? parsed.demoAlerts : [],
        demoAuditLogs: Array.isArray(parsed.demoAuditLogs) ? parsed.demoAuditLogs : [],
        demoDataImports: Array.isArray(parsed.demoDataImports) ? parsed.demoDataImports : [],
      };
    }
    // Handle sqlite export structure as fallback
    if (parsed.data && Array.isArray(parsed.data.projects) && parsed.data.projects.length > 0) {
      const caseMap = new Map<string, any[]>();
      if (Array.isArray(parsed.data.cases)) {
        for (const c of parsed.data.cases) {
          const list = caseMap.get(c.projectId) || [];
          list.push({
            id: c.id,
            project_id: c.projectId,
            case_number: c.caseNumber,
            case_title: c.caseTitle,
            current_stage: c.currentStage || "SIA",
            stage_entry_date: c.stageEntryDate,
            statutory_deadline_date: c.statutoryDeadlineDate,
            benchmark_deadline_date: c.benchmarkDeadlineDate,
            sia_started: c.siaStarted || false,
            public_hearing_held: c.publicHearingHeld || false,
            objections_filed_count: c.objectionsFiledCount || 0,
            legal_cases_pending: c.legalCasesPending || 0,
            court_stay_active: c.courtStayActive || false,
            avg_dispute_age_days: c.avgDisputeAgeDays || 0,
            comp_awarded_crore: c.compAwardedCrore,
            comp_disbursed_crore: c.compDisbursedCrore || 0,
            comp_disputes_pending: c.compDisputesPending || 0,
            max_pending_days_comp: c.maxPendingDaysComp || 0,
            rr_plan_approved: c.rrPlanApproved || false,
            families_resettled: c.familiesResettled || 0,
            clear_title_percent: c.clearTitlePercent ?? 100,
            forest_land_involved: c.forestLandInvolved || false,
            tribal_area: c.tribalArea || false,
            stakeholder_meetings_count: c.stakeholderMeetingsCount || 0,
            overall_status: c.overallStatus || "ACTIVE",
            latest_assessment: c.assessmentJson ? JSON.parse(c.assessmentJson) : undefined,
          });
          caseMap.set(c.projectId, list);
        }
      }

      const projects = parsed.data.projects.map((p: any) => ({
        id: p.id,
        project_name: p.projectName,
        project_type: p.projectType,
        funding_model: p.fundingModel || "government",
        implementing_agency: p.implementingAgency || "State PWD",
        district_id: p.districtId,
        district_name: p.districtName,
        state_code: p.stateCode,
        state_name: p.stateName,
        land_area_ha: p.landAreaHa,
        num_affected_families: p.numAffectedFamilies,
        budget_crore: p.budgetCrore,
        project_start_date: p.projectStartDate,
        description: p.description || "",
        is_demo_data: p.isDemoData ?? false,
        cases: caseMap.get(p.id) || [],
      }));

      return {
        demoProjects: projects,
        demoAlerts: Array.isArray(parsed.data.alerts) ? parsed.data.alerts : [],
        demoAuditLogs: Array.isArray(parsed.data.auditLogs) ? parsed.data.auditLogs : [],
        demoDataImports: Array.isArray(parsed.data.dataImports) ? parsed.data.dataImports : [],
      };
    }
  } catch (err) {
    console.warn("Failed to parse store content:", err);
  }
  return null;
}

function initOrLoadStore(): StoreData {
  if (globalForStore.__bhoomi_store && globalForStore.__bhoomi_store.demoProjects.length > 0) {
    return globalForStore.__bhoomi_store;
  }

  // Attempt to load from candidate disk locations
  for (const candidate of getCandidateStoreFiles()) {
    try {
      if (fs.existsSync(candidate)) {
        const content = fs.readFileSync(candidate, "utf-8");
        if (content.trim()) {
          const loaded = parseStoreContent(content);
          if (loaded && loaded.demoProjects.length > 0) {
            globalForStore.__bhoomi_store = loaded;
            return globalForStore.__bhoomi_store;
          }
        }
      }
    } catch (err) {
      console.warn(`Failed loading from ${candidate}:`, err);
    }
  }

  // Default empty state
  globalForStore.__bhoomi_store = {
    demoProjects: [],
    demoAlerts: [],
    demoAuditLogs: [],
    demoDataImports: [],
  };
  return globalForStore.__bhoomi_store;
}

function saveStoreToDisk() {
  try {
    const dataDir = resolveDataDir();
    const storeFile = path.join(dataDir, "bhoomi_store.json");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const data = getStore();
    const tempFile = path.join(dataDir, `bhoomi_store.tmp.${Date.now()}`);
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, storeFile);
  } catch (err) {
    console.error("Failed to save Bhoomi store to disk cache:", err);
  }
}

function getStore(): StoreData {
  if (!globalForStore.__bhoomi_store || globalForStore.__bhoomi_store.demoProjects.length === 0) {
    return initOrLoadStore();
  }
  return globalForStore.__bhoomi_store;
}

// Accessor and mutation methods backed by Supabase PostgreSQL
export const mockStore = {
  // Rehydrate cache directly from Supabase PostgreSQL
  rehydrateFromDb: async (): Promise<boolean> => {
    try {
      const [dbProjects, dbAlerts, dbAudits, dbImports] = await Promise.all([
        supabaseDb.getProjects(),
        supabaseDb.getAlerts(),
        supabaseDb.getAuditLogs(),
        supabaseDb.getDataImports(),
      ]);

      const store = getStore();
      store.demoProjects = dbProjects;
      store.demoAlerts = dbAlerts;
      store.demoAuditLogs = dbAudits;
      store.demoDataImports = dbImports;
      saveStoreToDisk();
      return true;
    } catch (err) {
      console.warn("rehydrateFromDb warning:", err);
      return false;
    }
  },

  getProjects: () => [...getStore().demoProjects],

  getProjectSummariesAsync: async (filters?: {
    districtId?: number;
    stateCode?: string;
    query?: string;
    limit?: number;
    offset?: number;
  }) => {
    try {
      const summaries = await supabaseDb.getProjectSummaries(filters);
      if (summaries && summaries.length > 0) {
        return summaries;
      }
    } catch (err) {
      console.warn("getProjectSummariesAsync fallback to store:", err);
    }

    let list = mockStore.getProjects();
    if (filters?.districtId) {
      list = list.filter((p) => p.district_id === filters.districtId);
    }
    if (filters?.stateCode) {
      list = list.filter((p) => p.state_code === filters.stateCode);
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase();
      list = list.filter(
        (p) =>
          p.project_name.toLowerCase().includes(q) ||
          p.district_name.toLowerCase().includes(q) ||
          p.state_code.toLowerCase().includes(q)
      );
    }

    const summaries = list.map((p) => {
      const cases = p.cases || [];
      const activeCases = cases.filter((c) => c.overall_status === "ACTIVE");

      let highestTier: RiskLevel = "LOW";
      let caseRiskSum = 0;
      let assessedCount = 0;

      for (const c of cases) {
        const tier = c.latest_assessment?.prediction?.risk_level;
        if (tier === "CRITICAL") highestTier = "CRITICAL";
        else if (tier === "HIGH" && highestTier !== "CRITICAL") highestTier = "HIGH";
        else if (tier === "MEDIUM" && highestTier !== "CRITICAL" && highestTier !== "HIGH") highestTier = "MEDIUM";

        const prob = c.latest_assessment?.prediction?.risk_probability;
        if (typeof prob === "number" && !isNaN(prob)) {
          caseRiskSum += prob;
          assessedCount++;
        }
      }

      // Operational heuristic if no ML assessment yet
      if (assessedCount === 0) {
        for (const c of cases) {
          if (c.court_stay_active) {
            if (highestTier !== "CRITICAL") highestTier = "HIGH";
            caseRiskSum += 0.75;
            assessedCount++;
          } else if (c.legal_cases_pending > 0) {
            if (highestTier === "LOW") highestTier = "MEDIUM";
            caseRiskSum += 0.50;
            assessedCount++;
          }
        }
      }

      const avgRisk = assessedCount > 0 ? Number((caseRiskSum / assessedCount).toFixed(3)) : 0.0;

      return {
        id: p.id,
        project_name: p.project_name,
        project_type: p.project_type,
        funding_model: p.funding_model,
        implementing_agency: p.implementing_agency,
        district_id: p.district_id,
        district_name: p.district_name,
        state_code: p.state_code,
        land_area_ha: p.land_area_ha,
        budget_crore: p.budget_crore,
        total_cases: cases.length,
        active_cases: activeCases.length,
        highest_risk_tier: highestTier,
        avg_risk_probability: avgRisk,
        is_demo_data: p.is_demo_data ?? true,
      };
    });

    if (filters?.offset !== undefined || filters?.limit !== undefined) {
      const start = filters.offset || 0;
      const end = filters.limit ? start + filters.limit : undefined;
      return summaries.slice(start, end);
    }

    return summaries;
  },

  getDashboardSummaryAsync: async () => {
    try {
      const dbSummary = await supabaseDb.getDashboardSummary();
      if (dbSummary && (dbSummary.total_projects > 0 || dbSummary.total_cases > 0)) {
        return dbSummary;
      }
    } catch (err) {
      console.warn("getDashboardSummaryAsync DB fallback to store:", err);
    }

    const projects = mockStore.getProjects();
    const allCases = mockStore.getAllCases();
    const activeCases = allCases.filter((c) => c.overall_status === "ACTIVE");

    let criticalCases = 0;
    let highRiskCases = 0;
    let mediumRiskCases = 0;
    let lowRiskCases = 0;
    let assessedCount = 0;
    let totalRiskProb = 0;

    for (const c of allCases) {
      const assessment = c.latest_assessment;
      const level = assessment?.prediction?.risk_level;
      const prob = assessment?.prediction?.risk_probability;

      if (level === "CRITICAL") criticalCases++;
      else if (level === "HIGH") highRiskCases++;
      else if (level === "MEDIUM") mediumRiskCases++;
      else if (level === "LOW") lowRiskCases++;

      if (typeof prob === "number" && !isNaN(prob)) {
        totalRiskProb += prob;
        assessedCount++;
      }
    }

    // If explicit ML assessments haven't been run on all cases, derive from operational risk attributes
    if (criticalCases === 0 && highRiskCases === 0 && mediumRiskCases === 0 && lowRiskCases === 0) {
      for (const c of allCases) {
        if (c.court_stay_active || (c.legal_cases_pending && c.legal_cases_pending >= 2)) {
          criticalCases++;
          totalRiskProb += 0.85;
          assessedCount++;
        } else if (c.legal_cases_pending && c.legal_cases_pending >= 1) {
          highRiskCases++;
          totalRiskProb += 0.65;
          assessedCount++;
        } else if (c.comp_disputes_pending && c.comp_disputes_pending > 0) {
          mediumRiskCases++;
          totalRiskProb += 0.42;
          assessedCount++;
        } else {
          lowRiskCases++;
          totalRiskProb += 0.15;
          assessedCount++;
        }
      }
    }

    const avgRiskProbability = assessedCount > 0 ? Number((totalRiskProb / assessedCount).toFixed(3)) : 0.0;
    const unreadAlerts = mockStore.getAlerts().filter((a) => !a.acknowledged).length;

    return {
      total_projects: projects.length,
      total_cases: allCases.length,
      active_cases: activeCases.length,
      critical_cases: criticalCases,
      high_risk_cases: highRiskCases,
      medium_risk_cases: mediumRiskCases,
      low_risk_cases: lowRiskCases,
      avg_risk_probability: avgRiskProbability,
      unread_alerts_count: unreadAlerts,
    };
  },

  getDistinctStatesAsync: async () => {
    try {
      return await supabaseDb.getDistinctStates();
    } catch (err) {
      console.warn("getDistinctStatesAsync fallback:", err);
      const states = new Set<string>();
      mockStore.getProjects().forEach((p) => {
        if (p.state_code) states.add(p.state_code);
      });
      return Array.from(states).sort();
    }
  },

  getProjectsAsync: async (filters?: { districtId?: number; stateCode?: string }): Promise<DemoProject[]> => {
    try {
      const projects = await supabaseDb.getProjects(filters);
      if (projects.length > 0) {
        const store = getStore();
        store.demoProjects = projects;
      }
      return projects;
    } catch (err) {
      console.warn("getProjectsAsync fallback to cache:", err);
      let list = [...getStore().demoProjects];
      if (filters?.districtId) list = list.filter((p) => p.district_id === filters.districtId);
      if (filters?.stateCode) list = list.filter((p) => p.state_code === filters.stateCode);
      return list;
    }
  },

  getProjectById: (id: string): DemoProject | undefined => {
    if (!id) return undefined;
    const cleanId = String(id).trim().toLowerCase();
    const store = getStore();
    let found = store.demoProjects.find((p) => p.id.trim().toLowerCase() === cleanId);
    if (!found) {
      try {
        const storeFile = resolveStoreFile();
        if (fs.existsSync(storeFile)) {
          const content = fs.readFileSync(storeFile, "utf-8");
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed.demoProjects)) {
            store.demoProjects = parsed.demoProjects;
            found = store.demoProjects.find((p) => p.id.trim().toLowerCase() === cleanId);
          }
        }
      } catch {}
    }
    return found;
  },

  getProjectByIdAsync: async (id: string): Promise<DemoProject | undefined> => {
    if (!id) return undefined;
    const cleanId = String(id).trim();
    const existing = mockStore.getProjectById(cleanId);
    if (existing) return existing;

    // Query Supabase directly
    try {
      const dbProject = await supabaseDb.getProjectById(cleanId);
      if (dbProject) {
        const store = getStore();
        const idx = store.demoProjects.findIndex((p) => p.id.toLowerCase() === cleanId.toLowerCase());
        if (idx !== -1) {
          store.demoProjects[idx] = dbProject;
        } else {
          store.demoProjects.unshift(dbProject);
        }
        saveStoreToDisk();
        return dbProject;
      }
    } catch (err) {
      console.warn("Error querying Supabase for project:", err);
    }
    return undefined;
  },

  getAllCases: () => getStore().demoProjects.flatMap((p) => p.cases),

  getAllCasesAsync: async (): Promise<DemoCase[]> => {
    try {
      return await supabaseDb.getAllCases();
    } catch (err) {
      console.warn("getAllCasesAsync fallback:", err);
      return mockStore.getAllCases();
    }
  },

  getCaseById: (caseId: string) => {
    if (!caseId) return null;
    const cleanId = String(caseId).trim().toLowerCase();
    const store = getStore();
    for (const p of store.demoProjects) {
      const found = p.cases.find((c) => c.id.trim().toLowerCase() === cleanId || c.case_number.trim().toLowerCase() === cleanId);
      if (found) return { caseData: found, project: p };
    }
    return null;
  },

  getCaseByIdAsync: async (caseId: string): Promise<{ caseData: DemoCase; project: DemoProject } | null> => {
    const cached = mockStore.getCaseById(caseId);
    if (cached) return cached;
    try {
      const fromDb = await supabaseDb.getCaseById(caseId);
      if (fromDb) {
        mockStore.addCaseToProject(fromDb.project.id, fromDb.caseData);
        return fromDb;
      }
    } catch (err) {
      console.warn("getCaseByIdAsync fallback:", err);
    }
    return null;
  },

  updateCase: (caseId: string, updates: Partial<DemoCase>) => {
    const store = getStore();
    for (const p of store.demoProjects) {
      const idx = p.cases.findIndex((c) => c.id === caseId || c.case_number === caseId);
      if (idx !== -1) {
        p.cases[idx] = { ...p.cases[idx], ...updates };
        saveStoreToDisk();
        supabaseDb.updateCase(p.cases[idx].id, updates).catch((err) => {
          console.warn("Supabase updateCase warning:", err);
        });
        return p.cases[idx];
      }
    }
    return null;
  },

  addProject: (project: DemoProject) => {
    const store = getStore();
    const existingIndex = store.demoProjects.findIndex(
      (p) => p.id.trim().toLowerCase() === project.id.trim().toLowerCase()
    );
    if (existingIndex !== -1) {
      store.demoProjects[existingIndex] = project;
    } else {
      store.demoProjects.unshift(project);
    }
    saveStoreToDisk();
    supabaseDb.addProject(project).catch((err) => {
      console.warn("Supabase addProject warning:", err);
    });
    return project;
  },

  updateProject: (projectId: string, updates: Partial<DemoProject>) => {
    const store = getStore();
    const cleanId = projectId.trim().toLowerCase();
    const idx = store.demoProjects.findIndex((p) => p.id.trim().toLowerCase() === cleanId);
    if (idx !== -1) {
      store.demoProjects[idx] = { ...store.demoProjects[idx], ...updates };
      saveStoreToDisk();
      supabaseDb.addProject(store.demoProjects[idx]).catch((err) => {
        console.warn("Supabase updateProject warning:", err);
      });
      return store.demoProjects[idx];
    }
    return null;
  },

  addCaseToProject: (projectId: string, newCase: DemoCase) => {
    const store = getStore();
    const cleanId = projectId.trim().toLowerCase();
    const project = store.demoProjects.find((p) => p.id.trim().toLowerCase() === cleanId);
    if (!project) return null;
    const existingIndex = project.cases.findIndex((c) => c.case_number === newCase.case_number);
    if (existingIndex !== -1) {
      project.cases[existingIndex] = { ...project.cases[existingIndex], ...newCase };
      saveStoreToDisk();
      supabaseDb.addCases(project.id, [project.cases[existingIndex]]).catch((err) => {
        console.warn("Supabase addCase warning:", err);
      });
      return project.cases[existingIndex];
    } else {
      project.cases.push(newCase);
      saveStoreToDisk();
      supabaseDb.addCases(project.id, [newCase]).catch((err) => {
        console.warn("Supabase addCase warning:", err);
      });
      return newCase;
    }
  },

  addCasesToProject: async (projectId: string, newCases: DemoCase[]): Promise<DemoCase[]> => {
    const store = getStore();
    const cleanId = projectId.trim().toLowerCase();
    let project = store.demoProjects.find((p) => p.id.trim().toLowerCase() === cleanId);
    if (!project) {
      project = await mockStore.getProjectByIdAsync(projectId);
    }
    if (!project) return [];

    const existingMap = new Map<string, number>();
    project.cases.forEach((c, idx) => existingMap.set(c.case_number, idx));

    const addedOrUpdated: DemoCase[] = [];

    for (const c of newCases) {
      const existingIdx = existingMap.get(c.case_number);
      if (existingIdx !== undefined) {
        project.cases[existingIdx] = { ...project.cases[existingIdx], ...c };
        addedOrUpdated.push(project.cases[existingIdx]);
      } else {
        project.cases.push(c);
        existingMap.set(c.case_number, project.cases.length - 1);
        addedOrUpdated.push(c);
      }
    }

    saveStoreToDisk();

    // Persist directly to Supabase PostgreSQL in batches
    try {
      await supabaseDb.addCases(project.id, addedOrUpdated);
    } catch (err) {
      console.warn("Supabase batch addCases warning:", err);
    }

    return addedOrUpdated;
  },

  getAlerts: () => [...getStore().demoAlerts],

  getAlertsAsync: async (): Promise<DemoAlert[]> => {
    try {
      const alerts = await supabaseDb.getAlerts();
      getStore().demoAlerts = alerts;
      saveStoreToDisk();
      return alerts;
    } catch (err) {
      console.warn("getAlertsAsync fallback:", err);
      return mockStore.getAlerts();
    }
  },

  acknowledgeAlert: (alertId: string) => {
    const store = getStore();
    const alert = store.demoAlerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      saveStoreToDisk();
      supabaseDb.acknowledgeAlert(alertId).catch((err) => {
        console.warn("Supabase acknowledgeAlert warning:", err);
      });
    }
    return alert;
  },

  addAlert: (alert: DemoAlert) => {
    const store = getStore();
    store.demoAlerts.unshift(alert);
    saveStoreToDisk();
    supabaseDb.addAlert(alert).catch((err) => {
      console.warn("Supabase addAlert warning:", err);
    });
    return alert;
  },

  getAuditLogs: () => [...getStore().demoAuditLogs],

  getAuditLogsAsync: async (): Promise<DemoAuditLog[]> => {
    try {
      const logs = await supabaseDb.getAuditLogs();
      getStore().demoAuditLogs = logs;
      saveStoreToDisk();
      return logs;
    } catch (err) {
      console.warn("getAuditLogsAsync fallback:", err);
      return mockStore.getAuditLogs();
    }
  },

  addAuditLog: (log: DemoAuditLog) => {
    const store = getStore();
    store.demoAuditLogs.unshift(log);
    saveStoreToDisk();
    supabaseDb.addAuditLog(log).catch((err) => {
      console.warn("Supabase addAuditLog warning:", err);
    });
    return log;
  },

  getDataImports: () => [...getStore().demoDataImports],

  getDataImportsAsync: async (projectId?: string): Promise<DemoDataImport[]> => {
    try {
      const imports = await supabaseDb.getDataImports(projectId);
      getStore().demoDataImports = imports;
      saveStoreToDisk();
      return imports;
    } catch (err) {
      console.warn("getDataImportsAsync fallback:", err);
      return mockStore.getDataImports();
    }
  },

  addDataImport: (importRecord: DemoDataImport) => {
    const store = getStore();
    store.demoDataImports.unshift(importRecord);
    saveStoreToDisk();
    supabaseDb.addDataImport(importRecord).catch((err) => {
      console.warn("Supabase addDataImport warning:", err);
    });
    return importRecord;
  },
};
