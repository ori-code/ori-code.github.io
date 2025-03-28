import{P as ne,g,i as o,D as j,t as f,l as ie,a as _,u as F,s as N,c as oe}from"./web.C_sbr3PP.js";import{c as G,o as H,b as h,f as J,s as re,m as le,e as U,d as D,a as se}from"./solid.FlMzgGMJ.js";import{c as ae}from"./store.Dav5xYq4.js";import{B}from"./components.Ddpn2dxW.js";import{c as ce,e as de}from"./oek-api.Dp9gI6fx.js";import{i as ue}from"./utils.DmsN6_Oz.js";import{o as q}from"./CartButton.DplJWT8k.js";import{M as pe}from"./Modal.izS5twIU.js";import{a as z,c as O,b as me,f as ge,d as fe}from"./dom-hooks.CTnviX3H.js";import"./user-info.B8flXjSH.js";function Ae(){import.meta.url,import("_").catch(()=>1),async function*(){}().next()}var $e=f('<div class="modal visible"data-ignore-click-outside><div class=modal-contents style=max-width:30rem;z-index:99999;>');function be(I){const[t,A]=G();let r;function a(l){return A(()=>l),new Promise(p=>{r=p})}function S(l){A(void 0),r(l)}return H(()=>{I.setOpener(a)}),h(J,{get when(){return t()},children:l=>h(ne,{get children(){var p=g($e),e=p.firstChild;return o(e,h(j,{get component(){return l()},close:S})),p}})})}var _e=f('<form><p></p><div class="form-group mb-4 input"><label class=reset-text-transform for=iLokId>iLok User ID</label><input id=iLokId class=form-control required autocomplete=off data-lpignore=true data-1p-ignore type=text></div><!$><!/><div class=form-group style=margin-bottom:0;><!$><!/>&nbsp; &nbsp;<!$><!/></div><!$><!/><!$><!/><!$><!/>'),he=f("<label class=mb-3><input required type=checkbox class=me-2><!$><!/>"),Se=f('<p class="alert mt-4 mb-0">Checking your iLok account may take a moment...'),xe=f('<p class="alert mt-4 mb-0">'),ye=f('<div class=d-md-flex><h2></h2><div class="ms-auto text-md-end my-4 my-md-0"><h3 class=mb-0><!$><!/> / month</h3><span>for 18 months (<!$><!/> <!$><!/> in total)'),ve=f("<ul><li>Use the plug-in to its full extent</li><li>Yours to keep after 18 payments</li><li>Stop whenever and resume from where you left off</li><li>Pay off the remaining amount – if you like"),ke=f("<a href=/eula target=_blank rel=noreferrer>oeksound End-User License Agreement"),we=f('<p class="small mt-4"><a href=/support/rent-to-own>Check out our support article for more information.'),Ce=f("<p class=small><a href=/support/rent-to-own-management>Manage your existing subscriptions"),Ie=f("<p>Multiple iLok accounts are associated with the e-mail address <strong></strong>. Are you sure this is the name of the account that you wish to use? Please note that an iLok User ID isn't necessarily an e-mail address."),Le=f("<p class=mt-0>The <!$><!/> costs <strong></strong> <!$><!/>."),Pe=f("<strong>");const[n,C]=ae({isVisible:!1,error:null,iLokId:"",isSending:!1,modalState:null,conditionAccepted:!1});function Y(I){C({modalState:I,isVisible:!0})}function Ee(){let I;function t(){C({isVisible:!1})}async function A(r){var a,S,l;r.preventDefault(),r.stopPropagation();try{C({error:null,isSending:!0}),await n.modalState.validate(n.iLokId);const p=(a=z())!=null&&a.tags?((l=(S=z())==null?void 0:S.tags)==null?void 0:l.iLokId)!==n.iLokId.toLowerCase():!1,e={products:[{path:n.modalState.productId}],tags:{iLokId:n.iLokId.toLowerCase().trim(),eulaAccepted:n.conditionAccepted?new Date().toUTCString():void 0}};p&&(e.reset=!0),(await ge).builder.push(e,()=>{t(),q(),C({conditionAccepted:!1,isSending:!1}),fe(n.modalState.productId)})}catch(p){C({isSending:!1,error:p})}}return se(()=>{n.isVisible&&(C({error:null,iLokId:"",isSending:!1}),setTimeout(()=>{I.focus()},50))}),H(()=>{window.openILokModalInternal=r=>{C({modalState:r,isVisible:!0})}}),h(J,{get when(){return n.modalState},children:r=>h(pe,{width:"40em",get visible(){return n.isVisible},onClose:t,get children(){return[h(j,{get component(){return r().text}}),(()=>{var a=g(_e),S=a.firstChild,l=S.nextSibling,p=l.firstChild,e=p.nextSibling,i=l.nextSibling,[$,x]=_(i.nextSibling),c=$.nextSibling,M=c.firstChild,[y,b]=_(M.nextSibling),k=y.nextSibling,L=k.nextSibling,[T,V]=_(L.nextSibling),s=c.nextSibling,[d,v]=_(s.nextSibling),P=d.nextSibling,[E,m]=_(P.nextSibling),K=E.nextSibling,[Q,W]=_(K.nextSibling);return a.addEventListener("submit",A),o(S,()=>r().label),F(u=>ue(u),l),e.addEventListener("change",u=>C({iLokId:u.target.value})),F(u=>{I=u,u==null||u.focus()},e),o(a,(()=>{var u=U(()=>!!r().condition);return()=>u()&&(()=>{var w=g(he),R=w.firstChild,X=R.nextSibling,[Z,ee]=_(X.nextSibling);return R.addEventListener("change",te=>C({conditionAccepted:te.target.checked})),o(w,()=>r().condition,Z,ee),D(()=>N(R,"disabled",n.isSending)),D(()=>N(R,"checked",n.conditionAccepted)),w})()})(),$,x),o(c,h(B,{get disabled(){return n.isSending||!!r().condition&&!n.conditionAccepted},buttonStyle:"secondary",type:"submit",children:"Add to cart"}),y,b),o(c,h(B,{get disabled(){return n.isSending},buttonStyle:"secondary",onClick:t,type:"reset",children:"Cancel"}),T,V),o(a,(()=>{var u=U(()=>!!n.isSending);return()=>u()&&g(Se)})(),d,v),o(a,(()=>{var u=U(()=>{var w;return!!((w=n.error)!=null&&w.message)});return()=>u()&&(()=>{var w=g(xe);return o(w,()=>n.error.message),w})()})(),E,m),o(a,()=>r().subtext,Q,W),D(()=>N(e,"disabled",n.isSending)),D(()=>N(e,"value",n.iLokId)),a})()]}})})}globalThis.document&&ie(Ee,document.body);function ze(I){const[t,A]=re(I,["product","upgrade","rent","onClick","disabled"]),[r,a]=G(void 0);let S;return[h(B,le(A,{get disabled(){return U(()=>r()===void 0)()?t.disabled:r()},onClick:async l=>{var p;if(console.log(l),(p=t==null?void 0:t.onClick)==null||p.call(t,l),t.rent){const e=()=>O().find(i=>i.pid===t.rent);Y({productId:t.rent,text:()=>[(()=>{var i=g(ye),$=i.firstChild,x=$.nextSibling,c=x.firstChild,M=c.firstChild,[y,b]=_(M.nextSibling);y.nextSibling;var k=c.nextSibling,L=k.firstChild,T=L.nextSibling,[V,s]=_(T.nextSibling),d=V.nextSibling,v=d.nextSibling,[P,E]=_(v.nextSibling);return P.nextSibling,o($,()=>{var m;return(m=e())==null?void 0:m.display}),o(c,()=>{var m;return(m=e())==null?void 0:m.price},y,b),o(k,()=>{var m;return(18*(((m=e())==null?void 0:m.totalValue)||0)).toFixed(2)},V,s),o(k,()=>{var m;return(m=z())==null?void 0:m.currency},P,E),i})(),g(ve)],condition:["I agree with the"," ",g(ke)],subtext:[g(we),g(Ce)],label:"Enter your iLok account to start the rent-to-own subscription:",validate:async i=>{var c;const $=(c=e())==null?void 0:c.attributes.paceProductId,x=await ce(i,$||"");if(!x.ok)throw new Error(x.message);if(console.log(x),x.numAccountsByEmail>1&&await S(y=>[(()=>{var b=g(Ie),k=b.firstChild,L=k.nextSibling;return o(L,i),b})(),h(B,{style:"display:block;",class:"mb-2",buttonStyle:"secondary",onClick:()=>y.close("continue"),get children(){return["Continue with ",i]}}),h(B,{buttonStyle:"primary",onClick:()=>y.close(""),children:"Use different account"})])!=="continue")throw new Error("")}})}else if(t.upgrade){const e=()=>O().find(i=>i.pid===t.upgrade);Y({productId:t.upgrade,label:"Please enter your iLok account that contains a soothe(1) license",text:()=>(()=>{var i=g(Le),$=i.firstChild,x=$.nextSibling,[c,M]=_(x.nextSibling),y=c.nextSibling,b=y.nextSibling,k=b.nextSibling,L=k.nextSibling,[T,V]=_(L.nextSibling);return T.nextSibling,o(i,()=>{var s;return(s=e())==null?void 0:s.display},c,M),o(b,()=>{var s;return(s=e())==null?void 0:s.price}),o(i,(()=>{var s=U(()=>{var d;return(((d=e())==null?void 0:d.discountTotalValue)||0)>0});return()=>s()&&(()=>{var d=g(Pe);return d.style.setProperty("color","var(--form-color)"),o(d,()=>{var v;return(v=e())==null?void 0:v.unitPrice}),d})()})(),T,V),D(s=>{var P,E;var d=(((P=e())==null?void 0:P.discountTotalValue)||0)>0?"text-muted":"",v=(((E=e())==null?void 0:E.discountTotalValue)||0)>0?"line-through":"";return d!==s.e&&oe(b,s.e=d),v!==s.t&&((s.t=v)!=null?b.style.setProperty("text-decoration",v):b.style.removeProperty("text-decoration")),s},{e:void 0,t:void 0}),i})(),validate:async i=>{const $=await de(i);if(!$.ok)throw new Error($.message)}})}else console.log(O()),O().find(e=>e.pid===t.product&&e.selected)?q():(a(!0),await me(t.product),q(),a(!1))}})),h(be,{setOpener:l=>{S=l}})]}export{Ae as __vite_legacy_guard,ze as default};
