import { Octokit } from "@octokit/rest";
import { readdir, readFile, stat } from "fs/promises";
import path from "path";

const PAT = process.env.GITHUB_PAT!;
const OWNER = "mahithpaulin";
const REPO = "madc-sys";

const IGNORE = new Set([
  "node_modules", ".git", "dist", ".cache", "madc-output",
  ".pnpm-store", "pnpm-lock.yaml", ".local",
]);

const TEXT_EXTS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".txt",
  ".yaml", ".yml", ".toml", ".sh", ".env", ".gitignore",
  ".dockerignore", ".sql", ".css", ".html", ".py", ".go",
  ".rs", ".cpp", ".hpp", ".c", ".h", "Makefile", "Dockerfile",
  ".eslintrc", ".prettierrc", ".npmrc",
]);

async function collectFiles(dir: string, base: string): Promise<{ path: string; content: string }[]> {
  const results: { path: string; content: string }[] = [];
  const entries = await readdir(dir);
  for (const entry of entries) {
    if (IGNORE.has(entry)) continue;
    const full = path.join(dir, entry);
    const rel = path.relative(base, full);
    const s = await stat(full);
    if (s.isDirectory()) {
      results.push(...await collectFiles(full, base));
    } else {
      const ext = path.extname(entry) || entry;
      const isText = TEXT_EXTS.has(ext) || TEXT_EXTS.has(entry);
      if (isText && s.size < 800_000) {
        try {
          const content = await readFile(full, "utf-8");
          results.push({ path: rel, content });
        } catch {
          // skip unreadable
        }
      }
    }
  }
  return results;
}

async function main() {
  const octokit = new Octokit({ auth: PAT });
  const root = path.resolve(".");

  console.log("Collecting files…");
  const files = await collectFiles(root, root);
  console.log(`Found ${files.length} files to push`);

  // Step 1: seed the repo with an initial commit so the Git DB is live
  console.log("Seeding repo with initial commit…");
  await octokit.rest.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path: "README.md",
    message: "chore: init repo",
    content: Buffer.from(`# ${REPO}\n\nMADC-SYS — Multi-Agent Distributed Coding System\n`).toString("base64"),
  });

  // Step 2: get the HEAD commit + tree SHA
  const { data: ref } = await octokit.rest.git.getRef({
    owner: OWNER,
    repo: REPO,
    ref: "heads/main",
  });
  const headSha = ref.object.sha;
  const { data: headCommit } = await octokit.rest.git.getCommit({
    owner: OWNER,
    repo: REPO,
    commit_sha: headSha,
  });
  const baseTreeSha = headCommit.tree.sha;

  // Step 3: create blobs for all workspace files
  console.log("Creating blobs…");
  const treeItems: { path: string; mode: "100644"; type: "blob"; sha: string }[] = [];
  let i = 0;
  for (const file of files) {
    i++;
    if (i % 10 === 0) console.log(`  ${i}/${files.length}`);
    const { data: blob } = await octokit.rest.git.createBlob({
      owner: OWNER,
      repo: REPO,
      content: Buffer.from(file.content).toString("base64"),
      encoding: "base64",
    });
    treeItems.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
  }

  // Step 4: create tree on top of the seeded base
  console.log("Creating tree…");
  const { data: tree } = await octokit.rest.git.createTree({
    owner: OWNER,
    repo: REPO,
    tree: treeItems,
    base_tree: baseTreeSha,
  });

  // Step 5: create the real commit
  console.log("Creating commit…");
  const { data: commit } = await octokit.rest.git.createCommit({
    owner: OWNER,
    repo: REPO,
    message: "feat: MADC-SYS full codebase\n\nMulti-Agent Distributed Coding System\n- 10 specialized agents (Planner → Deployment)\n- Deterministic state machine (INIT → COMPLETE)\n- Event-driven typed message bus\n- Task DAG engine\n- Language routing matrix\n- GitHub push via Octokit tree API",
    tree: tree.sha,
    parents: [headSha],
  });

  // Step 6: fast-forward main to the new commit
  console.log("Updating main branch…");
  await octokit.rest.git.updateRef({
    owner: OWNER,
    repo: REPO,
    ref: "heads/main",
    sha: commit.sha,
  });

  console.log(`\n✔ Done!  https://github.com/${OWNER}/${REPO}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
