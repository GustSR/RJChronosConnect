# 🚀 Guia de Provisionamento TR-069 - RJChronosConnect

Este guia mostra como conectar e provisionar um roteador real usando o GenieACS.

## 📋 Pré-requisitos

- ✅ Ambiente Docker funcionando
- ✅ Roteador com suporte TR-069
- ✅ Notebook e roteador na mesma rede
- ✅ Acesso físico ao roteador

## 🌐 Configuração de Rede

### Seu IP Local
```
IP do Notebook: 192.168.7.119
```

### URLs do GenieACS (a serem usadas no roteador)
```
ACS URL (TR-069):    http://192.168.7.119:7547
GenieACS UI:         http://192.168.7.119:3000
GenieACS NBI API:    http://192.168.7.119:7557
File Server:         http://192.168.7.119:7567
```

### Frontend do Sistema
```
RJChronos Frontend:  http://192.168.7.119:8081
```

## 🔧 Configuração do Roteador

### Método 1: Via Interface Web do Roteador

1. **Conecte o roteador ao seu notebook via cabo Ethernet**

2. **Acesse a interface do roteador** (geralmente):
   - http://192.168.1.1 ou http://192.168.0.1
   - Usuario: admin / Senha: admin (ou verifique etiqueta)

3. **Procure por configurações TR-069/CWMP**:
   - Pode estar em: Management → TR-069, Advanced → TR-069, ou System → TR-069

4. **Configure os seguintes parâmetros**:
   ```
   ACS URL: http://192.168.7.119:7547
   ACS Username: (deixe vazio ou use um padrão)
   ACS Password: (deixe vazio ou use um padrão)
   
   Connection Request Authentication:
   - Username: (será gerado pelo GenieACS)
   - Password: (será gerado pelo GenieACS)
   
   Periodic Inform Enable: ✅ Habilitado
   Periodic Inform Interval: 300 (5 minutos)
   ```

5. **Aplique as configurações** e reinicie o roteador

### Método 2: Via DHCP Options (Método Automático)

Se você controla o servidor DHCP da rede, pode configurar:

```
DHCP Option 43 (Vendor Specific): http://192.168.7.119:7547
DHCP Option 60 (Vendor Class): dslforum.org
```

### Método 3: Via Configuração Manual (SSH/Telnet)

Se tiver acesso SSH/Telnet ao roteador:

```bash
# Exemplo para roteadores OpenWrt/LEDE
uci set cwmp.acs.url='http://192.168.7.119:7547'
uci set cwmp.acs.username=''
uci set cwmp.acs.password=''
uci set cwmp.cwmp.acs_url='http://192.168.7.119:7547'
uci commit cwmp
/etc/init.d/cwmp restart
```

## 📊 Verificação do Provisionamento

### 1. Verifique no GenieACS UI
- Acesse: http://192.168.7.233:3000
- Vá em "Devices" para ver se o roteador apareceu
- O device deve mostrar status "online" após alguns minutos

### 2. Verifique no RJChronos
- Acesse: http://192.168.7.233:8081
- No Dashboard, veja se o total de dispositivos aumentou
- Vá em "Inventory" para ver detalhes do dispositivo

### 3. Verifique via API
```bash
# Ver dispositivos conectados
curl -s "http://192.168.7.233:8081/api/devices/cpes" | json_pp

# Ver métricas do dashboard
curl -s "http://192.168.7.233:8081/api/dashboard/metrics" | json_pp
```

## 🛠️ Troubleshooting

### Problema: Roteador não aparece no GenieACS

1. **Verifique conectividade**:
   ```bash
   ping 192.168.7.233  # Do roteador para o notebook
   ```

2. **Verifique logs do GenieACS**:
   ```bash
   docker-compose logs genieacs --tail=50
   ```

3. **Verifique se o serviço está escutando**:
   ```bash
   netstat -an | findstr :7547
   ```

### Problema: Conexão recusada

1. **Verifique firewall do Windows**:
   - Permita porta 7547 TCP
   - Permita Docker Desktop no firewall

2. **Teste conectividade local**:
   ```bash
   curl -s "http://localhost:7547"
   # Deve retornar "405 Method Not Allowed"
   ```

### Problema: Roteador conecta mas não recebe configurações

1. **Verifique na GenieACS UI**:
   - Devices → [Seu dispositivo] → Summary
   - Veja se há parâmetros sendo lidos

2. **Force um refresh**:
   - Na GenieACS UI: Tasks → Add Task → refreshObject

## 📝 Configurações Avançadas

### Configurar Presets no GenieACS

1. **Acesse GenieACS UI**: http://192.168.7.233:3000
2. **Vá em Admin → Presets**
3. **Criar preset básico**:
   ```javascript
   const now = Date.now();
   
   // Configurações WiFi básicas
   declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID", {value: now}, {value: "RJChronos_WiFi"});
   declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.BeaconType", {value: now}, {value: "11i"});
   declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.IEEE11iEncryptionModes", {value: now}, {value: "AES"});
   ```

### Configurar Provisions (Scripts de Configuração)

1. **Vá em Admin → Provisions**
2. **Criar provision para configuração inicial**:
   ```javascript
   // Configuração básica do dispositivo
   const deviceId = declare("DeviceID.ID", {value: 1}).value[0];
   const model = declare("InternetGatewayDevice.DeviceInfo.ModelName", {value: 1}).value[0];
   
   log(`Configurando dispositivo: ${deviceId} - ${model}`);
   
   // Configurar informações de gerenciamento
   declare("InternetGatewayDevice.ManagementServer.PeriodicInformEnable", {value: Date.now()}, {value: true});
   declare("InternetGatewayDevice.ManagementServer.PeriodicInformInterval", {value: Date.now()}, {value: 300});
   ```

## 🔐 Segurança

### Configurações Recomendadas

1. **Altere credenciais padrão** do roteador
2. **Configure HTTPS** para produção:
   ```yaml
   # No docker-compose.yml, adicione certificados SSL
   volumes:
     - ./ssl:/opt/ssl
   environment:
     - GENIEACS_CWMP_SSL=true
     - GENIEACS_CWMP_SSL_CERT=/opt/ssl/cert.pem
     - GENIEACS_CWMP_SSL_KEY=/opt/ssl/key.pem
   ```

3. **Restrinja acesso** por firewall:
   ```bash
   # Apenas rede local
   iptables -A INPUT -p tcp --dport 7547 -s 192.168.0.0/16 -j ACCEPT
   iptables -A INPUT -p tcp --dport 7547 -j DROP
   ```

## 📞 Comandos Úteis

### Reiniciar GenieACS
```bash
docker-compose restart genieacs
```

### Ver logs em tempo real
```bash
docker-compose logs -f genieacs
```

### Backup da configuração
```bash
docker-compose exec db-acs mongodump --out /tmp/backup
```

### Limpar dispositivos (desenvolvimento)
```bash
# Cuidado: Remove todos os dispositivos!
docker-compose exec db-acs mongo genieacs --eval "db.devices.deleteMany({})"
```

## 🎯 Próximos Passos

Após conectar seu primeiro roteador:

1. ✅ **Teste configurações básicas** via GenieACS UI
2. ✅ **Configure presets** para automação
3. ✅ **Implemente provisions** customizados
4. ✅ **Configure monitoramento** avançado
5. ✅ **Teste firmware updates** se necessário

---

**💡 Dica**: Mantenha os logs abertos durante o primeiro provisionamento para debug:
```bash
docker-compose logs -f genieacs | grep -E "(CWMP|inform|device)"
```