import { getCollection, type CollectionEntry } from 'astro:content';
import { estimateReadingTime } from './reading-time';
import { defaultLocale, type Locale } from '../i18n';

export type Writeup = CollectionEntry<'writeups'>;

export function localeOf(entry: Writeup): Locale {
  const prefix = entry.id.split('/')[0];
  return prefix === 'en' ? 'en' : defaultLocale;
}

export function slugOf(entry: Writeup): string {
  return entry.id.split('/').slice(1).join('/');
}

export async function getWriteups(lang: Locale): Promise<Writeup[]> {
  const entries = await getCollection('writeups', ({ data }) => {
    return import.meta.env.DEV || !data.draft;
  });

  return entries
    .filter((entry) => localeOf(entry) === lang)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function readingTimeOf(entry: Writeup): number {
  return entry.data.readingTime ?? estimateReadingTime(entry.body ?? '');
}

export function collectTags(entries: Writeup[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
