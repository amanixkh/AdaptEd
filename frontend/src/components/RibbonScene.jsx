import {useEffect,useRef} from 'react'
import * as THREE from 'three'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'

const N=420,M=14,TAU=Math.PI*2
const ANCHORS=[[3.3,1.9,.2],[.9,3.0,-.4],[-2.5,1.8,.35],[-3.35,-.5,-.2],[-1.9,-2.55,.4],[1.2,-2.7,-.3],[3.55,-.7,.3]]
export default function RibbonScene(){
 const host=useRef(null)
 useEffect(()=>{
  const el=host.current;let renderer
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true})}catch{el.classList.add('fallback');return}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=.92;el.appendChild(renderer.domElement)
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(28,1,.1,80);camera.position.z=13
  const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environment=env
  const key=new THREE.DirectionalLight(0xfffbe8,1.6);key.position.set(-3,6,6);scene.add(key)
  const fill=new THREE.DirectionalLight(0xe9ffc0,.7);fill.position.set(5,-2,3);scene.add(fill)

  const count=(N+1)*(M+1),pos=new Float32Array(count*3),col=new Float32Array(count*3),ix=[],geo=new THREE.BufferGeometry()
  for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j,b=a+M+1;ix.push(a,a+1,b,b,a+1,b+1)}
  geo.setIndex(ix);geo.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('color',new THREE.BufferAttribute(col,3).setUsage(THREE.DynamicDrawUsage))
  const front=new THREE.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,roughness:.38,metalness:0,clearcoat:.35,clearcoatRoughness:.35,side:THREE.FrontSide,envMapIntensity:.45})
  const back=new THREE.MeshPhysicalMaterial({color:0x5f8216,roughness:.5,clearcoat:.2,clearcoatRoughness:.4,side:THREE.BackSide,envMapIntensity:.35})
  const group=new THREE.Group();group.add(new THREE.Mesh(geo,front),new THREE.Mesh(geo,back));group.rotation.set(-.38,.12,0);scene.add(group)

  const shades=[new THREE.Color('#b4e020'),new THREE.Color('#9ccb14'),new THREE.Color('#c6ec34')],tmp=new THREE.Color()
  const anchors=ANCHORS.map(([x,y,z],i)=>({x,y,z,sp:.14+i*.017,ph:i*1.7}))
  const pts=anchors.map(()=>new THREE.Vector3()),curve=new THREE.CatmullRomCurve3(pts,true,'centripetal')
  const p=new THREE.Vector3(),tan=new THREE.Vector3(),out=new THREE.Vector3(),side=new THREE.Vector3(),wd=new THREE.Vector3()
  function shape(s){
   anchors.forEach((a,i)=>pts[i].set(a.x+.32*Math.sin(s*a.sp+a.ph),a.y+.28*Math.sin(s*a.sp*.8+a.ph+1),a.z+.5*Math.sin(s*a.sp*1.2+a.ph)))
   curve.updateArcLengths();let o=0,c=0
   for(let i=0;i<=N;i++){
    const u=i/N;curve.getPointAt(u%1,p);curve.getTangentAt(u%1,tan)
    out.set(p.x,p.y,0).normalize();side.crossVectors(tan,out).normalize()
    
    const tw=1.05*Math.sin(TAU*2*u-s*.32)+.4*Math.sin(TAU*3*u+s*.2)
    wd.copy(side).multiplyScalar(-Math.cos(tw)).addScaledVector(out,-Math.sin(tw))
    const w=1.05+.12*Math.sin(TAU*2*u+s*.3)
    const f=((u*2-s*.04)%1+1)%1*3,a=Math.floor(f),x=f-a;tmp.copy(shades[a]).lerp(shades[(a+1)%3],x*x*(3-2*x))
    for(let j=0;j<=M;j++){const v=(j/M-.5)*w;pos[o++]=p.x+wd.x*v;pos[o++]=p.y+wd.y*v;pos[o++]=p.z+wd.z*v;col[c++]=tmp.r;col[c++]=tmp.g;col[c++]=tmp.b}
   }
   geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;geo.computeVertexNormals()
   const nr=geo.attributes.normal;for(let j=0;j<=M;j++){const a=j,b=N*(M+1)+j,x=(nr.getX(a)+nr.getX(b))/2,y=(nr.getY(a)+nr.getY(b))/2,z=(nr.getZ(a)+nr.getZ(b))/2;nr.setXYZ(a,x,y,z);nr.setXYZ(b,x,y,z)}
   nr.needsUpdate=true
  }
  const media=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,last=0,time=2,visible=true,dead=false
  const draw=()=>renderer.render(scene,camera)
  function resize(){const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();const k=Math.min(1,w/h/1.3);group.scale.setScalar((.55+.45*k)*.89);group.position.set(.22,-.12,0);shape(time);draw()}
  const active=()=>!media.matches&&visible&&!document.hidden&&!dead
  function tick(now){frame=0;if(!active())return;time+=last?Math.min((now-last)/1000,.05):0;last=now;shape(time);draw();frame=requestAnimationFrame(tick)}
  function sync(){cancelAnimationFrame(frame);frame=0;last=0;if(active())frame=requestAnimationFrame(tick);else draw()}
  resize();const ro=new ResizeObserver(resize);ro.observe(el)
  const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync()});io.observe(el)
  media.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);sync()
  return()=>{dead=true;cancelAnimationFrame(frame);ro.disconnect();io.disconnect();media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);geo.dispose();front.dispose();back.dispose();env.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove()}
 },[])
 return <div className="ribbon-canvas" ref={host} aria-hidden="true"/>
}
