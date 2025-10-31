import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cssPath = join(__dirname, '..', 'src', 'index.css');
const svgPath = join(__dirname, '..', 'public', 'favicon.svg');

const css = await readFile(cssPath, 'utf8');

const blockPattern = /:root\s*{([\s\S]*?)}/m;
const rootBlockMatch = css.match(blockPattern);

if (!rootBlockMatch) {
  throw new Error('Unable to locate :root theme block in index.css');
}

const declarationPattern = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
const variables = new Map();

for (const match of rootBlockMatch[1].matchAll(declarationPattern)) {
  const [, name, value] = match;
  variables.set(name.trim(), value.trim());
}

const themeBlockMatch = css.match(/@theme\s+inline\s*{([\s\S]*?)}/m);
const themeVariables = new Map();

if (themeBlockMatch) {
  for (const match of themeBlockMatch[1].matchAll(declarationPattern)) {
    const [, name, value] = match;
    themeVariables.set(name.trim(), value.trim());
  }
}

const resolveValue = (value, stack = []) => {
  const varPattern = /var\((--[a-z0-9-]+)(?:,\s*([^()]+))?\)/gi;

  return value.replace(varPattern, (_full, token, fallback) => {
    const key = token.replace(/^--/, '').trim();

    if (stack.includes(key)) {
      return fallback?.trim() ?? '';
    }

    const next = variables.get(key);

    if (!next) {
      return fallback ? resolveValue(fallback, [...stack, key]) : '';
    }

    return resolveValue(next, [...stack, key]);
  });
};

const rawLogoColor =
  variables.get('logo-color') ??
  themeVariables.get('logo-color') ??
  variables.get('primary');

if (!rawLogoColor) {
  throw new Error('Missing --logo-color declaration in index.css');
}

const resolvedLogoColor = resolveValue(rawLogoColor).trim();

if (!resolvedLogoColor) {
  throw new Error('Unable to resolve a concrete value for --logo-color');
}

const svg = await readFile(svgPath, 'utf8');

const updatedSvg = svg.replace(
  /(color:\s*)([^;]+)(;)/,
  (_full, prefix, _existing, suffix) => `${prefix}${resolvedLogoColor}${suffix}`,
);

if (svg !== updatedSvg) {
  await writeFile(svgPath, updatedSvg, 'utf8');
}
