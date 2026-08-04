---
title: 'De um simples ID randômico para um Mass PII Leak'
summary: '...'
pubDate: 2026-06-19
tags: ['Web', 'IDOR']
platform: 'Bug Bounty'
severity: 'High'
reward: '€1,875'
cover: '../../assets/writeups/masspii-cover.png'
coverAlt: 'Diagrama da chain de IDOR'
draft: false
---
 
Fala, hackers!

Neste write-up, vou apresentar uma **Chain de IDORs (Insecure Direct Object References)** que resultou em um vazamento massivo de dados (PII), permitindo que qualquer pessoa não autenticada enumerasse o carrinho e até as coordenadas GPS de clientes de um grande e-commerce.

Naquela semana, eu estava focado em um programa privado que pagava bem, onde eu já havia tido um report de IDOR aceito. Então, voltei para a aplicação com o intuito de testar tudo novamente (re-testing) para ver se não havia deixado nada passar. No background, como de costume, deixei o **Autorize** rodando para localizar falhas de quebra de controle de acesso (BAC), já que essa aplicação usava muitos UUIDs (aqueles identificadores longos e aleatórios, tipo `e42537c4-ed24...`) e essa extensão facilitaria a identificação das falhas.

Depois de explorar várias funcionalidades do e-commerce, decidi checar a aba do Autorize. E lá estavam eles: vários endpoints marcados em vermelho como **"Bypassed!"** (Vulnerável).

O primeiro endpoint que chamou minha atenção foi uma requisição de detalhes do pedido, que eu não havia encontrado anteriormente:

```
GET /api/v1/order/1282195843801/details HTTP/2
```

Essa requisição tinha uma peculiaridade técnica muito interessante:

- Se eu enviasse **sem Cookies** de sessão: Retornava **Bypassed!** (200 OK).
- Se eu enviasse **com Cookies** de outro usuário: Retornava **Enforced!** (404 Not Found).

Ou seja, a API associava a sessão com o número do pedido, mas estava totalmente exposta para usuários não autenticado.
A resposta vazava IDs internos como:

```
{
  "orderId": "1234567890",
  "regionId": "9138094d-f307-46aa-a62d-86c8bdaeb4b9",
  "destinationId": "e84ecdc0-968a-4c71-bef7-e7ff0e803e6d",
}
```

Isoladamente, esse endpoint não demonstrava impacto imediato e nem servia para ser reportado. Mas, estes IDs retornados aparentavam um forte vetor de encadeamento.

Voltando à aba do Autorize, procurei por qualquer outro endpoint que tivesse retornado "Bypassed!" e que utilizasse algum dos IDs retornados. E encontrei este aqui:

```
GET /api/v1/customer/sessions/active?regionId=9138094d-f307-46aa-a62d-86c8bdaeb4b9 
```

Desta vez, o endpoint permitia a enumeração tanto sem cookies quanto com cookies de terceiros. E novamente, não demonstrava impacto imediato e nem servia para ser reportado. Porém, a resposta me forneceu um ID novo:

```
{
  "cartId": "e42537c4-ed24-49fd-89e8-849f0c180111",
  "regionId": "9138094d-f307-46aa-a62d-86c8bdaeb4b9",
  "type": "ORDER_EDIT",
  "orderId": "1234567890",
  ...
}
```

Veja o ID precioso que retornou: o `cartId` associado à sessão do usuário dono do pedido inicial. Agora, a única coisa que faltava era encontrar onde usar esse ID.

No Autorize mais uma vez, notei um endpoint óbvio que eu tinha deixado passar batido na minha primeira exploração a este escopo. Ele recebia justamente um ID de carrinho e estava marcado como **Bypassed!**.

```
GET /api/v1/carts/e42537c4-ed24-49fd-89e8-849f0c180111 HTTP/2
```

Adivinha a resposta? 
Um JSON massivo contendo PII (Informações Pessoais Identificáveis) significativas:

- Nickname;
- Endereço residencial completo;
- Código Postal;
- **Coordenadas de GPS exatas** (Latitude/Longitude);
- Horários de acesso da sessão;
- E mais algumas informações minimamente interessantes.

E basicamente, para obter todas essas informações, um atacante deveria apenas manipular o número de pedido no endpoint de detalhes do pedido.

Lições aprendidas?

1. **Não subestime respostas parciais:** Um vazamento de ID "inútil" pode ser a chave para um bug mais relevante.
    
2. **Use ferramentas, mas use o cérebro:** O Autorize detectou as vulnerabilidades, mas eu tive que enumerar e conectar os pontos manualmente.
    
3. **Aprenda a Encadear (Chain):** Bugs encadeados aumentam o impacto e a recompensa.

**Timeline:**

- Reportado: 27/10/2025
    
- Triado: 04/11/2025
    
- Aceito: 05/11/2025
    
- Severidade: Alta

Keep Hacking!