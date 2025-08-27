import { Button } from "@/components/ui/button";
import { Bell, Settings, User } from "lucide-react";
 import type { User as UserType } from "@shared/schema";

 interface HeaderProps {
   user: UserType | null;
   isConnected: boolean;
 }

 export default function Header({ user, isConnected }: HeaderProps) {
  return (
    <header className="bg-dark-surface border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Dashboard - Visão Geral</h2>
          <p className="text-sm text-gray-400">Monitoramento em tempo real da rede</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-error'}`}></div>
            <span className="text-sm text-gray-300">
              {isConnected ? 'Sistema Online' : 'Conectando...'}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
              <Bell className="text-gray-400 w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
              <Settings className="text-gray-400 w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="text-white text-sm w-4 h-4" />
              </div>
               <span className="text-sm text-gray-300">
                 {user?.firstName || user?.email || 'Admin'}
               </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
                className="text-gray-400 hover:text-white text-sm"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
