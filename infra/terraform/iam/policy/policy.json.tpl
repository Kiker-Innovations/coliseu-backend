{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "CloudWatchLogs",
			"Effect": "Allow",
			"Action": [
				"logs:CreateLogGroup",
				"logs:CreateLogStream",
				"logs:PutLogEvents"
			],
			"Resource": "arn:aws:logs:*:${aws_account_id}:*"
		},
		{
			"Sid": "S3Access",
			"Effect": "Allow",
			"Action": [
				"s3:GetObject",
				"s3:PutObject",
				"s3:DeleteObject",
				"s3:ListBucket"
			],
			"Resource": [
				"arn:aws:s3:::${s3_bucket_name}",
				"arn:aws:s3:::${s3_bucket_name}/*"
			]
		},
		{
			"Sid": "SESAccess",
			"Effect": "Allow",
			"Action": [
				"ses:SendEmail",
				"ses:SendRawEmail"
			],
			"Resource": "*"
		},
		{
			"Sid": "SecretsManagerAccess",
			"Effect": "Allow",
			"Action": [
				"secretsmanager:GetSecretValue"
			],
			"Resource": "arn:aws:secretsmanager:*:${aws_account_id}:secret:${secret_name}*"
		}
	]
}
