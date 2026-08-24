terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.23"
    }
  }
}

provider "aws" {
  region = "eu-west-3"
}

resource "aws_ecr_repository" "wodapp_repo" {
  name                 = "wodapp-python"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

variable "anthropic_api_key" {
  type      = string
  sensitive = true
}

variable "public_supabase_url" {
  type = string
}

variable "supabase_service_key" {
  type = string
  sensitive = true
}

variable "webhook_secret" {
  type = string
  sensitive = true
}
# 1. Create a logical cluster to hold the service
resource "aws_ecs_cluster" "wodapp_cluster" {
  name = "wodapp-cluster"
}

# 2. Execution Role
resource "aws_iam_role" "ecs_execution_role" {
  name = "ecs-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# 3. Infrastructure Role
resource "aws_iam_role" "ecs_infrastructure_role" {
  name = "ecs-infrastructure-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ecs.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_infrastructure_policy" {
  role       = aws_iam_role.ecs_infrastructure_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSInfrastructureRoleforExpressGatewayServices"
}

# 4. The Express Service
resource "aws_ecs_express_gateway_service" "wodapp_service" {
  service_name            = "wodapp-express-service"
  cluster                 = aws_ecs_cluster.wodapp_cluster.name
  execution_role_arn      = aws_iam_role.ecs_execution_role.arn
  infrastructure_role_arn = aws_iam_role.ecs_infrastructure_role.arn
  
  cpu    = 1024
  memory = 2048

  primary_container {
    image          = "${aws_ecr_repository.wodapp_repo.repository_url}:latest"
    container_port = 8000

    environment {
      name  = "ANTHROPIC_API_KEY"
      value = var.anthropic_api_key
    }
    environment {
      name  = "PUBLIC_SUPABASE_URL"
      value = var.public_supabase_url
    }
    environment {
      name  = "SUPABASE_SERVICE_KEY"
      value = var.supabase_service_key
    }
    environment {
      name  = "WEBHOOK_SECRET"
      value = var.webhook_secret
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.ecs_execution_policy,
    aws_iam_role_policy_attachment.ecs_infrastructure_policy
  ]
}