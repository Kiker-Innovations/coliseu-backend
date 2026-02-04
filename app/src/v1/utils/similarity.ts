/**
 * Utility functions for calculating similarity between text embeddings.
 * Used for semantic deduplication and grouping of resident suggestions.
 */

/**
 * Represents an item with its embedding vector for similarity comparison.
 */
export interface EmbeddedItem {
	id: string;
	text: string;
	embedding: number[];
	metadata?: Record<string, unknown>;
}

/**
 * Calculates the cosine similarity between two embedding vectors.
 * Cosine similarity measures the cosine of the angle between two vectors,
 * producing a value between -1 (opposite) and 1 (identical).
 *
 * Formula: cos(θ) = (A · B) / (||A|| × ||B||)
 *
 * @param vecA - First embedding vector
 * @param vecB - Second embedding vector
 * @returns Cosine similarity value between -1 and 1
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
	if (vecA.length !== vecB.length) {
		throw new Error(
			`Vector dimensions must match: ${vecA.length} vs ${vecB.length}`,
		);
	}

	if (vecA.length === 0) {
		return 0;
	}

	// Calculate dot product (A · B)
	let dotProduct = 0;
	let magnitudeA = 0;
	let magnitudeB = 0;

	for (let i = 0; i < vecA.length; i++) {
		dotProduct += vecA[i] * vecB[i];
		magnitudeA += vecA[i] * vecA[i];
		magnitudeB += vecB[i] * vecB[i];
	}

	// Calculate magnitudes ||A|| and ||B||
	magnitudeA = Math.sqrt(magnitudeA);
	magnitudeB = Math.sqrt(magnitudeB);

	// Avoid division by zero
	if (magnitudeA === 0 || magnitudeB === 0) {
		return 0;
	}

	return dotProduct / (magnitudeA * magnitudeB);
};

/**
 * Groups items by semantic similarity using cosine similarity threshold.
 * Uses a greedy clustering approach where each item is assigned to the first
 * group whose centroid (first item) is similar enough.
 *
 * @param items - Array of items with their embeddings
 * @param threshold - Minimum cosine similarity to consider items as similar (0-1)
 * @returns Array of groups, where each group contains similar items
 */
export const groupBySimilarity = <T extends EmbeddedItem>(
	items: T[],
	threshold: number,
): T[][] => {
	if (items.length === 0) {
		return [];
	}

	const groups: T[][] = [];
	const assigned = new Set<string>();

	for (const item of items) {
		if (assigned.has(item.id)) {
			continue;
		}

		// Find the first group where the item is similar to the group's centroid
		let foundGroup = false;
		for (const group of groups) {
			const centroid = group[0];
			const similarity = cosineSimilarity(item.embedding, centroid.embedding);

			if (similarity >= threshold) {
				group.push(item);
				assigned.add(item.id);
				foundGroup = true;
				break;
			}
		}

		// If no similar group found, create a new group with this item as centroid
		if (!foundGroup) {
			groups.push([item]);
			assigned.add(item.id);
		}
	}

	return groups;
};

/**
 * Deduplicates items within the same category (e.g., apartment) using similarity.
 * For each category, keeps only unique suggestions based on semantic similarity.
 *
 * @param items - Array of items with their embeddings and category info
 * @param categoryKey - Key in metadata to use for categorization
 * @param threshold - Minimum cosine similarity to consider items as duplicates
 * @returns Array of deduplicated items
 */
export const deduplicateByCategory = <T extends EmbeddedItem>(
	items: T[],
	categoryKey: string,
	threshold: number,
): T[] => {
	// Group items by category
	const byCategory = new Map<string, T[]>();
	for (const item of items) {
		const category = String(item.metadata?.[categoryKey] ?? "default");
		if (!byCategory.has(category)) {
			byCategory.set(category, []);
		}
		byCategory.get(category)!.push(item);
	}

	const result: T[] = [];

	// For each category, keep only unique items
	for (const [_, categoryItems] of byCategory) {
		const unique: T[] = [];

		for (const item of categoryItems) {
			let isDuplicate = false;

			for (const existing of unique) {
				const similarity = cosineSimilarity(item.embedding, existing.embedding);
				if (similarity >= threshold) {
					isDuplicate = true;
					break;
				}
			}

			if (!isDuplicate) {
				unique.push(item);
			}
		}

		result.push(...unique);
	}

	return result;
};

/**
 * Calculates the average embedding (centroid) of a group of items.
 * Useful for finding the representative vector of a cluster.
 *
 * @param items - Array of items with embeddings
 * @returns Average embedding vector
 */
export const calculateCentroid = (items: EmbeddedItem[]): number[] => {
	if (items.length === 0) {
		return [];
	}

	const dimension = items[0].embedding.length;
	const centroid = new Array(dimension).fill(0);

	for (const item of items) {
		for (let i = 0; i < dimension; i++) {
			centroid[i] += item.embedding[i];
		}
	}

	for (let i = 0; i < dimension; i++) {
		centroid[i] /= items.length;
	}

	return centroid;
};

/**
 * Finds the item closest to the centroid of a group (most representative item).
 *
 * @param items - Array of items with embeddings
 * @returns The item that best represents the group
 */
export const findRepresentativeItem = <T extends EmbeddedItem>(
	items: T[],
): T | null => {
	if (items.length === 0) {
		return null;
	}

	if (items.length === 1) {
		return items[0];
	}

	const centroid = calculateCentroid(items);
	let bestItem = items[0];
	let bestSimilarity = -1;

	for (const item of items) {
		const similarity = cosineSimilarity(item.embedding, centroid);
		if (similarity > bestSimilarity) {
			bestSimilarity = similarity;
			bestItem = item;
		}
	}

	return bestItem;
};

