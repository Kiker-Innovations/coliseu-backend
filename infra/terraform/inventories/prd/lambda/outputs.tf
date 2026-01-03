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

