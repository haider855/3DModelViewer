export const VIEW_MODES = ["material", "solid", "wireframe"] as const;

export type ViewMode = (typeof VIEW_MODES)[number];

export function isViewMode(value: string | undefined): value is ViewMode {
  return VIEW_MODES.some((viewMode) => viewMode === value);
}
