# Documentação da API - Módulo de Visitantes (Visitors)

## Base URL
```
/v1/visitors
```

## Autenticação
Todas as rotas requerem autenticação via Bearer Token (JWT).
- Header: `Authorization: Bearer {token}`
- O token deve ser do tipo `CONCIERGE`
- O `buildingId` e `conciergeId` são extraídos automaticamente do token

---

## 1. Criar Visitante

### `POST /v1/visitors`

**Descrição**: Cria um novo visitante no sistema e retorna automaticamente uma presigned URL para upload da foto.

**Autenticação**: Obrigatória (Bearer Token - CONCIERGE)

**Request Body** (JSON):
```json
{
  "name": "João Silva",
  "email": "joao@example.com",           // Opcional
  "document": "12345678900",             // Opcional (CPF ou RG)
  "phone": "(13) 97408-0222",            // Opcional
  "vehicleType": "Carro",                // Opcional
  "vehiclePlate": "ABC1234",            // Opcional (formato: ABC1234 ou ABC1D23)
  "apartmentId": "123e4567-e89b-12d3-a456-426614174000",  // Opcional (UUID)
  "types": ["CONVIDADO"],                // Obrigatório (array com pelo menos 1 item)
  "note": "Visitante frequente"          // Opcional
}
```

**Validações**:
- `name`: Obrigatório, mínimo 3 caracteres, máximo 100 caracteres
- `email`: Opcional, deve ser um email válido
- `document`: Opcional, se fornecido deve ser único no buildingId
- `phone`: Opcional, formato: `^[\d\s\(\)\-]+$`
- `vehiclePlate`: Opcional, formato: `^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$` (antigo ou Mercosul)
- `types`: Obrigatório, array com pelo menos 1 item, valores: `["CONVIDADO"]`, `["PRESTADOR"]` ou `["CONVIDADO", "PRESTADOR"]`
- `apartmentId`: Opcional, deve ser um UUID válido e pertencer ao buildingId do token

**Response 201 (Success)**:
```json
{
  "success": true,
  "message": "Visitante cadastrado com sucesso",
  "data": {
    "_id": "abc-123-def-456",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "(13) 97408-0222",
    "presignedUrl": "https://s3.amazonaws.com/bucket/visitors/abc-123/abc-123-photo.jpg?X-Amz-Algorithm=..."
  }
}
```

**Response 400 (Bad Request)**:
```json
{
  "success": false,
  "message": "Erro de validação nos dados fornecidos",
  "errors": [
    {
      "field": "name",
      "message": "Nome deve ter no mínimo 3 caracteres"
    }
  ]
}
```

**Response 401 (Unauthorized)**:
```json
{
  "success": false,
  "message": "Token de autenticação inválido ou não fornecido"
}
```

**Response 403 (Forbidden)**:
```json
{
  "success": false,
  "message": "Apenas porteiros podem criar visitantes"
}
```

**Response 409 (Conflict)**:
```json
{
  "success": false,
  "message": "Já existe um visitante com este documento neste edifício"
}
```

**Fluxo de Upload de Foto**:
1. Criar o visitante via `POST /v1/visitors`
2. Receber a `presignedUrl` no response
3. Fazer upload da foto diretamente para o S3 usando a `presignedUrl` via PUT
4. A foto será automaticamente associada ao visitante (photoUrl já foi atualizada no backend)

---

## 2. Listar Visitantes

### `GET /v1/visitors`

**Descrição**: Lista visitantes com paginação e filtros do edifício do porteiro autenticado.

**Autenticação**: Obrigatória (Bearer Token - CONCIERGE)

**Query Parameters**:
- `page` (number, opcional): Número da página (default: 1)
- `limit` (number, opcional): Itens por página (default: 10, máximo: 100)
- `search` (string, opcional): Termo de busca
- `filterBy` (string, opcional): Tipo de filtro - valores: `"name"`, `"document"`, `"apartment"`

**Exemplos de Uso**:
```
GET /v1/visitors
GET /v1/visitors?page=1&limit=20
GET /v1/visitors?search=João&filterBy=name
GET /v1/visitors?search=12345678900&filterBy=document
GET /v1/visitors?search=101&filterBy=apartment
```

**Nota**: Quando `filterBy=apartment`, o `search` deve ser o **número do apartamento** (ex: "101"), não o ID. O sistema fará o join automaticamente com a tabela de apartamentos.

**Response 200 (Success)**:
```json
{
  "success": true,
  "message": "Visitantes encontrados com sucesso",
  "data": {
    "data": [
      {
        "_id": "abc-123-def-456",
        "name": "João Silva",
        "phone": "(13) 97408-0222",
        "vehicleType": "Carro",
        "vehiclePlate": "ABC1234",
        "apartmentId": "123e4567-e89b-12d3-a456-426614174000",
        "types": ["CONVIDADO"],
        "photoUrl": "https://bucket.s3.amazonaws.com/visitors/abc-123/abc-123-photo.jpg",
        "note": "Visitante frequente",
        "active": true,
        "apartmentNumber": "101"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

**Response 401 (Unauthorized)**:
```json
{
  "success": false,
  "message": "Token de autenticação inválido ou não fornecido"
}
```

**Response 403 (Forbidden)**:
```json
{
  "success": false,
  "message": "Apenas porteiros podem visualizar visitantes"
}
```

---

## 3. Buscar Visitante por ID

### `GET /v1/visitors/:id`

**Descrição**: Busca um visitante específico por ID do edifício do porteiro autenticado.

**Autenticação**: Obrigatória (Bearer Token - CONCIERGE)

**Path Parameters**:
- `id` (string, obrigatório): ID do visitante (UUID)

**Exemplo de Uso**:
```
GET /v1/visitors/abc-123-def-456
```

**Response 200 (Success)**:
```json
{
  "success": true,
  "message": "Visitante encontrado com sucesso",
  "data": {
    "_id": "abc-123-def-456",
    "name": "João Silva",
    "email": "joao@example.com",
    "document": "12345678900",
    "phone": "(13) 97408-0222",
    "vehicleType": "Carro",
    "vehiclePlate": "ABC1234",
    "apartmentId": "123e4567-e89b-12d3-a456-426614174000",
    "types": ["CONVIDADO"],
    "photoUrl": "https://bucket.s3.amazonaws.com/visitors/abc-123/abc-123-photo.jpg",
    "note": "Visitante frequente",
    "registeredBy": "concierge-id-123",
    "registeredAt": "2025-01-15T10:30:00Z",
    "buildingId": "building-id-123",
    "active": true,
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

**Response 404 (Not Found)**:
```json
{
  "success": false,
  "message": "Visitante não encontrado"
}
```

**Response 403 (Forbidden)**:
```json
{
  "success": false,
  "message": "Visitante não pertence ao mesmo edifício"
}
```

**Response 401 (Unauthorized)**:
```json
{
  "success": false,
  "message": "Token de autenticação inválido ou não fornecido"
}
```

---

## Resumo das Rotas

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| `POST` | `/v1/visitors` | Criar visitante | ✅ CONCIERGE |
| `GET` | `/v1/visitors` | Listar visitantes | ✅ CONCIERGE |
| `GET` | `/v1/visitors/:id` | Buscar visitante por ID | ✅ CONCIERGE |

---

## Tipos de Visitante

Os valores permitidos para o campo `types` são:
- `"CONVIDADO"` - Visitante convidado
- `"PRESTADOR"` - Prestador de serviço

O campo aceita um array, permitindo múltiplos tipos:
```json
{
  "types": ["CONVIDADO"]                    // Apenas convidado
}
```
ou
```json
{
  "types": ["CONVIDADO", "PRESTADOR"]        // Ambos os tipos
}
```

---

## Formato de Placa de Veículo

A placa pode estar em dois formatos:
- **Antigo**: `ABC1234` (3 letras + 4 números)
- **Mercosul**: `ABC1D23` (3 letras + 1 número + 1 letra + 2 números)

---

## Exemplo Completo de Fluxo

### 1. Criar Visitante
```javascript
// POST /v1/visitors
const response = await fetch('/v1/visitors', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer {token}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "João Silva",
    email: "joao@example.com",
    document: "12345678900",
    phone: "(13) 97408-0222",
    vehicleType: "Carro",
    vehiclePlate: "ABC1234",
    apartmentId: "123e4567-e89b-12d3-a456-426614174000",
    types: ["CONVIDADO"],
    note: "Visitante frequente"
  })
});

const data = await response.json();
// data.data.presignedUrl contém a URL para upload
```

### 2. Upload da Foto
```javascript
// Upload direto para S3 usando a presignedUrl
const photoFile = // arquivo de imagem selecionado pelo usuário

await fetch(data.data.presignedUrl, {
  method: 'PUT',
  headers: {
    'Content-Type': 'image/jpeg'
  },
  body: photoFile
});
```

### 3. Listar Visitantes
```javascript
// GET /v1/visitors?page=1&limit=10&search=João&filterBy=name
// GET /v1/visitors?search=101&filterBy=apartment  // Filtrar por número do apartamento
const response = await fetch('/v1/visitors?page=1&limit=10&search=João&filterBy=name', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer {token}'
  }
});

const data = await response.json();
// data.data.data contém o array de visitantes com apenas os campos:
// - _id, name, phone, vehicleType, vehiclePlate, apartmentId, types, photoUrl, note, active, apartmentNumber
// data.data.total contém o total de registros
// data.data.page contém a página atual
// data.data.totalPages contém o total de páginas
```

### 4. Buscar Visitante Específico
```javascript
// GET /v1/visitors/:id
const visitorId = "abc-123-def-456";
const response = await fetch(`/v1/visitors/${visitorId}`, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer {token}'
  }
});

const data = await response.json();
// data.data contém os dados completos do visitante
```

---

## Observações Importantes

1. **Isolamento por Building**: Todos os visitantes são filtrados automaticamente pelo `buildingId` do token JWT. Um porteiro só vê visitantes do seu próprio edifício.

2. **Documento Único**: Se o campo `document` for fornecido, ele deve ser único dentro do mesmo `buildingId`.

3. **ApartmentId**: Se fornecido, o `apartmentId` deve pertencer ao mesmo `buildingId` do token.

4. **Foto**: A foto é obrigatória e é gerenciada automaticamente. O backend gera a presigned URL e atualiza o `photoUrl` após o upload.

5. **Soft Delete**: O sistema usa soft delete (campo `deletedAt`), então visitantes deletados não aparecem nas consultas.

6. **Tipos em Maiúsculas**: Os valores do campo `types` devem estar em maiúsculas: `"CONVIDADO"` e `"PRESTADOR"`.

7. **Filtro por Apartamento**: Quando usar `filterBy=apartment`, o `search` deve ser o **número do apartamento** (ex: "101"), não o ID. O sistema faz join automático com a tabela de apartamentos.

8. **Campos Retornados na Listagem**: A listagem (`GET /v1/visitors`) retorna apenas os campos essenciais:
   - `_id`: ID do visitante
   - `name`: Nome do visitante
   - `phone`: Telefone (opcional)
   - `vehicleType`: Tipo de veículo (opcional)
   - `vehiclePlate`: Placa do veículo (opcional)
   - `apartmentId`: ID do apartamento (opcional)
   - `types`: Array de tipos (CONVIDADO, PRESTADOR)
   - `photoUrl`: URL da foto
   - `note`: Observações (opcional)
   - `active`: Status ativo/inativo
   - `apartmentNumber`: Número do apartamento (obtido via join, opcional)
