# Git MCP Server

A Model Context Protocol (MCP) server that provides Git operations and pull request management capabilities. This server supports both traditional git operations and **modern OAuth-based Bitbucket API integration** for enhanced security and functionality.

## Features

- **Git Operations:**
  - Get differences between current branch and target branch
  - Get current branch name
  - List all available branches

- **Repository Management:**
  - List available Git repositories in directories
  - Switch between different Git repositories
  - Get current repository information
  - **Smart auto-detection** of Git repositories based on context
  - **OAuth-based Bitbucket API checkout** (NEW) - Secure browser-based authentication
  - **Legacy git-based checkout** for backward compatibility

- **Pull Request Management:**
  - Create pull requests (supports GitHub and Bitbucket)
  - Create draft pull requests
  - Get pull request comments
  - Reply to pull request comments

- **Story-Based Code Analysis** (NEW):
  - Get code changes for specific Jira story tickets
  - Analyze merged pull requests and their changesets
  - Get latest commits and their changes for effort analysis
  - Analyze code complexity and changes for effort estimation
  - **Integration with Jira MCP server** for better effort estimation

- **Enhanced Analysis Features** (NEW):
  - **Developer Performance Analysis** - Analyzes developer efficiency and productivity metrics
  - **Story Complexity Statistics** - Detailed metrics on code changes, file complexity, and change patterns
  - **Developer Recommendations** - Suggests suitable developers for stories based on performance and skills
  - **Advanced Code Complexity** - Enhanced analysis with file type breakdowns and complexity thresholds

## Installation

1. Clone or navigate to this directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. **For OAuth Authentication (Recommended):**
   - Follow the [OAuth Setup Guide](./oauth-setup.md)
   - No environment variables needed!

4. **For Legacy Git Authentication (Optional):**
   ```bash
   cp env.example .env
   # Edit .env with your credentials
   ```
   
   Edit `.env` and add your API tokens:
   - For GitHub: Get a token from https://github.com/settings/tokens
   - For Bitbucket: Get a token from https://bitbucket.org/account/settings/app-passwords/
   
   **Authentication for Repository Checkout:**
   The server automatically uses these environment variables for cloning private repositories:
   - `GITHUB_TOKEN`: For GitHub repositories
   - `BITBUCKET_TOKEN` and `BITBUCKET_USERNAME`: For Bitbucket repositories
   
   No need to manually enter credentials when using the `checkout_repository` tool!

## Usage

### Starting the Server

```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

### Available Tools

#### 1. Get Git Diff
Compare current branch with a target branch:
```json
{
  "name": "get_git_diff",
  "arguments": {
    "targetBranch": "main"
  }
}
```

#### 2. Get Current Branch
Get the name of the current branch:
```json
{
  "name": "get_current_branch",
  "arguments": {}
}
```

#### 3. Get Branch List
List all available branches:
```json
{
  "name": "get_branch_list",
  "arguments": {}
}
```

#### 4. List Git Repositories
Find and list available Git repositories:
```json
{
  "name": "list_git_repositories",
  "arguments": {
    "maxDepth": 3,
    "basePath": "/path/to/search"
  }
}
```

#### 5. Switch Git Repository
Switch to a different Git repository:
```json
{
  "name": "switch_git_repository",
  "arguments": {
    "repoPath": "/path/to/repository"
  }
}
```

#### 6. Get Current Repository Info
Get information about the current repository:
```json
{
  "name": "get_current_repository_info",
  "arguments": {}
}
```

#### 7. Set Working Directory
Set the working directory for Git operations:
```json
{
  "name": "set_working_directory",
  "arguments": {
    "directory": "/path/to/your/project"
  }
}
```

#### 8. Auto-Detect Repository (Smart Feature)
Automatically detect and set the best Git repository for the current context:
```json
{
  "name": "auto_detect_repository",
  "arguments": {}
}
```

#### 9. Create Pull Request
Create a new pull request with smart duplicate detection:
```json
{
  "name": "create_pull_request",
  "arguments": {
    "title": "Add new feature",
    "description": "This PR adds a new feature",
    "sourceBranch": "feature-branch",
    "targetBranch": "main",
    "isDraft": false,
    "platform": "github",
    "repoOwner": "username",
    "repoName": "repository-name",
    "force": false,
    "checkExisting": true
  }
}
```

**New Parameters:**
- `force` (boolean): Force create PR even if one already exists (default: false)
- `checkExisting` (boolean): Check for existing PRs before creating (default: true)

**Smart Features:**
- ✅ **Duplicate Detection**: Automatically checks for existing PRs from the same branch
- ✅ **Force Override**: Use `force: true` to create multiple PRs when needed
- ✅ **Skip Check**: Use `checkExisting: false` to bypass duplicate checking
- ✅ **Helpful Messages**: Shows existing PRs with links when duplicates are found

#### 10. Get Pull Request Comments
Get comments for a specific pull request:
```json
{
  "name": "get_pull_request_comments",
  "arguments": {
    "prNumber": "123",
    "platform": "github",
    "repoOwner": "username",
    "repoName": "repository-name"
  }
}
```

#### 11. Reply to Comment
Reply to a specific comment:
```json
{
  "name": "reply_to_comment",
  "arguments": {
    "prNumber": "123",
    "commentId": "456",
    "replyText": "Thanks for the feedback!",
    "platform": "github",
    "repoOwner": "username",
    "repoName": "repository-name"
  }
}
```

#### 12. Get Pull Request Details
Get detailed information about a pull request including changes/diff:
```json
{
  "name": "get_pull_request_details",
  "arguments": {
    "prNumber": "123",
    "platform": "github",
    "repoOwner": "username",
    "repoName": "repository-name",
    "includeDiff": true
  }
}
```

**Parameters:**
- `prNumber` (string): Pull request number
- `platform` (string): Platform: github or bitbucket (default: github)
- `repoOwner` (string): Repository owner/organization
- `repoName` (string): Repository name
- `includeDiff` (boolean): Include diff/changes in the response (default: true)

**What you get:**
- ✅ **PR Metadata**: Title, state, author, dates, branches
- ✅ **Statistics**: Commits, changed files, additions, deletions
- ✅ **Description**: Full PR description
- ✅ **Changes/Diff**: Complete diff showing all changes (optional)
- ✅ **URL**: Direct link to the PR

## Story-Based Code Analysis (NEW)

The Git MCP server now includes powerful tools for analyzing code changes related to Jira story tickets, enabling better effort estimation.

### 13. Authenticate with Bitbucket (OAuth) 🔐
**NEW**: Secure browser-based authentication for Bitbucket API:

```json
{
  "name": "authenticate_bitbucket",
  "arguments": {
    "clientId": "your_oauth_client_id",
    "clientSecret": "your_oauth_client_secret"
  }
}
```

**OAuth Benefits:**
- ✅ **Secure Browser Login** - No hardcoded credentials
- ✅ **Automatic Token Refresh** - Seamless experience  
- ✅ **Fine-grained Permissions** - Only request needed access
- ✅ **PKCE Security** - Enhanced OAuth flow protection

**Setup:** Follow the [OAuth Setup Guide](./oauth-setup.md)

### 14. Check Authentication Status
Check current Bitbucket authentication status:
```json
{
  "name": "bitbucket_auth_status",
  "arguments": {}
}
```

### 15. Checkout Repository (API-based) 🚀
**NEW**: Checkout using Bitbucket API with OAuth authentication:

```json
{
  "name": "checkout_repository",
  "arguments": {
    "repositoryUrl": "https://bitbucket.org/workspace/repo-name",
    "targetDirectory": "D:\\AI\\my-project",
    "branch": "feature/new-feature"
  }
}
```

**API-based Benefits:**
- ✅ **OAuth Authentication** - Secure browser-based login
- ✅ **Corporate Firewall Friendly** - Uses HTTPS only
- ✅ **No Git Installation Required** - Pure API approach
- ✅ **Automatic Git Initialization** - Creates functional git repo

**Target Directory Options:**
- **Absolute path**: `"D:\\AI\\my-project"`
- **Relative path**: `"my-project"` (relative to current directory)

**Requirements:**
- Must authenticate first using `authenticate_bitbucket`
- Currently supports Bitbucket repositories only

### 14. Get Story Code Changes
Get code changes for specific Jira story tickets:
```json
{
  "name": "get_story_code_changes",
  "arguments": {
    "storyKeys": ["PR-1", "PR-2", "PR-3"],
    "includeMergedPRs": true,
    "includeCommits": true,
    "maxResults": 15,
    "timeRange": "30d"
  }
}
```

### 15. Analyze Merged PRs
Analyze merged pull requests and their changesets:
```json
{
  "name": "analyze_merged_prs",
  "arguments": {
    "storyKey": "PR-1",
    "includeFiles": true,
    "includeStats": true,
    "maxPRs": 5
  }
}
```

### 16. Get Latest Commits
Get latest commits and their changes for effort analysis:
```json
{
  "name": "get_latest_commits",
  "arguments": {
    "storyKey": "PR-1",
    "branch": "develop",
    "maxCommits": 20,
    "includeFiles": true,
    "timeRange": "7d"
  }
}
```

### 17. Analyze Code Complexity
Analyze code complexity and changes for effort estimation:
```json
{
  "name": "analyze_code_complexity",
  "arguments": {
    "storyKeys": ["PR-1", "PR-2"],
    "includeMetrics": true,
    "includeFileTypes": [".js", ".ts", ".java"]
  }
}
```

## Enhanced Analysis Features (NEW)

The Git MCP server now includes advanced analysis tools for better story estimation and developer assignment.

### 18. Analyze Developer Performance
Analyze developer performance based on time logged vs code changes:
```json
{
  "name": "analyze_developer_performance",
  "arguments": {
    "timeRange": "6m",
    "includeMetrics": true,
    "minStories": 3,
    "storyKeys": ["PR-1", "PR-2"]
  }
}
```

**What you get:**
- ✅ **Top Performers**: Ranked by efficiency (commits per story)
- ✅ **Performance Metrics**: Commits, stories, average efficiency scores
- ✅ **Historical Trends**: Performance over specified time range
- ✅ **Team Insights**: Overall team productivity statistics

### 19. Get Story Complexity Statistics
Get detailed complexity statistics for specific stories:
```json
{
  "name": "get_story_complexity_stats",
  "arguments": {
    "storyKeys": ["PR-1", "PR-2"],
    "includeHistorical": true,
    "includeFileBreakdown": true,
    "complexityThreshold": 10
  }
}
```

**What you get:**
- ✅ **Lines of Code**: Total additions and deletions per story
- ✅ **File Complexity**: Changes per file with complexity thresholds
- ✅ **Type Distribution**: Breakdown by file type (.js, .ts, .java, etc.)
- ✅ **High Complexity Files**: Identification of files exceeding thresholds

### 20. Recommend Developers for Story
Recommend suitable developers based on performance and skills:
```json
{
  "name": "recommend_developers_for_story",
  "arguments": {
    "storyDescription": "Implement OAuth2 authentication system",
    "storyType": "feature",
    "requiredSkills": ["backend", "security"],
    "timeRange": "6m",
    "maxRecommendations": 5
  }
}
```

**What you get:**
- ✅ **Ranked Recommendations**: Top developers for the story
- ✅ **Skill Matching**: Analysis of required vs available skills
- ✅ **Performance History**: Developer efficiency in recent period
- ✅ **Expertise Areas**: Technology-specific recommendations

**Supported Skill Categories:**
- **Frontend**: javascript, typescript, react, vue, angular, html, css
- **Backend**: java, python, c#, node, php, database, api
- **DevOps**: docker, kubernetes, aws, azure, ci/cd, deployment
- **Mobile**: ios, android, react native, flutter, swift, kotlin
  }
}
```

### 16. Get Latest Commits
Get latest commits and their changes for effort analysis:
```json
{
  "name": "get_latest_commits",
  "arguments": {
    "storyKey": "PR-1",
    "branch": "main",
    "maxCommits": 10,
    "includeFiles": true,
    "timeRange": "7d"
  }
}
```

### 17. Analyze Code Complexity
Analyze code complexity and changes for effort estimation:
```json
{
  "name": "analyze_code_complexity",
  "arguments": {
    "storyKeys": ["PR-1", "PR-2"],
    "includeMetrics": true,
    "includeFileTypes": [".js", ".ts", ".py", ".java"]
  }
}
```

### Integration with Jira MCP Server

For comprehensive effort estimation, combine the Git MCP server with the Jira MCP server:

1. **Get story details from Jira** (using Jira MCP server)
2. **Analyze code changes** (using Git MCP server)
3. **Combine data for better estimation**

See [STORY_ANALYSIS_GUIDE.md](./STORY_ANALYSIS_GUIDE.md) for detailed workflow and best practices.

### Testing Story Analysis Features

Run the test script to verify all story analysis features:

```bash
npm run test-story-analysis
```

## Configuration

### Environment Variables

- `GITHUB_TOKEN`: Your GitHub personal access token
- `BITBUCKET_TOKEN`: Your Bitbucket API token
- `BITBUCKET_USERNAME`: Your Bitbucket username (required for Bitbucket operations)

### Platform Support

The server supports both GitHub and Bitbucket:

- **GitHub**: Uses GitHub REST API v3
- **Bitbucket**: Uses Bitbucket REST API v2

## Error Handling

The server provides detailed error messages for common issues:
- Missing API tokens
- Invalid repository information
- Network connectivity issues
- Git command failures

## Development

To modify or extend the server:

1. The main server logic is in `server.js`
2. Each tool is implemented as a method in the `GitMCPServer` class
3. Add new tools by:
   - Adding them to the tools array in `setupToolHandlers()`
   - Implementing the corresponding method
   - Adding a case in the switch statement

## Requirements

- Node.js 16 or higher
- Git installed and configured
- Valid API tokens for the platforms you want to use

## License

MIT 