import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Router, Radio, Server, Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { mockCPEs, mockONUs, mockOLTs } from "@/lib/mockData";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";

export default function InventoryPage() {
  const { user } = useAuth();
  
  const totalDevices = mockCPEs.length + mockONUs.length + mockOLTs.length;
  const onlineDevices = [
    ...mockCPEs.filter(d => d.status === 'online'),
    ...mockONUs.filter(d => d.status === 'online'),
    ...mockOLTs.filter(d => d.status === 'online')
  ].length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900 text-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} isConnected={true} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Inventário de Dispositivos</h1>
            <p className="text-gray-400">Gerencie todos os dispositivos da sua rede</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Total de Dispositivos</CardTitle>
                <div className="text-2xl font-bold text-white">{totalDevices}</div>
              </CardHeader>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Dispositivos Online</CardTitle>
                <div className="text-2xl font-bold text-green-400">{onlineDevices}</div>
              </CardHeader>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Taxa de Disponibilidade</CardTitle>
                <div className="text-2xl font-bold text-blue-400">{((onlineDevices / totalDevices) * 100).toFixed(1)}%</div>
              </CardHeader>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Alertas Ativos</CardTitle>
                <div className="text-2xl font-bold text-yellow-400">5</div>
              </CardHeader>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Buscar dispositivos..." 
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-700">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Dispositivo
            </Button>
          </div>

          {/* Device Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CPEs */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Router className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">CPEs</CardTitle>
                      <CardDescription>Customer Premise Equipment</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                    {mockCPEs.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {mockCPEs.slice(0, 3).map((cpe) => (
                    <div key={cpe.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(cpe.status)}`} />
                        <div>
                          <div className="text-sm font-medium text-white">{cpe.serialNumber}</div>
                          <div className="text-xs text-gray-400">{cpe.model}</div>
                        </div>
                      </div>
                      <Badge 
                        variant={cpe.status === 'online' ? 'default' : 'destructive'}
                        className={cpe.status === 'online' ? 'bg-green-600' : ''}
                      >
                        {cpe.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Link href="/inventory/cpes">
                  <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                    Ver Todos os CPEs
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* ONUs */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <Radio className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">ONUs</CardTitle>
                      <CardDescription>Optical Network Units</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                    {mockONUs.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {mockONUs.slice(0, 3).map((onu) => (
                    <div key={onu.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(onu.status)}`} />
                        <div>
                          <div className="text-sm font-medium text-white">{onu.serialNumber}</div>
                          <div className="text-xs text-gray-400">PON {onu.ponPort}/{onu.onuIndex}</div>
                        </div>
                      </div>
                      <Badge 
                        variant={onu.status === 'online' ? 'default' : 'destructive'}
                        className={onu.status === 'online' ? 'bg-green-600' : ''}
                      >
                        {onu.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Link href="/inventory/onus">
                  <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                    Ver Todas as ONUs
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* OLTs */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <Server className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">OLTs</CardTitle>
                      <CardDescription>Optical Line Terminals</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                    {mockOLTs.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {mockOLTs.map((olt) => (
                    <div key={olt.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(olt.status)}`} />
                        <div>
                          <div className="text-sm font-medium text-white">{olt.name}</div>
                          <div className="text-xs text-gray-400">{olt.activeOnus}/{olt.totalOnus} ONUs</div>
                        </div>
                      </div>
                      <Badge 
                        variant={olt.status === 'online' ? 'default' : 'destructive'}
                        className={olt.status === 'online' ? 'bg-green-600' : ''}
                      >
                        {olt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Link href="/inventory/olts">
                  <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                    Ver Todas as OLTs
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
