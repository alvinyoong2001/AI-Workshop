# Smart Git MCP Server Usage Guide

## 🧠 **Smart Auto-Detection Features**

The Git MCP server now includes intelligent repository detection that automatically finds and works with Git repositories based on your current context.

### **How It Works:**

1. **Automatic Detection**: When you use any Git tool, the server automatically:
   - Checks if the current directory is a Git repository
   - Searches parent directories for Git repositories
   - Searches subdirectories for Git repositories
   - Selects the most appropriate repository

2. **Smart Context Awareness**: The server understands your current working directory and finds the best Git repository to work with.

### **Usage in Cursor:**

#### **Option 1: Automatic (Recommended)**
Just use any Git tool directly - the server will auto-detect the repository:

```
Use get_current_branch
Use get_branch_list  
Use get_git_diff with targetBranch: "main"
```

#### **Option 2: Manual Auto-Detection**
If you want to explicitly detect the repository first:

```
Use auto_detect_repository
```

#### **Option 3: Smart Repository Discovery and Switching**
Find all available repositories and switch to the correct one:

```
Use find_and_switch_repository
```

This will show you all available Git repositories and let you switch to the right one.

#### **Option 4: Manual Directory Setting**
If you need to specify a specific repository:

```
Use set_working_directory with directory: "/path/to/your/project"
```

### **Smart Tool Behavior:**

- **`get_current_branch`**: Auto-detects repository if needed
- **`get_branch_list`**: Auto-detects repository if needed  
- **`get_git_diff`**: Auto-detects repository if needed
- **`get_current_repository_info`**: Auto-detects repository if needed
- **`auto_detect_repository`**: Explicitly finds and sets the best repository
- **`find_and_switch_repository`**: **NEW!** Find all repositories and switch to the correct one

### **Detection Priority:**

1. **Current Directory**: If it's a Git repository
2. **Parent Directories**: Closest Git repository in parent directories
3. **Subdirectories**: Git repositories in current directory and subdirectories

### **Example Workflow:**

1. Open Cursor in any directory
2. Use `auto_detect_repository` to find the best Git repo
3. Use any Git tools - they'll work automatically with the detected repository
4. No manual path configuration needed!

The server is now smart enough to understand your context and work with the appropriate Git repository automatically! 🎯 