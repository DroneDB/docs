---
sidebar_position: 6
sidebar_label: E-mail
---

# E-mail

Registry can send e-mail through an SMTP server. E-mail is off by default. While it is off, every e-mail Registry
would send is written to the log and dropped, and Registry works as before.

## Turn on e-mail

Add the `Smtp` section to `AppSettings` in `appsettings.json` (all keys: [Configuration Reference](./configuration#smtp)):

```json
"Smtp": {
  "Enabled": true,
  "Host": "smtp.example.com",
  "Port": 587,
  "Security": "StartTls",
  "UserName": "registry@example.com",
  "FromAddress": "registry@example.com",
  "FromName": "Acme Drone Data"
}
```

Then:

1. Set the password. Do not write it in `appsettings.json`: set the environment variable
   `AppSettings__Smtp__Password` instead.
2. Set [`ExternalUrlOverride`](./configuration#externalurloverride) to the public URL of Registry. E-mails link to it
   and show the logo from it. Without it, e-mails have no link and no logo, and Registry logs a warning at start.
3. Restart Registry. The start-up log shows `E-mail: smtp.example.com:587 (StartTls)`.
4. Send a test e-mail (see [Test the settings](#test-the-settings)).

Registry checks the section when it starts. A missing `Host` or `FromAddress`, an address that is not valid, or a
`UserName` without a `Password` stops Registry with a message that names the key. To check a file without
starting Registry, run `Registry.Web <storage folder> --check`.

:::warning Every Registry host needs the settings
A request queues an e-mail, and the host that runs background jobs sends it. In a deployment with processing nodes,
every node must have the same `Smtp` settings and password. In the Docker Compose deployment, all services read the
same `appsettings.json`. Set `AppSettings__Smtp__Password` on every service. A queued e-mail that reaches a host with
e-mail off fails in the Hangfire dashboard with the reason. Requeue it after you fix the settings.
:::

## Connection security

| `Security` | Port | Use it for |
|------------|------|------------|
| `StartTls` (default) | 587 | Most providers. The connection is upgraded with STARTTLS. If the server does not offer STARTTLS, the send fails: Registry never falls back to clear text. |
| `SslOnConnect` | 465 | Providers that use TLS from the first byte ("SMTPS"). |
| `None` | 25 | Only a relay on the same host or on a trusted private network (for example a local Postfix). |

`ValidateServerCertificate` is `true` by default. Set it to `false` only for a test server with a self-signed
certificate. Even then, the certificate must be for the configured `Host`.

## Examples

**A provider with STARTTLS (port 587):**

```json
"Smtp": {
  "Enabled": true,
  "Host": "smtp.provider.example",
  "Port": 587,
  "Security": "StartTls",
  "UserName": "apikey-or-user",
  "FromAddress": "no-reply@your-domain.example"
}
```

**A provider with SSL on connect (port 465):**

```json
"Smtp": {
  "Enabled": true,
  "Host": "smtp.provider.example",
  "Port": 465,
  "Security": "SslOnConnect",
  "UserName": "user@your-domain.example",
  "FromAddress": "user@your-domain.example"
}
```

**A local relay without login:**

```json
"Smtp": {
  "Enabled": true,
  "Host": "localhost",
  "Port": 25,
  "Security": "None",
  "FromAddress": "registry@your-domain.example"
}
```

:::tip
Many providers accept only a `FromAddress` on a domain you have verified with them (SPF and DKIM records). If the test
e-mail is refused with a 5xx reply that mentions the sender, verify the domain with the provider.
:::

## Test the settings

An administrator can send a test e-mail. It uses the current settings and waits for the server's answer:

```bash
curl -X POST https://registry.example.com/sys/email/test \
  -H "Authorization: Bearer <admin token>" \
  -H "Content-Type: application/json" \
  -d '{"to": "you@example.com"}'
```

| Answer | Meaning |
|--------|---------|
| `204` | The server accepted the e-mail. |
| `400` | E-mail is off, or the address is not valid. |
| `502` | The server refused the e-mail or could not be reached. The `detail` of the answer gives the server's reply, for example `The mail server smtp.example.com:587 replied 535: authentication failed`. |

## Clients

`GET /sys/features` (no sign-in needed) has `emailEnabled`: `true` when the server sends e-mail. The Hub and other
clients read it to hide or disable what needs e-mail (for example an invitation or a "send me a reset link" form) on
a server where e-mail is off. It shows nothing else of the settings.

## Health check

When e-mail is on, the health report (`/health`) has an `SMTP health check` entry. It connects to the server and logs
in, but sends nothing.

* A failure shows as **Degraded**, not Unhealthy. Registry works without e-mail, so a mail outage does not make an
  orchestrator restart it.
* The result is kept for 5 minutes. A monitor that polls `/health` often does not log in to the provider each time,
  which some providers rate-limit or block.

## Delivery and retries

Registry sends most e-mails through a background job (Hangfire, `default` queue):

* When the server cannot be reached, times out or answers "try again later" (a 4xx reply), the job tries again 5
  times. The waits are 1 minute, 5 minutes, 15 minutes, 1 hour and 3 hours.
* When the server refuses the e-mail for good (a 5xx reply, a refused login, a certificate that does not validate),
  the job fails at once. The Hangfire dashboard shows the reason.

The log records each e-mail with its message id, the number of recipients and their domains, never the full
addresses.
