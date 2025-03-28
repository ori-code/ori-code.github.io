import{k as _,u as $,d as w,l as a,a as D,r as I,c as G,n as E,s as p,e as N,p as V,q as S}from"./solid.FlMzgGMJ.js";const q=["allowfullscreen","async","autofocus","autoplay","checked","controls","default","disabled","formnovalidate","hidden","indeterminate","inert","ismap","loop","multiple","muted","nomodule","novalidate","open","playsinline","readonly","required","reversed","seamless","selected"],Y=new Set(["className","value","readOnly","formNoValidate","isMap","noModule","playsInline",...q]),F=new Set(["innerHTML","textContent","innerText","children"]),R=Object.assign(Object.create(null),{className:"class",htmlFor:"for"}),U=Object.assign(Object.create(null),{class:"className",formnovalidate:{$:"formNoValidate",BUTTON:1,INPUT:1},ismap:{$:"isMap",IMG:1},nomodule:{$:"noModule",SCRIPT:1},playsinline:{$:"playsInline",VIDEO:1},readonly:{$:"readOnly",INPUT:1,TEXTAREA:1}});function K(n,e){const t=U[n];return typeof t=="object"?t[e]?t.$:void 0:t}const X=new Set(["beforeinput","click","dblclick","contextmenu","focusin","focusout","input","keydown","keyup","mousedown","mousemove","mouseout","mouseover","mouseup","pointerdown","pointermove","pointerout","pointerover","pointerup","touchend","touchmove","touchstart"]),W=new Set(["altGlyph","altGlyphDef","altGlyphItem","animate","animateColor","animateMotion","animateTransform","circle","clipPath","color-profile","cursor","defs","desc","ellipse","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","filter","font","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","foreignObject","g","glyph","glyphRef","hkern","image","line","linearGradient","marker","mask","metadata","missing-glyph","mpath","path","pattern","polygon","polyline","radialGradient","rect","set","stop","svg","switch","symbol","text","textPath","tref","tspan","use","view","vkern"]),J={xlink:"http://www.w3.org/1999/xlink",xml:"http://www.w3.org/XML/1998/namespace"};function Q(n,e,t){let i=t.length,s=e.length,o=i,r=0,l=0,f=e[s-1].nextSibling,c=null;for(;r<s||l<o;){if(e[r]===t[l]){r++,l++;continue}for(;e[s-1]===t[o-1];)s--,o--;if(s===r){const d=o<i?l?t[l-1].nextSibling:t[o-l]:f;for(;l<o;)n.insertBefore(t[l++],d)}else if(o===l)for(;r<s;)(!c||!c.has(e[r]))&&e[r].remove(),r++;else if(e[r]===t[o-1]&&t[l]===e[s-1]){const d=e[--s].nextSibling;n.insertBefore(t[l++],e[r++].nextSibling),n.insertBefore(t[--o],d),e[s]=t[o]}else{if(!c){c=new Map;let h=l;for(;h<o;)c.set(t[h],h++)}const d=c.get(e[r]);if(d!=null)if(l<d&&d<o){let h=r,u=1,y;for(;++h<s&&h<o&&!((y=c.get(e[h]))==null||y!==d+u);)u++;if(u>d-l){const A=e[r];for(;l<d;)n.insertBefore(t[l++],A)}else n.replaceChild(t[l++],e[r++])}else r++;else e[r++].remove()}}}const L="_$DX_DELEGATE";function P(n,e,t,i={}){let s;return _(o=>{s=o,e===document?n():T(e,n(),e.firstChild?null:void 0,t)},i.owner),()=>{s(),e.textContent=""}}function he(n,e,t){let i;const s=()=>{const r=document.createElement("template");return r.innerHTML=n,t?r.content.firstChild.firstChild:r.content.firstChild},o=e?()=>$(()=>document.importNode(i||(i=s()),!0)):()=>(i||(i=s())).cloneNode(!0);return o.cloneNode=o,o}function Z(n,e=window.document){const t=e[L]||(e[L]=new Set);for(let i=0,s=n.length;i<s;i++){const o=n[i];t.has(o)||(t.add(o),e.addEventListener(o,j))}}function ge(n,e,t){g(n)||(n[e]=t)}function C(n,e,t){g(n)||(t==null?n.removeAttribute(e):n.setAttribute(e,t))}function z(n,e,t,i){g(n)||(i==null?n.removeAttributeNS(e,t):n.setAttributeNS(e,t,i))}function v(n,e,t){g(n)||(t?n.setAttribute(e,""):n.removeAttribute(e))}function ee(n,e){g(n)||(e==null?n.removeAttribute("class"):n.className=e)}function te(n,e,t,i){if(i)Array.isArray(t)?(n["$$".concat(e)]=t[0],n["$$".concat(e,"Data")]=t[1]):n["$$".concat(e)]=t;else if(Array.isArray(t)){const s=t[0];n.addEventListener(e,t[0]=o=>s.call(n,t[1],o))}else n.addEventListener(e,t,typeof t!="function"&&t)}function ne(n,e,t={}){const i=Object.keys(e||{}),s=Object.keys(t);let o,r;for(o=0,r=s.length;o<r;o++){const l=s[o];!l||l==="undefined"||e[l]||(M(n,l,!1),delete t[l])}for(o=0,r=i.length;o<r;o++){const l=i[o],f=!!e[l];!l||l==="undefined"||t[l]===f||!f||(M(n,l,!0),t[l]=f)}return t}function ie(n,e,t){if(!e)return t?C(n,"style"):e;const i=n.style;if(typeof e=="string")return i.cssText=e;typeof t=="string"&&(i.cssText=t=void 0),t||(t={}),e||(e={});let s,o;for(o in t)e[o]==null&&i.removeProperty(o),delete t[o];for(o in e)s=e[o],s!==t[o]&&(i.setProperty(o,s),t[o]=s);return t}function se(n,e={},t,i){const s={};return i||w(()=>s.children=b(n,e.children,s.children)),w(()=>typeof e.ref=="function"&&oe(e.ref,n)),w(()=>le(n,e,t,!0,s,!0)),s}function oe(n,e,t){return $(()=>n(e,t))}function T(n,e,t,i){if(t!==void 0&&!i&&(i=[]),typeof e!="function")return b(n,e,i,t);w(s=>b(n,e(),s,t),i)}function le(n,e,t,i,s={},o=!1){e||(e={});for(const r in s)if(!(r in e)){if(r==="children")continue;s[r]=k(n,r,null,s[r],t,o,e)}for(const r in e){if(r==="children")continue;const l=e[r];s[r]=k(n,r,l,s[r],t,o,e)}}function fe(n,e,t={}){if(globalThis._$HY.done)return P(n,e,[...e.childNodes],t);a.completed=globalThis._$HY.completed,a.events=globalThis._$HY.events,a.load=i=>globalThis._$HY.r[i],a.has=i=>i in globalThis._$HY.r,a.gather=i=>O(e,i),a.registry=new Map,a.context={id:t.renderId||"",count:0};try{return O(e,t.renderId),P(n,e,[...e.childNodes],t)}finally{a.context=null}}function re(n){let e,t;return!g()||!(e=a.registry.get(t=ae()))?n():(a.completed&&a.completed.add(e),a.registry.delete(t),e)}function ye(n){let e=n,t=0,i=[];if(g(n))for(;e;){if(e.nodeType===8){const s=e.nodeValue;if(s==="$")t++;else if(s==="/"){if(t===0)return[e,i];t--}}i.push(e),e=e.nextSibling}return[e,i]}function me(){a.events&&!a.events.queued&&(queueMicrotask(()=>{const{completed:n,events:e}=a;if(e){for(e.queued=!1;e.length;){const[t,i]=e[0];if(!n.has(t))return;e.shift(),j(i)}a.done&&(a.events=_$HY.events=null,a.completed=_$HY.completed=null)}}),a.events.queued=!0)}function g(n){return!!a.context&&!a.done&&(!n||n.isConnected)}function ce(n){return n.toLowerCase().replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function M(n,e,t){const i=e.trim().split(/\s+/);for(let s=0,o=i.length;s<o;s++)n.classList.toggle(i[s],t)}function k(n,e,t,i,s,o,r){let l,f,c,d,h;if(e==="style")return ie(n,t,i);if(e==="classList")return ne(n,t,i);if(t===i)return i;if(e==="ref")o||t(n);else if(e.slice(0,3)==="on:"){const u=e.slice(3);i&&n.removeEventListener(u,i,typeof i!="function"&&i),t&&n.addEventListener(u,t,typeof t!="function"&&t)}else if(e.slice(0,10)==="oncapture:"){const u=e.slice(10);i&&n.removeEventListener(u,i,!0),t&&n.addEventListener(u,t,!0)}else if(e.slice(0,2)==="on"){const u=e.slice(2).toLowerCase(),y=X.has(u);if(!y&&i){const A=Array.isArray(i)?i[0]:i;n.removeEventListener(u,A)}(y||t)&&(te(n,u,t,y),y&&Z([u]))}else if(e.slice(0,5)==="attr:")C(n,e.slice(5),t);else if(e.slice(0,5)==="bool:")v(n,e.slice(5),t);else if((h=e.slice(0,5)==="prop:")||(c=F.has(e))||!s&&((d=K(e,n.tagName))||(f=Y.has(e)))||(l=n.nodeName.includes("-")||"is"in r)){if(h)e=e.slice(5),f=!0;else if(g(n))return t;e==="class"||e==="className"?ee(n,t):l&&!f&&!c?n[ce(e)]=t:n[d||e]=t}else{const u=s&&e.indexOf(":")>-1&&J[e.split(":")[0]];u?z(n,u,e,t):C(n,R[e]||e,t)}return t}function j(n){if(a.registry&&a.events&&a.events.find(([f,c])=>c===n))return;let e=n.target;const t="$$".concat(n.type),i=n.target,s=n.currentTarget,o=f=>Object.defineProperty(n,"target",{configurable:!0,value:f}),r=()=>{const f=e[t];if(f&&!e.disabled){const c=e["".concat(t,"Data")];if(c!==void 0?f.call(e,c,n):f.call(e,n),n.cancelBubble)return}return e.host&&typeof e.host!="string"&&!e.host._$host&&e.contains(n.target)&&o(e.host),!0},l=()=>{for(;r()&&(e=e._$host||e.parentNode||e.host););};if(Object.defineProperty(n,"currentTarget",{configurable:!0,get(){return e||document}}),a.registry&&!a.done&&(a.done=_$HY.done=!0),n.composedPath){const f=n.composedPath();o(f[0]);for(let c=0;c<f.length-2&&(e=f[c],!!r());c++){if(e._$host){e=e._$host,l();break}if(e.parentNode===s)break}}else l();o(i)}function b(n,e,t,i,s){const o=g(n);if(o){!t&&(t=[...n.childNodes]);let f=[];for(let c=0;c<t.length;c++){const d=t[c];d.nodeType===8&&d.data.slice(0,2)==="!$"?d.remove():f.push(d)}t=f}for(;typeof t=="function";)t=t();if(e===t)return t;const r=typeof e,l=i!==void 0;if(n=l&&t[0]&&t[0].parentNode||n,r==="string"||r==="number"){if(o||r==="number"&&(e=e.toString(),e===t))return t;if(l){let f=t[0];f&&f.nodeType===3?f.data!==e&&(f.data=e):f=document.createTextNode(e),t=m(n,t,i,f)}else t!==""&&typeof t=="string"?t=n.firstChild.data=e:t=n.textContent=e}else if(e==null||r==="boolean"){if(o)return t;t=m(n,t,i)}else{if(r==="function")return w(()=>{let f=e();for(;typeof f=="function";)f=f();t=b(n,f,t,i)}),()=>t;if(Array.isArray(e)){const f=[],c=t&&Array.isArray(t);if(x(f,e,t,s))return w(()=>t=b(n,f,t,i,!0)),()=>t;if(o){if(!f.length)return t;if(i===void 0)return t=[...n.childNodes];let d=f[0];if(d.parentNode!==n)return t;const h=[d];for(;(d=d.nextSibling)!==i;)h.push(d);return t=h}if(f.length===0){if(t=m(n,t,i),l)return t}else c?t.length===0?H(n,f,i):Q(n,t,f):(t&&m(n),H(n,f));t=f}else if(e.nodeType){if(o&&e.parentNode)return t=l?[e]:e;if(Array.isArray(t)){if(l)return t=m(n,t,i,e);m(n,t,null,e)}else t==null||t===""||!n.firstChild?n.appendChild(e):n.replaceChild(e,n.firstChild);t=e}}return t}function x(n,e,t,i){let s=!1;for(let o=0,r=e.length;o<r;o++){let l=e[o],f=t&&t[n.length],c;if(!(l==null||l===!0||l===!1))if((c=typeof l)=="object"&&l.nodeType)n.push(l);else if(Array.isArray(l))s=x(n,l,f)||s;else if(c==="function")if(i){for(;typeof l=="function";)l=l();s=x(n,Array.isArray(l)?l:[l],Array.isArray(f)?f:[f])||s}else n.push(l),s=!0;else{const d=String(l);f&&f.nodeType===3&&f.data===d?n.push(f):n.push(document.createTextNode(d))}}return s}function H(n,e,t=null){for(let i=0,s=e.length;i<s;i++)n.insertBefore(e[i],t)}function m(n,e,t,i){if(t===void 0)return n.textContent="";const s=i||document.createTextNode("");if(e.length){let o=!1;for(let r=e.length-1;r>=0;r--){const l=e[r];if(s!==l){const f=l.parentNode===n;!o&&!r?f?n.replaceChild(s,l):n.insertBefore(s,t):f&&l.remove()}else o=!0}}else n.insertBefore(s,t);return[s]}function O(n,e){const t=n.querySelectorAll("*[data-hk]");for(let i=0;i<t.length;i++){const s=t[i],o=s.getAttribute("data-hk");(!e||o.startsWith(e))&&!a.registry.has(o)&&a.registry.set(o,s)}}function ae(){return a.getNextContextId()}const de="http://www.w3.org/2000/svg";function B(n,e=!1){return e?document.createElementNS(de,n):document.createElement(n)}const we=(...n)=>(V(),fe(...n));function be(n){const{useShadow:e}=n,t=document.createTextNode(""),i=()=>n.mount||document.body,s=S();let o,r=!!a.context;return D(()=>{r&&(S().user=r=!1),o||(o=I(s,()=>N(()=>n.children)));const l=i();if(l instanceof HTMLHeadElement){const[f,c]=G(!1),d=()=>c(!0);_(h=>T(l,()=>f()?h():o(),null)),E(d)}else{const f=B(n.isSVG?"g":"div",n.isSVG),c=e&&f.attachShadow?f.attachShadow({mode:"open"}):f;Object.defineProperty(f,"_$host",{get(){return t.parentNode},configurable:!0}),T(c,o),l.appendChild(f),n.ref&&n.ref(f),E(()=>l.removeChild(f))}},void 0,{render:!r}),t}function Ae(n){const[e,t]=p(n,["component"]),i=N(()=>e.component);return N(()=>{const s=i();switch(typeof s){case"function":return $(()=>s(t));case"string":const o=W.has(s),r=a.context?re():B(s,o);return se(r,t,o),r}})}export{Ae as D,be as P,ye as a,C as b,ee as c,Z as d,te as e,ne as f,re as g,ie as h,T as i,se as j,we as k,P as l,me as r,ge as s,he as t,oe as u};
