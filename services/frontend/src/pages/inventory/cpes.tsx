import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Router,
  Wifi,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { mockCPEs, CPE } from "@/lib/mockData";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function CPEsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCPE, setSelectedCPE] = useState<CPE | null>(null);

  const filteredCPEs = mockCPEs.filter(cpe => {
    const matchesSearch = cpe.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cpe.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cpe.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || cpe.status === statusFilter;
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

  const getSignalColor = (signal: number) => {
    if (signal >= -50) return 'text-green-400';
    if (signal >= -60) return 'text-yellow-400';
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
              <Router className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">CPEs</h1>
            </div>
            <p className="text-gray-400">Gerencie todos os Customer Premise Equipment</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Total CPEs</CardTitle>
                <div className="text-2xl font-bold text-white">{mockCPEs.length}</div>
              </CardHeader>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Online</CardTitle>
                <div className="text-2xl font-bold text-green-400">
                  {mockCPEs.filter(c => c.status === 'online').length}
                </div>
              </CardHeader>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Com Problemas</CardTitle>
                <div className="text-2xl font-bold text-yellow-400">
                  {mockCPEs.filter(c => c.status === 'warning').length}
                </div>
              </CardHeader>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Offline</CardTitle>
                <div className="text-2xl font-bold text-red-400">
                  {mockCPEs.filter(c => c.status === 'offline').length}
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
                    placeholder="Buscar por serial, cliente ou localização..." 
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
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar CPE
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CPEs Table */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Lista de CPEs</CardTitle>
              <CardDescription>
                {filteredCPEs.length} de {mockCPEs.length} CPEs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Serial Number</TableHead>
                    <TableHead className="text-gray-300">Modelo</TableHead>
                    <TableHead className="text-gray-300">Cliente</TableHead>
                    <TableHead className="text-gray-300">Localização</TableHead>
                    <TableHead className="text-gray-300">IP</TableHead>
                    <TableHead className="text-gray-300">Sinal</TableHead>
                    <TableHead className="text-gray-300">Uptime</TableHead>
                    <TableHead className="text-gray-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCPEs.map((cpe) => (
                    <TableRow key={cpe.id} className="border-gray-700 hover:bg-gray-700/50">
                      <TableCell>
                        <Badge className={getStatusColor(cpe.status)}>
                          {cpe.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-white">{cpe.serialNumber}</TableCell>
                      <TableCell className="text-gray-300">{cpe.model}</TableCell>
                      <TableCell className="text-gray-300">{cpe.customer}</TableCell>
                      <TableCell className="text-gray-300">{cpe.location}</TableCell>
                      <TableCell className="text-gray-300">{cpe.ipAddress}</TableCell>
                      <TableCell className={getSignalColor(cpe.signalStrength)}>
                        {cpe.signalStrength}dBm
                      </TableCell>
                      <TableCell className="text-gray-300">{cpe.uptime}</TableCell>
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
                              onClick={() => setSelectedCPE(cpe)}
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* CPE Details Modal */}
          <Dialog open={!!selectedCPE} onOpenChange={() => setSelectedCPE(null)}>
            <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Detalhes do CPE</DialogTitle>
                <DialogDescription>
                  Informações detalhadas sobre o dispositivo
                </DialogDescription>
              </DialogHeader>
              
              {selectedCPE && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Serial Number</label>
                      <p className="text-white">{selectedCPE.serialNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Modelo</label>
                      <p className="text-white">{selectedCPE.model}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Firmware</label>
                      <p className="text-white">{selectedCPE.firmware}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Status</label>
                      <Badge className={getStatusColor(selectedCPE.status)}>
                        {selectedCPE.status}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Cliente</label>
                      <p className="text-white">{selectedCPE.customer}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">IP Address</label>
                      <p className="text-white">{selectedCPE.ipAddress}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">MAC Address</label>
                      <p className="text-white">{selectedCPE.macAddress}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Localização</label>
                      <p className="text-white">{selectedCPE.location}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Sinal</label>
                      <p className={getSignalColor(selectedCPE.signalStrength)}>
                        {selectedCPE.signalStrength}dBm
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Uptime</label>
                      <p className="text-white">{selectedCPE.uptime}</p>
                    </div>
                  </div>
                  
                  <div className="col-span-2 flex gap-2 pt-4">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurar
                    </Button>
                    <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reiniciar
                    </Button>
                    <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      <Download className="w-4 h-4 mr-2" />
                      Backup Config
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