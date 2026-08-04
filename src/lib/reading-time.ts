export function estimateReadingTime(body = ''): number {
  const codeBlocks = body.match(/```[\s\S]*?```/g) ?? [];
  const codeWords = codeBlocks.join(' ').split(/\s+/).filter(Boolean).length;

  const prose = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ');
  const proseWords = prose.split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.round(proseWords / 220 + codeWords / 600));
}
