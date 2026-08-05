import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';

const writeups = defineCollection({
  loader: glob({ base: './src/content/writeups', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      platform: z
        .enum(['HackTheBox', 'TryHackMe', 'Bug Bounty', 'CTF', 'Lab', 'Research'])
        .default('CTF'),
      difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Insane']).optional(),
      severity: z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
      reward: z.string().optional(),
      readingTime: z.number().optional(),
      author: z.string().optional(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { writeups };