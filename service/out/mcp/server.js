"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const git_1 = require("../workspace/git");
const safety_1 = require("../workspace/safety");
// The SDK's deeply recursive schema types exceed the compiler's instantiation
// budget for this small server; runtime validation still comes from Zod.
const server = new mcp_js_1.McpServer({ name: "explainit-context", version: "0.1.0" });
server.registerTool("get_focused_change", {
    description: "Read the bounded Git diff for one safe active workspace file.",
    inputSchema: { workspaceRoot: zod_1.z.string(), filePath: zod_1.z.string() },
}, async ({ workspaceRoot, filePath }) => {
    const result = await (0, git_1.readFocusedChange)(workspaceRoot, filePath);
    return { content: [{ type: "text", text: JSON.stringify({ filePath, ...result }) }] };
});
server.registerTool("get_nearby_context", {
    description: "Read bounded nearby code from one safe active workspace file.",
    inputSchema: { workspaceRoot: zod_1.z.string(), filePath: zod_1.z.string() },
}, async ({ workspaceRoot, filePath }) => {
    const context = await (0, git_1.readNearbyContext)(workspaceRoot, filePath);
    return { content: [{ type: "text", text: JSON.stringify({ filePath, context }) }] };
});
server.registerTool("get_workspace_metadata", {
    description: "Return safe metadata for the active workspace and file, never file contents or credentials.",
    inputSchema: { workspaceRoot: zod_1.z.string(), filePath: zod_1.z.string(), language: zod_1.z.string().optional() },
}, async ({ workspaceRoot, filePath, language }) => {
    if (!(0, safety_1.isSafeWorkspacePath)(workspaceRoot, filePath))
        throw new Error("Workspace path is not safe.");
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({ workspaceName: workspaceRoot.split(/[\\/]/).pop(), filePath, language: language ?? "unknown" }),
            },
        ],
    };
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    process.stderr.write("[mcp] explainit-context ready\n");
}
void main().catch((error) => {
    process.stderr.write(`[mcp] fatal: ${(0, safety_1.clampText)(String(error))}\n`);
    process.exitCode = 1;
});
//# sourceMappingURL=server.js.map