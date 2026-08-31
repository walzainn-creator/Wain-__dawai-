const cfg=window.WINDAWAI_CONFIG;
const sb=supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
let userLocation=null;

const arabicMap={"أ":"ا","إ":"ا","آ":"ا","ة":"ه","ى":"ي","ؤ":"و","ئ":"ي","ـ":"","ً":"","ٌ":"","ٍ":"","َ":"","ُ":"","ِ":"","ّ":"","ْ":""};
function normalize(s){return (s||"").toLowerCase().replace(/[أإآةىؤئـًٌٍَُِّْ]/g,c=>arabicMap[c]||c).replace(/[^\u0600-\u06FFa-z0-9]+/g,"").trim();}
function similarity(a,b){a=normalize(a);b=normalize(b);if(!a||!b)return 0;if(a===b)return 1;let dp=Array(b.length+1).fill(0).map((_,i)=>i);for(let i=1;i<=a.length;i++){let prev=dp[0];dp[0]=i;for(let j=1;j<=b.length;j++){let t=dp[j];dp[j]=Math.min(dp[j]+1,dp[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=t}}return 1-dp[b.length]/Math.max(a.length,b.length)}

async function track(type,meta={}){try{await sb.from("analytics_events").insert({event_type:type,metadata:meta})}catch(e){}}
async function searchDrug(){
 const q=document.getElementById("drugInput").value.trim(); if(!q)return;
 await track("drug_search",{query:q});
 const {data:drugs,error}=await sb.from("drugs").select("*").eq("active",true).limit(500);
 if(error){showError(error.message);return}
 const scored=drugs.map(d=>({...d,score:Math.max(similarity(q,d.name_ar),similarity(q,d.name_en||""))})).filter(x=>x.score>=.38).sort((a,b)=>b.score-a.score).slice(0,8);
 const r=document.getElementById("results");r.classList.remove("hidden");
 if(!scored.length){r.innerHTML="<h3>لم نجد اسماً مطابقاً</h3><p>جرّب اسماً آخر أو أرسل طلباً للصيدليات القريبة.</p>";return}
 const best=scored[0];
 const {data:stocks}=await sb.from("pharmacy_inventory").select("*,pharmacies(*)").eq("drug_id",best.id).eq("available",true);
 let list=(stocks||[]).map(s=>{let p=s.pharmacies;let dist=userLocation&&p.latitude&&p.longitude?distanceKm(userLocation.lat,userLocation.lng,p.latitude,p.longitude):null;return {...s,p,dist}}).sort((a,b)=>(a.dist??99999)-(b.dist??99999));
 r.innerHTML=`<h3>نتائج: ${best.name_ar}</h3><p class="muted">تم التصحيح تلقائياً عند الحاجة.</p>`+
 (list.length?`<div class="pharmacyGrid">${list.map(x=>pharmacyCard(x,best)).join("")}</div>`:
 `<p>لا توجد صيدلية أعلنت توفره حالياً.</p><button onclick="requestNearby('${best.id}','${escapeHtml(best.name_ar)}')">🔔 اطلب من الصيدليات القريبة البحث عنه</button>`);
}
function pharmacyCard(x,d){const p=x.p;return `<div class="result"><h3>${escapeHtml(p.name)}</h3><span class="badge">متوفر</span><p>السعر: <b>${x.price??"غير محدد"} ${cfg.currency}</b></p><p>الموقع: ${escapeHtml(p.address||p.area||"غير محدد")}</p>${x.dist!=null?`<p>المسافة: ${x.dist.toFixed(1)} كم</p>`:""}<p>التواصل: <a href="tel:${escapeHtml(p.phone)}">${escapeHtml(p.phone)}</a></p><button class="secondary" onclick="notifyPharmacy('${p.id}','${escapeHtml(d.name_ar)}','${escapeHtml(p.phone)}')">إشعار الصيدلية</button></div>`}
function distanceKm(a,b,c,d){const R=6371,rad=x=>x*Math.PI/180,da=rad(c-a),do_=rad(d-b);const h=Math.sin(da/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(do_/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
async function useLocation(){if(!navigator.geolocation)return alert("المتصفح لا يدعم تحديد الموقع");navigator.geolocation.getCurrentPosition(p=>{userLocation={lat:p.coords.latitude,lng:p.coords.longitude};alert("تم تحديد موقعك");},()=>alert("تعذر تحديد الموقع"))}
async function requestNearby(drugId,name){await sb.from("availability_requests").insert({drug_id:drugId,requested_name:name,latitude:userLocation?.lat||null,longitude:userLocation?.lng||null});alert("تم إرسال طلب البحث عن الدواء للصيدليات المسجلة.");}
function notifyPharmacy(id,name,phone){track("pharmacy_contact",{pharmacy_id:id,drug:name});location.href=`https://wa.me/${phone.replace(/[^0-9]/g,"")}?text=${encodeURIComponent("السلام عليكم، هل يتوفر لديكم دواء "+name+"؟ نرجو تأكيد التوفر والسعر.")}`}
async function loadDrugList(){const {data}=await sb.from("drugs").select("name_ar,name_en").eq("active",true).order("name_ar").limit(500);openModal(`<h2>قائمة الأدوية</h2><div>${(data||[]).map(d=>`<p>${escapeHtml(d.name_ar)} ${d.name_en?`<span class="muted">(${escapeHtml(d.name_en)})</span>`:""}</p>`).join("")}</div>`)}
async function sendComment(){const text=document.getElementById("commentText").value.trim();if(!text)return;await sb.from("patient_comments").insert({comment:text});document.getElementById("commentText").value="";await loadComments();alert("تم إرسال التعليق.");}
async function loadComments(){const {data}=await sb.from("patient_comments").select("comment,reply,created_at").eq("visible",true).order("created_at",{ascending:false}).limit(30);document.getElementById("comments").innerHTML=(data||[]).map(x=>`<div class="comment"><b>سؤال/تعليق</b><div>${escapeHtml(x.comment)}</div>${x.reply?`<div class="reply"><b>الرد:</b> ${escapeHtml(x.reply)}</div>`:""}</div>`).join("")}
function openPharmacy(){openModal(`<h2>تسجيل صيدلية</h2><form onsubmit="registerPharmacy(event)"><input id="pn" required placeholder="اسم الصيدلية"><input id="pp" required placeholder="رقم التواصل"><input id="pa" required placeholder="المدينة / الحي / العنوان"><div class="actions"><input id="plat" type="number" step="any" placeholder="خط العرض"><input id="plng" type="number" step="any" placeholder="خط الطول"></div><button>تسجيل الصيدلية</button></form>`)}
async function registerPharmacy(e){e.preventDefault();const obj={name:pn.value.trim(),phone:pp.value.trim(),address:pa.value.trim(),latitude:plat.value?Number(plat.value):null,longitude:plng.value?Number(plng.value):null,active:true};const {error}=await sb.from("pharmacies").insert(obj);if(error)return alert(error.message);await track("pharmacy_registration",{name:obj.name});closeModal();alert("تم تسجيل الصيدلية وإضافتها للقائمة.");}
async function loadAdmin(){const {data:{user}}=await sb.auth.getUser();if(!user)return location.href="login.html";const {data:role}=await sb.from("admin_users").select("*").eq("user_id",user.id).maybeSingle();if(!role)return document.body.innerHTML="<main class='container'><section class='card'><h2>غير مصرح</h2></section></main>";document.getElementById("adminEmail").textContent=user.email;loadAdminStats();loadTopQuestions();loadAdminComments();loadAdminPharmacies();}
async function loadAdminStats(){const types=["page_view","drug_search","pharmacy_contact","pharmacy_registration"];let html="";for(const t of types){const {count}=await sb.from("analytics_events").select("*",{count:"exact",head:true}).eq("event_type",t);html+=`<div class="result"><b>${t}</b><h2>${count||0}</h2></div>`}document.getElementById("stats").innerHTML=html}
async function loadTopQuestions(){const {data}=await sb.from("analytics_events").select("metadata").eq("event_type","drug_search").limit(2000);const m={};(data||[]).forEach(x=>{let q=x.metadata?.query;if(q)m[q]=(m[q]||0)+1});const arr=Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,15);document.getElementById("topQuestions").innerHTML=arr.map(x=>`<div class="result">${escapeHtml(x[0])} <b>(${x[1]})</b></div>`).join("")||"<p>لا توجد بيانات بعد.</p>"}
async function loadAdminComments(){const {data}=await sb.from("patient_comments").select("*").order("created_at",{ascending:false}).limit(50);document.getElementById("adminComments").innerHTML=(data||[]).map(x=>`<div class="result"><b>${escapeHtml(x.comment)}</b>${x.reply?`<p>الرد: ${escapeHtml(x.reply)}</p>`:`<textarea id="rep-${x.id}" placeholder="اكتب الرد"></textarea><button onclick="replyComment('${x.id}')">حفظ الرد</button>`}</div>`).join("")}
async function async function replyComment(id) {
    const input = document.getElementById("rep-" + id);

    if (!input) {
        alert("تعذر العثور على خانة الرد.");
        return;
    }

    const text = input.value.trim();

    if (!text) {
        alert("اكتب الرد أولاً.");
        return;
    }

    const { error } = await sb
        .from("patient_comments")
        .update({ reply: text })
        .eq("id", id);

    if (error) {
        console.error(error);
        alert("تعذر حفظ الرد:\n" + error.message);
        return;
    }

    await loadAdminComments();

    alert("تم حفظ الرد بنجاح.");
}
async function loadAdminPharmacies(){const {data}=await sb.from("pharmacies").select("*").order("created_at",{ascending:false});document.getElementById("pharmacies").innerHTML=(data||[]).map(p=>`<div class="result"><b>${escapeHtml(p.name)}</b><p>${escapeHtml(p.address||"")} · ${escapeHtml(p.phone)}</p></div>`).join("")}
function openModal(html){document.getElementById("modalContent").innerHTML=html;document.getElementById("modal").classList.remove("hidden")}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
function showError(x){document.getElementById("results").classList.remove("hidden");document.getElementById("results").innerHTML="<p>تعذر الاتصال بقاعدة البيانات. تحقق من إعداد Supabase.</p><small>"+escapeHtml(x)+"</small>"}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
document.addEventListener("DOMContentLoaded",()=>{track("page_view");loadComments();});
