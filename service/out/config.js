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
exports.providerConfig = providerConfig;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
function loadEnvFile() {
    const candidates = [path.resolve(process.cwd(), ".env"), path.resolve(__dirname, "../../.env")];
    const filePath = candidates.find((candidate) => fs.existsSync(candidate));
    if (!filePath)
        return;
    for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#"))
            continue;
        const separator = line.indexOf("=");
        if (separator < 1)
            continue;
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
        if (!process.env[key])
            process.env[key] = value;
    }
}
loadEnvFile();
const defaults = {
    gemini: { key: "GEMINI_API_KEY", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-3.8-flash" },
    groq: { key: "GROQ_API_KEY", baseUrl: "https://api.groq.com/openai/v1", model: "openai/gpt-oss-20b" },
    nvidia: { key: "NVIDIA_API_KEY", baseUrl: "https://integrate.api.nvidia.com/v1", model: "openai/gpt-oss-20b" },
    openai: { key: "OPENAI_API_KEY", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
};
function providerConfig() {
    const requested = process.env.EXPLAINIT_PROVIDER;
    const provider = requested && requested in defaults
        ? requested
        : ["gemini", "groq", "nvidia", "openai"].find((candidate) => process.env[defaults[candidate].key]) ?? "groq";
    const config = defaults[provider];
    return {
        provider,
        apiKey: process.env[config.key] ?? "",
        baseUrl: (process.env.EXPLAINIT_BASE_URL || config.baseUrl).replace(/\/$/, ""),
        model: process.env.EXPLAINIT_MODEL || config.model,
    };
}
//# sourceMappingURL=config.js.map