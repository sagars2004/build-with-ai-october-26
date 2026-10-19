import * as path from "node:path";

const blockedNames = new Set([
  ".env",
  ".env.local",
  ".env.production",
  "credentials.json",
  "secrets.json",
]);

export function isSafeWorkspacePath(workspaceRoot: string, filePath: string): boolean {
  const root = path.resolve(workspaceRoot);
  const candidate = path.resolve(filePath);
  const relative = path.relative(root, candidate);
  const fileName = path.basename(candidate);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative) && !blockedNames.has(fileName);
}

export function clampText(value: string, maxCharacters = 12000): string {
  return value.length <= maxCharacters ? value : `${value.slice(0, maxCharacters)}\n… context truncated …`;
}
