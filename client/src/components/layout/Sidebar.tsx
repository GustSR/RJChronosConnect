import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Package, 
  Router, 
  Radio, 
  Server, 
  TrendingUp, 
  Settings, 
  Stethoscope, 
  Bot, 
  BarChart3, 
  Bell 
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, current: true },
  { 
    name: "Inventário", 
    href: "/inventory", 
    icon: Package,
    children: [
      { name: "CPEs", href: "/inventory/cpes", icon: Router },
      { name: "ONUs", href: "/inventory/onus", icon: Radio },
      { name: "OLTs", href: "/inventory/olts", icon: Server },
    ]
  },
  { name: "Monitoramento", href: "/monitoring", icon: TrendingUp },
  { name: "Provisionamento", href: "/provisioning", icon: Settings },
  { name: "Diagnóstico", href: "/diagnostics", icon: Stethoscope },
  { name: "IA & Automação", href: "/automation", icon: Bot },
  { name: "Relatórios", href: "/reports", icon: BarChart3 },
  { name: "Alertas", href: "/alerts", icon: Bell, badge: "3" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-dark-surface border-r border-gray-700 flex-shrink-0">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Radio className="text-white text-lg w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">RJChronos</h1>
            <p className="text-xs text-gray-400">Network Management</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          
          return (
            <div key={item.name}>
              <Link href={item.href}>
                <a
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-gray-700 text-gray-300 hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                  {item.badge && (
                    <span className="bg-error text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </a>
              </Link>
              
              {item.children && (
                <div className="ml-6 space-y-1 mt-2">
                  {item.children.map((child) => (
                    <Link key={child.name} href={child.href}>
                      <a className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors text-sm">
                        <child.icon className="w-4 h-4" />
                        <span>{child.name}</span>
                      </a>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
