################################################################################
# Terraform Configuration
################################################################################

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

################################################################################
# AWS Provider
################################################################################

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}

################################################################################
# Local Variables
################################################################################

locals {
  function_name   = "${var.lambda_function_name}-${var.environment}"
  repository_name = "${var.project_name}-${var.environment}"
  secret_name     = "${var.project_name}/${var.environment}/app"

  # Carrega o template da policy e substitui as variáveis
  lambda_policy = templatefile("${path.module}/../../../iam/policy/policy.json.tpl", {
    aws_account_id = var.aws_account_id
    s3_bucket_name = var.s3_bucket_name
    secret_name    = local.secret_name
  })

  # Carrega o arquivo de role
  assume_role_policy = file("${path.module}/../../../iam/role/role.json")

  # Variáveis de ambiente da Lambda
  environment_variables = {
    # Application
    PORT             = tostring(var.app_port)
    APP_ENVIRONMENT  = var.app_environment
    APP_BASE_URL     = var.app_base_url
    USE_ROUTE_PREFIX = var.use_route_prefix

    # JWT
    JWT_EXPIRATION         = var.jwt_expiration
    JWT_REFRESH_EXPIRATION = var.jwt_refresh_expiration

    # MongoDB
    MONGODB_DATABASE = var.mongodb_database

    # AWS
    AWS_S3_BUCKET_NAME              = var.s3_bucket_name
    AWS_S3_PRESIGNED_URL_EXPIRATION = tostring(var.aws_s3_presigned_url_expiration)
    AWS_SES_FROM_EMAIL              = var.aws_ses_from_email
    AWS_SECRETS_NAME                = local.secret_name

    # UAZApi
    UAZAPI_PHONE_NUMBER = var.uazapi_phone_number
    UAZAPI_SERVER_URL   = var.uazapi_server_url
  }

  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

################################################################################
# Secrets Manager
################################################################################

module "secrets" {
  source = "../../../modules/secrets"

  secret_name = "${var.project_name}/${var.environment}/app"
  description = "Application secrets for ${var.project_name} ${var.environment}"

  # Initial placeholder values - update via AWS Console
  # Terraform will NOT overwrite manual changes due to lifecycle ignore_changes
  initial_secret_value = {
    APP_BASE_URL   = var.app_base_url
  }

  tags = local.common_tags
}

################################################################################
# ECR Repository
################################################################################

module "ecr" {
  source = "../../../modules/ecr"

  repository_name         = local.repository_name
  image_tag_mutability    = "MUTABLE"
  scan_on_push            = true
  enable_lifecycle_policy = true
  max_image_count         = 10

  tags = local.common_tags
}

################################################################################
# Lambda Module
################################################################################

module "lambda_coliseu" {
  source = "../../../modules/lambda"

  function_name = local.function_name
  description   = var.lambda_description
  architecture  = var.lambda_architecture
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  # Container Image Deployment
  package_type = "Image"
  image_uri    = "${module.ecr.repository_url}:latest"

  # IAM
  assume_role_policy = local.assume_role_policy
  lambda_policy      = local.lambda_policy

  # Environment Variables
  environment_variables = local.environment_variables

  # CloudWatch
  log_retention_days = var.lambda_log_retention_days

  # API Gateway Permission (managed by API Gateway module)
  create_api_gateway_permission = false

  # Tags
  tags = local.common_tags

  depends_on = [module.ecr]
}

################################################################################
# API Gateway
################################################################################

module "api_gateway" {
  source = "../../../modules/apigateway"

  api_name             = "${var.project_name}-api-${var.environment}"
  description          = "API Gateway for ${var.project_name} - ${var.environment}"
  stage_name           = "v1"
  lambda_function_name = module.lambda_coliseu.function_name
  lambda_invoke_arn    = module.lambda_coliseu.invoke_arn

  # Custom domain (optional - configure if needed)
  # custom_domain_name = "api.coliseu.app"
  # certificate_arn    = var.certificate_arn

  tags = local.common_tags

  depends_on = [module.lambda_coliseu]
}
