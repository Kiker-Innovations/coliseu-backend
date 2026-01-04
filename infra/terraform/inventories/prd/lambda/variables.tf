################################################################################
# General Variables
################################################################################

variable "aws_region" {
  description = "Região AWS"
  type        = string
  default     = "us-east-1"
}

variable "aws_account_id" {
  description = "ID da conta AWS"
  type        = string
}

variable "environment" {
  description = "Ambiente de deploy (prd, hml)"
  type        = string
  default     = "prd"
}

variable "project_name" {
  description = "Nome do projeto"
  type        = string
  default     = "coliseu"
}

################################################################################
# Lambda Variables
################################################################################

variable "lambda_function_name" {
  description = "Nome da função Lambda"
  type        = string
  default     = "coliseu"
}

variable "lambda_description" {
  description = "Descrição da função Lambda"
  type        = string
  default     = "Coliseu Backend API - Production"
}

variable "lambda_architecture" {
  description = "Arquitetura da função Lambda"
  type        = string
  default     = "arm64"
}

variable "lambda_memory_size" {
  description = "Memória da função Lambda em MB"
  type        = number
  default     = 1024
}

variable "lambda_timeout" {
  description = "Timeout da função Lambda em segundos"
  type        = number
  default     = 30
}

variable "lambda_log_retention_days" {
  description = "Dias de retenção dos logs no CloudWatch"
  type        = number
  default     = 30
}

################################################################################
# S3 Variables (for application storage, not Lambda code)
################################################################################

variable "s3_bucket_name" {
  description = "Nome do bucket S3 para armazenamento de arquivos"
  type        = string
  default     = "coliseu-condo-prd"
}

################################################################################
# Application Environment Variables
################################################################################

variable "app_port" {
  description = "Porta da aplicação"
  type        = number
  default     = 3000
}

variable "app_environment" {
  description = "Ambiente da aplicação"
  type        = string
  default     = "prd"
}

variable "app_base_url" {
  description = "URL base da aplicação"
  type        = string
}

variable "jwt_secret" {
  description = "Secret para JWT"
  type        = string
  sensitive   = true
}

variable "jwt_expiration" {
  description = "Tempo de expiração do JWT"
  type        = string
  default     = "7d"
}

variable "jwt_refresh_expiration" {
  description = "Tempo de expiração do refresh token"
  type        = string
  default     = "30d"
}

variable "use_route_prefix" {
  description = "Usar prefixo de rota"
  type        = string
  default     = "true"
}

################################################################################
# MongoDB Variables
################################################################################

variable "mongodb_url" {
  description = "URL de conexão do MongoDB"
  type        = string
  sensitive   = true
}

variable "mongodb_database" {
  description = "Nome do banco de dados MongoDB"
  type        = string
  default     = "coliseu_prd"
}

################################################################################
# Resend Variables
################################################################################

variable "resend_api_key" {
  description = "API Key do Resend para envio de emails"
  type        = string
  sensitive   = true
}

################################################################################
# AWS S3 Application Variables
################################################################################

variable "aws_s3_presigned_url_expiration" {
  description = "Tempo de expiração das URLs pré-assinadas em segundos"
  type        = number
  default     = 3600
}

variable "aws_s3_folder_resident" {
  description = "Pasta de residentes no S3"
  type        = string
  default     = "residents"
}

variable "aws_s3_folder_visitor" {
  description = "Pasta de visitantes no S3"
  type        = string
  default     = "visitors"
}

variable "aws_s3_folder_documents" {
  description = "Pasta de documentos no S3"
  type        = string
  default     = "documents"
}

################################################################################
# AWS SES Variables
################################################################################

variable "aws_ses_from_email" {
  description = "Email remetente para SES"
  type        = string
  default     = "noreply@coliseu.app"
}
