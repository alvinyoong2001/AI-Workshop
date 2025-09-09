# Bitbucket OAuth Setup Guide

This guide will help you set up OAuth authentication for the git-mcp-server to use Bitbucket API instead of traditional git clone with credentials.

## Benefits of OAuth Authentication

- **No hardcoded credentials** in environment variables
- **Browser-based login** with familiar Bitbucket interface
- **Automatic token refresh** for seamless experience
- **Fine-grained permissions** control
- **Secure authentication flow** with PKCE

## Step 1: Create OAuth Consumer in Bitbucket

1. **Log in to Bitbucket** and go to your account settings
2. **Navigate to OAuth** settings:
   - Go to `https://bitbucket.org/account/settings/app-passwords/`
   - Or: Account Settings → App passwords → OAuth consumers

3. **Create new OAuth consumer**:
   - Click "Add consumer"
   - Fill in the details:
     - **Name**: `Git MCP Server` (or any name you prefer)
     - **Description**: `OAuth consumer for git-mcp-server`
     - **Callback URL**: `http://localhost:8080/callback`
     - **This is a private consumer**: ✅ (checked)

4. **Set permissions**:
   - **Account**: Read
   - **Repositories**: Read, Write (if you need to create PRs)
   - **Pull requests**: Read, Write (if you need PR management)

5. **Save the consumer** and note down:
   - **Client ID** (e.g., `wbZ9XkLbNfhq7Y...`)
   - **Client Secret** (optional, recommended for security)

## Step 2: Update Dependencies

Run this command in the git-mcp-server directory:

```bash
npm install express open crypto node-fetch js-base64
```

## Step 3: Using OAuth Authentication

### Authenticate
```javascript
// Call the authenticate_bitbucket tool with your OAuth credentials
{
  "tool": "authenticate_bitbucket",
  "arguments": {
    "clientId": "your_client_id_here",
    "clientSecret": "your_client_secret_here"  // Optional but recommended
  }
}
```

### Check Authentication Status
```javascript
{
  "tool": "bitbucket_auth_status",
  "arguments": {}
}
```

### Checkout Repository with API
```javascript
{
  "tool": "checkout_repository",
  "arguments": {
    "repositoryUrl": "https://bitbucket.org/workspace/repo-name",
    "targetDirectory": "D:\\path\\to\\target\\directory",
    "branch": "feature-branch"  // Optional, defaults to 'main'
  }
}
```

## Step 4: Authentication Flow

1. **Run authenticate_bitbucket** - Browser will open automatically
2. **Login to Bitbucket** - Use your regular Bitbucket credentials
3. **Grant permissions** - Review and approve the permissions
4. **Complete authentication** - Browser will show success message
5. **Start using API methods** - Repository operations now use Bitbucket API

## Troubleshooting

### Browser doesn't open automatically
- **Manual URL**: The console will show the OAuth URL to visit manually
- **Copy and paste** the URL into your browser

### Port 8080 is in use
- **Check for other services** using port 8080
- **Terminate conflicting processes** or wait for them to finish

### Authentication timeout
- **Complete the flow within 5 minutes**
- **Re-run authenticate_bitbucket** if timeout occurs

### Invalid client credentials
- **Double-check Client ID** from your OAuth consumer settings
- **Verify callback URL** is exactly `http://localhost:8080/callback`
- **Ensure consumer is active** in Bitbucket settings

### Repository access denied
- **Check repository permissions** - ensure you have read access
- **Verify workspace name** in the repository URL
- **Check if repository is private** and you have appropriate access

## Security Features

### PKCE (Proof Key for Code Exchange)
- **Enhanced security** for OAuth flow
- **Protection against** authorization code interception
- **Automatic generation** of code verifier and challenge

### Token Management
- **Automatic token refresh** when tokens expire
- **Secure token storage** in memory only
- **Logout capability** to clear tokens

### No Persistent Storage
- **Tokens are not saved** to disk for security
- **Re-authentication required** after server restart
- **No credential files** to accidentally commit

## Migration from Environment Variables

If you were previously using `BITBUCKET_USERNAME` and `BITBUCKET_TOKEN`:

### Old Method (Environment Variables)
```bash
export BITBUCKET_USERNAME=myusername
export BITBUCKET_TOKEN=mytoken
git clone https://myusername:mytoken@bitbucket.org/workspace/repo.git
```

### New Method (OAuth API)
```javascript
// 1. Authenticate once
authenticate_bitbucket(clientId)

// 2. Use API for all operations
checkout_repository(repositoryUrl, targetDirectory, branch)
```

## Benefits Over Git Clone

| Feature | Git Clone | Bitbucket API |
|---------|-----------|---------------|
| **Authentication** | Username/Password | OAuth (browser login) |
| **Security** | Credentials in URL | Secure token exchange |
| **Setup** | Environment variables | One-time OAuth setup |
| **Permissions** | Repository access token | Fine-grained OAuth scopes |
| **User Experience** | Manual credential management | Automatic browser flow |
| **Corporate Networks** | May require proxy setup | Standard HTTPS requests |

## Next Steps

After setting up OAuth authentication, you can:

1. **Checkout repositories** using the API
2. **Manage pull requests** with OAuth permissions
3. **Access private repositories** you have permissions for
4. **Integrate with CI/CD** using the same OAuth flow

For more advanced usage, see the main README.md file.
