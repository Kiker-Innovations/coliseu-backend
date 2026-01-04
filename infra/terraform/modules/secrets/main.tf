################################################################################
# Secrets Manager Secret
################################################################################

resource "aws_secretsmanager_secret" "this" {
  name                    = var.secret_name
  description             = var.description
  recovery_window_in_days = var.recovery_window_in_days

  tags = merge(
    var.tags,
    {
      Name = var.secret_name
    }
  )
}

################################################################################
# Initial Secret Value (only created once, then ignored)
################################################################################

resource "aws_secretsmanager_secret_version" "this" {
  secret_id     = aws_secretsmanager_secret.this.id
  secret_string = jsonencode(var.initial_secret_value)

  lifecycle {
    # Ignore changes to secret value - allows manual updates via AWS Console
    ignore_changes = [secret_string]
  }
}
