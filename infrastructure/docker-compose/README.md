# Boas Práticas para Docker Compose

Este documento serve como um checklist para garantir que nossos ambientes Docker sejam robustos, seguros e otimizados, seguindo as melhores práticas do mercado.

## Checklist de Boas Práticas

### Ambiente de Produção (`docker-compose.prod.yml`)

| Status | Prática | Descrição |
| :---: | :--- | :--- |
| ✅ | **Política de Restart (`restart: always`)** | Garante que os contêineres sejam reiniciados automaticamente em caso de falha ou reboot do servidor, mantendo a alta disponibilidade. |
| ✅ | **Mínima Exposição de Portas** | Apenas os serviços que precisam de acesso externo (como o Reverse Proxy) expõem portas. Serviços internos (backend, bancos de dados) não são expostos, reduzindo a superfície de ataque. |
| ✅ | **Healthchecks (Verificação de Saúde)** | Comandos que verificam se os serviços estão não apenas rodando, mas também saudáveis e aptos a responder, permitindo que o Docker reinicie contêineres que não estão funcionando corretamente. |
| ⬜️ | **Limites de Recursos (CPU e Memória)** | Previne que um serviço consuma todos os recursos do servidor. **Ainda não aplicado**, pois requer análise de carga para definir os limites ideais. |
| ⬜️ | **Logging Centralizado** | Configuração de um driver de log para enviar todos os logs da aplicação para um sistema centralizado. **Ainda não aplicado**, pois requer a definição de uma ferramenta de logging (ex: ELK, Graylog). |
| ⬜️ | **Uso de Secrets para Credenciais** | Gerenciamento de senhas e chaves de API usando o sistema de `secrets` do Docker em vez de variáveis de ambiente, para maior segurança. **Ainda não aplicado**. |
| ⬜️ | **Imagens com Tags Específicas** | Usar tags de imagem específicas (ex: `postgres:15.3-alpine`) em vez de genéricas (`postgres:15-alpine`) para garantir builds determinísticos e evitar atualizações inesperadas. **Ainda não aplicado**. |

### Ambiente de Desenvolvimento (`docker-compose.dev.yml`)

| Status | Prática | Descrição |
| :---: | :--- | :--- |
| ✅ | **Hot-Reloading** | Mapeamento de volumes (`volumes`) para que as alterações no código-fonte local sejam refletidas instantaneamente dentro do contêiner, sem a necessidade de rebuild. |
| ✅ | **Dockerfile de Desenvolvimento (`Dockerfile.dev`)** | Uso de um Dockerfile específico para desenvolvimento, que pode incluir ferramentas de debug e não se preocupa com o tamanho final da imagem. |
| ✅ | **Sem Política de Restart** | Os contêineres não reiniciam automaticamente, permitindo que o desenvolvedor investigue a causa de um erro que tenha feito o serviço parar. |
