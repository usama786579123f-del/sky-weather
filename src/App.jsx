import React, { useState, useEffect, useRef, useId } from "react";
import * as THREE from "three";
import {
  Search, MapPin, Loader2, Droplets, Wind, Eye, Gauge, Thermometer,
  AlertTriangle, X, Navigation, RefreshCw, Sunrise, Sunset, Globe,
  CloudRain, CloudLightning, LogOut, User, Lock, Mail, Eye as EyeIcon,
  EyeOff, CheckCircle, Bell
} from "lucide-react";

const PAKISTAN_CITIES = [
  "Karachi","Lahore","Islamabad","Rawalpindi","Faisalabad","Multan","Peshawar",
  "Quetta","Sialkot","Gujranwala","Hyderabad","Rahim Yar Khan","Bahawalpur",
  "Sargodha","Sukkur","Larkana","Sheikhupura","Jhang","Dera Ghazi Khan","Gujrat"
];

const VISUALS = {
  Clear:{ gradient:"linear-gradient(160deg,#0a2540 0%,#155a8a 48%,#4fa8d8 100%)", glow:"rgba(255,209,102,0.28)" },
  Clouds:{ gradient:"linear-gradient(160deg,#1f242b 0%,#3a4750 48%,#5c6b73 100%)", glow:"rgba(203,213,225,0.2)" },
  Rain:{ gradient:"linear-gradient(160deg,#0a1622 0%,#173a5c 48%,#1f5d82 100%)", glow:"rgba(79,195,247,0.22)" },
  Thunderstorm:{ gradient:"linear-gradient(160deg,#120618 0%,#2d1b4e 48%,#3a2a5c 100%)", glow:"rgba(255,230,109,0.2)" },
  Snow:{ gradient:"linear-gradient(160deg,#182430 0%,#3e5c6b 48%,#aac8d6 100%)", glow:"rgba(234,246,255,0.28)" },
  Mist:{ gradient:"linear-gradient(160deg,#232a2e 0%,#4a5559 48%,#6b7780 100%)", glow:"rgba(226,232,240,0.2)" },
  Default:{ gradient:"linear-gradient(160deg,#0b1120 0%,#1b2434 48%,#2d3a4d 100%)", glow:"rgba(148,163,184,0.2)" },
};

function resolveGroup(main) {
  if (!main) return "Default";
  if (main === "Drizzle") return "Rain";
  if (["Mist","Smoke","Haze","Dust","Fog","Sand","Ash","Squall","Tornado"].includes(main)) return "Mist";
  if (VISUALS[main]) return main;
  return "Default";
}

function formatCoord(lat, lon) {
  return `${Math.abs(lat).toFixed(3)}°${lat>=0?"N":"S"}, ${Math.abs(lon).toFixed(3)}°${lon>=0?"E":"W"}`;
}

function localDateFromUnix(unix, tz) { return new Date((unix + tz) * 1000); }

function getRainMessage(pop, weather, cityName) {
  const chance = Math.round(pop * 100);
  const isRaining = ["Rain","Drizzle","Thunderstorm"].includes(weather?.main);
  const desc = weather?.description || "";
  
  if (isRaining) {
    const intensity = desc.includes("heavy") ? "بہت تیز" : desc.includes("light") ? "ہلکی" : "معتدل";
    return {
      type: "raining",
      emoji: "🌧️",
      title: `ابھی بارش ہو رہی ہے!`,
      msg: `${cityName} میں اس وقت ${intensity} بارش ہو رہی ہے۔ چھتری ساتھ رکھیں!`,
      color: "#4fc3f7",
      bg: "rgba(79,195,247,0.1)",
      border: "rgba(79,195,247,0.3)"
    };
  }
  if (chance >= 80) return {
    type:"high", emoji:"⛈️", title:`${chance}% بارش کا امکان`,
    msg:`آج ${cityName} میں بارش کا بہت زیادہ امکان ہے۔ گھر سے نکلنے سے پہلے چھتری ضرور لیں!`,
    color:"#f87171", bg:"rgba(248,113,113,0.1)", border:"rgba(248,113,113,0.3)"
  };
  if (chance >= 50) return {
    type:"medium", emoji:"🌦️", title:`${chance}% بارش کا امکان`,
    msg:`آج ${cityName} میں بارش ہو سکتی ہے۔ احتیاط کریں اور چھتری ساتھ رکھیں۔`,
    color:"#fbbf24", bg:"rgba(251,191,36,0.1)", border:"rgba(251,191,36,0.3)"
  };
  if (chance >= 20) return {
    type:"low", emoji:"🌤️", title:`${chance}% بارش کا امکان`,
    msg:`آج ${cityName} میں بارش کا تھوڑا امکان ہے۔ موسم خوشگوار رہے گا۔`,
    color:"#86efac", bg:"rgba(134,239,172,0.1)", border:"rgba(134,239,172,0.3)"
  };
  return {
    type:"clear", emoji:"☀️", title:`بارش کا امکان نہیں`,
    msg:`آج ${cityName} میں موسم صاف رہے گا۔ بارش کا کوئی امکان نہیں!`,
    color:"#ffd166", bg:"rgba(255,209,102,0.1)", border:"rgba(255,209,102,0.3)"
  };
}

function WeatherIcon({ group, description="", size=64 }) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g,"");
  const c = { width:size, height:size, viewBox:"0 0 100 100" };
  if (group==="Clear") return <svg {...c}><defs><radialGradient id={`sg-${uid}`} cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ffe9a8" stopOpacity="0.9"/><stop offset="100%" stopColor="#ffe9a8" stopOpacity="0"/></radialGradient></defs><circle cx="50" cy="50" r="40" fill={`url(#sg-${uid})`}/><g className="wi-sun-rays">{Array.from({length:8}).map((_,i)=><rect key={i} x="48" y="6" width="4" height="12" rx="2" fill="#ffd166" transform={`rotate(${i*45} 50 50)`}/>)}</g><circle cx="50" cy="50" r="22" fill="#ffd166"/></svg>;
  if (group==="Clouds") { const p=/few|scattered/i.test(description); return <svg {...c}>{p&&<circle cx="36" cy="38" r="15" fill="#ffd166" className="wi-sun-rays"/>}<ellipse cx="42" cy="60" rx="22" ry="13" fill="#9aa7b0" className="wi-cloud-back"/><g className="wi-cloud-front"><ellipse cx="58" cy="63" rx="26" ry="15" fill="#e2e8f0"/><circle cx="42" cy="57" r="14" fill="#e2e8f0"/></g></svg>; }
  if (group==="Rain") return <svg {...c}><ellipse cx="42" cy="44" rx="22" ry="12" fill="#5b6b78" className="wi-cloud-back"/><g className="wi-cloud-front"><ellipse cx="58" cy="48" rx="26" ry="14" fill="#7c8a96"/><circle cx="42" cy="42" r="12" fill="#7c8a96"/></g>{[28,46,64].map((x,i)=><line key={i} x1={x} y1="64" x2={x-5} y2="84" stroke="#4fc3f7" strokeWidth="4" strokeLinecap="round" className="wi-raindrop" style={{animationDelay:`${i*0.2}s`}}/>)}</svg>;
  if (group==="Snow") return <svg {...c}><ellipse cx="42" cy="42" rx="22" ry="12" fill="#7c93a3" className="wi-cloud-back"/><g className="wi-cloud-front"><ellipse cx="58" cy="46" rx="26" ry="14" fill="#aac8d6"/><circle cx="42" cy="40" r="12" fill="#aac8d6"/></g>{[30,50,70].map((x,i)=><text key={i} x={x} y="76" fontSize="15" fill="#eaf6ff" className="wi-snowflake" style={{animationDelay:`${i*0.35}s`}}>❄</text>)}</svg>;
  if (group==="Thunderstorm") return <svg {...c}><ellipse cx="42" cy="40" rx="22" ry="12" fill="#3f4756" className="wi-cloud-back"/><g className="wi-cloud-front"><ellipse cx="58" cy="44" rx="26" ry="14" fill="#545f70"/><circle cx="42" cy="38" r="12" fill="#545f70"/></g><polygon points="52,50 40,72 50,72 42,92 64,62 52,62" fill="#ffe66d" className="wi-bolt"/></svg>;
  if (group==="Mist") return <svg {...c}>{[32,48,64].map((y,i)=><line key={i} x1="18" y1={y} x2="82" y2={y} stroke="#e2e8f0" strokeWidth="5" strokeLinecap="round" className="wi-mist-line" style={{animationDelay:`${i*0.4}s`}}/>)}</svg>;
  return <svg {...c}><ellipse cx="50" cy="55" rx="26" ry="15" fill="#94a3b8"/></svg>;
}

function GlobeView({ lat, lon }) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (lat==null||lon==null||!containerRef.current) return;
    const container = containerRef.current;
    let mounted=true, frameId;
    const width=container.clientWidth||300, height=container.clientHeight||260;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(45,width/height,0.1,100);
    camera.position.z=4;
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    renderer.setSize(width,height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    container.innerHTML="";
    container.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff,0.6));
    const sun=new THREE.DirectionalLight(0xffffff,1.1); sun.position.set(5,3,5); scene.add(sun);
    const earthGroup=new THREE.Group(); scene.add(earthGroup);
    const radius=1.5;
    const geo=new THREE.SphereGeometry(radius,64,64);
    const mat=new THREE.MeshPhongMaterial({color:0x1d5d8e,shininess:8});
    const earthMesh=new THREE.Mesh(geo,mat); earthGroup.add(earthMesh);
    const phi=(90-lat)*(Math.PI/180), theta=(lon+180)*(Math.PI/180);
    const mPos=new THREE.Vector3(-radius*Math.sin(phi)*Math.cos(theta),radius*Math.cos(phi),radius*Math.sin(phi)*Math.sin(theta));
    const mGeo=new THREE.SphereGeometry(0.05,16,16);
    const mMat=new THREE.MeshBasicMaterial({color:0xff4444});
    const marker=new THREE.Mesh(mGeo,mMat); marker.position.copy(mPos); earthGroup.add(marker);
    const rGeo=new THREE.RingGeometry(0.07,0.11,28);
    const rMat=new THREE.MeshBasicMaterial({color:0xff4444,transparent:true,opacity:0.8,side:THREE.DoubleSide});
    const ring=new THREE.Mesh(rGeo,rMat); ring.position.copy(mPos.clone().multiplyScalar(1.01)); ring.lookAt(mPos.clone().multiplyScalar(2)); earthGroup.add(ring);
    let cloudMesh=null;
    const loader=new THREE.TextureLoader(); loader.crossOrigin="anonymous";
    loader.load("https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",(tex)=>{ if(!mounted)return; earthMesh.material.dispose(); earthMesh.material=new THREE.MeshPhongMaterial({map:tex,shininess:6}); },undefined,()=>{});
    loader.load("https://threejs.org/examples/textures/planets/earth_clouds_1024.png",(tex)=>{ if(!mounted)return; const cGeo=new THREE.SphereGeometry(radius*1.015,64,64); const cMat=new THREE.MeshPhongMaterial({map:tex,transparent:true,opacity:0.45,depthWrite:false}); cloudMesh=new THREE.Mesh(cGeo,cMat); earthGroup.add(cloudMesh); },undefined,()=>{});
    earthGroup.rotation.y=-theta-Math.PI/2;
    function animate(){ earthGroup.rotation.y+=0.0016; if(cloudMesh)cloudMesh.rotation.y+=0.0009; const p=1+Math.sin(Date.now()*0.004)*0.18; ring.scale.setScalar(p); renderer.render(scene,camera); frameId=requestAnimationFrame(animate); }
    animate();
    function resize(){ const w=container.clientWidth,h=container.clientHeight; if(!w||!h)return; renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix(); }
    window.addEventListener("resize",resize);
    return ()=>{ mounted=false; window.removeEventListener("resize",resize); cancelAnimationFrame(frameId); geo.dispose(); mGeo.dispose(); rGeo.dispose(); mMat.dispose(); rMat.dispose(); if(earthMesh.material)earthMesh.material.dispose(); if(cloudMesh){cloudMesh.geometry.dispose();cloudMesh.material.dispose();} renderer.dispose(); if(container)container.innerHTML=""; };
  },[lat,lon]);
  return <div ref={containerRef} style={{width:"100%",height:260,borderRadius:16,overflow:"hidden"}}/>;
}

function SunArc({ sunrise, sunset, timezone }) {
  const now=Date.now()/1000;
  const fraction=Math.min(1,Math.max(0,(now-sunrise)/(sunset-sunrise)));
  const isNight=now<sunrise||now>sunset;
  const t=fraction, p0=[10,55],p1=[100,-15],p2=[190,55];
  const sx=(1-t)*(1-t)*p0[0]+2*(1-t)*t*p1[0]+t*t*p2[0];
  const sy=(1-t)*(1-t)*p0[1]+2*(1-t)*t*p1[1]+t*t*p2[1];
  const srL=localDateFromUnix(sunrise,timezone), ssL=localDateFromUnix(sunset,timezone);
  const fmt=(d)=>d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",timeZone:"UTC"});
  const dl=sunset-sunrise;
  return (
    <div className="glass-card" style={{padding:"20px 24px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:600}}>{isNight?"🌙":"☀️"} Sun Position</span>
        <span style={{fontSize:11,padding:"4px 10px",borderRadius:999,background:"rgba(255,255,255,0.08)"}}>{isNight?"Night":"Daytime"}</span>
      </div>
      <svg viewBox="0 0 200 60" width="100%" height={60} style={{overflow:"visible"}}>
        <path d="M10,55 Q100,-15 190,55" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 5"/>
        <circle cx={sx} cy={sy} r="11" fill="#ffd166" opacity="0.25"/>
        <circle cx={sx} cy={sy} r="6" fill="#ffd166"/>
      </svg>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontFamily:"JetBrains Mono,monospace",color:"rgba(241,245,249,0.7)",marginTop:4}}>
        <span><Sunrise size={12} style={{verticalAlign:"middle",marginRight:4}}/>{fmt(srL)}</span>
        <span style={{fontSize:11,color:"rgba(241,245,249,0.45)"}}>{Math.floor(dl/3600)}h {Math.floor((dl%3600)/60)}m daylight</span>
        <span><Sunset size={12} style={{verticalAlign:"middle",marginRight:4}}/>{fmt(ssL)}</span>
      </div>
    </div>
  );
}

function buildHourly(list, tz) {
  return list.slice(0,8).map((item,i)=>({
    key:item.dt, localDate:localDateFromUnix(item.dt,tz),
    temp:Math.round(item.main.temp), pop:Math.round((item.pop||0)*100),
    main:item.weather[0].main, description:item.weather[0].description, isNow:i===0,
  }));
}

function buildForecast(list, tz) {
  const groups={};
  for(const e of list){ const d=localDateFromUnix(e.dt,tz); const k=`${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`; if(!groups[k])groups[k]=[]; groups[k].push({entry:e,localDate:d}); }
  const nowD=localDateFromUnix(Date.now()/1000,tz);
  const todayKey=`${nowD.getUTCFullYear()}-${nowD.getUTCMonth()}-${nowD.getUTCDate()}`;
  return Object.keys(groups).filter(k=>k!==todayKey).slice(0,5).map(k=>{
    const items=groups[k]; let rep=items[0],best=Infinity,mn=Infinity,mx=-Infinity,maxPop=0;
    for(const item of items){ const diff=Math.abs(item.localDate.getUTCHours()-12); if(diff<best){best=diff;rep=item;} mn=Math.min(mn,item.entry.main.temp_min,item.entry.main.temp); mx=Math.max(mx,item.entry.main.temp_max,item.entry.main.temp); maxPop=Math.max(maxPop,(item.entry.pop||0)*100); }
    return { k, date:rep.localDate, min:Math.round(mn), max:Math.round(mx), main:rep.entry.weather[0].main, description:rep.entry.weather[0].description, pop:Math.round(maxPop) };
  });
}

// ==================== LOGIN PAGE ====================
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function getUsers() { try { return JSON.parse(localStorage.getItem("sw_users")||"[]"); } catch { return []; } }
  function saveUsers(u) { localStorage.setItem("sw_users", JSON.stringify(u)); }

  async function handle() {
    setError(""); setSuccess("");
    if (!email || !pass) { setError("Please fill all fields"); return; }
    if (!email.includes("@")) { setError("Invalid email address"); return; }
    if (pass.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    await new Promise(r=>setTimeout(r,800));
    const users = getUsers();
    if (mode === "register") {
      if (!name.trim()) { setError("Please enter your name"); setLoading(false); return; }
      if (users.find(u=>u.email===email.toLowerCase())) { setError("Email already registered. Please login."); setLoading(false); return; }
      const user = { id: Date.now(), name: name.trim(), email: email.toLowerCase(), pass, createdAt: new Date().toISOString() };
      saveUsers([...users, user]);
      localStorage.setItem("sw_current", JSON.stringify(user));
      setSuccess("Account created! Welcome to Skyline Weather!");
      setTimeout(()=>onLogin(user), 1000);
    } else {
      const user = users.find(u=>u.email===email.toLowerCase()&&u.pass===pass);
      if (!user) { setError("Invalid email or password"); setLoading(false); return; }
      localStorage.setItem("sw_current", JSON.stringify(user));
      setSuccess(`Welcome back, ${user.name}!`);
      setTimeout(()=>onLogin(user), 800);
    }
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0b1120 0%,#1b2434 48%,#0a2540 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"Inter,sans-serif",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"-20%",left:"50%",transform:"translateX(-50%)",width:600,height:600,background:"radial-gradient(circle,rgba(79,168,216,0.1) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"10%",width:400,height:400,background:"radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)",pointerEvents:"none"}}/>
      
      <div style={{width:"100%",maxWidth:440,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:28,padding:"40px 36px",backdropFilter:"blur(30px)",position:"relative"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#4fa8d8,#6366f1)",borderRadius:"28px 28px 0 0"}}/>
        
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:40,marginBottom:12}}>🌤️</div>
          <h1 style={{fontFamily:"Outfit,sans-serif",fontSize:24,fontWeight:800,color:"#f1f5f9",marginBottom:6,letterSpacing:"-0.02em"}}>Skyline Weather</h1>
          <p style={{color:"#64748b",fontSize:14}}>{mode==="login"?"Sign in to your account":"Create your free account"}</p>
        </div>

        <div style={{display:"flex",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:4,marginBottom:24}}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");setSuccess("");}} style={{flex:1,height:38,border:"none",cursor:"pointer",borderRadius:9,fontWeight:600,fontSize:13,color:mode===m?"white":"#64748b",background:mode===m?"linear-gradient(135deg,#4fa8d8,#6366f1)":"transparent",transition:"all 0.2s",fontFamily:"Inter,sans-serif"}}>
              {m==="login"?"🔑 Sign In":"✨ Register"}
            </button>
          ))}
        </div>

        {error && <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"10px 14px",color:"#f87171",fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:8}}><AlertTriangle size={14}/>{error}</div>}
        {success && <div style={{background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:10,padding:"10px 14px",color:"#34d399",fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:8}}><CheckCircle size={14}/>{success}</div>}

        {mode==="register" && (
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#94a3b8",marginBottom:6}}>Full Name</label>
            <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"0 14px"}}>
              <User size={15} color="#64748b"/>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={{flex:1,height:46,background:"transparent",border:"none",outline:"none",color:"#f1f5f9",fontSize:14,fontFamily:"Inter,sans-serif"}}/>
            </div>
          </div>
        )}

        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#94a3b8",marginBottom:6}}>Email Address</label>
          <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"0 14px"}}>
            <Mail size={15} color="#64748b"/>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={e=>e.key==="Enter"&&handle()} style={{flex:1,height:46,background:"transparent",border:"none",outline:"none",color:"#f1f5f9",fontSize:14,fontFamily:"Inter,sans-serif"}}/>
          </div>
        </div>

        <div style={{marginBottom:24}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#94a3b8",marginBottom:6}}>Password</label>
          <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"0 14px"}}>
            <Lock size={15} color="#64748b"/>
            <input type={showPass?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} placeholder="Min 6 characters" onKeyDown={e=>e.key==="Enter"&&handle()} style={{flex:1,height:46,background:"transparent",border:"none",outline:"none",color:"#f1f5f9",fontSize:14,fontFamily:"Inter,sans-serif"}}/>
            <button onClick={()=>setShowPass(!showPass)} style={{background:"none",border:"none",cursor:"pointer",color:"#64748b",display:"flex",padding:4}}>{showPass?<EyeOff size={15}/>:<EyeIcon size={15}/>}</button>
          </div>
        </div>

        <button onClick={handle} disabled={loading} style={{width:"100%",height:50,border:"none",cursor:loading?"not-allowed":"pointer",borderRadius:12,fontWeight:700,fontSize:15,color:"white",background:loading?"rgba(79,168,216,0.4)":"linear-gradient(135deg,#4fa8d8,#6366f1)",boxShadow:loading?"none":"0 8px 24px rgba(79,168,216,0.3)",fontFamily:"Inter,sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s"}}>
          {loading?<><Loader2 size={16} className="spin"/>Processing...</>:(mode==="login"?"🚀 Sign In":"✨ Create Account")}
        </button>

        <p style={{textAlign:"center",color:"#475569",fontSize:13,marginTop:16}}>
          {mode==="login"?"No account? ":"Have an account? "}
          <span onClick={()=>{setMode(mode==="login"?"register":"login");setError("");}} style={{color:"#4fa8d8",cursor:"pointer",fontWeight:600}}>
            {mode==="login"?"Register free →":"Sign in →"}
          </span>
        </p>

        <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"center",gap:20}}>
          {["🔒 Secure","⚡ Fast","🌍 Global"].map(b=><span key={b} style={{fontSize:11,color:"#334155",fontWeight:500}}>{b}</span>)}
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
export default function WeatherApp() {
  const [user, setUser] = useState(null);
  const [apiKey, setApiKey] = useState("03ef28f99c7827fc35f4a3ffe6d78b05");
  const [keyInput, setKeyInput] = useState("");
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [pkRainData, setPkRainData] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [pkLoading, setPkLoading] = useState(false);
  const [error, setError] = useState("");
  const [localTime, setLocalTime] = useState(null);
  const [rainMsg, setRainMsg] = useState(null);
  const [recentRain, setRecentRain] = useState([]);
  const lastRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("sw_current");
    if (saved) { try { setUser(JSON.parse(saved)); } catch {} }
    const savedKey = localStorage.getItem("sw_apikey");
    if (savedKey) setApiKey(savedKey);
    const savedHistory = localStorage.getItem("sw_history");
    if (savedHistory) { try { setHistory(JSON.parse(savedHistory)); } catch {} }
    const savedRain = localStorage.getItem("sw_recent_rain");
    if (savedRain) { try { 
      const rains = JSON.parse(savedRain);
      const cutoff = Date.now() - 3*60*60*1000;
      setRecentRain(rains.filter(r=>r.time>cutoff));
    } catch {} }
  }, []);

  async function fetchWeather(params, key=apiKey) {
    if (!params||!key) return;
    lastRef.current = params;
    setLoading(true); setError("");
    try {
      const qs = new URLSearchParams({...params, units:"metric", appid:key}).toString();
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?${qs}`);
      const data = await res.json();
      if (!res.ok) {
        if (res.status===401) throw new Error("Invalid API key. Please check and reconnect.");
        if (res.status===404) throw new Error("City not found. Check spelling and try again.");
        throw new Error(data.message||"Something went wrong.");
      }
      setWeather(data);

      const newHistory = [{ name:data.name, country:data.sys?.country||"", lat:data.coord.lat, lon:data.coord.lon }, ...history.filter(h=>`${h.lat.toFixed(2)},${h.lon.toFixed(2)}`!==`${data.coord.lat.toFixed(2)},${data.coord.lon.toFixed(2)}`)].slice(0,6);
      setHistory(newHistory);
      localStorage.setItem("sw_history", JSON.stringify(newHistory));

      try {
        const fRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?${qs}`);
        const fData = await fRes.json();
        if (fRes.ok && fData.list) {
          const fc = buildForecast(fData.list, data.timezone);
          setForecast(fc);
          setHourly(buildHourly(fData.list, data.timezone));
          const firstPop = fData.list[0]?.pop || 0;
          const msg = getRainMessage(firstPop, data.weather[0], data.name);
          setRainMsg(msg);

          if (["Rain","Drizzle","Thunderstorm"].includes(data.weather[0]?.main)) {
            const newRain = { city:data.name, country:data.sys?.country||"", time:Date.now(), desc:data.weather[0].description, intensity: data.rain?.["1h"]||0 };
            const updated = [newRain, ...recentRain.filter(r=>r.city!==data.name&&Date.now()-r.time<3*60*60*1000)].slice(0,10);
            setRecentRain(updated);
            localStorage.setItem("sw_recent_rain", JSON.stringify(updated));
          }
        }
      } catch {}
    } catch(e) {
      setError(e.message||"Network error.");
    } finally { setLoading(false); }
  }

  async function fetchPakistanRain(key=apiKey) {
    if (!key) return;
    setPkLoading(true);
    const results = [];
    for (const city of PAKISTAN_CITIES.slice(0,10)) {
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city},PK&units=metric&appid=${key}`);
        const data = await res.json();
        if (res.ok) {
          const fRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city},PK&units=metric&appid=${key}`);
          const fData = await fRes.json();
          const pop = fRes.ok ? (fData.list?.[0]?.pop||0)*100 : 0;
          const isRaining = ["Rain","Drizzle","Thunderstorm"].includes(data.weather[0]?.main);
          results.push({ city, temp:Math.round(data.main.temp), main:data.weather[0]?.main, desc:data.weather[0]?.description, pop:Math.round(pop), isRaining });
        }
      } catch {}
      await new Promise(r=>setTimeout(r,200));
    }
    setPkRainData(results);
    setPkLoading(false);
  }

  useEffect(() => {
    if (apiKey && user) {
      fetchWeather({ q:"Lahore,PK" }, apiKey);
      fetchPakistanRain(apiKey);
    }
  }, [apiKey, user]);

  useEffect(() => {
    if (!weather) return;
    const tick = () => setLocalTime(new Date((Date.now()/1000+weather.timezone)*1000));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [weather]);

  function handleConnect(e) {
    e.preventDefault();
    if (!keyInput.trim()) return;
    const k = keyInput.trim();
    setApiKey(k);
    localStorage.setItem("sw_apikey", k);
  }

  function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    fetchWeather({ q });
  }

  function handleLocate() {
    setError("");
    if (!navigator.geolocation) { setError("Geolocation not supported."); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async(pos) => { await fetchWeather({lat:pos.coords.latitude,lon:pos.coords.longitude}); setLocLoading(false); },
      (err) => { setLocLoading(false); setError(err.code===1?"Location permission denied. Search manually.":"Could not detect location."); },
      { timeout:10000 }
    );
  }

  function handleLogout() {
    localStorage.removeItem("sw_current");
    setUser(null); setWeather(null); setForecast([]); setHourly([]); setError(""); setRainMsg(null);
  }

  if (!user) return <LoginPage onLogin={setUser}/>;

  const group = weather ? resolveGroup(weather.weather[0].main) : "Default";
  const visuals = VISUALS[group];

  return (
    <div style={{minHeight:"100vh",background:visuals.gradient,padding:"24px 16px 60px",fontFamily:"Inter,sans-serif",color:"#f1f5f9",position:"relative",overflow:"hidden",transition:"background 1.4s ease"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;}
        .spin{animation:spin 1s linear infinite;}
        @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        .fadeUp{animation:fadeUp 0.5s ease both;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        .glass-card{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.13);backdrop-filter:blur(24px);border-radius:20px;box-shadow:0 8px 32px rgba(0,0,0,0.2);}
        .icon-btn{display:flex;align-items:center;justify-content:center;gap:7px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);backdrop-filter:blur(16px);border-radius:12px;padding:10px 16px;color:#fff;cursor:pointer;font-size:13px;font-family:Inter,sans-serif;font-weight:500;white-space:nowrap;transition:all 0.2s;}
        .icon-btn:hover{background:rgba(255,255,255,0.16);transform:translateY(-1px);}
        .icon-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
        .search-input{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);backdrop-filter:blur(16px);border-radius:12px;padding:10px 14px 10px 40px;color:#fff;font-size:14px;outline:none;width:100%;font-family:Inter,sans-serif;}
        .search-input::placeholder{color:rgba(255,255,255,0.4);}
        .stat-tile{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:12px 14px;}
        .history-chip{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:999px;padding:6px 12px;font-size:12px;white-space:nowrap;cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:6px;}
        .history-chip:hover{background:rgba(255,255,255,0.14);}
        .hourly-card{flex:0 0 80px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:10px 6px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px;}
        .forecast-card{flex:0 0 110px;scroll-snap-align:start;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:14px 8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:3px;}
        .pk-city-card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;}
        .blob{position:absolute;border-radius:50%;filter:blur(70px);pointer-events:none;z-index:0;opacity:0.5;animation:floatBlob 14s ease-in-out infinite;}
        @keyframes floatBlob{0%,100%{transform:translate(0,0);}50%{transform:translate(20px,-30px);}}
        .wi-sun-rays{transform-origin:50px 50px;animation:spin 14s linear infinite;}
        .wi-cloud-front{animation:dF 6s ease-in-out infinite;}
        .wi-cloud-back{animation:dB 7s ease-in-out infinite;}
        @keyframes dF{0%,100%{transform:translateX(0);}50%{transform:translateX(3px);}}
        @keyframes dB{0%,100%{transform:translateX(0);}50%{transform:translateX(-3px);}}
        .wi-raindrop{animation:fall 1.1s linear infinite;}
        @keyframes fall{0%{transform:translateY(-6px);opacity:0;}25%{opacity:1;}100%{transform:translateY(18px);opacity:0;}}
        .wi-snowflake{animation:fR 3s linear infinite;}
        @keyframes fR{0%{transform:translateY(-6px);opacity:0;}25%{opacity:1;}100%{transform:translateY(20px);opacity:0;}}
        .wi-bolt{animation:flk 2.4s ease-in-out infinite;}
        @keyframes flk{0%,100%{opacity:0.35;}8%,12%{opacity:1;}22%{opacity:0.35;}46%,54%{opacity:1;}62%{opacity:0.35;}}
        .wi-mist-line{animation:mD 4s ease-in-out infinite;}
        @keyframes mD{0%,100%{opacity:0.5;transform:translateX(-4px);}50%{opacity:1;transform:translateX(4px);}}
        ::-webkit-scrollbar{height:3px;width:3px;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.2);border-radius:3px;}
      `}</style>

      <div className="blob" style={{background:visuals.glow,width:400,height:400,top:"-100px",left:"-100px"}}/>
      <div className="blob" style={{background:visuals.glow,width:350,height:350,bottom:"5%",right:"-80px",animationDelay:"3s"}}/>

      <div style={{position:"relative",zIndex:1,maxWidth:1000,margin:"0 auto"}}>
        
        {/* TOP BAR */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontFamily:"Outfit,sans-serif",fontWeight:800,fontSize:22,margin:0,display:"flex",alignItems:"center",gap:8,letterSpacing:"-0.02em"}}>
              <WeatherIcon group={group} description={weather?.weather?.[0]?.description} size={28}/>
              Skyline Weather
            </h1>
            <p style={{margin:"3px 0 0",fontSize:12,color:"rgba(241,245,249,0.5)",fontFamily:"JetBrains Mono,monospace"}}>Live conditions, anywhere on earth</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:13,color:"rgba(241,245,249,0.7)",display:"flex",alignItems:"center",gap:6}}>
              <User size={14}/> {user.name}
            </div>
            <button className="icon-btn" onClick={handleLogout} style={{padding:"8px 12px",fontSize:12}}>
              <LogOut size={13}/> Logout
            </button>
          </div>
        </div>

        {/* API KEY */}
        {!apiKey ? (
          <div className="glass-card fadeUp" style={{padding:30,maxWidth:440,margin:"60px auto",textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:12}}>🔑</div>
            <h2 style={{fontFamily:"Outfit,sans-serif",fontSize:18,marginBottom:8}}>Connect OpenWeatherMap API</h2>
            <p style={{fontSize:13,color:"rgba(241,245,249,0.6)",lineHeight:1.6,marginBottom:20}}>Free API key from <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" style={{color:"#4fc3f7"}}>openweathermap.org</a> — never stored anywhere else.</p>
            <form onSubmit={handleConnect}>
              <input value={keyInput} onChange={e=>setKeyInput(e.target.value)} placeholder="Paste your API key here" style={{width:"100%",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.18)",borderRadius:12,padding:"12px 14px",color:"#fff",fontSize:13,outline:"none",marginBottom:12,fontFamily:"JetBrains Mono,monospace"}}/>
              <button type="submit" className="icon-btn" style={{width:"100%",justifyContent:"center",padding:12,fontSize:14}}>Continue →</button>
            </form>
          </div>
        ) : (
          <>
            {/* SEARCH */}
            <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
              <form onSubmit={handleSearch} style={{display:"flex",gap:10,flex:1,minWidth:200}}>
                <div style={{position:"relative",flex:1}}>
                  <Search size={15} style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",opacity:0.5,pointerEvents:"none"}}/>
                  <input className="search-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search any city worldwide..."/>
                  {query && <X size={14} onClick={()=>setQuery("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",opacity:0.5,cursor:"pointer"}}/>}
                </div>
                <button type="submit" className="icon-btn" disabled={loading}>
                  {loading?<Loader2 size={14} className="spin"/>:<Search size={14}/>} Search
                </button>
              </form>
              <button className="icon-btn" onClick={handleLocate} disabled={locLoading}>
                {locLoading?<Loader2 size={14} className="spin"/>:<MapPin size={14}/>} My Location
              </button>
              <button className="icon-btn" onClick={()=>fetchPakistanRain()} disabled={pkLoading} style={{fontSize:12}}>
                {pkLoading?<Loader2 size={13} className="spin"/>:<Bell size={13}/>} PK Rain
              </button>
            </div>

            {/* HISTORY */}
            {history.length>0 && (
              <div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:16,paddingBottom:4}}>
                {history.map(h=>(
                  <div key={`${h.lat}-${h.lon}`} className="history-chip" onClick={()=>fetchWeather({lat:h.lat,lon:h.lon})}>
                    <MapPin size={10} style={{opacity:0.6}}/>{h.name}{h.country?`, ${h.country}`:""}
                  </div>
                ))}
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:14,padding:"12px 16px",color:"#fecaca",fontSize:13,marginBottom:16}}>
                <AlertTriangle size={15} style={{flexShrink:0}}/><span style={{flex:1}}>{error}</span>
                {lastRef.current&&<button className="icon-btn" style={{padding:"6px 10px",fontSize:12}} onClick={()=>fetchWeather(lastRef.current)}><RefreshCw size={12}/> Retry</button>}
              </div>
            )}

            {/* RAIN ALERT BANNER */}
            {rainMsg && (
              <div className="fadeUp" style={{background:rainMsg.bg,border:`1px solid ${rainMsg.border}`,borderRadius:16,padding:"16px 20px",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                  <div style={{fontSize:28,flexShrink:0}}>{rainMsg.emoji}</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"Outfit,sans-serif",fontWeight:700,fontSize:16,color:rainMsg.color,marginBottom:4}}>{rainMsg.title}</div>
                    <div style={{fontSize:14,color:"rgba(241,245,249,0.85)",lineHeight:1.6,direction:"rtl",textAlign:"right",fontFamily:"inherit"}}>{rainMsg.msg}</div>
                  </div>
                </div>
              </div>
            )}

            {/* RECENT RAIN ALERTS */}
            {recentRain.length>0 && (
              <div className="glass-card fadeUp" style={{padding:"16px 20px",marginBottom:16}}>
                <div style={{fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                  <CloudRain size={15} color="#4fc3f7"/> Recent Rain (Last 3 Hours)
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {recentRain.map((r,i)=>(
                    <div key={i} style={{background:"rgba(79,195,247,0.1)",border:"1px solid rgba(79,195,247,0.2)",borderRadius:10,padding:"8px 12px",fontSize:12}}>
                      <span style={{fontWeight:600}}>{r.city}</span>
                      <span style={{color:"rgba(241,245,249,0.6)",marginLeft:6}}>{r.desc}</span>
                      <span style={{color:"#4fc3f7",marginLeft:6,fontSize:11}}>{Math.round((Date.now()-r.time)/60000)}m ago</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MAIN WEATHER CARD */}
            {loading && !weather && (
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"60px 0",color:"rgba(241,245,249,0.6)",fontSize:14}}>
                <Loader2 size={18} className="spin"/> Fetching live weather...
              </div>
            )}

            {weather && (
              <div className="glass-card fadeUp" style={{padding:24,marginBottom:16}} key={weather.id}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:20}}>
                  <div>
                    <div style={{fontFamily:"Outfit,sans-serif",fontSize:20,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                      <MapPin size={16} style={{opacity:0.7}}/>{weather.name}{weather.sys?.country?`, ${weather.sys.country}`:""}
                    </div>
                    <div style={{fontSize:11,color:"rgba(241,245,249,0.45)",fontFamily:"JetBrains Mono,monospace",marginTop:3}}>{formatCoord(weather.coord.lat,weather.coord.lon)}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    {localTime && <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:12,color:"rgba(241,245,249,0.65)"}}>{localTime.toLocaleString("en-US",{weekday:"long",hour:"2-digit",minute:"2-digit",timeZone:"UTC"})}</div>}
                    <div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"flex-end",marginTop:3}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:"#4ade80",boxShadow:"0 0 8px #4ade80",animation:"pulseDot 1.6s ease-in-out infinite"}}/>
                      <span style={{fontSize:10,color:"#86efac",fontFamily:"JetBrains Mono,monospace",letterSpacing:"0.05em"}}>LIVE</span>
                    </div>
                  </div>
                </div>

                <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",marginBottom:20}}>
                  <WeatherIcon group={group} description={weather.weather[0].description} size={100}/>
                  <div>
                    <div style={{fontFamily:"Outfit,sans-serif",fontSize:68,fontWeight:800,lineHeight:1,letterSpacing:"-0.03em"}}>{Math.round(weather.main.temp)}°</div>
                    <div style={{textTransform:"capitalize",fontSize:15,color:"rgba(241,245,249,0.85)",margin:"4px 0"}}>{weather.weather[0].description}</div>
                    <div style={{fontSize:12,color:"rgba(241,245,249,0.5)",fontFamily:"JetBrains Mono,monospace"}}>Feels like {Math.round(weather.main.feels_like)}°C · H:{Math.round(weather.main.temp_max)}° L:{Math.round(weather.main.temp_min)}°</div>
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:10}}>
                  {[
                    {icon:<Droplets size={13}/>,label:"Humidity",val:`${weather.main.humidity}%`},
                    {icon:<Wind size={13}/>,label:"Wind",val:`${weather.wind.speed} m/s`},
                    {icon:<Eye size={13}/>,label:"Visibility",val:`${(weather.visibility/1000).toFixed(1)} km`},
                    {icon:<Gauge size={13}/>,label:"Pressure",val:`${weather.main.pressure} hPa`},
                    {icon:<Thermometer size={13}/>,label:"Feels like",val:`${Math.round(weather.main.feels_like)}°C`},
                    {icon:<CloudRain size={13}/>,label:"Rain chance",val:rainMsg?`${weather.weather[0].main==="Rain"?"100":hourly[0]?.pop||0}%`:"--"},
                  ].map(s=>(
                    <div key={s.label} className="stat-tile">
                      <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",color:"rgba(241,245,249,0.45)",display:"flex",alignItems:"center",gap:5,marginBottom:4}}>{s.icon}{s.label}</div>
                      <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:16,fontWeight:500}}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PAKISTAN RAIN STATUS */}
            {pkRainData.length>0 && (
              <div className="glass-card fadeUp" style={{padding:"20px 22px",marginBottom:16}}>
                <div style={{fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:700,marginBottom:4,display:"flex",alignItems:"center",gap:8}}>
                  🇵🇰 Pakistan Rain Status
                </div>
                <p style={{fontSize:12,color:"rgba(241,245,249,0.5)",marginBottom:16}}>Live rain probability across major cities</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
                  {pkRainData.map(city=>(
                    <div key={city.city} className="pk-city-card" onClick={()=>{setQuery(city.city);fetchWeather({q:`${city.city},PK`})}} style={{cursor:"pointer"}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:14,display:"flex",alignItems:"center",gap:6}}>
                          {city.isRaining?"🌧️":city.pop>50?"🌦️":city.pop>20?"⛅":"☀️"} {city.city}
                        </div>
                        <div style={{fontSize:11,color:"rgba(241,245,249,0.5)",marginTop:2,textTransform:"capitalize"}}>{city.desc}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:14,fontWeight:600,color:city.isRaining?"#4fc3f7":city.pop>50?"#fbbf24":city.pop>20?"#86efac":"#ffd166"}}>{city.isRaining?"🌧️":city.pop+"%"}</div>
                        <div style={{fontSize:11,color:"rgba(241,245,249,0.5)"}}>{city.temp}°C</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GLOBE */}
            {weather && (
              <div className="glass-card fadeUp" style={{padding:"20px 22px",marginBottom:16}}>
                <div style={{fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:600,marginBottom:4,display:"flex",alignItems:"center",gap:8}}><Globe size={15}/> Live Earth View</div>
                <p style={{fontSize:12,color:"rgba(241,245,249,0.5)",marginBottom:12}}>Rotating globe with real cloud layer — your location marked in red</p>
                <GlobeView lat={weather.coord.lat} lon={weather.coord.lon}/>
              </div>
            )}

            {/* SUN ARC */}
            {weather?.sys?.sunrise && <SunArc sunrise={weather.sys.sunrise} sunset={weather.sys.sunset} timezone={weather.timezone}/>}

            {/* HOURLY */}
            {hourly.length>0 && (
              <div className="glass-card fadeUp" style={{padding:"20px 22px",marginBottom:16}}>
                <div style={{fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:700,marginBottom:12}}>Next 24 Hours</div>
                <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:6}}>
                  {hourly.map(h=>(
                    <div key={h.key} className="hourly-card">
                      <div style={{fontSize:11,fontFamily:"JetBrains Mono,monospace",color:"rgba(241,245,249,0.65)"}}>{h.isNow?"Now":h.localDate.toLocaleTimeString("en-US",{hour:"numeric",timeZone:"UTC"})}</div>
                      <WeatherIcon group={resolveGroup(h.main)} description={h.description} size={30}/>
                      <div style={{fontSize:14,fontWeight:600,fontFamily:"Outfit,sans-serif"}}>{h.temp}°</div>
                      <div style={{display:"flex",alignItems:"center",gap:3,fontSize:11,color:h.pop>50?"#f87171":h.pop>20?"#fbbf24":"#86efac",fontWeight:600}}>
                        <CloudRain size={10}/>{h.pop}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FORECAST */}
            {forecast.length>0 && (
              <div className="glass-card fadeUp" style={{padding:"20px 22px",marginBottom:16}}>
                <div style={{fontFamily:"Outfit,sans-serif",fontSize:15,fontWeight:700,marginBottom:12}}>5-Day Forecast</div>
                <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:6,scrollSnapType:"x mandatory"}}>
                  {forecast.map(day=>(
                    <div key={day.k} className="forecast-card">
                      <div style={{fontSize:13,fontWeight:700,fontFamily:"Outfit,sans-serif"}}>{day.date.toLocaleDateString("en-US",{weekday:"short",timeZone:"UTC"})}</div>
                      <div style={{fontSize:10,color:"rgba(241,245,249,0.5)",fontFamily:"JetBrains Mono,monospace"}}>{day.date.toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"})}</div>
                      <WeatherIcon group={resolveGroup(day.main)} description={day.description} size={44}/>
                      <div style={{fontSize:13,fontFamily:"JetBrains Mono,monospace"}}>
                        <span style={{fontWeight:600}}>{day.max}°</span>
                        <span style={{color:"rgba(241,245,249,0.5)",marginLeft:5}}>{day.min}°</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:3,fontSize:11,color:day.pop>50?"#f87171":day.pop>20?"#fbbf24":"#86efac",fontWeight:600,marginTop:2}}>
                        <CloudRain size={10}/>{day.pop}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{textAlign:"center",fontSize:11,color:"rgba(241,245,249,0.35)",marginTop:20,fontFamily:"JetBrains Mono,monospace"}}>
              Powered by OpenWeatherMap · Built with React + Three.js
            </div>
          </>
        )}
      </div>
    </div>
  );
}