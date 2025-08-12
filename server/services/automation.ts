import { storage } from "../storage";

interface AutomationCondition {
  field: string;
  operator: string;
  value: any;
  deviceType?: string;
}

interface AutomationAction {
  type: string;
  parameters: Record<string, any>;
}

class AutomationService {
  private isRunning = false;
  private automationInterval: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) {
      console.log('Automation service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting automation service...');

    // Check automation rules every 5 minutes
    this.automationInterval = setInterval(() => {
      this.processAutomationRules();
    }, 300000);

    // Create default automation rules if none exist
    this.createDefaultRules();

    // Initial check
    this.processAutomationRules();
  }

  stop() {
    if (this.automationInterval) {
      clearInterval(this.automationInterval);
      this.automationInterval = null;
    }
    this.isRunning = false;
    console.log('Automation service stopped');
  }

  private async createDefaultRules() {
    try {
      const existingRules = await storage.getAllAutomationRules();
      
      if (existingRules.length === 0) {
        // Create default automation rules
        await storage.createAutomationRule({
          name: 'Auto Reboot Unresponsive CPEs',
          description: 'Automatically reboot CPEs that have been offline for more than 30 minutes',
          triggerCondition: {
            deviceType: 'cpe',
            field: 'status',
            operator: 'equals',
            value: 'offline',
            duration: 1800000 // 30 minutes in milliseconds
          },
          actions: [
            {
              type: 'reboot_device',
              parameters: {}
            },
            {
              type: 'create_alert',
              parameters: {
                severity: 'info',
                title: 'Automatic Reboot Triggered',
                description: 'CPE was automatically rebooted due to being offline'
              }
            }
          ],
          isActive: true,
        });

        await storage.createAutomationRule({
          name: 'Low Signal Alert and Channel Change',
          description: 'Change WiFi channel and create alert when signal strength is low',
          triggerCondition: {
            deviceType: 'cpe',
            field: 'signalStrength',
            operator: 'less_than',
            value: -85
          },
          actions: [
            {
              type: 'update_wifi_channel',
              parameters: {
                channel: 'auto'
              }
            },
            {
              type: 'create_alert',
              parameters: {
                severity: 'warning',
                title: 'Low Signal - Channel Optimized',
                description: 'WiFi channel automatically changed due to low signal strength'
              }
            }
          ],
          isActive: true,
        });

        await storage.createAutomationRule({
          name: 'Critical Optical Power Response',
          description: 'Create critical alert for very low optical power',
          triggerCondition: {
            deviceType: 'onu',
            field: 'rxPower',
            operator: 'less_than',
            value: -30
          },
          actions: [
            {
              type: 'create_alert',
              parameters: {
                severity: 'critical',
                title: 'Critical Optical Power Level',
                description: 'ONU optical power has reached critical levels - immediate attention required'
              }
            }
          ],
          isActive: true,
        });

        console.log('Default automation rules created');
      }
    } catch (error) {
      console.error('Error creating default automation rules:', error);
    }
  }

  private async processAutomationRules() {
    try {
      const activeRules = await storage.getActiveAutomationRules();
      
      for (const rule of activeRules) {
        await this.evaluateRule(rule);
      }
    } catch (error) {
      console.error('Error processing automation rules:', error);
    }
  }

  private async evaluateRule(rule: any) {
    try {
      const condition = rule.triggerCondition as AutomationCondition;
      const actions = rule.actions as AutomationAction[];

      // Get devices based on condition
      let devices: any[] = [];
      
      switch (condition.deviceType) {
        case 'cpe':
          devices = await storage.getAllCpes();
          break;
        case 'onu':
          devices = await storage.getAllOnus();
          break;
        case 'olt':
          devices = await storage.getAllOlts();
          break;
        default:
          return;
      }

      // Evaluate condition for each device
      for (const device of devices) {
        if (this.evaluateCondition(device, condition)) {
          console.log(`Automation rule "${rule.name}" triggered for device ${device.id}`);
          
          // Execute actions
          for (const action of actions) {
            await this.executeAction(device, action, rule.id);
          }

          // Update rule execution count
          await storage.updateAutomationRule(rule.id, {
            executionCount: (rule.executionCount || 0) + 1,
            lastExecuted: new Date(),
          });
        }
      }
    } catch (error) {
      console.error(`Error evaluating automation rule ${rule.id}:`, error);
    }
  }

  private evaluateCondition(device: any, condition: AutomationCondition): boolean {
    const fieldValue = device[condition.field];
    
    if (fieldValue === undefined || fieldValue === null) {
      return false;
    }

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'greater_than':
        return parseFloat(fieldValue) > parseFloat(condition.value);
      case 'less_than':
        return parseFloat(fieldValue) < parseFloat(condition.value);
      case 'contains':
        return fieldValue.toString().includes(condition.value.toString());
      default:
        return false;
    }
  }

  private async executeAction(device: any, action: AutomationAction, ruleId: string) {
    try {
      switch (action.type) {
        case 'reboot_device':
          await this.executeRebootAction(device, action, ruleId);
          break;
        case 'create_alert':
          await this.executeCreateAlertAction(device, action, ruleId);
          break;
        case 'update_wifi_channel':
          await this.executeUpdateWifiChannelAction(device, action, ruleId);
          break;
        default:
          console.log(`Unknown automation action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`Error executing automation action ${action.type}:`, error);
      
      // Log failed action
      await storage.createActionLog({
        deviceId: device.id,
        deviceType: device.constructor.name.toLowerCase(),
        action: action.type,
        description: `Automation action failed: ${action.type}`,
        parameters: action.parameters,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        automationRuleId: ruleId,
        executedBy: null,
      });
    }
  }

  private async executeRebootAction(device: any, action: AutomationAction, ruleId: string) {
    // Simulate reboot action
    await storage.createActionLog({
      deviceId: device.id,
      deviceType: 'cpe',
      action: 'reboot_automatic',
      description: 'Device automatically rebooted by automation rule',
      parameters: action.parameters,
      success: true,
      automationRuleId: ruleId,
      executedBy: null,
    });

    console.log(`Automated reboot initiated for device ${device.id}`);
  }

  private async executeCreateAlertAction(device: any, action: AutomationAction, ruleId: string) {
    await storage.createAlert({
      deviceId: device.id,
      deviceType: device.constructor.name.toLowerCase(),
      severity: action.parameters.severity || 'info',
      title: action.parameters.title || 'Automation Alert',
      description: action.parameters.description || 'Alert created by automation rule',
    });

    await storage.createActionLog({
      deviceId: device.id,
      deviceType: device.constructor.name.toLowerCase(),
      action: 'create_alert_automatic',
      description: 'Alert automatically created by automation rule',
      parameters: action.parameters,
      success: true,
      automationRuleId: ruleId,
      executedBy: null,
    });
  }

  private async executeUpdateWifiChannelAction(device: any, action: AutomationAction, ruleId: string) {
    if (device.constructor.name.toLowerCase() !== 'cpe') {
      return;
    }

    const newChannel = action.parameters.channel === 'auto' 
      ? this.selectOptimalWifiChannel() 
      : action.parameters.channel;

    await storage.updateCpe(device.id, {
      wifiChannel: newChannel,
    });

    await storage.createActionLog({
      deviceId: device.id,
      deviceType: 'cpe',
      action: 'wifi_channel_automatic',
      description: `WiFi channel automatically changed to ${newChannel}`,
      parameters: { newChannel },
      success: true,
      automationRuleId: ruleId,
      executedBy: null,
    });

    console.log(`Automated WiFi channel change for device ${device.id} to channel ${newChannel}`);
  }

  private selectOptimalWifiChannel(): number {
    // Simple algorithm to select optimal WiFi channel
    // In a real implementation, this would analyze interference and usage
    const channels = [1, 6, 11]; // Non-overlapping 2.4GHz channels
    return channels[Math.floor(Math.random() * channels.length)];
  }

  async createAIInsight(type: string, title: string, description: string, deviceId?: string, deviceType?: string) {
    try {
      await storage.createAIInsight({
        type,
        title,
        description,
        confidence: Math.random() * 30 + 70, // Random confidence between 70-100%
        deviceId,
        deviceType,
        metadata: {
          generatedAt: new Date().toISOString(),
          source: 'automation_service'
        },
      });
    } catch (error) {
      console.error('Error creating AI insight:', error);
    }
  }
}

export const automationService = new AutomationService();
