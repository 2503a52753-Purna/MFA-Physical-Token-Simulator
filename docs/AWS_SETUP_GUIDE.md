# AWS Cloud Setup Guide: IoT Core & Lambda Verification Engine

This guide walks you through deploying and configuring the cloud infrastructure on Amazon Web Services (AWS) for the **MFA Physical Token Simulator**.

You can deploy the entire stack automatically using **AWS CloudFormation** or set up each component manually via the **AWS Management Console**.

---

## Method A: Automated One-Click Deployment (CloudFormation)

### 1. Using AWS CLI (Windows PowerShell or Bash)
Run the automated deployment script provided in the `aws/` directory:

**Windows PowerShell**:
```powershell
.\aws\deploy.ps1 -Region us-east-1
```

**Linux / macOS / Git Bash**:
```bash
chmod +x aws/deploy.sh
./aws/deploy.sh
```

### 2. Using AWS Management Console
1. Navigate to **CloudFormation** in the AWS Console.
2. Click **Create Stack** -> **With new resources (standard)**.
3. Choose **Upload a template file** and select `aws/cloudformation.yaml`.
4. Name the stack: `mfa-token-simulator-stack`.
5. Check the box: *"I acknowledge that AWS CloudFormation might create IAM resources"*.
6. Click **Submit**. In ~90 seconds, all resources will be provisioned.
7. Go to the **Outputs** tab to copy the `ApiEndpointUrl`.

---

## Method B: Step-by-Step Manual AWS Setup

### Step 1: Create the AWS IoT Thing
1. Open the **AWS IoT Core Console**.
2. Go to **Manage** -> **All devices** -> **Things** -> Click **Create things**.
3. Choose **Create single thing** and name it `ESP32-MFA-01`.
4. Click **Next**. Select **Auto-generate a new certificate (recommended)**.
5. In the **Policies** step, click **Create policy**:
   - Policy Name: `ESP32MfaPolicy`
   - Policy Action: `iot:*` (or use least-privilege policy from `aws/policies/esp32-iot-policy.json`)
   - Resource ARN: `*`
   - Effect: `Allow`
6. Attach the policy and click **Create thing**.
7. **Download the certificates**:
   - Device Certificate (`...-certificate.pem.crt`)
   - Private Key (`...-private.pem.key`)
   - Amazon Root CA 1 (`AmazonRootCA1.pem`)

### Step 2: Configure the ESP32 Firmware Secrets
1. Copy `firmware/esp32_mfa_token/secrets.h.example` to `secrets.h`.
2. Paste your Wi-Fi SSID and Password.
3. Paste your AWS IoT Core Data Endpoint (found in **AWS IoT** -> **Settings** -> **Device data endpoint**).
4. Paste the downloaded certificates into `AWS_CERT_CA`, `AWS_CERT_CRT`, and `AWS_CERT_PRIVATE`.

### Step 3: Create DynamoDB Tables
1. Go to **Amazon DynamoDB Console** -> **Create table**.
2. **Table 1: Token Replay Table**:
   - Table name: `MfaDevicesTable`
   - Partition key: `deviceId` (String)
3. **Table 2: Telemetry Table**:
   - Table name: `MfaTelemetryLogs`
   - Partition key: `deviceId` (String)
   - Sort key: `timestamp` (Number)

### Step 4: Deploy the AWS Lambda Function
1. Go to **AWS Lambda** -> **Create function**.
2. Function name: `MfaVerifyOtpFunction`.
3. Runtime: **Node.js 20.x** (or Python 3.12).
4. Architecture: `x86_64` or `arm64`.
5. Under **Code Source**, paste the code from `aws/lambda/verify_otp.js`.
6. Under **Configuration** -> **Environment variables**:
   - `DYNAMODB_TABLE`: `MfaDevicesTable`
   - `DEFAULT_SHARED_SECRET`: `JBSWY3DPEHPK3PXP`
7. Under **Configuration** -> **Permissions**:
   - Ensure the execution role has policies allowing `dynamodb:GetItem`, `dynamodb:PutItem`, and `iot:Publish`.

### Step 5: Configure Amazon API Gateway (HTTP API)
1. Go to **API Gateway Console** -> **Create API** -> Choose **HTTP API**.
2. Name: `MfaTokenVerificationApi`.
3. Add Integration: choose **Lambda**, select `MfaVerifyOtpFunction`.
4. Route: `POST /verify`.
5. Click **CORS** in the left menu and set:
   - Access-Control-Allow-Origin: `*`
   - Access-Control-Allow-Headers: `Content-Type, Authorization, X-Api-Key`
   - Access-Control-Allow-Methods: `GET, POST, OPTIONS`
6. Deploy the API and copy the Invoke URL (e.g., `https://xyz123.execute-api.us-east-1.amazonaws.com/verify`).

### Step 6: Link the Web Dashboard
1. Open `dashboard/index.html` in your browser.
2. Click the **AWS Settings** button in the top navigation bar.
3. Paste your `ApiEndpointUrl` and click **Save & Apply**.
4. The dashboard will now execute verification directly against your live AWS cloud backend!
