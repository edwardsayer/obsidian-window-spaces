/** The neutral icon used when a Space has no custom icon or emoji. */
export const DEFAULT_SPACE_ICON = "square";

export function resolveSpaceIcon(icon?: string, configuredDefaultIcon?: string): string {
  return icon?.trim() || configuredDefaultIcon?.trim() || DEFAULT_SPACE_ICON;
}

export function isSpaceEmoji(value: string): boolean {
  return /\p{Extended_Pictographic}/u.test(value) || !/^[a-zA-Z0-9-]+$/.test(value);
}
