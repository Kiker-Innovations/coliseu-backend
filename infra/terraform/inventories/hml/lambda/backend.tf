################################################################################
# Terraform Backend Configuration - Homologation - Lambda
################################################################################

terraform {
	backend "s3" {
		bucket         = "coliseu-condo-hml-statefiles"
		key            = "hml/us-east-1/lambda/coliseu/terraform.tfstate"
		region         = "us-east-1"
		encrypt        = true
		dynamodb_table = "terraform-locks"
	}
}

