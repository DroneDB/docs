---
sidebar_position: 5
sidebar_label: Preferences
description: The Preferences window of the DroneDB Hub, and the e-mails about your builds
---

# Preferences

In the Hub, open the user menu at the top right and click **Preferences**. The window has one tab for each group of
settings:

| Tab | Settings |
|-----|----------|
| **Units** | Metric or imperial measurement units |
| **Map** | The default basemap, the flight path and the direction indicators, and the custom basemap |
| **Files** | The default view of the files (grid or table) and the sort order |
| **Lists** | How many datasets and organizations a page shows |
| **Viewers** | The navigation mode and the quality of Gaussian splats, and the lighting of the 3D viewers |
| **Notifications** | The e-mails about your builds (only on a server that sends e-mail) |

Your settings belong to your account: they are the same on every device where you sign in. **Reset section** puts
the settings of the tab back to their defaults.

## Viewers

The **Viewers** tab has the settings of the Gaussian splat viewer and the lighting of the 3D viewers.

| Setting | Values | What it does |
|---------|--------|--------------|
| **Navigation mode** (Gaussian splats) | **Fly** (default), **Earth** | How the camera moves when a splat opens. See [Navigation](/docs/features/gaussian-splat#navigation) |
| **Quality** (Gaussian splats) | **Auto** (default), **Low**, **Medium**, **High** | How much detail the splat viewer draws: colour detail, level of detail and sharpness. Auto lowers the detail on a slow device and raises it again when there is room. See [Quality](/docs/features/gaussian-splat#quality) for what each preset changes |

The quality can also be changed in the view settings of the splat viewer (the gear button); it is the same setting.

## Notifications

The server can e-mail you when the builds of your files end. A build makes what the Hub shows of a file, for example
the tiles of an orthophoto, a point cloud or a 3D model.

Choose **Send build notifications**:

| Value | You get an e-mail for |
|-------|-----------------------|
| **None** (default) | Nothing |
| **All** | Builds that completed and builds that failed |
| **Only failed builds** | Builds that failed, with the reason |

The default is **None**. You get no e-mail until you choose **All** or **Only failed builds**.

Builds that end close together share one e-mail. [When an e-mail is sent](./admin/email.md#when-an-e-mail-is-sent)
says which builds count and how they are grouped.

* The tab is there only when the server sends e-mail.
* The setting is disabled when your account has no e-mail address. The window says so. You cannot add an address
  yourself: ask an administrator to add one.
* The e-mail has a link to your notification settings. It opens this tab, after you sign in if needed. Choose
  **None** to stop the e-mails.

A link to any Hub page with `?preferences=notifications` at the end of the address opens this tab too.
