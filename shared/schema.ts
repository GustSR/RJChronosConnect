import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default('operator'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Device status enum
export const deviceStatusEnum = pgEnum('device_status', ['online', 'offline', 'warning', 'error']);

// OLT table
export const olts = pgTable("olts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  ipAddress: varchar("ip_address").notNull().unique(),
  model: varchar("model"),
  firmwareVersion: varchar("firmware_version"),
  status: deviceStatusEnum("status").default('offline'),
  location: varchar("location"),
  ponPorts: integer("pon_ports").default(16),
  lastSeen: timestamp("last_seen"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// PON Port table
export const ponPorts = pgTable("pon_ports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  oltId: varchar("olt_id").references(() => olts.id),
  portNumber: varchar("port_number").notNull(),
  status: deviceStatusEnum("status").default('offline'),
  onuCount: integer("onu_count").default(0),
  uptime: decimal("uptime", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ONU table
export const onus = pgTable("onus", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  oltId: varchar("olt_id").references(() => olts.id),
  ponPortId: varchar("pon_port_id").references(() => ponPorts.id),
  serialNumber: varchar("serial_number").notNull().unique(),
  model: varchar("model"),
  firmwareVersion: varchar("firmware_version"),
  status: deviceStatusEnum("status").default('offline'),
  rxPower: decimal("rx_power", { precision: 5, scale: 2 }),
  txPower: decimal("tx_power", { precision: 5, scale: 2 }),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  distance: decimal("distance", { precision: 8, scale: 2 }),
  lastSeen: timestamp("last_seen"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CPE table
export const cpes = pgTable("cpes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  onuId: varchar("onu_id").references(() => onus.id),
  serialNumber: varchar("serial_number").notNull().unique(),
  model: varchar("model"),
  firmwareVersion: varchar("firmware_version"),
  tr069Url: varchar("tr069_url"),
  ipAddress: varchar("ip_address"),
  macAddress: varchar("mac_address"),
  status: deviceStatusEnum("status").default('offline'),
  wifiEnabled: boolean("wifi_enabled").default(true),
  wifiSSID: varchar("wifi_ssid"),
  wifiChannel: integer("wifi_channel"),
  signalStrength: decimal("signal_strength", { precision: 5, scale: 2 }),
  uptime: integer("uptime"),
  customerName: varchar("customer_name"),
  customerAddress: varchar("customer_address"),
  lastSeen: timestamp("last_seen"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Alert severity enum
export const alertSeverityEnum = pgEnum('alert_severity', ['info', 'warning', 'error', 'critical']);

// Alerts table
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id"),
  deviceType: varchar("device_type"), // 'cpe', 'onu', 'olt'
  severity: alertSeverityEnum("severity").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  isAcknowledged: boolean("is_acknowledged").default(false),
  acknowledgedBy: varchar("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at"),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Automation rules table
export const automationRules = pgTable("automation_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  triggerCondition: jsonb("trigger_condition").notNull(),
  actions: jsonb("actions").notNull(),
  isActive: boolean("is_active").default(true),
  executionCount: integer("execution_count").default(0),
  lastExecuted: timestamp("last_executed"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Action logs table
export const actionLogs = pgTable("action_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id"),
  deviceType: varchar("device_type"),
  action: varchar("action").notNull(),
  description: text("description"),
  parameters: jsonb("parameters"),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  executedBy: varchar("executed_by").references(() => users.id),
  automationRuleId: varchar("automation_rule_id").references(() => automationRules.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI insights table
export const aiInsights = pgTable("ai_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // 'prediction', 'anomaly', 'recommendation'
  title: varchar("title").notNull(),
  description: text("description"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  deviceId: varchar("device_id"),
  deviceType: varchar("device_type"),
  metadata: jsonb("metadata"),
  isActioned: boolean("is_actioned").default(false),
  actionedAt: timestamp("actioned_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
export const oltRelations = relations(olts, ({ many }) => ({
  ponPorts: many(ponPorts),
  onus: many(onus),
}));

export const ponPortRelations = relations(ponPorts, ({ one, many }) => ({
  olt: one(olts, {
    fields: [ponPorts.oltId],
    references: [olts.id],
  }),
  onus: many(onus),
}));

export const onuRelations = relations(onus, ({ one, many }) => ({
  olt: one(olts, {
    fields: [onus.oltId],
    references: [olts.id],
  }),
  ponPort: one(ponPorts, {
    fields: [onus.ponPortId],
    references: [ponPorts.id],
  }),
  cpes: many(cpes),
}));

export const cpeRelations = relations(cpes, ({ one }) => ({
  onu: one(onus, {
    fields: [cpes.onuId],
    references: [onus.id],
  }),
}));

export const automationRuleRelations = relations(automationRules, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [automationRules.createdBy],
    references: [users.id],
  }),
  actionLogs: many(actionLogs),
}));

export const actionLogRelations = relations(actionLogs, ({ one }) => ({
  executedBy: one(users, {
    fields: [actionLogs.executedBy],
    references: [users.id],
  }),
  automationRule: one(automationRules, {
    fields: [actionLogs.automationRuleId],
    references: [automationRules.id],
  }),
}));

// Insert schemas
export const insertOltSchema = createInsertSchema(olts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOnuSchema = createInsertSchema(onus).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCpeSchema = createInsertSchema(cpes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, createdAt: true });
export const insertAutomationRuleSchema = createInsertSchema(automationRules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertActionLogSchema = createInsertSchema(actionLogs).omit({ id: true, createdAt: true });
export const insertAIInsightSchema = createInsertSchema(aiInsights).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertOlt = z.infer<typeof insertOltSchema>;
export type Olt = typeof olts.$inferSelect;

export type InsertPonPort = typeof ponPorts.$inferInsert;
export type PonPort = typeof ponPorts.$inferSelect;

export type InsertOnu = z.infer<typeof insertOnuSchema>;
export type Onu = typeof onus.$inferSelect;

export type InsertCpe = z.infer<typeof insertCpeSchema>;
export type Cpe = typeof cpes.$inferSelect;

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

export type InsertAutomationRule = z.infer<typeof insertAutomationRuleSchema>;
export type AutomationRule = typeof automationRules.$inferSelect;

export type InsertActionLog = z.infer<typeof insertActionLogSchema>;
export type ActionLog = typeof actionLogs.$inferSelect;

export type InsertAIInsight = z.infer<typeof insertAIInsightSchema>;
export type AIInsight = typeof aiInsights.$inferSelect;
