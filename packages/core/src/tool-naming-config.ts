export interface ToolExportNamingConfig {
  toolId: string;
  defaultOriginalName: string;
  defaultPattern: string;
}

export const PROCESSOR_NAMING_CONFIG: ToolExportNamingConfig = {
  toolId: "processor",
  defaultOriginalName: "image",
  defaultPattern: "[OriginalName]",
};

export const BACKGROUND_REMOVAL_NAMING_CONFIG: ToolExportNamingConfig = {
  toolId: "background-removal",
  defaultOriginalName: "image",
  defaultPattern: "[OriginalName]",
};

export const UPSCALER_NAMING_CONFIG: ToolExportNamingConfig = {
  toolId: "upscaler",
  defaultOriginalName: "image",
  defaultPattern: "[OriginalName]",
};

export const SPLITTER_NAMING_CONFIG: ToolExportNamingConfig = {
  toolId: "splitter",
  defaultOriginalName: "image",
  defaultPattern: "imify-splitter-[OriginalName]-[Index]",
};

export const SPLICING_NAMING_CONFIG: ToolExportNamingConfig = {
  toolId: "splicing",
  defaultOriginalName: "imify-splicing",
  defaultPattern: "imify-splicing-[Time]",
};

export const FILLING_NAMING_CONFIG: ToolExportNamingConfig = {
  toolId: "filling",
  defaultOriginalName: "imify-filling",
  defaultPattern: "imify-filling-[Time]",
};

export const COLLAGE_MAKER_NAMING_CONFIG: ToolExportNamingConfig = {
  toolId: "collage-maker",
  defaultOriginalName: "imify-collage",
  defaultPattern: "imify-collage-[Time]",
};

export const PATTERN_NAMING_CONFIG: ToolExportNamingConfig = {
  toolId: "pattern",
  defaultOriginalName: "imify-pattern",
  defaultPattern: "imify-pattern-[Time]",
};

export const PDF_STUDIO_NAMING_CONFIG: ToolExportNamingConfig = {
  toolId: "pdf-studio",
  defaultOriginalName: "document",
  defaultPattern: "[OriginalName]_page_[Index]",
};

