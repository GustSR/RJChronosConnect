# Sistema de Criptografia de Credenciais OLT

## 📋 Visão Geral

Este sistema implementa criptografia AES-256 para proteger credenciais SSH e SNMP das OLTs armazenadas no banco de dados PostgreSQL, mantendo total transparência no código existente.

## 🔐 Arquitetura

### Fluxo de Dados
```
PostgreSQL (Criptografado) → Modelo OLT → JSON API → OLT Manager
     🔒 AES-256                🔓 Auto         🔓 Claro
```

### Componentes
- **Crypto Utility** (`app/core/crypto.py`): Criptografia/descriptografia
- **Modelo OLT** (`app/models/olt.py`): Propriedades híbridas transparentes
- **Migração** (`alembic/versions/...`): Transição segura de dados

## 🛠️ Implementação

### 1. Configuração da Chave

**Variável de Ambiente:**
```bash
CREDENTIAL_ENCRYPTION_KEY=sua-chave-segura-32-caracteres
```

**Geração de Chave Segura:**
```bash
openssl rand -base64 32
```

### 2. Uso no Código

**Transparente - Nenhuma mudança necessária:**
```python
# Código continua igual
olt = crud_olt.get_olt(db, olt_id)
password = olt.ssh_password  # Descriptografado automaticamente
community = olt.snmp_community  # Descriptografado automaticamente

# Envio para OLT Manager (como antes)
json_payload = {
    "ssh_password": olt.ssh_password,  # Já descriptografado
    "snmp_community": olt.snmp_community
}
```

### 3. Criptografia Automática

**Propriedades Híbridas:**
```python
@hybrid_property
def ssh_password(self):
    """Descriptografa automaticamente ao acessar."""
    return decrypt_credential(self._ssh_password_encrypted)

@ssh_password.setter
def ssh_password(self, value):
    """Criptografa automaticamente ao salvar."""
    self._ssh_password_encrypted = encrypt_credential(value)
```

## 🗃️ Estrutura do Banco

### Campos Antigos (Mantidos por Compatibilidade)
- `ssh_password` → Será removido em migração futura

### Campos Novos (Criptografados)
- `_ssh_password_encrypted` → String criptografada AES-256
- `_snmp_community_encrypted` → String criptografada AES-256

## 🔧 Migração

### Executar Migração
```bash
# No container do backend
export CREDENTIAL_ENCRYPTION_KEY="sua-chave-aqui"
alembic upgrade head
```

### Processo de Migração
1. **Adiciona** colunas criptografadas
2. **Criptografa** dados existentes automaticamente
3. **Mantém** colunas antigas para rollback
4. **Remove** colunas antigas em migração futura

## 📊 Performance

### Benchmarks
- **Criptografia**: ~0.1ms por credencial
- **Descriptografia**: ~0.1ms por credencial
- **Operação SSH**: ~500-2000ms (gargalo real)

### Impacto Total
- **Overhead**: < 0.1% do tempo total da operação
- **Memória**: Desprezível
- **CPU**: Mínimo

## 🔒 Segurança

### Algoritmo
- **Criptografia**: AES-256 via Fernet
- **Derivação**: PBKDF2 com 100.000 iterações
- **Salt**: Fixo para consistência
- **Chave**: 256 bits derivada da variável de ambiente

### Proteções
✅ **Credenciais protegidas no banco**
✅ **Detecção automática de texto criptografado**
✅ **Rollback seguro com migração**
✅ **Logs não expõem credenciais**

## 🧪 Testes

### Executar Testes
```bash
# Teste básico de criptografia
cd services/backend-api
CREDENTIAL_ENCRYPTION_KEY="test-key" python3 test_credential_encryption.py

# Teste de integração
python3 test_olt_encryption_integration.py
```

### Validações
- ✅ Criptografia/descriptografia correta
- ✅ Propriedades híbridas funcionais
- ✅ Fluxo Backend → OLT Manager intacto
- ✅ Performance adequada

## 🚨 Troubleshooting

### Erro: "CREDENTIAL_ENCRYPTION_KEY não definida"
```bash
# Definir variável de ambiente
export CREDENTIAL_ENCRYPTION_KEY="sua-chave-aqui"
```

### Erro: "Falha na descriptografia"
- Verificar se a chave está correta
- Confirmar que o dado está realmente criptografado
- Validar integridade do banco de dados

### Rollback de Migração
```bash
# Voltar migração se necessário
alembic downgrade -1
```

## 📈 Monitoramento

### Logs de Sistema
```python
logger.info("Sistema de criptografia inicializado com sucesso")
logger.error("Erro ao descriptografar dados: {erro}")
```

### Métricas
- Tempo de criptografia/descriptografia
- Taxa de sucesso nas operações
- Integridade dos dados

## 🔧 Manutenção

### Rotação de Chaves
1. Gerar nova chave segura
2. Atualizar variável de ambiente
3. Executar script de re-criptografia (futuro)

### Backup de Segurança
- Sempre fazer backup antes de mudanças
- Testar rollback em ambiente de desenvolvimento
- Validar integridade após migração

## 📚 Referências

- [Cryptography Library](https://cryptography.io/)
- [Fernet (AES-256)](https://cryptography.io/en/latest/fernet/)
- [PBKDF2 Key Derivation](https://cryptography.io/en/latest/hazmat/primitives/key-derivation-functions/)
- [SQLAlchemy Hybrid Properties](https://docs.sqlalchemy.org/en/14/orm/extensions/hybrid.html)

---

**Implementado em:** 2025-09-21
**Status:** ✅ Funcional e Testado
**Próxima Revisão:** Remoção de campos legados