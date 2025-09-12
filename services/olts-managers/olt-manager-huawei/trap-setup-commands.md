# 🔧 Comandos para Configurar SNMP Traps na OLT Huawei

Este documento contém os comandos necessários para habilitar e configurar os traps SNMP críticos nas OLTs Huawei.

## 📋 **Pré-requisitos**

- Acesso SSH administrativo à OLT
- IP do servidor de monitoramento (onde roda o OLT Manager): `192.168.1.50`
- Comunidade SNMP: `public` (substitua pela sua)

## 🚀 **Comandos de Configuração**

### **1. Configuração Básica de SNMP Trap**

```bash
# Conectar à OLT via SSH
ssh admin@<IP_DA_OLT>

# Entrar no modo de configuração
system-view

# Configurar target host para envio de traps
snmp-agent target-host trap address udp-domain 192.168.1.50 params securityname public v2c

# Configurar source interface para traps
snmp-agent trap source Vlanif100

# Habilitar envio de traps
snmp-agent trap enable
```

### **2. Habilitando Traps GPON Específicos**

```bash
# Entrar na configuração GPON
gpon

# Habilitar traps de ONT (mudança de estado, alarmes)
snmp-agent trap enable feature-name GPONONT

# Habilitar traps específicos críticos
alarm-policy policy-id 1

# Habilitar dying gasp alarm
ont dying-gasp-alarm enable

# Habilitar alarmes de LOS (Loss of Signal)
ont los-alarm enable

# Habilitar alarmes de LOF (Loss of Frame)  
ont lof-alarm enable

# Habilitar traps de porta down/up
port-alarm enable

# Aplicar política de alarme
alarm-policy 1 binding

# Sair da configuração GPON
quit
```

### **3. Configuração de Interfaces PON**

```bash
# Para cada interface PON (exemplo: 0/1/0 a 0/16/0)
interface gpon 0/1

# Habilitar monitoramento da interface
snmp-agent trap enable interface-name gpon

# Configurar threshold de potência ótica
optical-module-info threshold rx-power low -28.0
optical-module-info threshold rx-power high -8.0

# Habilitar alarme de potência
alarm threshold rx-power enable

# Repetir para todas as interfaces PON necessárias
quit
```

### **4. Verificação da Configuração**

```bash
# Verificar configuração de traps
display snmp-agent trap-flag

# Verificar targets configurados
display snmp-agent target-host

# Verificar comunidades configuradas
display snmp-agent community

# Testar conectividade SNMP
ping 192.168.1.50

# Verificar logs de trap
display alarm trap-log
```

## 🎯 **Configuração Avançada (Opcional)**

### **Filtros de Trap por Severidade**

```bash
# Configurar apenas traps críticos e major
snmp-agent trap enable severity critical
snmp-agent trap enable severity major

# Desabilitar traps informativos para reduzir tráfego
snmp-agent trap disable severity info
snmp-agent trap disable severity minor
```

### **Rate Limiting para Traps**

```bash
# Limitar taxa de envio de traps (evitar flood)
snmp-agent trap-buffer enable
snmp-agent trap-buffer threshold 100
snmp-agent trap-buffer timeout 60
```

### **Autenticação SNMPv3 (Recomendado para Produção)**

```bash
# Criar usuário SNMPv3
snmp-agent usm-user v3 trap-user group v3 cipher auth-protocol md5 auth-password MyAuthPass123 priv-protocol des56 priv-password MyPrivPass123

# Configurar target com SNMPv3
snmp-agent target-host trap address udp-domain 192.168.1.50 params securityname trap-user v3 authentication
```

## 🔍 **Tipos de Trap Configurados**

| Trap OID | Evento | Severidade | Descrição |
|----------|--------|------------|-----------|
| `1.3.6.1.4.1.2011.6.128.1.1.2.0.22` | Dying Gasp | **CRITICAL** | ONT perdeu energia |
| `1.3.6.1.4.1.2011.6.128.1.1.2.0.6` | ONT State Change | **HIGH** | ONT mudou status |
| `1.3.6.1.4.1.2011.6.128.1.1.2.0.7` | Port Down | **CRITICAL** | Porta PON down |
| `1.3.6.1.4.1.2011.6.128.1.1.2.0.8` | Port Up | **INFO** | Porta PON up |
| `1.3.6.1.4.1.2011.6.128.1.1.2.0.9` | LOS Alarm | **HIGH** | Perda de sinal |
| `1.3.6.1.4.1.2011.6.128.1.1.2.0.10` | LOF Alarm | **HIGH** | Perda de frame |

## ⚠️ **Importantes Notas de Segurança**

1. **Firewall**: Garanta que a porta UDP 162 está aberta entre OLT e servidor
2. **SNMPv3**: Use sempre SNMPv3 em produção para criptografia
3. **Comunidades**: Mude a comunidade padrão `public` para algo único
4. **Rate Limiting**: Configure limites para evitar DoS por excesso de traps

## 🧪 **Testando a Configuração**

### **Simulando Eventos para Teste**

```bash
# Simular porta down (CUIDADO - vai derrubar clientes!)
interface gpon 0/1
shutdown
undo shutdown

# Verificar se trap foi enviado
display alarm trap-log | include "Port Down"
```

### **Monitorando Traps no Servidor**

```bash
# No servidor onde roda o OLT Manager, verificar logs
tail -f /var/log/olt-manager/trap-listener.log

# Ou verificar mensagens RabbitMQ
rabbitmqctl list_exchanges
rabbitmqctl list_queues
```

## 🔄 **Backup da Configuração**

```bash
# Salvar configuração atual
save

# Fazer backup completo
display current-configuration > tftp://192.168.1.100/backup-olt-$(date +%Y%m%d).cfg
```

---

**Configuração realizada:** Configure todos estes comandos nas OLTs que deseja monitorar!
**Próximo passo:** O OLT Manager já está preparado para receber e processar todos estes traps automaticamente.