const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function exportSqliteData() {
  console.log("=== Backing up SQLite Data ===");
  const backupDir = path.join(process.cwd(), "prisma", "backup");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `sqlite_export_${timestamp}.json`);
  const latestBackupFile = path.join(backupDir, `sqlite_export_latest.json`);

  const states = await prisma.state.findMany();
  const districts = await prisma.district.findMany();
  const projects = await prisma.project.findMany();
  const cases = await prisma.acquisitionCase.findMany();
  const stageConfigs = await prisma.stageDurationConfig.findMany();
  const alerts = await prisma.alert.findMany();
  const auditLogs = await prisma.auditLog.findMany();
  const dataImports = await prisma.dataImport.findMany();

  const backupData = {
    exportedAt: new Date().toISOString(),
    counts: {
      states: states.length,
      districts: districts.length,
      projects: projects.length,
      cases: cases.length,
      stageConfigs: stageConfigs.length,
      alerts: alerts.length,
      auditLogs: auditLogs.length,
      dataImports: dataImports.length,
    },
    data: {
      states,
      districts,
      projects,
      cases,
      stageConfigs,
      alerts,
      auditLogs,
      dataImports,
    },
  };

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), "utf-8");
  fs.writeFileSync(latestBackupFile, JSON.stringify(backupData, null, 2), "utf-8");

  console.log("Backup successfully written to:\n - " + backupFile + "\n - " + latestBackupFile);
  console.log("Record summary:", JSON.stringify(backupData.counts, null, 2));

  await prisma.$disconnect();
}

exportSqliteData().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});
