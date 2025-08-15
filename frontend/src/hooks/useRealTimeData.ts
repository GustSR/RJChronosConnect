import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { RealtimeMetrics, SystemStatus } from '@/types';

interface UseRealTimeDataOptions {
  endpoint?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useRealTimeData = (options: UseRealTimeDataOptions = {}) => {
  const {
    endpoint = 'ws://localhost:8000',
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000
  } = options;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<RealtimeMetrics[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout>();

  const connect = () => {
    try {
      const newSocket = io(endpoint, {
        transports: ['websocket'],
        timeout: 10000,
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        setConnectionError(null);
        reconnectCount.current = 0;
        console.log('WebSocket connected');
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
        
        if (reconnectCount.current < reconnectAttempts) {
          reconnectTimer.current = setTimeout(() => {
            reconnectCount.current++;
            connect();
          }, reconnectInterval);
        }
      });

      newSocket.on('connect_error', (error) => {
        setConnectionError(error.message);
        setIsConnected(false);
      });

      newSocket.on('metrics', (data: RealtimeMetrics) => {
        setMetrics(prev => {
          const updated = [...prev];
          const existingIndex = updated.findIndex(m => m.deviceId === data.deviceId);
          
          if (existingIndex >= 0) {
            updated[existingIndex] = data;
          } else {
            updated.push(data);
          }
          
          // Keep only last 100 entries per device
          return updated.slice(-100);
        });
      });

      newSocket.on('system_status', (data: SystemStatus) => {
        setSystemStatus(data);
      });

      setSocket(newSocket);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
    }
  };

  const disconnect = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }
    
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    setIsConnected(false);
  };

  const subscribeToDevice = (deviceId: string) => {
    if (socket && isConnected) {
      socket.emit('subscribe_device', deviceId);
    }
  };

  const unsubscribeFromDevice = (deviceId: string) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe_device', deviceId);
    }
  };

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    connectionError,
    metrics,
    systemStatus,
    connect,
    disconnect,
    subscribeToDevice,
    unsubscribeFromDevice
  };
};
