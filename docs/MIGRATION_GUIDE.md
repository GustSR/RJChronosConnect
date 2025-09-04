# 🔄 Guia de Migração: Fake API → Backend Real

> **Guia passo-a-passo para substituir dados mockados por endpoints reais**

---

## 🎯 **Objetivo**

Este guia orienta como **migrar de dados mockados** para **endpoints reais do backend**, permitindo desenvolvimento gradual e sem quebrar o frontend.

---

## 📋 **Processo de Migração por Endpoint**

### **Fluxo Padrão para Cada Endpoint:**

1. ✅ **Backend implementa o endpoint**
2. ✅ **Testa o endpoint com Postman/curl**  
3. ✅ **Remove endpoint da Fake API** (opcional)
4. ✅ **Testa frontend com endpoint real**
5. ✅ **Documenta mudanças**

---

## **🔧 PASSO-A-PASSO DETALHADO**

## **Fase 1: Preparação do Ambiente**

### **1.1 Configurar Backend para Desenvolvimento**
```bash
# Garantir que backend está rodando
docker compose -f docker-compose.yml -f docker-compose.dev.yml up backend

# Verificar se backend está acessível
curl http://localhost:8081/api/
```

### **1.2 Verificar Estado Atual do Frontend**
```bash
# Console do navegador deve mostrar:
🔧 DevConfig: { useMockData: true, ... }

# Para testar endpoint real temporariamente:
localStorage.setItem('FORCE_REAL_API', 'true')
# Ou no .env:
VITE_USE_MOCK_DATA=false
```

---

## **Fase 2: Migração Gradual**

### **2.1 Exemplo - Migrar Dashboard Metrics**

#### **Backend (FastAPI):**
```python
# services/backend-api/app/api/dashboard.py
@router.get("/metrics")
async def get_dashboard_metrics():
    return {
        "total_devices": await get_device_count(),
        "online_devices": await get_online_device_count(),
        "offline_devices": await get_offline_device_count(),
        # ... resto dos dados
    }
```

#### **Testar Backend:**
```bash
curl http://localhost:8081/api/dashboard/metrics
```

#### **Frontend - Testar Endpoint Real:**
```typescript
// Temporariamente forçar uso do endpoint real
async getDashboardMetrics(): Promise<DashboardMetrics> {
  // Comentar a linha do mock:
  // if (devConfig.useMockData) { return fakeApi.getDashboardMetrics(); }
  
  // Testar endpoint real:
  return httpClient.get<DashboardMetrics>('/dashboard/metrics');
}
```

#### **Validar no Frontend:**
- ✅ Dados carregam corretamente
- ✅ Não há erros no console
- ✅ UI funciona normalmente

#### **Finalizar Migração:**
```typescript
// Manter a condição, mas endpoint real funcionando:
async getDashboardMetrics(): Promise<DashboardMetrics> {
  if (devConfig.useMockData) {
    return fakeApi.getDashboardMetrics();
  }
  return httpClient.get<DashboardMetrics>('/dashboard/metrics'); // ✅ Pronto
}
```

---

### **2.2 Endpoint com Parâmetros - WiFi Config**

#### **Backend:**
```python
@router.get("/wifi/configs/{device_id}")
async def get_wifi_config(device_id: str, band: str = "2.4GHz"):
    config = await get_device_wifi_config(device_id, band)
    return {
        "device_id": device_id,
        "band": band,
        "ssid": config.ssid,
        "enabled": config.enabled,
        # ... resto da config
    }
```

#### **Testar:**
```bash
curl "http://localhost:8081/api/wifi/configs/pending-demo-1?band=2.4GHz"
```

#### **Frontend:**
```typescript
// Já está pronto! Só precisa do backend implementar
async getWiFiConfigByBand(deviceId: string, band: '2.4GHz' | '5GHz'): Promise<WiFiConfig> {
  if (devConfig.useMockData) {
    return fakeApi.getWiFiConfigByBand(deviceId, band);
  }
  return httpClient.get<WiFiConfig>(`/wifi/configs/${deviceId}?band=${encodeURIComponent(band)}`);
}
```

---

### **2.3 Endpoint POST - Autorizar ONU**

#### **Backend:**
```python
@router.post("/provisioning/{onu_id}/authorize")
async def authorize_onu(onu_id: str, provision_data: ProvisionData):
    result = await provision_onu(onu_id, provision_data)
    return {
        "success": True,
        "message": f"ONU {onu_id} autorizada com sucesso",
        "onu_id": onu_id,
        "authorized_at": datetime.utcnow().isoformat()
    }
```

#### **Testar:**
```bash
curl -X POST "http://localhost:8081/api/provisioning/pending-demo-1/authorize" \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Teste Cliente",
    "client_address": "Rua Teste, 123"
  }'
```

---

## **Fase 3: Configuração para Produção**

### **3.1 Desabilitar Mock Globalmente**

#### **Opção 1: Variável de Ambiente**
```bash
# .env.production
VITE_USE_MOCK_DATA=false
VITE_API_URL=http://backend:8000
```

#### **Opção 2: Build de Produção**
```typescript
// api.ts - Configuração para produção
export const devConfig = {
  useMockData: 
    import.meta.env.MODE === 'development' && 
    import.meta.env.VITE_USE_MOCK_DATA !== 'false',
  // Em produção, useMockData será sempre false
};
```

### **3.2 Verificar Migração Completa**
```bash
# Build de produção não deve incluir __fakeApi__
npm run build

# Verificar se não há referências a fakeApi no bundle
grep -r "fakeApi" dist/ || echo "✅ Nenhuma referência a fakeApi encontrada"
```

---

## **📊 CHECKLIST DE MIGRAÇÃO**

### **Por Endpoint:**
- [ ] Backend implementado e testado
- [ ] Frontend testado com endpoint real
- [ ] Tratamento de erros funcionando
- [ ] Performance aceitável
- [ ] Documentado no README

### **Endpoints por Prioridade:**

#### **🔴 ALTA PRIORIDADE:**
- [ ] `GET /api/dashboard/metrics`
- [ ] `GET /api/devices/onus` 
- [ ] `GET /api/devices/olts`
- [ ] `GET /api/alerts`
- [ ] `GET /api/provisioning/pending`
- [ ] `POST /api/provisioning/{onu_id}/authorize`
- [ ] `GET /api/wifi/configs/{device_id}`
- [ ] `PUT /api/wifi/configs/{device_id}`

#### **🟡 MÉDIA PRIORIDADE:**
- [ ] `GET /api/analytics/bandwidth`
- [ ] `GET /api/activity-history`
- [ ] `POST /api/tr069/reboot/{device_id}`

#### **🟢 BAIXA PRIORIDADE:**
- [ ] `GET /api/analytics/traffic-sources`
- [ ] `POST /api/tr069/factory-reset/{device_id}`

---

## **⚠️ PROBLEMAS COMUNS & SOLUÇÕES**

### **1. CORS Issues**
```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **2. Formato de Data Diferente**
```typescript
// Se backend retorna formato diferente:
const data = await httpClient.get('/endpoint');
// Transformar dados se necessário:
return transformBackendToFrontend(data);
```

### **3. Timeout em Operações TR-069**
```typescript
// Aumentar timeout para operações TR-069:
const httpClientTR069 = new HttpClient({
  ...defaultApiConfig,
  timeout: 60000, // 60s para TR-069
});
```

### **4. Validação de Dados**
```typescript
// Validar dados vindos do backend:
const data = await httpClient.get<DashboardMetrics>('/dashboard/metrics');
if (!data.total_devices) {
  throw new Error('Dados inválidos do backend');
}
return data;
```

---

## **🚀 ESTRATÉGIA DE ROLLBACK**

Se algum endpoint real falhar em produção:

### **Rollback Rápido:**
```typescript
// Temporariamente volta para mock:
async getDashboardMetrics(): Promise<DashboardMetrics> {
  // Força mock temporariamente:
  if (devConfig.useMockData || EMERGENCY_USE_MOCK) {
    return fakeApi.getDashboardMetrics();
  }
  return httpClient.get<DashboardMetrics>('/dashboard/metrics');
}
```

### **Rollback via Feature Flag:**
```typescript
const EMERGENCY_USE_MOCK = localStorage.getItem('emergency_mock') === 'true';
```

---

## **📈 MONITORAMENTO PÓS-MIGRAÇÃO**

### **Logs a Observar:**
```typescript
// Adicionar logs para monitorar migração:
async getDashboardMetrics(): Promise<DashboardMetrics> {
  if (devConfig.useMockData) {
    console.log('📝 Usando dados MOCK para dashboard metrics');
    return fakeApi.getDashboardMetrics();
  }
  
  console.log('🔗 Buscando dados REAIS para dashboard metrics');
  const startTime = Date.now();
  const data = await httpClient.get<DashboardMetrics>('/dashboard/metrics');
  const duration = Date.now() - startTime;
  console.log(`✅ Dashboard metrics carregado em ${duration}ms`);
  
  return data;
}
```

---

**🎯 Com este guia, a migração pode ser feita de forma gradual, segura e sem interromper o desenvolvimento frontend!**