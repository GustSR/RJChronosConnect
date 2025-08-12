import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { tr069Service } from "./services/tr069";
import { monitoringService } from "./services/monitoring";
import { automationService } from "./services/automation";
import { insertCpeSchema, insertOltSchema, insertOnuSchema, insertAlertSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/metrics', isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Device routes
  app.get('/api/devices/olts', isAuthenticated, async (req, res) => {
    try {
      const olts = await storage.getAllOlts();
      res.json(olts);
    } catch (error) {
      console.error("Error fetching OLTs:", error);
      res.status(500).json({ message: "Failed to fetch OLTs" });
    }
  });

  app.post('/api/devices/olts', isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertOltSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid OLT data", errors: validation.error.errors });
      }
      
      const olt = await storage.createOlt(validation.data);
      res.status(201).json(olt);
    } catch (error) {
      console.error("Error creating OLT:", error);
      res.status(500).json({ message: "Failed to create OLT" });
    }
  });

  app.get('/api/devices/onus', isAuthenticated, async (req, res) => {
    try {
      const onus = await storage.getAllOnus();
      res.json(onus);
    } catch (error) {
      console.error("Error fetching ONUs:", error);
      res.status(500).json({ message: "Failed to fetch ONUs" });
    }
  });

  app.post('/api/devices/onus', isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertOnuSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid ONU data", errors: validation.error.errors });
      }
      
      const onu = await storage.createOnu(validation.data);
      res.status(201).json(onu);
    } catch (error) {
      console.error("Error creating ONU:", error);
      res.status(500).json({ message: "Failed to create ONU" });
    }
  });

  app.get('/api/devices/cpes', isAuthenticated, async (req, res) => {
    try {
      const cpes = await storage.getAllCpes();
      res.json(cpes);
    } catch (error) {
      console.error("Error fetching CPEs:", error);
      res.status(500).json({ message: "Failed to fetch CPEs" });
    }
  });

  app.post('/api/devices/cpes', isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertCpeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid CPE data", errors: validation.error.errors });
      }
      
      const cpe = await storage.createCpe(validation.data);
      
      // Register CPE with TR-069 service
      tr069Service.registerCpe(cpe);
      
      res.status(201).json(cpe);
    } catch (error) {
      console.error("Error creating CPE:", error);
      res.status(500).json({ message: "Failed to create CPE" });
    }
  });

  // CPE actions
  app.post('/api/devices/cpes/:id/reboot', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const result = await tr069Service.rebootCpe(id, userId);
      res.json(result);
    } catch (error) {
      console.error("Error rebooting CPE:", error);
      res.status(500).json({ message: "Failed to reboot CPE" });
    }
  });

  app.post('/api/devices/cpes/:id/update-wifi', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { ssid, channel } = req.body;
      const userId = req.user.claims.sub;
      
      const result = await tr069Service.updateWifiConfig(id, { ssid, channel }, userId);
      res.json(result);
    } catch (error) {
      console.error("Error updating WiFi config:", error);
      res.status(500).json({ message: "Failed to update WiFi config" });
    }
  });

  // Alert routes
  app.get('/api/alerts', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const alerts = await storage.getAllAlerts(limit);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.get('/api/alerts/unacknowledged', isAuthenticated, async (req, res) => {
    try {
      const alerts = await storage.getUnacknowledgedAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching unacknowledged alerts:", error);
      res.status(500).json({ message: "Failed to fetch unacknowledged alerts" });
    }
  });

  app.post('/api/alerts', isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertAlertSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid alert data", errors: validation.error.errors });
      }
      
      const alert = await storage.createAlert(validation.data);
      res.status(201).json(alert);
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(500).json({ message: "Failed to create alert" });
    }
  });

  app.patch('/api/alerts/:id/acknowledge', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const alert = await storage.acknowledgeAlert(id, userId);
      res.json(alert);
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ message: "Failed to acknowledge alert" });
    }
  });

  // Action logs
  app.get('/api/action-logs', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const logs = await storage.getRecentActionLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching action logs:", error);
      res.status(500).json({ message: "Failed to fetch action logs" });
    }
  });

  // AI insights
  app.get('/api/ai-insights', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const insights = await storage.getRecentAIInsights(limit);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      res.status(500).json({ message: "Failed to fetch AI insights" });
    }
  });

  // Automation rules
  app.get('/api/automation/rules', isAuthenticated, async (req, res) => {
    try {
      const rules = await storage.getAllAutomationRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching automation rules:", error);
      res.status(500).json({ message: "Failed to fetch automation rules" });
    }
  });

  // TR-069 ACS endpoints
  app.post('/tr069/acs', (req, res) => {
    tr069Service.handleAcsRequest(req, res);
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    // Send initial data
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to RJChronos monitoring service'
    }));

    // Set up periodic updates
    const interval = setInterval(async () => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          const metrics = await storage.getDashboardMetrics();
          const alerts = await storage.getUnacknowledgedAlerts();
          
          ws.send(JSON.stringify({
            type: 'metrics_update',
            data: {
              metrics,
              alertCount: alerts.length,
              timestamp: new Date().toISOString()
            }
          }));
        } catch (error) {
          console.error('Error sending WebSocket update:', error);
        }
      }
    }, 30000); // Update every 30 seconds

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clearInterval(interval);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clearInterval(interval);
    });
  });

  // Start monitoring and automation services
  monitoringService.start();
  automationService.start();

  return httpServer;
}
