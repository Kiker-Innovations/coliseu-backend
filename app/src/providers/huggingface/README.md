# Hugging Face Provider - Guia de Configuração

Este documento explica como configurar e usar modelos de embeddings do Hugging Face, incluindo modelos premium/pagos.

## Modelo Atual (Gratuito - Melhor Disponível)

**Modelo padrão**: `intfloat/multilingual-e5-base`

- ✅ **GRATUITO** via Hugging Face Inference API
- ✅ **MELHOR modelo gratuito** para tarefas multilíngues
- ✅ Excelente qualidade para português e 100+ idiomas
- ✅ 768 dimensões
- ✅ State-of-the-art em benchmarks multilíngues
- ✅ Baseado em arquitetura E5 (Embeddings from Bidirectional Encoder Representations)
- ✅ Otimizado para similaridade semântica e retrieval tasks

## Modelos Premium Disponíveis

Se você precisar de ainda mais precisão, considere estes modelos:

### 1. `intfloat/multilingual-e5-large` (Recomendado para Alta Precisão)

**Características:**
- Modelo E5 (Embeddings from Bidirectional Encoder Representations)
- Melhor qualidade geral para tarefas multilíngues
- 1024 dimensões
- Pode ter custos dependendo do uso

**Como configurar:**

1. **Obter API Key do Hugging Face:**
   ```bash
   # Acesse: https://huggingface.co/settings/tokens
   # Crie um token com permissões de leitura
   ```

2. **Verificar se o modelo requer pagamento:**
   - Acesse: https://huggingface.co/intfloat/multilingual-e5-large
   - Verifique se há informações sobre custos na página do modelo

3. **Configurar no ambiente:**
   ```bash
   # No arquivo .env
   HF_API_KEY=seu_token_aqui
   HF_EMBEDDINGS_MODEL=intfloat/multilingual-e5-large
   ```

4. **Ajustar thresholds (se necessário):**
   ```bash
   # Modelos maiores podem precisar de thresholds diferentes
   HF_DEDUP_THRESHOLD=0.70
   HF_SIMILARITY_THRESHOLD=0.75
   ```

### 2. `sentence-transformers/all-mpnet-base-v2` (Melhor para Inglês)

**Características:**
- Melhor modelo para textos em inglês
- 768 dimensões
- Gratuito

**Configuração:**
```bash
HF_EMBEDDINGS_MODEL=sentence-transformers/all-mpnet-base-v2
```

## Como Ativar Recursos Pagos no Hugging Face

### Passo 1: Criar Conta no Hugging Face

1. Acesse: https://huggingface.co/join
2. Crie uma conta gratuita

### Passo 2: Obter API Token

1. Acesse: https://huggingface.co/settings/tokens
2. Clique em "New token"
3. Dê um nome ao token (ex: "coliseu-backend")
4. Selecione o tipo: "Read" (para usar modelos públicos) ou "Write" (se precisar de acesso a modelos privados)
5. Clique em "Generate token"
6. **Copie o token imediatamente** (não será mostrado novamente)

### Passo 3: Configurar Billing (se necessário)

Alguns modelos podem requerer billing:

1. Acesse: https://huggingface.co/settings/billing
2. Adicione método de pagamento se solicitado
3. Verifique limites e custos na página do modelo específico

### Passo 4: Configurar no Projeto

1. Adicione o token no arquivo `.env`:
   ```bash
   HF_API_KEY=hf_seu_token_aqui
   ```

2. (Opcional) Configure um modelo diferente:
   ```bash
   HF_EMBEDDINGS_MODEL=intfloat/multilingual-e5-large
   ```

3. Reinicie a aplicação

## Verificando se o Modelo Está Funcionando

Após configurar, você verá logs como:

```
[AI] Processando X sugestões com dedupThreshold=0.65, similarityThreshold=0.70
[AI] Etapa 1 concluída: X -> Y sugestões únicas
[AI] Etapa 2: Y sugestões agrupadas em Z grupos
```

Se houver erros de autenticação ou billing, eles aparecerão nos logs.

## Troubleshooting

### Erro: "401 Unauthorized"
- Verifique se o `HF_API_KEY` está correto
- Confirme que o token tem as permissões necessárias

### Erro: "Model not found" ou "403 Forbidden"
- O modelo pode ser privado ou requerer acesso especial
- Verifique na página do modelo se há requisitos especiais

### Erro: "Rate limit exceeded"
- Você atingiu o limite de requisições gratuitas
- Considere upgrade do plano ou usar um modelo diferente

### Modelo muito lento
- Modelos maiores (e5-large, mpnet-base) são mais lentos
- Considere usar batch menor ou modelo mais leve

## Comparação de Modelos

| Modelo | Dimensões | Qualidade | Velocidade | Custo | Status |
|--------|-----------|-----------|------------|-------|--------|
| `paraphrase-multilingual-MiniLM-L12-v2` | 384 | Boa | Rápido | Gratuito | Alternativa |
| `paraphrase-multilingual-mpnet-base-v2` | 768 | Excelente | Médio | Gratuito | Alternativa |
| **`intfloat/multilingual-e5-base`** | **768** | **Superior** | **Médio** | **Gratuito** | **✅ ATUAL** |
| `intfloat/multilingual-e5-large` | 1024 | Máxima | Lento | Pode ter custo | Premium |
| `nomic-ai/nomic-embed-text-v2-moe` | 768 | Muito Boa | Médio | Gratuito | Alternativa |

**Recomendação**: O modelo `intfloat/multilingual-e5-base` é atualmente o melhor modelo gratuito disponível para tarefas multilíngues, oferecendo performance superior aos outros modelos gratuitos.

## Recursos Úteis

- [Hugging Face Model Hub](https://huggingface.co/models?pipeline_tag=feature-extraction)
- [Hugging Face Inference API Docs](https://huggingface.co/docs/api-inference)
- [Sentence Transformers Models](https://www.sbert.net/docs/pretrained_models.html)
- [Hugging Face Billing](https://huggingface.co/settings/billing)

