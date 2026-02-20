SISTEMA INTELIGENTE DEGERENCIAMENTO DE REDE (ISP)
ARQUITETURA E ESPECIFICAÇÃO TÉCNICA
Índice
1. Sumário Executivo
2. Análise Comparativa de Mercado
3. Arquitetura Proposta do Sistema
4. Stack Tecnológico Open Source
5. Funcionalidades Completas
6. Sistema de Notificações Inteligentes
7. Benefícios e Diferenciais
8. Roadmap de Implementação
9. Considerações de Segurança
10. Conclusão
1. Sumário Executivo
Este documento apresenta a especificação técnica e arquitetural para odesenvolvimento de um Sistema de Gerenciamento de Rede de PróximaGeração para Provedores de Internet (ISPs). O objetivo central da soluçãoé unificar as melhores práticas de gerenciamento de OLTs (inspirado noSmartOLT) e a excelência em gestão de CPEs e Wi-Fi (inspirado naAnlix/Flashbox), superando as limitações atuais através da integraçãonativa de Inteligência Artificial.
A solução proposta visa eliminar a fragmentação de ferramentas, reduziro tempo de diagnóstico técnico e prever falhas antes que o cliente finalseja impactado. O diferencial competitivo reside na utilização de agentesde IA autônomos que analisam métricas em tempo real sem sobrecarregara infraestrutura de rede, utilizando um sistema de filas assíncronas de altodesempenho.
2. Análise Comparativa de Mercado
Para fundamentar a arquitetura proposta, foi realizada uma análise dasduas principais referências de mercado: SmartOLT e Anlix.

SmartOLT
Foco:
Infraestrutura Óptica(OLT/ONT).
Pontos Fortes:
Gerenciamento centralizadode OLTs (Huawei, ZTE),provisionamento Zero-Touch,visualização de potência desinal (Rx/Tx), interface levebaseada em nuvem.
Limitação:
Foco restrito à camada físicae de enlace; poucavisibilidade da experiênciaWi-Fi do cliente final.

Anlix (Flashbox)
Foco:
Casa Conectada (CPE/Wi-Fi).
Pontos Fortes:
Protocolo TR-069 maduro,diagnóstico de Wi-Fi, apppara técnicos, gestão deroteadores de terceiros,white label.
Limitação:
Dependência de integraçõesexternas para gestãoprofunda de OLTs; custoelevado por dispositivo emescala massiva.
Tabela Comparativa e Gaps
Funcionalidade
SmartOLT
Anlix
Nova Solução(Proposta)
Gerência OLT(Huawei/ZTE)
Nativo(Avançado)
Básico/Integração
Nativo (Avançado)
Funcionalidade
SmartOLT
Anlix
Nova Solução(Proposta)
Gerência CPE (TR-069)
Básico
Nativo(Avançado)
GenieACS Customizado
Análise com IA
Limitado
Reativo
Agentes Preditivos Ativos
Arquitetura de Eventos
PollingTradicional
Híbrido
Event-Driven (Kafka/RabbitMQ)
Custo de Licenciamento
Dólar/Dispositivo
Recorrente
Open Source (OPEX reduzido)
3. Arquitetura Proposta do Sistema
3.1 Visão Geral da Arquitetura
A arquitetura segue o padrão de microserviços orientados a eventos. Issogarante que o sistema seja escalável horizontalmente e que falhas em ummódulo (ex: coleta de logs) não afetem a operação crítica (ex:provisionamento de clientes).
[ CAMADA DE APRESENTAÇÃO (Frontend React/Vue) ] | [ API GATEWAY (Nginx/Traefik) -------------------------------------------- | | | [ Serviço OLT ] [ Serviço CPE (GenieACS/TR069) (TensorFlow) | | | -------------------------------------------- Kafka) ] | -------------------------------------------- | | | [ DB Relacional ] (PostgreSQL) (TimescaleDB) (Redis)
3.2 Camada de Gerenciamento de Dispositivos
Estratégia para TR-069:
Recomenda-se fortemente a utilização do
GenieACS
como motor base, em vez de desenvolver um servidor ACS dozero.
Por que GenieACS?
É a solução open source mais madura do mercado,compatível com a norma técnica, altamente scriptável (JavaScript) ecapaz de lidar com milhões de dispositivos.
Customização:
O GenieACS operará no backend, invisível ao usuáriofinal. Nossa aplicação orquestrará o GenieACS via API REST pararealizar configurações em massa, diagnósticos e coletas.
Protocolos Suportados:
TR-069 (CWMP) para CPEs (Roteadores, ONTs).
SNMP v2/v3 e Telnet/SSH para OLTs (Huawei, ZTE, Datacom).
3.3 Sistema de Filas e Eventos
Para atender ao requisito de "não utilizar processamento total da OLT" egarantir fluidez, adotaremos uma arquitetura híbrida de mensageria:

RabbitMQ (Filas Transacionais)
Utilizado para tarefas que
precisam
ser garantidas e executadas em ordem. Ex:Comando de "Reboot" na ONU, Provisionamento de novo cliente, Alteração de plano.Se a OLT demorar a responder, o worker aguarda sem travar a aplicação principal.

Apache Kafka (Streaming de Eventos)
Utilizado para ingestão massiva de métricas e logs. Ex: Milhares de ONUs enviandoníveis de sinal a cada 5 minutos. O Kafka armazena esse "buffer" gigante, e osAgentes de IA consomem esses dados no ritmo que suportarem, sem derrubar obanco de dados.
3.4 Agentes de IA
A inteligência do sistema é dividida em agentes especializados:
1.
Agente de Qualidade de CPE (Predictive Maintenance):
Analisapadrões de degradação de sinal óptico (dBm) e estatísticas de Wi-Fi(RSSI, retransmissões).
Exemplo:
Identifica que todos os clientes de uma porta PON específicaestão sofrendo atenuação gradual de 0.5dB por dia, sugerindo sujeiraou dobra no splitter antes que o link caia.
2.
Agente de Métricas de Rede (Anomaly Detection):
Monitora latência,jitter e perda de pacotes. Utiliza algoritmos de Isolation Forest paradetectar anomalias que fogem do padrão histórico daquela região(bairro/cidade).
3.
Agente de Diagnóstico (Automated Troubleshooting):
Cruza dados daOLT (Luz, Status) com dados do CPE (Wi-Fi, CPU).
Cenário:
Cliente reclama de lentidão. O agente analisainstantaneamente e informa: "Sinal óptico OK, mas Wi-Fi cominterferência severa no canal 6. Sugestão: Mudar para canal 11".
4. Stack Tecnológico Open Source Recomendado
Camada
Tecnologia
Justificativa
Backend Core
Node.js (TypeScript) / Python (FastAPI)
Node.js para I/O assíncrono (integraçãocom GenieACS). Python para serviços deOLT e IA.
ACS / TR-069
GenieACS
Padrão de mercado open source,extensível e robusto.
Mensageria
RabbitMQ & Apache Kafka
RabbitMQ para tarefas críticas; Kafkapara telemetria de alto volume.
Banco de Dados
PostgreSQL + TimescaleDB
Postgres para dados cadastrais.TimescaleDB (extensão) é otimizado paraséries temporais (métricas de sinal).
InteligênciaArtificial
Python, Scikit-learn, TensorFlow
Ecossistema rico de bibliotecas deciência de dados.
Frontend
React.js + TailwindCSS
Interface moderna, responsiva e rápida.
Monitoramento
Prometheus + Grafana
Visualização de métricas de infraestruturado próprio sistema.
5. Funcionalidades Completas do Sistema
5.1 Gerenciamento de OLTs
Suporte Multi-vendor: Comandos normalizados para Huawei, ZTE,Datacom, FiberHome.
Provisionamento Automático: Detecta ONU não autorizada e provisionaconforme plano no ERP.
Monitoramento de Potência: Gráficos históricos de Rx/Tx.
Gestão de VLANs e Service Profiles.
5.2 Gerenciamento de CPE (Wi-Fi)
Auto-configuração: WAN, PPPoE, Wi-Fi (SSID/Senha) via TR-069.
Mapa de Calor Wi-Fi: Visualização da qualidade do sinal nosdispositivos conectados.
Teste de Velocidade Remoto: Disparado do CPE, não do celular docliente.
Reset e Reboot Remoto: Redução de envio de técnicos.
5.3 Dashboard de IA e Análises
Predição de Churn: Identificação de clientes com qualidade ruimrecorrente.
Clusterização de Falhas: "30 clientes caíram no bairro X -> Provávelrompimento de fibra".
Recomendação de Otimização: Sugestões automáticas parabalanceamento de portas PON.
6. Sistema de Notificações Inteligentes
O sistema de alertas evita a "fadiga de alertas" comum em NOCs.
Agregação de Eventos:
Se uma OLT cair, o sistema gera 1 alerta crítico"OLT Down" em vez de 2.000 alertas de "Cliente Offline".
Priorização:
Crítico:
Queda de Rota/OLT (Envio imediato via Telegram/SMS/VoiceCall).
Major:
Sinal óptico degradando (Email/Ticket).
Info:
Provisionamento realizado (Log no sistema).
Mecanismo Anti-Flapping:
Se um link oscila (cai/volta) 10 vezes em 1minuto, o sistema envia apenas um alerta de instabilidade.
7. Benefícios e Diferenciais
Redução de OPEX:
Menos visitas técnicas improdutivas graças aodiagnóstico preciso da IA.
Independência:
Código 100% Open Source, sem licenças abusivas emdólar.
Escalabilidade:
Arquitetura desenhada para crescer de 1.000 para500.000 assinantes.
Proatividade:
O ISP liga para o cliente para agendar reparo antes que ocliente ligue reclamando.
8. Roadmap de Implementação
Fase 1: Fundação (Meses 1-3)
Setup da infraestrutura Kubernetes. Implementação do GenieACS. Conexão básicacom OLTs (Leitura). Dashboard inicial.
Fase 2: Gerenciamento Total (Meses 4-6)
Escrita em OLTs (Provisionamento). Integração completa TR-069 (Troca de senhas,Wi-Fi). Sistema de Filas RabbitMQ operante. App do Técnico.
Fase 3: Inteligência Artificial (Meses 7-10)
Coleta de dados históricos no TimescaleDB. Treinamento dos modelos de ML.Implementação dos Agentes de IA para detecção de anomalias.
Fase 4: Otimização e Escala (Meses 11-12)
Refinamento dos algoritmos. Automação de correções (Self-healing). Testes de cargamassiva.
9. Considerações de Segurança
A segurança é transversal a toda a arquitetura:
RBAC (Role-Based Access Control):
Níveis granulares de permissão(NOC, N1, N2, Engenharia).
Criptografia:
TLS 1.3 em todas as comunicações (API, TR-069, Web).
Logs de Auditoria:
Registro imutável de "Quem fez o que e quando".
Segregação de Rede:
O servidor de gerenciamento não deve serexposto publicamente sem VPN ou proxy reverso seguro.
10. Conclusão
A solução apresentada posiciona o provedor em um novo patamartecnológico. Ao combinar a robustez do gerenciamento físico (OLT) com aflexibilidade do gerenciamento lógico (CPE) e a inteligência preditiva daIA, o sistema não apenas "copia" os concorrentes, mas cria uma novacategoria de ferramenta: o
ISP Operating System Autônomo
. A utilizaçãode tecnologias Open Source garante a viabilidade econômica e o controletotal sobre o roadmap do produto.