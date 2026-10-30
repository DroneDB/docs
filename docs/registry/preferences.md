---
sidebar_position: 5
sidebar_label: Preferences
description: The User preferences window of the DroneDB Hub, and the e-mails about your builds
---

# Preferences

In the Hub, open the user menu at the top right and click **Preferences**. The **User preferences** window opens. It
has one tab for each group of settings:

| Tab | Settings |
|-----|----------|
| **Units** | Metric or imperial measurement units, and the currency of prices |
| **Map** | The default basemap and its custom source, the flight path, the direction indicators, and the dataset names on the datasets map |
| **Files** | The default view of the files (grid or table) and the sort order |
| **Lists** | How many datasets and organizations a page shows, and how the organizations are sorted |
| **Viewers** | The navigation mode and the quality of Gaussian splats, and the lighting of the 3D viewers |
| **Stockpiles** | The materials that weigh and price a stockpile |
| **Notifications** | The e-mails about your builds (only on a server that sends e-mail) |

Your settings belong to your account: they are the same on every device where you sign in. **Reset section** puts
the settings of the tab back to their defaults.

## Units and currency

| Setting | Values | What it does |
|---------|--------|--------------|
| **Measurement units** | **Metric** (default), **Imperial** | The units of lengths, areas, volumes, weights and densities in the Hub |
| **Currency** | Any ISO 4217 currency (default **USD**) | The currency of the prices in the Hub, for example the cost of a stockpile. The list has a search box, with the common currencies first |

The currency is a label: a change does not convert the prices. For example, a price of 15 USD becomes 15 EUR.

## Map

| Setting | Values | What it does |
|---------|--------|--------------|
| **Default basemap** | **Satellite** (default), **Hybrid**, **OpenStreetMap**, **Custom** | The basemap of every map. **Custom** draws a tile source of your choice (see below) |
| **Show flight path** | On (default), off | The flight path of the drone on the map |
| **Show direction indicators** | Off (default), on | The direction and speed indicators on the flight path |
| **Show dataset names on the datasets map** | Off (default), on | The names of the datasets under their pins, in the Map view of the Organizations and Datasets pages. The tag button of that map changes the same setting |

### Custom basemap

Choose **Custom** in **Default basemap** to set up the source. The **Custom basemap** fields open under the settings:

1. Select the **Source type**: **XYZ tiles** or **WMS**.
2. Type the **URL**. It must start with `http://` or `https://`. An XYZ URL has the `{z}`, `{x}` and `{y}`
   placeholders, for example `https://tiles.example.com/{z}/{x}/{y}.png`.
3. For a WMS source, click the refresh button next to **Layer**. The Hub reads the layers of the server and selects
   the first one. Select the layer to show, then the **Tile size** (256 × 256 or 512 × 512).
4. Click **Apply**. The Hub loads one tile to check the source. When the tile loads, it saves the source and the maps
   change to it. When the tile does not load, the window shows an error and nothing changes.

The maps keep their basemap until the source is saved. **Clear** removes the source; when **Custom** is selected, the
basemap changes back to **Satellite**.

The map settings of a map (the gear button) have the same fields. A source saved there is the same setting.

## Lists

| Setting | Values | What it does |
|---------|--------|--------------|
| **Sort organizations by** | **Name** (default), **Creation date**, **Last modified**, **Number of datasets** | How the Organizations page sorts its list. See [Sorting](./datasets.md#sorting) |
| **Organizations order** | **Ascending** (default), **Descending** | The direction of that sort |

The sort control on the Organizations page changes the same settings.

## Viewers

The **Viewers** tab has the settings of the Gaussian splat viewer and the lighting of the 3D viewers.

| Setting | Values | What it does |
|---------|--------|--------------|
| **Navigation mode** (Gaussian splats) | **Fly** (default), **Earth** | How the camera moves when a splat opens. See [Navigation](/docs/features/gaussian-splat#navigation) |
| **Quality** (Gaussian splats) | **Auto** (default), **Low**, **Medium**, **High** | How much detail the splat viewer draws: colour detail, level of detail and sharpness. Auto lowers the detail on a slow device and raises it again when there is room. See [Quality](/docs/features/gaussian-splat#quality) for what each preset changes |

The quality can also be changed in the view settings of the splat viewer (the gear button); it is the same setting.

## Stockpiles

The **Stockpiles** tab has the materials of the [stockpile panel](/docs/features/terrain-analytics#weight-and-cost). The panel weighs a pile with the density of its material and prices it with the price per tonne, in the currency of the [Units](#units-and-currency) tab.

| Setting | What it does |
|---------|--------------|
| **Shown** | Whether the stockpile panel offers the material. Hide the materials you do not use |
| **Density** | The density of the material, in t/m³ (ST/yd³ with imperial units). It must be more than 0 and at most 30 t/m³ |
| **Price** | The price of the material per tonne (per short ton with imperial units). It must be 0 or more |

* A built-in material that you changed shows **edited**. Its reset button puts its density and its price back to the defaults.
* **Add material** adds a material of your own, at the end of the list. Give it a name that no other material has. Its delete button removes it. You can have at most 100 materials of your own.
* An invalid value shows why under the material, and is not saved.
* A saved pile keeps the material it was weighed with. When you open it again and your values of that material are different (or the material is not yours), the panel offers the saved material as **(saved)**, so the weight and the cost stay as they were saved.

**Edit materials…** in the stockpile panel opens this tab. A link to any Hub page with `?preferences=stockpiles` at the end of the address opens it too.

## Notifications

The server can e-mail you when the builds of your files end. A build makes what the Hub shows of a file, for example
the tiles of an orthophoto, a point cloud or a 3D model.

Choose **Send build notifications**:

| Value | You get an e-mail for |
|-------|-----------------------|
| **None** (default) | Nothing |
| **All** | Builds that completed, builds that failed and builds that wait for files |
| **Failed or waiting for files** | Builds that failed, with the reason, and builds that wait for files, with the names of the files |

A build waits for files when a file it needs is not in the dataset, for example the `.mtl` of an `.obj` or the `.shx`
of a `.shp`. You get one e-mail that names the missing files. Upload them and the file is built at once; with **All**
you then get a "Completed" line, with either setting a "Failed" line when that build fails.

The default is **None**. You get no e-mail until you choose **All** or **Failed or waiting for files**.

Builds that end close together share one e-mail. [When an e-mail is sent](./admin/email.md#when-an-e-mail-is-sent)
says which builds count and how they are grouped.

* The tab is there only when the server sends e-mail.
* The setting is disabled when your account has no e-mail address. The window says so. You cannot add an address
  yourself: ask an administrator to add one.
* The e-mail has a link to your notification settings. It opens this tab, after you sign in if needed. Choose
  **None** to stop the e-mails.

A link to any Hub page with `?preferences=notifications` at the end of the address opens this tab too.
