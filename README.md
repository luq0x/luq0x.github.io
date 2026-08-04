# luq0x

Site pessoal estático em [Astro](https://astro.build): home no formato cartão de
visita, ticker dos últimos bounties e um blog de writeups em **pt-BR e en-US**.
Sem backend e sem JavaScript de framework no cliente.

```
npm install
npm run dev      # http://localhost:4321
npm run build
npm run preview
npm run check
```

Requer Node 22.12 ou superior.

## Rotas

| Página     | pt-BR              | en-US                 |
| ---------- | ------------------ | --------------------- |
| Home       | `/`                | `/en`                 |
| Writeups   | `/writeups`        | `/en/writeups`        |
| Post       | `/writeups/[slug]` | `/en/writeups/[slug]` |
| Sobre      | `/about`           | `/en/about`           |
| RSS        | `/rss.xml`         | `/en/rss.xml`         |

A 404 é bilíngue e única, porque o GitHub Pages só serve um `404.html`.

## Antes do primeiro deploy

**1. `astro.config.mjs`** — `SITE` e `BASE` no topo do arquivo:

| Cenário                                     | `SITE`                       | `BASE`    |
| ------------------------------------------- | ---------------------------- | --------- |
| Repo `luq0x.github.io` ou domínio próprio   | `'https://luq0x.github.io'`  | `'/'`     |
| Repo de projeto `luq0x.github.io/blog`      | `'https://luq0x.github.io'`  | `'/blog'` |

**2. `src/config.ts`** — perfil, redes sociais, bounties, stack e certificações.

**3. `src/i18n/index.ts`** — todo o texto de interface e a bio, nos dois idiomas.

**4. `public/`** — troque `avatar.svg` pelo seu ícone do Kaneki (se for `.png` ou
`.jpg`, atualize `profile.avatar` no `config.ts`), além de `favicon.svg`,
`og.png` e o domínio em `robots.txt`.

**5. GitHub Pages** — em *Settings → Pages*, escolha **GitHub Actions** como
fonte. Push na `main` dispara o workflow.

Para domínio próprio, crie `public/CNAME` com o domínio dentro e deixe `BASE` como `'/'`.

## Escrever um writeup

Um arquivo por idioma, **mesmo nome de arquivo nos dois**:

```
src/content/writeups/pt-br/htb-latch.md   ->  /writeups/htb-latch
src/content/writeups/en/htb-latch.md      ->  /en/writeups/htb-latch
```

O nome igual é o que liga as duas versões: o seletor PT/EN dentro do post pula
direto para a tradução. Se ela não existir, o seletor cai na listagem daquele
idioma — ou seja, dá para publicar só em inglês sem quebrar nada.

```yaml
---
title: 'HTB: Latch — SSRF no gerador de PDF até root'
summary: 'Uma linha, aparece na listagem, no RSS e nas meta tags.'
pubDate: 2026-05-18
tags: ['Web', 'SSRF', 'PrivEsc']
platform: 'HackTheBox' # HackTheBox | TryHackMe | Bug Bounty | CTF | Lab | Research
difficulty: 'Medium' # opcional: Easy | Medium | Hard | Insane
author: 'Nome' # opcional, coautoria
readingTime: 12 # opcional, sobrescreve o cálculo automático
draft: false # true esconde do build de produção
---
```

O schema é validado no build. Campo errado quebra o build em vez de virar post
torto em produção. O tempo de leitura sai do texto, com código pesando menos que
prosa.

## Bounties da home

O ticker lê o array `bounties` em `src/config.ts`, de cima para baixo:

```ts
{ program: 'Acme Cloud', type: 'Account Takeover', severity: 'Critical', reward: '$5,000', date: '2026.06' }
```

`severity` aceita `Critical`, `High`, `Medium` e `Low` — muda só a cor do ponto.
A animação é CSS puro, pausa no hover e some inteira em
`prefers-reduced-motion`. Com array vazio, a seção não é renderizada.

Os seis bounties que vêm no repositório são fictícios. Troque antes de publicar.

## Identidade

Preto `#0a0a0a`, off-white `#f2f0ee`, vermelho `#e5484d` — o vermelho passa
contraste AA (5:1) sobre o preto, então serve para link e não só para
decoração. Inter no texto, JetBrains Mono em todo metadado, Zen Kaku Gothic New
nos rótulos japoneses. Tudo em `src/styles/global.css`, no bloco `@theme`.

A régua vertical vermelha cortada à esquerda muda o kanji por seção: 東京 na
home, 記録 nos writeups, 経歴 no sobre. Aparece a partir de 1100px de largura.

Nada aqui reproduz arte, logo ou elemento visual de obra licenciada — a
referência é a paleta e a tipografia, não os assets.

## Fundo

A pixel art (`src/assets/skyline-pixel.png`, 480x65, menos de 1 KB) é uma rua
japonesa em silhueta: fileiras de machiya, um torii, um pagode de três andares,
dois prédios com grade de janelas e postes com fiação entre eles. Silhueta
chapada, sem textura interna — é o que segura o clean.

Ela fica ancorada no rodapé da viewport com largura de 100%, o que dá 25 a 30%
de altura de tela. Nunca chega perto da metade.

São duas camadas fixas:

| Camada             | O que faz                                                          |
| ------------------ | ------------------------------------------------------------------ |
| `.wallpaper-glow`  | Brilho de horizonte: clareia o rodapé de `#191918` para `#201f1d`   |
| `.wallpaper`       | As construções, preto puro, `image-rendering: pixelated`            |

O brilho existe por um motivo: preto sobre fundo escuro é fisicamente pouco
contrastante. Sem ele, as construções somem. Com ele, o skyline aparece como
uma silhueta de noite — que é exatamente como um horizonte real se comporta, com
o céu mais claro que os prédios perto da linha do chão.

O brilho para em `#201f1d` de propósito, e não mais claro: acima disso o
vermelho dos links deixa de passar AA sobre ele.

Trocar a arte é substituir o PNG. Abaixo de 4 KB ele é embutido como data URI no
build, então não vira requisição extra. Para deixar só na home, mova as duas
`<div>` do `BaseLayout.astro` para o `HomeView.astro`. Somem em
`prefers-contrast: more`.

## Identidade

Fundo `#191918`, tinta `#eceae7`, vermelho `#ef4d53`. O fundo é carvão e não
preto puro: é o que permite as construções em preto aparecerem, e cansa menos a
vista em leitura longa.

Contraste medido no pior caso, texto sobre a parte mais clara do brilho:

| | sobre o fundo | sobre o brilho |
|---|---|---|
| texto | 14.6:1 | 13.6:1 |
| secundário | 7.1:1 | 6.6:1 |
| metadados | 5.0:1 | 4.6:1 |
| vermelho | 4.9:1 | 4.5:1 |

Inter no texto, JetBrains Mono em todo metadado, Zen Kaku Gothic New nos rótulos
japoneses. Tudo no bloco `@theme` do `src/styles/global.css`.

O acento entra pelo próprio nick: `luq` em tinta, `0x` em vermelho. As barras `/`
que separam metadados também são vermelhas e viraram o separador padrão do site.

A régua vertical vermelha cortada à esquerda muda o kanji por seção: 東京 na
home, 記録 nos writeups, 経歴 no sobre. Aparece a partir de 1100px de largura.

Para inverter para tema claro, troque os oito valores do `@theme`, o
`color-scheme`, o `shikiConfig.theme` no `astro.config.mjs` e o
`.wallpaper-glow`. Nenhum componente precisa mudar — todos usam token.

Nada aqui reproduz arte, logo ou elemento visual de obra licenciada.

## Estrutura

```
src/
├─ config.ts              perfil, redes, bounties, stack
├─ i18n/index.ts          strings dos dois idiomas
├─ content.config.ts      schema dos writeups
├─ content/writeups/
│  ├─ pt-br/
│  └─ en/
├─ lib/
├─ components/
├─ views/                 telas compartilhadas pelos dois idiomas
├─ layouts/
└─ pages/
   ├─ index.astro  about.astro  404.astro  rss.xml.ts
   ├─ writeups/
   └─ en/
```

As páginas em `pages/` são só invólucros que passam o idioma para as telas em
`views/`, então cada layout existe uma vez só.

## Nota

Os writeups em `src/content/writeups/` são fictícios e estão marcados como
exemplo dentro do próprio texto. Apague todos antes de publicar.
