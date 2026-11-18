import('./workspace.js').catch(error=>{
  console.error(error);
  const message=document.createElement('p');
  message.className='noscript';
  message.setAttribute('role','alert');
  message.textContent='Vaccino açılamadı. Platformu yerel sunucu üzerinden açıp sayfayı yenileyin.';
  document.querySelector('.app-shell').before(message);
});
