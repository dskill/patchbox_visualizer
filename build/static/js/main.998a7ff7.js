/*! For license information please see main.998a7ff7.js.LICENSE.txt */
  0% {
    transform: scale(0);
    opacity: 0.1;
  }

  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`)),yD=sD(fD||(fD=gD`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`)),bD=sD(pD||(pD=gD`
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.92);
  }

  100% {
    transform: scale(1);
  }
`)),xD=(0,VL.ZP)("span",{name:"MuiTouchRipple",slot:"Root"})({overflow:"hidden",pointerEvents:"none",position:"absolute",zIndex:0,top:0,right:0,bottom:0,left:0,borderRadius:"inherit"}),wD=(0,VL.ZP)(lD,{name:"MuiTouchRipple",slot:"Ripple"})(mD||(mD=gD`
  opacity: 0;
  position: absolute;

  &.${0} {
    opacity: 0.3;
    transform: scale(1);
    animation-name: ${0};
    animation-duration: ${0}ms;
    animation-timing-function: ${0};
  }

  &.${0} {
    animation-duration: ${0}ms;
  }

  & .${0} {
    opacity: 1;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: currentColor;
  }

  & .${0} {
    opacity: 0;
    animation-name: ${0};
    animation-duration: ${0}ms;
    animation-timing-function: ${0};
  }

  & .${0} {
    position: absolute;
    /* @noflip */
    left: 0px;
    top: 0;
    animation-name: ${0};
    animation-duration: 2500ms;
    animation-timing-function: ${0};
    animation-iteration-count: infinite;
    animation-delay: 200ms;
  }
`),cD.rippleVisible,vD,550,(e=>{let{theme:t}=e;return t.transitions.easing.easeInOut}),cD.ripplePulsate,(e=>{let{theme:t}=e;return t.transitions.duration.shorter}),cD.child,cD.childLeaving,yD,550,(e=>{let{theme:t}=e;return t.transitions.easing.easeInOut}),cD.childPulsate,bD,(e=>{let{theme:t}=e;return t.transitions.easing.easeInOut})),SD=r.forwardRef((function(e,t){const n=(0,$L.Z)({props:e,name:"MuiTouchRipple"}),{center:i=!1,classes:o={},className:a}=n,s=(0,HL.Z)(n,dD),[l,u]=r.useState([]),c=r.useRef(0),d=r.useRef(null);r.useEffect((()=>{d.current&&(d.current(),d.current=null)}),[l]);const h=r.useRef(!1),f=r.useRef(null),p=r.useRef(null),m=r.useRef(null);r.useEffect((()=>()=>{clearTimeout(f.current)}),[]);const g=r.useCallback((e=>{const{pulsate:t,rippleX:n,rippleY:r,rippleSize:i,cb:a}=e;u((e=>[...e,(0,Km.jsx)(wD,{classes:{ripple:(0,GL.Z)(o.ripple,cD.ripple),rippleVisible:(0,GL.Z)(o.rippleVisible,cD.rippleVisible),ripplePulsate:(0,GL.Z)(o.ripplePulsate,cD.ripplePulsate),child:(0,GL.Z)(o.child,cD.child),childLeaving:(0,GL.Z)(o.childLeaving,cD.childLeaving),childPulsate:(0,GL.Z)(o.childPulsate,cD.childPulsate)},timeout:550,pulsate:t,rippleX:n,rippleY:r,rippleSize:i},c.current)])),c.current+=1,d.current=a}),[o]),v=r.useCallback((function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:()=>{};const{pulsate:r=!1,center:o=i||t.pulsate,fakeElement:a=!1}=t;if("mousedown"===(null==e?void 0:e.type)&&h.current)return void(h.current=!1);"touchstart"===(null==e?void 0:e.type)&&(h.current=!0);const s=a?null:m.current,l=s?s.getBoundingClientRect():{width:0,height:0,left:0,top:0};let u,c,d;if(o||void 0===e||0===e.clientX&&0===e.clientY||!e.clientX&&!e.touches)u=Math.round(l.width/2),c=Math.round(l.height/2);else{const{clientX:t,clientY:n}=e.touches&&e.touches.length>0?e.touches[0]:e;u=Math.round(t-l.left),c=Math.round(n-l.top)}if(o)d=Math.sqrt((2*l.width**2+l.height**2)/3),d%2===0&&(d+=1);else{const e=2*Math.max(Math.abs((s?s.clientWidth:0)-u),u)+2,t=2*Math.max(Math.abs((s?s.clientHeight:0)-c),c)+2;d=Math.sqrt(e**2+t**2)}null!=e&&e.touches?null===p.current&&(p.current=()=>{g({pulsate:r,rippleX:u,rippleY:c,rippleSize:d,cb:n})},f.current=setTimeout((()=>{p.current&&(p.current(),p.current=null)}),80)):g({pulsate:r,rippleX:u,rippleY:c,rippleSize:d,cb:n})}),[i,g]),y=r.useCallback((()=>{v({},{pulsate:!0})}),[v]),b=r.useCallback(((e,t)=>{if(clearTimeout(f.current),"touchend"===(null==e?void 0:e.type)&&p.current)return p.current(),p.current=null,void(f.current=setTimeout((()=>{b(e,t)})));p.current=null,u((e=>e.length>0?e.slice(1):e)),d.current=t}),[]);return r.useImperativeHandle(t,(()=>({pulsate:y,start:v,stop:b})),[y,v,b]),(0,Km.jsx)(xD,(0,Nm.Z)({className:(0,GL.Z)(cD.root,o.root,a),ref:m},s,{children:(0,Km.jsx)(iD,{component:null,exit:!0,children:l})}))})),_D=SD;var MD=n(1217);function ED(e){return(0,MD.Z)("MuiButtonBase",e)}const TD=(0,uD.Z)("MuiButtonBase",["root","disabled","focusVisible"]),CD=["action","centerRipple","children","className","component","disabled","disableRipple","disableTouchRipple","focusRipple","focusVisibleClassName","LinkComponent","onBlur","onClick","onContextMenu","onDragLeave","onFocus","onFocusVisible","onKeyDown","onKeyUp","onMouseDown","onMouseLeave","onMouseUp","onTouchEnd","onTouchMove","onTouchStart","tabIndex","TouchRippleProps","touchRippleRef","type"],AD=(0,VL.ZP)("button",{name:"MuiButtonBase",slot:"Root",overridesResolver:(e,t)=>t.root})({display:"inline-flex",alignItems:"center",justifyContent:"center",position:"relative",boxSizing:"border-box",WebkitTapHighlightColor:"transparent",backgroundColor:"transparent",outline:0,border:0,margin:0,borderRadius:0,padding:0,cursor:"pointer",userSelect:"none",verticalAlign:"middle",MozAppearance:"none",WebkitAppearance:"none",textDecoration:"none",color:"inherit","&::-moz-focus-inner":{borderStyle:"none"},[`&.${TD.disabled}`]:{pointerEvents:"none",cursor:"default"},"@media print":{colorAdjust:"exact"}}),RD=r.forwardRef((function(e,t){const n=(0,$L.Z)({props:e,name:"MuiButtonBase"}),{action:i,centerRipple:o=!1,children:a,className:s,component:l="button",disabled:u=!1,disableRipple:c=!1,disableTouchRipple:d=!1,focusRipple:h=!1,LinkComponent:f="a",onBlur:p,onClick:m,onContextMenu:g,onDragLeave:v,onFocus:y,onFocusVisible:b,onKeyDown:x,onKeyUp:w,onMouseDown:S,onMouseLeave:_,onMouseUp:M,onTouchEnd:E,onTouchMove:T,onTouchStart:C,tabIndex:A=0,TouchRippleProps:R,touchRippleRef:k,type:P}=n,L=(0,HL.Z)(n,CD),D=r.useRef(null),U=r.useRef(null),O=(0,qL.Z)(U,k),{isFocusVisibleRef:I,onFocus:z,onBlur:F,ref:B}=(0,XL.Z)(),[N,H]=r.useState(!1);u&&N&&H(!1),r.useImperativeHandle(i,(()=>({focusVisible:()=>{H(!0),D.current.focus()}})),[]);const[G,j]=r.useState(!1);r.useEffect((()=>{j(!0)}),[]);const W=G&&!c&&!u;function V(e,t){let n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:d;return(0,ZL.Z)((r=>{t&&t(r);return!n&&U.current&&U.current[e](r),!0}))}r.useEffect((()=>{N&&h&&!c&&G&&U.current.pulsate()}),[c,h,N,G]);const $=V("start",S),q=V("stop",g),Z=V("stop",v),X=V("stop",M),Y=V("stop",(e=>{N&&e.preventDefault(),_&&_(e)})),K=V("start",C),Q=V("stop",E),J=V("stop",T),ee=V("stop",(e=>{F(e),!1===I.current&&H(!1),p&&p(e)}),!1),te=(0,ZL.Z)((e=>{D.current||(D.current=e.currentTarget),z(e),!0===I.current&&(H(!0),b&&b(e)),y&&y(e)})),ne=()=>{const e=D.current;return l&&"button"!==l&&!("A"===e.tagName&&e.href)},re=r.useRef(!1),ie=(0,ZL.Z)((e=>{h&&!re.current&&N&&U.current&&" "===e.key&&(re.current=!0,U.current.stop(e,(()=>{U.current.start(e)}))),e.target===e.currentTarget&&ne()&&" "===e.key&&e.preventDefault(),x&&x(e),e.target===e.currentTarget&&ne()&&"Enter"===e.key&&!u&&(e.preventDefault(),m&&m(e))})),oe=(0,ZL.Z)((e=>{h&&" "===e.key&&U.current&&N&&!e.defaultPrevented&&(re.current=!1,U.current.stop(e,(()=>{U.current.pulsate(e)}))),w&&w(e),m&&e.target===e.currentTarget&&ne()&&" "===e.key&&!e.defaultPrevented&&m(e)}));let ae=l;"button"===ae&&(L.href||L.to)&&(ae=f);const se={};"button"===ae?(se.type=void 0===P?"button":P,se.disabled=u):(L.href||L.to||(se.role="button"),u&&(se["aria-disabled"]=u));const le=(0,qL.Z)(t,B,D);const ue=(0,Nm.Z)({},n,{centerRipple:o,component:l,disabled:u,disableRipple:c,disableTouchRipple:d,focusRipple:h,tabIndex:A,focusVisible:N}),ce=(e=>{const{disabled:t,focusVisible:n,focusVisibleClassName:r,classes:i}=e,o={root:["root",t&&"disabled",n&&"focusVisible"]},a=(0,jL.Z)(o,ED,i);return n&&r&&(a.root+=` ${r}`),a})(ue);return(0,Km.jsxs)(AD,(0,Nm.Z)({as:ae,className:(0,GL.Z)(ce.root,s),ownerState:ue,onBlur:ee,onClick:m,onContextMenu:q,onFocus:te,onKeyDown:ie,onKeyUp:oe,onMouseDown:$,onMouseLeave:Y,onMouseUp:X,onDragLeave:Z,onTouchEnd:Q,onTouchMove:J,onTouchStart:K,ref:le,tabIndex:u?-1:A,type:P},se,L,{children:[a,W?(0,Km.jsx)(_D,(0,Nm.Z)({ref:O,center:o},R)):null]}))})),kD=RD;var PD=n(4036);function LD(e){return(0,MD.Z)("MuiIconButton",e)}const DD=(0,uD.Z)("MuiIconButton",["root","disabled","colorInherit","colorPrimary","colorSecondary","colorError","colorInfo","colorSuccess","colorWarning","edgeStart","edgeEnd","sizeSmall","sizeMedium","sizeLarge"]),UD=["edge","children","className","color","disabled","disableFocusRipple","size"],OD=(0,VL.ZP)(kD,{name:"MuiIconButton",slot:"Root",overridesResolver:(e,t)=>{const{ownerState:n}=e;return[t.root,"default"!==n.color&&t[`color${(0,PD.Z)(n.color)}`],n.edge&&t[`edge${(0,PD.Z)(n.edge)}`],t[`size${(0,PD.Z)(n.size)}`]]}})((e=>{let{theme:t,ownerState:n}=e;return(0,Nm.Z)({textAlign:"center",flex:"0 0 auto",fontSize:t.typography.pxToRem(24),padding:8,borderRadius:"50%",overflow:"visible",color:(t.vars||t).palette.action.active,transition:t.transitions.create("background-color",{duration:t.transitions.duration.shortest})},!n.disableRipple&&{"&:hover":{backgroundColor:t.vars?`rgba(${t.vars.palette.action.activeChannel} / ${t.vars.palette.action.hoverOpacity})`:(0,WL.Fq)(t.palette.action.active,t.palette.action.hoverOpacity),"@media (hover: none)":{backgroundColor:"transparent"}}},"start"===n.edge&&{marginLeft:"small"===n.size?-3:-12},"end"===n.edge&&{marginRight:"small"===n.size?-3:-12})}),(e=>{let{theme:t,ownerState:n}=e;var r;const i=null==(r=(t.vars||t).palette)?void 0:r[n.color];return(0,Nm.Z)({},"inherit"===n.color&&{color:"inherit"},"inherit"!==n.color&&"default"!==n.color&&(0,Nm.Z)({color:null==i?void 0:i.main},!n.disableRipple&&{"&:hover":(0,Nm.Z)({},i&&{backgroundColor:t.vars?`rgba(${i.mainChannel} / ${t.vars.palette.action.hoverOpacity})`:(0,WL.Fq)(i.main,t.palette.action.hoverOpacity)},{"@media (hover: none)":{backgroundColor:"transparent"}})}),"small"===n.size&&{padding:5,fontSize:t.typography.pxToRem(18)},"large"===n.size&&{padding:12,fontSize:t.typography.pxToRem(28)},{[`&.${DD.disabled}`]:{backgroundColor:"transparent",color:(t.vars||t).palette.action.disabled}})})),ID=r.forwardRef((function(e,t){const n=(0,$L.Z)({props:e,name:"MuiIconButton"}),{edge:r=!1,children:i,className:o,color:a="default",disabled:s=!1,disableFocusRipple:l=!1,size:u="medium"}=n,c=(0,HL.Z)(n,UD),d=(0,Nm.Z)({},n,{edge:r,color:a,disabled:s,disableFocusRipple:l,size:u}),h=(e=>{const{classes:t,disabled:n,color:r,edge:i,size:o}=e,a={root:["root",n&&"disabled","default"!==r&&`color${(0,PD.Z)(r)}`,i&&`edge${(0,PD.Z)(i)}`,`size${(0,PD.Z)(o)}`]};return(0,jL.Z)(a,LD,t)})(d);return(0,Km.jsx)(OD,(0,Nm.Z)({className:(0,GL.Z)(h.root,o),centerRipple:!0,focusRipple:!l,disabled:s,ref:t,ownerState:d},c,{children:i}))})),zD=ID;var FD=n(215),BD=n(2646);let ND,HD;function GD(){new URLSearchParams(window.location.search).get("allow_server");const[e,t]=(0,r.useState)([0,0,0,0]),[n,i]=(0,r.useState)([0,0,0,0]),[o,a]=(0,r.useState)([]),[s,l]=(0,r.useState)([]),[u,c]=(0,r.useState)(1),[d,h]=(0,r.useState)(!0),[f,p]=(0,r.useState)(null),m=["Glitch Distortion","Distortion","Scope","Scope Distortion","Pitch Follow","Wah Delay","Block Test"],[{currentEffect:g,ip:v},y]=PR((()=>({ip:{value:"localhost",transient:!1,editable:!1},currentEffect:{value:"Distortion",transient:!1,options:m},resolution:{value:1024,options:[32,64,128,256,512,1024,2048,4096],onChange:e=>{ND.setResolution(e),HD.setResolution(e),p(HD.texture)}},downsample:{value:8,options:[1,2,4,8,16,32,64,128,256],onChange:e=>{ND.send("chunkDownsample",e)}}})));let b={};function x(){Cm(((e,n,r)=>{ND.update(n),HD.update(ND.waveformArray0,ND.waveformArray1),t(HD.waveformRms),i(HD.waveformRmsAccum),a(ND.waveformArray0),l(ND.waveformArray1)}))}b.waveformTexture=HD,b.waveformRms=e,b.waveformRmsAccum=n,b.oscNetworkBridge=ND,b.setDpr=c,b.currentEffect=g,b.setUI=y,b.waveformTex=f,b.effectOptions=m,b.waveform0=o,b.waveform1=s,(0,r.useEffect)((()=>{ND.osc_connection.on("open",(()=>{h(!0)})),console.log("retrieving IP from ",window.location.hostname+"/ip"),fetch(window.location.hostname+"/ip").then((e=>e.json())).then((e=>b.setUI({ip:e.ip})))}),[]);const w=()=>{console.log("swipe_right");let e=b.effectOptions.indexOf(b.currentEffect)+1;e>b.effectOptions.length-1&&(e=0),b.setUI({currentEffect:b.effectOptions[e]})},S=()=>{console.log("swipe_left");let e=b.effectOptions.indexOf(b.currentEffect)-1;e<0&&(e=b.effectOptions.length-1),b.setUI({currentEffect:b.effectOptions[e]})},_={width:"100%",height:"100%",margin:"0px",padding:"0px",touchAction:"none"};return d?(0,Km.jsxs)(Km.Fragment,{children:[(0,Km.jsx)(RR,{}),(0,Km.jsxs)("div",{style:_,children:[(0,Km.jsx)(zD,{size:"large",variant:"outlined",color:"primary",sx:{display:"grid",width:200,height:200,padding:1,margin:2,position:"absolute",alignItems:"center",justifyContent:"center",left:-10,bottom:-10,zIndex:1,opacity:.1},onClick:S,children:(0,Km.jsx)(BD.Z,{sx:{width:150,height:150}})}),(0,Km.jsx)(zD,{size:"large",variant:"outlined",color:"primary",sx:{display:"grid",width:200,height:200,padding:1,margin:2,position:"absolute",alignItems:"center",justifyContent:"center",right:-10,bottom:-10,zIndex:1,opacity:.1},onClick:w,children:(0,Km.jsx)(FD.Z,{sx:{width:150,height:150}})}),(0,Km.jsxs)(Ym,{linear:!0,dpr:u,children:[(0,Km.jsx)(cx,{position:"top-left",minimal:"true"}),(()=>{switch(g){case"Distortion":return(0,Km.jsx)(Dk,{...b});case"Scope":return(0,Km.jsx)(Ok,{...b});case"Scope Distortion":return(0,Km.jsx)(zk,{...b});case"Glitch Distortion":return(0,Km.jsx)(YP,{...b});case"Wah Delay":return(0,Km.jsx)(NL,{...b});case"Pitch Follow":return(0,Km.jsx)(BL,{...b});case"Block Test":return(0,Km.jsx)(zL,{...b});default:return null}})(),(0,Km.jsx)(x,{})]})]})]}):(0,Km.jsx)("h1",{children:"Connecting..."})}null!=ND&&ND.destroy(),ND=new class{constructor(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:512,t=arguments.length>1?arguments[1]:void 0;this.is_connected=!1,this.osc_updates=0,this.osc_samples=0,this.osc_update_timer=0,this.waveform_update_timer=0,this.waveformArray0=[],this.waveformArray1=[],this.queue=[],this.waveformArray0.length=e,this.waveformArray1.length=e;const n={host:t,port:8080};this.osc_connection=new(DR())({plugin:new(DR().WebsocketClientPlugin)(n)}),this.osc_connection.on("*",(e=>{const t=e.args;"/waveform0"===e.address?(this.waveformArray0=this.waveformArray0.concat(t),this.waveformArray0.splice(0,t.length),this.osc_updates+=1,this.osc_samples+=t.length):"/waveform1"===e.address?(this.waveformArray1=this.waveformArray1.concat(t),this.waveformArray1.splice(0,t.length)):console.log("non waveform message:",e.address,e.args)})),this.osc_connection.on("/{foo,bar}/*/param",(e=>{console.log(e.args)})),this.osc_connection.on("open",(()=>{this.is_connected=!0,console.log("OSC connection opened")})),console.log("trying to open osc connection"),this.osc_connection.open()}update(e){this.osc_update_timer+=e,this.waveform_update_timer+=e,this.osc_update_timer>.1&&(console.log("OSC SAMPLES: "+this.osc_samples),console.log("OSC FPS: "+this.osc_updates/this.osc_update_timer),this.osc_update_timer=0,this.osc_updates=0,this.osc_samples=0,console.log("Sending OSC messages: "+this.queue.length),this.sendQueue())}setResolution(e){this.waveformArray0.length=e,this.waveformArray1.length=e}addToQueue(e,t){for(let n=0;n<this.queue.length;n++)if(this.queue[n].name===e)return void(this.queue[n].value=t);this.queue.push({name:e,value:t})}sendQueue(){if(this.is_connected)for(let e=0;e<this.queue.length;e++)this.osc_connection.send(new(DR().Message)("/"+this.queue[e].name,this.queue[e].value));this.queue=[]}send(e,t){this.addToQueue(e,t)}destroy(){this.osc_connection.close()}}(512,"localhost"),HD=new class{constructor(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:512;this.height=1,this.waveformRms=[0,0,0,0],this.waveformRmsAccum=[0,0,0,0],this.resolution=e;const t=this.resolution*this.height,n=new Float32Array(4*t);let r=new qn("red");Math.floor(255*r.r),Math.floor(255*r.g),Math.floor(255*r.b);this.texture=new Wl(n,this.resolution,this.height,Fe,Pe),this.texture.encoding=Ut,this.waveformRms=[0,0,0,0],this.waveformRmsAccum=[0,0,0,0]}update(e,t){const n=this.texture.image.width*this.texture.image.height,r=this.texture.image.data;(isNaN(this.waveformRmsAccum[0])||isNaN(this.waveformRmsAccum[1]))&&(this.waveformRmsAccum=[0,0,0,0]),(isNaN(this.waveformRms[0])||isNaN(this.waveformRms[1]))&&(this.waveformRms=[0,0,0,0]);for(let i=0;i<n;i++)r[4*i]=e[i],r[4*i+1]=t[i],r[4*i+2]=0,r[4*i+3]=0,this.waveformRms[0]+=r[4*i]*r[4*i],this.waveformRms[1]+=r[4*i+1]*r[4*i+1],this.waveformRms[2]+=r[4*i+2]*r[4*i+2],this.waveformRms[3]+=r[4*i+3]*r[4*i+3];this.waveformRms[0]=Math.sqrt(this.waveformRms[0]/this.resolution),this.waveformRms[1]=Math.sqrt(this.waveformRms[1]/this.resolution),this.waveformRms[2]=Math.sqrt(this.waveformRms[2]/this.resolution),this.waveformRms[3]=Math.sqrt(this.waveformRms[3]/this.resolution),this.waveformRmsAccum[0]+=this.waveformRms[0],this.waveformRmsAccum[1]+=this.waveformRms[1],this.waveformRmsAccum[2]+=this.waveformRms[2],this.waveformRmsAccum[3]+=this.waveformRms[3],this.texture.needsUpdate=!0}setResolution(e){console.log("setting waveform texture resolution to "+e),this.resolution=e;const t=this.resolution*this.height,n=new Float32Array(4*t);this.texture.dispose(),this.texture=new Wl(n,this.resolution,this.height,Fe,Pe),this.texture.encoding=Ut}}(512),(0,t.s)(document.getElementById("root")).render((0,Km.jsx)(GD,{}))})()})();
//# sourceMappingURL=main.998a7ff7.js.map