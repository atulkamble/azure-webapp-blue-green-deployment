<div align="center">
<h1>🚀 azure-webapp-blue-green-deployment
</h1>
<p><strong>Built with ❤️ by <a href="https://github.com/atulkamble">Atul Kamble</a></strong></p>

<p>
<a href="https://codespaces.new/atulkamble/template.git">
<img src="https://github.com/codespaces/badge.svg" alt="Open in GitHub Codespaces" />
</a>
<a href="https://vscode.dev/github/atulkamble/template">
<img src="https://img.shields.io/badge/Open%20with-VS%20Code-007ACC?logo=visualstudiocode&style=for-the-badge" alt="Open with VS Code" />
</a>
<a href="https://vscode.dev/redirect?url=vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https://github.com/atulkamble/template">
<img src="https://img.shields.io/badge/Dev%20Containers-Ready-blue?logo=docker&style=for-the-badge" />
</a>
<a href="https://desktop.github.com/">
<img src="https://img.shields.io/badge/GitHub-Desktop-6f42c1?logo=github&style=for-the-badge" />
</a>
</p>

<p>
<a href="https://github.com/atulkamble">
<img src="https://img.shields.io/badge/GitHub-atulkamble-181717?logo=github&style=flat-square" />
</a>
<a href="https://www.linkedin.com/in/atuljkamble/">
<img src="https://img.shields.io/badge/LinkedIn-atuljkamble-0A66C2?logo=linkedin&style=flat-square" />
</a>
<a href="https://x.com/atul_kamble">
<img src="https://img.shields.io/badge/X-@atul_kamble-000000?logo=x&style=flat-square" />
</a>
</p>

<strong>Version 1.0.0</strong> | <strong>Last Updated:</strong> January 2026
</div>
---

## 🟦🟩 Blue-Green Deployment – Azure Web App (Azure Pipelines)

**Blue = Production slot**
**Green = Staging slot**

Traffic is switched using **Slot Swap** → zero downtime.

---

## 🧩 Architecture Overview

```
Git Repo
   ↓
Azure Pipeline (CI/CD)
   ↓
Deploy to STAGING slot (Green)
   ↓
Validation / Smoke Test
   ↓
Slot Swap (Green → Blue)
```

---

## 🧰 Prerequisites

* Azure Subscription
* Azure DevOps Project
* Azure Web App (Linux or Windows)
* Azure Service Connection (ARM)
* Git repository with app code (ZIP or build output)

---

## 🔹 STEP 1: Create Azure Web App & Slots (Azure CLI)

### 1️⃣ Login & Set Subscription

```bash
az login
az account set --subscription "<SUBSCRIPTION_ID>"
```

---

### 2️⃣ Create Resource Group

```bash
az group create \
  --name rg-bluegreen-demo \
  --location eastus
```

---

### 3️⃣ Create App Service Plan

```bash
az appservice plan create \
  --name bg-appservice-plan \
  --resource-group rg-bluegreen-demo \
  --sku B1 \
  --is-linux
```

---

### 4️⃣ Create Azure Web App (Production = Blue)

```bash
az webapp create \
  --name bg-webapp-atul \
  --resource-group rg-bluegreen-demo \
  --plan bg-appservice-plan \
  --runtime "PYTHON|3.10"
```

---

### 5️⃣ Create Staging Slot (Green)

```bash
az webapp deployment slot create \
  --name bg-webapp-atul \
  --resource-group rg-bluegreen-demo \
  --slot staging
```

---

### 6️⃣ (Optional) Slot Settings (Recommended)

```bash
az webapp config appsettings set \
  --name bg-webapp-atul \
  --resource-group rg-bluegreen-demo \
  --slot staging \
  --settings ENVIRONMENT=STAGING
```

---

## 🔹 STEP 2: Azure DevOps Service Connection

Create **Azure Resource Manager Service Connection** in:

👉 **Azure DevOps**

* Scope: Subscription
* Grant access to all pipelines

---

## 🔹 STEP 3: Azure Pipeline – Blue-Green YAML

### 📄 `azure-pipelines.yml`

```yaml
trigger:
- main

variables:
  azureSubscription: 'Azure-Service-Connection'
  webAppName: 'bg-webapp-atul'
  resourceGroupName: 'rg-bluegreen-demo'
  slotName: 'staging'
  artifactName: 'drop'

stages:

# =========================
# BUILD STAGE
# =========================
- stage: Build
  displayName: Build Application
  jobs:
  - job: BuildJob
    pool:
      vmImage: ubuntu-latest
    steps:
    - task: ArchiveFiles@2
      inputs:
        rootFolderOrFile: '$(Build.SourcesDirectory)'
        includeRootFolder: false
        archiveType: zip
        archiveFile: '$(Build.ArtifactStagingDirectory)/app.zip'
        replaceExistingArchive: true

    - publish: '$(Build.ArtifactStagingDirectory)'
      artifact: $(artifactName)

# =========================
# DEPLOY TO GREEN (STAGING)
# =========================
- stage: Deploy_Staging
  displayName: Deploy to Green Slot (Staging)
  dependsOn: Build
  jobs:
  - job: DeployGreen
    pool:
      vmImage: ubuntu-latest
    steps:
    - download: current
      artifact: $(artifactName)

    - task: AzureWebApp@1
      inputs:
        azureSubscription: $(azureSubscription)
        appName: $(webAppName)
        deployToSlotOrASE: true
        resourceGroupName: $(resourceGroupName)
        slotName: $(slotName)
        package: '$(Pipeline.Workspace)/$(artifactName)/app.zip'

# =========================
# MANUAL APPROVAL (OPTIONAL)
# =========================
- stage: Approval
  displayName: Manual Approval
  dependsOn: Deploy_Staging
  jobs:
  - job: ApprovalJob
    pool: server
    steps:
    - task: ManualValidation@0
      inputs:
        instructions: 'Verify staging slot before production swap'
        timeoutInMinutes: 60

# =========================
# SWAP GREEN → BLUE
# =========================
- stage: Swap_To_Production
  displayName: Swap Staging with Production
  dependsOn: Approval
  jobs:
  - job: SwapSlot
    pool:
      vmImage: ubuntu-latest
    steps:
    - task: AzureAppServiceManage@0
      inputs:
        azureSubscription: $(azureSubscription)
        Action: 'Swap Slots'
        WebAppName: $(webAppName)
        ResourceGroupName: $(resourceGroupName)
        SourceSlot: $(slotName)
        SwapWithProduction: true
```

---

## 🔹 STEP 4: Traffic Flow (Blue-Green)

| Stage         | Slot              | Traffic |
| ------------- | ----------------- | ------- |
| Before Deploy | Production (Blue) | 100%    |
| After Deploy  | Staging (Green)   | 0%      |
| After Swap    | Staging → Prod    | 100%    |

✔ Zero Downtime
✔ Instant Rollback (swap again)

---

## 🔹 STEP 5: Rollback Strategy

```bash
az webapp deployment slot swap \
  --name bg-webapp-atul \
  --resource-group rg-bluegreen-demo \
  --slot staging
```

This instantly restores the previous stable version.

---

## 🔹 STEP 6: Best Practices (Interview + Production)

✅ Always deploy to **slot first**
✅ Use **slot-specific app settings**
✅ Enable **Application Insights**
✅ Add **health check endpoint**
✅ Add **approval before swap**
✅ Tag builds with version numbers

---

## 🎯 Interview One-Liner

> **Blue-Green deployment in Azure Web App uses deployment slots where traffic is switched using slot swap, enabling zero-downtime releases and instant rollback.**

---

If you want next:

* 🔁 **Canary Deployment with Traffic %**
* 🧪 **Health-based auto-swap**
* 🔐 **Key Vault + Slot settings**
* 📊 **Application Insights validation**
* 📦 **.NET / Node / Java / Python sample app**

Just tell me 👍
