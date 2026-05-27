terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
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

# Create an IAM role that allows App Runner to pull images from ECR
resource "aws_iam_role" "apprunner_service_role" {
  name = "apprunner-service-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
      }
    ]
  })
}

# Attach the official AWS policy to the role
resource "aws_iam_role_policy_attachment" "apprunner_ecr_access" {
  role       = aws_iam_role.apprunner_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# Define the App Runner Service
resource "aws_apprunner_service" "wodapp_service" {
  service_name = "wodapp-python-service"

  source_configuration {
    auto_deployments_enabled = true
    
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_service_role.arn
    }
    
    image_repository {
      image_identifier      = "${aws_ecr_repository.wodapp_repo.repository_url}:latest"
      image_repository_type = "ECR"
      
      image_configuration {
        port = "8000"
        runtime_environment_variables = {
          ANTHROPIC_API_KEY    = var.anthropic_api_key
          PUBLIC_SUPABASE_URL  = var.public_supabase_url
          SUPABASE_SERVICE_KEY = var.supabase_service_key
          WEBHOOK_SECRET       = var.webhook_secret
        }
      }
    }
  }

  # Smallest available instance size (1 vCPU, 2GB RAM) is plenty for this backend
  instance_configuration {
    cpu    = "1024"
    memory = "2048"
  }

  depends_on = [aws_iam_role_policy_attachment.apprunner_ecr_access]
}


# Output the live URL after deployment
output "apprunner_url" {
  value       = aws_apprunner_service.wodapp_service.service_url
  description = "The live URL of the App Runner service"
}