#!/usr/bin/env bash
# AWS Automated Deployment Script for Linux / macOS / Bash
# Project: MFA Physical Token Simulator

set -e

STACK_NAME="mfa-token-simulator-stack"
REGION="us-east-1"

echo "=========================================================="
echo " MFA Physical Token Simulator - AWS Cloud Deployment "
echo " Region: $REGION | Stack: $STACK_NAME"
echo "=========================================================="

if ! command -v aws &> /dev/null; then
    echo "[ERROR] AWS CLI could not be found. Please install it first."
    exit 1
fi

echo -e "\n[STEP 1] Validating CloudFormation template..."
aws cloudformation validate-template --template-body file://aws/cloudformation.yaml --region "$REGION"

echo -e "\n[STEP 2] Deploying CloudFormation Stack ($STACK_NAME)..."
aws cloudformation deploy \
    --template-file aws/cloudformation.yaml \
    --stack-name "$STACK_NAME" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$REGION"

echo -e "\n[STEP 3] Fetching Stack Outputs..."
aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query "Stacks[0].Outputs" \
    --output table

echo -e "\nDeployment complete! You can now link your dashboard to the API Endpoint.\n"
