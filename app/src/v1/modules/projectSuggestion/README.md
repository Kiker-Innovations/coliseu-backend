# Project Suggestions Module

Este módulo implementa o fluxo de sugestões de projetos para temporadas (seasons).

## Fluxo de Uso

1. **Administrador inicia uma temporada** (módulo Season)
2. **Moradores cadastram sugestões** (módulo ResidentSuggestion)
3. **Administrador rankeia as sugestões** (`POST /v1/seasons/:seasonId/rank-suggestions`)
4. **Administrador inicia período de votação** (`POST /v1/seasons/:seasonId/project-suggestions/start-voting`)
5. **Moradores votam nas sugestões** (`POST /v1/project-suggestions/vote`)
6. **Administrador encerra a votação** (`POST /v1/seasons/:seasonId/project-suggestions/end-voting`)
7. **Administrador cria projetos** (`POST /v1/seasons/:seasonId/project-suggestions/create-projects`)

## Rotas

### Rotas de Administrador

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/v1/seasons/:seasonId/rank-suggestions` | Processa e rankeia as sugestões dos moradores de uma season. Remove duplicatas e organiza por relevância |
| POST | `/v1/seasons/:seasonId/project-suggestions/start-voting` | Inicia o período de votação definindo datas de início e fim |
| POST | `/v1/seasons/:seasonId/project-suggestions/end-voting` | Encerra o período de votação e recalcula o ranking baseado nos votos |
| POST | `/v1/seasons/:seasonId/project-suggestions/create-projects` | Cria projetos a partir das sugestões mais votadas (default: top 3) |
| GET | `/v1/seasons/:seasonId/project-suggestions` | Lista todas as sugestões rankeadas de uma season |

### Rotas de Morador

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/v1/project-suggestions/vote` | Registra ou atualiza votos em uma sugestão (máximo 3 votos por season) |
| DELETE | `/v1/project-suggestions/:projectSuggestionId/vote` | Remove os votos de uma sugestão específica |
| GET | `/v1/seasons/:seasonId/project-suggestions/my-votes` | Retorna os votos do morador em todas as sugestões da season |
| GET | `/v1/seasons/:seasonId/project-suggestions` | Lista todas as sugestões rankeadas de uma season |

## Detalhes das Rotas

### POST /v1/seasons/:seasonId/rank-suggestions

Processa as sugestões dos moradores aplicando o seguinte algoritmo:
1. Remove duplicatas do mesmo morador (mantém apenas a primeira)
2. Identifica duplicatas entre moradores diferentes, contabilizando quantas vezes cada sugestão apareceu
3. Rankeia as sugestões por número de duplicações (maior relevância = mais moradores sugeriram)
4. Gera uma lista final de sugestões elegíveis para votação

**Permissão:** Apenas administradores

**Parâmetros:**
- `seasonId` (path): ID da season (UUID)

**Response (201):**
```json
{
  "success": true,
  "message": "Sugestões rankeadas com sucesso",
  "data": [
    {
      "_id": "uuid",
      "buildingId": "uuid",
      "seasonId": "uuid",
      "title": "string",
      "description": "string",
      "duplicateCount": 5,
      "rank": 1,
      "votes": 0,
      "votingStartDate": null,
      "votingEndDate": null,
      "status": "AGUARDANDO_VOTACAO",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ]
}
```

### POST /v1/seasons/:seasonId/project-suggestions/start-voting

Inicia o período de votação para as sugestões rankeadas.

**Permissão:** Apenas administradores

**Parâmetros:**
- `seasonId` (path): ID da season (UUID)

**Body:**
```json
{
  "votingStartDate": "2025-01-15T09:00:00.000Z",
  "votingEndDate": "2025-01-30T18:00:00.000Z"
}
```

### POST /v1/seasons/:seasonId/project-suggestions/end-voting

Encerra o período de votação e recalcula o ranking baseado nos votos.

**Permissão:** Apenas administradores

**Parâmetros:**
- `seasonId` (path): ID da season (UUID)

### POST /v1/project-suggestions/vote

Registra ou atualiza os votos de um morador em uma sugestão.

**Permissão:** Apenas moradores

**Regras:**
- Cada morador possui 3 votos por season
- Os votos podem ser distribuídos livremente entre as sugestões
- Exemplo: 3 votos em uma única sugestão, ou 2+1, ou 1+1+1

**Body:**
```json
{
  "projectSuggestionId": "uuid",
  "voteCount": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Voto registrado com sucesso",
  "data": {
    "id": "uuid",
    "projectSuggestionId": "uuid",
    "voteCount": 2
  }
}
```

### DELETE /v1/project-suggestions/:projectSuggestionId/vote

Remove os votos de um morador em uma sugestão específica.

**Permissão:** Apenas moradores

**Parâmetros:**
- `projectSuggestionId` (path): ID da sugestão (UUID)

### GET /v1/seasons/:seasonId/project-suggestions/my-votes

Retorna os votos do morador autenticado em todas as sugestões de uma season.

**Permissão:** Apenas moradores

**Parâmetros:**
- `seasonId` (path): ID da season (UUID)

**Response (200):**
```json
{
  "success": true,
  "message": "Votos encontrados com sucesso",
  "data": [
    {
      "projectSuggestionId": "uuid",
      "voteCount": 2
    }
  ]
}
```

### POST /v1/seasons/:seasonId/project-suggestions/create-projects

Cria projetos a partir das sugestões mais votadas de uma season.

**Permissão:** Apenas administradores

**Parâmetros:**
- `seasonId` (path): ID da season (UUID)

**Body (opcional):**
```json
{
  "top": 3
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "3 projeto(s) criado(s) com sucesso",
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "votes": 10
    }
  ]
}
```

## Status das Sugestões

| Status | Descrição |
|--------|-----------|
| AGUARDANDO_VOTACAO | Sugestão foi rankeada mas votação ainda não iniciou |
| EM_VOTACAO | Período de votação está ativo |
| VOTACAO_ENCERRADA | Período de votação foi encerrado |

## Entidades

### ProjectSuggestion

```typescript
{
  _id: string;
  buildingId: string;
  seasonId: string;
  title: string;
  description: string;
  duplicateCount: number;
  rank: number;
  votes: number;
  votingStartDate: Date | null;
  votingEndDate: Date | null;
  status: "AGUARDANDO_VOTACAO" | "EM_VOTACAO" | "VOTACAO_ENCERRADA";
  createdAt: Date;
  updatedAt: Date;
}
```

### ProjectSuggestionPoll

```typescript
{
  _id: string;
  projectSuggestionId: string;
  residentId: string;
  voteCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

