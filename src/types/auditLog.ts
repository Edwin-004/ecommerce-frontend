export interface AuditLog {
  id: number;
  action: string;
  moduleName: string;
  tableName: string;
  recordId: number;
  description: string;
  oldValue: string | null;
  newValue: string | null;
  httpMethod: string;
  endpoint: string;
  userId: number;
  userName: string;
  ipAddress: string;
  userAgent: string;
  status: string;
  createdAt: string;
}