import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Base64 } from 'js-base64';
import simpleGit from 'simple-git';

export class BitbucketAPI {
  constructor(oauthAuth) {
    this.oauthAuth = oauthAuth;
    this.baseUrl = 'https://api.bitbucket.org/2.0';
  }

  /**
   * Make authenticated API request
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request data
   * @returns {Promise<object>} API response
   */
  async makeRequest(method, endpoint, data = null) {
    const token = await this.oauthAuth.authenticate();
    
    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    };

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token might be expired, try to refresh
        try {
          await this.oauthAuth.refreshAccessToken();
          config.headers['Authorization'] = `Bearer ${this.oauthAuth.getAccessToken()}`;
          const response = await axios(config);
          return response.data;
        } catch (refreshError) {
          throw new Error(`Authentication failed: ${error.response?.data?.error?.message || error.message}`);
        }
      }
      throw new Error(`API request failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get repository information
   * @param {string} workspace - Workspace name
   * @param {string} repoSlug - Repository slug
   * @returns {Promise<object>} Repository information
   */
  async getRepository(workspace, repoSlug) {
    return await this.makeRequest('GET', `/repositories/${workspace}/${repoSlug}`);
  }

  /**
   * Get repository branches
   * @param {string} workspace - Workspace name
   * @param {string} repoSlug - Repository slug
   * @returns {Promise<object>} Branches list
   */
  async getBranches(workspace, repoSlug) {
    return await this.makeRequest('GET', `/repositories/${workspace}/${repoSlug}/refs/branches`);
  }

  /**
   * Get specific branch information
   * @param {string} workspace - Workspace name
   * @param {string} repoSlug - Repository slug
   * @param {string} branchName - Branch name
   * @returns {Promise<object>} Branch information
   */
  async getBranch(workspace, repoSlug, branchName) {
    return await this.makeRequest('GET', `/repositories/${workspace}/${repoSlug}/refs/branches/${encodeURIComponent(branchName)}`);
  }

  /**
   * Download repository as archive and extract to target directory
   * @param {string} workspace - Workspace name
   * @param {string} repoSlug - Repository slug
   * @param {string} targetDirectory - Target directory path
   * @param {string} branch - Branch name (optional)
   * @returns {Promise<string>} Success message
   */
  async checkoutRepository(workspace, repoSlug, targetDirectory, branch = 'main') {
    try {
      // Check if target directory exists
      if (fs.existsSync(targetDirectory)) {
        throw new Error(`Directory ${targetDirectory} already exists. Please specify a different directory or remove the existing one.`);
      }

      console.log(`Downloading repository ${workspace}/${repoSlug} (branch: ${branch})...`);

      // Get repository archive
      const archiveUrl = `/repositories/${workspace}/${repoSlug}/downloads/${encodeURIComponent(branch)}.zip`;
      const token = await this.oauthAuth.authenticate();
      
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}${archiveUrl}`,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: 'stream',
      });

      // Create target directory
      fs.mkdirSync(targetDirectory, { recursive: true });

      // Download and extract archive
      const archivePath = path.join(targetDirectory, 'temp-archive.zip');
      const writer = fs.createWriteStream(archivePath);
      
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Extract archive using native tools or third-party library
      await this.extractArchive(archivePath, targetDirectory);

      // Clean up archive file
      fs.unlinkSync(archivePath);

      // Initialize git repository to maintain git functionality
      await this.initializeGitRepository(targetDirectory, workspace, repoSlug, branch);

      return `✅ Successfully checked out repository to: ${targetDirectory}`;
    } catch (error) {
      // Clean up on error
      if (fs.existsSync(targetDirectory)) {
        fs.rmSync(targetDirectory, { recursive: true, force: true });
      }
      throw new Error(`Failed to checkout repository: ${error.message}`);
    }
  }

  /**
   * Extract archive file
   * @param {string} archivePath - Path to archive file
   * @param {string} targetDirectory - Target extraction directory
   */
  async extractArchive(archivePath, targetDirectory) {
    const { execSync } = await import('child_process');
    
    try {
      // Try PowerShell Expand-Archive first (Windows)
      execSync(`powershell.exe -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${targetDirectory}' -Force"`, 
        { stdio: 'inherit' });
    } catch (error) {
      try {
        // Fallback to 7-zip if available
        execSync(`7z x "${archivePath}" -o"${targetDirectory}" -y`, { stdio: 'inherit' });
      } catch (error2) {
        try {
          // Fallback to unzip (Linux/Mac)
          execSync(`unzip -q "${archivePath}" -d "${targetDirectory}"`, { stdio: 'inherit' });
        } catch (error3) {
          throw new Error('No suitable archive extraction tool found. Please install 7-zip or ensure PowerShell is available.');
        }
      }
    }

    // Move files from subdirectory if needed (Bitbucket creates a subdirectory)
    const extractedContents = fs.readdirSync(targetDirectory);
    const subDirs = extractedContents.filter(item => {
      const itemPath = path.join(targetDirectory, item);
      return fs.statSync(itemPath).isDirectory() && item !== '.git';
    });

    if (subDirs.length === 1) {
      const subDirPath = path.join(targetDirectory, subDirs[0]);
      const subDirContents = fs.readdirSync(subDirPath);
      
      // Move all contents from subdirectory to target directory
      for (const item of subDirContents) {
        const sourcePath = path.join(subDirPath, item);
        const destPath = path.join(targetDirectory, item);
        fs.renameSync(sourcePath, destPath);
      }
      
      // Remove empty subdirectory
      fs.rmdirSync(subDirPath);
    }
  }

  /**
   * Initialize git repository to maintain git functionality
   * @param {string} targetDirectory - Target directory
   * @param {string} workspace - Workspace name
   * @param {string} repoSlug - Repository slug
   * @param {string} branch - Branch name
   */
  async initializeGitRepository(targetDirectory, workspace, repoSlug, branch) {
    try {
      const git = simpleGit(targetDirectory);
      
      // Initialize git repository
      await git.init();
      
      // Add remote origin
      const remoteUrl = `https://bitbucket.org/${workspace}/${repoSlug}.git`;
      await git.addRemote('origin', remoteUrl);
      
      // Add all files
      await git.add('.');
      
      // Create initial commit
      await git.commit(`Initial commit from API download (${branch})`);
      
      // Create and checkout branch
      if (branch !== 'main' && branch !== 'master') {
        await git.checkoutLocalBranch(branch);
      }
      
      console.log(`Initialized git repository with remote: ${remoteUrl}`);
    } catch (error) {
      console.warn(`Warning: Failed to initialize git repository: ${error.message}`);
      console.warn('Repository was downloaded successfully but git functionality may be limited.');
    }
  }

  /**
   * Get commits for a repository
   * @param {string} workspace - Workspace name
   * @param {string} repoSlug - Repository slug
   * @param {string} branch - Branch name (optional)
   * @param {number} limit - Number of commits to retrieve
   * @returns {Promise<object>} Commits list
   */
  async getCommits(workspace, repoSlug, branch = null, limit = 50) {
    let endpoint = `/repositories/${workspace}/${repoSlug}/commits`;
    if (branch) {
      endpoint += `/${encodeURIComponent(branch)}`;
    }
    endpoint += `?pagelen=${limit}`;
    
    return await this.makeRequest('GET', endpoint);
  }

  /**
   * Get pull requests for a repository
   * @param {string} workspace - Workspace name
   * @param {string} repoSlug - Repository slug
   * @param {string} state - Pull request state (OPEN, MERGED, DECLINED)
   * @returns {Promise<object>} Pull requests list
   */
  async getPullRequests(workspace, repoSlug, state = 'OPEN') {
    return await this.makeRequest('GET', `/repositories/${workspace}/${repoSlug}/pullrequests?state=${state}`);
  }

  /**
   * Create a pull request
   * @param {string} workspace - Workspace name
   * @param {string} repoSlug - Repository slug
   * @param {object} pullRequestData - Pull request data
   * @returns {Promise<object>} Created pull request
   */
  async createPullRequest(workspace, repoSlug, pullRequestData) {
    return await this.makeRequest('POST', `/repositories/${workspace}/${repoSlug}/pullrequests`, pullRequestData);
  }

  /**
   * Get pull request details
   * @param {string} workspace - Workspace name
   * @param {string} repoSlug - Repository slug
   * @param {string} pullRequestId - Pull request ID
   * @returns {Promise<object>} Pull request details
   */
  async getPullRequest(workspace, repoSlug, pullRequestId) {
    return await this.makeRequest('GET', `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}`);
  }

  /**
   * Get pull request comments
   * @param {string} workspace - Workspace name
   * @param {string} repoSlug - Repository slug
   * @param {string} pullRequestId - Pull request ID
   * @returns {Promise<object>} Pull request comments
   */
  async getPullRequestComments(workspace, repoSlug, pullRequestId) {
    return await this.makeRequest('GET', `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/comments`);
  }

  /**
   * Add comment to pull request
   * @param {string} workspace - Workspace name
   * @param {string} repoSlug - Repository slug
   * @param {string} pullRequestId - Pull request ID
   * @param {string} content - Comment content
   * @returns {Promise<object>} Created comment
   */
  async addPullRequestComment(workspace, repoSlug, pullRequestId, content) {
    return await this.makeRequest('POST', `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequestId}/comments`, {
      content: { raw: content }
    });
  }

  /**
   * Parse repository URL to extract workspace and repo slug
   * @param {string} repositoryUrl - Repository URL
   * @returns {object} Parsed URL components
   */
  static parseRepositoryUrl(repositoryUrl) {
    const match = repositoryUrl.match(/bitbucket\.org\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/|$)/);
    if (!match) {
      throw new Error('Invalid Bitbucket repository URL format');
    }
    
    return {
      workspace: match[1],
      repoSlug: match[2],
    };
  }

  /**
   * Get current user information
   * @returns {Promise<object>} User information
   */
  async getCurrentUser() {
    return await this.makeRequest('GET', '/user');
  }

  /**
   * Get workspaces accessible to the user
   * @returns {Promise<object>} Workspaces list
   */
  async getWorkspaces() {
    return await this.makeRequest('GET', '/workspaces');
  }
}
