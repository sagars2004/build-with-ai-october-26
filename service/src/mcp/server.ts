import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFocusedChange, readNearbyContext } from "../workspace/git";
import { clampText, isSafeWorkspacePath } from "../workspace/safety";

// The SDK's deeply recursive schema types exceed the compiler's instantiation
// budget for this small server; runtime validation still comes from Zod.
const server: any = new McpServer({ name: "explainit-context", version: "0.1.0" });

server.registerTool(
  "get_focused_change",
  {
    description: "Read the bounded Git diff for one safe active workspace file.",
    inputSchema: { workspaceRoot: z.string(), filePath: z.string() },
  },
  async ({ workspaceRoot, filePath }: { workspaceRoot: string; filePath: string }) => {
    const result = await readFocusedChange(workspaceRoot, filePath);
    return { content: [{ type: "text", text: JSON.stringify({ filePath, ...result }) }] };
  },
);

server.registerTool(
  "get_nearby_context",
  {
    description: "Read bounded nearby code from one safe active workspace file.",
    inputSchema: { workspaceRoot: z.string(), filePath: z.string() },
  },
  async ({ workspaceRoot, filePath }: { workspaceRoot: string; filePath: string }) => {
    const context = await readNearbyContext(workspaceRoot, filePath);
    return { content: [{ type: "text", text: JSON.stringify({ filePath, context }) }] };
  },
);

server.registerTool(
  "get_workspace_metadata",
  {
    description: "Return safe metadata for the active workspace and file, never file contents or credentials.",
    inputSchema: { workspaceRoot: z.string(), filePath: z.string(), language: z.string().optional() },
  },
  async ({ workspaceRoot, filePath, language }: { workspaceRoot: string; filePath: string; language?: string }) => {
    if (!isSafeWorkspacePath(workspaceRoot, filePath)) throw new Error("Workspace path is not safe.");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ workspaceName: workspaceRoot.split(/[\\/]/).pop(), filePath, language: language ?? "unknown" }),
        },
      ],
    };
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[mcp] explainit-context ready\n");
}

void main().catch((error: unknown) => {
  process.stderr.write(`[mcp] fatal: ${clampText(String(error))}\n`);
  process.exitCode = 1;
});
