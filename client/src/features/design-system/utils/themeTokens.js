export const COLOR_TOKENS = [
  { name: '--background', label: 'Background' },
  { name: '--foreground', label: 'Foreground' },
  { name: '--card', label: 'Card' },
  { name: '--card-foreground', label: 'Card Foreground' },
  { name: '--popover', label: 'Popover' },
  { name: '--popover-foreground', label: 'Popover Foreground' },
  { name: '--primary', label: 'Primary' },
  { name: '--primary-foreground', label: 'Primary Foreground' },
  { name: '--secondary', label: 'Secondary' },
  { name: '--secondary-foreground', label: 'Secondary Foreground' },
  { name: '--muted', label: 'Muted' },
  { name: '--muted-foreground', label: 'Muted Foreground' },
  { name: '--accent', label: 'Accent' },
  { name: '--accent-foreground', label: 'Accent Foreground' },
  { name: '--destructive', label: 'Destructive' },
  { name: '--destructive-foreground', label: 'Destructive Foreground' },
  { name: '--border', label: 'Border' },
  { name: '--input', label: 'Input' },
  { name: '--ring', label: 'Ring' },
];

export const hslToHex = (h, s, l) => {
  const hue = h / 360;
  const saturation = s / 100;
  const lightness = l / 100;

  const hueToRgb = (p, q, t) => {
    let tempT = t;
    if (tempT < 0) tempT += 1;
    if (tempT > 1) tempT -= 1;
    if (tempT < 1 / 6) return p + (q - p) * 6 * tempT;
    if (tempT < 1 / 2) return q;
    if (tempT < 2 / 3) return p + (q - p) * (2 / 3 - tempT) * 6;
    return p;
  };

  let r;
  let g;
  let b;

  if (saturation === 0) {
    r = g = b = lightness;
  } else {
    const q =
      lightness < 0.5
        ? lightness * (1 + saturation)
        : lightness + saturation - lightness * saturation;
    const p = 2 * lightness - q;
    r = hueToRgb(p, q, hue + 1 / 3);
    g = hueToRgb(p, q, hue);
    b = hueToRgb(p, q, hue - 1 / 3);
  }

  const toHex = (value) => {
    const hex = Math.round(value * 255)
      .toString(16)
      .padStart(2, '0');
    return hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const hexToHslString = (hex) => {
  const normalized = hex.replace('#', '');
  const bigint = Number.parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h;
  let s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      default:
        h = (rNorm - gNorm) / d + 4;
        break;
    }

    h /= 6;
  }

  const hue = Math.round(h * 360 * 10) / 10;
  const saturation = Math.round(s * 100 * 10) / 10;
  const lightness = Math.round(l * 100 * 10) / 10;

  return `${hue} ${saturation}% ${lightness}%`;
};

export const hslStringToHex = (value) => {
  if (!value) return '#000000';
  const [hue, saturation, lightness] = value
    .split(/\s+/)
    .filter(Boolean)
    .map((part, index) =>
      index === 0 ? Number.parseFloat(part) : Number.parseFloat(part.replace('%', ''))
    );
  if (
    Number.isNaN(hue) ||
    Number.isNaN(saturation) ||
    Number.isNaN(lightness)
  ) {
    return '#000000';
  }
  return hslToHex(hue, saturation, lightness);
};

export const readThemeValues = (mode) => {
  if (typeof window === 'undefined') return {};
  const root = document.documentElement;
  const originalDark = root.classList.contains('dark');
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  const styles = getComputedStyle(root);
  const entries = COLOR_TOKENS.map(({ name }) => [
    name,
    styles.getPropertyValue(name).trim(),
  ]);
  if (originalDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  return Object.fromEntries(entries);
};

export const applyThemeValues = (values) => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  Object.entries(values).forEach(([token, tokenValue]) => {
    if (tokenValue) {
      root.style.setProperty(token, tokenValue);
    }
  });
};
