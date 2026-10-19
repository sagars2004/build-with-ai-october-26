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
exports.readFocusedChange = readFocusedChange;
exports.readNearbyContext = readNearbyContext;
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const path = __importStar(require("node:path"));
const safety_1 = require("./safety");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
async function readFocusedChange(workspaceRoot, filePath) {
    if (!(0, safety_1.isSafeWorkspacePath)(workspaceRoot, filePath)) {
        throw new Error("The selected file is outside the workspace or is blocked as sensitive.");
    }
    const relativePath = path.relative(workspaceRoot, filePath);
    const { stdout } = await execFileAsync("git", ["-C", workspaceRoot, "diff", "--", relativePath], { maxBuffer: 2_000_000 });
    const diff = (0, safety_1.clampText)(stdout.trim());
    if (!diff)
        throw new Error("There is no focused Git diff to quiz yet.");
    const fingerprint = Buffer.from(diff).toString("base64url").slice(0, 24);
    return { diff, fingerprint };
}
async function readNearbyContext(workspaceRoot, filePath) {
    if (!(0, safety_1.isSafeWorkspacePath)(workspaceRoot, filePath)) {
        throw new Error("The selected file is outside the workspace or is blocked as sensitive.");
    }
    try {
        const { stdout } = await execFileAsync("git", ["-C", workspaceRoot, "show", `HEAD:${path.relative(workspaceRoot, filePath)}`], { maxBuffer: 2_000_000 });
        return (0, safety_1.clampText)(stdout, 8000);
    }
    catch {
        return "No committed baseline is available for this file; use the focused diff only.";
    }
}
//# sourceMappingURL=git.js.map