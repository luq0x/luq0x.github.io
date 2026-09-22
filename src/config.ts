export const profile = {
  name: 'luq0x',
  short: 'luq',
  location: 'BRAZIL',
  avatar: '/icon.jpeg',
  photo: '/photo.jpg',
  ogImage: '/og.png',
};

export const socials = [
  { label: 'GitHub', icon: 'github', href: 'https://github.com/luq0x' },
  {
    label: 'Intigriti',
    icon: 'intigriti',
    href: 'https://app.intigriti.com/researcher/profile/luq0x',
  },
  { label: 'HackerOne', icon: 'hackerone', href: 'https://hackerone.com/luq0x' },
  { label: 'Bugcrowd', icon: 'bugcrowd', href: 'https://bugcrowd.com/h/luq0x' },
  { label: 'X', icon: 'x', href: 'https://x.com/luq0xss' },
  {
    label: 'LinkedIn',
    icon: 'linkedin',
    href: 'https://www.linkedin.com/in/lucas-goncalo-de-morais/',
  },
  { label: 'E-mail', icon: 'email', href: 'mailto:luq0x@proton.me' },
] as const;

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export const bounties: {
  program: string;
  type: string;
  severity?: Severity;
  reward: string;
  date: string;
  href?: string;
}[] = [
  {
    program: 'Private',
    type: 'Account Takeover',
    severity: 'Critical',
    reward: '€700',
    date: '2026.09.21',
  },
  {
    program: 'Private',
    type: 'Account Takeover',
    reward: '€300',
    date: '2026.07.15',
  },
  {
    program: 'Private',
    type: 'Path Traversal',
    reward: '€300',
    date: '2026.07.15',
  },
  {
    program: 'Private',
    type: 'Path Traversal',
    reward: '€300',
    date: '2026.05.29',
  },
  {
    program: 'Private',
    type: 'MFA Bypass',
    reward: '€1,400',
    date: '2026.05.27',
  },
  {
    program: 'Private',
    type: 'Reflected XSS',
    reward: '€187.50',
    date: '2026.05.22',
  },
  {
    program: 'Private',
    type: 'Reflected XSS',
    reward: '€187.50',
    date: '2026.05.22',
  },
  {
    program: 'Private',
    type: 'HTML Injection',
    reward: '€150',
    date: '2026.05.22',
  },
  {
    program: 'Private',
    type: 'AVS Bypass',
    reward: '€800',
    date: '2026.05.04',
  },
  {
    program: 'Private',
    type: 'ATO via Chained IDOR',
    reward: '€1,125',
    date: '2026.04.15',
  },
  {
    program: 'Private',
    type: 'Account Takeover',
    reward: '€975',
    date: '2026.04.02',
  },
  {
    program: 'Coveo',
    type: 'RCE',
    severity: 'Critical',
    reward: '$150',
    date: '2026.02.27',
  },
  {
    program: 'Private',
    type: 'Reflected XSS',
    reward: '€975',
    date: '2026.02.11',
  },
  {
    program: 'Private',
    type: 'Cache Deception',
    reward: '€1,400',
    date: '2026.01.16',
  },
  {
    program: 'SBB',
    type: 'Code Injection',
    reward: '€400',
    date: '2026.01.07',
    href: 'https://app.intigriti.com/researcher/program-redirect/sbb/sbbglobal',
  },
  {
    program: 'Private',
    type: 'Chained IDOR',
    reward: '€1,875',
    date: '2025.11.07',
  },
  {
    program: 'Private',
    type: 'IDOR',
    reward: '€975',
    date: '2025.10.27',
  },
];

export const stack = [
  {
    key: 'focus',
    items: ['Web application pentest', 'API security', 'Bug bounty', 'Source code review'],
  },
  { key: 'languages', items: ['Python', 'Go', 'Bash', 'JavaScript'] },
  { key: 'tools', items: ['Burp Suite', 'ffuf', 'nuclei', 'httpx', 'sqlmap', 'BloodHound'] },
];

export const certifications = [
  { name: 'eWPTX', issuer: 'INE', year: '2025' },
  { name: 'eJPT', issuer: 'INE', year: '2025' },
];
