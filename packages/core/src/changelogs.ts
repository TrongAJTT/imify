export interface ChangelogVersion {
  version: string;
  date: string;
  filePath: string;
  key: string;
}

export const CHANGELOGS: ChangelogVersion[] = [
  { version: "v2.2", date: "2026-07-10", filePath: "/assets/changelogs/v2-2.md", key: "v2_2" },
  { version: "v2.1", date: "2026-05-03", filePath: "/assets/changelogs/v2-1.md", key: "v2_1" },
  { version: "v1.5", date: "2024-04-01", filePath: "/assets/changelogs/v1-5.md", key: "v1_5" },
  { version: "v1.0", date: "2024-03-23", filePath: "/assets/changelogs/v1-0.md", key: "v1_0" }
];
