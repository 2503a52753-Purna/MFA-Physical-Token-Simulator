# AWS Automated Deployment Script for Windows PowerShell
# Deploys MFA Physical Token Simulator Cloud Infrastructure via AWS CloudFormation

param (
    [string]$StackName = "mfa-token-simulator-stack",
    [string]$Region = "us-east-1"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " MFA Physical Token Simulator - AWS Cloud Deployment " -ForegroundColor Yellow
Write-Host " Region: $Region | Stack: $StackName" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check if AWS CLI is installed
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] AWS CLI is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install AWS CLI or deploy manually via AWS Management Console." -ForegroundColor Yellow
    Exit 1
}

Write-Host "`n[STEP 1] Validating CloudFormation template..." -ForegroundColor Green
aws cloudformation validate-template --template-body file://aws/cloudformation.yaml --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] CloudFormation template validation failed." -ForegroundColor Red
    Exit 1
}

Write-Host "`n[STEP 2] Deploying CloudFormation Stack ($StackName)..." -ForegroundColor Green
aws cloudformation deploy `
    --template-file aws/cloudformation.yaml `
    --stack-name $StackName `
    --capabilities CAPABILITY_NAMED_IAM `
    --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Stack deployment encountered an issue." -ForegroundColor Red
    Exit 1
}

Write-Host "`n[STEP 3] Fetching Stack Outputs..." -ForegroundColor Green
$outputs = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs" --output json | ConvertFrom-Json

Write-Host "`n================ DEPLOYMENT SUCCESSFUL ================" -ForegroundColor Green
foreach ($out in $outputs) {
    Write-Host "$($out.OutputKey): $($out.OutputValue)" -ForegroundColor Yellow
}
Write-Host "========================================================`n" -ForegroundColor Green
Write-Host "Copy the ApiEndpointUrl above into dashboard/js/aws-client.js or use the Settings Modal in the Dashboard!" -ForegroundColor Cyan
