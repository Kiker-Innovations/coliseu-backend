# Coliseu Backend - Infrastructure

Infraestrutura Terraform para a Lambda **Coliseu**.

## Estrutura

```
infra/
└── terraform/
    ├── iam/
    │   ├── policy/
    │   │   └── policy.json.tpl    # Template da policy (substitui aws_account_id em runtime)
    │   └── role/
    │       └── role.json          # Assume role policy para Lambda
    ├── modules/
    │   └── lambda/
    │       ├── main.tf            # Recursos: Lambda, IAM Role/Policy, CloudWatch
    │       ├── variables.tf       # Variáveis do módulo
    │       └── outputs.tf         # Outputs do módulo
    └── inventories/
        ├── hml/
        │   └── lambda/
        │       ├── backend.tf     # Backend S3 para state
        │       ├── main.tf        # Configuração do ambiente HML
        │       ├── variables.tf   # Variáveis com defaults para HML
        │       ├── outputs.tf     # Outputs do ambiente
        │       └── terraform.tfvars.example
        └── prd/
            └── lambda/
                ├── backend.tf     # Backend S3 para state
                ├── main.tf        # Configuração do ambiente PRD
                ├── variables.tf   # Variáveis com defaults para PRD
                ├── outputs.tf     # Outputs do ambiente
                └── terraform.tfvars.example
```

## Configuração da Lambda

| Configuração | Valor |
|-------------|-------|
| Runtime | Node.js 20.x |
| Arquitetura | ARM64 |
| Memória | 1024 MB |
| Timeout | 30 segundos |
| Handler | src/lambda.handler |

## Pré-requisitos

1. **Bucket S3 para código**: O código da Lambda deve ser armazenado no S3:
   - HML: `coliseu-condo-hml/lambda/coliseu/lambda.zip`
   - PRD: `coliseu-condo-prd/lambda/coliseu/lambda.zip`

2. **Bucket S3 para state**: Os arquivos de estado do Terraform são armazenados em:
   - HML: `coliseu-condo-hml-statefiles`
   - PRD: `coliseu-condo-prd-statefiles`

3. **DynamoDB para locks**: Tabela `terraform-locks` em ambas as contas.

## Deploy Manual

### 1. Configurar variáveis

```bash
cd infra/terraform/inventories/hml/lambda  # ou prd/lambda
cp terraform.tfvars.example terraform.tfvars
# Edite terraform.tfvars com os valores corretos
```

### 2. Inicializar Terraform

```bash
terraform init
```

### 3. Validar configuração

```bash
terraform validate
terraform plan
```

### 4. Aplicar mudanças

```bash
terraform apply
```

## Variáveis Sensíveis (CI/CD)

As seguintes variáveis devem ser configuradas como secrets no GitHub Actions:

| Secret | Descrição |
|--------|-----------|
| `AWS_ACCOUNT_ID_HML` | ID da conta AWS de homologação |
| `AWS_ACCOUNT_ID_PRD` | ID da conta AWS de produção |
| `JWT_SECRET` | Secret para geração de tokens JWT |
| `MONGODB_URL` | URL de conexão do MongoDB |
| `RESEND_API_KEY` | API Key do Resend |
| `APP_BASE_URL` | URL base da aplicação |

## Permissões da Lambda

A Lambda possui as seguintes permissões:

- **CloudWatch Logs**: Criar e escrever logs
- **S3**: GetObject, PutObject, DeleteObject, ListBucket no bucket configurado

## Outputs

Após o deploy, os seguintes outputs estarão disponíveis:

- `lambda_function_name`: Nome da função Lambda
- `lambda_function_arn`: ARN da função
- `lambda_invoke_arn`: ARN para invocação (API Gateway)
- `lambda_role_arn`: ARN da IAM Role
- `lambda_log_group_name`: Nome do Log Group no CloudWatch

