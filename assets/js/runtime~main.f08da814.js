(()=>{"use strict";var e,t,r,o,n,a={},d={};function f(e){var t=d[e];if(void 0!==t)return t.exports;var r=d[e]={id:e,loaded:!1,exports:{}};return a[e].call(r.exports,r,r.exports,f),r.loaded=!0,r.exports}f.m=a,f.c=d,e=[],f.O=(t,r,o,n)=>{if(!r){var a=1/0;for(u=0;u<e.length;u++){r=e[u][0],o=e[u][1],n=e[u][2];for(var d=!0,i=0;i<r.length;i++)(!1&n||a>=n)&&Object.keys(f.O).every((e=>f.O[e](r[i])))?r.splice(i--,1):(d=!1,n<a&&(a=n));if(d){e.splice(u--,1);var b=o();void 0!==b&&(t=b)}}return t}n=n||0;for(var u=e.length;u>0&&e[u-1][2]>n;u--)e[u]=e[u-1];e[u]=[r,o,n]},f.n=e=>{var t=e&&e.__esModule?()=>e.default:()=>e;return f.d(t,{a:t}),t},r=Object.getPrototypeOf?e=>Object.getPrototypeOf(e):e=>e.__proto__,f.t=function(e,o){if(1&o&&(e=this(e)),8&o)return e;if("object"==typeof e&&e){if(4&o&&e.__esModule)return e;if(16&o&&"function"==typeof e.then)return e}var n=Object.create(null);f.r(n);var a={};t=t||[null,r({}),r([]),r(r)];for(var d=2&o&&e;"object"==typeof d&&!~t.indexOf(d);d=r(d))Object.getOwnPropertyNames(d).forEach((t=>a[t]=()=>e[t]));return a.default=()=>e,f.d(n,a),n},f.d=(e,t)=>{for(var r in t)f.o(t,r)&&!f.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},f.f={},f.e=e=>Promise.all(Object.keys(f.f).reduce(((t,r)=>(f.f[r](e,t),t)),[])),f.u=e=>"assets/js/"+({30:"bbb29017",41:"ba61d949",53:"935f2afb",170:"db921fda",195:"c4f5d8e4",218:"2dc45ced",334:"247783bb",372:"1db64337",514:"1be78505",645:"a7434565",836:"0480b142",918:"17896441"}[e]||e)+"."+{30:"c1213c5b",41:"e7251477",53:"8806ad42",170:"9c48bd93",195:"b924ce36",218:"9c2cd409",334:"8a68bc50",372:"a24e8f66",514:"3fb1cf5f",645:"46f43197",717:"a234f72c",836:"e1662621",918:"60c4177f",972:"43ccd7c5"}[e]+".js",f.miniCssF=e=>{},f.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),f.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),o={},n="ddb-docs:",f.l=(e,t,r,a)=>{if(o[e])o[e].push(t);else{var d,i;if(void 0!==r)for(var b=document.getElementsByTagName("script"),u=0;u<b.length;u++){var l=b[u];if(l.getAttribute("src")==e||l.getAttribute("data-webpack")==n+r){d=l;break}}d||(i=!0,(d=document.createElement("script")).charset="utf-8",d.timeout=120,f.nc&&d.setAttribute("nonce",f.nc),d.setAttribute("data-webpack",n+r),d.src=e),o[e]=[t];var c=(t,r)=>{d.onerror=d.onload=null,clearTimeout(s);var n=o[e];if(delete o[e],d.parentNode&&d.parentNode.removeChild(d),n&&n.forEach((e=>e(r))),t)return t(r)},s=setTimeout(c.bind(null,void 0,{type:"timeout",target:d}),12e4);d.onerror=c.bind(null,d.onerror),d.onload=c.bind(null,d.onload),i&&document.head.appendChild(d)}},f.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},f.p="/",f.gca=function(e){return e={17896441:"918",bbb29017:"30",ba61d949:"41","935f2afb":"53",db921fda:"170",c4f5d8e4:"195","2dc45ced":"218","247783bb":"334","1db64337":"372","1be78505":"514",a7434565:"645","0480b142":"836"}[e]||e,f.p+f.u(e)},(()=>{var e={303:0,532:0};f.f.j=(t,r)=>{var o=f.o(e,t)?e[t]:void 0;if(0!==o)if(o)r.push(o[2]);else if(/^(303|532)$/.test(t))e[t]=0;else{var n=new Promise(((r,n)=>o=e[t]=[r,n]));r.push(o[2]=n);var a=f.p+f.u(t),d=new Error;f.l(a,(r=>{if(f.o(e,t)&&(0!==(o=e[t])&&(e[t]=void 0),o)){var n=r&&("load"===r.type?"missing":r.type),a=r&&r.target&&r.target.src;d.message="Loading chunk "+t+" failed.\n("+n+": "+a+")",d.name="ChunkLoadError",d.type=n,d.request=a,o[1](d)}}),"chunk-"+t,t)}},f.O.j=t=>0===e[t];var t=(t,r)=>{var o,n,a=r[0],d=r[1],i=r[2],b=0;if(a.some((t=>0!==e[t]))){for(o in d)f.o(d,o)&&(f.m[o]=d[o]);if(i)var u=i(f)}for(t&&t(r);b<a.length;b++)n=a[b],f.o(e,n)&&e[n]&&e[n][0](),e[n]=0;return f.O(u)},r=self.webpackChunkddb_docs=self.webpackChunkddb_docs||[];r.forEach(t.bind(null,0)),r.push=t.bind(null,r.push.bind(r))})()})();