import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/lib/websocket";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MetricCard from "@/components/dashboard/MetricCard";
import NetworkStatusChart from "@/components/dashboard/NetworkStatusChart";
import RecentAlerts from "@/components/dashboard/RecentAlerts";
import NetworkTopology from "@/components/dashboard/NetworkTopology";
import DevicePerformance from "@/components/dashboard/DevicePerformance";
import AIInsights from "@/components/dashboard/AIInsights";
import RecentActions from "@/components/dashboard/RecentActions";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { isConnected, lastMessage } = useWebSocket();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    retry: false,
  });

  const { data: alerts } = useQuery({
    queryKey: ["/api/alerts", "5"],
    retry: false,
  });

  const { data: actionLogs } = useQuery({
    queryKey: ["/api/action-logs", "10"],
    retry: false,
  });

  const { data: aiInsights } = useQuery({
    queryKey: ["/api/ai-insights", "5"],
    retry: false,
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage?.type === 'metrics_update') {
      // You could update the query cache here or show a notification
      console.log('Received metrics update:', lastMessage.data);
    }
  }, [lastMessage]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="flex h-screen overflow-hidden bg-dark-bg text-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} isConnected={isConnected} />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Dispositivos Online"
              value={metrics?.devicesOnline?.toString() || "0"}
              change="+12 nas últimas 24h"
              trend="up"
              icon="router"
              color="success"
              isLoading={metricsLoading}
            />
            <MetricCard
              title="Alertas Críticos"
              value={metrics?.criticalAlerts?.toString() || "0"}
              change="+2 nas últimas 24h"
              trend="up"
              icon="alert"
              color="error"
              isLoading={metricsLoading}
            />
            <MetricCard
              title="Taxa de Falhas"
              value={`${metrics?.failureRate || 0}%`}
              change="-0.05% nas últimas 24h"
              trend="down"
              icon="chart"
              color="warning"
              isLoading={metricsLoading}
            />
            <MetricCard
              title="Automações Ativas"
              value={metrics?.automations?.toString() || "0"}
              change="12 executadas hoje"
              trend="neutral"
              icon="robot"
              color="info"
              isLoading={metricsLoading}
            />
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <NetworkStatusChart />
            </div>
            <RecentAlerts alerts={alerts || []} />
          </div>

          {/* Network Topology and Device Status */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            <NetworkTopology />
            <DevicePerformance />
          </div>

          {/* AI Insights and Recent Actions */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AIInsights insights={aiInsights || []} />
            <RecentActions actions={actionLogs || []} />
          </div>
        </main>
      </div>
    </div>
  );
}
