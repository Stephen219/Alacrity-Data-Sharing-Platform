# =====================================================================
# Terraform OpenStack Deployment: MinIO and Jenkins Setup
# =====================================================================
#
# Description:
# This Terraform script provisions two virtual machines (VMs) on OpenStack:
#   1. A MinIO object storage server
#   2. A Jenkins server to run the project (  not ci cd ) 
#
# It also:
#   - Creates a security group with open TCP ports (22, 20-65535)
#   - Attaches floating IPs for external SSH and service access
#   - Configures each server with a corresponding shell script (minio.sh, jenkins.sh)
#
# Prerequisites:
#   - Terraform and OpenStack CLI installed
#   - An existing OpenStack keypair named "cloud"
#   - Private key `cloud.key` placed in the same directory
#   - `minio.sh` and `jenkins.sh` scripts for instance provisioning
#
# Usage:
#   1. terraform init
#   2. terraform validate
#   3. terraform plan
#   4. terraform apply
#   5. terraform destroy (to clean up)
#
# Output:
#   - SSH commands to connect to both servers with public IPs
#
# Optional:
#   - Includes commented AWS deployment steps if transitioning to AWS
#
# Author: Kariukis
# Date: 2025
# =====================================================================



terraform {
  required_providers {
    openstack = {
      source  = "terraform-provider-openstack/openstack"
      version = "1.53.0"
    }
  }
}


variable "flavor" { default = "m1.large" }
variable "image" { default = "Rocky 9.3" }
variable "name1" { default = "Minio-server-alacrity" }
variable "name2" { default = "project-jenkins-alacrity" }
variable "keypair" { default = "cloud" }
variable "pool" { default = "cscloud_private_floating" }
variable "server1_script" { default = "./minio.sh" }
variable "server2_script" { default = "./jenkins.sh" }
variable "security_description" { default = "Terraform security group" }
variable "security_name" { default = "Terraform-alacrity" }


resource "openstack_networking_floatingip_v2" "floating_ip_1" {
  pool = var.pool
}

resource "openstack_networking_floatingip_v2" "floating_ip_2" {
  pool = var.pool
}

resource "openstack_compute_secgroup_v2" "security_group" {
  name        = var.security_name
  description = var.security_description
  
  rule {
    from_port   = 22
    to_port     = 22
    ip_protocol = "tcp"
    cidr        = "0.0.0.0/0"
  }

  rule {
    from_port   = 20
    # all ports from 20 to 65535 are open for the server to be able to run the minio server 
    to_port     =65535
    ip_protocol = "tcp"
    cidr        = "0.0.0.0/0"
  }

#   rule {
#     from_port   = 8081
#     to_port     = 8081
#     ip_protocol = "tcp"
#     cidr        = "0.0.0.0/0"
#   }
}

resource "openstack_compute_instance_v2" "instance_1" {
  name            = var.name1
  image_name      = var.image
  flavor_name     = var.flavor
  security_groups = [openstack_compute_secgroup_v2.security_group.name]
  key_pair        = var.keypair
  user_data       = file(var.server1_script)
}

resource "openstack_compute_instance_v2" "instance_2" {
  name            = var.name2
  image_name      = var.image
  flavor_name     = var.flavor
  security_groups = [openstack_compute_secgroup_v2.security_group.name]
  key_pair        = var.keypair
  user_data       = file(var.server2_script)
}

resource "openstack_compute_floatingip_associate_v2" "floating_ip_1" {
  floating_ip = openstack_networking_floatingip_v2.floating_ip_1.address
  instance_id = openstack_compute_instance_v2.instance_1.id
}

resource "openstack_compute_floatingip_associate_v2" "floating_ip_2" {
  floating_ip = openstack_networking_floatingip_v2.floating_ip_2.address
  instance_id = openstack_compute_instance_v2.instance_2.id
}


output "server1" { 
  value = "minio-alacrity : ssh -i cloud.key rocky@${openstack_networking_floatingip_v2.floating_ip_1.address}" 
}
output "server2" { 
  value = "project-jenkin-alacrity : ssh -i cloud.key rocky@${openstack_networking_floatingip_v2.floating_ip_2.address}" 
}





# Other Cloud Providers - AWS
# To achieve the same setup on AWS, follow these steps:
# 1. Use the AWS provider:
#    terraform {
#      required_providers {
#        aws = {
#          source  = "hashicorp/aws"
#          version = "~> 5.0"
#        }
#      }
#    }
#    provider "aws" {
#      region = "us-east-1" # Adjust to your preferred region
#    }
# 2. Create a key pair for SSH access to both servers:
#    resource "aws_key_pair" "cloud" {
#      key_name   = "cloud"
#      public_key = file("~/.ssh/cloud.pub") # Ensure cloud.pub exists locally
#    }
# 3. Create a VPC and subnet:
#    resource "aws_vpc" "main" {
#      cidr_block           = "10.0.0.0/16"
#      enable_dns_hostnames = true
#      tags = {
#        Name = "alacrity-vpc"
#      }
#    }
#    resource "aws_subnet" "main" {
#      vpc_id     = aws_vpc.main.id
#      cidr_block = "10.0.1.0/24"
#      tags = {
#        Name = "alacrity-subnet"
#      }
#    }
# 4. Create an internet gateway and route table:
#    resource "aws_internet_gateway" "main" {
#      vpc_id = aws_vpc.main.id
#      tags = {
#        Name = "alacrity-igw"
#      }
#    }
#    resource "aws_route_table" "main" {
#      vpc_id = aws_vpc.main.id
#      route {
#        cidr_block = "0.0.0.0/0"
#        gateway_id = aws_internet_gateway.main.id
#      }
#      tags = {
#        Name = "alacrity-route-table"
#      }
#    }
#    resource "aws_route_table_association" "main" {
#      subnet_id      = aws_subnet.main.id
#      route_table_id = aws_route_table.main.id
#    }
# 5. Create a security group (equivalent to openstack_compute_secgroup_v2):
#    resource "aws_security_group" "alacrity" {
#      name        = "Terraform-alacrity"
#      description = "Terraform security group"
#      vpc_id      = aws_vpc.main.id
#      ingress {
#        from_port   = 22
#        to_port     = 22
#        protocol    = "tcp"
#        cidr_blocks = ["0.0.0.0/0"]
#      }
#      ingress {
#        from_port   = 20
#        to_port     = 65535
#        protocol    = "tcp"
#        cidr_blocks = ["0.0.0.0/0"]
#      }
#      egress {
#        from_port   = 0
#        to_port     = 0
#        protocol    = "-1"
#        cidr_blocks = ["0.0.0.0/0"]
#      }
#      tags = {
#        Name = "Terraform-alacrity"
#      }
#    }
# 6. Create EC2 instances (equivalent to openstack_compute_instance_v2):
#    resource "aws_instance" "minio_server" {
#      ami                    = "ami-12345678" # Replace with Rocky Linux 9.3 AMI ID
#      instance_type          = "m5.large"     # Equivalent to m1.large
#      key_name               = aws_key_pair.cloud.key_name
#      subnet_id              = aws_subnet.main.id
#      vpc_security_group_ids = [aws_security_group.alacrity.id]
#      user_data              = file("./minio.sh")
#      tags = {
#        Name = "Minio-server-alacrity"
#      }
#    }
#    resource "aws_instance" "jenkins_server" {
#      ami                    = "ami-12345678" # Replace with Rocky Linux 9.3 AMI ID
#      instance_type          = "m5.large"
#      key_name               = aws_key_pair.cloud.key_name
#      subnet_id              = aws_subnet.main.id
#      vpc_security_group_ids = [aws_security_group.alacrity.id]
#      user_data              = file("./jenkins.sh")
#      tags = {
#        Name = "project-jenkins-alacrity"
#      }
#    }
# 7. Allocate and associate Elastic IPs (equivalent to openstack_networking_floatingip_v2):
#    resource "aws_eip" "minio_eip" {
#      instance = aws_instance.minio_server.id
#      domain   = "vpc"
#    }
#    resource "aws_eip" "jenkins_eip" {
#      instance = aws_instance.jenkins_server.id
#      domain   = "vpc"
#    }
# 8. Outputs for SSH access:
#    output "server1" {
#      value = "minio-alacrity : ssh -i cloud.key ec2-user@${aws_eip.minio_eip.public_ip}"
#    }
#    output "server2" {
#      value = "project-jenkins-alacrity : ssh -i cloud.key ec2-user@${aws_eip.jenkins_eip.public_ip}"
#    }
# Notes:
# - Replace 'ami-12345678' with a valid Rocky Linux 9.3 AMI ID for your region (e.g., search AWS Marketplace).
# - Ensure '~/.ssh/cloud.pub' exists and matches 'cloud.key' for SSH access.  eslse you can create in the AWS console.
# - The scripts (minio.sh, jenkins.sh) must be compatible with the EC2 environment.
# - 'ec2-user' is used for Rocky Linux AMIs; adjust if the AMI uses a different default user.
# - Adjust 'region' in the provider block as needed.