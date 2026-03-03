







# from sentence_transformers import SentenceTransformer, util
# print("oi")
# model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
# frases = [
#     "conserto na academia",
#     "deve-se ter uma atenção na manutenção no ginásio",
#     "o preço do feijão subiu no mercado"
# ]
# embeddings = model.encode(frases)
# sim_1_2 = util.cos_sim(embeddings[0], embeddings[1])
# sim_1_3 = util.cos_sim(embeddings[0], embeddings[2])
# print(f"Similaridade Conserto vs Manutenção: {sim_1_2.item():.4f}")
# print(f"Similaridade Conserto vs Feijão: {sim_1_3.item():.4f}")