import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Radio, 
  MoreHorizontal, 
  Eye,
  Edit,
  RefreshCw,
  Settings,
  Trash2,
  Plus,
  Activity,
  Signal
} from "lucide-react";
import { mockONUs, ONU } from "@/lib/mockData";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function ONUsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedONU, setSelectedONU] = useState<ONU | null>(null);

  const filteredONUs = mockONUs.filter(onu => {
    const matchesSearch = onu.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         onu.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || onu.status === statusFilter;
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

  const getPowerColor = (power: number, type: 'rx' | 'tx') => {
    if (type === 'rx') {
      if (power >= -20) return 'text-green-400';
      if (power >= -25) return 'text-yellow-400';
      return 'text-red-400';
    } else {
      if (power >= 0) return 'text-green-400';
      if (power >= -3) return 'text-yellow-400';
      return 'text-red-400';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900 text-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} isConnected={true} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <Radio className="w-8 h-8 text-green-400" />
              <h1 className="text-3xl font-bold text-white">ONUs</h1>
            </div>
            <p className="text-gray-400">Gerencie todas as Optical Network Units</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Total ONUs</CardTitle>
                <div className="text-2xl font-bold text-white">{mockONUs.length}</div>
              </CardHeader>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Online</CardTitle>
                <div className="text-2xl font-bold text-green-400">
                  {mockONUs.filter(o => o.status === 'online').length}
                </div>
              </CardHeader>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Com Problemas</CardTitle>
                <div className="text-2xl font-bold text-yellow-400">
                  {mockONUs.filter(o => o.status === 'warning').length}
                </div>
              </CardHeader>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Offline</CardTitle>
                <div className="text-2xl font-bold text-red-400">
                  {mockONUs.filter(o => o.status === 'offline').length}
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Potência Média RX</CardTitle>
                <div className="text-2xl font-bold text-blue-400">
                  {(mockONUs.reduce((acc, onu) => acc + onu.rxPower, 0) / mockONUs.length).toFixed(1)}dBm
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
                    placeholder="Buscar por serial ou modelo..." 
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
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar ONU
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ONUs Table */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Lista de ONUs</CardTitle>
              <CardDescription>
                {filteredONUs.length} de {mockONUs.length} ONUs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Serial Number</TableHead>
                    <TableHead className="text-gray-300">Modelo</TableHead>
                    <TableHead className="text-gray-300">OLT</TableHead>
                    <TableHead className="text-gray-300">PON/Index</TableHead>
                    <TableHead className="text-gray-300">RX Power</TableHead>
                    <TableHead className="text-gray-300">TX Power</TableHead>
                    <TableHead className="text-gray-300">Distância</TableHead>
                    <TableHead className="text-gray-300">CPEs</TableHead>
                    <TableHead className="text-gray-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredONUs.map((onu) => (
                    <TableRow key={onu.id} className="border-gray-700 hover:bg-gray-700/50">
                      <TableCell>
                        <Badge className={getStatusColor(onu.status)}>
                          {onu.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-white">{onu.serialNumber}</TableCell>
                      <TableCell className="text-gray-300">{onu.model}</TableCell>
                      <TableCell className="text-gray-300">{onu.oltId}</TableCell>
                      <TableCell className="text-gray-300">{onu.ponPort}/{onu.onuIndex}</TableCell>
                      <TableCell className={getPowerColor(onu.rxPower, 'rx')}>
                        {onu.rxPower}dBm
                      </TableCell>
                      <TableCell className={getPowerColor(onu.txPower, 'tx')}>
                        {onu.txPower}dBm
                      </TableCell>
                      <TableCell className="text-gray-300">{onu.distance}m</TableCell>
                      <TableCell className="text-gray-300">{onu.cpes.length}</TableCell>
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
                              onClick={() => setSelectedONU(onu)}
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

          {/* ONU Details Modal */}
          <Dialog open={!!selectedONU} onOpenChange={() => setSelectedONU(null)}>
            <DialogContent className="bg-gray-800 border-gray-700 max-w-3xl">
              <DialogHeader>
                <DialogTitle className="text-white">Detalhes da ONU</DialogTitle>
                <DialogDescription>
                  Informações detalhadas sobre a Optical Network Unit
                </DialogDescription>
              </DialogHeader>
              
              {selectedONU && (
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Informações Básicas</h3>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Serial Number</label>
                      <p className="text-white">{selectedONU.serialNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Modelo</label>
                      <p className="text-white">{selectedONU.model}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Status</label>
                      <Badge className={getStatusColor(selectedONU.status)}>
                        {selectedONU.status}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Última Conexão</label>
                      <p className="text-white">{new Date(selectedONU.lastSeen).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Conectividade</h3>
                    <div>
                      <label className="text-sm font-medium text-gray-400">OLT</label>
                      <p className="text-white">{selectedONU.oltId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Porta PON</label>
                      <p className="text-white">{selectedONU.ponPort}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Índice ONU</label>
                      <p className="text-white">{selectedONU.onuIndex}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Distância</label>
                      <p className="text-white">{selectedONU.distance}m</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Sinais Ópticos</h3>
                    <div>
                      <label className="text-sm font-medium text-gray-400">RX Power</label>
                      <p className={getPowerColor(selectedONU.rxPower, 'rx')}>
                        {selectedONU.rxPower}dBm
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">TX Power</label>
                      <p className={getPowerColor(selectedONU.txPower, 'tx')}>
                        {selectedONU.txPower}dBm
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">CPEs Conectados</label>
                      <p className="text-white">{selectedONU.cpes.length}</p>
                    </div>
                  </div>
                  
                  <div className="col-span-3 flex gap-2 pt-4 border-t border-gray-700">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurar
                    </Button>
                    <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reiniciar
                    </Button>
                    <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      <Activity className="w-4 h-4 mr-2" />
                      Teste de Conectividade
                    </Button>
                    <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      <Signal className="w-4 h-4 mr-2" />
                      Análise de Sinal
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
