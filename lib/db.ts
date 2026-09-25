import { supabaseDb, query, DbProject, DbCase, DbAlert, DbAuditLog, DbDataImport } from "./supabase/db";

export { supabaseDb, query };
export type { DbProject, DbCase, DbAlert, DbAuditLog, DbDataImport };
export default supabaseDb;
