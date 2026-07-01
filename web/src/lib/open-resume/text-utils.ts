export function isBulletLine(text: string): boolean {
  const t = text.trim();
  return /^[•\-\*●]\s/.test(t) || t.startsWith("- ");
}

export function stripBullet(text: string): string {
  return text.replace(/^[•\-\*●]\s*/, "").trim();
}
