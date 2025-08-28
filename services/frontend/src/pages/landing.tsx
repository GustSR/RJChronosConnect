import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Network, Shield, Zap, Brain } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-dark-bg text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-700 bg-dark-surface">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Network className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">RJChronos</h1>
                <p className="text-xs text-gray-400">Network Management Platform</p>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-primary hover:bg-primary/90"
            >
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Sistema Completo de Gestão de Rede
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
            Monitore, gerencie e automatize sua infraestrutura de rede com tecnologia avançada. 
            ACS Server TR-069, IA para automação e dashboard em tempo real.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/api/login'}
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-3"
          >
            Começar Agora
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Funcionalidades Principais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-dark-card border-gray-700">
              <CardHeader>
                <Network className="w-12 h-12 text-primary mb-4" />
                <CardTitle className="text-white">ACS Server TR-069</CardTitle>
                <CardDescription className="text-gray-400">
                  Comunicação direta com CPEs para controle remoto e monitoramento
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-dark-card border-gray-700">
              <CardHeader>
                <Shield className="w-12 h-12 text-success mb-4" />
                <CardTitle className="text-white">Monitoramento 24/7</CardTitle>
                <CardDescription className="text-gray-400">
                  Supervisão contínua de dispositivos com alertas inteligentes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-dark-card border-gray-700">
              <CardHeader>
                <Zap className="w-12 h-12 text-warning mb-4" />
                <CardTitle className="text-white">Automação Avançada</CardTitle>
                <CardDescription className="text-gray-400">
                  Ações automáticas baseadas em regras e condições de rede
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-dark-card border-gray-700">
              <CardHeader>
                <Brain className="w-12 h-12 text-accent mb-4" />
                <CardTitle className="text-white">IA & Analytics</CardTitle>
                <CardDescription className="text-gray-400">
                  Insights preditivos e detecção de anomalias com inteligência artificial
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-16 px-6 bg-dark-surface">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                Recursos Completos de Gestão
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h3 className="text-white font-semibold">Provisionamento Zero-Touch</h3>
                    <p className="text-gray-400 text-sm">Configuração automática de novos dispositivos</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h3 className="text-white font-semibold">Topologia Visual de Rede</h3>
                    <p className="text-gray-400 text-sm">Visualização em tempo real da infraestrutura</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h3 className="text-white font-semibold">Diagnóstico Inteligente</h3>
                    <p className="text-gray-400 text-sm">IA que interpreta métricas e sugere ações</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h3 className="text-white font-semibold">Controle WiFi Remoto</h3>
                    <p className="text-gray-400 text-sm">Alteração de SSID, senha e canal remotamente</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h3 className="text-white font-semibold">Matriz de Sinais Ópticos</h3>
                    <p className="text-gray-400 text-sm">Comparação de potência RX/TX para detectar degradação</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Pronto para Começar?</h3>
              <p className="text-gray-300 mb-6">
                Transforme sua gestão de rede com tecnologia de ponta
              </p>
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/api/login'}
                className="bg-primary hover:bg-primary/90"
              >
                Acessar Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-dark-surface py-8 px-6">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Network className="text-white w-5 h-5" />
            </div>
            <span className="text-white font-semibold">RJChronos</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2024 RJChronos Network Management Platform. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
