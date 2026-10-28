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
   and show the logo from it. Without it, e-mails have no link and no logo or icon, and Registry logs a warning at
   start.
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

## Branding

Every e-mail (the test e-mail, the [update e-mails](./update-check) and the
[build notifications](#build-notifications)) looks like the Hub of the instance. Registry reads the
[Hub settings](./configuration#hub-ui-customization). There is no separate setting for e-mails.

| Setting | Use in the e-mail | When it is not set or not usable |
|---------|-------------------|----------------------------------|
| `HubOptions.AppName` | The name in the header and in the footer ("Sent by …"), the sender name when `Smtp.FromName` is not set, and `{{appName}}`. | `DroneDB` |
| `HubOptions.AppLogo` | The logo in the header, 40 px high. It must be a PNG, JPEG or GIF file: mail clients block SVG. Give an absolute `https` URL, or a path of the instance such as `/branding/logo.png`. | The icon (next row) |
| `HubOptions.Favicon.AppleTouchIcon`, else `HubOptions.Favicon.Favicon32` | A small icon beside the name in the header. It is used only when there is no PNG, JPEG or GIF logo. | The name as text |
| `HubOptions.Favicon.ThemeColor` | The accent: the bar at the top, the links and the buttons. Only `#rgb` or `#rrggbb` is used. Any other value (a colour name, `rgb()`) is ignored. | The Hub blue `#0070e0` |

* The label of a button is white or near-black, whichever reads better on the accent. A light theme colour still
  gives a readable button.
* Link text must be readable on the white body. When the accent is too light for that (a yellow, for example), links
  use a darker shade of the same colour. The bar and the buttons keep the accent.
* "Failed" is always red, "Waiting for files" is always amber and "Completed" is always green, whatever the accent.
* A stock instance shows the DroneDB logo, which the Hub ships as `/images/email-logo.png`. A stock instance has no
  `AppName`, no `AppIcon`, and no `AppLogo` (or the shipped `/images/logo-banner.svg`). An instance with its own name,
  icon or logo never shows the DroneDB logo. When it has no usable logo or icon, it shows its name as text.
* A path such as `/branding/logo.png` and the DroneDB logo need [`ExternalUrlOverride`](./configuration#externalurloverride).
  Without it, only a logo or icon with an absolute URL can show, and the e-mails have no links.

:::tip A Hub with an SVG logo
The Hub header can keep an SVG `AppLogo`. The e-mails then show the `AppleTouchIcon` beside the name. Put the files
in `{StoragePath}/branding/` (`data/branding/` with the default `StoragePath`) and reference them as `/branding/...`:
that folder survives Hub upgrades.
:::

## Build notifications

Users can get an e-mail when the builds of their files end. A build makes what the Hub shows of a file, for example
the tiles of an orthophoto, a point cloud or a 3D model. Each user chooses in the Hub, in
**Preferences → Notifications** (see [Preferences](../preferences.md#notifications)):

| Setting | The user gets an e-mail for |
|---------|-----------------------------|
| **None** (default) | Nothing |
| **All** | Completed and failed builds, and builds that wait for files |
| **Only failed builds** | Failed builds, and builds that wait for files |

The default is **None**: a user gets no e-mail until they choose a setting.

### Requirements

* E-mail is on (`Smtp.Enabled` is `true`). While it is off, the Hub does not show the **Notifications** tab.
* The account has a valid e-mail address and is not deactivated. Users cannot change their own address in the Hub:
  an administrator sets it (see [Updating Users](./user-management#updating-users)). Without an address, the Hub
  disables the setting and says why.
* [`ExternalUrlOverride`](./configuration#externalurloverride) is set. The e-mail links to the dataset and to the
  notification settings, and shows the logo, only with it. Without it, the e-mail is still sent, without links and
  logo.

### When an e-mail is sent

Registry e-mails the user who asked for the build:

* A build of a file that the user uploaded or asked to build again goes to that user.
* A build of a file that a task made (for example the files extracted from an archive) goes to the user who started
  the task.
* An automatic retry goes to the user whose build failed.
* The build that runs when the missing files of a build arrive goes to the user whose build waited for them (see
  [Builds that wait for files](#builds-that-wait-for-files)).

Other builds that Registry starts by itself, such as a rescan or a check of the built files, send no e-mail.

A failed build is in an e-mail only when the failure is final. When Registry retries a build automatically (for
example after a lack of disk space or a tool timeout), nothing is sent until the retries give up. When a retry
succeeds, a user with **All** gets a "Completed" line. A user with **Only failed builds** gets nothing.
After the retries of a failed build give up, the check of pending builds
([`ProcessPendingBuildsCron`](./configuration#processpendingbuildscron), every 6 hours) can still build the file later:
then a user with **All** gets a "Completed" line too.

Builds are grouped. The first build of a user that ends starts a wait of
[`BuildNotifications.DigestMinutes`](./configuration#buildnotifications) (5 minutes by default). When the wait ends,
one e-mail lists every build of that user that ended during it. A build that ends later goes into the next e-mail.

* Before it sends, Registry reads the setting of the user again. When the user chose **None** in the meantime,
  nothing is sent. When they chose **Only failed builds**, the completed builds are left out.
* The e-mail goes out through the background job of [Delivery and retries](#delivery-and-retries).
* When Registry stops before a wait ends, the daily job history cleanup
  ([`JobIndexCleanupCron`](./configuration#jobindexcleanupcron)) sends the builds that wait for more than one hour. It
  also deletes the record of the sent builds after 30 days. The record of a build that still waits for files is kept
  until that build ends or its dataset is deleted. When this job is turned off, none of this happens.
* A build ends on the host that runs it. In a deployment with processing nodes, every node needs the same `Smtp`
  settings (see [Turn on e-mail](#turn-on-e-mail)).

### Builds that wait for files

A build waits for files when a file it needs is not in the dataset, for example the `.mtl` of an `.obj`, a texture of
the `.mtl`, or the `.shx` or `.dbf` of a `.shp`. The build has not failed and is not retried on a timer: it runs at
once when a file with one of the missing names is added to the dataset (an upload, a push, a move, a copy, a transfer,
or the files of a task).

* The first time a build of a file finds files missing, the user who asked for it gets a "Waiting for files" line with
  the missing names, relative to the dataset (for example `Missing: flight-3/model.mtl, flight-3/texture.png`). Users
  with **All** or **Only failed builds** get it.
* It is sent once for the same content of the file. Later builds of it that find files missing (a rebuild, the build
  that the upload of only some of the missing files starts, a build that another user asks for) send nothing. Every
  host shares this record in the Registry database, so a restart or a second host does not send it again.
* When the files arrive, Registry builds the file as the build service. The end of that build goes to the user whose
  build waited: "Completed" for a user with **All**, "Failed" for a user with **All** or **Only failed builds**. The
  user's setting at the end of that build decides, also when they had **None** while the build waited.
* When the files arrive before the e-mail of the wait is sent, the e-mail tells only how the build ended.
* After the build has ended, a new wait of the same content (for example after a missing file is deleted and the file
  is built again) is news again.

### Edit the e-mail

In the Hub, open **Admin → Configuration**. The **E-mail templates** card is there when e-mail is on. It shows the
**Subject** and the **Body** of the e-mail, and a **Default** or **Custom** tag.

* Click a placeholder to insert it at the cursor of the field you were in. The placeholders that only the body can use
  are disabled while the cursor is in the subject.
* **Preview** shows the text that is not saved yet with three sample builds: one completed, one failed and one that
  waits for files. It uses the
  real layout and [branding](#branding), so it shows what a user gets: the subject, the HTML and the plain text.
* **Send me a test** sends the same sample to the e-mail address of your account, at once. Your account needs an
  address.
* **Reset to default** removes the saved text, after you confirm. The built-in text is used again.
* **Save** saves the text. A text with an error is refused, with a message that names the problem, for example
  `Unknown placeholder {{foo}} in the body`.

Registry keeps the saved text in `{StoragePath}/.email-templates.json`, which all hosts share.

The built-in text:

```text title="Subject"
{{appName}}: {{summary}}
```

```text title="Body"
Hello {{user}},

{{summary}} on {{appName}}.

{{builds}}

{{link}}

To change which build e-mails you get, open your notification settings: {{preferencesLink}}
```

### Placeholders

| Placeholder | Value | In the subject |
|-------------|-------|----------------|
| `{{appName}}` | The application name (see [Branding](#branding)) | Yes |
| `{{user}}` | The name of the user | Yes |
| `{{summary}}` | The counts in words, for example `2 builds failed, 1 waiting for files, 3 completed` | Yes |
| `{{failedCount}}` | The number of failed builds | Yes |
| `{{waitingCount}}` | The number of builds that wait for files | Yes |
| `{{completedCount}}` | The number of completed builds | Yes |
| `{{datasets}}` | The datasets of the builds, as `organization/dataset`, separated by commas | Yes |
| `{{builds}}` | The list of the builds, with the reason of each failure and the missing files of each build that waits | No |
| `{{link}}` | A link to the dataset, or to the Hub when the builds are in more than one dataset | No |
| `{{preferencesLink}}` | A link to the notification settings of the user, to change or stop these e-mails | No |

Names are case-sensitive: write `{{appName}}`, not `{{appname}}`. Spaces inside the braces are allowed
(`{{ user }}`).

### How the text is rendered

Registry makes an HTML part and a plain-text part from the same text.

* The body is plain text. A blank line starts a paragraph. A single line break is a line break. Spaces at the start
  and at the end of a line are removed.
* Registry escapes every value and every word of the text in the HTML part. The text cannot add HTML, styles or
  scripts: `<b>` shows as `<b>`.
* `{{builds}}` is a block of its own and ends the paragraph around it. In HTML it is a table with the dataset (a link
  to it), the file with the reason of a failure or the missing files under it, and the result. In plain text it is a
  list, for example `- Failed: flight-2/cloud.laz (demo/survey-2026)` with `Reason: …` on the next line, or
  `- Waiting for files: flight-3/model.obj (demo/survey-2026)` with `Missing: …` on the next line. Failed builds come
  first, then the builds that wait for files, then the completed builds, each in the order they ended.
* `{{link}}` alone in its paragraph is a button: **Open the dataset**, or **Open** and the application name when the
  builds are in more than one dataset. In a sentence, `{{link}}` and `{{preferencesLink}}` are links that show the
  address. In plain text, they are the address.
* Only `http` and `https` addresses become links.
* Without [`ExternalUrlOverride`](./configuration#externalurloverride) there are no links. A paragraph that uses
  `{{link}}` or `{{preferencesLink}}` is then left out of the e-mail, with all its words. Put each link in a paragraph
  with only the words that belong to it.
* The subject is one line: line breaks and runs of spaces become one space.

Registry refuses a text when:

* the subject or the body is empty;
* the subject is longer than 200 characters, or the body longer than 16384 characters;
* a `{{` has no `}}`;
* a placeholder is not in the table above;
* the subject uses a placeholder that only the body can use.

A saved text that a newer Registry no longer accepts (for example one with a placeholder that was removed) is not
used. Registry sends the built-in text and logs a warning, and the card shows the built-in text. Edit the text and
save it again.

### API

The card uses these endpoints. All of them are for administrators only (`403` for other users). The template name is
`build-notification`.

| Method | Endpoint | Body | Answer |
|--------|----------|------|--------|
| GET | `/sys/email/templates` | — | The templates: `name`, `title`, `isDefault` |
| GET | `/sys/email/templates/{name}` | — | `subject`, `body`, `isDefault`, `defaultSubject`, `defaultBody` and the `placeholders` (`name`, `description`, `inSubject`). `404` for an unknown name |
| PUT | `/sys/email/templates/{name}` | `{"subject", "body"}` | Checks and saves the text; answers like GET. `400` names the problem |
| DELETE | `/sys/email/templates/{name}` | — | Removes the saved text; answers like GET, with `isDefault: true` |
| POST | `/sys/email/templates/{name}/preview` | `{"subject", "body"}` | The text (not saved) with the sample builds: `{"subject", "text", "html"}`. `400` names the problem |
| POST | `/sys/email/templates/{name}/test` | `{"subject", "body"}` | Sends the sample to the calling administrator. The answers are those of [the test e-mail](#test-the-settings); `400` also when the account has no valid address |

A user reads their own status with `GET /users/notifications/status`:
`{"canReceiveEmail": true, "reason": null}`. The `reason` is `emailDisabled` (e-mail is off), `noAddress` (the
account has no valid address) or `null`. The setting itself is the `builds` field of the `notifications` section of
`/users/preferences`: `none`, `all` or `failed`. A missing or unknown value is `none`. `PATCH /users/preferences`
refuses (`400`) any other field or value in that section.
