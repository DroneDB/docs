---
sidebar_position: 4
---

# Server

![image](https://user-images.githubusercontent.com/1951843/168910096-ed819236-4945-4c0a-bf34-5d3223961697.png)

A server to manage and share aerial data assets (aerial images, orthophotos, elevation models, point clouds, textured models, panoramas, etc.).

You can run DroneDB Server to organize aerial data, share it with others or even build custom applications on top of its API.

You provide the files, DroneDB Server handles the rest: on-demand dynamic tiling, creating thumbnails, parsing geolocation data, streaming meshes, handling metadata, geoprojecting images and many other functions.

DroneDB Server organizes your data in a straightforward filesystem structure. There's no databases, unique identifiers or other complex layers. You can always access your data from the filesystem.

Backing up your DroneDB Server is as simple as copying the entire storage folder. You can even toss away DroneDB server and you will still be able to access your data in an organized manner.

<!-- GETTING STARTED -->
## Getting Started

### Linux/macOS

 * First install [docker](https://www.docker.com/). It's the only requirement.

Download [ddb-server.sh](https://raw.githubusercontent.com/DroneDB/Server/master/ddb-server.sh) and run from a command prompt:

```
chmod +x ddb-server.sh
./ddb-server.sh
```

 * Open a browser to [http://localhost:5000](http://localhost:5000) and login with the default credentials: `admin:password`.
 * You can change the default password by visiting [http://localhost:5000/account](http://localhost:5000/account)

### Windows

Coming soon!

## Set Storage Path

By default DroneDB Server will store all data in a `storage/` folder. You can change that by passing a path:

```
./ddb-server.sh /path/to/storage
```

See `./ddb-server.sh --help` for other options.

## Run in SingleDB mode

DroneDB Server can operate in two modes: 

 * **Full**: organizations and datasets will be saved in the storage path. This is the default.
 * **Single**: if storage path is a directory containing existing files, the directory will be indexed and published by the server. A single `projects` organization will exist and a single dataset will be available. This can be useful to quickly share folders with others, or to manage your aerial data locally.

For example, if you have a folder with results from [ODM](https://github.com/OpenDroneMap/ODM), you can run:

```
./ddb-server.sh /data/drone/sunset-park
```

DroneDB Server will automatically index/sync the specified folder and serve it on http://localhost:5000/r/projects/sunset-park

![image](https://user-images.githubusercontent.com/1951843/169094873-923dc83e-ca3e-4584-8ee4-7d318099474f.png)

## STAC Endpoints

You can access the server's public STAC Catalog from the `/stac` endpoint (e.g. http://localhost:5000/stac ). All `public` datasets `public` will be included in the STAC Catalog.

Each dataset also exposes a STAC collection at `/orgs/:org/ds/:ds/stac`.

You can browse the Catalog using the [STAC Browser](https://radiantearth.github.io/stac-browser/#/external/http:/localhost:5000/stac).

## Under the Hood

We mentioned earlier that DroneDB Server organizes your data in a straightforward filesystem structure. What happens when we launch the server on an existing folder, or create a new dataset?

A DroneDB dataset is simply a folder, plus a `.ddb` subfolder. The `.ddb` subfolder is created for you by DroneDB Server if it doesn't exist already. You can download the [ddb](./cli) command line client to manually manage DroneDB datasets. In fact, DroneDB Server is simply a RESTful API that exposes the functions of the command line client (plus a nice [GUI](https://github.com/DroneDB/Hub)).

Taking as an example our `/data/drone/sunset-park` folder, we can make changes or queries to our dataset directly from the command line:

```
cd sunset-park
ddb info . --format json
--> [{"depth":2,"mtime":1652890808,"path":"file:///data/drone/sunset-park/.","properties":{"entries":494,"public":false},"size":957197402,"type":7}]
```

If we want to remove a directory from the index, for example, we can run:

```
ddb rm opensfm
D	opensfm
D	opensfm/reconstruction.json
D	opensfm/tracks.csv
D	opensfm/profile.log
...
```

Note the folder has been removed from the index only (it still exists in the filesystem). This is on purpose.

The GUI in DroneDB Server knows to look for a "name" [metadata field](https://docs.dronedb.app/commands/meta.html) when assigning a friendly name to a dataset. Let's set one:

```
ddb meta set name "A cool name"
Data: A cool name
Id: ca1e0909-0cbe-4f31-b484-8ce331e7bfc4
Mtime: 1652892452
```

Refreshing the GUI now shows:

![image](https://user-images.githubusercontent.com/1951843/169097993-10b8b877-f6f6-4dca-891c-a3ae630588d8.png)

During the process of indexing the files, DroneDB Server has taken care of generating special `build` files whenever appropriate:

```
ls .ddb/build
3b670cd7053359fdd2b8765c6fbee5ff513d0becec4a237ef152df5c05c54bd0
7f7316050748ce97c2c2b85ce2bccce247e4e6b9f86d559e75264d1a63421137
b13d44e180f010cc33154afbe837f0bed3985be76555efd0fc149a091709c9a0
...
```

Each folder is named after the SHA256 of the file that was built.

For example, the point cloud `odm_georeferenced_model.laz` file has a SHA256 of `b13d44e180f010cc33154afbe837f0bed3985be76555efd0fc149a091709c9a0` and an [EPT](https://entwine.io/) tileset has automatically been generated:

```
ls .ddb/build/b13d44e180f010cc33154afbe837f0bed3985be76555efd0fc149a091709c9a0
ept
```

This allows efficient streaming of point clouds over the GUI (and other programs such as QGIS):

![image](https://user-images.githubusercontent.com/1951843/169099089-6c4cae34-a22a-44c9-9e24-77be8f2a2967.png)

DroneDB Server can build Cloud Optimized GeoTIFFs (for orthophotos, elevation models), EPT (for point clouds), [Nexus](https://github.com/cnr-isti-vclab/nexus) (for streaming meshes). It does the heavy-lifting, so you don't have to.

See other [commands](./cli#commands-reference).

What if you want to remove any trace of DroneDB from your data? Simply delete all `.ddb` folders. That's it! DroneDB never mutates the input data and keeps the same filesystem structure you choose.

## Updating

To update the software run:

```
./ddb-server.sh update
```

## Getting Help

Commercial support is available. [Get in touch](https://dronedb.app/contact).