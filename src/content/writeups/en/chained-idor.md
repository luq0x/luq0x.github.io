---
title: 'From a Simple Random ID to a Mass PII Leak'
summary: 'A chain of IDORs that resulted in a massive PII leak, from names to GPS coordinates of a major e-commerce platform''s customers'
pubDate: 2026-06-19
tags: ['Web', 'IDOR']
platform: 'Bug Bounty'
severity: 'High'
reward: '€1,875'
draft: false
---

What's up, hackers!

In this write-up, I'll walk through a **chain of IDORs (Insecure Direct Object References)** that led to a massive PII (Personally Identifiable Information) leak, allowing any unauthenticated user to enumerate carts and even exact GPS coordinates belonging to customers of a major e-commerce platform.

That week, I was focused on a private program that paid well, where I'd already had an IDOR report accepted. So I went back to the application to re-test everything and make sure I hadn't missed anything. In the background, as usual, I had **Autorize** running to spot broken access control (BAC) flaws, since this application relied heavily on UUIDs (those long, random identifiers like `e42537c4-ed24...`), and the extension would make it easier to spot issues.

After exploring several features of the e-commerce platform, I checked the Autorize tab. And there they were: several endpoints flagged in red as **"Bypassed!"** (vulnerable).

The first endpoint that caught my attention was an order details request I hadn't come across before:

```
GET /api/v1/order/1282195843801/details HTTP/2
```

This request had a very interesting technical quirk:

- Sent **without session cookies**: returned **Bypassed!** (200 OK).
- Sent **with another user's cookies**: returned **Enforced!** (404 Not Found).

In other words, the API associated the session with the order number, but was completely exposed to unauthenticated users. The response leaked internal IDs like:

```
{
  "orderId": "1234567890",
  "regionId": "9138094d-f307-46aa-a62d-86c8bdaeb4b9",
  "destinationId": "e84ecdc0-968a-4c71-bef7-e7ff0e803e6d",
}
```

On its own, this endpoint had no immediate impact and wasn't even worth reporting. But those returned IDs looked like a strong candidate for chaining.

Back in the Autorize tab, I looked for any other endpoint that had also returned "Bypassed!" and used one of these returned IDs. And I found this one:

```
GET /api/v1/customer/sessions/active?regionId=9138094d-f307-46aa-a62d-86c8bdaeb4b9 
```

This time, the endpoint allowed enumeration both without cookies and with a third party's cookies. And again, it showed no immediate impact and wasn't reportable on its own. But the response gave me a new ID:

```
{
  "cartId": "e42537c4-ed24-49fd-89e8-849f0c180111",
  "regionId": "9138094d-f307-46aa-a62d-86c8bdaeb4b9",
  "type": "ORDER_EDIT",
  "orderId": "1234567890",
  ...
}
```

Look at the precious ID it returned: the `cartId` tied to the session of the user who owned the original order. Now all that was left was to find where this ID could be used.

Back in Autorize once more, I noticed an obvious endpoint I had overlooked during my first pass at this scope. It took a cart ID as a parameter and was flagged as **Bypassed!**.

```
GET /api/v1/carts/e42537c4-ed24-49fd-89e8-849f0c180111 HTTP/2
```

Guess what the response was?

A massive JSON containing significant PII (Personally Identifiable Information):

- Nickname;
- Full home address;
- Postal code;
- **Exact GPS coordinates** (latitude/longitude);
- Session access timestamps;
- And a few other mildly interesting pieces of information.

Basically, to get all of this information, an attacker just needed to manipulate the order number on the order details endpoint.

Lessons learned?

1. **Don't underestimate partial responses:** A seemingly "useless" leaked ID can be the key to a much more relevant bug.

2. **Use tools, but use your brain too:** Autorize flagged the vulnerabilities, but I had to manually enumerate and connect the dots.

3. **Learn to chain:** Chained bugs increase both impact and payout.

**Timeline:**

- Reported: 10/27/2025
- Triaged: 11/04/2025
- Accepted: 11/05/2025
- Severity: High

Keep Hacking!