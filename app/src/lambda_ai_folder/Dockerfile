# 1. Base específica para Lambda Python (use a 3.12 que é moderna)
FROM public.ecr.aws/lambda/python:3.12

# 2. Copia o arquivo de dependências
COPY req.txt ${LAMBDA_TASK_ROOT}

# 3. Instala as bibliotecas pesadas (sentence-transformers + torch)
# Usamos o --no-cache-dir para a imagem não ficar gigantesca à toa
RUN pip install --no-cache-dir -r req.txt --target "${LAMBDA_TASK_ROOT}"

# 4. TRUQUE DE MESTRE: Pré-baixar o modelo da IA
# Isso evita que o Lambda tente baixar o modelo toda vez que "acordar" (Cold Start)
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')"

# 5. Copia seus códigos Python
COPY lambda_function.py ${LAMBDA_TASK_ROOT}
COPY simil.py ${LAMBDA_TASK_ROOT}

# 6. Handler no formato: arquivo.funcao
CMD [ "lambda_function.lambda_handler" ]