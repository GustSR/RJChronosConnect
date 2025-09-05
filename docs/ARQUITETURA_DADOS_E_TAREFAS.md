# Guia de Arquitetura: Dados, Cache e Tarefas Assíncronas

Este documento explica o papel dos principais componentes de armazenamento e mensageria no projeto RJChronosConnect: PostgreSQL, Redis e RabbitMQ. O objetivo é definir as melhores práticas e garantir que cada ferramenta seja usada para o propósito correto.

---

## 1. PostgreSQL: A Fonte da Verdade

O PostgreSQL (`db-app`) é o nosso banco de dados relacional principal. Ele é a nossa **fonte única e permanente da verdade**.

-   **O que guardar aqui:** Todos os dados críticos, estruturados e que **não podem ser perdidos**. 
    -   Dados de usuários e permissões.
    -   Inventário de clientes e dispositivos (OLTs, ONUs).
    -   Configurações de provisionamento.
    -   Logs de auditoria e histórico de atividades importantes.

-   **Quando usar:** Sempre que a informação for um ativo do negócio que precisa de consistência, segurança e durabilidade.

---

## 2. RabbitMQ: O Gerente de Tarefas Confiável

É a escolha certa quando você precisa que uma tarefa seja executada de forma **confiável** e **assíncrona** (em segundo plano).

| Usos Comuns no Dia a Dia                                                                                             | Quando **NUNCA** Usar                                                                                             | Boas Práticas Essenciais                                                                                                                                                           |
| :------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ **Processamento em Lote:** Enviar uma newsletter para 10.000 usuários; aplicar uma configuração em 500 dispositivos. | ❌ **Requisições Imediatas:** Buscar dados de um usuário para exibir na tela. O usuário não pode esperar a "fila" andar para ver a página. | 💡 **Mensagens Autocontidas:** A mensagem deve ter TODA a informação que o "worker" precisa para fazer o trabalho, sem precisar consultar outro serviço. |
| ✅ **Tarefas Lentas:** Gerar um relatório em PDF que consulta várias tabelas; processar um vídeo que o usuário enviou.      | ❌ **Validações em Tempo Real:** Verificar se um nome de usuário já existe durante um cadastro. A resposta tem que ser instantânea. | 💡 **Idempotência:** O worker deve ser capaz de processar a mesma mensagem duas vezes sem causar problemas (ex: não cobrar um cliente duas vezes). Isso protege contra falhas. |
| ✅ **Comunicação entre Microsserviços:** O serviço de "Usuários" publica "usuário_criado" e os serviços de "Email" e "Analytics" consomem a mensagem. | ❌ **Fluxos Síncronos:** Qualquer processo onde o passo 2 depende diretamente do resultado imediato do passo 1.                   | 💡 **Filas de Erro (Dead Letter Queue):** Configure uma fila secundária para onde vão as mensagens que falharam repetidamente, evitando que elas travem o processamento principal. |

#### No Nosso Projeto:
- O serviço `backend` publica as tarefas (ex: reiniciar ONU).
- O serviço `works` consome as tarefas da fila e as executa, mantendo a API `backend` ágil e responsiva.

---

## 3. Redis: O Canivete Suíço da Velocidade

É a escolha certa quando a **velocidade de acesso** a um dado é mais importante do que sua permanência a longo prazo.

| Usos Comuns no Dia a Dia                                                                                             | Quando **NUNCA** Usar                                                                                                                            | Boas Práticas Essenciais                                                                                                                                                                                           |
| :------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ **Cache (Uso #1):** Armazenar resultados de consultas lentas do PostgreSQL por 5 minutos para aliviar o banco de dados. | ❌ **Banco de Dados Principal:** **Nunca** use o Redis como sua única fonte de verdade para dados críticos (clientes, finanças, etc.). Para isso você tem o PostgreSQL. | 💡 **Defina um TTL (Expiração):** Para **todo** dado em cache, defina um tempo de vida (`EXPIRE`). É melhor buscar um dado novo no banco do que usar um dado de cache obsoleto para sempre.                     |
| ✅ **Sessões de Usuário:** Guardar os dados do usuário que está logado. É muito mais rápido que consultar o banco a cada clique. | ❌ **Dados Relacionais Complexos:** Tentar guardar e relacionar dados complexos (ex: um cliente, com seus 10 pedidos, e os 5 produtos em cada pedido). Use o PostgreSQL para isso. | 💡 **Padrão de Nomenclatura de Chaves:** Seja organizado. Use um padrão como `objeto:id:campo`, por exemplo: `user:123:session` ou `cache:olts:all`.                                                     |
| ✅ **Resultados de Tarefas:** O complemento do RabbitMQ. O worker termina a tarefa e salva o resultado no Redis para a API consultar depois. | ❌ **Armazenamento de Arquivos:** Guardar imagens, PDFs ou qualquer arquivo binário grande. Para isso, use um serviço de armazenamento de objetos (como Amazon S3) ou o disco. | 💡 **Gerenciamento de Memória:** Saiba o que está guardando e o tamanho. Como usa RAM, você pode esgotar a memória do servidor se não for cuidadoso.                                                    |
| ✅ **Contadores e Limites (Rate Limiting):** Contar quantas vezes um IP tentou logar no último minuto para bloquear ataques. | ❌ **Busca por Texto Completo:** Tentar fazer buscas complexas por texto dentro dos valores. Use um motor de busca como Elasticsearch para isso.                               | 💡 **Use as Estruturas de Dados Corretas:** Redis não é só chave-valor. Aprenda a usar Hashes, Sets, Lists. Elas são otimizadas para diferentes casos de uso e muito mais eficientes. |

#### No Nosso Projeto:
- **Cache:** Ideal para guardar listas de dispositivos ou perfis de serviço que não mudam com frequência.
- **Resultados de Tarefas:** O `works` finaliza uma tarefa do RabbitMQ e escreve o resultado no Redis. O `backend` lê do Redis para mostrar o status ao usuário.

---

## 4. Fluxo de Trabalho Combinado: O Ciclo de Vida de uma Tarefa

Veja como os três trabalham juntos em um exemplo prático de "Executar Diagnóstico em uma OLT".

1.  **Requisição (Frontend):** O usuário clica no botão "Executar Diagnóstico" para a OLT "olt-001".

2.  **API (Backend):** O `backend` recebe a chamada em `POST /api/olts/olt-001/diagnose`. Em vez de executar a tarefa (que é lenta), ele cria uma mensagem: `{'task': 'run_diagnostics', 'olt_id': 'olt-001'}`.

3.  **Enfileiramento (RabbitMQ):** O `backend` publica essa mensagem na fila `diagnostics_tasks` do RabbitMQ. A API responde **imediatamente** para o frontend com `{'status': 'Tarefa de diagnóstico iniciada'}`. A tela do usuário fica livre.

4.  **Processamento (Works):** O serviço `works` vê a nova mensagem na fila, a consome e começa a executar o demorado diagnóstico na OLT "olt-001".

5.  **Armazenamento do Resultado (Redis):** Após 2 minutos, o `works` termina. Ele gera um ID único para o resultado (ex: `diag_xyz123`) e salva no Redis com um tempo de expiração: `SET 'task_result:diag_xyz123' '{"status": "completo", ...}' EX 3600`.

6.  **Consulta do Resultado (Backend):** O frontend, que pode estar verificando o status da tarefa, chama o endpoint `GET /api/tasks/results/diag_xyz123`. O `backend` lê essa chave do Redis e retorna o resultado para a UI.

7.  **Persistência (PostgreSQL):** Para fins de histórico, o `works` também pode salvar um resumo do resultado (quem pediu, quando, qual foi o resultado geral) na tabela de `auditoria` do PostgreSQL.
