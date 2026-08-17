import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { deferredStorage } from "@imify/core/storage-adapter";
import type {
  CanvasSizeUnit,
  GridDesignParams,
} from "@imify/features/filling/types";

export const DEFAULT_COLLAGE_GRID_PARAMS: GridDesignParams = {
  direction: "cols",
  rowCount: 2,
  rowDefinitions: ["1", "1"],
  outerPadding: 20,
  gapX: 16,
  gapY: 16,
  uniformColumns: false,
  uniformColumnsDef: "",
};

export const DEFAULT_COLLAGE_CANVAS_CONFIG = {
  canvasWidth: 1920,
  canvasHeight: 1080,
  canvasUnit: "px" as CanvasSizeUnit,
  canvasDpi: 300,
  selectedLayoutId: "",
  gridParams: DEFAULT_COLLAGE_GRID_PARAMS,
};

export interface CollageMakerState {
  canvasWidth: number;
  canvasHeight: number;
  canvasUnit: CanvasSizeUnit;
  canvasDpi: number;
  selectedLayoutId: string;
  gridParams: GridDesignParams;

  setCanvasWidth: (width: number) => void;
  setCanvasHeight: (height: number) => void;
  setCanvasUnit: (unit: CanvasSizeUnit) => void;
  setCanvasDpi: (dpi: number) => void;
  setSelectedLayoutId: (id: string) => void;
  setGridParams: (
    params:
      | GridDesignParams
      | ((prev: GridDesignParams) => GridDesignParams),
  ) => void;
  resetCollageConfig: () => void;
}

export const useCollageMakerStore = create<CollageMakerState>()(
  persist(
    (set) => ({
      ...DEFAULT_COLLAGE_CANVAS_CONFIG,
      setCanvasWidth: (canvasWidth) => set({ canvasWidth }),
      setCanvasHeight: (canvasHeight) => set({ canvasHeight }),
      setCanvasUnit: (canvasUnit) => set({ canvasUnit }),
      setCanvasDpi: (canvasDpi) => set({ canvasDpi }),
      setSelectedLayoutId: (selectedLayoutId) => set({ selectedLayoutId }),
      setGridParams: (params) =>
        set((state) => ({
          gridParams:
            typeof params === "function" ? params(state.gridParams) : params,
        })),
      resetCollageConfig: () => set(DEFAULT_COLLAGE_CANVAS_CONFIG),
    }),
    {
      name: "imify-collage-maker-storage",
      storage: createJSONStorage(() => deferredStorage),
    },
  ),
);
