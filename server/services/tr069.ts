import { type Request, type Response } from "express";
import { storage } from "../storage";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

interface TR069Session {
  serialNumber: string;
  lastActivity: Date;
  authenticated: boolean;
}

interface CPEMethod {
  name: string;
  parameters?: Record<string, any>;
}

class TR069Service {
  private sessions: Map<string, TR069Session> = new Map();
  private xmlParser = new XMLParser({ ignoreAttributes: false });
  private xmlBuilder = new XMLBuilder({ ignoreAttributes: false });

  async handleAcsRequest(req: Request, res: Response) {
    try {
      const body = req.body;
      const soapEnvelope = this.xmlParser.parse(body);
      
      // Extract CPE identifier (serial number or other unique ID)
      const serialNumber = this.extractSerialNumber(soapEnvelope);
      
      if (!serialNumber) {
        return res.status(400).send('Invalid CPE request');
      }

      // Handle different TR-069 methods
      const method = this.extractMethod(soapEnvelope);
      
      switch (method) {
        case 'Inform':
          await this.handleInform(serialNumber, soapEnvelope, res);
          break;
        case 'GetRPCMethodsResponse':
          await this.handleGetRPCMethodsResponse(serialNumber, soapEnvelope, res);
          break;
        case 'GetParameterValuesResponse':
          await this.handleGetParameterValuesResponse(serialNumber, soapEnvelope, res);
          break;
        case 'SetParameterValuesResponse':
          await this.handleSetParameterValuesResponse(serialNumber, soapEnvelope, res);
          break;
        case 'RebootResponse':
          await this.handleRebootResponse(serialNumber, soapEnvelope, res);
          break;
        default:
          await this.handleUnknownMethod(serialNumber, method, res);
      }
    } catch (error) {
      console.error('TR-069 ACS error:', error);
      res.status(500).send('Internal server error');
    }
  }

  private extractSerialNumber(soapEnvelope: any): string | null {
    try {
      // Try to extract from Inform message
      const inform = soapEnvelope?.['soap:Envelope']?.['soap:Body']?.['cwmp:Inform'];
      if (inform?.DeviceId?.SerialNumber) {
        return inform.DeviceId.SerialNumber;
      }

      // Try to extract from other message types
      const body = soapEnvelope?.['soap:Envelope']?.['soap:Body'];
      for (const key in body) {
        if (body[key]?.DeviceId?.SerialNumber) {
          return body[key].DeviceId.SerialNumber;
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting serial number:', error);
      return null;
    }
  }

  private extractMethod(soapEnvelope: any): string {
    try {
      const body = soapEnvelope?.['soap:Envelope']?.['soap:Body'];
      const methods = Object.keys(body || {});
      
      if (methods.length > 0) {
        const method = methods[0];
        return method.replace('cwmp:', '');
      }
      
      return 'Unknown';
    } catch (error) {
      console.error('Error extracting method:', error);
      return 'Unknown';
    }
  }

  private async handleInform(serialNumber: string, soapEnvelope: any, res: Response) {
    try {
      // Update CPE status and information
      const cpe = await storage.getCpeBySerial(serialNumber);
      
      if (cpe) {
        await storage.updateCpe(cpe.id, {
          status: 'online',
          lastSeen: new Date(),
        });

        // Log action
        await storage.createActionLog({
          deviceId: cpe.id,
          deviceType: 'cpe',
          action: 'inform_received',
          description: 'CPE sent Inform message',
          success: true,
          executedBy: null,
        });
      } else {
        // Auto-provision new CPE (Zero-Touch Provisioning)
        await this.autoProvisionCpe(serialNumber, soapEnvelope);
      }

      // Send InformResponse
      const response = this.buildInformResponse();
      res.set('Content-Type', 'text/xml');
      res.send(response);
    } catch (error) {
      console.error('Error handling Inform:', error);
      res.status(500).send('Error processing Inform');
    }
  }

  private async autoProvisionCpe(serialNumber: string, soapEnvelope: any) {
    try {
      const inform = soapEnvelope?.['soap:Envelope']?.['soap:Body']?.['cwmp:Inform'];
      const deviceId = inform?.DeviceId;
      
      // Create new CPE with default configuration
      const newCpe = await storage.createCpe({
        serialNumber,
        model: deviceId?.ProductClass || 'Unknown',
        firmwareVersion: deviceId?.SoftwareVersion || 'Unknown',
        status: 'online',
        wifiEnabled: true,
        lastSeen: new Date(),
      });

      // Create alert for new device
      await storage.createAlert({
        deviceId: newCpe.id,
        deviceType: 'cpe',
        severity: 'info',
        title: 'New CPE Auto-Provisioned',
        description: `CPE ${serialNumber} was automatically discovered and provisioned`,
      });

      console.log(`Auto-provisioned new CPE: ${serialNumber}`);
    } catch (error) {
      console.error('Error auto-provisioning CPE:', error);
    }
  }

  private async handleGetRPCMethodsResponse(serialNumber: string, soapEnvelope: any, res: Response) {
    const response = this.buildEmptyResponse();
    res.set('Content-Type', 'text/xml');
    res.send(response);
  }

  private async handleGetParameterValuesResponse(serialNumber: string, soapEnvelope: any, res: Response) {
    const response = this.buildEmptyResponse();
    res.set('Content-Type', 'text/xml');
    res.send(response);
  }

  private async handleSetParameterValuesResponse(serialNumber: string, soapEnvelope: any, res: Response) {
    const response = this.buildEmptyResponse();
    res.set('Content-Type', 'text/xml');
    res.send(response);
  }

  private async handleRebootResponse(serialNumber: string, soapEnvelope: any, res: Response) {
    try {
      const cpe = await storage.getCpeBySerial(serialNumber);
      if (cpe) {
        await storage.createActionLog({
          deviceId: cpe.id,
          deviceType: 'cpe',
          action: 'reboot_completed',
          description: 'CPE reboot completed successfully',
          success: true,
          executedBy: null,
        });
      }

      const response = this.buildEmptyResponse();
      res.set('Content-Type', 'text/xml');
      res.send(response);
    } catch (error) {
      console.error('Error handling RebootResponse:', error);
      res.status(500).send('Error processing RebootResponse');
    }
  }

  private async handleUnknownMethod(serialNumber: string, method: string, res: Response) {
    console.log(`Unknown TR-069 method: ${method} from CPE: ${serialNumber}`);
    const response = this.buildEmptyResponse();
    res.set('Content-Type', 'text/xml');
    res.send(response);
  }

  async rebootCpe(cpeId: string, userId: string) {
    try {
      const cpe = await storage.getCpe(cpeId);
      if (!cpe) {
        throw new Error('CPE not found');
      }

      // In a real implementation, this would send a Reboot RPC to the CPE
      // For now, we'll simulate the action
      await storage.createActionLog({
        deviceId: cpeId,
        deviceType: 'cpe',
        action: 'reboot_requested',
        description: 'CPE reboot requested via ACS',
        success: true,
        executedBy: userId,
      });

      return { success: true, message: 'Reboot command sent to CPE' };
    } catch (error) {
      console.error('Error rebooting CPE:', error);
      
      await storage.createActionLog({
        deviceId: cpeId,
        deviceType: 'cpe',
        action: 'reboot_requested',
        description: 'CPE reboot request failed',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        executedBy: userId,
      });

      throw error;
    }
  }

  async updateWifiConfig(cpeId: string, config: { ssid?: string; channel?: number }, userId: string) {
    try {
      const cpe = await storage.getCpe(cpeId);
      if (!cpe) {
        throw new Error('CPE not found');
      }

      // Update CPE configuration
      const updateData: any = {};
      if (config.ssid) updateData.wifiSSID = config.ssid;
      if (config.channel) updateData.wifiChannel = config.channel;

      await storage.updateCpe(cpeId, updateData);

      await storage.createActionLog({
        deviceId: cpeId,
        deviceType: 'cpe',
        action: 'wifi_config_updated',
        description: `WiFi configuration updated: ${JSON.stringify(config)}`,
        parameters: config,
        success: true,
        executedBy: userId,
      });

      return { success: true, message: 'WiFi configuration updated' };
    } catch (error) {
      console.error('Error updating WiFi config:', error);
      
      await storage.createActionLog({
        deviceId: cpeId,
        deviceType: 'cpe',
        action: 'wifi_config_updated',
        description: 'WiFi configuration update failed',
        parameters: config,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        executedBy: userId,
      });

      throw error;
    }
  }

  registerCpe(cpe: any) {
    // Register CPE for TR-069 communication
    console.log(`Registered CPE for TR-069: ${cpe.serialNumber}`);
  }

  private buildInformResponse(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cwmp="urn:dslforum-org:cwmp-1-0">
  <soap:Header>
    <cwmp:ID soap:mustUnderstand="1">1</cwmp:ID>
  </soap:Header>
  <soap:Body>
    <cwmp:InformResponse>
      <MaxEnvelopes>1</MaxEnvelopes>
    </cwmp:InformResponse>
  </soap:Body>
</soap:Envelope>`;
  }

  private buildEmptyResponse(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cwmp="urn:dslforum-org:cwmp-1-0">
  <soap:Header>
    <cwmp:ID soap:mustUnderstand="1">1</cwmp:ID>
  </soap:Header>
  <soap:Body>
  </soap:Body>
</soap:Envelope>`;
  }
}

export const tr069Service = new TR069Service();
