# Design System — Tokens Semanticos (RJChronosConnect)

## Visao geral do app
- O RJChronosConnect e uma plataforma web para gestao e monitoramento de equipamentos de rede (CPEs/ONUs) via TR-069, com foco em diagnostico, provisionamento e alertas.
- Este documento foi montado a partir do contexto do repositorio e do tema atual do frontend em `services/frontend/src/theme/colors.ts`.
- Nao foram fornecidos screenshots; se houver ajustes de marca ou de UI, me avise para refinar o mapeamento.

## Paleta de cores (valores reais -> tokens)

### Texto
| Token | Valor |
| --- | --- |
| text-primary | #101828 |
| text-secondary | #344054 |
| text-muted | #98A2B3 |
| text-on-dark | #FFFFFF |
| text-on-brand | #FFFFFF |

### Superficies (fundos)
| Token | Valor |
| --- | --- |
| surface-page | #FFFFFF |
| surface-section | #F9FAFB |
| surface-card | #FFFFFF |
| surface-subtle | #FCFCFD |
| surface-elevated | #FFFFFF |

### Acoes (botoes, links)
| Token | Valor |
| --- | --- |
| action-primary | #101828 |
| action-primary-hover | #101828 |
| action-primary-active | #101828 |
| action-secondary | #667085 |
| action-strong | #101828 |
| action-strong-hover | #1D2939 |

### Bordas
| Token | Valor |
| --- | --- |
| border-default | #EAECF0 |
| border-subtle | #F2F4F7 |
| border-focus | #101828 |

### Status
| Token | Valor |
| --- | --- |
| status-success | #11B886 |
| status-warning | #FEBF06 |
| status-error | #EF4770 |

## Componentes documentados

### Fundacoes (tokens base)
- Espacamento: `space-1`, `space-2`, `space-3`, `space-4`, `space-6`, `space-8`, `space-12`, `space-16`, `space-20`
- Tipografia (tamanhos): `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`, `text-5xl`
- Tipografia (pesos): `font-normal`, `font-medium`, `font-semibold`, `font-bold`
- Raio: `radius-sm`, `radius-md`, `radius-lg`, `radius-xl`, `radius-2xl`, `radius-full`
- Sombras: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-card`, `shadow-card-hover`, `shadow-button-primary`

### Botoes

**Primary**
- Default: bg `action-primary`, texto `text-on-brand`, raio `radius-md`, sombra `shadow-button-primary`, tipografia `text-sm` + `font-semibold`, padding `space-3` (vertical) e `space-4` (horizontal)
- Hover: bg `action-primary-hover`, sombra `shadow-button-primary`
- Active/Pressed: bg `action-primary-active`, sombra `shadow-button-primary`
- Focus: ring na cor `border-focus`
- Disabled: bg `surface-subtle`, texto `text-muted`, borda `border-subtle`, cursor `not-allowed`

**Secondary**
- Default: bg `surface-card`, texto `text-primary`, borda `border-default`, raio `radius-md`, tipografia `text-sm` + `font-semibold`, padding `space-3` e `space-4`
- Hover: bg `surface-subtle`, borda `border-default`
- Active/Pressed: bg `surface-section`, borda `border-default`
- Focus: ring na cor `border-focus`
- Disabled: bg `surface-subtle`, texto `text-muted`, borda `border-subtle`, cursor `not-allowed`

**Strong (CTA)**
- Default: bg `action-strong`, texto `text-on-dark`, raio `radius-md`, sombra `shadow-lg`, tipografia `text-sm` + `font-semibold`, padding `space-3` e `space-4`
- Hover: bg `action-strong-hover`, sombra `shadow-lg`
- Active/Pressed: bg `action-strong`, sombra `shadow-lg`
- Focus: ring na cor `border-focus`
- Disabled: bg `surface-subtle`, texto `text-muted`, borda `border-subtle`, cursor `not-allowed`

### Cards
- Default: bg `surface-card`, raio `radius-xl`, sombra `shadow-card`, padding `space-6`
- Hover (cards clicaveis): sombra `shadow-card-hover`
- Active/Pressed (cards clicaveis): sombra `shadow-sm`
- Focus (cards clicaveis): ring na cor `border-focus`
- Disabled (cards clicaveis): bg `surface-subtle`, texto `text-muted`, borda `border-subtle`, cursor `not-allowed`

### Inputs (texto, select, textarea)
- Default: bg `surface-card`, texto `text-primary`, borda `border-default`, raio `radius-sm`, placeholder `text-muted`, padding `space-3` e `space-4`
- Hover: borda `border-default`, sombra `shadow-sm`
- Active/Pressed: borda `border-default`
- Focus: borda `border-focus` + ring `border-focus`
- Disabled: bg `surface-subtle`, texto `text-muted`, borda `border-subtle`, cursor `not-allowed`

### Links
- Default: texto `action-primary`, tipografia `text-sm` + `font-medium`
- Hover: texto `action-primary-hover`
- Active/Pressed: texto `action-primary-active`
- Focus: ring na cor `border-focus`
- Disabled: texto `text-muted`, cursor `not-allowed`

### Alerts (inline) e Toasts
**Success / Warning / Error**
- Default: bg `surface-subtle`, borda `border-default`, titulo `text-primary`, corpo `text-secondary`
- Indicador (icone ou barra lateral): `status-success` ou `status-warning` ou `status-error`
- Focus (quando interativo): ring na cor `border-focus`
- Disabled: texto `text-muted`

### Modais / Dialogs
- Default: bg `surface-elevated`, raio `radius-2xl`, sombra `shadow-lg`, padding `space-8`
- Header: titulo `text-2xl` + `font-semibold`, texto `text-primary`
- Corpo: texto `text-base` + `font-normal`, texto `text-secondary`
- Footer: espacamento `space-4` entre botoes
- Focus: ring na cor `border-focus` nos elementos focaveis

### Tabelas
- Header: bg `surface-section`, texto `text-secondary`, tipografia `text-sm` + `font-semibold`
- Linha default: bg `surface-card`, texto `text-primary`
- Linha hover: bg `surface-subtle`
- Linha selecionada: bg `surface-section`
- Bordas: `border-subtle`
- Focus (linha clicavel): ring na cor `border-focus`

### Tabs / Navegacao secundaria
- Tab default: texto `text-secondary`
- Tab ativa: texto `action-primary`
- Hover: texto `action-primary-hover`
- Focus: ring na cor `border-focus`
- Disabled: texto `text-muted`

### Badges / Chips
- Default: bg `surface-subtle`, texto `text-secondary`, raio `radius-full`, tipografia `text-xs` + `font-medium`, padding `space-1` e `space-2`
- Success / Warning / Error: texto `status-success` ou `status-warning` ou `status-error`
- Disabled: texto `text-muted`

## Exemplos de uso

**Botao primario em toolbar**
- Container: bg `surface-page`, padding `space-4`
- Botao: seguir padrao Primary
- Link secundario: usar `Links` com `action-primary`

**Card KPI**
- Card: `surface-card`, `radius-xl`, `shadow-card`, padding `space-6`
- Titulo: `text-sm` + `font-semibold`, cor `text-secondary`
- Valor: `text-3xl` + `font-bold`, cor `text-primary`
- Delta (positivo/negativo): cor `status-success` ou `status-error`

**Formulario simples**
- Label: `text-sm` + `font-medium`, cor `text-secondary`
- Input: seguir padrao `Inputs`
- Hint: `text-xs` + `font-normal`, cor `text-muted`
- Botao de envio: `Primary`

**Alert de erro**
- Container: bg `surface-subtle`, borda `border-default`, padding `space-4`
- Indicador: `status-error`
- Texto: titulo `text-sm` + `font-semibold` em `text-primary`, corpo `text-sm` em `text-secondary`
