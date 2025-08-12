import { storage } from "../storage";

class MonitoringService {
  private isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) {
      console.log('Monitoring service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting monitoring service...');

    // Check device status every 2 minutes
    this.monitoringInterval = setInterval(() => {
      this.checkDeviceStatus();
    }, 120000);

    // Initial check
    this.checkDeviceStatus();
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isRunning = false;
    console.log('Monitoring service stopped');
  }

  private async checkDeviceStatus() {
    try {
      await this.checkCpeStatus();
      await this.checkOnuStatus();
      await this.checkOltStatus();
    } catch (error) {
      console.error('Error in monitoring service:', error);
    }
  }

  private async checkCpeStatus() {
    try {
      const cpes = await storage.getAllCpes();
      const now = new Date();
      const offlineThreshold = 10 * 60 * 1000; // 10 minutes

      for (const cpe of cpes) {
        if (!cpe.lastSeen) continue;

        const lastSeenTime = new Date(cpe.lastSeen).getTime();
        const timeDiff = now.getTime() - lastSeenTime;

        // Check if CPE should be marked offline
        if (timeDiff > offlineThreshold && cpe.status === 'online') {
          await storage.updateCpe(cpe.id, { status: 'offline' });
          
          // Create alert for offline CPE
          await storage.createAlert({
            deviceId: cpe.id,
            deviceType: 'cpe',
            severity: 'error',
            title: 'CPE Offline',
            description: `CPE ${cpe.serialNumber} has gone offline. Last seen: ${cpe.lastSeen}`,
          });

          console.log(`CPE ${cpe.serialNumber} marked as offline`);
        }

        // Check for warning conditions
        if (cpe.signalStrength && parseFloat(cpe.signalStrength) < -80) {
          await storage.createAlert({
            deviceId: cpe.id,
            deviceType: 'cpe',
            severity: 'warning',
            title: 'Low Signal Strength',
            description: `CPE ${cpe.serialNumber} has low signal strength: ${cpe.signalStrength} dBm`,
          });
        }
      }
    } catch (error) {
      console.error('Error checking CPE status:', error);
    }
  }

  private async checkOnuStatus() {
    try {
      const onus = await storage.getAllOnus();
      
      for (const onu of onus) {
        // Check optical power levels
        if (onu.rxPower && parseFloat(onu.rxPower) < -27) {
          await storage.createAlert({
            deviceId: onu.id,
            deviceType: 'onu',
            severity: 'warning',
            title: 'Low Optical Power',
            description: `ONU ${onu.serialNumber} has low RX power: ${onu.rxPower} dBm`,
          });
        }

        if (onu.rxPower && parseFloat(onu.rxPower) < -30) {
          await storage.createAlert({
            deviceId: onu.id,
            deviceType: 'onu',
            severity: 'critical',
            title: 'Critical Optical Power',
            description: `ONU ${onu.serialNumber} has critical RX power: ${onu.rxPower} dBm`,
          });
        }

        // Check temperature
        if (onu.temperature && parseFloat(onu.temperature) > 70) {
          await storage.createAlert({
            deviceId: onu.id,
            deviceType: 'onu',
            severity: 'warning',
            title: 'High Temperature',
            description: `ONU ${onu.serialNumber} temperature is high: ${onu.temperature}°C`,
          });
        }
      }
    } catch (error) {
      console.error('Error checking ONU status:', error);
    }
  }

  private async checkOltStatus() {
    try {
      const olts = await storage.getAllOlts();
      const now = new Date();
      const offlineThreshold = 5 * 60 * 1000; // 5 minutes

      for (const olt of olts) {
        if (!olt.lastSeen) continue;

        const lastSeenTime = new Date(olt.lastSeen).getTime();
        const timeDiff = now.getTime() - lastSeenTime;

        // Check if OLT should be marked offline
        if (timeDiff > offlineThreshold && olt.status === 'online') {
          await storage.updateOlt(olt.id, { status: 'offline' });
          
          // Create critical alert for offline OLT
          await storage.createAlert({
            deviceId: olt.id,
            deviceType: 'olt',
            severity: 'critical',
            title: 'OLT Offline',
            description: `OLT ${olt.name} has gone offline. This affects all connected ONUs and CPEs.`,
          });

          console.log(`OLT ${olt.name} marked as offline`);
        }
      }
    } catch (error) {
      console.error('Error checking OLT status:', error);
    }
  }

  async simulateNetworkActivity() {
    // This method can be used to simulate network activity for demo purposes
    try {
      const cpes = await storage.getAllCpes();
      
      for (const cpe of cpes.slice(0, 10)) { // Update first 10 CPEs
        if (Math.random() > 0.1) { // 90% chance to stay online
          await storage.updateCpe(cpe.id, {
            status: 'online',
            lastSeen: new Date(),
            signalStrength: (-50 + Math.random() * 30).toFixed(1), // -50 to -80 dBm
            uptime: (cpe.uptime || 0) + 120,
          });
        }
      }
    } catch (error) {
      console.error('Error simulating network activity:', error);
    }
  }
}

export const monitoringService = new MonitoringService();
