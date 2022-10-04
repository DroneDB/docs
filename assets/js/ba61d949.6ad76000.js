"use strict";(self.webpackChunkddb_docs=self.webpackChunkddb_docs||[]).push([[41],{5162:(e,t,n)=>{n.d(t,{Z:()=>i});var a=n(7294),r=n(6010);const o="tabItem_Ymn6";function i(e){let{children:t,hidden:n,className:i}=e;return a.createElement("div",{role:"tabpanel",className:(0,r.Z)(o,i),hidden:n},t)}},5488:(e,t,n)=>{n.d(t,{Z:()=>h});var a=n(7462),r=n(7294),o=n(6010),i=n(2389),l=n(7392),s=n(7094),d=n(2466);const u="tabList__CuJ",p="tabItem_LNqP";function g(e){var t,n;const{lazy:i,block:g,defaultValue:h,values:c,groupId:m,className:b}=e,f=r.Children.map(e.children,(e=>{if((0,r.isValidElement)(e)&&"value"in e.props)return e;throw new Error("Docusaurus error: Bad <Tabs> child <"+("string"==typeof e.type?e.type:e.type.name)+'>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.')})),k=null!=c?c:f.map((e=>{let{props:{value:t,label:n,attributes:a}}=e;return{value:t,label:n,attributes:a}})),v=(0,l.l)(k,((e,t)=>e.value===t.value));if(v.length>0)throw new Error('Docusaurus error: Duplicate values "'+v.map((e=>e.value)).join(", ")+'" found in <Tabs>. Every value needs to be unique.');const w=null===h?h:null!=(t=null!=h?h:null==(n=f.find((e=>e.props.default)))?void 0:n.props.value)?t:f[0].props.value;if(null!==w&&!k.some((e=>e.value===w)))throw new Error('Docusaurus error: The <Tabs> has a defaultValue "'+w+'" but none of its children has the corresponding value. Available values are: '+k.map((e=>e.value)).join(", ")+". If you intend to show no default tab, use defaultValue={null} instead.");const{tabGroupChoices:y,setTabGroupChoices:N}=(0,s.U)(),[x,S]=(0,r.useState)(w),P=[],{blockElementScrollPositionUntilNextRender:T}=(0,d.o5)();if(null!=m){const e=y[m];null!=e&&e!==x&&k.some((t=>t.value===e))&&S(e)}const C=e=>{const t=e.currentTarget,n=P.indexOf(t),a=k[n].value;a!==x&&(T(t),S(a),null!=m&&N(m,String(a)))},G=e=>{var t;let n=null;switch(e.key){case"ArrowRight":{var a;const t=P.indexOf(e.currentTarget)+1;n=null!=(a=P[t])?a:P[0];break}case"ArrowLeft":{var r;const t=P.indexOf(e.currentTarget)-1;n=null!=(r=P[t])?r:P[P.length-1];break}}null==(t=n)||t.focus()};return r.createElement("div",{className:(0,o.Z)("tabs-container",u)},r.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,o.Z)("tabs",{"tabs--block":g},b)},k.map((e=>{let{value:t,label:n,attributes:i}=e;return r.createElement("li",(0,a.Z)({role:"tab",tabIndex:x===t?0:-1,"aria-selected":x===t,key:t,ref:e=>P.push(e),onKeyDown:G,onFocus:C,onClick:C},i,{className:(0,o.Z)("tabs__item",p,null==i?void 0:i.className,{"tabs__item--active":x===t})}),null!=n?n:t)}))),i?(0,r.cloneElement)(f.filter((e=>e.props.value===x))[0],{className:"margin-top--md"}):r.createElement("div",{className:"margin-top--md"},f.map(((e,t)=>(0,r.cloneElement)(e,{key:t,hidden:e.props.value!==x})))))}function h(e){const t=(0,i.Z)();return r.createElement(g,(0,a.Z)({key:String(t)},e))}},7687:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>h,contentTitle:()=>p,default:()=>b,frontMatter:()=>u,metadata:()=>g,toc:()=>c});var a=n(7462),r=(n(7294),n(3905));const o={toc:[{value:"add",id:"add",level:3},{value:"build",id:"build",level:3},{value:"chattr",id:"chattr",level:3},{value:"clone",id:"clone",level:3},{value:"cog",id:"cog",level:3},{value:"delta",id:"delta",level:3},{value:"ept",id:"ept",level:3},{value:"geoproj",id:"geoproj",level:3},{value:"info",id:"info",level:3},{value:"init",id:"init",level:3},{value:"list",id:"list",level:3},{value:"login",id:"login",level:3},{value:"logout",id:"logout",level:3},{value:"meta",id:"meta",level:3},{value:"nxs",id:"nxs",level:3},{value:"password",id:"password",level:3},{value:"pull",id:"pull",level:3},{value:"push",id:"push",level:3},{value:"remove",id:"remove",level:3},{value:"search",id:"search",level:3},{value:"setexif",id:"setexif",level:3},{value:"share",id:"share",level:3},{value:"stac",id:"stac",level:3},{value:"stamp",id:"stamp",level:3},{value:"status",id:"status",level:3},{value:"sync",id:"sync",level:3},{value:"system",id:"system",level:3},{value:"tag",id:"tag",level:3},{value:"thumbs",id:"thumbs",level:3},{value:"tile",id:"tile",level:3}]};function i(e){let{components:t,...n}=e;return(0,r.kt)("wrapper",(0,a.Z)({},o,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h3",{id:"add"},"add"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Add files and directories to an index.\n\nUsage:\n  ddb add *.JPG [args] [PATHS]\n\n  -w, --working-dir arg  Working directory (default: .)\n  -r, --recursive        Recursively add subdirectories and files\n  -p, --paths arg        Paths to add to index (files or directories)\n  -h, --help             Print help\n      --debug            Show debug output\n\n")),(0,r.kt)("h3",{id:"build"},"build"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Build DroneDB files for efficient streaming over a network.\n\nUsage:\n  ddb build [-p path/to/file.laz] [--output out_dir] [args]\n\n  -o, --output arg       Output folder (default: .ddb/build)\n  -p, --path arg         File to process\n  -w, --working-dir arg  Working directory (default: .)\n  -f, --force            Force rebuild\n  -h, --help             Print help\n      --debug            Show debug output\n\n")),(0,r.kt)("h3",{id:"chattr"},"chattr"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Manage database attributes\n\nAttributes:\n    public  mark database as publicly accessible\n\n\nUsage:\n  ddb chattr [+-attribute] [args]\n\n  -w, --working-dir arg  Working directory (default: .)\n  -h, --help             Print help\n      --debug            Show debug output\n\n")),(0,r.kt)("h3",{id:"clone"},"clone"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Clone a repository into a new directory\n\nClones a repository into a newly created directory.\n\nUsage:\n  ddb clone (tag|url) folder [args]\n\n  -t, --target arg  Repository tag or full url\n  -f, --folder arg  Target folder (default: )\n  -h, --help        Print help\n      --debug       Show debug output\n\n")),(0,r.kt)("h3",{id:"cog"},"cog"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Build a Cloud Optimized GeoTIFF from an existing GeoTIFF.\n\nUsage:\n  ddb cog cog.tif input.tif [args]\n\n  -o, --output arg  Output Cloud Optimized GeoTIFF\n  -i, --input arg   Input GeoTIFF to process\n  -h, --help        Print help\n      --debug       Show debug output\n\n")),(0,r.kt)("h3",{id:"delta"},"delta"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Generate delta between two ddb databases\n\nOutputs the delta that applied to target turns it into source\n\nUsage:\n  ddb delta source target [args]\n\n  -s, --source arg  Source ddb\n  -t, --target arg  Target ddb (default: .)\n  -f, --format arg  Output format (text|json) (default: text)\n  -h, --help        Print help\n      --debug       Show debug output\n\n")),(0,r.kt)("h3",{id:"ept"},"ept"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Build an EPT index from point cloud files.\n\nUsage:\n  ddb ept outdir/ *.las [args]\n\n  -o, --output arg  Output directory where to store EPT data\n  -i, --input arg   File(s) to process\n  -h, --help        Print help\n      --debug       Show debug output\n\n")),(0,r.kt)("h3",{id:"geoproj"},"geoproj"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Project images to georeferenced rasters\n\nUsage:\n  ddb geoproj output/ *.JPG [args]\n\n  -o, --output arg  Output path (file or directory)\n  -i, --images arg  Images to project\n  -s, --size arg    Output image size (size[%]|0) (default: 100%)\n  -h, --help        Print help\n      --debug       Show debug output\n\n")),(0,r.kt)("h3",{id:"info"},"info"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Retrieve information about files and directories\n\nUsage:\n  ddb info *.JPG [args]\n\n  -i, --input arg     File(s) to examine\n  -o, --output arg    Output file to write results to (default: stdout)\n  -f, --format arg    Output format (text|json|geojson) (default: text)\n  -r, --recursive     Recursively search in subdirectories\n  -d, --depth arg     Max recursion depth (default: 0)\n      --geometry arg  Geometry to output (for geojson format only)\n                      (auto|point|polygon) (default: auto)\n      --with-hash     Compute SHA256 hashes\n  -h, --help          Print help\n      --debug         Show debug output\n\n")),(0,r.kt)("h3",{id:"init"},"init"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Initialize an index. If a directory is not specified, initializes the index in the current directory\n\nUsage:\n  ddb init [args] [DIRECTORY]\n\n  -w, --working-dir arg  Working directory (default: .)\n      --from-scratch     Create the index database from scratch instead of\n                         using a prebuilt one (slower)\n  -h, --help             Print help\n      --debug            Show debug output\n\n")),(0,r.kt)("h3",{id:"list"},"list"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"List indexed files and directories\n\nUsage:\n  ddb list *.JPG [args]\n\n  -i, --input arg        File(s) to list\n  -o, --output arg       Output file to write results to (default: stdout)\n  -w, --working-dir arg  Working directory (default: .)\n  -r, --recursive        Recursively search in subdirectories\n  -d, --depth arg        Max recursion depth (default: 0)\n  -f, --format arg       Output format (text|json) (default: text)\n  -h, --help             Print help\n      --debug            Show debug output\n\n")),(0,r.kt)("h3",{id:"login"},"login"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Authenticate with a registry.\n\nUsage:\n  ddb login [args]\n\n      --server arg    Registry server to authenticate to (default:\n                      hub.dronedb.app)\n  -u, --username arg  Username\n  -p, --password arg  Password\n  -h, --help          Print help\n      --debug         Show debug output\n\n")),(0,r.kt)("h3",{id:"logout"},"logout"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Logout from all registries. To logout from a single registry, use the --server option.\n\nUsage:\n  ddb logout [args]\n\n      --server arg  Registry server to logout from (default: hub.dronedb.app)\n  -h, --help        Print help\n      --debug       Show debug output\n\n")),(0,r.kt)("h3",{id:"meta"},"meta"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Manage database metadata\n\nUsage:\n  ddb meta [add|set|rm|get|unset|ls|dump|restore] [key|ID] [data] [-p path] [args]\n\n  -c, --command arg      Command\n  -k, --key arg          Metadata key/ID (default: )\n  -p, --path arg         Path to associate metadata with (default: )\n  -d, --data arg         Data string|number|JSON to set (default: )\n  -w, --working-dir arg  Working directory (default: .)\n  -f, --format arg       Output format (text|json) (default: text)\n  -h, --help             Print help\n      --debug            Show debug output\n\n")),(0,r.kt)("h3",{id:"nxs"},"nxs"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Generate nexus (NXS/NXZ) files from OBJs.\n\nUsage:\n  ddb nxs model.obj [output.nxz|output.nxs] [args]\n\n  -i, --input arg   File to process\n  -o, --output arg  Nexus output file\n      --overwrite   Overwrite output file if it exists\n  -h, --help        Print help\n      --debug       Show debug output\n\n")),(0,r.kt)("h3",{id:"password"},"password"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Manage database passwords\n\nUsage:\n  ddb password [a,append|v,verify|c,clear] [password] [args]\n\n  -w, --working-dir arg  Working directory (default: .)\n  -c, --command arg      Command to execute\n  -a, --argument arg     Command argument (default: )\n  -h, --help             Print help\n      --debug            Show debug output\n\n")),(0,r.kt)("h3",{id:"pull"},"pull"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Pulls changes from a remote repository.\n\nUsage:\n  ddb pull\n\n  -r, --remote arg   The remote Registry (default: )\n  -t, --keep-theirs  Keep changes from remote registry and override local\n                     ones\n  -o, --keep-ours    Keep local changes override remote ones\n  -h, --help         Print help\n      --debug        Show debug output\n\n")),(0,r.kt)("h3",{id:"push"},"push"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Pushes changes to a remote repository.\n\nUsage:\n  ddb push [remote] [args]\n\n  -r, --remote arg  The remote Registry (default: )\n  -h, --help        Print help\n      --debug       Show debug output\n\n")),(0,r.kt)("h3",{id:"remove"},"remove"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Remove files and directories from an index. The filesystem is left unchanged (actual files and directories will not be removed)\n\nUsage:\n  ddb rm image1.JPG image2.JPG [...] [args] [PATHS]\n\n  -w, --working-dir arg  Working directory (default: .)\n  -p, --paths arg        Paths to remove from index (files or directories)\n  -h, --help             Print help\n      --debug            Show debug output\n\n")),(0,r.kt)("h3",{id:"search"},"search"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Search indexed files and directories\n\nUsage:\n  ddb search '*file*' [args]\n\n  -q, --query arg        Search query\n  -w, --working-dir arg  Working directory (default: .)\n  -f, --format arg       Output format (text|json) (default: text)\n  -h, --help             Print help\n      --debug            Show debug output\n\n")),(0,r.kt)("h3",{id:"setexif"},"setexif"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Modify EXIF values in files.\n\nUsage:\n  ddb setexif *.JPG [args]\n\n  -i, --input arg    File(s) to modify\n      --gps-alt arg  Set GPS Altitude (decimal degrees)\n      --gps-lon arg  Set GPS Longitude (decimal degrees)\n      --gps-lat arg  Set GPS Latitude (decimal degrees)\n      --gps arg      Set GPS Latitude,Longitude,Altitude (decimal degrees,\n                     comma separated)\n  -h, --help         Print help\n      --debug        Show debug output\n\n")),(0,r.kt)("h3",{id:"share"},"share"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Share files and folders to a registry\n\nUsage:\n  ddb share *.JPG [args]\n\n  -i, --input arg     Files and directories to share\n  -r, --recursive     Recursively share subdirectories\n  -t, --tag arg       Tag to use (organization/dataset or\n                      server[:port]/organization/dataset) (default: hub.dronedb.app//)\n  -p, --password arg  Optional password to protect dataset (default: )\n  -s, --server arg    Registry server to share dataset with (alias of: -t\n                      <server>//)\n  -q, --quiet         Do not display progress\n  -h, --help          Print help\n      --debug         Show debug output\n\n")),(0,r.kt)("h3",{id:"stac"},"stac"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Generate STAC catalogs\n\nUsage:\n  ddb stac\n\n  -w, --working-dir arg         Working directory (default: .)\n  -p, --path arg                Entry path to generate a STAC item for (which\n                                must be part of the DroneDB index) (default:\n                                )\n      --stac-catalog-root arg   STAC Catalog absolute URL (default: )\n      --stac-collection-root arg\n                                STAC Collection absolute URL (default: .)\n      --id arg                  Set STAC id explicitely instead of using the\n                                directory name (default: )\n  -h, --help                    Print help\n      --debug                   Show debug output\n")),(0,r.kt)("h3",{id:"stamp"},"stamp"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Generate a stamp of the current index.\n\nUsage:\n  ddb stamp\n\n  -w, --working-dir arg  Working directory (default: .)\n  -f, --format arg       Output format (text|json) (default: text)\n  -h, --help             Print help\n      --debug            Show debug output\n\n")),(0,r.kt)("h3",{id:"status"},"status"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Show files and directories index status compared to the filesystem\n\nUsage:\n  ddb status [directory] [args]\n\n  -w, --working-dir arg  Working directory (default: .)\n  -h, --help             Print help\n      --debug            Show debug output\n\n")),(0,r.kt)("h3",{id:"sync"},"sync"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Sync files and directories in the index with changes from the filesystem\n\nUsage:\n  ddb sync\n\n  -w, --working-dir arg  Working directory (default: .)\n  -h, --help             Print help\n      --debug            Show debug output\n\n")),(0,r.kt)("h3",{id:"system"},"system"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Manage ddb\n\nCommands:\n    clean   Cleanup user cache files\n\n\nUsage:\n  ddb system COMMAND\n\n  -c, --command arg  Command (default: )\n  -h, --help         Print help\n      --debug        Show debug output\n\n")),(0,r.kt)("h3",{id:"tag"},"tag"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Gets or sets the dataset tag.\n\nUsage:\n  ddb tag [tag] [args]\n\n  -t, --tag arg  New tag (default: )\n  -h, --help     Print help\n      --debug    Show debug output\n\n")),(0,r.kt)("h3",{id:"thumbs"},"thumbs"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"Generate thumbnails for images and rasters\n\nUsage:\n  ddb thumbs [image.tif | *.JPG] -o [thumb.jpg | output/] [args]\n\n  -i, --input arg   File(s) to process\n  -o, --output arg  Output file or directory where to store thumbnail(s)\n  -s, --size arg    Size of the largest side of the images (default: 512)\n      --use-crc     Use CRC for output filenames\n  -h, --help        Print help\n      --debug       Show debug output\n\n")),(0,r.kt)("h3",{id:"tile"},"tile"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},'Generate tiles for GeoTIFFs, GeoImages and EPT\n\nUsage:\n  ddb tile [geo.tif | image.jpg | ept.json | https://host.com/cog.tif | https://host.com/image.jpg | https://host.com/ept.json] [output directory] [args]\n\n  -i, --input arg   Path or URL to file to tile\n  -o, --output arg  Output directory where to store tiles (default:\n                    {filename}_tiles/)\n  -f, --format arg  Output format (text|json) (default: text)\n  -z, arg           Zoom levels, either a single zoom level "N" or a range\n                    "min-max" or "auto" to generate all zoom levels (default:\n                    auto)\n  -x, arg           Generate a single tile with the specified coordinate\n                    (XYZ, unless --tms is used). Must be used with -y (default:\n                    auto)\n  -y, arg           Generate a single tile with the specified coordinate\n                    (XYZ, unless --tms is used). Must be used with -x (default:\n                    auto)\n  -s, --size arg    Tile size (default: 256)\n      --tms         Generate TMS tiles instead of XYZ\n  -h, --help        Print help\n      --debug       Show debug output\n\n')))}i.isMDXComponent=!0;var l=n(3066);n(3743);var s=n(5488),d=n(5162);const u={sidebar_position:5,description:""},p="CLI",g={unversionedId:"cli",id:"cli",title:"CLI",description:"",source:"@site/docs/cli.mdx",sourceDirName:".",slug:"/cli",permalink:"/docs/cli",draft:!1,tags:[],version:"current",sidebarPosition:5,frontMatter:{sidebar_position:5,description:""},sidebar:"tutorialSidebar",previous:{title:"Server",permalink:"/docs/server"},next:{title:"FAQ",permalink:"/docs/faq"}},h={},c=[{value:"Installation",id:"installation",level:2},{value:"Examples",id:"examples",level:2},{value:"Sharing datasets",id:"sharing-datasets",level:3},{value:"Editing datasets",id:"editing-datasets",level:3},{value:"Metadata Entries",id:"metadata-entries",level:3},{value:"Projecting images",id:"projecting-images",level:3},{value:"Commands Reference",id:"commands-reference",level:2}],m={toc:c};function b(e){let{components:t,...n}=e;return(0,r.kt)("wrapper",(0,a.Z)({},m,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"cli"},"CLI"),(0,r.kt)("p",null,(0,r.kt)("inlineCode",{parentName:"p"},"ddb")," is a command line interface (CLI) to access DroneDB's functions. This makes it ideal for power users and for creating automated workflows."),(0,r.kt)("h2",{id:"installation"},"Installation"),(0,r.kt)(s.Z,{mdxType:"Tabs"},(0,r.kt)(d.Z,{value:"windows",label:"Windows",default:!0,mdxType:"TabItem"},(0,r.kt)("ul",null,(0,r.kt)("li",null,"Download ",(0,r.kt)("a",{href:"https://github.com/DroneDB/ddb-desktop/releases/download/v1.1.0/DroneDB_Setup.exe"},"DroneDB_Setup.exe")),(0,r.kt)("li",null,"Verify it's working:")),(0,r.kt)(l.Z,{language:"bash",mdxType:"CodeBlock"},"C:\\> ddb --version\n1.0.6 (git commit 1952a82)")),(0,r.kt)(d.Z,{value:"macOS",label:"macOS",mdxType:"TabItem"},(0,r.kt)("ul",null,(0,r.kt)("li",null,"Install ",(0,r.kt)("a",{href:"https://brew.sh/"},"Homebrew")),(0,r.kt)("li",null,"Install DroneDB:")),(0,r.kt)(l.Z,{language:"bash",mdxType:"CodeBlock"},"[user:~] % brew install dronedb\n[user:~] % ddb --version\n1.0.6 (git commit 1952a82)\n")),(0,r.kt)(d.Z,{value:"linux",label:"Linux",mdxType:"TabItem"},(0,r.kt)(l.Z,{language:"bash",mdxType:"CodeBlock"},"$ curl -fsSL https://get.dronedb.app -o get-ddb.sh\n$ sh get-ddb.sh\n$ ddb --version\n1.0.6 (git commit 1952a82)"))),(0,r.kt)("h2",{id:"examples"},"Examples"),(0,r.kt)("p",null,"You can do all sort operations with ",(0,r.kt)("inlineCode",{parentName:"p"},"ddb"),". We recommend to check out\nthe list of ",(0,r.kt)("a",{parentName:"p",href:"#commands-reference"},"commands"),":"),(0,r.kt)("h3",{id:"sharing-datasets"},"Sharing datasets"),(0,r.kt)("p",null,"From a directory with images, simply type:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"ddb share *.JPG\n")),(0,r.kt)("div",{className:"admonition admonition-tip alert alert--success"},(0,r.kt)("div",{parentName:"div",className:"admonition-heading"},(0,r.kt)("h5",{parentName:"div"},(0,r.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,r.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"12",height:"16",viewBox:"0 0 12 16"},(0,r.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"}))),"tip")),(0,r.kt)("div",{parentName:"div",className:"admonition-content"},(0,r.kt)("p",{parentName:"div"},"By default the images are shared with ",(0,r.kt)("a",{parentName:"p",href:"https://hub.dronedb.app"},"Hub"),". You will need to\n",(0,r.kt)("a",{parentName:"p",href:"https://dronedb.app"},"register an account")," to get a username and\npassword. But you can also self-host your own\n",(0,r.kt)("a",{parentName:"p",href:"./registry"},"Registry"),"."))),(0,r.kt)("p",null,"You can select a different server by typing:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-bash"},"ddb share *.JPG -s http://localhost:5000\n--\x3e https://localhost:5000/r/admin/193514313aba4949ab5578b28ba1dd5b\n")),(0,r.kt)("p",null,"Because we didn't set a ",(0,r.kt)("inlineCode",{parentName:"p"},"tag"),", ddb generated a random one for you.\nYou can change the tag by visiting the URL. You can also explicitly set\na tag, like so:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"ddb share *.JPG -t pierotofy/brighton\n")),(0,r.kt)("p",null,"Or if you're running your own Registry:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"ddb share *.JPG -t http://localhost:5000/admin/brighton\n")),(0,r.kt)("p",null,"Tags are defined as:"),(0,r.kt)("p",null,(0,r.kt)("inlineCode",{parentName:"p"},"[server]/organization/dataset")),(0,r.kt)("p",null,"With the server component being optional."),(0,r.kt)("h3",{id:"editing-datasets"},"Editing datasets"),(0,r.kt)("p",null,"Using the Web UI provided by Registry is the easiest way to make\nchanges."),(0,r.kt)("p",null,"You can also ",(0,r.kt)("inlineCode",{parentName:"p"},"clone")," (download) an existing dataset from a\nRegistry for offline use, make modifications, then sync back your\nchanges."),(0,r.kt)("p",null,"Let's use this dataset:\n",(0,r.kt)("a",{parentName:"p",href:"https://hub.dronedb.app/r/pierotofy/brighton-beach"},"https://hub.dronedb.app/r/pierotofy/brighton-beach")),(0,r.kt)("p",null,"You can clone it via:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"ddb clone pierotofy/brighton-beach\n")),(0,r.kt)("p",null,"Let's add a ",(0,r.kt)("inlineCode",{parentName:"p"},"README.md")," file that describes the dataset. Create a\n",(0,r.kt)("inlineCode",{parentName:"p"},"README.md")," file using\n",(0,r.kt)("a",{parentName:"p",href:"https://www.markdownguide.org/cheat-sheet/"},"Markdown")," syntax and save\nit in the ",(0,r.kt)("inlineCode",{parentName:"p"},"brighton-beach")," directory. Afterwards:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"cd brighton-beach/\nddb add README.md\n")),(0,r.kt)("p",null,"Great! We are now ready to push the changes."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"ddb push\n")),(0,r.kt)("p",null,"Uuups! This will trigger an error, since we don't have permission to\nmake modifications to this dataset (it belongs to ",(0,r.kt)("inlineCode",{parentName:"p"},"pierotofy"),"). Let's\nmake our own copy to a different Registry server and user:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"ddb tag http://localhost:5000/admin/brighton-copy\nddb push\n")),(0,r.kt)("h3",{id:"metadata-entries"},"Metadata Entries"),(0,r.kt)("p",null,"DroneDB supports the addition of metadata to any file or directory\nwithin the index. This can be used to store information of any kind in\nJSON format:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},'ddb meta set pilot \'{"name": "John Smith"}\'\nddb meta get pilot --format json\n--\x3e {"data":{"name":"John S."},"id":"ff4f0f26-8741-4423-bde5-b445750937bb","mtime":1640985850}\n\nddb add photo.JPG\nddb meta add comments \'{"text": "Nice one!", "author": "John S."}\' -p photo.JPG\nddb meta get comments -p photo.JPG --format json\n--\x3e [{"data":{"author":"John S.","text":"Nice one!"},"id":"550d0b5c-108b-4996-b7e8-467b4cb87937","mtime":1640986217}]\n')),(0,r.kt)("p",null,"Singular and plural metadata keys are supported. Plural keys (ending\nwith ",(0,r.kt)("inlineCode",{parentName:"p"},"s"),") are treated as lists, whereas singular keys are objects."),(0,r.kt)("p",null,"Metadata entries are synced on push/pull and people working on the same\ndataset while offline can later sync back online without conflicts."),(0,r.kt)("h3",{id:"projecting-images"},"Projecting images"),(0,r.kt)("p",null,(0,r.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/1951843/176517923-d391fc9b-24cb-4604-a134-51be9155c806.png",alt:"geoproject"})),(0,r.kt)("p",null,"You can project images onto a map."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"ddb geoproj images/DJI_0018.JPG -o projected/\n")),(0,r.kt)("h1",{id:"creating-static-tiles-xyztms"},"Creating static tiles (XYZ/TMS)"),(0,r.kt)("p",null,"DroneDB can create static tiles for GeoTIFFs, drone images and ",(0,r.kt)("a",{parentName:"p",href:"https://entwine.io"},"EPT"),". It's similar to\n",(0,r.kt)("a",{parentName:"p",href:"https://gdal.org/programs/gdal2tiles.html"},"gdal2tiles.py"),", but\nit's a bit faster and can handle more formats. You can use\nthese tiles in applications such as Leaflet or OpenLayers to display\nthem on the web."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"ddb tile DJI_0018.JPG output_tiles/\nddb tile ept.json output_tiles/\nddb tile orthophoto.tif output_tiles/\n")),(0,r.kt)("h1",{id:"extracting-gps-locationsfootprints-to-geojson"},"Extracting GPS locations/footprints to GeoJSON"),(0,r.kt)("p",null,"You can quickly extract the locations of images to GeoJSON via:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"ddb info *.JPG -f geojson -o gps.geojson\n")),(0,r.kt)("p",null,"Or for image footprints:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"ddb info *.JPG -f geojson --geometry polygon -o footprint.geojson\n")),(0,r.kt)("p",null,"This works with orthophotos, elevation models and point clouds as well!"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"ddb info point_cloud.laz -f geojson --geometry polygon -o footprint.geojson\n")),(0,r.kt)("h2",{id:"commands-reference"},"Commands Reference"),(0,r.kt)(i,{mdxType:"CLIAutogen"}))}b.isMDXComponent=!0}}]);