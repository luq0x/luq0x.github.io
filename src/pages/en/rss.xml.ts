import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { profile } from '../../config';
import { getWriteups, slugOf } from '../../lib/writeups';
import { localeHref, t } from '../../i18n';

export async function GET(context: APIContext) {
  const lang = 'en' as const;
  const s = t(lang);
  const entries = await getWriteups(lang);

  return rss({
    title: s.siteTitle,
    description: s.siteDescription,
    site: context.site ?? 'https://example.com',
    trailingSlash: false,
    items: entries.map((entry) => ({
      title: entry.data.title,
      description: entry.data.summary,
      pubDate: entry.data.pubDate,
      link: localeHref(lang, `/writeups/${slugOf(entry)}`),
      categories: [entry.data.platform, ...entry.data.tags],
      author: entry.data.author ?? profile.name,
    })),
    customData: `<language>${s.htmlLang}</language>`,
  });
}
