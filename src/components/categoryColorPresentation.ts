type Rgb = {
  red: number;
  green: number;
  blue: number;
};

const DEFAULT_CATEGORY_COLOR = "#0B7F79";

function parseHex(value: string): Rgb | null {
  const trimmed = value.trim();
  const shortMatch = /^#([0-9a-f]{3})$/i.exec(trimmed);
  const longMatch = /^#([0-9a-f]{6})$/i.exec(trimmed);

  if (shortMatch) {
    const value = shortMatch[1] ?? "";
    return {
      red: Number.parseInt(`${value.charAt(0)}${value.charAt(0)}`, 16),
      green: Number.parseInt(`${value.charAt(1)}${value.charAt(1)}`, 16),
      blue: Number.parseInt(`${value.charAt(2)}${value.charAt(2)}`, 16),
    };
  }

  if (longMatch) {
    const value = longMatch[1] ?? "";
    return {
      red: Number.parseInt(value.slice(0, 2), 16),
      green: Number.parseInt(value.slice(2, 4), 16),
      blue: Number.parseInt(value.slice(4, 6), 16),
    };
  }

  return null;
}

function toHex({ red, green, blue }: Rgb) {
  return `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function mixHex(background: string, foreground: string, foregroundOpacity: number) {
  const backgroundRgb = parseHex(background) ?? parseHex("#FCFDFB")!;
  const foregroundRgb = parseHex(foreground) ?? parseHex(DEFAULT_CATEGORY_COLOR)!;
  const opacity = Math.min(1, Math.max(0, foregroundOpacity));

  return toHex({
    red: backgroundRgb.red * (1 - opacity) + foregroundRgb.red * opacity,
    green: backgroundRgb.green * (1 - opacity) + foregroundRgb.green * opacity,
    blue: backgroundRgb.blue * (1 - opacity) + foregroundRgb.blue * opacity,
  });
}

function relativeLuminance(color: string) {
  const rgb = parseHex(color) ?? parseHex(DEFAULT_CATEGORY_COLOR)!;
  const linearize = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * linearize(rgb.red) + 0.7152 * linearize(rgb.green) + 0.0722 * linearize(rgb.blue);
}

export function contrastRatio(first: string, second: string) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function contrastSafeAccent(accent: string, background: string, targetRatio: number) {
  if (contrastRatio(accent, background) >= targetRatio) {
    return accent;
  }

  const destination = relativeLuminance(background) > 0.4 ? "#14211F" : "#F4F7F6";
  for (let step = 1; step <= 20; step += 1) {
    const candidate = mixHex(accent, destination, step / 20);
    if (contrastRatio(candidate, background) >= targetRatio) {
      return candidate;
    }
  }

  return destination;
}

export function categoryColorPresentation(color: string, surfaceColor: string) {
  const parsedAccent = parseHex(color);
  const parsedSurface = parseHex(surfaceColor);
  const accent = parsedAccent ? toHex(parsedAccent) : DEFAULT_CATEGORY_COLOR;
  const surface = parsedSurface ? toHex(parsedSurface) : "#FCFDFB";
  const backgroundColor = mixHex(surface, accent, 0.14);
  const foregroundColor = contrastSafeAccent(accent, backgroundColor, 4.5);

  return {
    backgroundColor,
    foregroundColor,
  };
}
