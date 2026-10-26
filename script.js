'use strict';
const KEY='ruang-rasa.entries.v1';
const THEME_KEY='ruang-rasa.theme.v1';
const moods=[{id:'happy',emoji:'😄',label:'Bahagia',color:'#fae7b4'},{id:'good',emoji:'🙂',label:'Senang',color:'#edc4d1'},{id:'neutral',emoji:'😐',label:'Biasa saja',color:'#e5dfcf'},{id:'sad',emoji:'😔',label:'Sedih',color:'#d9cee3'},{id:'angry',emoji:'😤',label:'Kesal',color:'#efc4b7'}];
const $=id=>document.getElementById(id);
const localDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
let entries=[],selected=null,editing=null,pendingDelete=null,storageAvailable=true;
$('date').value=localDate();$('date').max=localDate();
for(const mood of moods){const button=document.createElement('button');button.type='button';button.className='mood';button.style.setProperty('--tint',mood.color);button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',mood.label);button.innerHTML=`<span aria-hidden="true"><img src="assets/mood-${mood.id}.svg" width="62" height="62" alt=""></span><small>${mood.label}</small>`;button.addEventListener('click',()=>{selectMood(mood.id);showMoodPopup(mood.id);});$('moods').append(button);}
function selectMood(id){selected=id;if(id)applyTheme(id);[...$('moods').children].forEach((b,i)=>b.setAttribute('aria-pressed',String(moods[i].id===id)));}
async function api(path,options={}){const response=await fetch('/api'+path,{...options,headers:{'Content-Type':'application/json'}});if(!response.ok)throw Error('Server tidak dapat menyimpan catatan.');return response.status===204?null:response.json();}
async function persist(next){try{const removed=entries.filter(old=>!next.some(e=>e.id===old.id));for(const old of removed)await api('/entries/'+old.id,{method:'DELETE'});for(const entry of next){const old=entries.find(e=>e.id===entry.id);if(!old||JSON.stringify(old)!==JSON.stringify(entry))await api('/entries/'+entry.id,{method:'PUT',body:JSON.stringify(entry)});}entries=await api('/entries');return true;}catch{$('status').textContent='Catatan belum tersimpan. Periksa koneksi ke server.';return false;}}
function entryId(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=crypto.getRandomValues(new Uint8Array(1))[0]&15;return(c==='x'?r:(r&3)|8).toString(16);});}
function resetForm(){$('journal-form').reset();$('date').value=localDate();$('count').textContent='0';selectMood(null);editing=null;$('save').textContent='Simpan catatan ↗';$('cancel').hidden=true;}
function render(){renderCalendar();const visible=entries.filter(e=>!$('filter').value||e.date===$('filter').value).sort((a,b)=>b.date.localeCompare(a.date)||(b.updated||0)-(a.updated||0));$('total').textContent=`${entries.length} CATATAN`;$('entries').replaceChildren();if(!visible.length){const empty=document.createElement('div');empty.className='empty';empty.innerHTML=`<span class="empty-rule" aria-hidden="true"></span><h3>${$('filter').value?'Belum ada cerita di tanggal ini':'Belum ada catatan.'}</h3><p>Setelah disimpan, mood dan catatanmu akan muncul di sini.</p>`;$('entries').append(empty);return;}for(const entry of visible){const mood=moods.find(m=>m.id===entry.mood);const card=document.createElement('article');card.className='entry';card.style.setProperty('--tint',mood.color);const emoji=document.createElement('div');emoji.className='entry-emoji';emoji.innerHTML=`<img src="assets/mood-${mood.id}.svg" width="43" height="43" alt="">`;emoji.setAttribute('aria-hidden','true');const body=document.createElement('div');body.className='entry-body';const title=document.createElement('h3');title.textContent=mood.label;const date=document.createElement('time');date.dateTime=entry.date;date.textContent=new Date(entry.date+'T12:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});const note=document.createElement('p');note.textContent=entry.note||'Hari ini, cukup mencatat rasa.';body.append(title,date,note);const actions=document.createElement('div');actions.className='entry-actions';const edit=document.createElement('button');edit.textContent='Edit';edit.setAttribute('aria-label',`Edit catatan ${date.textContent}`);edit.onclick=()=>{editing=entry.id;selectMood(entry.mood);$('note').value=entry.note;$('count').textContent=entry.note.length;$('date').value=entry.date;$('save').textContent='Simpan perubahan';$('cancel').hidden=false;$('status').textContent='Sedang mengedit catatan.';$('journal-form').scrollIntoView({behavior:'smooth',block:'center'});$('note').focus({preventScroll:true});};const remove=document.createElement('button');remove.textContent='Hapus';remove.setAttribute('aria-label',`Hapus catatan ${date.textContent}`);remove.onclick=()=>{pendingDelete=entry.id;$('delete-dialog').showModal();};actions.append(edit,remove);card.append(emoji,body,actions);$('entries').append(card);}}
$('journal-form').addEventListener('submit',async e=>{e.preventDefault();if(!selected){$('status').textContent='Pilih suasana hatimu terlebih dahulu.';$('moods').querySelector('button').focus();return;}const entry={id:editing||entryId(),date:$('date').value,mood:selected,note:$('note').value.trim(),updated:Date.now()};const next=editing?entries.map(old=>old.id===editing?entry:old):[...entries,entry];if(await persist(next)){resetForm();$('filter').value='';render();$('status').textContent='Catatan tersimpan.';}});
$('note').addEventListener('input',()=>{$('count').textContent=$('note').value.length;});$('cancel').onclick=()=>{resetForm();$('status').textContent='Edit dibatalkan.';};$('filter').onchange=render;$('reset').onclick=()=>{$('filter').value='';render();};$('keep').onclick=()=>{$('delete-dialog').close();pendingDelete=null;};$('confirm-delete').onclick=async()=>{if(pendingDelete&&await persist(entries.filter(e=>e.id!==pendingDelete))){if(editing===pendingDelete)resetForm();render();$('status').textContent='Catatan berhasil dihapus.';}$('delete-dialog').close();pendingDelete=null;};window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null)location.reload();});render();

function renderCalendar(){
 const now=new Date(),year=now.getFullYear(),month=now.getMonth(),prefix=`${year}-${String(month+1).padStart(2,'0')}-`;
 $('current-year').textContent=year;
 $('today-weekday').textContent=now.toLocaleDateString('id-ID',{weekday:'long'});
 $('today-number').textContent=String(now.getDate()).padStart(2,'0');
 $('today-month').textContent=now.toLocaleDateString('id-ID',{month:'long',year:'numeric'});
 $('calendar-title').textContent=now.toLocaleDateString('id-ID',{month:'long',year:'numeric'});
 const monthEntries=entries.filter(e=>e.date.startsWith(prefix));
 const byDate=new Map();
 for(const entry of [...monthEntries].sort((a,b)=>(a.updated||0)-(b.updated||0)))byDate.set(entry.date,entry);
 $('calendar').replaceChildren();
 const offset=(new Date(year,month,1).getDay()+6)%7;
 for(let i=0;i<offset;i++)$('calendar').append(document.createElement('span'));
 for(let day=1;day<=new Date(year,month+1,0).getDate();day++){
  const date=prefix+String(day).padStart(2,'0'),entry=byDate.get(date),mood=entry&&moods.find(m=>m.id===entry.mood);
  const b=document.createElement('button');b.type='button';b.className='calendar-day';if(mood){b.innerHTML=`<img src="assets/mood-${mood.id}.svg" width="25" height="25" alt="">`;}else b.textContent=day;
  b.classList.toggle('today',date===localDate());b.classList.toggle('has-mood',!!mood);b.classList.toggle('selected',$('filter').value===date);
  b.setAttribute('aria-label',`${day} ${$('calendar-title').textContent}${mood?', '+mood.label:''}`);b.setAttribute('aria-pressed',String($('filter').value===date));
  if(date===localDate())b.setAttribute('aria-current','date');
  b.onclick=()=>{$('filter').value=date;render();$('history').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});};
  $('calendar').append(b);
 }
 $('month-count').textContent=`${byDate.size} hari tercatat`;
 const counts=moods.map(m=>({mood:m,count:[...byDate.values()].filter(e=>e.mood===m.id).length})).sort((a,b)=>b.count-a.count);
 const top=counts.filter(c=>c.count===counts[0].count);
 $('mood-summary').textContent=byDate.size?(top.length>1?'Rasa yang beragam.':`${top[0].mood.emoji} ${top[0].mood.label}`):'Belum ada mood.';
 $('summary-detail').textContent=byDate.size?`${byDate.size} hari sudah kamu catat bulan ini. Kalender menampilkan mood terakhir setiap hari.`:'Mood yang kamu simpan akan muncul di kalender.';
}

function applyTheme(id,save=true){
 if(!moods.some(m=>m.id===id))return;
 document.documentElement.setAttribute('data-mood-theme',id);
 if(save){try{localStorage.setItem(THEME_KEY,id);}catch{}}
}
try{applyTheme(localStorage.getItem(THEME_KEY),false);}catch{}

function showMoodPopup(id){
 const mood=moods.find(m=>m.id===id);if(!mood)return;
 const messages={happy:'Ada hal menyenangkan hari ini? Simpan ceritanya.',good:'Apa yang membuatmu merasa senang hari ini?',neutral:'Hari yang biasa juga boleh punya cerita.',sad:'Kalau ingin bercerita, kamu bisa menuliskannya di sini.',angry:'Lagi kesal? Ambil jeda sebentar, lalu ceritakan penyebabnya.'};
 const popup=$('mood-popup');popup.setAttribute('data-mood',id);
 $('popup-character').src=`assets/mood-${id}.svg`;
 $('popup-character').alt=`Karakter mood ${mood.label.toLowerCase()}`;
 $('popup-title').textContent=mood.label;
 $('popup-description').textContent=messages[id];
 if(!popup.open)popup.showModal();
}
$('popup-close').onclick=()=>{$('mood-popup').close();};
$('popup-continue').onclick=()=>{$('mood-popup').close();$('note').focus({preventScroll:true});};
$('mood-popup').addEventListener('click',event=>{if(event.target!==$('mood-popup'))return;const box=$('mood-popup').getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)$('mood-popup').close();});


api('/entries').then(data=>{entries=data;render();}).catch(()=>{$('status').textContent='Database belum dapat diakses. Muat ulang halaman.';});
