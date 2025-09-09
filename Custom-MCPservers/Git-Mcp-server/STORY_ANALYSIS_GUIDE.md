# Git MCP Server - Story-Based Code Analysis Guide

This guide explains how to use the enhanced Git MCP server for story-based code analysis to improve effort estimation.

## 🎯 Overview

The Git MCP server now includes powerful tools for analyzing code changes related to Jira story tickets. This enables better effort estimation by providing concrete data about:

- **Code Changes**: Actual files and lines modified for similar stories
- **PR Analysis**: Merged pull requests and their complexity
- **Commit History**: Detailed commit information with file-level changes
- **Complexity Metrics**: Lines of code, file types, and change patterns

## 🚀 New Tools for Story Analysis

### 1. `checkout_repository`
Clone or checkout a repository to the current working directory.

**Parameters:**
- `repositoryUrl` (required): Git repository URL (HTTPS or SSH)
- `targetDirectory` (optional): Directory to clone into (default: repository name)
- `branch` (optional): Branch to checkout (default: main/master)
- `depth` (optional): Shallow clone depth (default: full history)

**Example:**
```json
{
  "repositoryUrl": "https://github.com/company/project.git",
  "targetDirectory": "my-project",
  "branch": "develop",
  "depth": 100
}
```

### 2. `get_story_code_changes`
Get code changes for specific Jira story tickets to help with effort estimation.

**Parameters:**
- `storyKeys` (required): Array of Jira story keys (e.g., ["PROJ-123", "PROJ-124"])
- `includeMergedPRs` (optional): Include merged pull requests (default: true)
- `includeCommits` (optional): Include individual commits (default: true)
- `maxResults` (optional): Maximum number of changes to return (default: 20)
- `timeRange` (optional): Time range to search (e.g., "30d", "6m", "1y")

**Example:**
```json
{
  "storyKeys": ["PR-1", "PR-2", "PR-3"],
  "includeMergedPRs": true,
  "includeCommits": true,
  "maxResults": 15,
  "timeRange": "30d"
}
```

### 3. `analyze_merged_prs`
Analyze merged pull requests and their changesets for effort estimation.

**Parameters:**
- `storyKey` (required): Jira story key to analyze PRs for
- `includeFiles` (optional): Include file-level changes (default: true)
- `includeStats` (optional): Include statistics (lines added/removed) (default: true)
- `maxPRs` (optional): Maximum number of PRs to analyze (default: 10)

**Example:**
```json
{
  "storyKey": "PR-1",
  "includeFiles": true,
  "includeStats": true,
  "maxPRs": 5
}
```

### 4. `get_latest_commits`
Get latest commits and their changes for effort analysis.

**Parameters:**
- `storyKey` (required): Jira story key to get commits for
- `branch` (optional): Branch to analyze (default: current branch)
- `maxCommits` (optional): Maximum number of commits to return (default: 20)
- `includeFiles` (optional): Include file-level changes (default: true)
- `timeRange` (optional): Time range to search (e.g., "7d", "30d")

**Example:**
```json
{
  "storyKey": "PR-1",
  "branch": "main",
  "maxCommits": 10,
  "includeFiles": true,
  "timeRange": "7d"
}
```

### 5. `analyze_code_complexity`
Analyze code complexity and changes for effort estimation.

**Parameters:**
- `storyKeys` (required): Array of Jira story keys to analyze
- `includeMetrics` (optional): Include complexity metrics (default: true)
- `includeFileTypes` (optional): File types to analyze (default: all)

**Example:**
```json
{
  "storyKeys": ["PR-1", "PR-2"],
  "includeMetrics": true,
  "includeFileTypes": [".js", ".ts", ".py", ".java"]
}
```

## 🔄 Workflow for Better Effort Estimation

### Step 1: Checkout the Repository
First, checkout the source code repository to your working directory:

```json
{
  "repositoryUrl": "https://github.com/your-company/your-project.git",
  "targetDirectory": "project-analysis"
}
```

### Step 2: Get Similar Story Details from Jira
Use the Jira MCP server to get details of similar stories:

```json
{
  "storyKeys": ["PR-1", "PR-2", "PR-3"],
  "includeTimeLogs": true,
  "includeCommits": true
}
```

### Step 3: Analyze Code Changes
Get the actual code changes for those stories:

```json
{
  "storyKeys": ["PR-1", "PR-2", "PR-3"],
  "includeMergedPRs": true,
  "includeCommits": true,
  "maxResults": 20,
  "timeRange": "30d"
}
```

### Step 4: Analyze Merged PRs
Get detailed analysis of merged pull requests:

```json
{
  "storyKey": "PR-1",
  "includeFiles": true,
  "includeStats": true,
  "maxPRs": 10
}
```

### Step 5: Get Latest Commits
Analyze the latest commits for ongoing work:

```json
{
  "storyKey": "PR-1",
  "maxCommits": 20,
  "includeFiles": true,
  "timeRange": "7d"
}
```

### Step 6: Analyze Code Complexity
Get overall complexity metrics:

```json
{
  "storyKeys": ["PR-1", "PR-2", "PR-3"],
  "includeMetrics": true,
  "includeFileTypes": [".js", ".ts", ".py", ".java"]
}
```

## 📊 Understanding the Output

### Code Changes Analysis
The output includes:
- **Commit Information**: Hash, message, author, date
- **File Changes**: Number of files modified, added, deleted
- **Line Statistics**: Lines added, removed, total changes
- **File Types**: Breakdown by file extension
- **Time Patterns**: When changes were made

### PR Analysis
For each merged PR:
- **PR Details**: Number, title, author, merge date
- **File Statistics**: Files changed, lines added/removed
- **File List**: Specific files and their change status
- **Summary Statistics**: Totals and averages across all PRs

### Complexity Metrics
- **Total Lines Changed**: Overall code modification volume
- **Average Lines per Change**: Typical change size
- **File Type Distribution**: Which types of files are most affected
- **Change Frequency**: How often changes occur

## 🎯 Using Data for Effort Estimation

### 1. **Story Point Correlation**
Compare story points with actual code changes:
- High story points + high lines changed = Good estimation
- High story points + low lines changed = Over-estimated
- Low story points + high lines changed = Under-estimated

### 2. **File Type Analysis**
Different file types indicate different complexity:
- **Frontend files** (.js, .ts, .vue, .jsx): UI complexity
- **Backend files** (.py, .java, .cs): Business logic complexity
- **Database files** (.sql, .migration): Data complexity
- **Configuration files** (.yaml, .json): Setup complexity

### 3. **Change Patterns**
- **Many small commits**: Incremental development, lower risk
- **Few large commits**: Big changes, higher risk
- **Multiple file types**: Cross-cutting concerns, higher complexity
- **Single file type**: Focused changes, lower complexity

### 4. **Time Analysis**
- **Recent changes**: Current patterns and team velocity
- **Historical patterns**: Long-term trends and team capacity
- **Seasonal patterns**: Impact of holidays, releases, etc.

## 🔧 Integration with Jira MCP Server

### Combined Workflow
1. **Jira MCP**: Get story details, time logs, and similar stories
2. **Git MCP**: Get actual code changes and complexity metrics
3. **AI Analysis**: Combine both datasets for better estimation

### Example Integration
```json
// Step 1: Get Jira story details
{
  "storyKeys": ["PR-1", "PR-2"],
  "includeTimeLogs": true,
  "includeCommits": true
}

// Step 2: Get Git code changes
{
  "storyKeys": ["PR-1", "PR-2"],
  "includeMergedPRs": true,
  "includeCommits": true,
  "maxResults": 20
}

// Step 3: Analyze complexity
{
  "storyKeys": ["PR-1", "PR-2"],
  "includeMetrics": true
}
```

## 🧪 Testing the Features

Run the test script to verify all features work correctly:

```bash
npm run test-story-analysis
```

This will test:
- Repository auto-detection
- Story code changes retrieval
- Merged PR analysis
- Latest commits analysis
- Code complexity analysis

## 🚨 Troubleshooting

### Common Issues

1. **No Git Repository Found**
   - Use `checkout_repository` to clone a repository
   - Use `auto_detect_repository` to find existing repositories
   - Use `set_working_directory` to specify repository path

2. **No Commits Found for Story**
   - Check if story key is mentioned in commit messages
   - Verify time range is appropriate
   - Check if branch contains the commits

3. **No PRs Found**
   - PR analysis requires GitHub/Bitbucket API integration
   - Ensure API tokens are configured
   - Check if PRs are linked to story keys

4. **Permission Errors**
   - Verify Git repository access
   - Check API token permissions
   - Ensure working directory is accessible

### Debug Tips

1. **Check Repository Status**
   ```json
   {
     "name": "get_current_repository_info"
   }
   ```

2. **List Available Repositories**
   ```json
   {
     "name": "list_git_repositories",
     "arguments": {
       "maxDepth": 3
     }
   }
   ```

3. **Auto-detect Repository**
   ```json
   {
     "name": "auto_detect_repository"
   }
   ```

## 📈 Best Practices

### 1. **Regular Analysis**
- Run analysis weekly to track patterns
- Compare current stories with historical data
- Update estimation models based on new data

### 2. **Data Quality**
- Ensure commit messages include story keys
- Link PRs to Jira stories consistently
- Maintain clean Git history

### 3. **Team Collaboration**
- Share analysis results with the team
- Use data to improve estimation processes
- Track estimation accuracy over time

### 4. **Continuous Improvement**
- Refine estimation models based on actual data
- Identify patterns in over/under-estimation
- Adjust story point scales as needed

## 🔮 Future Enhancements

### Planned Features
- **Machine Learning Integration**: Automated estimation based on historical data
- **Risk Assessment**: Identify high-risk changes based on patterns
- **Team Velocity Tracking**: Monitor team capacity and velocity
- **Predictive Analytics**: Forecast completion times based on complexity

### API Integrations
- **GitHub/Bitbucket**: Enhanced PR and issue linking
- **CI/CD Systems**: Build and deployment time analysis
- **Code Quality Tools**: Integration with SonarQube, CodeClimate, etc.
- **Time Tracking**: Integration with time tracking tools

---

This enhanced Git MCP server provides the foundation for data-driven effort estimation by combining Jira story information with actual code change analysis.












