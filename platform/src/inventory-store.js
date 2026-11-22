export const inventoryStatuses=['Planlanıyor','Tasarlanıyor','Temin edilecek','Sipariş verildi','Temin edildi','Test ediliyor','Onaylandı'];
export const inventoryCategories=['Mekanik','Elektrik & Elektronik','Sensörler'];
export const inventoryFields=['id','name','category','quantity','description','status','priority','team','estimatedCost','currency','supplier','document','source'];
const inventoryLimit=2000;
const projectContext='../docs/PROJECT_CONTEXT.md';
export const inventoryDocumentPath=path=>path==='../inputs/Vaccino_ATLAS_Web_Sitesi_ve_3B_Model_Promptu.md'?projectContext:path;
const text=(value,max=2000)=>value==null?'':String(value).slice(0,max);
export function validateItem(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Geçersiz kayıt');
 const row=Object.fromEntries(inventoryFields.map(k=>[k,text(input[k],k==='description'?5000:1000)]));
 if(!row.id||row.id.length>100||!row.name.trim())throw Error('Kayıt ID ve parça adı gerekli.');
 if(!inventoryCategories.includes(row.category)||!inventoryStatuses.includes(row.status))throw Error('Geçersiz kategori/durum.');
 row.quantity=input.quantity==null||input.quantity===''?null:text(input.quantity,80);
 if(input.estimatedCost==null||input.estimatedCost==='')row.estimatedCost=null;else{row.estimatedCost=Number(input.estimatedCost);if(!Number.isFinite(row.estimatedCost)||row.estimatedCost<0)throw Error('Maliyet negatif olmayan sayı olmalı.');}
 if(row.document&&!/^https?:\/\//i.test(row.document)&&!row.document.startsWith('../inputs/')&&row.document!==projectContext&&!row.document.startsWith('data/'))throw Error('Belge adresi http(s) veya yerel kaynak yolu olmalı.');
 if(row.currency&&!['TRY','EUR','USD'].includes(row.currency))throw Error('Geçersiz para birimi.');
 return row;
}
export function seedInventory(record){
 const electrical=new Set(['battery','drive','pc','hmi','power','camera','software']);
 const rows=record.parts.filter(p=>!['shell','camera','software'].includes(p.id)).map(p=>validateItem({id:'part-'+p.id,name:p.label,category:electrical.has(p.id)?inventoryCategories[1]:inventoryCategories[0],quantity:p.id==='motor'?'1':null,description:p.desc,status:'Tasarlanıyor',priority:p.id==='motor'?'Yüksek':'Normal',team:electrical.has(p.id)?'Elektrik':'Mekanik',estimatedCost:null,supplier:'',document:projectContext,source:'Gereksinim R01; stok ve tedarik doğrulanmadı.'}));
 for(const r of record.inventory[0].rows.slice(4))rows.push(validateItem({id:r.A,name:r.C,category:'Sensörler',quantity:r.E||null,description:r.D+' · '+r.G,status:r.A==='S01'?'Temin edilecek':'Planlanıyor',priority:['S01','S03','S04','S05'].includes(r.A)?'Yüksek':r.B==='Karara bağlı'?'Koşullu':'Normal',team:r.K,estimatedCost:null,supplier:'',document:r.L||'',source:'Sensör envanteri R01 · '+r.J+'; stok/sipariş bilgisi sağlanmadı.'}));return rows;
}
export function parseCSV(text){
 text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw Error('CSV içinde kapanmamış tırnak.');row.push(cell);if(row.some(Boolean))rows.push(row);if(!rows.length)throw Error('CSV boş.');const headers=rows.shift();if(!['id','name','category','status'].every(k=>headers.includes(k)))throw Error('CSV başlıkları eksik.');
 return rows.map(values=>{if(values.length!==headers.length)throw Error('CSV sütun sayısı uyuşmuyor.');return Object.fromEntries(headers.map((h,i)=>[h,values[i]]));});
}
export function exportCSV(rows){const safe=v=>{let t=v==null?'':String(v);if(/^[=+\-@\t\r]/.test(t))t="'"+t;return '"'+t.replaceAll('"','""')+'"';};return '\uFEFF'+[inventoryFields,...rows.map(r=>inventoryFields.map(k=>r[k]))].map(r=>r.map(safe).join(',')).join('\r\n');}
function validateRows(rows){
 if(!Array.isArray(rows))throw Error('Geçersiz envanter kayıtları.');
 const clean=rows.map(validateItem);
 if(new Set(clean.map(r=>r.id)).size!==clean.length)throw Error('Yinelenen ID var.');
 return clean;
}
function jsonRows(text){
 const doc=JSON.parse(text);
 if(Array.isArray(doc))return doc;
 if(doc?.version!==1)throw Error('Desteklenmeyen envanter sürümü.');
 return doc.records;
}
export function parseImport(text,format){
 const rows=format==='csv'?parseCSV(text):jsonRows(text);
 return validateRows(rows);
}
export function isMissing(row){return !['Temin edildi','Test ediliyor','Onaylandı'].includes(row.status);}
export class InventoryStore{
 constructor(seed,adapter){
  this.adapter=adapter;
  this.rows=seed.map(validateItem);
  this.warning='';
  this.readable=true;
  try{
   this.saved=adapter?.load();
   if(this.saved!=null)this.rows=validateRows(jsonRows(this.saved));
  }catch{
   this.readable=false;
   this.warning='Yerel envanter okunamadı. Başlangıç kayıtları gösteriliyor ve mevcut veriyi korumak için yazma kapalı.';
  }
 }
 save(rows){
  if(!this.readable)throw Error(this.warning);
  // Older releases could save unions above the limit. Let their existing rows be edited.
  if(rows.length>inventoryLimit&&rows.length>this.rows.length)throw Error('Envanter sınırı 2000 kayıt. Mevcut kayıtlar düzenlenebilir, ancak bu işlem yeni kayıt ekliyor.');
  const validated=validateRows(rows);
  const payload=JSON.stringify({version:1,records:validated});
  try{
   if(this.adapter?.load()!==this.saved)throw Error('stale inventory');
  }catch{
   throw Error('Yerel envanter okunamadı veya başka bir sekmede değişti. Sayfayı yenileyip tekrar deneyin.');
  }
  try{
   this.adapter?.save(payload);
  }catch{
   throw Error('Yerel depolamaya yazılamadı. Önceki kayıtlar korundu.');
  }
  this.saved=this.adapter?payload:undefined;
  this.rows=validated;
 }
 update(row){row=validateItem(row);const exists=this.rows.some(r=>r.id===row.id);this.save(exists?this.rows.map(r=>r.id===row.id?row:r):[...this.rows,row]);}
 import(text,format){const imported=parseImport(text,format);const map=new Map(this.rows.map(r=>[r.id,r]));imported.forEach(r=>map.set(r.id,r));this.save([...map.values()]);return imported.length;}
 exportJSON(){return JSON.stringify({version:1,scope:'Yalnızca bu tarayıcı; ortak senkronizasyon yok',records:this.rows},null,2);}
 filter({query='',category='',status='',missing=false}={}){query=query.toLocaleLowerCase('tr');return this.rows.filter(r=>(!category||r.category===category)&&(!status||r.status===status)&&(!missing||isMissing(r))&&Object.values(r).join(' ').toLocaleLowerCase('tr').includes(query));}
}
export function browserInventoryAdapter(){return {load:()=>localStorage.getItem('vaccino.inventory.v1.3'),save:text=>localStorage.setItem('vaccino.inventory.v1.3',text)};}
