################################################################################
# Lambda Function
################################################################################

resource "aws_lambda_function" "this" {
	function_name = var.function_name
	description   = var.description
	role          = aws_iam_role.lambda.arn
	handler       = var.handler
	runtime       = var.runtime
	architectures = [var.architecture]
	memory_size   = var.memory_size
	timeout       = var.timeout

	s3_bucket = var.s3_bucket
	s3_key    = var.s3_key

	environment {
		variables = var.environment_variables
	}

	depends_on = [
		aws_iam_role_policy_attachment.lambda_policy,
		aws_cloudwatch_log_group.this
	]

	tags = merge(
		var.tags,
		{
			Name = var.function_name
		}
	)
}

################################################################################
# CloudWatch Log Group
################################################################################

resource "aws_cloudwatch_log_group" "this" {
	name              = "/aws/lambda/${var.function_name}"
	retention_in_days = var.log_retention_days

	tags = var.tags
}

################################################################################
# IAM Role for Lambda
################################################################################

resource "aws_iam_role" "lambda" {
	name               = "${var.function_name}-role"
	assume_role_policy = var.assume_role_policy

	tags = var.tags
}

################################################################################
# IAM Policy for Lambda
################################################################################

resource "aws_iam_policy" "lambda" {
	name        = "${var.function_name}-policy"
	description = "Policy for Lambda function ${var.function_name}"
	policy      = var.lambda_policy

	tags = var.tags
}

################################################################################
# IAM Policy Attachment
################################################################################

resource "aws_iam_role_policy_attachment" "lambda_policy" {
	role       = aws_iam_role.lambda.name
	policy_arn = aws_iam_policy.lambda.arn
}

################################################################################
# Lambda Permission (for API Gateway - future use)
################################################################################

resource "aws_lambda_permission" "api_gateway" {
	count = var.create_api_gateway_permission ? 1 : 0

	statement_id  = "AllowAPIGatewayInvoke"
	action        = "lambda:InvokeFunction"
	function_name = aws_lambda_function.this.function_name
	principal     = "apigateway.amazonaws.com"
	source_arn    = var.api_gateway_source_arn
}

