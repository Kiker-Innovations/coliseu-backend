import { env } from "../../config/env";

/**
 * Base URL for Hugging Face Inference API (new router endpoint).
 * The old api-inference.huggingface.co has been deprecated.
 */
const HF_ROUTER_BASE = "https://router.huggingface.co/hf-inference";
const HF_MODEL_BASE = `${HF_ROUTER_BASE}/models`;

/**
 * Result of generating embeddings for multiple texts.
 */
export interface EmbeddingsResult {
	embeddings: number[][];
	model: string;
}

/**
 * Result of generating canonical text from grouped suggestions.
 */
export interface CanonicalTextResult {
	title: string;
	description: string;
}

/**
 * Suggestion input for canonical text generation.
 */
export interface SuggestionInput {
	title: string;
	description: string;
}

/**
 * HuggingFaceProvider handles all AI operations using the Hugging Face Inference API.
 * Uses direct HTTP requests to router.huggingface.co (new endpoint).
 *
 * It provides methods for:
 * - Generating text embeddings for semantic similarity comparison
 * - Generating canonical titles/descriptions from grouped suggestions using LLM
 */
export class HuggingFaceProvider {
	private apiKey: string;
	private embeddingsModel: string;
	private summarizationModel: string;

	constructor() {
		this.apiKey = env.providers.huggingface.apiKey || "";
		this.embeddingsModel = env.providers.huggingface.embeddingsModel;
		this.summarizationModel = env.providers.huggingface.summarizationModel;
	}

	/**
	 * Checks if the Hugging Face provider is configured and available.
	 */
	public isAvailable(): boolean {
		return Boolean(this.apiKey);
	}

	/**
	 * Makes an HTTP request to the Hugging Face Inference API for text generation.
	 *
	 * @param model - Model ID to use
	 * @param payload - Request payload
	 * @returns API response as JSON
	 */
	private async makeRequest<T>(model: string, payload: unknown): Promise<T> {
		const url = `${HF_MODEL_BASE}/${model}`;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`HuggingFace API error (${response.status}): ${errorText}`,
			);
		}

		return response.json() as Promise<T>;
	}

	/**
	 * Makes an HTTP request to the Hugging Face Feature Extraction Pipeline.
	 * Uses the correct endpoint: /models/{MODEL}/pipeline/feature-extraction
	 *
	 * @param model - Model ID to use
	 * @param texts - Array of texts to generate embeddings for
	 * @returns API response as JSON (array of embeddings)
	 */
	private async makeEmbeddingRequest<T>(
		model: string,
		texts: string[],
	): Promise<T> {
		const url = `${HF_MODEL_BASE}/${model}/pipeline/feature-extraction`;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ inputs: texts }),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`HuggingFace Embedding API error (${response.status}): ${errorText}`,
			);
		}

		return response.json() as Promise<T>;
	}

	/**
	 * Generates embeddings for a batch of texts using the best free multilingual embedding model.
	 * The embeddings are 768-dimensional vectors that capture semantic meaning.
	 *
	 * Uses the feature-extraction pipeline with intfloat/multilingual-e5-base
	 * which is currently the BEST FREE multilingual embedding model available:
	 * - State-of-the-art performance on multilingual benchmarks
	 * - Excellent support for Portuguese and 100+ languages
	 * - Optimized for semantic similarity and retrieval tasks
	 * - Based on E5 (Embeddings from Bidirectional Encoder Representations)
	 * - Trained on large-scale multilingual datasets
	 *
	 * This model outperforms most other free models including:
	 * - paraphrase-multilingual-mpnet-base-v2
	 * - paraphrase-multilingual-MiniLM-L12-v2
	 * - sentence-transformers models
	 *
	 * Alternative models (if needed):
	 * - intfloat/multilingual-e5-large (premium, 1024 dims, even better)
	 * - nomic-ai/nomic-embed-text-v2-moe (alternative free option)
	 *
	 * @param texts - Array of texts to generate embeddings for
	 * @returns Object containing the embeddings array and model used
	 * @throws Error if the API call fails or client is not initialized
	 */
	public async generateEmbeddings(texts: string[]): Promise<EmbeddingsResult> {
		if (!this.apiKey) {
			throw new Error(
				"HuggingFace API key not configured. Please provide HF_API_KEY.",
			);
		}

		if (texts.length === 0) {
			return { embeddings: [], model: this.embeddingsModel };
		}

		try {
			const embeddings: number[][] = [];

			// Process texts in batches to avoid API limits
			const batchSize = 32;
			for (let i = 0; i < texts.length; i += batchSize) {
				const batch = texts.slice(i, i + batchSize);

				// Call feature extraction with array of texts in a single request
				// Endpoint: /models/{MODEL}/pipeline/feature-extraction
				// Payload: { inputs: ["text1", "text2", ...] }
				const result = await this.makeEmbeddingRequest<number[][]>(
					this.embeddingsModel,
					batch,
				);

				// The API returns an array of embeddings, one for each input text
				// Embedding dimensions vary by model:
				// - intfloat/multilingual-e5-base: 768 dimensions (current, best free)
				// - intfloat/multilingual-e5-large: 1024 dimensions (premium)
				// - paraphrase-multilingual-mpnet-base-v2: 768 dimensions
				// - paraphrase-multilingual-MiniLM-L12-v2: 384 dimensions
				if (Array.isArray(result)) {
					for (const embedding of result) {
						embeddings.push(this.flattenEmbedding(embedding));
					}
				} else {
					throw new Error("Unexpected response format: expected array of embeddings");
				}
			}

			return { embeddings, model: this.embeddingsModel };
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unknown error occurred";
			throw new Error(`Failed to generate embeddings: ${message}`);
		}
	}

	/**
	 * Generates a canonical title and description from a group of similar suggestions.
	 * Uses the Mistral model to summarize and create a unified representation.
	 *
	 * The description is a mix/combination of all original descriptions.
	 *
	 * @param suggestions - Array of similar suggestions to merge
	 * @returns Object containing the canonical title and description
	 * @throws Error if the API call fails or client is not initialized
	 */
	public async generateCanonicalText(
		suggestions: SuggestionInput[],
	): Promise<CanonicalTextResult> {
		if (!this.apiKey) {
			throw new Error(
				"HuggingFace API key not configured. Please provide HF_API_KEY.",
			);
		}

		if (suggestions.length === 0) {
			return { title: "", description: "" };
		}

		// If only one suggestion, return it as-is
		if (suggestions.length === 1) {
			return {
				title: suggestions[0].title,
				description: suggestions[0].description,
			};
		}

		// Check if all descriptions are the same - if so, no need to combine
		const uniqueDescriptions = [
			...new Set(suggestions.map((s) => s.description.trim())),
		];
		if (uniqueDescriptions.length === 1) {
			return {
				title: suggestions[0].title,
				description: suggestions[0].description,
			};
		}

		try {
			// Build the prompt for the LLM
			const suggestionList = suggestions
				.map(
					(s, i) =>
						`${i + 1}. Título: "${s.title}"\n   Descrição: ${s.description}`,
				)
				.join("\n");

			const prompt = `Você é um assistente especializado em síntese de sugestões de moradores de condomínios.

CONTEXTO: Diferentes moradores de um condomínio fizeram sugestões similares sobre o mesmo tema. Você deve criar UMA sugestão canônica que represente todas elas.

SUGESTÕES DOS MORADORES:
${suggestionList}

TAREFA: Gere uma única sugestão canônica que:
1. Tenha um TÍTULO representativo que capture a essência comum de todas as sugestões
2. Tenha uma DESCRIÇÃO que UNIFIQUE e COMBINE TODAS as descrições originais, incluindo TODOS os pontos mencionados

A resposta DEVE ser um JSON válido no seguinte formato:
{"title": "Título canônico da sugestão", "description": "Descrição unificada que combina TODAS as descrições originais"}

REGRAS IMPORTANTES PARA A DESCRIÇÃO:
- DEVE ser UMA NOVA FRASE unificada, não apenas uma concatenação ou lista
- Crie uma narrativa coerente e fluida que integre TODAS as informações
- DEVE incluir TODOS os pontos mencionados em TODAS as descrições originais
- Não omita informações importantes de nenhuma descrição
- Se houver informações complementares, integre-as naturalmente na descrição final
- Use linguagem clara, objetiva e natural
- Mantenha o contexto de condomínio
- NÃO invente informações que não estejam nas sugestões originais
- A descrição deve ser uma síntese unificada, não uma lista de pontos
- O título deve ser conciso e representativo (máximo 100 caracteres)
- Responda APENAS com o JSON, sem texto adicional`;

			// Use text generation with the Mistral model
			interface TextGenerationResponse {
				generated_text?: string;
				// Some models return an array
				0?: { generated_text: string };
			}

			const response = await this.makeRequest<TextGenerationResponse>(
				this.summarizationModel,
				{
					inputs: prompt,
					parameters: {
						max_new_tokens: 256,
						temperature: 0.3,
						return_full_text: false,
					},
				},
			);

			// Parse the JSON response
			// Handle both object and array response formats
			let generatedText: string;
			if (typeof response === "object" && response !== null) {
				if ("generated_text" in response && response.generated_text) {
					generatedText = response.generated_text.trim();
				} else if (Array.isArray(response) && response[0]?.generated_text) {
					generatedText = response[0].generated_text.trim();
				} else {
					throw new Error("Unexpected response format from text generation API");
				}
			} else {
				throw new Error("Invalid response from text generation API");
			}

			const jsonMatch = generatedText.match(/\{[\s\S]*\}/);

			if (!jsonMatch) {
				// Fallback: combinar descrições usando combineDescriptions
				console.warn(
					"[HuggingFace] Failed to parse LLM response, using combineDescriptions as fallback",
				);
				const allDescriptions = suggestions
					.map((s) => s.description)
					.filter((desc) => desc.trim().length > 0);
				const unifiedDescription = await this.combineDescriptions(
					allDescriptions,
					suggestions[0].title,
				);
				return {
					title: suggestions[0].title,
					description: unifiedDescription,
				};
			}

			const parsed = JSON.parse(jsonMatch[0]) as CanonicalTextResult;

			// Validate the parsed result
			if (!parsed.title || !parsed.description) {
				// Se não gerou descrição válida, usar combineDescriptions como fallback
				const allDescriptions = suggestions
					.map((s) => s.description)
					.filter((desc) => desc.trim().length > 0);
				const unifiedDescription =
					await this.combineDescriptions(allDescriptions, parsed.title || suggestions[0].title);
				return {
					title: parsed.title || suggestions[0].title,
					description: unifiedDescription,
				};
			}

			// Verificar se a descrição retornada realmente unificou as descrições
			// Se for igual à primeira descrição e há descrições diferentes, forçar unificação
			if (
				parsed.description === suggestions[0].description &&
				uniqueDescriptions.length > 1
			) {
				console.log(
					"[HuggingFace] LLM retornou descrição não unificada. Forçando unificação...",
				);
				const allDescriptions = suggestions
					.map((s) => s.description)
					.filter((desc) => desc.trim().length > 0);
				parsed.description = await this.combineDescriptions(
					allDescriptions,
					parsed.title,
				);
			}

			return parsed;
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unknown error occurred";
			console.warn(
				`[HuggingFace] Failed to generate canonical text: ${message}. Using combineDescriptions as fallback.`,
			);

			// Fallback: tentar combinar descrições mesmo em caso de erro
			try {
				const allDescriptions = suggestions
					.map((s) => s.description)
					.filter((desc) => desc.trim().length > 0);
				const unifiedDescription = await this.combineDescriptions(
					allDescriptions,
					suggestions[0].title,
				);
				return {
					title: suggestions[0].title,
					description: unifiedDescription,
				};
			} catch (fallbackError) {
				// Se até o fallback falhar, usar primeira descrição
				console.error(
					`[HuggingFace] Fallback também falhou: ${fallbackError instanceof Error ? fallbackError.message : "Unknown error"}`,
				);
				return {
					title: suggestions[0].title,
					description: suggestions[0].description,
				};
			}
		}
	}

	/**
	 * Combines multiple descriptions into a single unified description using AI.
	 * Useful when merging duplicate suggestions that have different descriptions.
	 *
	 * @param descriptions - Array of descriptions to combine
	 * @param title - Optional title context for better combination
	 * @returns Combined description that includes all relevant information
	 */
	public async combineDescriptions(
		descriptions: string[],
		title?: string,
	): Promise<string> {
		if (!this.apiKey) {
			// Fallback: simple concatenation if AI not available
			return descriptions.join(" ");
		}

		if (descriptions.length === 0) {
			return "";
		}

		if (descriptions.length === 1) {
			return descriptions[0];
		}

		// Remove duplicates and empty descriptions
		const uniqueDescriptions = [
			...new Set(descriptions.filter((desc) => desc.trim().length > 0)),
		];

		if (uniqueDescriptions.length === 0) {
			return "";
		}

		if (uniqueDescriptions.length === 1) {
			return uniqueDescriptions[0];
		}

		try {
			const descriptionsList = uniqueDescriptions
				.map((desc, i) => `${i + 1}. ${desc}`)
				.join("\n");

			const titleContext = title ? `Título da sugestão: "${title}"\n\n` : "";

			const prompt = `Você é um assistente especializado em unificar informações de sugestões de condomínios.

${titleContext}Dadas as seguintes descrições sobre a mesma sugestão:

${descriptionsList}

TAREFA: Crie UMA NOVA FRASE unificada que:
- Seja uma única frase ou parágrafo coerente e fluido
- Integre TODAS as informações relevantes de TODAS as descrições
- Não seja apenas uma concatenação, mas sim uma síntese natural
- Mantenha todas as informações importantes de cada descrição
- Use linguagem clara, objetiva e natural
- Não repita informações desnecessariamente
- Crie uma narrativa unificada que faça sentido como um todo

IMPORTANTE: A resposta deve ser UMA NOVA FRASE unificada, não apenas uma lista ou concatenação das descrições originais.

Responda APENAS com a descrição unificada, sem texto adicional ou formatação especial.`;

			interface TextGenerationResponse {
				generated_text?: string;
				0?: { generated_text: string };
			}

			const response = await this.makeRequest<TextGenerationResponse>(
				this.summarizationModel,
				{
					inputs: prompt,
					parameters: {
						max_new_tokens: 512,
						temperature: 0.3,
						return_full_text: false,
					},
				},
			);

			let generatedText: string;
			if (typeof response === "object" && response !== null) {
				if ("generated_text" in response && response.generated_text) {
					generatedText = response.generated_text.trim();
				} else if (Array.isArray(response) && response[0]?.generated_text) {
					generatedText = response[0].generated_text.trim();
				} else {
					throw new Error("Unexpected response format from text generation API");
				}
			} else {
				throw new Error("Invalid response from text generation API");
			}

			// Clean up the response (remove quotes if wrapped)
			generatedText = generatedText.replace(/^["']|["']$/g, "").trim();

			if (generatedText.length === 0) {
				// Fallback: simple concatenation
				return uniqueDescriptions.join(" ");
			}

			return generatedText;
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unknown error occurred";
			console.warn(
				`[HuggingFace] Failed to combine descriptions: ${message}. Using simple concatenation as fallback.`,
			);

			// Fallback: simple concatenation
			return uniqueDescriptions.join(" ");
		}
	}

	/**
	 * Flattens the embedding result from the API into a 1D array.
	 * The API can return nested arrays depending on the model configuration.
	 *
	 * @param result - Raw result from the feature extraction API
	 * @returns Flattened 1D array of numbers
	 */
	private flattenEmbedding(result: unknown): number[] {
		// If it's already a 1D array of numbers, return as-is
		if (
			Array.isArray(result) &&
			result.length > 0 &&
			typeof result[0] === "number"
		) {
			return result as number[];
		}

		// If it's a 2D array (batch of one), take the first element
		if (
			Array.isArray(result) &&
			result.length > 0 &&
			Array.isArray(result[0])
		) {
			const nested = result[0];
			if (typeof nested[0] === "number") {
				return nested as number[];
			}
			// If still nested, go one level deeper
			if (Array.isArray(nested[0])) {
				return nested[0] as number[];
			}
		}

		throw new Error("Unexpected embedding format from API");
	}
}
