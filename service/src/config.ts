import * as fs from "node:fs";
import * as path from "node:path";

function loadEnvFile(): void {
  const candidates = [path.resolve(process.cwd(), ".env"), path.resolve(__dirname, "../../.env")];
  const filePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!filePath) return;
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

export type Provider = "gemini" | "groq" | "nvidia" | "openai";

const defaults: Record<Provider, { key: string; baseUrl: string; model: string }> = {
  gemini: { key: "GEMINI_API_KEY", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-3.8-flash" },
  groq: { key: "GROQ_API_KEY", baseUrl: "https://api.groq.com/openai/v1", model: "openai/gpt-oss-20b" },
  nvidia: { key: "NVIDIA_API_KEY", baseUrl: "https://integrate.api.nvidia.com/v1", model: "openai/gpt-oss-20b" },
  openai: { key: "OPENAI_API_KEY", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
};

export function providerConfig(): { provider: Provider; apiKey: string; baseUrl: string; model: string } {
  const requested = process.env.EXPLAINIT_PROVIDER as Provider | undefined;
  const provider = requested && requested in defaults
    ? requested
    : (["gemini", "groq", "nvidia", "openai"] as Provider[]).find((candidate) => process.env[defaults[candidate].key]) ?? "groq";
  const config = defaults[provider];
  return {
    provider,
    apiKey: process.env[config.key] ?? "",
    baseUrl: (process.env.EXPLAINIT_BASE_URL || config.baseUrl).replace(/\/$/, ""),
    model: process.env.EXPLAINIT_MODEL || config.model,
  };
}
