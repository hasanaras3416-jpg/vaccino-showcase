import {record} from './store.js';
import {InventoryStore,seedInventory,browserInventoryAdapter,exportCSV,inventoryStatuses,inventoryDocumentPath} from './inventory-store.js';
export function initializeInventoryUI(parent){
 const store=new InventoryStore(seedInventory(record),browserInventoryAdapter());
 parent.innerHTML=`<div class="inventory-intro"><p>Başlangıç kayıtları sensör envanteri ve tasarım kararlarından gelir. Stok/sipariş, fiyat ve tedarikçi bilgisi sağlanmadı. Düzenlemeler yalnızca bu tarayıcıda saklanır; ortak senkronizasyon yoktur.</p><output id="inventory-message" aria-live="polite"></output></div><div class="inventory-controls"><label>Ara <input id="inventory-search" type="search" placeholder="Parça, ekip veya açıklama…"></label><label>Kategori <select id="inventory-category"><option value="">Tümü</option><option>Mekanik</option><option>Elektrik & Elektronik</option><option>Sensörler</option></select></label><label>Durum <select id="inventory-status"><option value="">Tümü</option></select></label><label><input type="checkbox" id="inventory-missing"> Eksik / stok teyidi bekleyen</label></div><div class="inventory-actions"><button id="inventory-add">Kayıt ekle</button><button id="inventory-csv">CSV raporu</button><button id="inventory-json">JSON dışa aktar</button><label class="file-import">CSV / JSON içe aktar <input type="file" id="inventory-import" accept=".csv,.json"></label><button id="inventory-print">Yazdır</button><output id="inventory-count"></output></div><p class="muted">Eksik filtresi ihtiyaç/tedarik durumuna göre çalışır; fiziksel stok sayımı değildir. CSV ve yazdırma geçerli filtreyi, JSON tam kaydı kapsar.</p><div class="table-wrap inventory-table" tabindex="0" role="region" aria-label="Envanter kayıtları"><table><thead><tr><th scope="col">Parça</th><th scope="col">Kategori</th><th scope="col">Adet</th><th scope="col">Durum</th><th scope="col">İşlem</th></tr></thead><tbody id="inventory-rows"></tbody></table></div><dialog id="inventory-editor"><form id="inventory-edit-form"><div class="editor-head"><h2>Envanter kaydı</h2><button type="button" id="inventory-cancel" aria-label="Düzenlemeyi kapat">×</button></div><input type="hidden" name="id"><div id="inventory-editor-fields"></div><div class="editor-actions"><button type="submit">Bu tarayıcıya kaydet</button><output id="inventory-edit-message"></output></div></form></dialog>`;
 const $=id=>document.getElementById(id),make=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
 for(const status of inventoryStatuses)$('inventory-status').append(new Option(status,status));
 const fields=[['name','Parça adı','text'],['category','Kategori',['Mekanik','Elektrik & Elektronik','Sensörler']],['quantity','Adet (bilinmiyorsa boş)','text'],['description','Teknik açıklama','textarea'],['status','Durum',inventoryStatuses],['priority','Öncelik',['Yüksek','Normal','Koşullu']],['team','Sorumlu ekip','text'],['estimatedCost','Tahmini maliyet (bilinmiyorsa boş)','number'],['currency','Para birimi',['','TRY','EUR','USD']],['supplier','Tedarikçi (bilinmiyorsa boş)','text'],['document','Teknik belge adresi','text'],['source','Kaynak / doğrulama notu','textarea']];
 for(const [key,label,type] of fields){const node=make('label',label);let input;if(Array.isArray(type)){input=make('select');for(const value of type)input.append(new Option(value||'Belirtilmedi',value));}else input=make(type==='textarea'?'textarea':'input');if(!Array.isArray(type)&&type!=='textarea')input.type=type;if(type==='number'){input.min='0';input.step='any';}input.name=key;input.required=['name','category','status'].includes(key);node.append(input);$('inventory-editor-fields').append(node);}
 let filtered=[];
 function render(){filtered=store.filter({query:$('inventory-search').value,category:$('inventory-category').value,status:$('inventory-status').value,missing:$('inventory-missing').checked});$('inventory-rows').replaceChildren();
  for(const row of filtered){
   const tr=make('tr'),name=make('td'),action=make('td');
   name.append(make('b',row.name));
   const details=make('details'),properties=make('dl');
   details.append(make('summary','Detayları Gör'));
   for(const [label,value] of [
    ['Açıklama',row.description],['Öncelik',row.priority],['Sorumlu ekip',row.team],
    ['Tahmini maliyet',row.estimatedCost==null?'Bilinmiyor':row.estimatedCost+' '+(row.currency||'(para birimi yok)')],
    ['Tedarikçi',row.supplier],['Kaynak',row.source]
   ]) properties.append(make('dt',label),make('dd',value||'Belirtilmedi'));
   details.append(properties);
   if(row.document){
    const path=inventoryDocumentPath(row.document);
    const link=make('a',path==='../docs/PROJECT_CONTEXT.md'?'Proje bağlamı':'Teknik belge');link.href=path;link.target='_blank';link.rel='noopener noreferrer';
    details.append(link);
   }
   name.append(details);
   const button=make('button','Düzenle');button.setAttribute('aria-label',row.name+' kaydını düzenle');button.onclick=()=>edit(row);
   action.append(button);
   tr.append(name,make('td',row.category),make('td',row.quantity??'Bilinmiyor'),make('td',row.status),action);
   $('inventory-rows').append(tr);
  }
  if(!filtered.length){
   const tr=make('tr'), empty=make('td','Filtrelerle eşleşen kayıt bulunamadı.');
   empty.colSpan=5;tr.append(empty);$('inventory-rows').append(tr);
  }
  $('inventory-count').textContent=`${filtered.length} / ${store.rows.length} kayıt`;$('inventory-message').textContent=store.warning||'Yerel kayıt · ortak ekip veritabanı değildir.';
 }
 function edit(row){const form=$('inventory-edit-form');form.reset();form.elements.id.value=row?.id||'local-'+crypto.randomUUID();for(const [key] of fields)form.elements[key].value=row?.[key]??(key==='status'?'Planlanıyor':key==='priority'?'Normal':key==='category'?'Mekanik':'');$('inventory-edit-message').textContent='';$('inventory-editor').showModal();}
 $('inventory-edit-form').onsubmit=event=>{event.preventDefault();try{const data=Object.fromEntries(new FormData(event.target));store.update(data);$('inventory-editor').close();render();}catch(e){$('inventory-edit-message').textContent=e.message;}};
 $('inventory-cancel').onclick=()=>$('inventory-editor').close();$('inventory-add').onclick=()=>edit();
 function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=make('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 $('inventory-csv').onclick=()=>download(exportCSV(filtered),'vaccino-envanter.csv','text/csv;charset=utf-8');$('inventory-json').onclick=()=>download(store.exportJSON(),'vaccino-envanter.json','application/json');
 $('inventory-import').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>2_000_000)throw Error('Dosya 2 MB sınırını aşıyor.');const count=store.import(await file.text(),file.name.toLowerCase().endsWith('.csv')?'csv':'json');render();$('inventory-message').textContent=`${count} kayıt ID’ye göre birleştirildi. Yalnızca bu tarayıcı.`;}catch(e){$('inventory-message').textContent='İçe aktarma yapılmadı: '+e.message;}event.target.value='';};
 $('inventory-print').onclick=()=>window.print();for(const id of ['inventory-search','inventory-category','inventory-status','inventory-missing'])$(id).addEventListener(id==='inventory-search'?'input':'change',render);render();
 window.vaccinoInventory={store,render,exportCSV:()=>exportCSV(filtered),exportJSON:()=>store.exportJSON(),import(text,format){const count=store.import(text,format);render();return count;},filtered:()=>filtered};
}
