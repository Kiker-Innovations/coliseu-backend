################################################################################
# Secrets Manager Outputs
################################################################################

output "secrets_arn" {
  description = "ARN do secret no Secrets Manager"
  value       = module.secrets.secret_arn
}

output "secrets_name" {
  description = "Nome do secret no Secrets Manager"
  value       = module.secrets.secret_name
}

################################################################################
# ECR Outputs
################################################################################

output "ecr_repository_url" {
  description = "URL do repositório ECR"
  value       = module.ecr.repository_url
}

output "ecr_repository_arn" {
  description = "ARN do repositório ECR"
  value       = module.ecr.repository_arn
}

output "ecr_repository_name" {
  description = "Nome do repositório ECR"
  value       = module.ecr.repository_name
}

################################################################################
# Lambda Outputs
################################################################################

output "lambda_function_name" {
  description = "Nome da função Lambda"
  value       = module.lambda_coliseu.function_name
}

output "lambda_function_arn" {
  description = "ARN da função Lambda"
  value       = module.lambda_coliseu.function_arn
}

output "lambda_invoke_arn" {
  description = "ARN para invocação da Lambda (usado pelo API Gateway)"
  value       = module.lambda_coliseu.invoke_arn
}

output "lambda_role_arn" {
  description = "ARN da IAM Role da Lambda"
  value       = module.lambda_coliseu.role_arn
}

output "lambda_log_group_name" {
  description = "Nome do CloudWatch Log Group"
  value       = module.lambda_coliseu.log_group_name
}
