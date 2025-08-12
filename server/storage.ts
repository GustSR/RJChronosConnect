import {
  users, olts, ponPorts, onus, cpes, alerts, automationRules, actionLogs, aiInsights,
  type User, type UpsertUser, type Olt, type InsertOlt, type Onu, type InsertOnu,
  type Cpe, type InsertCpe, type Alert, type InsertAlert, type AutomationRule,
  type InsertAutomationRule, type ActionLog, type InsertActionLog, type AIInsight,
  type InsertAIInsight, type PonPort, type InsertPonPort
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, count, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // OLT operations
  getAllOlts(): Promise<Olt[]>;
  getOlt(id: string): Promise<Olt | undefined>;
  createOlt(olt: InsertOlt): Promise<Olt>;
  updateOlt(id: string, olt: Partial<InsertOlt>): Promise<Olt>;

  // PON Port operations
  getPonPortsByOlt(oltId: string): Promise<PonPort[]>;
  createPonPort(ponPort: InsertPonPort): Promise<PonPort>;
  updatePonPort(id: string, ponPort: Partial<InsertPonPort>): Promise<PonPort>;

  // ONU operations
  getAllOnus(): Promise<Onu[]>;
  getOnusByOlt(oltId: string): Promise<Onu[]>;
  createOnu(onu: InsertOnu): Promise<Onu>;
  updateOnu(id: string, onu: Partial<InsertOnu>): Promise<Onu>;

  // CPE operations
  getAllCpes(): Promise<Cpe[]>;
  getCpe(id: string): Promise<Cpe | undefined>;
  getCpeBySerial(serialNumber: string): Promise<Cpe | undefined>;
  createCpe(cpe: InsertCpe): Promise<Cpe>;
  updateCpe(id: string, cpe: Partial<InsertCpe>): Promise<Cpe>;

  // Alert operations
  getAllAlerts(limit?: number): Promise<Alert[]>;
  getUnacknowledgedAlerts(): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  acknowledgeAlert(id: string, userId: string): Promise<Alert>;
  resolveAlert(id: string): Promise<Alert>;

  // Automation operations
  getAllAutomationRules(): Promise<AutomationRule[]>;
  getActiveAutomationRules(): Promise<AutomationRule[]>;
  createAutomationRule(rule: InsertAutomationRule): Promise<AutomationRule>;
  updateAutomationRule(id: string, rule: Partial<InsertAutomationRule>): Promise<AutomationRule>;

  // Action log operations
  getRecentActionLogs(limit?: number): Promise<ActionLog[]>;
  createActionLog(log: InsertActionLog): Promise<ActionLog>;

  // AI insights operations
  getRecentAIInsights(limit?: number): Promise<AIInsight[]>;
  createAIInsight(insight: InsertAIInsight): Promise<AIInsight>;
  
  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    devicesOnline: number;
    criticalAlerts: number;
    failureRate: number;
    automations: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // OLT operations
  async getAllOlts(): Promise<Olt[]> {
    return await db.select().from(olts).orderBy(desc(olts.createdAt));
  }

  async getOlt(id: string): Promise<Olt | undefined> {
    const [olt] = await db.select().from(olts).where(eq(olts.id, id));
    return olt;
  }

  async createOlt(olt: InsertOlt): Promise<Olt> {
    const [newOlt] = await db.insert(olts).values(olt).returning();
    return newOlt;
  }

  async updateOlt(id: string, olt: Partial<InsertOlt>): Promise<Olt> {
    const [updatedOlt] = await db
      .update(olts)
      .set({ ...olt, updatedAt: new Date() })
      .where(eq(olts.id, id))
      .returning();
    return updatedOlt;
  }

  // PON Port operations
  async getPonPortsByOlt(oltId: string): Promise<PonPort[]> {
    return await db.select().from(ponPorts).where(eq(ponPorts.oltId, oltId));
  }

  async createPonPort(ponPort: InsertPonPort): Promise<PonPort> {
    const [newPonPort] = await db.insert(ponPorts).values(ponPort).returning();
    return newPonPort;
  }

  async updatePonPort(id: string, ponPort: Partial<InsertPonPort>): Promise<PonPort> {
    const [updatedPonPort] = await db
      .update(ponPorts)
      .set({ ...ponPort, updatedAt: new Date() })
      .where(eq(ponPorts.id, id))
      .returning();
    return updatedPonPort;
  }

  // ONU operations
  async getAllOnus(): Promise<Onu[]> {
    return await db.select().from(onus).orderBy(desc(onus.createdAt));
  }

  async getOnusByOlt(oltId: string): Promise<Onu[]> {
    return await db.select().from(onus).where(eq(onus.oltId, oltId));
  }

  async createOnu(onu: InsertOnu): Promise<Onu> {
    const [newOnu] = await db.insert(onus).values(onu).returning();
    return newOnu;
  }

  async updateOnu(id: string, onu: Partial<InsertOnu>): Promise<Onu> {
    const [updatedOnu] = await db
      .update(onus)
      .set({ ...onu, updatedAt: new Date() })
      .where(eq(onus.id, id))
      .returning();
    return updatedOnu;
  }

  // CPE operations
  async getAllCpes(): Promise<Cpe[]> {
    return await db.select().from(cpes).orderBy(desc(cpes.createdAt));
  }

  async getCpe(id: string): Promise<Cpe | undefined> {
    const [cpe] = await db.select().from(cpes).where(eq(cpes.id, id));
    return cpe;
  }

  async getCpeBySerial(serialNumber: string): Promise<Cpe | undefined> {
    const [cpe] = await db.select().from(cpes).where(eq(cpes.serialNumber, serialNumber));
    return cpe;
  }

  async createCpe(cpe: InsertCpe): Promise<Cpe> {
    const [newCpe] = await db.insert(cpes).values(cpe).returning();
    return newCpe;
  }

  async updateCpe(id: string, cpe: Partial<InsertCpe>): Promise<Cpe> {
    const [updatedCpe] = await db
      .update(cpes)
      .set({ ...cpe, updatedAt: new Date() })
      .where(eq(cpes.id, id))
      .returning();
    return updatedCpe;
  }

  // Alert operations
  async getAllAlerts(limit: number = 50): Promise<Alert[]> {
    return await db.select().from(alerts).orderBy(desc(alerts.createdAt)).limit(limit);
  }

  async getUnacknowledgedAlerts(): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.isAcknowledged, false))
      .orderBy(desc(alerts.createdAt));
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }

  async acknowledgeAlert(id: string, userId: string): Promise<Alert> {
    const [alert] = await db
      .update(alerts)
      .set({
        isAcknowledged: true,
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      })
      .where(eq(alerts.id, id))
      .returning();
    return alert;
  }

  async resolveAlert(id: string): Promise<Alert> {
    const [alert] = await db
      .update(alerts)
      .set({
        isResolved: true,
        resolvedAt: new Date(),
      })
      .where(eq(alerts.id, id))
      .returning();
    return alert;
  }

  // Automation operations
  async getAllAutomationRules(): Promise<AutomationRule[]> {
    return await db.select().from(automationRules).orderBy(desc(automationRules.createdAt));
  }

  async getActiveAutomationRules(): Promise<AutomationRule[]> {
    return await db
      .select()
      .from(automationRules)
      .where(eq(automationRules.isActive, true));
  }

  async createAutomationRule(rule: InsertAutomationRule): Promise<AutomationRule> {
    const [newRule] = await db.insert(automationRules).values(rule).returning();
    return newRule;
  }

  async updateAutomationRule(id: string, rule: Partial<InsertAutomationRule>): Promise<AutomationRule> {
    const [updatedRule] = await db
      .update(automationRules)
      .set({ ...rule, updatedAt: new Date() })
      .where(eq(automationRules.id, id))
      .returning();
    return updatedRule;
  }

  // Action log operations
  async getRecentActionLogs(limit: number = 20): Promise<ActionLog[]> {
    return await db.select().from(actionLogs).orderBy(desc(actionLogs.createdAt)).limit(limit);
  }

  async createActionLog(log: InsertActionLog): Promise<ActionLog> {
    const [newLog] = await db.insert(actionLogs).values(log).returning();
    return newLog;
  }

  // AI insights operations
  async getRecentAIInsights(limit: number = 10): Promise<AIInsight[]> {
    return await db.select().from(aiInsights).orderBy(desc(aiInsights.createdAt)).limit(limit);
  }

  async createAIInsight(insight: InsertAIInsight): Promise<AIInsight> {
    const [newInsight] = await db.insert(aiInsights).values(insight).returning();
    return newInsight;
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    devicesOnline: number;
    criticalAlerts: number;
    failureRate: number;
    automations: number;
  }> {
    const [onlineDevices] = await db
      .select({ count: count() })
      .from(cpes)
      .where(eq(cpes.status, 'online'));

    const [criticalAlerts] = await db
      .select({ count: count() })
      .from(alerts)
      .where(and(
        eq(alerts.severity, 'critical'),
        eq(alerts.isResolved, false)
      ));

    const [totalDevices] = await db.select({ count: count() }).from(cpes);
    const [offlineDevices] = await db
      .select({ count: count() })
      .from(cpes)
      .where(eq(cpes.status, 'offline'));

    const failureRate = totalDevices.count > 0 
      ? (offlineDevices.count / totalDevices.count) * 100 
      : 0;

    const [activeAutomations] = await db
      .select({ count: count() })
      .from(automationRules)
      .where(eq(automationRules.isActive, true));

    return {
      devicesOnline: onlineDevices.count,
      criticalAlerts: criticalAlerts.count,
      failureRate: parseFloat(failureRate.toFixed(2)),
      automations: activeAutomations.count,
    };
  }
}

export const storage = new DatabaseStorage();
