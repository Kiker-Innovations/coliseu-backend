################################################################################
# Required Variables
################################################################################

variable "api_name" {
  description = "Name of the API Gateway REST API"
  type        = string
}

variable "lambda_function_name" {
  description = "Name of the Lambda function to integrate with"
  type        = string
}

variable "lambda_invoke_arn" {
  description = "Invoke ARN of the Lambda function"
  type        = string
}

################################################################################
# Optional Variables
################################################################################

variable "description" {
  description = "Description of the API Gateway"
  type        = string
  default     = ""
}

variable "stage_name" {
  description = "Name of the deployment stage"
  type        = string
  default     = "v1"
}

variable "integration_timeout" {
  description = "Integration timeout in milliseconds (max 29000 for Lambda)"
  type        = number
  default     = 29000
}

variable "custom_domain_name" {
  description = "Custom domain name for the API (optional)"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate for custom domain (required if custom_domain_name is set)"
  type        = string
  default     = ""
}

variable "base_path" {
  description = "Base path for custom domain mapping"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
