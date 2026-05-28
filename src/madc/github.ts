import { Octokit } from "@octokit/rest";

export interface GitHubPushResult {
  success: boolean;
  repoUrl?: string;
  error?: string;
}

export async function pushToGitHub(
  pat: string,
  repoName: string,
  artifacts: Record<string, string>,
  description: string
): Promise<GitHubPushResult> {
  const octokit = new Octokit({ auth: pat });

  let owner: string;
  try {
    const { data: user } = await octokit.rest.users.getAuthenticated();
    owner = user.login;
  } catch (err: unknown) {
    return { success: false, error: `PAT authentication failed: ${String(err)}` };
  }

  // Create or use existing repo
  let repoFullName: string;
  try {
    const { data: repo } = await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      description,
      auto_init: true,
      private: false,
    });
    repoFullName = repo.full_name;
  } catch (err: unknown) {
    // Repo may already exist
    const msg = String(err);
    if (!msg.includes("name already exists")) {
      return { success: false, error: `Failed to create repo: ${msg}` };
    }
    repoFullName = `${owner}/${repoName}`;
  }

  // Get default branch SHA
  let baseSha: string;
  let baseTree: string;
  try {
    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo: repoName,
      ref: "heads/main",
    });
    baseSha = ref.object.sha;
    const { data: commit } = await octokit.rest.git.getCommit({
      owner,
      repo: repoName,
      commit_sha: baseSha,
    });
    baseTree = commit.tree.sha;
  } catch {
    return { success: false, error: "Could not retrieve default branch ref" };
  }

  // Build blob tree
  const treeItems: {
    path: string;
    mode: "100644";
    type: "blob";
    sha: string;
  }[] = [];

  for (const [path, content] of Object.entries(artifacts)) {
    const { data: blob } = await octokit.rest.git.createBlob({
      owner,
      repo: repoName,
      content: Buffer.from(content).toString("base64"),
      encoding: "base64",
    });
    treeItems.push({ path, mode: "100644", type: "blob", sha: blob.sha });
  }

  // Create tree
  const { data: newTree } = await octokit.rest.git.createTree({
    owner,
    repo: repoName,
    tree: treeItems,
    base_tree: baseTree,
  });

  // Create commit
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner,
    repo: repoName,
    message: `feat: MADC-SYS generated output — ${new Date().toISOString()}`,
    tree: newTree.sha,
    parents: [baseSha],
  });

  // Update ref
  await octokit.rest.git.updateRef({
    owner,
    repo: repoName,
    ref: "heads/main",
    sha: newCommit.sha,
    force: false,
  });

  return {
    success: true,
    repoUrl: `https://github.com/${repoFullName}`,
  };
}
