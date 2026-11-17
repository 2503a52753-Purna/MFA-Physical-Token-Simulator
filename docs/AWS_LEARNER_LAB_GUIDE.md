# ☁️ AWS Learner Lab Permanent Connection Guide

This guide explains how to connect your **AWS Academy Learner Lab** account to the **MFA Physical Token Simulator** permanently, so that the live verification backend works 24/7 without needing to re-enter session tokens or restart setups.

---

## 💡 Why Does This Connection Stay Permanent?

Students using AWS Learner Lab often worry about the **4-hour session timer**. Here is the key cloud architectural principle:
- **Temporary CLI tokens expire after 4 hours**: The AWS Access Key, Secret Key, and Session Token used on your laptop command line rotate when your lab shuts down.
- **BUT your cloud resources DO NOT EXPIRE**: Any **AWS Lambda Function**, **Lambda Function URL**, **DynamoDB Table**, or **Amazon API Gateway** deployed in your `us-east-1` region **stays alive permanently** in your Learner Lab account until the course ends!
- Because our verification engine exposes a **public HTTPS endpoint with CORS `*` enabled**, your web dashboard can communicate directly with your live AWS Lambda backend **24 hours a day, 7 days a week, from any device or browser**, with **zero session credentials needed**!

---

## 🚀 3 Ways to Deploy Permanently

### Method 1: Automated 1-Click Script (Recommended)

1. Open your AWS Learner Lab and click **AWS Details** -> **AWS CLI**. Copy the credentials block.
2. Paste the credentials into your PowerShell or Bash terminal.
3. Run the automated Learner Lab deployment script:

**Windows PowerShell**:
```powershell
.\aws\deploy-learner-lab.ps1
```

**Linux / Mac / Git Bash**:
```bash
chmod +x aws/deploy-learner-lab.sh
./aws/deploy-learner-lab.sh
```

**What this does automatically:**
- Validates your AWS Learner Lab credentials.
- Deploys `aws/cloudformation-learner-lab.yaml` using the built-in `LabRole` (100% bypasses all IAM permission restrictions).
- Provisions the DynamoDB tables and the Lambda Function URL.
- Automatically writes your live permanent endpoint into `dashboard/aws-config.json`.
- When you open the web dashboard, it is connected to your real AWS cloud permanently!

---

### Method 2: One-Click AWS CloudFormation Console

If you prefer using the AWS Web Console:
1. In the AWS Learner Lab Console, search for **CloudFormation** (make sure region is **us-east-1 (N. Virginia)**).
2. Click **Create stack** -> **With new resources (standard)**.
3. Select **Upload a template file** and choose `aws/cloudformation-learner-lab.yaml`.
4. Enter Stack name: `mfa-learner-lab-stack`.
5. Click **Next** -> **Next** -> **Submit** (no IAM acknowledgment required because it uses `LabRole`).
6. Wait ~45 seconds until the stack status turns green: `CREATE_COMPLETE`.
7. Click the **Outputs** tab:
   - Copy the value of **`LambdaFunctionUrl`** (e.g. `https://abc123xyz.lambda-url.us-east-1.on.aws/`) or **`ApiEndpointUrl`**.
8. Open your Web Dashboard (`dashboard/index.html`), click **☁️ Connect AWS Learner Lab** in the top navigation bar, paste the URL, and click **Lock In Permanently**!

---

### Method 3: 2-Minute Direct Lambda Setup (Zero CloudFormation)

If you just want a single Lambda function with a public Function URL:
1. Open the **AWS Lambda Console** in `us-east-1`.
2. Click **Create function** -> **Author from scratch**:
   - Function name: `MfaVerifyOtpFunction`
   - Runtime: `Node.js 20.x`
   - Permissions: Click *Change default execution role* -> Select **Use an existing role** -> Choose **`LabRole`**.
3. In the Function overview, click **Add Function URL**:
   - Auth type: **NONE**
   - Configure CORS: Check **Configure cross-origin resource sharing (CORS)**
   - Allow origins: `*`
   - Allow headers: `*`
   - Allow methods: `*`
   - Click **Save**.
4. Paste the code from `aws/lambda/verify_otp.js` into the Code Editor and click **Deploy**.
5. Copy your **Function URL** (looks like `https://...lambda-url.us-east-1.on.aws/`).
6. Paste it into the Dashboard's **AWS Learner Lab** dialog and click **Test & Lock In Permanently**!

---

## 🔒 How Permanent Persistence Works in the Dashboard

The dashboard uses a 3-layer persistence guarantee:
1. **`dashboard/aws-config.json`**: When committed to Git or saved locally, the dashboard automatically loads it on startup.
2. **Browser `localStorage`**: Saved under `aws_learner_lab_permanent_url` so closing your tab or restarting your PC never loses the connection.
3. **URL Parameter**: You can share the dashboard with evaluators using `index.html?endpoint=YOUR_URL` to automatically connect their browser to your live AWS Lambda backend!

---

## 🧪 Testing Your Connection

In the dashboard, click **☁️ Connect AWS Learner Lab** -> **Test Connection (Ping AWS)**:
- **Expected response**: `✅ Connected Permanently to AWS Learner Lab (HTTP 200 OK | Latency: ~40ms)`.
- If your endpoint is active, you will see the top badge turn **🟢 AWS Live Cloud (Permanent Learner Lab)**!
