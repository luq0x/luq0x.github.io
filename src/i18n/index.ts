import { url } from '../lib/path';

export const locales = ['pt-br', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt-br';

export function localeHref(lang: Locale, path = '/'): string {
  const clean = path === '/' ? '' : path;
  return lang === defaultLocale ? url(path) : url(`/en${clean}`);
}

export const strings = {
  'pt-br': {
    htmlLang: 'pt-BR',
    ogLocale: 'pt_BR',
    siteTitle: 'Luq0x',
    siteDescription: "Luq0x's blog: Offensive Security Research",
    tagline: 'security researcher · bug bounty hunter',
    railHome: '東京',
    railWriteups: '記録',
    railAbout: '経歴',
    navPrimary: 'Navegação principal',
    navWriteups: 'Writeups',
    navAbout: 'Sobre',
    latestBounties: 'Últimos bounties',
    allWriteups: 'Ver todos os writeups',
    latestWriteups: 'Últimos writeups',
    writeupsTitle: 'Writeups',
    writeupsDescription: 'Relatórios de bug bounty, máquinas e laboratórios.',
    writeupsIntro: 'máquinas, labs e programas de bug bounty.',
    postSingular: 'publicação',
    postPlural: 'publicações',
    filterHeading: 'Filtrar por tag',
    filterAll: 'Todos',
    loadMore: 'Carregar mais',
    emptyTag: 'Nenhum writeup com essa tag ainda.',
    emptyList: 'Nenhum writeup publicado ainda.',
    readingTime: 'min de leitura',
    updatedOn: 'Atualizado em',
    previous: 'Anterior',
    next: 'Próximo',
    backToWriteups: 'Writeups',
    aboutTitle: 'Sobre',
    aboutDescription: 'Quem sou, no que trabalho e com o que gosto de quebrar.',
    certifications: 'Certificações',
    notFoundTitle: 'Esta página não existe',
    notFoundBody: 'O endereço está errado ou o conteúdo foi movido.',
    backHome: 'Voltar para a home',
    skipToContent: 'Pular para o conteúdo',
    otherWriteups: 'Outros writeups',
    bio: [
      'E aí! Sou o Lucas, também conhecido como Luq, tenho 23 anos, sou brasileiro e apaixonado por hacking.',
      'Atualmente, trabalho como pentester focado em Web, API e Mobile. No tempo livre, atuo como bug hunter e security researcher, me aprofundando em todo e qualquer tipo de aplicação.',
      'Minha vocação pra área parte desde a infância, onde já era fascinado por hacking. E hoje, minha vida é mais ou menos assim: pentester de dia, bug hunter de noite (e quase uma pessoa normal nos finais de semana).',
      'Em pouco mais de 1 ano me aprofundando em segurança ofensiva e bug bounty, tive algumas conquistas legais pra mim: entrei pro Top 500 da Intigriti, coleciono alguns Hall of Fames e já alcancei 5 dígitos de recompensas.',
      'Esse blog aqui eu uso pra compartilhar conhecimentos e coisas legais que eu encontro durante minha trajetória na área :)',
    ],
  },
  en: {
    htmlLang: 'en-US',
    ogLocale: 'en_US',
    siteTitle: 'Luq0x',
    siteDescription: "Luq0x's blog: Offensive Security Research",
    tagline: 'security researcher · bug bounty hunter',
    railHome: '東京',
    railWriteups: '記録',
    railAbout: '経歴',
    navPrimary: 'Main navigation',
    navWriteups: 'Writeups',
    navAbout: 'About',
    latestBounties: 'Latest bounties',
    allWriteups: 'See all writeups',
    latestWriteups: 'Latest writeups',
    writeupsTitle: 'Writeups',
    writeupsDescription: 'Bug bounty reports, boxes and labs.',
    writeupsIntro: 'boxes, labs and bug bounty programs.',
    postSingular: 'post',
    postPlural: 'posts',
    filterHeading: 'Filter by tag',
    filterAll: 'All',
    loadMore: 'Load more',
    emptyTag: 'No writeups with that tag yet.',
    emptyList: 'No writeups published yet.',
    readingTime: 'min read',
    updatedOn: 'Updated on',
    previous: 'Previous',
    next: 'Next',
    backToWriteups: 'Writeups',
    aboutTitle: 'About',
    aboutDescription: 'Who I am, what I work on and what I like to break.',
    certifications: 'Certifications',
    notFoundTitle: 'This page does not exist',
    notFoundBody: 'The address is wrong or the content moved.',
    backHome: 'Back home',
    skipToContent: 'Skip to content',
    otherWriteups: 'Other writeups',
    bio: [
      "Hey! I'm Lucas, also known as Luq. I'm 23, Brazilian, and obsessed with hacking.",
      'I currently work as a pentester focused on Web, API and Mobile. In my free time, I work as a bug hunter and security researcher, digging into pretty much any kind of application.',
      "My drive for this comes from childhood — I've been fascinated by hacking since I was a kid. My life today is basically: pentester by day, bug hunter by night (and almost a normal person on weekends).",
      "In just over a year deep-diving into offensive security and bug bounty, I've landed some achievements I'm proud of: breaking into the Intigriti Top 500, collecting some Hall of Fames, and hitting 5-figure rewards.",
      'I use this blog to share knowledge and cool stuff I come across along the way :)',
    ],
  },
} as const;

export type Strings = (typeof strings)[Locale];

export function t(lang: Locale): Strings {
  return strings[lang];
}