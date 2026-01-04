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

  # Carrega o template da policy e substitui as variáveis
  lambda_policy = templatefile("${path.module}/../../../iam/policy/policy.json.tpl", {
    aws_account_id = var.aws_account_id
    s3_bucket_name = var.s3_bucket_name
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
    JWT_SECRET             = var.jwt_secret
    JWT_EXPIRATION         = var.jwt_expiration
    JWT_REFRESH_EXPIRATION = var.jwt_refresh_expiration

    # MongoDB
    MONGODB_URL      = var.mongodb_url
    MONGODB_DATABASE = var.mongodb_database

    # Resend
    RESEND_API_KEY = var.resend_api_key

    # AWS
    AWS_S3_BUCKET_NAME              = var.s3_bucket_name
    AWS_S3_PRESIGNED_URL_EXPIRATION = tostring(var.aws_s3_presigned_url_expiration)
    AWS_S3_FOLDER_RESIDENT          = var.aws_s3_folder_resident
    AWS_S3_FOLDER_VISITOR           = var.aws_s3_folder_visitor
    AWS_S3_FOLDER_DOCUMENTS         = var.aws_s3_folder_documents
    AWS_SES_FROM_EMAIL              = var.aws_ses_from_email
  }

  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
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

  # API Gateway Permission (disabled for now)
  create_api_gateway_permission = false

  # Tags
  tags = local.common_tags

  depends_on = [module.ecr]
}
