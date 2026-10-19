"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("node:http"));
const client_1 = require("./mcp/client");
const port = Number(process.env.EXPLAINIT_PORT ?? 4242);
const contextClient = new client_1.ContextClient();
function readJson(request) {
    return new Promise((resolve, reject) => {
        let body = "";
        request.setEncoding("utf8");
        request.on("data", (chunk) => {
            body += chunk;
            if (body.length > 100_000)
                reject(new Error("Request body is too large."));
        });
        request.on("end", () => {
            try {
                resolve(JSON.parse(body));
            }
            catch {
                reject(new Error("Request body must be valid JSON."));
            }
        });
        request.on("error", reject);
    });
}
function send(response, status, payload) {
    response.writeHead(status, { "content-type": "application/json", "access-control-allow-origin": "*" });
    response.end(JSON.stringify(payload));
}
async function contextFromRequest(input) {
    const baseArgs = { workspaceRoot: input.workspaceRoot, filePath: input.filePath };
    const focused = JSON.parse(await contextClient.callTool("get_focused_change", baseArgs));
    const nearby = JSON.parse(await contextClient.callTool("get_nearby_context", baseArgs));
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
            const input = (await readJson(request));
            const context = await contextFromRequest(input);
            console.log(`[context] ${context.filePath} via ${context.toolsUsed.join(", ")}`);
            send(response, 200, { ok: true, context });
        }
        catch (error) {
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
async function shutdown() {
    await contextClient.close();
    server.close();
}
process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
//# sourceMappingURL=server.js.map