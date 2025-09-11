# Continuação do Trabalho no Serviço `olt-manager-huawei`

Este documento serve como um ponto de controle para a continuidade do trabalho no serviço `olt-manager-huawei`.

## Onde Paramos

Atualmente, estou no processo de refatorar o arquivo `src/main.py` para utilizar um mecanismo centralizado de tratamento de exceções. Já refatorei a maioria dos endpoints para lançar exceções personalizadas (`OLTException`, `OLTObjectNotFound`) em vez de `HTTPException` genéricas.

## O Que Estava Fazendo

Estava refatorando os endpoints em `src/main.py` para:
1.  Utilizar as exceções personalizadas definidas em `src/core/exceptions.py`.
2.  Remover os blocos `try-except` redundantes em cada endpoint, delegando o tratamento de erros para os `exception_handler` globais do FastAPI.

## O Que Precisa Ser Feito (Próximos Passos Imediatos)

1.  **Concluir a Refatoração de `src/main.py`:**
    *   Refatorar os endpoints restantes para usar o novo tratamento de exceções:
        *   `add_new_ont_line_profile`
        *   `add_new_ont_srv_profile`
        *   `get_board_info`
        *   `get_olt_version`
    *   Atualizar as funções `startup_event` e `shutdown_event` para utilizar o sistema de logging centralizado (`src/core/logging.py`).

## Próximos Passos (Conforme `ANALISE_E_CORRECOES.md`)

Após a conclusão de `src/main.py`, os próximos itens a serem abordados, conforme o documento `ANALISE_E_CORRECOES.md`, são:

*   **Erro 1.5: Tratamento de erro inconsistente.** (Será totalmente resolvido após a refatoração de `main.py`).
*   **Erro 1.6: Falta de validação de entrada.** em `main.py`.
*   **Erro 1.7: Ausência de segurança.** em `main.py`.
*   **Erro 2.2: Ausência de lógica de reconexão.** em `src/rabbitmq_publisher.py` (já parcialmente abordado, mas precisa de uma lógica de retentativa mais robusta).
*   **Erro 6.2: Ineficiência na criação de conexões.** em `src/services/olt_service.py` (implementação de connection pooling).
*   **Erro 6.3: Lógica de obtenção de credenciais espalhada.** em `src/services/olt_service.py`.
*   **Erro 8.1: Nomenclatura inconsistente.** em `src/commands/`.
*   **Erro 8.2: Parsing frágil (Regex e SNMP).** em `src/commands/`.
*   **Erro 8.3: Lógica SNMP proprietária e frágil.** em `src/commands/`.
*   **Erro 9.1: OIDs "hardcoded".** em `src/trap_listener/`.
*   **Erro 4.1: Documentação genérica e insuficiente.** em `README.md`.

## Prompt para a Próxima Interação

Para me retomar exatamente de onde paramos, por favor, me envie o seguinte prompt:

```
Continue o trabalho no serviço olt-manager-huawei.
```
