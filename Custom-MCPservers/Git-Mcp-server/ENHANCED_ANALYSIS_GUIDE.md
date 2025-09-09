# Enhanced Analysis Guide for Git MCP Server

This guide covers the enhanced analysis features that provide detailed code complexity statistics and developer performance metrics to improve story estimation accuracy.

## 🎯 Overview

The enhanced Git MCP server now provides four powerful analysis tools:

1. **Developer Performance Analysis** - Analyzes developer efficiency and productivity
2. **Story Complexity Statistics** - Detailed metrics on code changes and complexity
3. **Developer Recommendations** - Suggests suitable developers for stories
4. **Enhanced Code Complexity** - Advanced analysis with file type breakdowns

## 🛠️ New Tools

### 1. `analyze_developer_performance`

Analyzes developer performance based on time logged vs code changes for story assignment recommendations.

**Parameters:**
- `timeRange` (string): Time range to analyze (e.g., "30d", "6m", "1y", default: "6m")
- `includeMetrics` (boolean): Include detailed performance metrics (default: true)
- `minStories` (number): Minimum number of stories to consider for analysis (default: 3)
- `storyKeys` (array): Specific story keys to analyze (optional)

**Example Usage:**
```javascript
// Analyze developer performance over the last 6 months
const result = await server.analyzeDeveloperPerformance({
  timeRange: '6m',
  includeMetrics: true,
  minStories: 3
});
```

**Output:**
- Top performers ranked by efficiency
- Commits per story metrics
- Developer productivity scores
- Historical performance trends

### 2. `get_story_complexity_stats`

Get detailed complexity statistics for specific stories including cyclomatic complexity, lines of code, and change patterns.

**Parameters:**
- `storyKeys` (array): Array of Jira story keys to analyze
- `includeHistorical` (boolean): Include historical complexity trends (default: true)
- `includeFileBreakdown` (boolean): Include file-level complexity breakdown (default: true)
- `complexityThreshold` (number): Threshold for highlighting high complexity files (default: 10)

**Example Usage:**
```javascript
// Get complexity stats for specific stories
const result = await server.getStoryComplexityStats({
  storyKeys: ['PROJ-123', 'PROJ-124'],
  includeFileBreakdown: true,
  complexityThreshold: 15
});
```

**Output:**
- Total lines changed per story
- File type breakdown
- High complexity file identification
- Average complexity metrics

### 3. `recommend_developers_for_story`

Recommend suitable developers for a story based on their performance history, expertise, and availability.

**Parameters:**
- `storyDescription` (string): Description of the story to find suitable developers for
- `storyType` (string): Type of story (feature, bug, task, etc.)
- `requiredSkills` (array): Required skills or technologies for the story
- `timeRange` (string): Time range to analyze developer performance (default: "6m")
- `maxRecommendations` (number): Maximum number of developer recommendations (default: 5)

**Example Usage:**
```javascript
// Get developer recommendations for a story
const result = await server.recommendDevelopersForStory({
  storyDescription: 'Implement OAuth2 authentication system',
  storyType: 'feature',
  requiredSkills: ['backend', 'security'],
  timeRange: '6m',
  maxRecommendations: 3
});
```

**Output:**
- Ranked list of recommended developers
- Skill matching analysis
- Performance history summary
- Availability considerations

### 4. `analyze_code_complexity` (Enhanced)

Enhanced version of the existing code complexity analysis with additional metrics and file type filtering.

**Parameters:**
- `storyKeys` (array): Array of Jira story keys to analyze
- `includeMetrics` (boolean): Include complexity metrics (default: true)
- `includeFileTypes` (array): File types to analyze (default: all)

**Example Usage:**
```javascript
// Analyze code complexity with file type filtering
const result = await server.analyzeCodeComplexity({
  storyKeys: ['PROJ-123'],
  includeMetrics: true,
  includeFileTypes: ['.js', '.ts', '.java']
});
```

## 📊 Metrics and Analysis

### Developer Performance Metrics

1. **Efficiency Score**: Commits per story (lower is better)
2. **Story Completion Rate**: Stories completed vs time period
3. **Code Quality**: Lines of code per story
4. **Consistency**: Regular commit patterns

### Complexity Metrics

1. **Lines of Code**: Total additions and deletions
2. **File Complexity**: Changes per file
3. **Type Distribution**: Breakdown by file type
4. **Change Patterns**: Frequency and size of changes

### Skill Matching

The system recognizes common technology keywords:

- **Frontend**: javascript, typescript, react, vue, angular, html, css
- **Backend**: java, python, c#, node, php, database, api
- **DevOps**: docker, kubernetes, aws, azure, ci/cd, deployment
- **Mobile**: ios, android, react native, flutter, swift, kotlin

## 🔄 Integration with Jira MCP Server

These tools work seamlessly with the Jira MCP server for comprehensive story analysis:

1. **Get story details** from Jira MCP server
2. **Analyze code changes** for those stories using Git MCP server
3. **Calculate complexity metrics** and developer performance
4. **Provide recommendations** for story assignment and effort estimation

**Example Workflow:**
```javascript
// 1. Get story details from Jira
const storyDetails = await jiraServer.getStoryDetails({
  storyKeys: ['PROJ-123', 'PROJ-124']
});

// 2. Analyze code complexity for those stories
const complexityStats = await gitServer.getStoryComplexityStats({
  storyKeys: ['PROJ-123', 'PROJ-124']
});

// 3. Get developer recommendations
const recommendations = await gitServer.recommendDevelopersForStory({
  storyDescription: 'Implement new feature',
  storyType: 'feature'
});

// 4. Combine insights for better estimation
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file with:

```env
# Git Configuration
GITHUB_TOKEN=your_github_token
BITBUCKET_TOKEN=your_bitbucket_token
BITBUCKET_USERNAME=your_bitbucket_username

# Optional: Working Directory
CWD=/path/to/your/repository
```

### 3. Test the Features

```bash
# Test all enhanced features
npm run test-enhanced

# Test individual features
npm run test-story-analysis
npm run test-checkout
npm run test-auth
```

### 4. Use in Cursor

Configure your `mcp-config.json`:

```json
{
  "mcpServers": {
    "git-mcp-server": {
      "command": "node",
      "args": ["server.js"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
        "BITBUCKET_TOKEN": "${BITBUCKET_TOKEN}",
        "BITBUCKET_USERNAME": "${BITBUCKET_USERNAME}"
      }
    }
  }
}
```

## 📈 Use Cases

### 1. Sprint Planning

- Analyze historical story complexity
- Identify high-risk stories
- Assign stories to suitable developers
- Estimate effort based on similar past stories

### 2. Team Performance Review

- Track developer productivity trends
- Identify skill gaps and training needs
- Optimize team composition for projects

### 3. Code Quality Assessment

- Monitor complexity trends over time
- Identify refactoring opportunities
- Track technical debt accumulation

### 4. Resource Allocation

- Match developers to stories based on expertise
- Balance workload across team members
- Plan for skill development and mentoring

## 🔧 Customization

### Adding New Skill Keywords

Modify the `skillKeywords` object in `recommendDevelopersForStory`:

```javascript
const skillKeywords = {
  'frontend': ['javascript', 'typescript', 'react', 'vue', 'angular', 'html', 'css'],
  'backend': ['java', 'python', 'c#', 'node', 'php', 'database', 'api'],
  'devops': ['docker', 'kubernetes', 'aws', 'azure', 'ci/cd', 'deployment'],
  'mobile': ['ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
  'data-science': ['python', 'r', 'machine-learning', 'ai', 'statistics'],
  'security': ['authentication', 'authorization', 'encryption', 'oauth', 'jwt']
};
```

### Adjusting Complexity Thresholds

Modify the `complexityThreshold` parameter based on your team's standards:

```javascript
// For more conservative complexity assessment
const result = await server.getStoryComplexityStats({
  storyKeys: ['PROJ-123'],
  complexityThreshold: 5  // Lower threshold
});

// For more lenient assessment
const result = await server.getStoryComplexityStats({
  storyKeys: ['PROJ-123'],
  complexityThreshold: 20  // Higher threshold
});
```

## 🐛 Troubleshooting

### Common Issues

1. **"No Git repository found"**
   - Run `checkout_repository` first
   - Use `auto_detect_repository` to find existing repos

2. **"No story keys found"**
   - Ensure commit messages include Jira ticket numbers (e.g., "PROJ-123")
   - Check the time range parameter

3. **"No developers found"**
   - Reduce `minStories` parameter
   - Increase `timeRange` parameter
   - Check if commits have proper author information

### Performance Optimization

- Use smaller `timeRange` values for faster analysis
- Limit `maxResults` parameters for large repositories
- Filter by specific `includeFileTypes` to focus analysis

## 📚 Related Documentation

- [Story Analysis Guide](./STORY_ANALYSIS_GUIDE.md) - Basic story analysis features
- [Authentication Guide](./AUTHENTICATION_GUIDE.md) - Setup authentication
- [README](./README.md) - General server documentation
- [Smart Usage Guide](./SMART_USAGE.md) - Best practices and tips

## 🤝 Contributing

To enhance these features:

1. Add new metrics to the analysis functions
2. Implement additional skill matching algorithms
3. Integrate with more external APIs (GitHub, Bitbucket, etc.)
4. Add visualization capabilities for metrics

## 📄 License

MIT License - see LICENSE file for details.











