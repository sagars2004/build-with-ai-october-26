import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as path from "node:path";
import { clampText, isSafeWorkspacePath } from "./safety";

const execFileAsync = promisify(execFile);

export async function readFocusedChange(workspaceRoot: string, filePath: string): Promise<{ diff: string; fingerprint: string }> {
  if (!isSafeWorkspacePath(workspaceRoot, filePath)) {
    throw new Error("The selected file is outside the workspace or is blocked as sensitive.");
  }

  const relativePath = path.relative(workspaceRoot, filePath);
  const { stdout } = await execFileAsync("git", ["-C", workspaceRoot, "diff", "--", relativePath], { maxBuffer: 2_000_000 });
  const diff = clampText(stdout.trim());
  if (!diff) throw new Error("There is no focused Git diff to quiz yet.");
  const fingerprint = Buffer.from(diff).toString("base64url").slice(0, 24);
  return { diff, fingerprint };
}

export async function readNearbyContext(workspaceRoot: string, filePath: string): Promise<string> {
  if (!isSafeWorkspacePath(workspaceRoot, filePath)) {
    throw new Error("The selected file is outside the workspace or is blocked as sensitive.");
  }

  try {
    const { stdout } = await execFileAsync("git", ["-C", workspaceRoot, "show", `HEAD:${path.relative(workspaceRoot, filePath)}`], { maxBuffer: 2_000_000 });
    return clampText(stdout, 8000);
  } catch {
    return "No committed baseline is available for this file; use the focused diff only.";
  }
}
