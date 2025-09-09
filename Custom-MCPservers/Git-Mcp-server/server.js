import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import simpleGit from 'simple-git';
import axios from 'axios';
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
// Removed OAuth dependencies - using simple token authentication

dotenv.config();

class GitMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'git-mcp-server',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize with current working directory or CWD from environment
    this.currentRepoPath = process.env.CWD || process.cwd();
    this.git = simpleGit(this.currentRepoPath);
    
    // Initialize simple token-based authentication
    this.bitbucketToken = process.env.BITBUCKET_TOKEN;
    this.bitbucketUsername = process.env.BITBUCKET_USERNAME;
    
    this.setupToolHandlers();
  }

  // Smart method to automatically detect and set the best Git repository
  async autoDetectRepository() {
    try {
      // First, try the current directory
      if (await this.isGitRepository(this.currentRepoPath)) {
        return this.currentRepoPath;
      }

      // If not, search for Git repositories in parent directories
      const parentRepos = this.findGitRepositoriesInParents(this.currentRepoPath);
      if (parentRepos.length > 0) {
        const bestRepo = parentRepos[0]; // Take the closest one
        this.currentRepoPath = bestRepo;
        this.git = simpleGit(bestRepo);
        return bestRepo;
      }

      // If still not found, search in current directory and subdirectories
      const localRepos = this.findGitRepositories(this.currentRepoPath, 2);
      if (localRepos.length > 0) {
        const bestRepo = localRepos[0].path;
        this.currentRepoPath = bestRepo;
        this.git = simpleGit(bestRepo);
        return bestRepo;
      }

      return null;
    } catch (error) {
      console.error('Auto-detect repository error:', error.message);
      return null;
    }
  }

  async isGitRepository(repoPath) {
    try {
      const gitPath = path.join(repoPath, '.git');
      if (!fs.existsSync(gitPath)) {
        return false;
      }
      // Test if it's actually a working Git repository
      const testGit = simpleGit(repoPath);
      await testGit.branch();
      return true;
    } catch {
      return false;
    }
  }

  findGitRepositoriesInParents(startPath, maxDepth = 5) {
    const repos = [];
    let currentPath = startPath;
    let depth = 0;

    while (depth < maxDepth && currentPath !== path.dirname(currentPath)) {
      const gitPath = path.join(currentPath, '.git');
      if (fs.existsSync(gitPath)) {
        repos.push(currentPath);
      }
      currentPath = path.dirname(currentPath);
      depth++;
    }

    return repos;
  }

  setupToolHandlers() {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_git_diff',
            description: 'Get differences between current branch and target branch',
            inputSchema: {
              type: 'object',
              properties: {
                targetBranch: {
                  type: 'string',
                  description: 'Target branch to compare with (default: main)',
                },
              },
              required: [],
            },
          },
          {
            name: 'get_current_branch',
            description: 'Get the current branch name',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'list_git_repositories',
            description: 'List available Git repositories in the current directory and subdirectories',
            inputSchema: {
              type: 'object',
              properties: {
                maxDepth: {
                  type: 'number',
                  description: 'Maximum depth to search for repositories (default: 3)',
                },
                basePath: {
                  type: 'string',
                  description: 'Base path to search from (default: current directory)',
                },
              },
              required: [],
            },
          },
          {
            name: 'switch_git_repository',
            description: 'Switch to a different Git repository',
            inputSchema: {
              type: 'object',
              properties: {
                repoPath: {
                  type: 'string',
                  description: 'Path to the Git repository to switch to',
                },
              },
              required: ['repoPath'],
            },
          },
          {
            name: 'get_current_repository_info',
            description: 'Get information about the current Git repository',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'set_working_directory',
            description: 'Set the working directory for Git operations',
            inputSchema: {
              type: 'object',
              properties: {
                directory: {
                  type: 'string',
                  description: 'Path to the directory to set as working directory',
                },
              },
              required: ['directory'],
            },
          },
          {
            name: 'auto_detect_repository',
            description: 'Automatically detect and set the best Git repository for the current context',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'find_and_switch_repository',
            description: 'Find all Git repositories and switch to the one you specify',
            inputSchema: {
              type: 'object',
              properties: {
                searchPath: {
                  type: 'string',
                  description: 'Path to search for repositories (default: current directory)',
                },
                maxDepth: {
                  type: 'number',
                  description: 'Maximum depth to search (default: 5)',
                },
                switchTo: {
                  type: 'string',
                  description: 'Repository name or path to switch to (optional)',
                },
              },
              required: [],
            },
          },
          {
            name: 'checkout_repository',
            description: 'Clone or checkout a repository to a specified directory using BITBUCKET_TOKEN and BITBUCKET_USERNAME from environment',
            inputSchema: {
              type: 'object',
              properties: {
                repositoryUrl: {
                  type: 'string',
                  description: 'Bitbucket repository URL (e.g., https://bitbucket.org/workspace/repo-name)',
                },
                targetDirectory: {
                  type: 'string',
                  description: 'Directory to clone into (absolute path like "C:\\Users\\user\\repo" or relative path like "my-project")',
                },
               branch: {
                 type: 'string',
                 description: 'Branch to checkout (default: main)',
               },
             },
             required: ['repositoryUrl', 'targetDirectory'],
           },
         },
          {
            name: 'bitbucket_auth_status',
            description: 'Check Bitbucket authentication status',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_story_code_changes',
            description: 'Get code changes for specific Jira story tickets to help with effort estimation',
            inputSchema: {
              type: 'object',
              properties: {
                storyKeys: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Array of Jira story keys (e.g., ["PROJ-123", "PROJ-124"])',
                },
                includeMergedPRs: {
                  type: 'boolean',
                  description: 'Include merged pull requests (default: true)',
                },
                includeCommits: {
                  type: 'boolean',
                  description: 'Include individual commits (default: true)',
                },
                maxResults: {
                  type: 'number',
                  description: 'Maximum number of changes to return (default: 20)',
                },
                timeRange: {
                  type: 'string',
                  description: 'Time range to search (e.g., "30d", "6m", "1y")',
                },
              },
              required: ['storyKeys'],
            },
          },
          {
            name: 'analyze_merged_prs',
            description: 'Analyze merged pull requests and their changesets for effort estimation',
            inputSchema: {
              type: 'object',
              properties: {
                storyKey: {
                  type: 'string',
                  description: 'Jira story key to analyze PRs for',
                },
                includeFiles: {
                  type: 'boolean',
                  description: 'Include file-level changes (default: true)',
                },
                includeStats: {
                  type: 'boolean',
                  description: 'Include statistics (lines added/removed) (default: true)',
                },
                maxPRs: {
                  type: 'number',
                  description: 'Maximum number of PRs to analyze (default: 10)',
                },
              },
              required: ['storyKey'],
            },
          },
          {
            name: 'get_latest_commits',
            description: 'Get latest commits and their changes for effort analysis',
            inputSchema: {
              type: 'object',
              properties: {
                storyKey: {
                  type: 'string',
                  description: 'Jira story key to get commits for',
                },
                branch: {
                  type: 'string',
                  description: 'Branch to analyze (default: current branch)',
                },
                maxCommits: {
                  type: 'number',
                  description: 'Maximum number of commits to return (default: 20)',
                },
                includeFiles: {
                  type: 'boolean',
                  description: 'Include file-level changes (default: true)',
                },
                timeRange: {
                  type: 'string',
                  description: 'Time range to search (e.g., "7d", "30d")',
                },
              },
              required: ['storyKey'],
            },
          },
          {
            name: 'analyze_code_complexity',
            description: 'Analyze code complexity and changes for effort estimation',
            inputSchema: {
              type: 'object',
              properties: {
                storyKeys: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Array of Jira story keys to analyze',
                },
                includeMetrics: {
                  type: 'boolean',
                  description: 'Include complexity metrics (default: true)',
                },
                includeFileTypes: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'File types to analyze (default: all)',
                },
              },
              required: ['storyKeys'],
            },
          },
          {
            name: 'analyze_developer_performance',
            description: 'Analyze developer performance based on time logged vs code changes for story assignment recommendations',
            inputSchema: {
              type: 'object',
              properties: {
                timeRange: {
                  type: 'string',
                  description: 'Time range to analyze (e.g., "30d", "6m", "1y", default: "6m")',
                },
                includeMetrics: {
                  type: 'boolean',
                  description: 'Include detailed performance metrics (default: true)',
                },
                minStories: {
                  type: 'number',
                  description: 'Minimum number of stories to consider for analysis (default: 3)',
                },
                storyKeys: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Specific story keys to analyze (optional, if not provided analyzes all stories in time range)',
                },
              },
              required: [],
            },
          },
          {
            name: 'get_story_complexity_stats',
            description: 'Get detailed complexity statistics for specific stories including cyclomatic complexity, lines of code, and change patterns',
            inputSchema: {
              type: 'object',
              properties: {
                storyKeys: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Array of Jira story keys to analyze',
                },
                includeHistorical: {
                  type: 'boolean',
                  description: 'Include historical complexity trends (default: true)',
                },
                includeFileBreakdown: {
                  type: 'boolean',
                  description: 'Include file-level complexity breakdown (default: true)',
                },
                complexityThreshold: {
                  type: 'number',
                  description: 'Threshold for highlighting high complexity files (default: 10)',
                },
              },
              required: ['storyKeys'],
            },
          },
          {
            name: 'recommend_developers_for_story',
            description: 'Recommend suitable developers for a story based on their performance history, expertise, and availability',
            inputSchema: {
              type: 'object',
              properties: {
                storyDescription: {
                  type: 'string',
                  description: 'Description of the story to find suitable developers for',
                },
                storyType: {
                  type: 'string',
                  description: 'Type of story (feature, bug, task, etc.)',
                },
                requiredSkills: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Required skills or technologies for the story',
                },
                timeRange: {
                  type: 'string',
                  description: 'Time range to analyze developer performance (default: "6m")',
                },
                maxRecommendations: {
                  type: 'number',
                  description: 'Maximum number of developer recommendations (default: 5)',
                },
              },
              required: ['storyDescription'],
            },
          },
          {
            name: 'analyze_code_complexity',
            description: 'Analyze code complexity and changes for effort estimation',
            inputSchema: {
              type: 'object',
              properties: {
                storyKeys: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Array of Jira story keys to analyze',
                },
                includeMetrics: {
                  type: 'boolean',
                  description: 'Include complexity metrics (default: true)',
                },
                includeFileTypes: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'File types to analyze (default: all)',
                },
              },
              required: ['storyKeys'],
            },
          },
          {
            name: 'get_branch_list',
            description: 'Get list of all branches',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
                     {
             name: 'create_pull_request',
             description: 'Create a new pull request (supports GitHub and Bitbucket)',
             inputSchema: {
               type: 'object',
               properties: {
                 title: {
                   type: 'string',
                   description: 'Pull request title',
                 },
                 description: {
                   type: 'string',
                   description: 'Pull request description',
                 },
                 sourceBranch: {
                   type: 'string',
                   description: 'Source branch (default: current branch)',
                 },
                 targetBranch: {
                   type: 'string',
                   description: 'Target branch (default: main)',
                 },
                 isDraft: {
                   type: 'boolean',
                   description: 'Create as draft PR (default: false)',
                 },
                 platform: {
                   type: 'string',
                   description: 'Platform: github or bitbucket (default: github)',
                 },
                 repoOwner: {
                   type: 'string',
                   description: 'Repository owner/organization',
                 },
                 repoName: {
                   type: 'string',
                   description: 'Repository name',
                 },
                 force: {
                   type: 'boolean',
                   description: 'Force create PR even if one already exists (default: false)',
                 },
                 checkExisting: {
                   type: 'boolean',
                   description: 'Check for existing PRs before creating (default: true)',
                 },
               },
               required: ['title', 'repoOwner', 'repoName'],
             },
           },
          {
            name: 'get_pull_request_comments',
            description: 'Get comments for a specific pull request',
            inputSchema: {
              type: 'object',
              properties: {
                prNumber: {
                  type: 'string',
                  description: 'Pull request number',
                },
                platform: {
                  type: 'string',
                  description: 'Platform: github or bitbucket (default: github)',
                },
                repoOwner: {
                  type: 'string',
                  description: 'Repository owner/organization',
                },
                repoName: {
                  type: 'string',
                  description: 'Repository name',
                },
              },
              required: ['prNumber', 'repoOwner', 'repoName'],
            },
          },
                     {
             name: 'reply_to_comment',
             description: 'Reply to a specific comment on a pull request',
             inputSchema: {
               type: 'object',
               properties: {
                 prNumber: {
                   type: 'string',
                   description: 'Pull request number',
                 },
                 commentId: {
                   type: 'string',
                   description: 'Comment ID to reply to',
                 },
                 replyText: {
                   type: 'string',
                   description: 'Reply text',
                 },
                 platform: {
                   type: 'string',
                   description: 'Platform: github or bitbucket (default: github)',
                 },
                 repoOwner: {
                   type: 'string',
                   description: 'Repository owner/organization',
                 },
                 repoName: {
                   type: 'string',
                   description: 'Repository name',
                 },
               },
               required: ['prNumber', 'commentId', 'replyText', 'repoOwner', 'repoName'],
             },
           },
           {
             name: 'get_pull_request_details',
             description: 'Get detailed information about a pull request including changes/diff',
             inputSchema: {
               type: 'object',
               properties: {
                 prNumber: {
                   type: 'string',
                   description: 'Pull request number',
                 },
                 platform: {
                   type: 'string',
                   description: 'Platform: github or bitbucket (default: github)',
                 },
                 repoOwner: {
                   type: 'string',
                   description: 'Repository owner/organization',
                 },
                 repoName: {
                   type: 'string',
                   description: 'Repository name',
                 },
                 includeDiff: {
                   type: 'boolean',
                   description: 'Include diff/changes in the response (default: true)',
                 },
               },
               required: ['prNumber', 'repoOwner', 'repoName'],
             },
           },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_git_diff':
            return await this.getGitDiff(args);
          case 'get_current_branch':
            return await this.getCurrentBranch();
          case 'list_git_repositories':
            return await this.listGitRepositories(args);
          case 'switch_git_repository':
            return await this.switchGitRepository(args);
          case 'get_current_repository_info':
            return await this.getCurrentRepositoryInfo();
          case 'set_working_directory':
            return await this.setWorkingDirectory(args);
          case 'auto_detect_repository':
            return await this.autoDetectRepositoryTool();
          case 'find_and_switch_repository':
            return await this.findAndSwitchRepository(args);
          case 'get_branch_list':
            return await this.getBranchList();
          case 'bitbucket_auth_status':
            return await this.getBitbucketAuthStatus();
          case 'create_pull_request':
            return await this.createPullRequest(args);
          case 'get_pull_request_comments':
            return await this.getPullRequestComments(args);
                     case 'reply_to_comment':
             return await this.replyToComment(args);
           case 'get_pull_request_details':
             return await this.getPullRequestDetails(args);
          case 'checkout_repository':
            return await this.checkoutRepositoryAPI(args);
          case 'get_story_code_changes':
            return await this.getStoryCodeChanges(args);
          case 'analyze_merged_prs':
            return await this.analyzeMergedPRs(args);
          case 'get_latest_commits':
            return await this.getLatestCommits(args);
          case 'analyze_code_complexity':
            return await this.analyzeCodeComplexity(args);
          case 'analyze_developer_performance':
            return await this.analyzeDeveloperPerformance(args);
          case 'get_story_complexity_stats':
            return await this.getStoryComplexityStats(args);
          case 'recommend_developers_for_story':
            return await this.recommendDevelopersForStory(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async getGitDiff(args) {
    const targetBranch = args.targetBranch || 'main';
    const currentBranch = await this.git.branch();
    
    try {
      const diff = await this.git.diff([`${targetBranch}...${currentBranch.current}`]);
      
      return {
        content: [
          {
            type: 'text',
            text: `Differences between ${currentBranch.current} and ${targetBranch}:\n\n${diff || 'No differences found.'}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get diff: ${error.message}`);
    }
  }

  async getCurrentBranch() {
    try {
      // Try to auto-detect repository if current one fails
      if (!await this.isGitRepository(this.currentRepoPath)) {
        const detectedRepo = await this.autoDetectRepository();
        if (!detectedRepo) {
          throw new Error('No Git repository found. Use auto_detect_repository or set_working_directory first.');
        }
      }

      const branch = await this.git.branch();
      return {
        content: [
          {
            type: 'text',
            text: `Current branch: ${branch.current}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get current branch: ${error.message}`);
    }
  }

  async listGitRepositories(args) {
    const maxDepth = args.maxDepth || 3;
    const basePath = args.basePath || this.currentRepoPath;
    
    try {
      const repos = this.findGitRepositories(basePath, maxDepth);
      
      if (repos.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No Git repositories found in the specified path.',
            },
          ],
        };
      }

      const repoList = repos.map(repo => {
        const isCurrent = repo.path === this.currentRepoPath ? ' (current)' : '';
        return `- ${repo.path}${isCurrent}`;
      }).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Found ${repos.length} Git repository(ies):\n\n${repoList}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list Git repositories: ${error.message}`);
    }
  }

  async switchGitRepository(args) {
    const { repoPath } = args;
    
    try {
      // Check if the path exists and is a Git repository
      if (!fs.existsSync(repoPath)) {
        throw new Error(`Path does not exist: ${repoPath}`);
      }

      const gitPath = path.join(repoPath, '.git');
      if (!fs.existsSync(gitPath)) {
        throw new Error(`Not a Git repository: ${repoPath}`);
      }

      // Update the Git instance to use the new repository
      this.git = simpleGit(repoPath);
      this.currentRepoPath = repoPath;

      // Test the connection by getting the current branch
      const branch = await this.git.branch();

      return {
        content: [
          {
            type: 'text',
            text: `Successfully switched to repository: ${repoPath}\nCurrent branch: ${branch.current}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to switch repository: ${error.message}`);
    }
  }

  async getCurrentRepositoryInfo() {
    try {
      // Try to auto-detect repository if current one fails
      if (!await this.isGitRepository(this.currentRepoPath)) {
        const detectedRepo = await this.autoDetectRepository();
        if (!detectedRepo) {
          throw new Error('No Git repository found. Use auto_detect_repository or set_working_directory first.');
        }
      }

      const branch = await this.git.branch();
      const status = await this.git.status();
      const remotes = await this.git.getRemotes();
      
      const info = [
        `Repository Path: ${this.currentRepoPath}`,
        `Current Branch: ${branch.current}`,
        `Working Directory Clean: ${status.isClean()}`,
        `Remotes: ${remotes.length > 0 ? remotes.map(r => r.name).join(', ') : 'None'}`,
      ];

      if (status.files.length > 0) {
        info.push(`Modified Files: ${status.files.length}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: info.join('\n'),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get repository info: ${error.message}`);
    }
  }

  async setWorkingDirectory(args) {
    const { directory } = args;
    
    try {
      // Check if the directory exists
      if (!fs.existsSync(directory)) {
        throw new Error(`Directory does not exist: ${directory}`);
      }

      // Check if it's a Git repository
      const gitPath = path.join(directory, '.git');
      if (!fs.existsSync(gitPath)) {
        throw new Error(`Not a Git repository: ${directory}`);
      }

      // Update the Git instance to use the new directory
      this.currentRepoPath = directory;
      this.git = simpleGit(directory);

      // Test the connection by getting the current branch
      const branch = await this.git.branch();

      return {
        content: [
          {
            type: 'text',
            text: `Successfully set working directory to: ${directory}\nCurrent branch: ${branch.current}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to set working directory: ${error.message}`);
    }
  }

  async autoDetectRepositoryTool() {
    try {
      const detectedRepo = await this.autoDetectRepository();
      
      if (detectedRepo) {
        const branch = await this.git.branch();
        const status = await this.git.status();
        
        return {
          content: [
            {
              type: 'text',
              text: `✅ Automatically detected Git repository: ${detectedRepo}\nCurrent branch: ${branch.current}\nWorking directory clean: ${status.isClean()}\nModified files: ${status.files.length}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: '❌ No Git repository found in current directory or nearby directories.\nUse set_working_directory to manually specify a repository path.',
            },
          ],
        };
      }
    } catch (error) {
      throw new Error(`Failed to auto-detect repository: ${error.message}`);
    }
  }

  async findAndSwitchRepository(args) {
    try {
      const searchPath = args.searchPath || this.currentRepoPath;
      const maxDepth = args.maxDepth || 5;
      const switchTo = args.switchTo;

      // Find all repositories
      const allRepos = this.findGitRepositories(searchPath, maxDepth);
      
      if (allRepos.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No Git repositories found in: ${searchPath}`,
            },
          ],
        };
      }

      // If switchTo is specified, try to find and switch to it
      if (switchTo) {
        const targetRepo = allRepos.find(repo => 
          repo.path.includes(switchTo) || 
          path.basename(repo.path) === switchTo
        );

        if (targetRepo) {
          this.currentRepoPath = targetRepo.path;
          this.git = simpleGit(targetRepo.path);
          const branch = await this.git.branch();
          const status = await this.git.status();
          
          return {
            content: [
              {
                type: 'text',
                text: `✅ Switched to repository: ${targetRepo.path}\nCurrent branch: ${branch.current}\nWorking directory clean: ${status.isClean()}\nModified files: ${status.files.length}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Repository matching "${switchTo}" not found. Available repositories:\n\n${allRepos.map((repo, index) => `${index + 1}. ${repo.path}`).join('\n')}`,
              },
            ],
          };
        }
      }

      // Just list all found repositories
      const repoList = allRepos.map((repo, index) => {
        const isCurrent = repo.path === this.currentRepoPath ? ' (current)' : '';
        return `${index + 1}. ${repo.path}${isCurrent}`;
      }).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Found ${allRepos.length} Git repository(ies):\n\n${repoList}\n\nTo switch to a specific repository, use:\nfind_and_switch_repository with switchTo: "repository_name_or_path"`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to find and switch repository: ${error.message}`);
    }
  }

  findGitRepositories(basePath, maxDepth, currentDepth = 0) {
    const repos = [];
    
    try {
      if (currentDepth > maxDepth) {
        return repos;
      }

      const items = fs.readdirSync(basePath);
      
      for (const item of items) {
        const itemPath = path.join(basePath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          // Check if this directory is a Git repository
          const gitPath = path.join(itemPath, '.git');
          if (fs.existsSync(gitPath)) {
            repos.push({ path: itemPath });
          } else {
            // Recursively search subdirectories
            const subRepos = this.findGitRepositories(itemPath, maxDepth, currentDepth + 1);
            repos.push(...subRepos);
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
      console.error(`Error reading directory ${basePath}:`, error.message);
    }
    
    return repos;
  }

  async getBranchList() {
    try {
      const branches = await this.git.branch();
      const branchList = branches.all.map(branch => 
        `${branch}${branch === branches.current ? ' (current)' : ''}`
      ).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `Available branches:\n${branchList}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get branch list: ${error.message}`);
    }
  }

  async createPullRequest(args) {
    const {
      title,
      description,
      sourceBranch,
      targetBranch = 'main',
      isDraft = false,
      platform = 'github',
      repoOwner,
      repoName,
      force = false, // Allow duplicate PRs
      checkExisting = true, // Check for existing PRs first
    } = args;

    const currentBranch = await this.git.branch();
    const source = sourceBranch || currentBranch.current;

    // Check for existing PRs if requested
    if (checkExisting && !force) {
      try {
        const existingPRs = await this.getExistingPRs(source, targetBranch, platform, repoOwner, repoName);
        if (existingPRs.length > 0) {
          const prList = existingPRs.map(pr => `- ${pr.title} (${pr.url})`).join('\n');
          return {
            content: [{
              type: 'text',
              text: `⚠️ PR already exists from ${source} to ${targetBranch}:\n\n${prList}\n\n💡 Use force: true to create a new PR anyway, or checkExisting: false to skip this check.`
            }]
          };
        }
      } catch (error) {
        // If we can't check existing PRs, continue anyway
        console.error('Could not check existing PRs:', error.message);
      }
    }

    if (platform === 'github') {
      return await this.createGitHubPR({
        title,
        description,
        sourceBranch: source,
        targetBranch,
        isDraft,
        repoOwner,
        repoName,
      });
    } else if (platform === 'bitbucket') {
      return await this.createBitbucketPR({
        title,
        description,
        sourceBranch: source,
        targetBranch,
        isDraft,
        repoOwner,
        repoName,
      });
    } else {
      throw new Error('Unsupported platform. Use "github" or "bitbucket".');
    }
  }

  async createGitHubPR(params) {
    const { title, description, sourceBranch, targetBranch, isDraft, repoOwner, repoName } = params;
    
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }

    try {
      const response = await axios.post(
        `https://api.github.com/repos/${repoOwner}/${repoName}/pulls`,
        {
          title,
          body: description,
          head: sourceBranch,
          base: targetBranch,
          draft: isDraft,
        },
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: `Pull request created successfully!\nURL: ${response.data.html_url}\nNumber: ${response.data.number}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create GitHub PR: ${error.response?.data?.message || error.message}`);
    }
  }

  async createBitbucketPR(params) {
    const { title, description, sourceBranch, targetBranch, isDraft, repoOwner, repoName } = params;
    
    const token = process.env.BITBUCKET_TOKEN;
    const username = process.env.BITBUCKET_USERNAME;
    
    if (!token) {
      throw new Error('BITBUCKET_TOKEN environment variable is required');
    }
    if (!username) {
      throw new Error('BITBUCKET_USERNAME environment variable is required for Bitbucket');
    }

    try {
      const response = await axios.post(
        `https://api.bitbucket.org/2.0/repositories/${repoOwner}/${repoName}/pullrequests`,
        {
          title,
          description,
          source: {
            branch: {
              name: sourceBranch,
            },
          },
          destination: {
            branch: {
              name: targetBranch,
            },
          },
          close_source_branch: false,
        },
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${username}:${token}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: `Pull request created successfully!\nURL: ${response.data.links.html.href}\nID: ${response.data.id}`,
          },
        ],
      };
         } catch (error) {
       throw new Error(`Failed to create Bitbucket PR: ${error.response?.data?.error?.message || error.message}`);
     }
   }

   async getExistingPRs(sourceBranch, targetBranch, platform, repoOwner, repoName) {
     if (platform === 'github') {
       return await this.getGitHubExistingPRs(sourceBranch, targetBranch, repoOwner, repoName);
     } else if (platform === 'bitbucket') {
       return await this.getBitbucketExistingPRs(sourceBranch, targetBranch, repoOwner, repoName);
     } else {
       throw new Error('Unsupported platform. Use "github" or "bitbucket".');
     }
   }

   async getGitHubExistingPRs(sourceBranch, targetBranch, repoOwner, repoName) {
     const token = process.env.GITHUB_TOKEN;
     if (!token) {
       throw new Error('GITHUB_TOKEN environment variable is required');
     }

     try {
       const response = await axios.get(
         `https://api.github.com/repos/${repoOwner}/${repoName}/pulls`,
         {
           params: {
             state: 'open',
             head: `${repoOwner}:${sourceBranch}`,
             base: targetBranch,
           },
           headers: {
             'Authorization': `token ${token}`,
             'Accept': 'application/vnd.github.v3+json',
           },
         }
       );

       return response.data.map(pr => ({
         id: pr.id,
         number: pr.number,
         title: pr.title,
         url: pr.html_url,
         state: pr.state,
         draft: pr.draft,
       }));
     } catch (error) {
       throw new Error(`Failed to get GitHub existing PRs: ${error.response?.data?.message || error.message}`);
     }
   }

   async getBitbucketExistingPRs(sourceBranch, targetBranch, repoOwner, repoName) {
     const token = process.env.BITBUCKET_TOKEN;
     const username = process.env.BITBUCKET_USERNAME;
     
     if (!token) {
       throw new Error('BITBUCKET_TOKEN environment variable is required');
     }
     if (!username) {
       throw new Error('BITBUCKET_USERNAME environment variable is required for Bitbucket');
     }

     try {
       const response = await axios.get(
         `https://api.bitbucket.org/2.0/repositories/${repoOwner}/${repoName}/pullrequests`,
         {
           params: {
             state: 'OPEN',
             'source.branch.name': sourceBranch,
             'destination.branch.name': targetBranch,
           },
           headers: {
             'Authorization': `Basic ${Buffer.from(`${username}:${token}`).toString('base64')}`,
           },
         }
       );

       return response.data.values.map(pr => ({
         id: pr.id,
         number: pr.id,
         title: pr.title,
         url: pr.links.html.href,
         state: pr.state,
         draft: false, // Bitbucket doesn't have draft PRs in the same way
       }));
     } catch (error) {
       throw new Error(`Failed to get Bitbucket existing PRs: ${error.response?.data?.error?.message || error.message}`);
     }
   }

  async getPullRequestComments(args) {
    const { prNumber, platform = 'github', repoOwner, repoName } = args;

    if (platform === 'github') {
      return await this.getGitHubPRComments(prNumber, repoOwner, repoName);
    } else if (platform === 'bitbucket') {
      return await this.getBitbucketPRComments(prNumber, repoOwner, repoName);
    } else {
      throw new Error('Unsupported platform. Use "github" or "bitbucket".');
    }
  }

  async getGitHubPRComments(prNumber, repoOwner, repoName) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }

    try {
      const response = await axios.get(
        `https://api.github.com/repos/${repoOwner}/${repoName}/issues/${prNumber}/comments`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      const comments = response.data.map(comment => 
        `Comment ID: ${comment.id}\nAuthor: ${comment.user.login}\nCreated: ${comment.created_at}\nBody: ${comment.body}\n---`
      ).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `Comments for PR #${prNumber}:\n\n${comments || 'No comments found.'}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get GitHub PR comments: ${error.response?.data?.message || error.message}`);
    }
  }

  async getBitbucketPRComments(prNumber, repoOwner, repoName) {
    const token = process.env.BITBUCKET_TOKEN;
    const username = process.env.BITBUCKET_USERNAME;
    
    if (!token) {
      throw new Error('BITBUCKET_TOKEN environment variable is required');
    }
    if (!username) {
      throw new Error('BITBUCKET_USERNAME environment variable is required for Bitbucket');
    }

    try {
      const response = await axios.get(
        `https://api.bitbucket.org/2.0/repositories/${repoOwner}/${repoName}/pullrequests/${prNumber}/comments`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${username}:${token}`).toString('base64')}`,
          },
        }
      );

      const comments = response.data.values.map(comment => 
        `Comment ID: ${comment.id}\nAuthor: ${comment.user.display_name}\nCreated: ${comment.created_on}\nBody: ${comment.content.raw}\n---`
      ).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `Comments for PR #${prNumber}:\n\n${comments || 'No comments found.'}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get Bitbucket PR comments: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async replyToComment(args) {
    const { prNumber, commentId, replyText, platform = 'github', repoOwner, repoName } = args;

    if (platform === 'github') {
      return await this.replyToGitHubComment(prNumber, commentId, replyText, repoOwner, repoName);
    } else if (platform === 'bitbucket') {
      return await this.replyToBitbucketComment(prNumber, commentId, replyText, repoOwner, repoName);
    } else {
      throw new Error('Unsupported platform. Use "github" or "bitbucket".');
    }
  }

  async replyToGitHubComment(prNumber, commentId, replyText, repoOwner, repoName) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }

    try {
      const response = await axios.post(
        `https://api.github.com/repos/${repoOwner}/${repoName}/issues/${prNumber}/comments`,
        {
          body: replyText,
          in_reply_to: commentId,
        },
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: `Reply posted successfully!\nComment ID: ${response.data.id}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to reply to GitHub comment: ${error.response?.data?.message || error.message}`);
    }
  }

  async replyToBitbucketComment(prNumber, commentId, replyText, repoOwner, repoName) {
    const token = process.env.BITBUCKET_TOKEN;
    const username = process.env.BITBUCKET_USERNAME;
    
    if (!token) {
      throw new Error('BITBUCKET_TOKEN environment variable is required');
    }
    if (!username) {
      throw new Error('BITBUCKET_USERNAME environment variable is required for Bitbucket');
    }

    try {
      const response = await axios.post(
        `https://api.bitbucket.org/2.0/repositories/${repoOwner}/${repoName}/pullrequests/${prNumber}/comments`,
        {
          content: {
            raw: replyText,
          },
          parent: {
            id: commentId,
          },
        },
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${username}:${token}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: `Reply posted successfully!\nComment ID: ${response.data.id}`,
          },
        ],
      };
         } catch (error) {
       throw new Error(`Failed to reply to Bitbucket comment: ${error.response?.data?.error?.message || error.message}`);
     }
   }

   async getPullRequestDetails(args) {
     const { prNumber, platform = 'github', repoOwner, repoName, includeDiff = true } = args;

     if (platform === 'github') {
       return await this.getGitHubPRDetails(prNumber, repoOwner, repoName, includeDiff);
     } else if (platform === 'bitbucket') {
       return await this.getBitbucketPRDetails(prNumber, repoOwner, repoName, includeDiff);
     } else {
       throw new Error('Unsupported platform. Use "github" or "bitbucket".');
     }
   }

   async getGitHubPRDetails(prNumber, repoOwner, repoName, includeDiff) {
     const token = process.env.GITHUB_TOKEN;
     if (!token) {
       throw new Error('GITHUB_TOKEN environment variable is required');
     }

     try {
       // Get PR details
       const prResponse = await axios.get(
         `https://api.github.com/repos/${repoOwner}/${repoName}/pulls/${prNumber}`,
         {
           headers: {
             'Authorization': `token ${token}`,
             'Accept': 'application/vnd.github.v3+json',
           },
         }
       );

       const pr = prResponse.data;
       let details = [
         `**Pull Request #${prNumber}**`,
         `Title: ${pr.title}`,
         `State: ${pr.state}`,
        `Draft: ${pr.draft ? 'Yes' : 'No'}`,
         `Author: ${pr.user.login}`,
         `Created: ${pr.created_at}`,
         `Updated: ${pr.updated_at}`,
         `Source Branch: ${pr.head.ref}`,
         `Target Branch: ${pr.base.ref}`,
         `Commits: ${pr.commits}`,
         `Changed Files: ${pr.changed_files}`,
         `Additions: ${pr.additions}`,
         `Deletions: ${pr.deletions}`,
         `URL: ${pr.html_url}`,
         '',
         `**Description:**`,
         pr.body || 'No description provided',
       ];

       // Get diff if requested
       if (includeDiff) {
         const diffResponse = await axios.get(
           `https://api.github.com/repos/${repoOwner}/${repoName}/pulls/${prNumber}`,
           {
             headers: {
               'Authorization': `token ${token}`,
               'Accept': 'application/vnd.github.v3.diff',
             },
           }
         );

         details.push('', '**Changes/Diff:**', '```diff', diffResponse.data, '```');
       }

       return {
         content: [
           {
             type: 'text',
             text: details.join('\n'),
           },
         ],
       };
     } catch (error) {
       throw new Error(`Failed to get GitHub PR details: ${error.response?.data?.message || error.message}`);
     }
   }

   async getBitbucketPRDetails(prNumber, repoOwner, repoName, includeDiff) {
     const token = process.env.BITBUCKET_TOKEN;
     const username = process.env.BITBUCKET_USERNAME;
     
     if (!token) {
       throw new Error('BITBUCKET_TOKEN environment variable is required');
     }
     if (!username) {
       throw new Error('BITBUCKET_USERNAME environment variable is required for Bitbucket');
     }

     try {
       // Get PR details
       const prResponse = await axios.get(
         `https://api.bitbucket.org/2.0/repositories/${repoOwner}/${repoName}/pullrequests/${prNumber}`,
         {
           headers: {
             'Authorization': `Basic ${Buffer.from(`${username}:${token}`).toString('base64')}`,
           },
         }
       );

       const pr = prResponse.data;
       let details = [
         `**Pull Request #${prNumber}**`,
         `Title: ${pr.title}`,
         `State: ${pr.state}`,
         `Author: ${pr.author.display_name}`,
         `Created: ${pr.created_on}`,
         `Updated: ${pr.updated_on}`,
         `Source Branch: ${pr.source.branch.name}`,
         `Target Branch: ${pr.destination.branch.name}`,
         `Commits: ${pr.commits?.length || 0}`,
         `Changed Files: ${pr.changes?.values?.length || 0}`,
         `URL: ${pr.links.html.href}`,
         '',
         `**Description:**`,
         pr.description || 'No description provided',
       ];

       // Get diff if requested
       if (includeDiff) {
         const diffResponse = await axios.get(
           `https://api.bitbucket.org/2.0/repositories/${repoOwner}/${repoName}/pullrequests/${prNumber}/diff`,
           {
             headers: {
               'Authorization': `Basic ${Buffer.from(`${username}:${token}`).toString('base64')}`,
             },
           }
         );

         details.push('', '**Changes/Diff:**', '```diff', diffResponse.data, '```');
       }

       return {
         content: [
           {
             type: 'text',
             text: details.join('\n'),
           },
         ],
       };
     } catch (error) {
       throw new Error(`Failed to get Bitbucket PR details: ${error.response?.data?.error?.message || error.message}`);
     }
   }

  // Simple Token Authentication Methods

  async getBitbucketAuthStatus() {
    try {
      if (!this.bitbucketToken || !this.bitbucketUsername) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Not authenticated with Bitbucket.\n\nPlease set the following environment variables:\n- BITBUCKET_TOKEN: Your app password from https://bitbucket.org/account/settings/app-passwords/\n- BITBUCKET_USERNAME: Your Bitbucket username\n\nOnce set, you can use checkout_repository and other Bitbucket operations.`,
            },
          ],
        };
      }

      // Test authentication by making a simple API call
      try {
        const response = await axios.get(
          'https://api.bitbucket.org/2.0/user',
          {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${this.bitbucketUsername}:${this.bitbucketToken}`).toString('base64')}`,
            },
          }
        );
        
        const userInfo = response.data;
        return {
          content: [
            {
              type: 'text',
              text: `✅ Authenticated with Bitbucket\n\nUser: ${userInfo.display_name} (@${userInfo.username})\nEmail: ${userInfo.email || 'Not provided'}\nAccount Type: ${userInfo.account_status}\n\nToken Status: Valid`,
            },
          ],
        };
      } catch (apiError) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Authentication failed: ${apiError.response?.data?.error?.message || apiError.message}\n\nPlease check your BITBUCKET_TOKEN and BITBUCKET_USERNAME environment variables.`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `⚠️ Authentication status check failed: ${error.message}`,
          },
        ],
      };
    }
  }

  async checkoutRepositoryAPI(args) {
    const { repositoryUrl, targetDirectory, branch = 'main' } = args;
    
    try {
      // Check if credentials are available
      if (!this.bitbucketToken || !this.bitbucketUsername) {
        throw new Error('BITBUCKET_TOKEN and BITBUCKET_USERNAME environment variables are required for repository checkout.');
      }
      
      // Use token-based authentication for git operations
      return await this.checkoutRepositoryWithToken(args);
    } catch (error) {
        return {
          content: [
            {
              type: 'text',
            text: `❌ Failed to checkout repository: ${error.message}`,
            },
          ],
        };
    }
  }

  /**
   * Checkout repository using Bitbucket token authentication
   * Uses BITBUCKET_TOKEN and BITBUCKET_USERNAME environment variables
   */
  async checkoutRepositoryWithToken(args) {
    const { repositoryUrl, targetDirectory, branch = 'main' } = args;
    
    try {
      // Determine target directory
      let targetDir = targetDirectory;
      if (!targetDir) {
        // Extract repository name from URL
        const repoName = repositoryUrl.split('/').pop().replace('.git', '');
        targetDir = path.join(process.cwd(), repoName);
      } else {
        // Handle both absolute and relative paths
      if (!path.isAbsolute(targetDir)) {
        targetDir = path.join(process.cwd(), targetDir);
        }
      }
      
      // Validate target directory
      if (!targetDir || targetDir.trim() === '') {
        throw new Error('Invalid target directory. Please specify a valid targetDirectory.');
      }

      // Check if directory already exists
      if (fs.existsSync(targetDir)) {
        throw new Error(`Directory ${targetDir} already exists. Please specify a different targetDirectory or remove the existing directory.`);
      }

      console.log(`🔐 Cloning repository with token authentication...`);
      console.log(`📁 Target: ${targetDir}`);
      console.log(`🌿 Branch: ${branch}`);
      
      // Prepare authenticated URL
      let authenticatedUrl = repositoryUrl;
      if (repositoryUrl.includes('bitbucket.org')) {
        // URL encode credentials to handle special characters
        const encodedToken = encodeURIComponent(this.bitbucketToken);
        const encodedUsername = encodeURIComponent(this.bitbucketUsername);
        
        if (repositoryUrl.startsWith('https://')) {
          authenticatedUrl = repositoryUrl.replace('https://', `https://${encodedUsername}:${encodedToken}@`);
        }
      }
      
      const git = simpleGit({
        binary: 'git',
        maxConcurrentProcesses: 1,
      });

      // Clone options
      const cloneOptions = [];
      if (branch && branch !== 'main' && branch !== 'master') {
        cloneOptions.push('--branch', branch);
      }

      // Clone the repository with token authentication
      console.log(`🚀 Starting clone operation...`);
      await git.clone(authenticatedUrl, targetDir, cloneOptions);

      // Switch to the cloned repository
      this.currentRepoPath = targetDir;
      this.git = simpleGit(targetDir);

      // Checkout specific branch if not already done during clone
      if (branch && branch !== 'main' && branch !== 'master') {
        try {
          await this.git.checkout(branch);
        } catch (branchError) {
          console.warn(`Warning: Could not checkout branch '${branch}': ${branchError.message}`);
          // Try to fetch the branch first
          try {
            await this.git.fetch(['origin', branch]);
            await this.git.checkout(['-b', branch, `origin/${branch}`]);
          } catch (fetchError) {
            console.warn(`Warning: Could not fetch and checkout branch '${branch}': ${fetchError.message}`);
          }
        }
      }

      // Verify the clone was successful
      const status = await this.git.status();
      const currentBranch = await this.git.branch();

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully cloned repository using token authentication!\n\n📁 Path: ${targetDir}\n🌿 Branch: ${currentBranch.current}\n📊 Status: ${status.isClean() ? 'Clean' : `${status.files.length} modified files`}\n🔗 Repository: ${repositoryUrl}\n\n🎉 Repository is ready for use!\n\nUse switch_git_repository with repoPath: "${targetDir}" to switch to this repository.`,
          },
        ],
      };
    } catch (error) {
      // Enhanced error handling for common SSO issues
      let errorMessage = error.message;
      
      if (error.message.includes('Authentication failed')) {
        errorMessage = `🔐 Token Authentication failed. Please ensure:\n1. BITBUCKET_TOKEN and BITBUCKET_USERNAME are set correctly\n2. Your token has repository read access\n3. You have access to the repository\n\nOriginal error: ${error.message}`;
      } else if (error.message.includes('repository not found')) {
        errorMessage = `📂 Repository not found. Please check:\n1. Repository URL is correct\n2. Repository exists\n3. You have read access to the repository\n\nURL: ${repositoryUrl}`;
      } else if (error.message.includes('branch')) {
        errorMessage = `🌿 Branch issue. Please check:\n1. Branch '${branch}' exists\n2. You have access to the branch\n\nOriginal error: ${error.message}`;
      }

      throw new Error(errorMessage);
    }
  }

  // Legacy git-based checkout method (renamed for backward compatibility)
  async checkoutRepositoryLegacy(args) {
    const { repositoryUrl, targetDirectory, branch, depth } = args;
    
    try {
      // Determine target directory
      let targetDir = targetDirectory;
      if (!targetDir) {
        // Extract repository name from URL
        const repoName = repositoryUrl.split('/').pop().replace('.git', '');
        targetDir = path.join(process.cwd(), repoName);
      } else {
        // If targetDirectory is provided, use it as-is (could be absolute or relative)
        if (path.isAbsolute(targetDir)) {
          // It's already an absolute path, use it directly
          targetDir = targetDir;
        } else {
          // It's a relative path, make it relative to current working directory
          targetDir = path.join(process.cwd(), targetDir);
        }
      }
      
      // Validate target directory
      if (!targetDir || targetDir.trim() === '') {
        throw new Error('Invalid target directory. Please specify a valid targetDirectory.');
      }

      // Check if directory already exists
      if (fs.existsSync(targetDir)) {
        throw new Error(`Directory ${targetDir} already exists. Please specify a different targetDirectory or remove the existing directory.`);
      }

      // Handle authentication for private repositories
      let authenticatedUrl = repositoryUrl;
      const isBitbucket = repositoryUrl.includes('bitbucket.org');
      const isGitHub = repositoryUrl.includes('github.com');
      
             if (isBitbucket) {
         const token = process.env.BITBUCKET_TOKEN;
         const username = process.env.BITBUCKET_USERNAME;
         if (token && username) {
           // Convert HTTPS URL to include credentials
           if (repositoryUrl.startsWith('https://')) {
             // URL encode the token to handle special characters like colons
             const encodedToken = encodeURIComponent(token);
             const encodedUsername = encodeURIComponent(username);
             authenticatedUrl = repositoryUrl.replace('https://', `https://${encodedUsername}:${encodedToken}@`);
           }
         }
       } else if (isGitHub) {
         const token = process.env.GITHUB_TOKEN;
         if (token) {
           // For GitHub, use a valid username format with token
           if (repositoryUrl.startsWith('https://')) {
             // URL encode the token to handle special characters
             const encodedToken = encodeURIComponent(token);
             authenticatedUrl = repositoryUrl.replace('https://', `https://git:${encodedToken}@`);
           }
         }
       }

      // Clone options
      const cloneOptions = {
        '--depth': depth || undefined,
        '--branch': branch || undefined,
      };

      // Remove undefined options
      Object.keys(cloneOptions).forEach(key => {
        if (cloneOptions[key] === undefined) {
          delete cloneOptions[key];
        }
      });

      // Clone the repository with authentication
      try {
        await this.git.clone(authenticatedUrl, targetDir, cloneOptions);
      } catch (cloneError) {
        console.error('Clone error details:', {
          originalUrl: repositoryUrl,
          authenticatedUrl: authenticatedUrl.substring(0, 50) + '...',
          targetDir,
          cloneOptions,
          error: cloneError.message
        });
        throw cloneError;
      }

      // Switch to the cloned repository
      this.currentRepoPath = targetDir;
      this.git = simpleGit(targetDir);

      // Checkout specific branch if requested
      if (branch) {
        await this.git.checkout(branch);
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully cloned repository to: ${targetDir}\n\nRepository URL: ${repositoryUrl}\nBranch: ${branch || 'default'}\nWorking Directory: ${targetDir}\n\nUse switch_git_repository with repoPath: "${targetDir}" to switch to this repository.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to checkout repository: ${error.message}`);
    }
  }

  async getStoryCodeChanges(args) {
    const { storyKeys, includeMergedPRs = true, includeCommits = true, maxResults = 20, timeRange } = args;
    
    try {
      if (!await this.isGitRepository(this.currentRepoPath)) {
        throw new Error('No Git repository found. Use checkout_repository or switch_git_repository first.');
      }

      let allChanges = [];

      // Get commits related to story keys
      if (includeCommits) {
        for (const storyKey of storyKeys) {
          const commits = await this.getCommitsForStory(storyKey, timeRange);
          allChanges.push(...commits);
        }
      }

      // Get merged PRs related to story keys
      if (includeMergedPRs) {
        for (const storyKey of storyKeys) {
          const prs = await this.getMergedPRsForStory(storyKey, timeRange);
          allChanges.push(...prs);
        }
      }

      // Sort by date and limit results
      allChanges.sort((a, b) => new Date(b.date) - new Date(a.date));
      allChanges = allChanges.slice(0, maxResults);

      return {
        content: [
          {
            type: 'text',
            text: this.formatStoryCodeChanges(allChanges, storyKeys),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get story code changes: ${error.message}`);
    }
  }

  async analyzeMergedPRs(args) {
    const { storyKey, includeFiles = true, includeStats = true, maxPRs = 10 } = args;
    
    try {
      if (!await this.isGitRepository(this.currentRepoPath)) {
        throw new Error('No Git repository found. Use checkout_repository or switch_git_repository first.');
      }

      const prs = await this.getMergedPRsForStory(storyKey, null, maxPRs);
      
      let analysis = `📊 **Merged PR Analysis for ${storyKey}**\n\n`;
      analysis += `Found ${prs.length} merged pull request(s):\n\n`;

      for (const pr of prs) {
        analysis += `**PR #${pr.number}** - ${pr.title}\n`;
        analysis += `- Author: ${pr.author}\n`;
        analysis += `- Merged: ${pr.mergedAt}\n`;
        analysis += `- Files Changed: ${pr.filesChanged}\n`;
        
        if (includeStats) {
          analysis += `- Lines Added: ${pr.linesAdded}\n`;
          analysis += `- Lines Removed: ${pr.linesRemoved}\n`;
        }
        
        if (includeFiles && pr.files) {
          analysis += `- Changed Files:\n`;
          pr.files.forEach(file => {
            analysis += `  - ${file.name} (${file.status})\n`;
          });
        }
        
        analysis += `- URL: ${pr.url}\n\n`;
      }

      // Summary statistics
      if (prs.length > 0) {
        const totalFiles = prs.reduce((sum, pr) => sum + pr.filesChanged, 0);
        const totalLinesAdded = prs.reduce((sum, pr) => sum + pr.linesAdded, 0);
        const totalLinesRemoved = prs.reduce((sum, pr) => sum + pr.linesRemoved, 0);
        
        analysis += `**Summary Statistics:**\n`;
        analysis += `- Total PRs: ${prs.length}\n`;
        analysis += `- Total Files Changed: ${totalFiles}\n`;
        analysis += `- Total Lines Added: ${totalLinesAdded}\n`;
        analysis += `- Total Lines Removed: ${totalLinesRemoved}\n`;
        analysis += `- Average Files per PR: ${(totalFiles / prs.length).toFixed(1)}\n`;
        analysis += `- Average Lines per PR: ${((totalLinesAdded + totalLinesRemoved) / prs.length).toFixed(1)}\n`;
      }

      return {
        content: [
          {
            type: 'text',
            text: analysis,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to analyze merged PRs: ${error.message}`);
    }
  }

  async getLatestCommits(args) {
    const { storyKey, branch, maxCommits = 20, includeFiles = true, timeRange } = args;
    
    try {
      if (!await this.isGitRepository(this.currentRepoPath)) {
        throw new Error('No Git repository found. Use checkout_repository or switch_git_repository first.');
      }

      const commits = await this.getCommitsForStory(storyKey, timeRange, maxCommits, branch);
      
      let result = `📝 **Latest Commits for ${storyKey}**\n\n`;
      result += `Found ${commits.length} commit(s):\n\n`;

      for (const commit of commits) {
        result += `**${commit.hash.substring(0, 8)}** - ${commit.message}\n`;
        result += `- Author: ${commit.author}\n`;
        result += `- Date: ${commit.date}\n`;
        result += `- Files Changed: ${commit.filesChanged}\n`;
        
        if (includeFiles && commit.files) {
          result += `- Changed Files:\n`;
          commit.files.forEach(file => {
            result += `  - ${file.name} (${file.status})\n`;
          });
        }
        
        result += `\n`;
      }

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get latest commits: ${error.message}`);
    }
  }

  async analyzeCodeComplexity(args) {
    const { storyKeys, includeMetrics = true, includeFileTypes } = args;
    
    try {
      if (!await this.isGitRepository(this.currentRepoPath)) {
        throw new Error('No Git repository found. Use checkout_repository or switch_git_repository first.');
      }

      let analysis = `🔍 **Code Complexity Analysis**\n\n`;
      analysis += `Analyzing code changes for stories: ${storyKeys.join(', ')}\n\n`;

      for (const storyKey of storyKeys) {
        const commits = await this.getCommitsForStory(storyKey);
        const prs = await this.getMergedPRsForStory(storyKey);
        
        analysis += `**${storyKey}**\n`;
        analysis += `- Total Commits: ${commits.length}\n`;
        analysis += `- Total PRs: ${prs.length}\n`;
        
        if (includeMetrics) {
          const fileTypes = this.analyzeFileTypes(commits, prs);
          const complexityMetrics = this.calculateComplexityMetrics(commits, prs);
          
          analysis += `- File Types Changed:\n`;
          Object.entries(fileTypes).forEach(([type, count]) => {
            analysis += `  - ${type}: ${count} files\n`;
          });
          
          analysis += `- Complexity Metrics:\n`;
          analysis += `  - Total Lines Changed: ${complexityMetrics.totalLines}\n`;
          analysis += `  - Average Lines per Change: ${complexityMetrics.avgLinesPerChange.toFixed(1)}\n`;
          analysis += `  - Most Changed File Type: ${complexityMetrics.mostChangedType}\n`;
        }
        
        analysis += `\n`;
      }

      return {
        content: [
          {
            type: 'text',
            text: analysis,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to analyze code complexity: ${error.message}`);
    }
  }

  // Helper methods for story-based analysis

  async analyzeDeveloperPerformance(args) {
    const { timeRange = '6m', includeMetrics = true, minStories = 3, storyKeys = [] } = args;
    
    try {
      if (!await this.isGitRepository(this.currentRepoPath)) {
        throw new Error('No Git repository found. Use checkout_repository or switch_git_repository first.');
      }

      let analysis = `👥 **Developer Performance Analysis**\n\n`;
      analysis += `Analyzing performance over: ${timeRange}\n\n`;

      // Get all commits in the time range
      const logOptions = {
        '--since': timeRange,
        '--pretty': 'format:%H|%an|%ad|%s',
        '--date': 'short'
      };

      const log = await this.git.log(logOptions);
      const commits = log.all.map(commit => {
        const [hash, author, date, message] = commit.hash.split('|');
        return { hash, author, date, message };
      });

      // Group commits by author
      const authorStats = {};
      commits.forEach(commit => {
        if (!authorStats[commit.author]) {
          authorStats[commit.author] = {
            commits: 0,
            stories: new Set(),
            totalLines: 0,
            avgCommitSize: 0
          };
        }
        authorStats[commit.author].commits++;
        
        // Extract story keys from commit messages
        const storyMatch = commit.message.match(/([A-Z]+-\d+)/g);
        if (storyMatch) {
          storyMatch.forEach(story => authorStats[commit.author].stories.add(story));
        }
      });

      // Calculate performance metrics
      const performanceData = Object.entries(authorStats)
        .filter(([, stats]) => stats.stories.size >= minStories)
        .map(([author, stats]) => ({
          author,
          commits: stats.commits,
          stories: stats.stories.size,
          avgCommitsPerStory: stats.commits / stats.stories.size,
          efficiency: stats.commits / stats.stories.size // Lower is better
        }))
        .sort((a, b) => a.efficiency - b.efficiency);

      analysis += `**Top Performers (by efficiency):**\n`;
      performanceData.slice(0, 5).forEach((dev, index) => {
        analysis += `${index + 1}. **${dev.author}**\n`;
        analysis += `   - Stories: ${dev.stories}\n`;
        analysis += `   - Commits: ${dev.commits}\n`;
        analysis += `   - Avg Commits/Story: ${dev.avgCommitsPerStory.toFixed(1)}\n`;
        analysis += `   - Efficiency Score: ${dev.efficiency.toFixed(2)}\n\n`;
      });

      if (includeMetrics) {
        analysis += `**Detailed Metrics:**\n`;
        analysis += `- Total Developers Analyzed: ${performanceData.length}\n`;
        analysis += `- Total Commits: ${commits.length}\n`;
        analysis += `- Average Stories per Developer: ${(performanceData.reduce((sum, dev) => sum + dev.stories, 0) / performanceData.length).toFixed(1)}\n\n`;
      }

      return {
        content: [
          {
            type: 'text',
            text: analysis,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to analyze developer performance: ${error.message}`);
    }
  }

  async getStoryComplexityStats(args) {
    const { storyKeys, includeHistorical = true, includeFileBreakdown = true, complexityThreshold = 10 } = args;
    
    try {
      if (!await this.isGitRepository(this.currentRepoPath)) {
        throw new Error('No Git repository found. Use checkout_repository or switch_git_repository first.');
      }

      let stats = `📊 **Story Complexity Statistics**\n\n`;
      stats += `Analyzing complexity for stories: ${storyKeys.join(', ')}\n\n`;

      for (const storyKey of storyKeys) {
        const commits = await this.getCommitsForStory(storyKey);
        
        stats += `**${storyKey}**\n`;
        stats += `- Total Commits: ${commits.length}\n`;
        
        // Calculate complexity metrics
        let totalLines = 0;
        let totalFiles = 0;
        const fileTypes = {};
        const fileComplexity = {};
        
        commits.forEach(commit => {
          commit.files.forEach(file => {
            totalLines += file.additions + file.deletions;
            totalFiles++;
            
            const ext = path.extname(file.name).toLowerCase();
            const type = ext || 'no-extension';
            fileTypes[type] = (fileTypes[type] || 0) + 1;
            
            if (!fileComplexity[file.name]) {
              fileComplexity[file.name] = 0;
            }
            fileComplexity[file.name] += file.additions + file.deletions;
          });
        });

        stats += `- Total Lines Changed: ${totalLines}\n`;
        stats += `- Total Files Changed: ${totalFiles}\n`;
        stats += `- Average Lines per File: ${totalFiles > 0 ? (totalLines / totalFiles).toFixed(1) : 0}\n`;
        
        if (includeFileBreakdown) {
          stats += `- File Type Breakdown:\n`;
          Object.entries(fileTypes)
            .sort(([,a], [,b]) => b - a)
            .forEach(([type, count]) => {
              stats += `  - ${type}: ${count} files\n`;
            });
          
          // Highlight high complexity files
          const highComplexityFiles = Object.entries(fileComplexity)
            .filter(([, complexity]) => complexity > complexityThreshold)
            .sort(([,a], [,b]) => b - a);
          
          if (highComplexityFiles.length > 0) {
            stats += `- High Complexity Files (>${complexityThreshold} lines):\n`;
            highComplexityFiles.slice(0, 5).forEach(([file, complexity]) => {
              stats += `  - ${file}: ${complexity} lines\n`;
            });
          }
        }
        
        stats += `\n`;
      }

      return {
        content: [
          {
            type: 'text',
            text: stats,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get story complexity stats: ${error.message}`);
    }
  }

  async recommendDevelopersForStory(args) {
    const { storyDescription, storyType, requiredSkills = [], timeRange = '6m', maxRecommendations = 5 } = args;
    
    try {
      if (!await this.isGitRepository(this.currentRepoPath)) {
        throw new Error('No Git repository found. Use checkout_repository or switch_git_repository first.');
      }

      let recommendations = `🎯 **Developer Recommendations for Story**\n\n`;
      recommendations += `**Story:** ${storyDescription}\n`;
      recommendations += `**Type:** ${storyType || 'Not specified'}\n`;
      if (requiredSkills.length > 0) {
        recommendations += `**Required Skills:** ${requiredSkills.join(', ')}\n`;
      }
      recommendations += `\n`;

      // Get developer performance data
      const performanceArgs = { timeRange, includeMetrics: false, minStories: 2 };
      const performanceResult = await this.analyzeDeveloperPerformance(performanceArgs);
      const performanceText = performanceResult.content[0].text;
      
      // Extract developer data from performance analysis
      const devMatches = performanceText.match(/(\d+)\. \*\*([^*]+)\*\*/g);
      const developers = [];
      
      if (devMatches) {
        devMatches.forEach(match => {
          const nameMatch = match.match(/\*\*([^*]+)\*\*/);
          if (nameMatch) {
            developers.push(nameMatch[1].trim());
          }
        });
      }

      // Simple skill matching (in a real implementation, you'd have a skills database)
      const skillKeywords = {
        'frontend': ['javascript', 'typescript', 'react', 'vue', 'angular', 'html', 'css'],
        'backend': ['java', 'python', 'c#', 'node', 'php', 'database', 'api'],
        'devops': ['docker', 'kubernetes', 'aws', 'azure', 'ci/cd', 'deployment'],
        'mobile': ['ios', 'android', 'react native', 'flutter', 'swift', 'kotlin']
      };

      const storyKeywords = storyDescription.toLowerCase().split(' ');
      const matchedSkills = [];
      
      Object.entries(skillKeywords).forEach(([skill, keywords]) => {
        if (keywords.some(keyword => storyKeywords.includes(keyword))) {
          matchedSkills.push(skill);
        }
      });

      recommendations += `**Matched Skills:** ${matchedSkills.length > 0 ? matchedSkills.join(', ') : 'None detected'}\n\n`;
      recommendations += `**Recommended Developers:**\n`;
      
      developers.slice(0, maxRecommendations).forEach((dev, index) => {
        recommendations += `${index + 1}. **${dev}**\n`;
        recommendations += `   - High performance in recent ${timeRange}\n`;
        if (matchedSkills.length > 0) {
          recommendations += `   - Consider for ${matchedSkills.join(', ')} work\n`;
        }
        recommendations += `\n`;
      });

      if (developers.length === 0) {
        recommendations += `No developers found with sufficient recent activity.\n`;
        recommendations += `Consider expanding the time range or checking team availability.\n`;
      }

      return {
        content: [
          {
            type: 'text',
            text: recommendations,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to recommend developers: ${error.message}`);
    }
  }

  async getCommitsForStory(storyKey, timeRange = null, maxCommits = 20, branch = null) {
    try {
      // Build log options
      const logOptions = {
        '--grep': storyKey,
        '--max-count': maxCommits,
      };

      if (timeRange) {
        logOptions['--since'] = timeRange;
      }

      // Note: Branch parameter is not supported in this version
      // The log will search across all branches

      const log = await this.git.log(logOptions);
      
      return log.all.map(commit => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        date: commit.date,
        filesChanged: commit.diff?.files?.length || 0,
        files: commit.diff?.files?.map(file => ({
          name: file.file,
          status: file.changes > 0 ? 'modified' : 'deleted',
          additions: file.insertions || 0,
          deletions: file.deletions || 0,
        })) || [],
      }));
    } catch (error) {
      console.warn(`Failed to get commits for ${storyKey}:`, error.message);
      return [];
    }
  }

  async getMergedPRsForStory(storyKey, timeRange = null, maxPRs = 10) {
    // This would typically integrate with GitHub/Bitbucket APIs
    // For now, we'll return a placeholder implementation
    return [];
  }

  formatStoryCodeChanges(changes, storyKeys) {
    let result = `📋 **Code Changes for Stories: ${storyKeys.join(', ')}**\n\n`;
    result += `Found ${changes.length} change(s):\n\n`;

    changes.forEach((change, index) => {
      result += `${index + 1}. **${change.type}** - ${change.title}\n`;
      result += `   - Date: ${change.date}\n`;
      result += `   - Author: ${change.author}\n`;
      result += `   - Files Changed: ${change.filesChanged}\n`;
      if (change.url) {
        result += `   - URL: ${change.url}\n`;
      }
      result += `\n`;
    });

    return result;
  }

  analyzeFileTypes(commits, prs) {
    const fileTypes = {};
    
    // Analyze commits
    commits.forEach(commit => {
      commit.files.forEach(file => {
        const ext = path.extname(file.name).toLowerCase();
        const type = ext || 'no-extension';
        fileTypes[type] = (fileTypes[type] || 0) + 1;
      });
    });

    // Analyze PRs
    prs.forEach(pr => {
      pr.files.forEach(file => {
        const ext = path.extname(file.name).toLowerCase();
        const type = ext || 'no-extension';
        fileTypes[type] = (fileTypes[type] || 0) + 1;
      });
    });

    return fileTypes;
  }

  calculateComplexityMetrics(commits, prs) {
    let totalLines = 0;
    let totalChanges = commits.length + prs.length;
    
    commits.forEach(commit => {
      commit.files.forEach(file => {
        totalLines += file.additions + file.deletions;
      });
    });

    prs.forEach(pr => {
      totalLines += pr.linesAdded + pr.linesRemoved;
    });

    const fileTypes = this.analyzeFileTypes(commits, prs);
    const mostChangedType = Object.entries(fileTypes)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';

    return {
      totalLines,
      avgLinesPerChange: totalChanges > 0 ? totalLines / totalChanges : 0,
      mostChangedType,
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Git MCP Server is running...');
  }
}

const server = new GitMCPServer();

// Export for testing
export { GitMCPServer };

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith('server.js')) {
  server.run().catch(console.error);
} 