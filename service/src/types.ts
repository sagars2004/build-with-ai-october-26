export type ContextRequest = {
  workspaceRoot: string;
  filePath: string;
  language?: string;
  recentEdit?: string;
};

export type FocusedContext = {
  filePath: string;
  language: string;
  diff: string;
  nearbyContext: string;
  fingerprint: string;
  toolsUsed: string[];
  recentEdit?: string;
};
