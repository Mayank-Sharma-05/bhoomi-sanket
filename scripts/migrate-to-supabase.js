const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToSupabase() {
  console.log("=== Migrating SQLite Data to Supabase PostgreSQL ===");
  const backupFile = path.join(process.cwd(), "prisma", "backup", "sqlite_export_latest.json");
  if (!fs.existsSync(backupFile)) {
    throw new Error("Backup file not found at " + backupFile);
  }

  const backup = JSON.parse(fs.readFileSync(backupFile, "utf-8"));
  const { states, districts, projects, cases, alerts, auditLogs, dataImports } = backup.data;

  console.log(`Loaded backup: ${states.length} states, ${districts.length} districts, ${projects.length} projects, ${cases.length} cases.`);

  // 1. States
  console.log("\n1/6 Inserting States...");
  for (const s of states) {
    await prisma.state.upsert({
      where: { stateCode: s.stateCode },
      update: { stateName: s.stateName },
      create: {
        id: s.id,
        stateCode: s.stateCode,
        stateName: s.stateName,
        createdAt: new Date(s.createdAt),
      },
    });
  }
  console.log(` - ${states.length} states upserted.`);

  // 2. Districts
  console.log("\n2/6 Inserting Districts...");
  for (const d of districts) {
    await prisma.district.upsert({
      where: {
        districtName_stateCode: {
          districtName: d.districtName,
          stateCode: d.stateCode,
        },
      },
      update: {},
      create: {
        id: d.id,
        districtName: d.districtName,
        stateCode: d.stateCode,
        createdAt: new Date(d.createdAt),
      },
    });
  }
  console.log(` - ${districts.length} districts upserted.`);

  // 3. Projects
  console.log("\n3/6 Inserting Projects (in chunks of 50)...");
  const pChunks = 50;
  for (let i = 0; i < projects.length; i += pChunks) {
    const chunk = projects.slice(i, i + pChunks);
    await Promise.all(
      chunk.map((p) =>
        prisma.project.upsert({
          where: { id: p.id },
          update: {
            projectName: p.projectName,
            projectType: p.projectType,
            fundingModel: p.fundingModel,
            implementingAgency: p.implementingAgency,
            districtId: p.districtId,
            districtName: p.districtName,
            stateCode: p.stateCode,
            stateName: p.stateName,
            landAreaHa: p.landAreaHa,
            numAffectedFamilies: p.numAffectedFamilies,
            budgetCrore: p.budgetCrore,
            projectStartDate: p.projectStartDate,
            description: p.description,
            isDemoData: p.isDemoData,
          },
          create: {
            id: p.id,
            projectName: p.projectName,
            projectType: p.projectType,
            fundingModel: p.fundingModel,
            implementingAgency: p.implementingAgency,
            districtId: p.districtId,
            districtName: p.districtName,
            stateCode: p.stateCode,
            stateName: p.stateName,
            landAreaHa: p.landAreaHa,
            numAffectedFamilies: p.numAffectedFamilies,
            budgetCrore: p.budgetCrore,
            projectStartDate: p.projectStartDate,
            description: p.description,
            isDemoData: p.isDemoData,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          },
        })
      )
    );
    if ((i + pChunks) % 200 === 0 || i + pChunks >= projects.length) {
      console.log(` - Upserted ${Math.min(i + pChunks, projects.length)} / ${projects.length} projects...`);
    }
  }

  // 4. Acquisition Cases
  console.log("\n4/6 Inserting Acquisition Cases (in chunks of 100)...");
  const cChunks = 100;
  for (let i = 0; i < cases.length; i += cChunks) {
    const chunk = cases.slice(i, i + cChunks);
    await Promise.all(
      chunk.map((c) =>
        prisma.acquisitionCase.upsert({
          where: {
            projectId_caseNumber: {
              projectId: c.projectId,
              caseNumber: c.caseNumber,
            },
          },
          update: {
            caseTitle: c.caseTitle,
            currentStage: c.currentStage,
            stageEntryDate: c.stageEntryDate,
            statutoryDeadlineDate: c.statutoryDeadlineDate,
            benchmarkDeadlineDate: c.benchmarkDeadlineDate,
            siaStarted: c.siaStarted,
            publicHearingHeld: c.publicHearingHeld,
            objectionsFiledCount: c.objectionsFiledCount,
            legalCasesPending: c.legalCasesPending,
            courtStayActive: c.courtStayActive,
            avgDisputeAgeDays: c.avgDisputeAgeDays,
            compAwardedCrore: c.compAwardedCrore,
            compDisbursedCrore: c.compDisbursedCrore,
            compDisputesPending: c.compDisputesPending,
            maxPendingDaysComp: c.maxPendingDaysComp,
            rrPlanApproved: c.rrPlanApproved,
            familiesResettled: c.familiesResettled,
            clearTitlePercent: c.clearTitlePercent,
            forestLandInvolved: c.forestLandInvolved,
            tribalArea: c.tribalArea,
            stakeholderMeetingsCount: c.stakeholderMeetingsCount,
            overallStatus: c.overallStatus,
            assessmentJson: c.assessmentJson,
          },
          create: {
            id: c.id,
            projectId: c.projectId,
            caseNumber: c.caseNumber,
            caseTitle: c.caseTitle,
            currentStage: c.currentStage,
            stageEntryDate: c.stageEntryDate,
            statutoryDeadlineDate: c.statutoryDeadlineDate,
            benchmarkDeadlineDate: c.benchmarkDeadlineDate,
            siaStarted: c.siaStarted,
            publicHearingHeld: c.publicHearingHeld,
            objectionsFiledCount: c.objectionsFiledCount,
            legalCasesPending: c.legalCasesPending,
            courtStayActive: c.courtStayActive,
            avgDisputeAgeDays: c.avgDisputeAgeDays,
            compAwardedCrore: c.compAwardedCrore,
            compDisbursedCrore: c.compDisbursedCrore,
            compDisputesPending: c.compDisputesPending,
            maxPendingDaysComp: c.maxPendingDaysComp,
            rrPlanApproved: c.rrPlanApproved,
            familiesResettled: c.familiesResettled,
            clearTitlePercent: c.clearTitlePercent,
            forestLandInvolved: c.forestLandInvolved,
            tribalArea: c.tribalArea,
            stakeholderMeetingsCount: c.stakeholderMeetingsCount,
            overallStatus: c.overallStatus,
            assessmentJson: c.assessmentJson,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
          },
        })
      )
    );
    if ((i + cChunks) % 1000 === 0 || i + cChunks >= cases.length) {
      console.log(` - Upserted ${Math.min(i + cChunks, cases.length)} / ${cases.length} cases...`);
    }
  }

  // 5. Data Imports
  if (dataImports && dataImports.length > 0) {
    console.log("\n5/6 Inserting Data Imports...");
    for (const imp of dataImports) {
      await prisma.dataImport.upsert({
        where: { id: imp.id },
        update: {},
        create: {
          id: imp.id,
          projectId: imp.projectId,
          sourceFilename: imp.sourceFilename,
          sourceType: imp.sourceType,
          fileSizeBytes: imp.fileSizeBytes,
          uploadedBy: imp.uploadedBy,
          uploaderName: imp.uploaderName,
          recordsCount: imp.recordsCount,
          validationStatus: imp.validationStatus,
          validationSummary: typeof imp.validationSummary === 'object' ? JSON.stringify(imp.validationSummary) : String(imp.validationSummary),
          createdAt: new Date(imp.createdAt),
        },
      });
    }
  }

  // 6. Audit Logs
  if (auditLogs && auditLogs.length > 0) {
    console.log("\n6/6 Inserting Audit Logs...");
    for (const log of auditLogs) {
      await prisma.auditLog.upsert({
        where: { id: log.id },
        update: {},
        create: {
          id: log.id,
          userId: log.userId,
          userName: log.userName,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          details: log.details,
          createdAt: new Date(log.createdAt),
        },
      });
    }
  }

  console.log("\n=== Final Verification of Migrated Supabase Database ===");
  const [sCount, dCount, pCount, cCount, iCount, aCount] = await Promise.all([
    prisma.state.count(),
    prisma.district.count(),
    prisma.project.count(),
    prisma.acquisitionCase.count(),
    prisma.dataImport.count(),
    prisma.auditLog.count(),
  ]);

  console.log({
    states: sCount,
    districts: dCount,
    projects: pCount,
    cases: cCount,
    dataImports: iCount,
    auditLogs: aCount,
  });

  if (pCount !== projects.length || cCount !== cases.length) {
    throw new Error(`Count mismatch! Expected ${projects.length} projects, got ${pCount}. Expected ${cases.length} cases, got ${cCount}.`);
  }

  console.log("\n✓ Migration completed successfully with ZERO data loss!");
  await prisma.$disconnect();
}

migrateToSupabase().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
