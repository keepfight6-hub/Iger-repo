/* Pulau Kemarin & Pulau Besok — mesin adegan (semua frame dihitung dari t) */

/* ==== [0] inti */
const W=1080,H=1920;
const AMAN={atas:180,bawah:1620,kiri:70,kanan:930};
const lerp=(a,b,k)=>a+(b-a)*k, clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const seg=(t,a,b)=>clamp((t-a)/(b-a));
const sstep=(a,b,t)=>{const k=seg(t,a,b);return k*k*(3-2*k);};
const E={in:k=>k*k*k,out:k=>1-(1-k)**3,io:k=>k<.5?4*k*k*k:1-((-2*k+2)**3)/2,
  s:k=>k*k*k*(k*(k*6-15)+10),back:k=>{const c=1.70158;return 1+(c+1)*((k-1)**3)+c*((k-1)**2);}};
const hash=n=>{n=Math.sin(n*127.1+311.7)*43758.5453;return n-Math.floor(n);};
const rng=s=>()=>((s=(s*1664525+1013904223)>>>0)/4294967296);
const nz=(t,b=0)=>{const i=Math.floor(t),f=t-i,u=f*f*(3-2*f);return lerp(hash(i+b*57)*2-1,hash(i+1+b*57)*2-1,u);};
function kanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const mix3=(a,b,k)=>[lerp(a[0],b[0],k),lerp(a[1],b[1],k),lerp(a[2],b[2],k)];
function h2(x,y){let n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);}
function vn(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);
  return lerp(lerp(h2(ix,iy),h2(ix+1,iy),ux),lerp(h2(ix,iy+1),h2(ix+1,iy+1),ux),uy);}
function fbm(x,y,o=5){let s=0,a=.5,f=1;for(let i=0;i<o;i++){s+=a*vn(x*f,y*f);f*=2.03;a*=.5;}return s;}
/* jendela tampil: muncul di a (lama da), hilang di b (lama db) */
const jendela=(t,a,b,da=.5,db=.4)=>E.out(seg(t,a,a+da))*(1-E.in(seg(t,b,b+db)));

/* ==== [A] TOPIK */
const PAL={
  tundra:hex('#56603D'), tundra2:hex('#6E6A4A'), lumut:hex('#3F4B2D'), batu:hex('#7D7464'), batuG:hex('#55504A'), salju:hex('#E6ECEF'),
  pantai:hex('#9C8E72'),
  laut0:hex('#3FA3B0'), laut1:hex('#1F7590'), laut2:hex('#155A7C'), laut3:hex('#0E3B5E'),
  buih:hex('#D9F4EE'), gema:hex('#BFE9EF'), bayang:hex('#22364E'),
  krem:'#FFF6E6', senin:'#8FE0FF', selasa:'#FFC76E', es:'#DDF2FF'
};
const KABUT_PANAS=[143/255,169/255,184/255], KABUT_DINGIN=[120/255,138/255,170/255];
const MATAHARI=new THREE.Vector3(-.55,.62,.56).normalize();
/* kotak relief lokal (kedua pulau), bujur 0..360 */
const WIL={lon0:190.86,lon1:191.16,lat0:65.705,lat1:65.86};
const LONC=(WIL.lon0+WIL.lon1)/2, LATC=(WIL.lat0+WIL.lat1)/2;
const KX=Math.cos(LATC*Math.PI/180), KMLAT=111.32, KMLON=111.32*KX;
const toX=lon=>(lon-LONC)*KMLON, toZ=lat=>-(lat-LATC)*KMLAT;
const EX=2.3, EXW=7;                 /* pembesaran tinggi: pulau, peta besar */
const LON_TANGGAL=191.028;           /* garis batas tanggal di antara kedua pulau (~168°58'BB) */
const XDL=toX(LON_TANGGAL);
/* kotak peta besar Selat Bering */
const WILB={lon0:186.0,lon1:196.2,lat0:64.15,lat1:67.45};
/* titik penting (bujur 0..360) */
const TANJUNG_RU=[190.35,66.08];     /* Tanjung Dezhnev, Rusia */
const TANJUNG_AS=[191.95,65.62];     /* Tanjung Prince of Wales, Alaska */
/* garis batas tanggal internasional (perkiraan jalurnya di peta ini) */
const IDL=[[180.0,75.0],[191.03,68.25],[191.03,65.5],[188.4,64.2],[183.0,61.5]];

/* ==== WAKTU (detik, dari jeda VO) */
const T={
  buka:1.15, nama:.55, jarakA:1.3, jarakB:2.55, jarakOut:3.05, garis:3.0, senin:3.85, selasa:5.72,
  aneh:6.62, negara:7.65, beda:8.45, sempit:9.62, labelOut:9.7,
  awan2:[12.9,14.9], selat:13.9, rusia:15.05, amerika:15.54, km80:17.6, km80Out:20.2, besarOut:20.6,
  dBesar:21.65, dKecil:22.7, idl:24.9, idlLabel:25.65, idlOut:28.9,
  jamBesar:29.05, jam21:30.8, jamMaju:31.85, jamKecil:32.55, besok:35.8, kemarin:36.75, julukOut:38.0,
  dingin:38.15, beku:40.6, cair:41.3, th1987:42.05, perenang:44.65, renangA:44.4, renangB:48.7, out1987:48.9,
  kamu:50.0, seninK:51.85, selasaK:55.85, km4:57.0, kOut:59.3,
  kalender:59.6, sehari:61.5, tanya:63.1, dur:66.2
};

/* ==== [B] pantai */
function haluskan(r,n){for(let k=0;k<n;k++){const o=[];for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length];
  o.push([.75*a[0]+.25*b[0],.75*a[1]+.25*b[1]],[.25*a[0]+.75*b[0],.25*a[1]+.75*b[1]]);}r=o;}return r;}
function kasarkan(r,seed){
  const o=[];let s=0;
  for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length];const L=Math.hypot(b[0]-a[0],b[1]-a[1]);const n=Math.max(1,Math.ceil(L/.025));
    for(let j=0;j<n;j++){const k=j/n;o.push({x:lerp(a[0],b[0],k),z:lerp(a[1],b[1],k),s:s+L*k});}s+=L;}
  const m=o.length,res=[];
  for(let i=0;i<m;i++){const p=o[(i-1+m)%m],q=o[(i+1)%m];let nx=q.z-p.z,nzz=-(q.x-p.x);const l=Math.hypot(nx,nzz)||1;nx/=l;nzz/=l;
    const u=o[i].s, d=.075*(vn(u/.55+seed,3)-.5)*2+.035*(vn(u/.18+seed,7)-.5)*2+.014*(vn(u/.06+seed,11)-.5)*2;
    res.push([o[i].x+nx*d,o[i].z+nzz*d]);}
  return res;}
function bbox(ring){let mx=1e9,Mx=-1e9,my=1e9,My=-1e9;for(const[x,y] of ring){mx=Math.min(mx,x);Mx=Math.max(Mx,x);my=Math.min(my,y);My=Math.max(My,y);}return{mx,Mx,my,My};}
const PULAU=[],DARATB=[];
for(const ring of window.COAST){
  const b=bbox(ring);
  const diLokal=b.mx>WIL.lon0&&b.Mx<WIL.lon1&&b.my>WIL.lat0&&b.My<WIL.lat1;
  const km=ring.map(([lo,la])=>[toX(lo),toZ(la)]);
  if(diLokal){const cx=(b.mx+b.Mx)/2;PULAU.push({r:kasarkan(haluskan(km,3),PULAU.length*17.3),besar:cx<LON_TANGGAL});continue;}
  if(b.Mx<WILB.lon0||b.mx>WILB.lon1||b.My<WILB.lat0||b.my>WILB.lat1)continue;
  if(ring.length<20&&b.Mx-b.mx>5)continue;   /* sisa potongan garis antimeridian yang rusak */
  DARATB.push({r:km,ru:(b.mx+b.Mx)/2<190.6});
}
const BESAR=PULAU.find(p=>p.besar), KECIL=PULAU.find(p=>!p.besar);

/* ==== [C] panggang relief (umum untuk peta pulau & peta besar) */
function panggang(o){
  const {x0,x1,z0,z1}=o.box, gw=o.gw, pxkm=(x1-x0)/gw, gh=Math.round((z1-z0)/pxkm), N=gw*gh;
  const mc=kanvas(gw,gh),m=mc.getContext('2d');m.fillStyle='#000';m.fillRect(0,0,gw,gh);
  const px=x=>(x-x0)/pxkm, pz=z=>(z-z0)/pxkm;
  o.cincin.forEach(P=>{m.fillStyle=P.warnaId;m.beginPath();P.r.forEach(([x,z],i)=>i?m.lineTo(px(x),pz(z)):m.moveTo(px(x),pz(z)));m.closePath();m.fill();});
  const md=m.getImageData(0,0,gw,gh).data;
  const land=new Uint8Array(N),id=new Uint8Array(N);
  for(let i=0;i<N;i++){const r=md[i*4],g=md[i*4+1];if(r>127||g>127){land[i]=1;id[i]=r>127?1:2;}}
  function jarak(isIn){const d=new Float32Array(N);const INF=1e7,D=1.4142;
    for(let i=0;i<N;i++)d[i]=(land[i]===isIn)?INF:0;
    for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){const i=y*gw+x;let v=d[i];if(!v)continue;
      if(x>0)v=Math.min(v,d[i-1]+1);if(y>0){v=Math.min(v,d[i-gw]+1);if(x>0)v=Math.min(v,d[i-gw-1]+D);if(x<gw-1)v=Math.min(v,d[i-gw+1]+D);}d[i]=v;}
    for(let y=gh-1;y>=0;y--)for(let x=gw-1;x>=0;x--){const i=y*gw+x;let v=d[i];if(!v)continue;
      if(x<gw-1)v=Math.min(v,d[i+1]+1);if(y<gh-1){v=Math.min(v,d[i+gw]+1);if(x<gw-1)v=Math.min(v,d[i+gw+1]+D);if(x>0)v=Math.min(v,d[i+gw-1]+D);}d[i]=v;}
    for(let i=0;i<N;i++)d[i]=Math.min(d[i]*pxkm,999);return d;}
  const dIn=jarak(1), dOut=jarak(0);
  const HM=new Float32Array(N);
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){const i=y*gw+x;if(!land[i])continue;
    HM[i]=Math.max(.004,o.tinggi(x0+x*pxkm,z0+y*pxkm,dIn[i],id[i]));}
  const TT=new Float32Array(N);
  for(let pass=0;pass<2;pass++){for(let y=1;y<gh-1;y++)for(let x=1;x<gw-1;x++){const i=y*gw+x;if(!land[i]){TT[i]=0;continue;}
    TT[i]=(HM[i]*4+HM[i-1]+HM[i+1]+HM[i-gw]+HM[i+gw])/8;}HM.set(TT);}
  for(let i=0;i<N;i++)if(!land[i])HM[i]=0;
  const puncak={};
  [1,2].forEach(k=>{let b=-1,bi=0;for(let i=0;i<N;i++)if(id[i]===k&&HM[i]>b){b=HM[i];bi=i;}
    puncak[k]={x:x0+(bi%gw)*pxkm,z:z0+Math.floor(bi/gw)*pxkm,h:b};});
  /* bayangan jatuh */
  const s=MATAHARI, sl=Math.hypot(s.x,s.z), dx=s.x/sl, dz=s.z/sl, naik=pxkm*s.y/sl, ex=o.ex;
  let hmax=0;for(let i=0;i<N;i++)hmax=Math.max(hmax,HM[i]*ex);
  const bay=new Float32Array(N);
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){const i=y*gw+x;if(!land[i]&&dOut[i]>o.bayJauh)continue;const h0=HM[i]*ex;let sh=0;
    for(let k=1;k<160;k++){const sx=Math.round(x+dx*k),sy=Math.round(y+dz*k);if(sx<0||sy<0||sx>=gw||sy>=gh)break;
      const need=h0+naik*k;if(need>hmax)break;const hh=HM[sy*gw+sx]*ex;if(hh>need+o.bayTol){sh=Math.max(sh,clamp((hh-need)/(o.bayTol*15)));if(sh>=1)break;}}
    bay[i]=sh;}
  /* warna + info */
  const cv=kanvas(gw,gh),c=cv.getContext('2d');const img=c.createImageData(gw,gh);const D=img.data;
  const ic=kanvas(gw,gh),icx=ic.getContext('2d');const iimg=icx.createImageData(gw,gh);const I=iimg.data;
  const f=o.fs, L=o.laut;
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){const i=y*gw+x;const X=x*pxkm,Z=y*pxkm;let col;
    const tepi=Math.min(x,y,gw-1-x,gh-1-y)*pxkm;
    if(land[i]){
      const hx=(HM[Math.min(i+1,N-1)]-HM[Math.max(i-1,0)])*ex/(2*pxkm), hz=(HM[Math.min(i+gw,N-1)]-HM[Math.max(i-gw,0)])*ex/(2*pxkm);
      let nx=-hx,ny=1,nzv=-hz;const nl=Math.hypot(nx,ny,nzv);nx/=nl;ny/=nl;nzv/=nl;
      const miring=1-ny;
      let lam=Math.max(0,nx*s.x+ny*s.y+nzv*s.z);lam=clamp((lam-.5)*2.2+.5);
      const hn=HM[i]/o.hRef, nn=fbm(X*1.7*f,Z*1.7*f,4);
      let base=mix3(PAL.lumut,PAL.tundra,clamp(hn*1.4));
      base=mix3(base,PAL.tundra2,clamp((nn-.45)*2.2));
      base=mix3(base,PAL.batu,clamp((miring-.28)*2.6));
      base=mix3(base,PAL.batuG,clamp((miring-.55)*2.5)*.7);
      if(dIn[i]<o.pantaiW)base=mix3(base,PAL.pantai,.6);
      const salju=clamp((fbm(X*2.2*f+20,Z*2.2*f,4)-o.saljuAmbang)*5)*clamp(hn*1.6-.4)*clamp(.6-nzv*2.4)*(1-clamp((miring-.4)*3));
      base=mix3(base,PAL.salju,salju*.9);
      const terang=(.26+.82*lam*(1-bay[i]*.85));
      col=[base[0]*terang,base[1]*terang,base[2]*terang];
      col=mix3(col,PAL.bayang,(1-lam)*.22+bay[i]*.18);
      I[i*4]=0;I[i*4+1]=0;I[i*4+2]=Math.round(bay[i]*255);
    }else{
      const d=dOut[i];
      let w=d<L[0]?mix3(PAL.laut0,PAL.laut1,d/L[0]):d<L[1]?mix3(PAL.laut1,PAL.laut2,(d-L[0])/(L[1]-L[0])):mix3(PAL.laut2,PAL.laut3,clamp((d-L[1])/L[2]));
      const riak=vn(X*6*f,Z*6*f)*.6+vn(X*13*f,Z*13*f)*.4;w=mix3(w,PAL.laut3,(riak-.5)*.18);
      for(const g of o.gema){const a=Math.exp(-(((d-g)/o.gemaW)**2))*.16*(1-g/o.gema[2]*.6);w=mix3(w,PAL.gema,a);}
      w=mix3(w,PAL.buih,clamp(1-d/o.buihW)*.85);
      w=mix3(w,[w[0]*.55,w[1]*.6,w[2]*.72],bay[i]*.8);
      col=w;
      I[i*4]=255;I[i*4+1]=Math.round(clamp(d/o.dInfo)*255);I[i*4+2]=Math.round(bay[i]*255);
    }
    if(tepi<o.tepi){col=mix3(PAL.laut3,col,E.s(tepi/o.tepi));if(land[i])I[i*4]=Math.round(255*(1-E.s(tepi/o.tepi)));}
    D[i*4]=col[0];D[i*4+1]=col[1];D[i*4+2]=col[2];D[i*4+3]=255;I[i*4+3]=255;}
  c.putImageData(img,0,0);icx.putImageData(iimg,0,0);
  return {HM,TEX:cv,INFO:ic,gw,gh,pxkm,box:o.box,ex,puncak};
}
function tinggiDi(R,x,z){const fx=(x-R.box.x0)/R.pxkm,fz=(z-R.box.z0)/R.pxkm;
  const a=clamp(Math.floor(fx),0,R.gw-2),b=clamp(Math.floor(fz),0,R.gh-2),u=clamp(fx-a),v=clamp(fz-b);
  const i=b*R.gw+a,M=R.HM;return lerp(lerp(M[i],M[i+1],u),lerp(M[i+R.gw],M[i+R.gw+1],u),v);}

let LOK,BES;
function panggangSemua(){
  LOK=panggang({box:{x0:toX(WIL.lon0),x1:toX(WIL.lon1),z0:toZ(WIL.lat1),z1:toZ(WIL.lat0)},gw:1150,ex:EX,
    cincin:[{r:BESAR.r,warnaId:'#f00'},{r:KECIL.r,warnaId:'#0f0'}],
    tinggi:(X,Z,d,id)=>{const tebing=1-Math.exp(-d/.16);
      const atas=.8+.26*(fbm(X*.8,Z*.8)-.5)+.06*(fbm(X*3.1+9,Z*3.1)-.5);
      const alur=Math.abs(fbm(X*2.2+40,Z*2.2)-.5)*2;
      return (id===1?.505:.494)*Math.pow(tebing,.85)*atas*(1-.35*(1-tebing)*(1-alur));},
    hRef:.5,fs:1,saljuAmbang:.63,pantaiW:.03,laut:[.18,.9,1.8],gema:[.22,.48,.85],gemaW:.012,buihW:.03,dInfo:1,tepi:.05,bayJauh:1.6,bayTol:.002});
  BES=panggang({box:{x0:toX(WILB.lon0),x1:toX(WILB.lon1),z0:toZ(WILB.lat1),z1:toZ(WILB.lat0)},gw:1000,ex:EXW,
    cincin:DARATB.map(P=>({r:P.r,warnaId:P.ru?'#f00':'#0f0'})),
    tinggi:(X,Z,d,id)=>{const f=.022;const r=1-Math.abs(fbm(X*f+3,Z*f)*2-1);
      const hm=id===1?1.05:.8;
      return hm*(1-Math.exp(-d/16))*(.25+.75*fbm(X*f*.6,Z*f*.6+5))*(.45+.75*r*r);},
    hRef:.8,fs:.06,saljuAmbang:.6,pantaiW:.6,laut:[3,18,40],gema:[4,9,18],gemaW:.45,buihW:.7,dInfo:20,tepi:28,bayJauh:30,bayTol:.02});
}

/* ==== [D] three.js */
let REN,SC,CAM,UNI,UL,UB,TIRAI,GARISLAUT;
const NOISE=`
  float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float vn(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
    return mix(mix(h21(i),h21(i+vec2(1,0)),u.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x),u.y);}
  float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*vn(p);p*=2.03;a*=.5;}return s;}`;
const VS=`varying vec2 vUv;varying vec3 vW;varying vec3 vN;void main(){vUv=uv;vN=normal;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
const FS_TANAH=NOISE+`
  uniform sampler2D map,info;uniform float uT,fogN,fogF,xdl,musim,sk,lokal,es,tepiA,jauh;uniform vec3 fogC,sun;uniform vec2 hari;
  varying vec2 vUv;varying vec3 vW;varying vec3 vN;
  void main(){
    vec3 c=texture2D(map,vUv).rgb;vec4 inf=texture2D(info,vUv);float laut=inf.r;float d=inf.g;float bay=inf.b;
    vec2 p=vW.xz/sk;
    vec3 n=normalize(vN);
    if(lokal>.5){
      float st=(1.-smoothstep(.42,.78,n.y))*(1.-laut)*smoothstep(.01,.06,vW.y);
      float lap=vn(vec2(vW.y*26.,(vW.x+vW.z)*2.5))*.6+vn(vec2(vW.y*70.,(vW.x-vW.z)*6.))*.4;
      vec3 rock=mix(vec3(.24,.22,.2),vec3(.5,.46,.4),lap)*(.38+.9*max(dot(n,sun),0.));
      rock=mix(rock,vec3(.16,.2,.27),(1.-max(dot(n,sun),0.))*.35);
      c=mix(c,rock,st);
    }
    float ombak=fbm(p*vec2(2.2,5.)+vec2(uT*.12,-uT*.05));
    c*=1.-laut*(.06-.12*ombak);
    float sp=smoothstep(.8,.95,vn(p*vec2(3.,9.)+vec2(uT*.35,-uT*.2)))*smoothstep(.55,.7,ombak)*laut*(1.-bay);
    c+=vec3(1.,.93,.8)*sp*.22*smoothstep(.05,.4,d)*(1.-musim);
    float bu=laut*lokal*smoothstep(.07,.0,d)*(.5+.5*sin(uT*1.7-d*140.+fbm(vW.xz*3.)*6.));
    c=mix(c,vec3(.86,.97,.95),bu*.3*(1.-musim));
    /* musim dingin: salju di darat, es di laut */
    float lum=dot(c,vec3(.299,.587,.114));
    vec3 salju=vec3(.80,.86,.93)*clamp(.5+1.3*lum,.35,1.15);
    c=mix(c,salju,musim*(1.-laut)*.88);
    float bongkah=fbm(p*.9+3.);
    float tutup=smoothstep(bongkah-.06,bongkah+.06,es*1.25-.1);
    float retak=smoothstep(.03,.0,abs(fbm(p*1.6+9.)-.5))+smoothstep(.02,.0,abs(fbm(p*3.7+2.)-.5))*.6;
    vec3 ice=vec3(.74,.83,.9)*(.86+.2*fbm(p*4.));
    ice=mix(ice,vec3(.33,.47,.6),clamp(retak,0.,1.)*.55);
    ice*=1.-bay*.4;
    float tepiEs=smoothstep(.0,.08,es*1.25-.1-bongkah)*(1.-smoothstep(.08,.2,es*1.25-.1-bongkah));
    c=mix(c,ice,tutup*laut);
    c=mix(c,vec3(.9,.96,1.),tepiEs*laut*.25);
    c*=mix(vec3(1.),vec3(.82,.88,1.03),musim*.75);
    /* rona hari */
    float sisi=smoothstep(-.05,.05,vW.x-xdl);float jl=exp(-abs(vW.x-xdl)*.35);
    c+=vec3(1.,.78,.43)*(1.-sisi)*hari.y*.10*(.35+.65*jl)+vec3(.56,.88,1.)*sisi*hari.x*.10*(.35+.65*jl);
    float dist=length(cameraPosition-vW);c=mix(c,fogC,smoothstep(fogN,fogF,dist)*.9);
    float e=min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y));
    gl_FragColor=vec4(c,mix(1.,smoothstep(0.,tepiA,e)*mix(1.,1.-laut*smoothstep(.35,.9,d),jauh),lokal));
  }`;
function meshTanah(R,seg,uni){
  const {x0,x1,z0,z1}=R.box;const geo=new THREE.PlaneGeometry(x1-x0,z1-z0,seg,Math.round(seg*(z1-z0)/(x1-x0)));
  geo.rotateX(-Math.PI/2);geo.translate((x0+x1)/2,0,(z0+z1)/2);
  const pos=geo.attributes.position;for(let i=0;i<pos.count;i++)pos.setY(i,tinggiDi(R,pos.getX(i),pos.getZ(i))*R.ex);
  geo.computeVertexNormals();
  const tMap=new THREE.CanvasTexture(R.TEX);tMap.anisotropy=REN.capabilities.getMaxAnisotropy();
  uni.map={value:tMap};uni.info={value:new THREE.CanvasTexture(R.INFO)};
  return new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:uni,vertexShader:VS,fragmentShader:FS_TANAH,transparent:uni.lokal.value>.5}));
}
function bangun3D(){
  REN=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
  REN.setPixelRatio(1);REN.setSize(W,H,false);
  SC=new THREE.Scene();SC.background=new THREE.Color().fromArray(KABUT_PANAS);
  CAM=new THREE.PerspectiveCamera(30,W/H,.3,400);
  UNI={uT:{value:0},jauh:{value:0},fogC:{value:new THREE.Color().fromArray(KABUT_PANAS)},fogN:{value:20},fogF:{value:70},sun:{value:MATAHARI},
    xdl:{value:XDL},hari:{value:new THREE.Vector2(0,0)},musim:{value:0},es:{value:0}};
  UL=Object.assign({},UNI,{sk:{value:1},lokal:{value:1},tepiA:{value:.16}});
  UB=Object.assign({},UNI,{sk:{value:14},lokal:{value:0},tepiA:{value:.1}});
  const lok=meshTanah(LOK,520,UL);lok.renderOrder=2;SC.add(lok);
  const bes=meshTanah(BES,420,UB);bes.position.y=-.03;bes.renderOrder=1;SC.add(bes);
  /* laut luar raksasa */
  const lg=new THREE.PlaneGeometry(4000,4000);lg.rotateX(-Math.PI/2);
  const lm=new THREE.ShaderMaterial({uniforms:UNI,vertexShader:VS,
    fragmentShader:NOISE+`uniform float uT,fogN,fogF,musim;uniform vec3 fogC;varying vec3 vW;
      void main(){vec3 c=vec3(${PAL.laut3.map(v=>(v/255).toFixed(3)).join(',')});
        c*=.93+.14*fbm(vW.xz*.03+uT*.02);
        c=mix(c,vec3(.6,.7,.8),musim*.6);
        float dist=length(cameraPosition-vW);c=mix(c,fogC,smoothstep(fogN,fogF,dist)*.9);gl_FragColor=vec4(c,1.);}`});
  const laut=new THREE.Mesh(lg,lm);laut.position.y=-.08;SC.add(laut);
  /* tirai cahaya garis tanggal */
  const tg=new THREE.PlaneGeometry(40,1.8,1,1);tg.rotateY(Math.PI/2);tg.translate(XDL,.9,0);
  const tu=Object.assign({naik:{value:0},kuat:{value:0}},UNI);
  TIRAI=new THREE.Mesh(tg,new THREE.ShaderMaterial({uniforms:tu,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    vertexShader:VS,fragmentShader:NOISE+`uniform float uT,naik,kuat,fogN,fogF;varying vec2 vUv;varying vec3 vW;
      void main(){float y=vUv.y;
        float a=exp(-y*5.)*.75+exp(-y*1.4)*.1;
        a*=.65+.35*vn(vec2(vW.z*1.3,uT*.8))+.25*vn(vec2(vW.z*6.,uT*2.));
        a*=smoothstep(naik,naik-.12,y)*smoothstep(20.,9.,abs(vW.z));
        float dist=length(cameraPosition-vW);a*=1.-smoothstep(fogN,fogF,dist)*.8;
        vec3 c=mix(vec3(1.,.97,.9),vec3(1.,.78,.43),clamp(y*2.5,0.,1.));
        gl_FragColor=vec4(c*a*kuat*.8,1.);}`}));
  TIRAI.renderOrder=4;SC.add(TIRAI);
  const gg=new THREE.PlaneGeometry(.09,40);gg.rotateX(-Math.PI/2);gg.translate(XDL,.006,0);
  GARISLAUT=new THREE.Mesh(gg,new THREE.ShaderMaterial({uniforms:tu,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:VS,fragmentShader:`uniform float kuat,fogN,fogF;varying vec2 vUv;varying vec3 vW;
      void main(){float a=1.-abs(vUv.x-.5)*2.;a=a*a;a*=smoothstep(20.,9.,abs(vW.z));
        float dist=length(cameraPosition-vW);a*=1.-smoothstep(fogN,fogF,dist)*.8;
        gl_FragColor=vec4(vec3(1.,.95,.82)*a*kuat*1.4,1.);}`}));
  GARISLAUT.renderOrder=3;SC.add(GARISLAUT);
}

/* ==== [F] KAMERA: [t, x, z, jarak, arah°, miring°, tinggi sasaran] — arah 0 = melihat ke utara */
const KM=[
  [-1.0, .2, 1.0, 54, 38, 87, .15],
  [0.0,  .2, 1.0, 46, 40, 86, .15],
  [1.2,  .2, 1.0, 33, 45, 72, .15],
  [2.6,  .2, 1.0, 27.5, 49, 60, .15],
  [4.2,  .15, .9, 25, 53, 53, .15],
  [5.8,  .1, .8, 24, 56, 49, .15],
  [7.4,  .1, .8, 25, 59, 46, .15],
  [9.3,  .4, .5, 22, 46, 36, .2],
  [10.9, .8, -.6, 14.5, 22, 15, .45],
  [12.5, .8, -2.2, 12.5, 12, 9, .55],
  [13.5, 1.5, -3.5, 34, 6, 45, .3],
  [15.0, 5.0, -8.5, 470, 0, 70, 0],
  [17.0, 5.5, -8.5, 520, -3, 66, 0],
  [19.2, 5.5, -7.5, 530, -6, 64, 0],
  [21.2, 1.8, -.8, 150, -2, 66, 0],
  [23.4, .8, .6, 64, 4, 68, .1],
  [25.6, .8, -1.0, 135, 8, 63, 0],
  [27.9, .8, .4, 72, 16, 60, .1],
  [29.6, .2, 1.0, 30, 36, 52, .15],
  [31.6, .2, 1.0, 25, 47, 50, .15],
  [33.7, .1, .8, 24, 55, 48, .15],
  [35.6, .1, .8, 23, 62, 46, .15],
  [37.7, .1, .8, 24.5, 68, 42, .15],
  [39.6, .2, .8, 27, 78, 33, .2],
  [41.3, .3, .8, 26, 84, 31, .2],
  [42.9, 1.4, 1.7, 17, 72, 40, .15],
  [45.2, 1.1, 1.3, 13.5, 63, 38, .15],
  [48.6, -.2, .3, 13.5, 56, 35, .15],
  [50.6, -1.0, -.5, 13.5, 52, 14, .5],
  [55.0, -1.0, -.5, 12.6, 50, 12.5, .5],
  [58.8, -1.0, -.5, 12.0, 48, 11.5, .5],
  [61.0, .2, .9, 19, 42, 30, .25],
  [63.3, .2, 1.0, 26, 45, 50, .15],
  [66.2, .2, 1.0, 29, 48, 55, .15],
  [68.0, .2, 1.0, 30, 49, 56, .15]];
function cr(p0,p1,p2,p3,k){const k2=k*k,k3=k2*k;return .5*((2*p1)+(-p0+p2)*k+(2*p0-5*p1+4*p2-p3)*k2+(-p0+3*p1-3*p2+p3)*k3);}
let JARAK_KAM=20;
function kamera(t){let i=0;while(i<KM.length-2&&KM[i+1][0]<=t)i++;
  const a=KM[Math.max(0,i-1)],b=KM[i],c=KM[i+1],d=KM[Math.min(KM.length-1,i+2)];const k=E.s(clamp((t-b[0])/(c[0]-b[0])))*.35+clamp((t-b[0])/(c[0]-b[0]))*.65;
  const v=[];for(let j=1;j<7;j++){
    if(j===3)v.push(Math.exp(cr(Math.log(a[j]),Math.log(b[j]),Math.log(c[j]),Math.log(d[j]),k)));   /* jarak di ruang log */
    else v.push(cr(a[j],b[j],c[j],d[j],k));}
  const [tx,tz,dist,az,tilt,ty]=v;
  const A=(az+nz(t*.35,3)*.6)*Math.PI/180, Tl=(tilt+nz(t*.3,5)*.4)*Math.PI/180;
  CAM.position.set(tx+Math.sin(A)*Math.cos(Tl)*dist, ty+Math.sin(Tl)*dist, tz+Math.cos(A)*Math.cos(Tl)*dist);
  CAM.near=Math.max(.05,dist*.03);CAM.far=dist*12;CAM.updateProjectionMatrix();
  CAM.lookAt(tx,ty,tz);
  UNI.fogN.value=dist*.9;UNI.fogF.value=dist*3.4;
  JARAK_KAM=dist;return dist;}
const _v=new THREE.Vector3();
function layar(x,y,z){_v.set(x,y,z).project(CAM);return{x:(_v.x+1)/2*W,y:(1-_v.y)/2*H,vis:_v.z<1&&_v.z>-1};}
const layarLL=(lon,lat,y=0)=>layar(toX(lon),y,toZ(lat));

/* ==== [G] awan (sprite dipanggang sekali) */
const AWAN=[];const SPR=[];
function bangunAwan(){
  for(let s=0;s<4;s++){const c=kanvas(700,520),x=c.getContext('2d');const R=rng(91+s*13);
    x.filter='blur(9px)';
    for(let k=0;k<44;k++){const cx=130+R()*440,cy=170+R()*210,r=40+R()*95;
      const g=x.createRadialGradient(cx,cy-r*.25,r*.1,cx,cy,r);
      g.addColorStop(0,'rgba(214,226,233,.95)');g.addColorStop(.55,'rgba(168,186,200,.75)');g.addColorStop(1,'rgba(98,122,142,0)');
      x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();}
    x.filter='none';x.globalCompositeOperation='source-atop';const gb=x.createLinearGradient(0,150,0,520);
    gb.addColorStop(0,'rgba(40,64,90,0)');gb.addColorStop(1,'rgba(30,52,78,.75)');x.fillStyle=gb;x.fillRect(0,0,700,520);
    SPR.push(c);}
  const R=rng(7);
  for(let i=0;i<20;i++){const a=R()*Math.PI*2,r=lerp(260,950,Math.sqrt(R()));
    AWAN.push({x:W/2+Math.cos(a)*r*.75,y:H/2+Math.sin(a)*r*1.2,a,s:lerp(1.2,2.6,R()),spr:i%4,ro:(R()-.5)*.6,lap:R()});}
  AWAN.sort((p,q)=>p.lap-q.lap);
}
/* mode buka: tertutup -> tersibak. mode lewat: menebal lalu tersibak (kamera menembus lapisan awan) */
function gambarAwan(c,t,a,b,lewat){
  if(t<a-.01||t>b)return;
  const p=seg(t,a,b);
  const k=lewat?p:p, tutup=lewat?Math.sin(Math.PI*clamp(p*1.15))**.7:1;
  c.save();
  const veil=lewat?tutup*.35:(1-E.out(clamp(p*1.3)))*.4;
  c.fillStyle=`rgba(14,34,54,${veil})`;c.fillRect(0,0,W,H);
  for(const A of AWAN){const kk=lewat?E.io(clamp(k*(1+A.lap*.35))):E.in(clamp(k*(1+A.lap*.35)));
    const dx=Math.cos(A.a),dy=Math.sin(A.a);const jr=(lewat?(kk-.55)*1400:kk*1500)*(0.6+A.lap*.6);
    const x=A.x+dx*jr, y=A.y+dy*jr*1.3, s=A.s*(lewat?(.6+kk*2.2):(1+kk*1.8));
    c.globalAlpha=(lewat?tutup:clamp(1-kk*1.15))*.95;
    c.save();c.translate(x,y);c.rotate(A.ro);c.drawImage(SPR[A.spr],-350*s,-260*s,700*s,520*s);c.restore();}
  c.restore();
}

/* ==== [H] teks & penanda */
const F={angka:'800 196px "Pathway Extreme"',hari:'900 138px "Pathway Extreme"',judul:'900 112px "Pathway Extreme"',
  besar:'900 104px "Pathway Extreme"',sedang:'800 84px "Pathway Extreme"',
  nama:'700 46px "Radio Canada"',ket:'600 44px "Radio Canada"',negara:'700 44px "Radio Canada"',wil:'700 50px "Radio Canada"',
  kicker:'700 40px "Radio Canada"',laut:'italic 600 44px "Radio Canada"'};
function teks(c,str,x,y,font,warna,{al='center',sp=0,a=1,blur=0,scale=1,stretch='normal'}={}){
  if(a<=.001)return;c.save();c.globalAlpha=clamp(a);c.font=font;c.textAlign=al;c.textBaseline='alphabetic';
  try{c.letterSpacing=sp+'px';c.fontStretch=stretch;}catch(e){}
  c.translate(x,y);c.scale(scale,scale);
  if(blur>.3)c.filter=`blur(${blur}px)`;
  c.shadowColor='rgba(4,14,24,.75)';c.shadowBlur=24;c.shadowOffsetY=6;c.fillStyle=warna;c.fillText(str,0,0);
  c.shadowColor='rgba(4,14,24,.5)';c.shadowBlur=4;c.shadowOffsetY=2;c.fillText(str,0,0);
  c.restore();}
function lebarTeks(c,str,font,sp=0,stretch='normal'){c.save();c.font=font;try{c.letterSpacing=sp+'px';c.fontStretch=stretch;}catch(e){}const w=c.measureText(str).width;c.restore();return w;}
const jepitX=(x,w)=>clamp(x,AMAN.kiri+w/2,AMAN.kanan-w/2);
const jepitY=(y,atas=AMAN.atas,bawah=AMAN.bawah)=>clamp(y,atas,bawah);
const masuk=(t,a,dur=.55)=>E.out(seg(t,a,a+dur));
function popTeks(c,str,x,y,font,warna,t,t0,a,o={}){const pop=1+(o.pop??.25)*(1-E.back(seg(t,t0,t0+.45)));
  teks(c,str,x,y,font,warna,Object.assign({a,blur:(1-clamp(a))*14,scale:(o.scale||1)*pop},o,{scale:(o.scale||1)*pop}));}
function titik(c,x,y,r,warna,a){if(a<=0)return;c.save();c.globalAlpha=a;c.fillStyle=warna;c.shadowColor=warna;c.shadowBlur=18;c.beginPath();c.arc(x,y,r,0,7);c.fill();c.restore();}
function cincin(c,x,y,r,warna,a,lw=4){if(a<=0)return;c.save();c.globalAlpha=a;c.strokeStyle=warna;c.lineWidth=lw;c.shadowColor=warna;c.shadowBlur=14;c.beginPath();c.arc(x,y,r,0,7);c.stroke();c.restore();}
function garisEmas(c,p,q,k,t,a=1,warna='#FFE3A8'){if(k<=0||a<=0)return;c.save();c.globalAlpha=a;c.lineCap='round';
  const ex=lerp(p.x,q.x,k),ey=lerp(p.y,q.y,k);
  c.strokeStyle='rgba(255,199,110,.35)';c.lineWidth=18;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(ex,ey);c.stroke();
  c.strokeStyle=warna;c.lineWidth=5;c.setLineDash([22,14]);c.lineDashOffset=-t*60;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(ex,ey);c.stroke();c.setLineDash([]);
  c.fillStyle='#FFF6E6';c.beginPath();c.arc(p.x,p.y,11,0,7);c.fill();if(k>.97){c.beginPath();c.arc(ex,ey,11,0,7);c.fill();}
  c.restore();}
function bendera(c,x,y,jenis,a){if(a<=0)return;c.save();c.globalAlpha=a;const w=66,h=44;c.translate(x,y);
  c.shadowColor='rgba(4,14,24,.5)';c.shadowBlur=10;c.fillStyle='#fff';c.fillRect(-w/2,-h/2,w,h);c.shadowBlur=0;
  if(jenis==='ru'){c.fillStyle='#fff';c.fillRect(-w/2,-h/2,w,h/3);c.fillStyle='#1C3FAA';c.fillRect(-w/2,-h/2+h/3,w,h/3);c.fillStyle='#D52B1E';c.fillRect(-w/2,-h/2+2*h/3,w,h/3);}
  else{for(let i=0;i<13;i++){c.fillStyle=i%2?'#fff':'#B22234';c.fillRect(-w/2,-h/2+i*h/13,w,h/13+.5);}c.fillStyle='#3C3B6E';c.fillRect(-w/2,-h/2,w*.42,h*7/13);}
  c.strokeStyle='rgba(255,246,230,.9)';c.lineWidth=2;c.strokeRect(-w/2,-h/2,w,h);c.restore();}
/* jam analog + hari & pukul */
function jam(c,x,y,hari,pukul,warna,a,t,t0){if(a<=0)return;const pop=1+.2*(1-E.back(seg(t,t0,t0+.45)));
  c.save();c.globalAlpha=clamp(a);c.translate(x,y);c.scale(pop,pop);
  const r=62;c.shadowColor='rgba(4,14,24,.6)';c.shadowBlur=22;c.shadowOffsetY=6;
  c.fillStyle='#FFF6E6';c.beginPath();c.arc(0,-r-6,r,0,7);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
  c.strokeStyle=warna;c.lineWidth=8;c.beginPath();c.arc(0,-r-6,r-4,0,7);c.stroke();
  c.fillStyle='#16324A';for(let i=0;i<12;i++){const an=i/12*Math.PI*2;c.beginPath();c.arc(Math.sin(an)*(r-17),-r-6-Math.cos(an)*(r-17),i%3?2.5:4.5,0,7);c.fill();}
  const [hh,mm]=pukul.split('.').map(Number);const ah=((hh%12)+mm/60)/12*Math.PI*2,am=mm/60*Math.PI*2;
  c.lineCap='round';c.strokeStyle='#16324A';c.lineWidth=8;c.beginPath();c.moveTo(0,-r-6);c.lineTo(Math.sin(ah)*30,-r-6-Math.cos(ah)*30);c.stroke();
  c.lineWidth=5;c.beginPath();c.moveTo(0,-r-6);c.lineTo(Math.sin(am)*46,-r-6-Math.cos(am)*46);c.stroke();
  c.fillStyle=warna;c.beginPath();c.arc(0,-r-6,7,0,7);c.fill();
  c.restore();
  teks(c,hari+' '+pukul,x,y+62,F.sedang,warna,{a,scale:pop,stretch:'semi-condensed'});}
/* kartu kalender */
function kalender(c,x,y,hari,warna,a,t,t0,rot=0){if(a<=0)return;const pop=1+.22*(1-E.back(seg(t,t0,t0+.5)));
  c.save();c.globalAlpha=clamp(a);c.translate(x,y);c.rotate(rot);c.scale(pop,pop);
  const w=360,h=300,r=26;
  c.shadowColor='rgba(4,14,24,.6)';c.shadowBlur=30;c.shadowOffsetY=10;c.fillStyle='#FFF6E6';
  c.beginPath();c.roundRect(-w/2,-h/2,w,h,r);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
  c.fillStyle=warna;c.beginPath();c.roundRect(-w/2,-h/2,w,92,[r,r,0,0]);c.fill();
  c.fillStyle='#16324A';for(const dx of [-80,80]){c.beginPath();c.roundRect(dx-9,-h/2-22,18,44,9);c.fill();}
  c.font='700 38px "Radio Canada"';c.textAlign='center';try{c.letterSpacing='8px';}catch(e){}c.fillStyle='#16324A';c.fillText('HARI INI',0,-h/2+60);
  c.font='900 76px "Pathway Extreme"';try{c.letterSpacing='0px';c.fontStretch='semi-condensed';}catch(e){}c.fillText(hari,0,62);
  c.restore();}
/* siluet orang dari belakang */
function orang(c,x,y,s,a){if(a<=0)return;c.save();c.globalAlpha=a;c.translate(x,y);c.scale(s,s);
  c.fillStyle='#0B1621';c.shadowColor='rgba(255,230,180,.55)';c.shadowBlur=12;
  c.beginPath();c.arc(0,-62,9,0,7);c.fill();
  c.beginPath();c.moveTo(-11,-50);c.quadraticCurveTo(-14,-30,-10,-22);c.lineTo(-7,0);c.lineTo(-2,0);c.lineTo(0,-20);c.lineTo(2,0);c.lineTo(7,0);c.lineTo(10,-22);c.quadraticCurveTo(14,-30,11,-50);c.closePath();c.fill();
  c.restore();}

/* titik terdekat antarpulau */
let JARAK=null;
function cariJarak(){let best=1e9,A,B;
  for(let i=0;i<BESAR.r.length;i+=2){const p=BESAR.r[i];for(let j=0;j<KECIL.r.length;j+=2){const q=KECIL.r[j];
    const d=(p[0]-q[0])**2+(p[1]-q[1])**2;if(d<best){best=d;A=p;B=q;}}}
  JARAK={a:A,b:B,km:Math.sqrt(best)};}

/* ==== [I] pasca */
let TS,TSX;const GRAIN=[];
function bangunPasca(){TS=kanvas(W,H);TSX=TS.getContext('2d');
  for(let k=0;k<4;k++){const g=kanvas(540,960),x=g.getContext('2d');const d=x.createImageData(540,960);const R=rng(300+k);
    for(let i=0;i<d.data.length;i+=4){const v=R()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}x.putImageData(d,0,0);GRAIN.push(g);}}
function pasca(c,t,tsKuat){
  if(tsKuat>.05){
    TSX.globalCompositeOperation='source-over';TSX.clearRect(0,0,W,H);TSX.filter=`blur(${(7*tsKuat).toFixed(1)}px)`;TSX.drawImage(c.canvas,0,0);TSX.filter='none';
    TSX.globalCompositeOperation='destination-in';const g=TSX.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.2,'rgba(0,0,0,0)');g.addColorStop(.74,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,1)');
    TSX.fillStyle=g;TSX.fillRect(0,0,W,H);c.drawImage(TS,0,0);}
  const s=c.createLinearGradient(0,0,0,H);s.addColorStop(0,'rgba(6,20,32,.42)');s.addColorStop(.18,'rgba(6,20,32,0)');s.addColorStop(.8,'rgba(6,20,32,0)');s.addColorStop(1,'rgba(6,20,32,.45)');
  c.fillStyle=s;c.fillRect(0,0,W,H);
  const v=c.createRadialGradient(W/2,H*.46,H*.28,W/2,H*.5,H*.75);v.addColorStop(0,'rgba(4,12,20,0)');v.addColorStop(1,'rgba(4,12,20,.55)');
  c.fillStyle=v;c.fillRect(0,0,W,H);
  c.save();c.globalCompositeOperation='overlay';c.globalAlpha=.16;c.drawImage(GRAIN[Math.floor(t*30)%4],0,0,W,H);c.restore();
}

/* ==== [J] posisi perenang */
function perenang(k){const a=JARAK.a,b=JARAK.b;   /* dari Diomede Kecil (b) ke Diomede Besar (a), sedikit melengkung */
  const x=lerp(b[0],a[0],k)+Math.sin(k*Math.PI)*.35, z=lerp(b[1],a[1],k)+Math.sin(k*Math.PI)*.25;return [x,z];}

/* ==== [K] SCENE */
const CV=document.getElementById('stage'),CX=CV.getContext('2d');
function frame(t){
  UNI.uT.value=t;
  const dist=kamera(t);
  /* musim: dingin 38,1 -> 39,8; mencair 41,3 -> 43 */
  const musim=sstep(T.dingin-.1,T.dingin+1.6,t)*(1-sstep(T.cair,T.cair+1.7,t));
  const es=sstep(T.dingin+.2,T.beku+.25,t)*(1-sstep(T.cair,T.cair+1.5,t));
  UNI.musim.value=musim;UNI.es.value=es;UNI.jauh.value=sstep(28,55,dist);
  const kb=[0,1,2].map(i=>lerp(KABUT_PANAS[i],KABUT_DINGIN[i],musim));UNI.fogC.value.fromArray(kb);SC.background.fromArray(kb);
  /* rona hari aktif di adegan pulau */
  const hariOn=1-sstep(T.sempit,T.sempit+.8,t)+sstep(T.jamBesar-.3,T.jamBesar+.5,t)*(1-sstep(T.dingin,T.dingin+.8,t))+sstep(T.seninK,T.seninK+.8,t);
  UNI.hari.value.set(sstep(T.senin-.1,T.senin+.6,t)*clamp(hariOn),sstep(T.selasa-.1,T.selasa+.6,t)*clamp(hariOn));
  const nk=E.io(seg(t,T.garis,T.garis+1.1));
  const tu=TIRAI.material.uniforms;
  tu.naik.value=lerp(0,1.12,nk);
  tu.kuat.value=sstep(T.garis-.05,T.garis+.35,t)*(1+.7*Math.exp(-(((t-T.beda-.15)/.25)**2)))*(1-sstep(32,58,dist))*(1-musim*.6);
  REN.render(SC,CAM);
  const c=CX;c.globalAlpha=1;c.filter='none';c.drawImage(REN.domElement,0,0);
  gambarAwan(c,t,-.45,T.buka,false);
  gambarAwan(c,t,T.awan2[0],T.awan2[1],true);
  pasca(c,t,1-sstep(9.6,10.8,t)*(1-sstep(12.6,13.4,t))-sstep(49.4,50.4,t)*(1-sstep(58.8,60,t)));

  const pb=LOK.puncak[1],pk=LOK.puncak[2];
  const sb=layar(pb.x,pb.h*EX,pb.z), sk=layar(pk.x,pk.h*EX,pk.z);

  /* ---------- adegan 1-2: jarak 4 km, hari, negara ---------- */
  {const ja=layar(JARAK.a[0],.02,JARAK.a[1]),jb=layar(JARAK.b[0],.02,JARAK.b[1]);
   const gk=E.io(seg(t,T.jarakA,T.jarakA+.6)), gOut=1-seg(t,T.jarakOut,T.jarakOut+.35);
   if(gk>0&&gOut>0){garisEmas(c,ja,jb,gk,t,gOut);
     const n=Math.round(lerp(0,4,E.out(seg(t,T.jarakA+.2,T.jarakB-.55))));
     const ma=masuk(t,T.jarakA+.15,.5)*gOut;const pulse=1+.08*Math.exp(-(((t-(T.jarakB-.5))/.12)**2));
     const mx=(ja.x+jb.x)/2,my=(ja.y+jb.y)/2;
     const wN=lebarTeks(c,'4 KM',F.angka,-4),wC=lebarTeks(c,'JARAK ANTARPULAU',F.ket,6);
     const nx=jepitX(mx-90-Math.max(wN,wC)/2,Math.max(wN,wC)),by=my+170;
     teks(c,n+' KM',nx,by,F.angka,'#FFF6E6',{a:ma,blur:(1-ma)*14,scale:pulse*(1.06-.06*ma),stretch:'semi-condensed',sp:-4});
     teks(c,'JARAK ANTARPULAU',nx,by+70,F.ket,'#FFC76E',{a:masuk(t,T.jarakA+.45,.5)*gOut,sp:6});}}
  const keluar1=1-E.in(seg(t,T.labelOut,T.labelOut+.5));
  const hariA=t>T.aneh?lerp(1,.72,E.io(seg(t,T.aneh,T.aneh+.8))):1;
  function blokPulau(s,nama,hariStr,warna,tHari,neg,jenis,tNeg,naikY,tNama){
    const namaA=masuk(t,tNama,.6)*keluar1;if(namaA<=0)return;
    const yN=Math.max(s.y-naikY,AMAN.atas+180);
    const w2=lebarTeks(c,nama,F.nama,9);const x2=jepitX(s.x,w2);
    c.save();c.globalAlpha=namaA;c.strokeStyle='rgba(255,246,230,.85)';c.lineWidth=3;
    const ly=lerp(yN+18,s.y,E.io(clamp(namaA*1.3)));c.beginPath();c.moveTo(s.x,yN+18);c.lineTo(s.x,ly);c.stroke();
    c.fillStyle='#FFF6E6';c.beginPath();c.arc(s.x,s.y,8*namaA,0,7);c.fill();c.restore();
    teks(c,nama,x2,yN,F.nama,'#FFF6E6',{a:namaA,sp:9,blur:(1-namaA)*10});
    const hk=masuk(t,tHari,.45)*keluar1;
    if(hk>0){const pop=1+.25*(1-E.back(seg(t,tHari,tHari+.45)));
      const w=lebarTeks(c,hariStr,F.hari)*hariA;const x=jepitX(s.x,w);
      teks(c,hariStr,x,yN-62,F.hari,warna,{a:hk,blur:(1-hk)*16,scale:hariA*pop,stretch:'semi-condensed'});}
    const nkA=masuk(t,tNeg,.5)*keluar1;
    if(nkA>0){const w3=lebarTeks(c,neg,F.negara,6)+84;const x3=jepitX(s.x+w3/2+24,w3);
      bendera(c,x3-w3/2+33,yN+52+(1-nkA)*20,jenis,nkA);
      teks(c,neg,x3-w3/2+84,yN+68+(1-nkA)*20,F.negara,'#FFF6E6',{a:nkA,al:'left',sp:6});}
  }
  if(t<T.labelOut+.6){
    blokPulau(sb,'DIOMEDE BESAR','SELASA',PAL.selasa,T.selasa,'RUSIA','ru',T.negara,300,T.nama);
    blokPulau(sk,'DIOMEDE KECIL','SENIN',PAL.senin,T.senin,'AMERIKA SERIKAT','us',T.negara+.35,250,T.jarakOut+.1);}
  const kil=Math.exp(-(((t-T.beda-.15)/.22)**2));
  if(kil>.02){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=kil*.18;c.fillStyle='#FFE3A8';c.fillRect(0,0,W,H);c.restore();}
  /* "laut yang sangat sempit": keterangan di permukaan laut antarpulau */
  {const a=jendela(t,T.sempit+1.4,12.6,.6,.4);
   if(a>0){const p=layar(XDL,.05,-1.2);teks(c,'LAUT SEMPIT',jepitX(p.x,420),jepitY(p.y+260,600,1560),F.wil,'#FFF6E6',{a,sp:10,blur:(1-a)*10});}}

  /* ---------- adegan 3: Selat Bering 80 km ---------- */
  {const a=jendela(t,T.selat-.15,T.besarOut,.55,.5);
   if(a>0){teks(c,'65° LU · 169° BB',W/2,AMAN.atas+70,F.kicker,'#FFC76E',{a,sp:6});
     c.save();c.globalAlpha=a;c.fillStyle='#C98A2C';c.fillRect(W/2-150*a,AMAN.atas+92,300*a,4);c.restore();
     teks(c,'SELAT BERING',W/2,AMAN.atas+210,F.judul,'#FFF6E6',{a,blur:(1-a)*14,stretch:'semi-condensed',sp:4*(1-a)+2});}
   const ar=jendela(t,T.rusia,T.besarOut,.6,.5);
   if(ar>0){const p=layarLL(186.9,66.55,.5);const w=lebarTeks(c,'RUSIA',F.wil,22);teks(c,'RUSIA',jepitX(p.x,w),jepitY(p.y-24*(1-ar),AMAN.atas+300),F.wil,'#FFF6E6',{a:ar,sp:22});
     bendera(c,jepitX(p.x,w),jepitY(p.y-24*(1-ar),AMAN.atas+300)+52,'ru',ar);}
   const aa=jendela(t,T.amerika,T.besarOut,.6,.5);
   if(aa>0){const p=layarLL(195.0,65.05,.5);const w=lebarTeks(c,'ALASKA (AS)',F.wil,18);teks(c,'ALASKA (AS)',jepitX(p.x,w),jepitY(p.y-24*(1-aa)),F.wil,'#FFF6E6',{a:aa,sp:18});
     bendera(c,jepitX(p.x,w),jepitY(p.y-24*(1-aa))+52,'us',aa);}
   const al=jendela(t,T.rusia+.8,T.besarOut,.8,.5);
   if(al>0){const p=layarLL(188.8,64.75);teks(c,'Laut Bering',jepitX(p.x,330),jepitY(p.y),F.laut,'rgba(220,240,248,.9)',{a:al*.9,sp:4});
     const q=layarLL(192.2,66.95);teks(c,'Laut Chukchi',jepitX(q.x,330),jepitY(q.y,AMAN.atas+330),F.laut,'rgba(220,240,248,.9)',{a:al*.9,sp:4});}
   /* garis 80 km */
   const ga=layarLL(...TANJUNG_RU,.05),gb=layarLL(...TANJUNG_AS,.05);
   const gk=E.io(seg(t,T.km80-.1,T.km80+.8)),go=1-seg(t,T.km80Out,T.km80Out+.4);
   if(gk>0&&go>0){garisEmas(c,ga,gb,gk,t,go);
     const n=Math.round(lerp(0,80,E.out(seg(t,T.km80+.1,T.km80+1.3))));
     const ma=masuk(t,T.km80,.5)*go;const pulse=1+.08*Math.exp(-(((t-(T.km80+1.3))/.12)**2));
     const mx=(ga.x+gb.x)/2,my=(ga.y+gb.y)/2;const wN=lebarTeks(c,'80 KM',F.angka,-4);
     const nx=jepitX(mx-40,wN),ny=jepitY(my+250,600,1500);
     teks(c,n+' KM',nx,ny,F.angka,'#FFF6E6',{a:ma,blur:(1-ma)*14,scale:pulse,stretch:'semi-condensed',sp:-4});
     teks(c,'RUSIA — AMERIKA',nx,ny+70,F.ket,'#FFC76E',{a:masuk(t,T.km80+.4,.5)*go,sp:6});}}

  /* ---------- adegan 4: dua pulau di tengah selat ---------- */
  {const wB=jendela(t,T.dBesar,T.idlOut,.5,.5),wK=jendela(t,T.dKecil,T.idlOut,.5,.5);
   const pB=layar(-2.6,.2,-1.0),pK=layar(2.9,.2,3.1);
   const den=k=>(t*1.2+k)%1;
   for(const[p,w,warna,nama,al,k] of [[pB,wB,PAL.selasa,'DIOMEDE BESAR','right',0],[pK,wK,PAL.senin,'DIOMEDE KECIL','left',.5]]){
     if(w<=0)continue;titik(c,p.x,p.y,10*w,warna,w);
     cincin(c,p.x,p.y,14+den(k)*46,warna,w*(1-den(k)),3);
     const tx=al==='right'?p.x-34:p.x+34;
     const wt=lebarTeks(c,nama,F.nama,9);const x=al==='right'?Math.max(tx,AMAN.kiri+wt):Math.min(tx,AMAN.kanan-wt);
     teks(c,nama,x,p.y+16,F.nama,'#FFF6E6',{a:w,al,sp:9,blur:(1-w)*10});}}

  /* ---------- adegan 5: garis batas tanggal internasional ---------- */
  {const gk=E.io(seg(t,T.idl,T.idl+1.6)),go=1-sstep(T.idlOut,T.idlOut+.6,t);
   if(gk>0&&go>0){
     const pts=[];for(let i=0;i<IDL.length-1;i++){const[a0,b0]=IDL[i],[a1,b1]=IDL[i+1];for(let j=0;j<24;j++){const k=j/24;pts.push(layarLL(lerp(a0,a1,k),lerp(b0,b1,k),.1));}}
     pts.push(layarLL(...IDL[IDL.length-1],.1));
     /* panjang kumulatif untuk digambar progresif dari utara ke selatan */
     let L=[0];for(let i=1;i<pts.length;i++)L.push(L[i-1]+Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y));
     const lim=L[L.length-1]*gk;
     c.save();c.globalAlpha=go;c.lineCap='round';c.lineJoin='round';
     for(const[lw,col] of [[22,'rgba(255,199,110,.28)'],[7,'#FFF2D6']]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();
       for(let i=0;i<pts.length;i++){if(L[i]>lim){const k=(lim-L[i-1])/(L[i]-L[i-1]);c.lineTo(lerp(pts[i-1].x,pts[i].x,k),lerp(pts[i-1].y,pts[i].y,k));break;}i?c.lineTo(pts[i].x,pts[i].y):c.moveTo(pts[i].x,pts[i].y);}
       c.stroke();}
     c.restore();
     const la=jendela(t,T.idlLabel,T.idlOut,.6,.5);
     if(la>0){const p=layarLL(191.03,66.75,.1);const x=jepitX(p.x-470,440),y=jepitY(p.y,AMAN.atas+120,1300);
       teks(c,'GARIS BATAS',x,y,F.sedang,'#FFF6E6',{a:la,blur:(1-la)*12,stretch:'semi-condensed'});
       teks(c,'TANGGAL',x,y+84,F.sedang,'#FFF6E6',{a:la,blur:(1-la)*12,stretch:'semi-condensed'});
       teks(c,'INTERNASIONAL',x,y+140,F.ket,'#FFC76E',{a:masuk(t,T.idlLabel+.3,.5)*(1-sstep(T.idlOut,T.idlOut+.5,t)),sp:8});}}}

  /* ---------- adegan 6-7: 21 jam, Pulau Besok / Kemarin ---------- */
  {const jo=1-sstep(T.besok-.35,T.besok+.05,t);
   const yb=Math.max(sb.y-250,AMAN.atas+170), yk=Math.max(sk.y-110,AMAN.atas+500);
   jam(c,jepitX(sb.x,lebarTeks(c,'SELASA 12.00',F.sedang,0,'semi-condensed')+20),yb,'SELASA','12.00',PAL.selasa,masuk(t,T.jamBesar,.5)*jo,t,T.jamBesar);
   jam(c,jepitX(sk.x+250,lebarTeks(c,'SENIN 15.00',F.sedang,0,'semi-condensed')+20),yk,'SENIN','15.00',PAL.senin,masuk(t,T.jamKecil,.5)*jo,t,T.jamKecil);
   const ja=jendela(t,T.jam21-.1,T.besok-.3,.5,.4);
   if(ja>0){const n=Math.round(lerp(0,21,E.out(seg(t,T.jam21,T.jam21+.9))));const m=layar(XDL,.05,1.4);
     const wj=lebarTeks(c,'+21 JAM',F.angka,-4,'semi-condensed')*1.1;const x=jepitX(AMAN.kiri+wj/2,wj),y=jepitY(sb.y+330,900,1300);
     teks(c,'+'+n+' JAM',x,y,F.angka,'#FFF6E6',{a:ja,blur:(1-ja)*14,scale:1+.08*Math.exp(-(((t-(T.jam21+.9))/.12)**2)),stretch:'semi-condensed',sp:-4});
     teks(c,'LEBIH MAJU',x,y+70,F.ket,'#FFC76E',{a:masuk(t,T.jamMaju,.5)*ja,sp:8});}
   const jb=jendela(t,T.besok,T.julukOut,.45,.5),jk=jendela(t,T.kemarin,T.julukOut,.45,.5);
   if(jb>0){popTeks(c,'PULAU BESOK',jepitX(sb.x,lebarTeks(c,'PULAU BESOK',F.besar,0,'semi-condensed')*1.08),Math.max(sb.y-230,AMAN.atas+120),F.besar,PAL.selasa,t,T.besok,jb,{stretch:'semi-condensed',pop:.1});}
   if(jk>0){popTeks(c,'PULAU KEMARIN',jepitX(sk.x,lebarTeks(c,'PULAU KEMARIN',F.besar,0,'semi-condensed')*1.02),Math.max(sk.y-220,AMAN.atas+460),F.besar,PAL.senin,t,T.kemarin,jk,{stretch:'semi-condensed',scale:.92,pop:.1});}}

  /* ---------- adegan 8: musim dingin ---------- */
  {const a=jendela(t,T.dingin,T.cair,.6,.5);
   if(a>0){teks(c,'MUSIM DINGIN',W/2,AMAN.atas+170,F.judul,PAL.es,{a,blur:(1-a)*14,stretch:'semi-condensed',sp:2});
     const b=jendela(t,T.beku-.05,T.cair,.4,.5);teks(c,'LAUT MEMBEKU',W/2,AMAN.atas+240,F.ket,'#FFF6E6',{a:b,sp:10});}
   const fl=Math.exp(-(((t-T.beku-.1)/.18)**2));
   if(fl>.02){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=fl*.14;c.fillStyle='#CFEFFF';c.fillRect(0,0,W,H);c.restore();}
   /* serpih salju melayang */
   const sa=musim*.85;if(sa>.02){c.save();c.fillStyle='#F2FAFF';const R=rng(55);
     for(let i=0;i<90;i++){const x0=R()*W,y0=R()*H,v=60+R()*120,r=1.6+R()*3.4;
       const x=(x0+Math.sin(t*.8+i)*30+t*25)%W,y=(y0+t*v)%H;c.globalAlpha=sa*(.35+R()*.5);c.beginPath();c.arc(x,y,r,0,7);c.fill();}c.restore();}}

  /* ---------- adegan 9: 1987, perenang ---------- */
  {const a=jendela(t,T.th1987,T.out1987,.5,.5);
   if(a>0){const n=Math.round(lerp(1950,1987,E.out(seg(t,T.th1987,T.th1987+1.0))));
     teks(c,String(n),W/2,AMAN.atas+230,F.angka,'#FFF6E6',{a,blur:(1-a)*14,stretch:'semi-condensed',sp:-2,scale:1+.07*Math.exp(-(((t-(T.th1987+1))/.12)**2))});
     teks(c,'SEORANG PERENANG AMERIKA',W/2,AMAN.atas+300,F.ket,'#FFC76E',{a:masuk(t,T.perenang,.5)*a,sp:6});}
   const k=E.io(seg(t,T.renangA,T.renangB));const ra=jendela(t,T.renangA-.3,T.out1987+.3,.4,.5);
   if(ra>0){
     /* jejak buih */
     c.save();c.lineCap='round';
     for(let j=14;j>=1;j--){const k0=clamp(k-j*.018),k1=clamp(k-(j-1)*.018);const[a0,b0]=perenang(k0),[a1,b1]=perenang(k1);
       const p=layar(a0,.004,b0),q=layar(a1,.004,b1);c.strokeStyle=`rgba(220,245,255,${(1-j/15)*.55*ra})`;c.lineWidth=12*(1-j/16)+3;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();}
     c.restore();
     const [px,pz]=perenang(k);const p=layar(px,.005,pz);
     for(let i=0;i<3;i++){const ph=(t*.9+i/3)%1;cincin(c,p.x,p.y,10+ph*40,'#DFF6FF',ra*(1-ph)*.7,2.5);}
     titik(c,p.x,p.y,9,'#FFF6E6',ra);
     /* label hari ikut perenang: berganti saat melintasi garis tanggal */
     const lewat=px<XDL;const tl=lewat?'SELASA':'SENIN';const wl=lebarTeks(c,tl,F.wil,8);
     const sw=lewat?sstep(0,.12,(XDL-px)):1;
     teks(c,tl,jepitX(p.x,wl),p.y-48,F.wil,lewat?PAL.selasa:PAL.senin,{a:ra*(lewat?sw:1),sp:8,scale:lewat?1+.3*(1-sw):1});}}

  /* ---------- adegan 10: bayangin kamu berdiri ---------- */
  {const ak=jendela(t,T.kamu-.2,T.kOut,.6,.5);
   if(ak>0){const ox=lerp(JARAK.b[0],LOK.puncak[2].x,.18),oz=lerp(JARAK.b[1],LOK.puncak[2].z,.18);
     const p=layar(ox,tinggiDi(LOK,ox,oz)*EX,oz);
     const s=clamp(70/Math.max(1,Math.hypot(CAM.position.x-ox,CAM.position.z-oz))*1.6,.8,2.2);
     orang(c,p.x,p.y,s,ak);
     teks(c,'KAMU',p.x,p.y-82*s-18,F.nama,'#FFF6E6',{a:ak,sp:9});
     const sn=jendela(t,T.seninK,T.kOut,.45,.5);
     if(sn>0)popTeks(c,'SENIN',jepitX(p.x,lebarTeks(c,'SENIN',F.hari,0,'semi-condensed')*.8),p.y-82*s-80,F.hari,PAL.senin,t,T.seninK,sn,{stretch:'semi-condensed',scale:.8});
     const se=jendela(t,T.selasaK,T.kOut,.45,.5);
     if(se>0){const q=layar(LOK.puncak[1].x,LOK.puncak[1].h*EX,LOK.puncak[1].z);
       popTeks(c,'SELASA',jepitX(q.x,lebarTeks(c,'SELASA',F.hari,0,'semi-condensed')),jepitY(q.y-140,AMAN.atas+130,1300),F.hari,PAL.selasa,t,T.selasaK,se,{stretch:'semi-condensed',scale:.9});}
     const g=E.io(seg(t,T.km4,T.km4+.7))*(1-seg(t,T.kOut,T.kOut+.4));
     if(g>0){const bx=lerp(JARAK.a[0],LOK.puncak[1].x,.12),bz=lerp(JARAK.a[1],LOK.puncak[1].z,.12);
       const jb=layar(bx,tinggiDi(LOK,bx,bz)*EX+.02,bz);garisEmas(c,{x:p.x,y:p.y-30*s},jb,g,t,1);
       const n=Math.round(lerp(0,4,E.out(seg(t,T.km4+.15,T.km4+.9))));
       teks(c,n+' KM',W/2,1450,F.angka,'#FFF6E6',{a:masuk(t,T.km4,.5)*(1-seg(t,T.kOut,T.kOut+.4)),stretch:'semi-condensed',sp:-4});
       teks(c,'KE PULAU SEBERANG',W/2,1520,F.ket,'#FFC76E',{a:masuk(t,T.km4+.3,.5)*(1-seg(t,T.kOut,T.kOut+.4)),sp:6});}}}

  /* ---------- adegan 11: kalender beda sehari, pertanyaan ---------- */
  {const ka=jendela(t,T.kalender,T.tanya-.1,.5,.4);
   if(ka>0){const yb=Math.max(sb.y-260,AMAN.atas+220),yk=Math.max(sk.y-210,AMAN.atas+560);
     kalender(c,jepitX(sb.x-60,420),yb,'SELASA',PAL.selasa,ka,t,T.kalender,-.06);
     kalender(c,jepitX(sk.x+60,420),yk,'SENIN',PAL.senin,masuk(t,T.kalender+.3,.5)*(1-sstep(T.tanya-.1,T.tanya+.3,t)),t,T.kalender+.3,.06);
     const hs=jendela(t,T.sehari,T.tanya-.1,.5,.4);const m=layar(XDL,.05,1.0);
     teks(c,'HAMPIR BEDA SEHARI',W/2,jepitY(m.y+330,900,1560),F.wil,'#FFF6E6',{a:hs,sp:8,blur:(1-hs)*10});}
   const qa=masuk(t,T.tanya,.5);
   if(qa>0){
     popTeks(c,'PULAU BESOK',jepitX(sb.x,lebarTeks(c,'PULAU BESOK',F.besar,0,'semi-condensed')*1.08),Math.max(sb.y-230,AMAN.atas+140),F.besar,PAL.selasa,t,T.tanya,qa,{stretch:'semi-condensed',scale:.95});
     popTeks(c,'PULAU KEMARIN',jepitX(sk.x,lebarTeks(c,'PULAU KEMARIN',F.besar,0,'semi-condensed')*1.02),Math.max(sk.y-200,AMAN.atas+480),F.besar,PAL.senin,t,T.tanya+.35,masuk(t,T.tanya+.35,.5),{stretch:'semi-condensed',scale:.88});
     const m=layar(XDL,.05,.6);const ya=jepitY(m.y+300,900,1540);
     const qq=masuk(t,T.tanya+.8,.5);
     popTeks(c,'?',W/2,ya,'900 230px "Pathway Extreme"','#FFF6E6',t,T.tanya+.8,qq);
     teks(c,'KAMU PILIH YANG MANA?',W/2,ya+80,F.ket,'#FFC76E',{a:masuk(t,T.tanya+1.1,.5),sp:6});}}
}

/* ==== pemutar */
const SEEK=document.getElementById('seek'),TM=document.getElementById('tm'),PLAY=document.getElementById('play'),ST=document.getElementById('status');
let main=false,t0=0,tNow=0,ACX=null,BUF=null,SRC=null;
const DUR=T.dur;
const fmt=s=>s.toFixed(1).replace('.',',');
function tampil(t){tNow=t;frame(t);SEEK.value=Math.round(t/DUR*1000);TM.textContent=fmt(t)+' / '+fmt(DUR);}
async function siapAudio(){if(ACX)return;ACX=new (window.AudioContext||window.webkitAudioContext)();
  try{const ab=await (await fetch('vo.mp3')).arrayBuffer();BUF=await ACX.decodeAudioData(ab);}catch(e){ST.textContent='Suara tidak termuat: '+e.message;}}
function stopAudio(){if(SRC){try{SRC.stop();}catch(e){}SRC=null;}}
async function putar(){await siapAudio();if(ACX.state==='suspended')await ACX.resume();
  if(tNow>=DUR-.02)tNow=0;main=true;PLAY.textContent='Jeda';PLAY.classList.add('on');
  t0=performance.now()-tNow*1000;stopAudio();
  if(BUF&&tNow<BUF.duration){SRC=ACX.createBufferSource();SRC.buffer=BUF;SRC.connect(ACX.destination);SRC.start(0,tNow);}
  requestAnimationFrame(loop);}
function jeda(){main=false;PLAY.textContent='Putar';PLAY.classList.remove('on');stopAudio();}
function loop(){if(!main)return;const t=(performance.now()-t0)/1000;if(t>=DUR){tampil(DUR);jeda();return;}tampil(t);requestAnimationFrame(loop);}
PLAY.onclick=()=>main?jeda():putar();
SEEK.oninput=()=>{const t=SEEK.value/1000*DUR;if(main)jeda();tampil(t);};
document.getElementById('fullBtn').onclick=()=>{document.body.classList.toggle('full');const el=document.documentElement;
  if(document.body.classList.contains('full')){el.requestFullscreen?.().catch(()=>{});}else{document.exitFullscreen?.().catch(()=>{});}};
CV.onclick=()=>{if(document.body.classList.contains('full')){document.body.classList.remove('full');document.exitFullscreen?.().catch(()=>{});}};
const LEMBAR=[.4,2.1,6.2,11.6,14.2,18.6,22.9,26.8,31.6,36.9,40.4,46.6,53,58.2,64.5];
const SHEET=document.getElementById('sheet');
document.getElementById('sheetBtn').onclick=()=>{jeda();SHEET.innerHTML='';const row=document.createElement('div');row.className='row';
  const tc=kanvas(360,640),tx=tc.getContext('2d');
  for(const t of LEMBAR){frame(t);tx.drawImage(CV,0,0,360,640);const f=document.createElement('figure');const im=new Image();im.src=tc.toDataURL('image/jpeg',.85);im.alt='Potret detik '+fmt(t);
    const cap=document.createElement('figcaption');cap.textContent=fmt(t)+' dtk';f.append(im,cap);row.append(f);}
  const b=document.createElement('button');b.type='button';b.textContent='Tutup';b.className='tutup';
  b.onclick=()=>{SHEET.hidden=true;tampil(tNow);};SHEET.append(row,b);SHEET.hidden=false;tampil(tNow);};

/* ==== mulai */
window.__frame=t=>{frame(t);};
(async()=>{
  await Promise.race([Promise.all(Object.values(F).map(f=>document.fonts.load(f))),new Promise(r=>setTimeout(r,6000))]).catch(()=>{});
  ST.textContent='Memanggang peta relief (beberapa detik)…';await new Promise(r=>setTimeout(r,30));
  const a=performance.now();
  panggangSemua();cariJarak();bangun3D();bangunAwan();bangunPasca();
  tampil(0);
  ST.textContent='Video lengkap · '+fmt(DUR)+' dtk · siap dalam '+(Math.round((performance.now()-a)/100)/10)+' dtk. Tekan Putar, atau Lembar untuk 15 potret.';
  window.__siap=true;
})().catch(e=>showErr('Error: '+e.message));
