################################################################################
# Terraform Backend Configuration - Production - Lambda
################################################################################

terraform {
	backend "s3" {
		bucket         = "coliseu-condo-prd-statefiles"
		key            = "prd/us-east-1/lambda/coliseu/terraform.tfstate"
		region         = "us-east-1"
		encrypt        = true
		dynamodb_table = "terraform-locks"
	}
}

