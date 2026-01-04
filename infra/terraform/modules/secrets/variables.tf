################################################################################
# Required Variables
################################################################################

variable "secret_name" {
  description = "Name of the secret in Secrets Manager"
  type        = string
}

################################################################################
# Optional Variables
################################################################################

variable "description" {
  description = "Description of the secret"
  type        = string
  default     = ""
}

variable "recovery_window_in_days" {
  description = "Number of days before secret is permanently deleted (0 for immediate)"
  type        = number
  default     = 7
}

variable "initial_secret_value" {
  description = "Initial secret value as a map (will be JSON encoded). Changes are ignored after creation."
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
