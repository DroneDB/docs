---
sidebar_position: 6
description: 'Frequently asked questions'
---

# FAQ

### What's the difference between Registry and Server?

Both implementations allow you to access the functionalities of [Hub](https://github.com/DroneDB/Hub). The biggest difference is how they store data. Registry will assign unique identifiers to datasets when you create one. A supporting database that maps unique identifiers to datasets is therefore also used. Server stores everything on the file system. Check them both and see which one suits your needs best! If you're undecided, use Registry.

|             | Registry                 | Server                 |
| ----------- | ------------------------ | ---------------------- |
| **OS**   | Windows, Linux, macOS    | Linux, macOS           |
| **Data Storage**| Database + File System   | File System Only       |
| **Language**    | .NET 6.0                 | NodeJS                |

