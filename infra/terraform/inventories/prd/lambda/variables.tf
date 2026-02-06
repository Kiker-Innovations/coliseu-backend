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
  default     = 1512
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
  default     = "https://api.coliseu.app"
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

variable "mongodb_database" {
  description = "Nome do banco de dados MongoDB"
  type        = string
  default     = "coliseu"
}

################################################################################
# AWS S3 Application Variables
################################################################################

variable "aws_s3_presigned_url_expiration" {
  description = "Tempo de expiração das URLs pré-assinadas em segundos"
  type        = number
  default     = 3600
}

################################################################################
# AWS SES Variables
################################################################################

variable "aws_ses_from_email" {
  description = "Email remetente para SES"
  type        = string
  default     = "noreply@coliseu.app"
}

################################################################################
# UAZApi Variables
################################################################################

variable "uazapi_phone_number" {
  description = "Número de telefone do UAZApi"
  type        = string
  default     = "13996662857"
}

variable "uazapi_server_url" {
  description = "URL do servidor UAZApi"
  type        = string
  default     = "https://free.uazapi.com"
}
