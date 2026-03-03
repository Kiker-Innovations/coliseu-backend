import json
import os

os.environ['TRANSFORMERS_CACHE'] = '/tmp'
os.environ['TORCH_HOME'] = '/tmp'
os.environ['HF_HOME'] = '/tmp'

model = None

def start_model():
    global model
    if model is None:
        print("Importando bibliotecas pesadas...")
        from sentence_transformers import SentenceTransformer
        print("Carregando modelo...")
        model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
    return model



def lambda_handler(event, context):
    ai_model = start_model()
    for record in event['Records']:
        corpo_da_mensagem = record['body']
        dados = json.loads(corpo_da_mensagem)
        print(f"Mensagem recebida: {dados}")

    return {
        'statusCode': 200,
        'body': json.dumps('Processado com sucesso!')
    }