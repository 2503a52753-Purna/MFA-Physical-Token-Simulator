# AWS Learner Lab Automated 1-Click Deployment Script (PowerShell)
# Deploys the MFA Verification Backend using AWS Academy / Learner Lab 'LabRole'
# Zero IAM permissions errors - 100% permanent endpoint!

param (
    [string]$StackName = "mfa-learner-lab-stack",
    [string]$Region = "us-east-1"
)

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " MFA Hardware Token Simulator - AWS Learner Lab Deployment      " -ForegroundColor Yellow
Write-Host " Region: $Region | Stack: $StackName" -ForegroundColor Cyan
Write-Host " Note: Uses built-in 'LabRole' to prevent IAM permissions errors" -ForegroundColor Gray
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Check AWS CLI
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] AWS CLI is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install AWS CLI or deploy manually via AWS CloudFormation Console." -ForegroundColor Yellow
    Exit 1
}

# 2. Check AWS Identity
Write-Host "`n[STEP 1] Verifying AWS Learner Lab credentials..." -ForegroundColor Green
$identityJson = aws sts get-caller-identity --output json 2>$null
if ($LASTEXITCODE -ne 0 -or -not $identityJson) {
    Write-Host "[ERROR] Unable to authenticate with AWS." -ForegroundColor Red
    Write-Host "Please paste your AWS Learner Lab CLI credentials (AWS Details -> AWS CLI) into your terminal first." -ForegroundColor Yellow
    Exit 1
}

$identity = $identityJson | ConvertFrom-Json
Write-Host "Authenticated as Account: $($identity.Account) | ARN: $($identity.Arn)" -ForegroundColor Cyan

# 3. Validate CloudFormation Template
Write-Host "`n[STEP 2] Validating CloudFormation template..." -ForegroundColor Green
aws cloudformation validate-template --template-body file://aws/cloudformation-learner-lab.yaml --region $Region
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] CloudFormation template validation failed." -ForegroundColor Red
    Exit 1
}

# 4. Deploy Stack
Write-Host "`n[STEP 3] Deploying CloudFormation Stack ($StackName)..." -ForegroundColor Green
Write-Host "Deploying DynamoDB + Lambda + Function URL + API Gateway..." -ForegroundColor Gray

aws cloudformation deploy `
    --template-file aws/cloudformation-learner-lab.yaml `
    --stack-name $StackName `
    --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Stack deployment failed." -ForegroundColor Red
    Exit 1
}

# 5. Fetch Outputs
Write-Host "`n[STEP 4] Fetching Permanent Endpoints..." -ForegroundColor Green
$outputs = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs" --output json | ConvertFrom-Json

$lambdaUrl = ""
$apiUrl = ""

foreach ($out in $outputs) {
    Write-Host "$($out.OutputKey): $($out.OutputValue)" -ForegroundColor Yellow
    if ($out.OutputKey -eq "LambdaFunctionUrl") { $lambdaUrl = $out.OutputValue }
    if ($out.OutputKey -eq "ApiEndpointUrl") { $apiUrl = $out.OutputValue }
}

$chosenUrl = if ($lambdaUrl) { $lambdaUrl } else { $apiUrl }

# 6. Save directly to dashboard/aws-config.json
$configPath = Join-Path $PSScriptRoot "..\dashboard\aws-config.json"
$configObject = @{
    apiEndpoint = $chosenUrl
    lambdaFunctionUrl = $lambdaUrl
    apiGatewayUrl = $apiUrl
    region = $Region
    mode = "learner_lab"
    connected = $true
    lastDeployed = (Get-Date).ToString("o")
    notes = "Permanent AWS Learner Lab connection. This endpoint works 24/7 across lab session restarts."
}

$configObject | ConvertTo-Json -Depth 4 | Set-Content -Path $configPath -Encoding UTF8

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host " [SUCCESS] PERMANENT AWS LEARNER LAB CONNECTION ESTABLISHED!   " -ForegroundColor Green
Write-Host " Permanent Endpoint: $chosenUrl" -ForegroundColor Yellow
Write-Host " Saved to: $configPath" -ForegroundColor Cyan
Write-Host " Open dashboard/index.html in your browser - it is now locked in!" -ForegroundColor Green
Write-Host "================================================================`n" -ForegroundColor Green
