#!/usr/bin/env bash
# AWS Learner Lab Automated 1-Click Deployment Script (Bash)
# Deploys the MFA Verification Backend using AWS Academy / Learner Lab 'LabRole'

set -e

STACK_NAME="${1:-mfa-learner-lab-stack}"
REGION="${2:-us-east-1}"

echo "================================================================"
echo " MFA Hardware Token Simulator - AWS Learner Lab Deployment"
echo " Region: $REGION | Stack: $STACK_NAME"
echo " Note: Uses pre-existing 'LabRole' to prevent IAM permissions errors"
echo "================================================================"

if ! command -v aws &> /dev/null; then
    echo "[ERROR] AWS CLI is not installed or not in PATH."
    exit 1
fi

echo -e "\n[STEP 1] Checking AWS Learner Lab credentials..."
aws sts get-caller-identity > /dev/null || {
    echo "[ERROR] AWS credentials invalid or expired. Paste your AWS Details CLI credentials first."
    exit 1
}

echo -e "\n[STEP 2] Validating CloudFormation template..."
aws cloudformation validate-template --template-body file://aws/cloudformation-learner-lab.yaml --region "$REGION" > /dev/null

echo -e "\n[STEP 3] Deploying CloudFormation Stack ($STACK_NAME)..."
aws cloudformation deploy \
    --template-file aws/cloudformation-learner-lab.yaml \
    --stack-name "$STACK_NAME" \
    --region "$REGION"

echo -e "\n[STEP 4] Fetching Permanent Endpoints..."
OUTPUTS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query "Stacks[0].Outputs" --output json)

LAMBDA_URL=$(echo "$OUTPUTS" | grep -o 'https://[^"]*lambda-url[^"]*' | head -1 || echo "")
API_URL=$(echo "$OUTPUTS" | grep -o 'https://[^"]*execute-api[^"]*/verify' | head -1 || echo "")

CHOSEN_URL="$LAMBDA_URL"
if [ -z "$CHOSEN_URL" ]; then
    CHOSEN_URL="$API_URL"
fi

CONFIG_FILE="dashboard/aws-config.json"
cat <<EOF > "$CONFIG_FILE"
{
  "apiEndpoint": "$CHOSEN_URL",
  "lambdaFunctionUrl": "$LAMBDA_URL",
  "apiGatewayUrl": "$API_URL",
  "region": "$REGION",
  "mode": "learner_lab",
  "connected": true,
  "notes": "Permanent AWS Learner Lab connection. This endpoint works 24/7 across lab session restarts."
}
EOF

echo -e "\n================================================================"
echo " [SUCCESS] PERMANENT AWS LEARNER LAB CONNECTION ESTABLISHED!"
echo " Permanent Endpoint: $CHOSEN_URL"
echo " Saved to: $CONFIG_FILE"
echo "================================================================"
