import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

export interface SecretsCache {
  [key: string]: string;
}

let secretsCache: SecretsCache | null = null;

/**
 * Busca os secrets do AWS Secrets Manager.
 * Os secrets são cacheados para evitar múltiplas chamadas durante warm starts do Lambda.
 */
export async function loadSecretsFromAWS(): Promise<SecretsCache> {
  if (secretsCache) {
    console.log("[SecretsManager] Retornando secrets do cache");
    return secretsCache;
  }

  const secretName = process.env.AWS_SECRETS_NAME;

  if (!secretName) {
    console.log(
      "[SecretsManager] AWS_SECRETS_NAME não definido, pulando carregamento de secrets"
    );
    return {};
  }

  console.log(`[SecretsManager] Carregando secrets de: ${secretName}`);

  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || "us-east-1",
  });

  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);

    if (!response.SecretString) {
      throw new Error("Secret não contém SecretString");
    }

    secretsCache = JSON.parse(response.SecretString);
    console.log(
      `[SecretsManager] Secrets carregados com sucesso: ${
        Object.keys(secretsCache || {}).length
      } chaves`
    );

    return secretsCache || {};
  } catch (error) {
    console.error("[SecretsManager] Erro ao carregar secrets:", error);
    throw error;
  }
}

/**
 * Injeta os secrets carregados do Secrets Manager nas variáveis de ambiente.
 * Isso permite que o código existente continue usando process.env normalmente.
 */
export async function injectSecretsToEnv(): Promise<void> {
  const secrets = await loadSecretsFromAWS();

  for (const [key, value] of Object.entries(secrets)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  console.log("[SecretsManager] Secrets injetados nas variáveis de ambiente");
}

/**
 * Limpa o cache de secrets (útil para testes).
 */
export function clearSecretsCache(): void {
  secretsCache = null;
}
