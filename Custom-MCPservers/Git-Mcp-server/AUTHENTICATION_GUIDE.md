# Authentication Setup Guide

## 🔐 **GitHub Authentication**

### **Step 1: Create Personal Access Token**
1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name like "Git MCP Server"
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `read:org` (Read organization data)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

### **Step 2: Set Environment Variable**
```bash
# In your .env file
GITHUB_TOKEN=ghp_your_actual_token_here
```

### **Step 3: Test GitHub PR Creation**
```json
{
  "name": "create_pull_request",
  "arguments": {
    "title": "Test PR",
    "description": "Testing GitHub integration",
    "platform": "github",
    "repoOwner": "your-username",
    "repoName": "your-repo-name",
    "force": false,
    "checkExisting": true
  }
}
```

---

## 🔐 **Bitbucket Authentication**

### **Step 1: Create API Token**
1. Go to [Bitbucket Settings > App Passwords](https://bitbucket.org/account/settings/app-passwords/)
2. Click "Create app password"
3. Give it a name like "Git MCP Server"
4. Select permissions:
   - ✅ `Repositories: Read`
   - ✅ `Repositories: Write`
   - ✅ `Pull requests: Read`
   - ✅ `Pull requests: Write`
5. Click "Create"
6. **Copy the token immediately** (you won't see it again!)

### **Step 2: Get Your Username**
- Your Bitbucket username is visible in your profile URL
- Or go to [Bitbucket Settings > Account](https://bitbucket.org/account/settings/)

### **Step 3: Set Environment Variables**
```bash
# In your .env file
BITBUCKET_TOKEN=your_api_token_here
BITBUCKET_USERNAME=your_bitbucket_username
```

### **Step 4: Test Bitbucket PR Creation**
```json
{
  "name": "create_pull_request",
  "arguments": {
    "title": "Test PR",
    "description": "Testing Bitbucket integration",
    "platform": "bitbucket",
    "repoOwner": "your-workspace",
    "repoName": "your-repo-name",
    "force": false,
    "checkExisting": true
  }
}
```

---

## 🔧 **Configuration Files**

### **For Cursor (.cursorrules or mcp-config.json)**
```json
{
  "mcpServers": {
    "git-mcp-server": {
      "command": "node",
      "args": ["server.js"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here",
        "BITBUCKET_TOKEN": "your_bitbucket_token_here",
        "BITBUCKET_USERNAME": "your_bitbucket_username",
        "CWD": "${PWD}"
      }
    }
  }
}
```

### **For Local Development (.env)**
```bash
# GitHub
GITHUB_TOKEN=ghp_your_github_token_here

# Bitbucket
BITBUCKET_TOKEN=your_bitbucket_api_token_here
BITBUCKET_USERNAME=your_bitbucket_username
```

---

## 🚨 **Important Notes**

### **GitHub:**
- ✅ Uses Personal Access Token
- ✅ Token contains user information
- ✅ No username needed in API calls
- ✅ Token format: `ghp_xxxxxxxxxxxxxxxxxxxx`

### **Bitbucket:**
- ✅ Uses API Token (App Password in Bitbucket terminology)
- ✅ **Requires both username AND token**
- ✅ Uses Basic Authentication (username:token base64 encoded)
- ✅ API Token format: `xxxxxxxxxxxxxxxxxxxx`

### **Security:**
- 🔒 Never commit tokens to version control
- 🔒 Use environment variables
- 🔒 Rotate tokens regularly
- 🔒 Use minimal required permissions

---

## 🧪 **Testing Your Setup**

### **Test GitHub:**
```
Use create_pull_request with title: "Test GitHub PR", description: "Testing GitHub integration", platform: "github", repoOwner: "your-username", repoName: "your-repo", force: false, checkExisting: true
```

### **Test Bitbucket:**
```
Use create_pull_request with title: "Test Bitbucket PR", description: "Testing Bitbucket integration", platform: "bitbucket", repoOwner: "your-workspace", repoName: "your-repo", force: false, checkExisting: true
```

### **Test Multiple PRs (Force Mode):**
```
Use create_pull_request with title: "Second PR from same branch", description: "Creating multiple PRs", platform: "github", repoOwner: "your-username", repoName: "your-repo", force: true
```

### **Test Comments:**
```
Use get_pull_request_comments with prNumber: "123", platform: "github", repoOwner: "your-username", repoName: "your-repo"
```

### **Test PR Details:**
```
Use get_pull_request_details with prNumber: "123", platform: "github", repoOwner: "your-username", repoName: "your-repo", includeDiff: true
```

### **Test Bitbucket PR Details:**
```
Use get_pull_request_details with prNumber: "456", platform: "bitbucket", repoOwner: "your-workspace", repoName: "your-repo", includeDiff: true
```

---

## ❌ **Common Issues**

### **GitHub Issues:**
- **"Bad credentials"**: Check token format and permissions
- **"Not found"**: Check repoOwner and repoName
- **"Forbidden"**: Token needs `repo` scope

### **Bitbucket Issues:**
- **"Bad credentials"**: Check username and API token
- **"Not found"**: Check workspace (repoOwner) and repoName
- **"Forbidden"**: API token needs proper permissions
- **"Missing username"**: Add BITBUCKET_USERNAME environment variable 