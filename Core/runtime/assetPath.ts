const base = import.meta.env.BASE_URL || '/';

export function assetPath(relativePath: string) {
  const normalized = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${base}${normalized}`;
}
