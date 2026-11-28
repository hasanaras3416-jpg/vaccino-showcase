(() => {
  function reportLoadFailure(error) {
    console.error(error);
    const message=document.createElement('p');
    message.className='noscript';
    message.setAttribute('role','alert');
    message.textContent='VACCİNO açılamadı. Platformu yerel sunucu üzerinden açıp sayfayı yenileyin.';
    document.querySelector('.app-shell').before(message);
  }

  const entry=document.currentScript&&new URL(document.currentScript.src);
  if(!entry?.search||!HTMLScriptElement.supports?.('importmap')){
    reportLoadFailure(new Error('VACCİNO sürümü yüklenemedi. Güncel bir tarayıcı ve sürümlü giriş dosyası gerekir.'));
    return;
  }

  // Relative imports resolve to these exact URLs, including transitive and dynamic imports.
  // Keep one version for the whole graph so store.js has a single module instance.
  const modules=[
    'animation-state.js','body-shell.js','camera-motion.js','driver.js',
    'drivetrain-configurator.js','experience-ui.js','experience-world.js',
    'interactive-upgrades.js','inventory-store.js','inventory-ui.js',
    'mechanical-details.js','presentation.js','season.js','simulation-engine.js',
    'simulation-ui.js','store.js','studio.js','track-geometry.js','track-scene.js',
    'vehicle-layout.js','vehicle.js','workshop-scene.js','workspace.js','app-screens.js','rep-parts.js',
    '../data/geometry.js','../data/vaccino-data.js','../vendor/driver-gltf-loader.js'
  ];
  function versioned(url) {
    const resolved=new URL(url,entry);
    resolved.search=entry.search;
    return resolved.href;
  }

  const imports=Object.fromEntries(modules.map(path=>[new URL(path,entry).href,versioned(path)]));
  const importMap=document.createElement('script');
  importMap.type='importmap';
  importMap.textContent=JSON.stringify({imports});
  document.head.append(importMap);

  const three=document.createElement('script');
  three.src=versioned('../vendor/three.js');
  three.onload=()=>{
    Promise.all([
      import(versioned('workspace.js')),
      import(versioned('interactive-upgrades.js')),
      import(versioned('app-screens.js'))
    ]).catch(reportLoadFailure);
  };
  three.onerror=()=>reportLoadFailure(new Error(`3B kitaplığı yüklenemedi: ${three.src}`));
  document.head.append(three);
})();
