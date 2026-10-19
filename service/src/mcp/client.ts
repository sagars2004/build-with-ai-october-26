import * as path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export class ContextClient {
  private readonly client = new Client({ name: "explainit-service", version: "0.1.0" });
  private transport?: StdioClientTransport;

  async start(): Promise<void> {
    if (this.transport) return;

    const serverPath = path.join(__dirname, "server.js");
    this.transport = new StdioClientTransport({
      command: process.execPath,
      args: [serverPath],
      stderr: "pipe",
    });
    this.transport.stderr?.on("data", (chunk: Buffer) => {
      process.stderr.write(`[mcp-child] ${chunk.toString()}`);
    });
    await this.client.connect(this.transport);
    const tools = await this.client.listTools();
    console.log(`[mcp] discovered tools: ${tools.tools.map((tool) => tool.name).join(", ")}`);
  }

  async callTool(name: string, args: Record<string, string>): Promise<string> {
    await this.start();
    const result = (await this.client.callTool({ name, arguments: args })) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = result.content?.find((item: { type: string; text?: string }) => item.type === "text");
    if (!text || text.type !== "text" || typeof text.text !== "string") throw new Error(`MCP tool ${name} returned no text.`);
    return text.text;
  }

  async close(): Promise<void> {
    await this.transport?.close();
    this.transport = undefined;
  }
}
