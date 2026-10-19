import * as http from "node:http";
import { ContextClient } from "./mcp/client";
import { ContextRequest, FocusedContext } from "./types";

const port = Number(process.env.EXPLAINIT_PORT ?? 4242);
const contextClient = new ContextClient();

function readJson(request: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100_000) reject(new Error("Request body is too large."));
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    request.on("error", reject);
  });
}

function send(response: http.ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, { "content-type": "application/json", "access-control-allow-origin": "*" });
  response.end(JSON.stringify(payload));
}

async function contextFromRequest(input: ContextRequest): Promise<FocusedContext> {
  const baseArgs = { workspaceRoot: input.workspaceRoot, filePath: input.filePath };
  const focused = JSON.parse(await contextClient.callTool("get_focused_change", baseArgs)) as {
    filePath: string;
    diff: string;
    fingerprint: string;
  };
  const nearby = JSON.parse(await contextClient.callTool("get_nearby_context", baseArgs)) as { context: string };
  return {
    filePath: focused.filePath,
    language: input.language ?? "unknown",
    diff: focused.diff,
    nearbyContext: nearby.context,
    fingerprint: focused.fingerprint,
    toolsUsed: ["get_focused_change", "get_nearby_context"],
  };
}

const server = http.createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    send(response, 200, { ok: true, service: "explainit", mcp: Boolean(contextClient) });
    return;
  }

  if (request.method === "POST" && request.url === "/context") {
    try {
      const input = (await readJson(request)) as ContextRequest;
      const context = await contextFromRequest(input);
      console.log(`[context] ${context.filePath} via ${context.toolsUsed.join(", ")}`);
      send(response, 200, { ok: true, context });
    } catch (error) {
      console.error(`[context] skipped: ${String(error)}`);
      send(response, 422, { ok: false, message: String(error) });
    }
    return;
  }

  send(response, 404, { ok: false, message: "Not found" });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[service] Explainit listening on http://127.0.0.1:${port}`);
  console.log("[service] POST /context to inspect one focused file through MCP");
});

async function shutdown(): Promise<void> {
  await contextClient.close();
  server.close();
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
