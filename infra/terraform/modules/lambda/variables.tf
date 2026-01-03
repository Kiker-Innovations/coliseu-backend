################################################################################
# Required Variables
################################################################################

variable "function_name" {
	description = "Nome da função Lambda"
	type        = string
}

variable "handler" {
	description = "Handler da função Lambda"
	type        = string
}

variable "runtime" {
	description = "Runtime da função Lambda"
	type        = string
}

variable "s3_bucket" {
	description = "Nome do bucket S3 onde o código está armazenado"
	type        = string
}

variable "s3_key" {
	description = "Chave (path) do arquivo zip no S3"
	type        = string
}

variable "assume_role_policy" {
	description = "Política de assume role para a Lambda (JSON)"
	type        = string
}

variable "lambda_policy" {
	description = "Política IAM para a Lambda (JSON)"
	type        = string
}

################################################################################
# Optional Variables
################################################################################

variable "description" {
	description = "Descrição da função Lambda"
	type        = string
	default     = ""
}

variable "architecture" {
	description = "Arquitetura da função Lambda (x86_64 ou arm64)"
	type        = string
	default     = "arm64"
}

variable "memory_size" {
	description = "Quantidade de memória em MB"
	type        = number
	default     = 1024
}

variable "timeout" {
	description = "Timeout em segundos"
	type        = number
	default     = 30
}

variable "environment_variables" {
	description = "Variáveis de ambiente da Lambda"
	type        = map(string)
	default     = {}
}

variable "log_retention_days" {
	description = "Dias de retenção dos logs no CloudWatch"
	type        = number
	default     = 14
}

variable "create_api_gateway_permission" {
	description = "Criar permissão para API Gateway invocar a Lambda"
	type        = bool
	default     = false
}

variable "api_gateway_source_arn" {
	description = "ARN do API Gateway para permissão de invocação"
	type        = string
	default     = null
}

variable "tags" {
	description = "Tags a serem aplicadas aos recursos"
	type        = map(string)
	default     = {}
}

