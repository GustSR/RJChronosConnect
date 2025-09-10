Este documento estabelece as diretrizes, padrões de arquitetura e boas práticas que devem ser seguidos por Gemini ao desenvolver e dar manutenção ao frontend deste projeto. O objetivo é garantir um código consistente, de alta qualidade, performático e escalável.

## 1. Stack Tecnológico Principal

O desenvolvimento deve aderir estritamente à seguinte stack:

- *Framework:* React 18+
- *Linguagem:* TypeScript
- *UI Kit:* Material-UI (MUI) v5+
- *Roteamento:* React Router v6+
- *Estilização:* Emotion (via styled() e prop sx do MUI)
- *Qualidade de Código:* ESLint e Prettier (configurações já presentes no projeto)

## 2. Arquitetura e Estrutura de Diretórios

O projeto seguirá o padrão *Feature-Sliced Design (FSD)* para organização de código. Ao criar ou refatorar, a seguinte estrutura deve ser respeitada:


src/
├── app/          # Configuração da aplicação (roteador, providers, store global)
├── pages/        # Composições de features e widgets para formar as páginas
├── features/     # Lógica de negócio (ex: provision-onu, edit-customer-info)
├── entities/     # Entidades de negócio (ex: Onu, Customer, Olt)
└── shared/       # Código reutilizável sem lógica de negócio (UI Kit, libs, api config)


- *Regra:* Qualquer nova funcionalidade deve ser organizada dentro dessa estrutura. Evite criar diretórios genéricos como components ou hooks na raiz de src. Em vez disso, coloque-os dentro da fatia apropriada (feature, entity, shared).

## 3. Gerenciamento de Estado (State Management)

A escolha da ferramenta de gerenciamento de estado depende da natureza do estado:

1.  *Estado de Servidor (Server State):*
    -   *Ferramenta:* *TanStack Query (React Query)* é *obrigatório* para todos os dados obtidos de uma API (GET, POST, PUT, DELETE).
    -   *Prática:* Crie hooks customizados que encapsulam as queries e mutations. Ex: useGetOnus(), useUpdateCustomer().
    -   *NÃO FAÇA:* Não use useState, useReducer, Context ou Zustand para armazenar dados de API.

2.  *Estado Global de Cliente (Client State):*
    -   *Ferramenta:* *Zustand* é a escolha preferencial para estados globais que não vêm do servidor (ex: estado de um modal de "tour", preferências de UI do usuário).
    -   *Alternativa:* *React Context* pode ser usado para estados que mudam com pouquíssima frequência, como o provedor de tema.

3.  *Estado Local:*
    -   *Ferramenta:* Use useState e useReducer para estados confinados a um único componente (ex: estado de "aberto/fechado" de um dropdown).

## 4. Componentes e Estilização

-   *Composição:* Crie componentes pequenos, focados e reutilizáveis. Prefira sempre a composição em vez da herança.
-   *Estilização Centralizada:*
    -   *Regra:* *Maximize o uso do theme do MUI* (src/theme/index.ts). Defina a paleta de cores, tipografia, espaçamentos e border-radius no tema.
    -   *Prática:* Evite valores "hardcoded" na prop sx. Use theme.palette.primary.main, theme.spacing(2), etc.
    -   *Componentes Estilizados:* Para componentes reutilizáveis com estilos complexos, use a função styled() do Emotion.

-   *Performance:*
    -   Use React.memo em componentes que são renderizados em listas longas ou que recebem props complexas que não mudam com frequência.
    -   Use useCallback e useMemo de forma criteriosa para evitar re-renderizações desnecessárias em componentes memoizados.
    -   Para listas com mais de 100 itens, a *virtualização* com *TanStack Virtual* deve ser considerada.

## 5. Formulários e Validação

-   *Gerenciamento de Formulários:*
    -   *Ferramenta:* *React Hook Form* é o padrão para todos os formulários da aplicação.
    -   *NÃO FAÇA:* Não gerencie o estado de formulários complexos com múltiplos useState.

-   *Validação:*
    -   *Ferramenta:* *Zod* é a escolha preferencial para definir schemas de validação. Sua capacidade de inferir tipos TypeScript o torna ideal para manter a consistência.
    -   *Prática:* Crie um schema Zod para cada formulário e passe-o para o resolver do React Hook Form.

## 6. Testes

-   *Stack de Testes:*
    -   *Test Runner:* *Vitest* (mantido por compatibilidade com Vite e performance superior)
    -   *Biblioteca de Testes:* *React Testing Library* para testes de componentes
    -   *Utilitários:* *@testing-library/jest-dom* para matchers customizados e *@testing-library/user-event* para simulação de eventos
    -   *Mocks de API:* *Mock Service Worker (MSW)* para interceptar e mockar chamadas de API

-   *Filosofia de Testes:*
    -   *Regra Principal:* Teste o *comportamento* da aplicação do ponto de vista do usuário, não os detalhes de implementação.
    -   *Prática:* Busque elementos da forma como o usuário os veria (por texto, label, role, placeholder). Use `screen.getByRole()`, `screen.getByLabelText()`, `screen.getByText()`.
    -   *Eventos:* Use `userEvent` para simular interações realistas do usuário (cliques, digitação, navegação por teclado).
    -   *NÃO FAÇA:* Não teste o estado interno de componentes, não use `getByTestId()` como primeira opção, não teste detalhes de implementação.

-   *Cobertura e Organização:*
    -   *Estrutura:* Coloque testes no mesmo diretório do arquivo testado com extensão `.test.ts` ou `.test.tsx`.
    -   *Prioridade:* Foque em testar funcionalidades críticas de negócio, formulários, fluxos de autenticação e componentes reutilizáveis.
    -   *Mock Strategy:* Use MSW para mockar APIs de forma consistente entre testes e desenvolvimento.

## 7. Boas Práticas Gerais

-   *Acessibilidade (a11y):* Garanta que a aplicação seja acessível. Use atributos aria-*, forneça labels para inputs e garanta que todos os elementos interativos sejam alcançáveis via teclado.
-   *Lazy Loading:* Todas as rotas de página devem ser carregadas usando React.lazy() para habilitar o code-splitting.
-   *Imports Absolutos:* Configure e utilize imports absolutos a partir de src/ para evitar caminhos relativos complexos (../../...).
-   *Código Limpo:* Siga os princípios de código limpo: nomes de variáveis e funções significativos, funções pequenas e com uma única responsabilidade, e evite código comentado desnecessário.