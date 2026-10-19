# Mail setup — NOIR & BEAN

**What it does:** when a visitor places an order, subscribes to the newsletter or posts a review,
you get an email at **s93122228@gmail.com**.

```
Browser (js/script.js) → Netlify Function (netlify/functions/send-mail.js) → Resend → your Gmail
```

The Function holds the secret API key on the server, so nobody can steal it from the page source.

## Do these once

1. **Create a Resend account** at https://resend.com using **s93122228@gmail.com**
   (use this exact address — on the free plan Resend only delivers to the email you signed up with).
   Confirm the verification email.
2. **Create an API key:** Resend dashboard → *API Keys* → *Create API Key* → permission *Sending access* →
   copy the key (starts with `re_`). It is shown only once.
3. **Put the project on Netlify using Git** (reliable way to deploy Functions):
   upload this folder to a GitHub repository (the `.gitignore` is already set), then on Netlify choose
   *Add new project → Import an existing project → GitHub* and pick the repo. Leave build settings empty;
   `netlify.toml` already says what to do.
4. **Add the key to Netlify:** Project configuration → *Environment variables* → *Add a variable*
   - Key: `RESEND_API_KEY`  Value: the `re_...` key
   - Key: `RECEIVER_EMAIL`  Value: `s93122228@gmail.com` (optional, this is the default)
5. **Redeploy:** Deploys → *Trigger deploy → Deploy project without cache*.
   (Variables only apply to new deploys.)
6. **Test on your live site:** subscribe with any email. Within a minute an email titled
   *"New newsletter subscriber"* should arrive. **Check Spam** the first time and click *Not spam*.

## If nothing arrives

| Symptom | Fix |
|---|---|
| Site says "Mail service is not connected yet" | The function isn't deployed or the key is missing. Netlify → *Logs → Functions → send-mail*. |
| Function log says `missing RESEND_API_KEY` | Add the variable (step 4) and redeploy (step 5). |
| Log says `403` / "only send testing emails to your own address" | You signed up to Resend with a different email than the receiver. Use the same address in both. |
| Nothing in Gmail | Check Spam, then Resend dashboard → *Logs* to see whether it was sent. |

## Limits and next steps

- Free plan + `onboarding@resend.dev` can only email **you**. To email **customers** (order confirmations),
  buy/own a domain, verify it in Resend (*Domains*), set `MAIL_FROM` to e.g.
  `Noir & Bean <orders@yourdomain.com>`, and add a customer-confirmation email to the function.
- Resend's free plan has daily/monthly sending caps — check resend.com/pricing for current numbers.
- The function already rejects bad input, blocks HTML injection, always sends to the fixed receiver,
  and limits repeated requests. It can't stop a determined attacker; add a CAPTCHA later if spam appears.
- Never put the API key in `script.js`, `index.html` or GitHub. Rotate it in Resend if it ever leaks.
