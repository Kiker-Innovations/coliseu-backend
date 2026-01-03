################################################################################
# Lambda Outputs
################################################################################

output "function_name" {
	description = "Nome da função Lambda"
	value       = aws_lambda_function.this.function_name
}

output "function_arn" {
	description = "ARN da função Lambda"
	value       = aws_lambda_function.this.arn
}

output "invoke_arn" {
	description = "ARN para invocação da Lambda (usado pelo API Gateway)"
	value       = aws_lambda_function.this.invoke_arn
}

output "function_version" {
	description = "Versão da função Lambda"
	value       = aws_lambda_function.this.version
}

output "qualified_arn" {
	description = "ARN qualificado da função Lambda"
	value       = aws_lambda_function.this.qualified_arn
}

################################################################################
# IAM Outputs
################################################################################

output "role_arn" {
	description = "ARN da IAM Role da Lambda"
	value       = aws_iam_role.lambda.arn
}

output "role_name" {
	description = "Nome da IAM Role da Lambda"
	value       = aws_iam_role.lambda.name
}

output "policy_arn" {
	description = "ARN da IAM Policy da Lambda"
	value       = aws_iam_policy.lambda.arn
}

################################################################################
# CloudWatch Outputs
################################################################################

output "log_group_name" {
	description = "Nome do CloudWatch Log Group"
	value       = aws_cloudwatch_log_group.this.name
}

output "log_group_arn" {
	description = "ARN do CloudWatch Log Group"
	value       = aws_cloudwatch_log_group.this.arn
}

