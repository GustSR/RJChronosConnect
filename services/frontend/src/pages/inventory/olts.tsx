import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Server, 
  MoreHorizontal, 
  Eye,
  Edit,
  RefreshCw,
  Settings,
  Trash2,
  Plus,
  Activity,
  Thermometer,
  Network,
  Users
} from "lucide-react";
import { mockOLTs, OLT } from "@/lib/mockData";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function OLTsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOLT, setSelectedOLT] = useState<OLT | null>(null);

  const filteredOLTs = mockOLTs.filter(olt => {
    const matchesSearch = olt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         olt.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         olt.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || olt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500 text-white';
      case 'warning': return 'bg-yellow-500 text-black';
      case 'offline': return 'bg-red-500 text-white';
      case 'error': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp <= 45) return 'text-green-400';
    if (temp <= 55) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage <= 70) return 'text-green-400';
    if (percentage <= 85) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900 text-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} isConnected={true} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <Server className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-white">OLTs</h1>
            </div>
            <p className="text-gray-400">Gerencie todas as Optical Line Terminals</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Total OLTs</CardTitle>
                <div className="text-2xl font-bold text-white">{mockOLTs.length}</div>
              </CardHeader>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Online</CardTitle>
                <div className="text-2xl font-bold text-green-400">
                  {mockOLTs.filter(o => o.status === 'online').length}
                </div>
              </CardHeader>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Com Problemas</CardTitle>
                <div className="text-2xl font-bold text-yellow-400">
                  {mockOLTs.filter(o => o.status === 'warning').length}
                </div>
              </CardHeader>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Total ONUs</CardTitle>
                <div className="text-2xl font-bold text-blue-400">
                  {mockOLTs.reduce((acc, olt) => acc + olt.activeOnus, 0)}
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Temp. Média</CardTitle>
                <div className="text-2xl font-bold text-orange-400">
                  {(mockOLTs.reduce((acc, olt) => acc + olt.temperature, 0) / mockOLTs.length).toFixed(0)}°C
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    placeholder="Buscar por nome, modelo ou localização..." 
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar OLT
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* OLTs Table */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Lista de OLTs</CardTitle>
              <CardDescription>
                {filteredOLTs.length} de {mockOLTs.length} OLTs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Nome</TableHead>
                    <TableHead className="text-gray-300">Modelo</TableHead>
                    <TableHead className="text-gray-300">Localização</TableHead>
                    <TableHead className="text-gray-300">IP</TableHead>
                    <TableHead className="text-gray-300">ONUs</TableHead>
                    <TableHead className="text-gray-300">Utilização</TableHead>
                    <TableHead className="text-gray-300">Temperatura</TableHead>
                    <TableHead className="text-gray-300">Uptime</TableHead>
                    <TableHead className="text-gray-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOLTs.map((olt) => {
                    const utilization = (olt.activeOnus / olt.totalOnus) * 100;
                    return (
                      <TableRow key={olt.id} className="border-gray-700 hover:bg-gray-700/50">
                        <TableCell>
                          <Badge className={getStatusColor(olt.status)}>
                            {olt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-white">{olt.name}</TableCell>
                        <TableCell className="text-gray-300">{olt.model}</TableCell>
                        <TableCell className="text-gray-300">{olt.location}</TableCell>
                        <TableCell className="text-gray-300">{olt.ipAddress}</TableCell>
                        <TableCell className="text-gray-300">
                          {olt.activeOnus}/{olt.totalOnus}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={utilization} className="w-16 h-2" />
                            <span className={`text-sm ${getUtilizationColor(utilization)}`}>
                              {utilization.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className={getTemperatureColor(olt.temperature)}>
                          {olt.temperature}°C
                        </TableCell>
                        <TableCell className="text-gray-300">{olt.uptime}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-gray-700 border-gray-600">
                              <DropdownMenuItem 
                                className="text-gray-300 hover:bg-gray-600"
                                onClick={() => setSelectedOLT(olt)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-gray-300 hover:bg-gray-600">
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-gray-300 hover:bg-gray-600">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reiniciar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-gray-300 hover:bg-gray-600">
                                <Settings className="mr-2 h-4 w-4" />
                                Configurar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-400 hover:bg-gray-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* OLT Details Modal */}
          <Dialog open={!!selectedOLT} onOpenChange={() => setSelectedOLT(null)}>
            <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl">
              <DialogHeader>
                <DialogTitle className="text-white">Detalhes da OLT</DialogTitle>
                <DialogDescription>
                  Informações detalhadas sobre a Optical Line Terminal
                </DialogDescription>
              </DialogHeader>
              
              {selectedOLT && (
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Informações Básicas</h3>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Nome</label>
                      <p className="text-white">{selectedOLT.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Modelo</label>
                      <p className="text-white">{selectedOLT.model}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Status</label>
                      <Badge className={getStatusColor(selectedOLT.status)}>
                        {selectedOLT.status}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Localização</label>
                      <p className="text-white">{selectedOLT.location}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">IP Address</label>
                      <p className="text-white">{selectedOLT.ipAddress}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Capacidade</h3>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Portas PON</label>
                      <p className="text-white">{selectedOLT.ponPorts}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">ONUs Ativas</label>
                      <p className="text-white">{selectedOLT.activeOnus}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Total ONUs</label>
                      <p className="text-white">{selectedOLT.totalOnus}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Utilização</label>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={(selectedOLT.activeOnus / selectedOLT.totalOnus) * 100} 
                          className="flex-1 h-2" 
                        />
                        <span className={getUtilizationColor((selectedOLT.activeOnus / selectedOLT.totalOnus) * 100)}>
                          {((selectedOLT.activeOnus / selectedOLT.totalOnus) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Status Operacional</h3>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Temperatura</label>
                      <p className={getTemperatureColor(selectedOLT.temperature)}>
                        {selectedOLT.temperature}°C
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Uptime</label>
                      <p className="text-white">{selectedOLT.uptime}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Última Conexão</label>
                      <p className="text-white">{new Date(selectedOLT.lastSeen).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="col-span-3 pt-4 border-t border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Portas PON</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {Array.from({ length: selectedOLT.ponPorts }, (_, i) => (
                        <Card key={i} className="bg-gray-700 border-gray-600">
                          <CardContent className="p-3">
                            <div className="text-sm font-medium text-white">PON {i + 1}</div>
                            <div className="text-xs text-gray-400">
                              {Math.floor(Math.random() * 32)} ONUs
                            </div>
                            <div className={`text-xs ${Math.random() > 0.8 ? 'text-red-400' : 'text-green-400'}`}>
                              {Math.random() > 0.8 ? 'Problema' : 'Normal'}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                  
                  <div className="col-span-3 flex gap-2 pt-4 border-t border-gray-700">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurar
                    </Button>
                    <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reiniciar
                    </Button>
                    <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      <Activity className="w-4 h-4 mr-2" />
                      Monitorar
                    </Button>
                    <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      <Network className="w-4 h-4 mr-2" />
                      Topologia
                    </Button>
                    <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      <Users className="w-4 h-4 mr-2" />
                      Gerenciar ONUs
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
