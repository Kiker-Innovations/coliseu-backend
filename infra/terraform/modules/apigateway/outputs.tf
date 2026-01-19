################################################################################
# Outputs
################################################################################

output "api_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.api.id
}

output "api_arn" {
  description = "ARN of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.api.arn
}

output "execution_arn" {
  description = "Execution ARN of the API Gateway"
  value       = aws_api_gateway_rest_api.api.execution_arn
}

output "invoke_url" {
  description = "Invoke URL for the API Gateway stage"
  value       = aws_api_gateway_stage.stage.invoke_url
}

output "stage_name" {
  description = "Name of the deployed stage"
  value       = aws_api_gateway_stage.stage.stage_name
}

output "custom_domain_regional_domain_name" {
  description = "Regional domain name for custom domain (use for Route53/DNS CNAME)"
  value       = var.custom_domain_name != "" ? aws_api_gateway_domain_name.custom_domain[0].regional_domain_name : null
}

output "custom_domain_regional_zone_id" {
  description = "Regional zone ID for custom domain (use for Route53 alias)"
  value       = var.custom_domain_name != "" ? aws_api_gateway_domain_name.custom_domain[0].regional_zone_id : null
}
