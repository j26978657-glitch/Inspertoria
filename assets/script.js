document.addEventListener('DOMContentLoaded',function(){
  var API_BASE='';
  var header=document.getElementById('header');
  var hamburger=document.getElementById('hamburger');
  var menu=document.getElementById('menu');
  var slider=document.getElementById('slider');
  var slides=[];
  var current=0;
  var lightbox=document.getElementById('lightbox');
  var lightboxContent=document.getElementById('lightboxContent');
  var lightboxClose=document.getElementById('lightboxClose');
  var organigramaImage=document.getElementById('organigramaImage');
  var modalOrganigrama=document.getElementById('modalOrganigrama');
  var modalClose=document.getElementById('modalClose');
  var form=document.getElementById('formDenuncia');
  var captchaBox=document.getElementById('captchaBox');
  var captchaInput=document.getElementById('captchaInput');
  var btnAgregarDenunciado=document.getElementById('btnAgregarDenunciado');
  var tablaDenunciados=document.getElementById('tablaDenunciados');
  var anonimaSi=document.getElementById('anonimaSi');
  var anonimaNo=document.getElementById('anonimaNo');

  feather&&feather.replace();
  window.showMessage=function(title,text){
    var m=document.createElement('div');m.className='modal';
    var d=document.createElement('div');d.className='modal-dialog';
    var c=document.createElement('div');c.className='modal-content';
    var h=document.createElement('h3');h.textContent=title;
    var p=document.createElement('p');p.textContent=text;
    var close=document.createElement('button');close.className='modal-close';close.textContent='✕';
    close.addEventListener('click',function(){m.remove()});
    d.appendChild(close);c.appendChild(h);c.appendChild(p);d.appendChild(c);m.appendChild(d);
    m.addEventListener('click',function(e){if(e.target===m){m.remove()}});
    document.body.appendChild(m);
  };
  window.showDialog=function(node){
    var m=document.createElement('div');m.className='modal';
    var d=document.createElement('div');d.className='modal-dialog';
    var c=document.createElement('div');c.className='modal-content';
    var close=document.createElement('button');close.className='modal-close';close.textContent='✕';
    close.addEventListener('click',function(){m.remove()});
    d.appendChild(close);c.appendChild(node);d.appendChild(c);m.appendChild(d);
    m.addEventListener('click',function(e){if(e.target===m){m.remove()}});
    document.body.appendChild(m);
  };
  window.showLoading=function(text){
    var m=document.createElement('div');m.className='modal';
    var d=document.createElement('div');d.className='modal-dialog';
    var c=document.createElement('div');c.className='modal-content';
    var h=document.createElement('h3');h.textContent=text||'Cargando...';
    c.appendChild(h);d.appendChild(c);m.appendChild(d);
    document.body.appendChild(m);
    return function(){try{m.remove()}catch(e){}};
  };

  window.setFormPdfTemplates=function(url1,url2){
    window.FORM_PDF_TEMPLATE_1_URL=url1;
    window.FORM_PDF_TEMPLATE_2_URL=url2;
  };

  function generateFilledPDF(data){
    var PDFLib=window.PDFLib; if(!PDFLib||!PDFLib.PDFDocument) return Promise.reject(new Error('pdf-lib no disponible'));
    var A4={w:595.28,h:841.89};
    var t1=window.FORM_PDF_TEMPLATE_1_URL||data.template1||'';
    var t2=window.FORM_PDF_TEMPLATE_2_URL||data.template2||'';
    function fetchAsUint8(url){ return fetch(url).then(function(r){return r.arrayBuffer()}).then(function(b){return new Uint8Array(b)}) }
    var docPromise=PDFLib.PDFDocument.create();
    return Promise.all([docPromise, t1?fetchAsUint8(t1):Promise.resolve(null), t2?fetchAsUint8(t2):Promise.resolve(null)]).then(function(res){
      var pdf=res[0]; var page1Img=res[1]; var page2Img=res[2];
      var page1=pdf.addPage([A4.w,A4.h]);
      var page2=pdf.addPage([A4.w,A4.h]);
      function embedJpg(bytes){ return bytes?pdf.embedJpg(bytes):Promise.resolve(null) }
      return Promise.all([embedJpg(page1Img), embedJpg(page2Img)]).then(function(imgs){
        var bg1=imgs[0], bg2=imgs[1];
        if(bg1){ page1.drawImage(bg1,{x:0,y:0,width:A4.w,height:A4.h}) }
        if(bg2){ page2.drawImage(bg2,{x:0,y:0,width:A4.w,height:A4.h}) }
        var fontPromise=pdf.embedFont(PDFLib.StandardFonts.Helvetica);
        return fontPromise.then(function(font){
          var size10=10, size11=11, size12=12;
          var color=PDFLib.rgb(0,0,0);
          function text(p,txt,x,y,size,maxW){ p.drawText(String(txt||''),{x:x,y:y,size:size||size11,font:font,color:color,maxWidth:maxW||undefined,lineHeight:size+3}) }
          function mark(p,x,y){ p.drawText('X',{x:x,y:y,size:size12,font:font,color:color}) }
          text(page1,data.apellidos_nombres, 82, A4.h-255, size12, 430);
          text(page1,data.ci, 86, A4.h-296, size12, 180);
          text(page1,data.departamento, 370, A4.h-296, size12, 180);
          text(page1,data.direccion, 82, A4.h-338, size12, 430);
          text(page1,data.correo, 82, A4.h-380, size12, 260);
          text(page1,data.telefono, 370, A4.h-380, size12, 140);
          text(page1,data.denunciado_grado_nombre, 82, A4.h-443, size12, 430);
          text(page1,data.lugar_hecho, 86, A4.h-484, size12, 180);
          text(page1,data.unidad_policial, 370, A4.h-484, size12, 180);
          text(page1,data.cargo_funcion, 86, A4.h-526, size12, 180);
          text(page1,data.departamento_denunciado, 370, A4.h-526, size12, 180);
          if(data.tipo_corrupcion){ mark(page1, 226, A4.h-566) }
          if(data.tipo_negativa){ mark(page1, 520, A4.h-566) }
          text(page1, (data.relacion_hecho||'')+(data.relacion_hecho_2?('\n'+data.relacion_hecho_2):''), 82, A4.h-738, size11, 430);

          text(page2,data.fecha, 86, A4.h-120, size12, 160);
          text(page2,data.hora, 370, A4.h-120, size12, 160);
          text(page2,data.documentacion, 82, A4.h-180, size11, 430);
          text(page2,data.num_fojas, 160, A4.h-246, size12, 120);
          if(String(data.reserva_identidad||'').toLowerCase()==='si'){ mark(page2, 226, A4.h-246) }
          if(String(data.reserva_identidad||'').toLowerCase()==='no'){ mark(page2, 270, A4.h-246) }
          text(page2,data.firma, 82, A4.h-330, size12, 200);
          text(page2,data.fecha_firma, 370, A4.h-330, size12, 160);
          text(page2,data.recibido_por, 82, A4.h-372, size12, 430);

          var attachments=Array.isArray(data.attachments)?data.attachments:[];
          if(attachments.length){
            var page3=pdf.addPage([A4.w,A4.h]);
            text(page3,'Adjuntos:',40,A4.h-60,size12);
            var y=A4.h-90; attachments.forEach(function(att,i){ text(page3,(i+1)+'. '+(att.name||''),40,y,size12,500); y-=18; });
          }
          return pdf.save();
        });
      });
    });
  }


  function onScroll(){
    if(window.scrollY>4){header.classList.add('header-scrolled')}else{header.classList.remove('header-scrolled')}
  }
  window.addEventListener('scroll',onScroll);
  onScroll();

  hamburger.addEventListener('click',function(){
    var open=menu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded',open?'true':'false');
  });

  var adminTabs=document.getElementById('adminTabs');
  if(adminTabs){
    var tabs=Array.prototype.slice.call(adminTabs.querySelectorAll('.admin-tab'));
    var sections=Array.prototype.slice.call(document.querySelectorAll('.admin-section'));
    function activate(section){
      tabs.forEach(function(t){t.classList.remove('active')});
      sections.forEach(function(s){s.classList.remove('active')});
      var tab=tabs.find(function(t){return t.getAttribute('data-section')===section});
      var sec=sections.find(function(s){return s.getAttribute('data-section')===section});
      if(tab){tab.classList.add('active')}
      if(sec){sec.classList.add('active')}
    }
    tabs.forEach(function(t){
      t.addEventListener('click',function(){
        var s=t.getAttribute('data-section');
        activate(s);
      });
    });
    var initial=tabs.find(function(t){return t.classList.contains('active')});
    if(initial){activate(initial.getAttribute('data-section'))}
  }

  if(slider){
    slides=Array.prototype.slice.call(slider.querySelectorAll('.slide'));
    function showSlide(index){
      slides.forEach(function(s){s.classList.remove('active')});
      if(slides[index]){slides[index].classList.add('active')}
    }
    function nextSlide(){
      current=(current+1)%slides.length;showSlide(current);
    }
    setInterval(nextSlide,5000);
    showSlide(current);
    fetch(API_BASE+'/api/carousel').then(function(r){return r.json()}).then(function(items){
      if(!(items&&items.length))return;
      items.slice(0,3).forEach(function(it,idx){
        var slide=slides[idx]; if(!slide)return;
        var imgWrap=slide.querySelector('.slide-image');
        if(imgWrap){
          imgWrap.innerHTML='';
          var img=document.createElement('img');
          img.src=it.image;img.alt='Carrusel '+(idx+1);
          img.style.width='100%';img.style.height='100%';img.style.objectFit='cover';
          imgWrap.appendChild(img);
        }
      });
    }).catch(function(){})
  }

  var adminDenTable=document.getElementById('adminDenTable');
  var adminDenFrom=document.getElementById('adminDenFrom');
  var adminDenTo=document.getElementById('adminDenTo');
  var adminDenSearch=document.getElementById('adminDenSearch');
  var adminDenDownloadAll=document.getElementById('adminDenDownloadAll');
  function renderAdminDenuncias(){
    if(!adminDenTable)return;
    var tbody=adminDenTable.querySelector('tbody');
    var url=API_BASE+'/api/denuncias';
    var params=[];
    if(adminDenFrom&&adminDenFrom.value)params.push('from='+adminDenFrom.value);
    if(adminDenTo&&adminDenTo.value)params.push('to='+adminDenTo.value);
    if(params.length)url+='?'+params.join('&');
    var stop=showLoading('Cargando denuncias...');
    fetch(url).then(function(r){return r.ok ? r.json().catch(function(){return []}) : []}).then(function(items){
      items=Array.isArray(items)?items:[];
      tbody.innerHTML=items.map(function(d){
        return '<tr><td>'+(d.fecha||'')+'</td><td>'+(d.hora||'')+'</td>'+
          '<td style="display:flex;gap:8px">'
          +'<button class="btn ghost" data-id="'+d.id+'" data-action="view">Ver</button>'
          +'<button class="btn primary" data-id="'+d.id+'" data-action="pdf">PDF</button>'
          +'</td></tr>';
      }).join('');
      Array.prototype.slice.call(tbody.querySelectorAll('button[data-id]')).forEach(function(btn){
        btn.addEventListener('click',function(){
          var id=parseInt(btn.getAttribute('data-id'),10);
          var action=btn.getAttribute('data-action');
          fetch(API_BASE+'/api/denuncias/'+id).then(function(r){return r.json()}).then(function(it){
            if(action==='view'){
              var box=document.createElement('div');
              var img=document.createElement('img');
              img.src=it.image||'';img.style.maxWidth='800px';img.style.width='100%';
              box.appendChild(img);
              if(it.attachments&&it.attachments.length){
                var list=document.createElement('div');
                list.style.marginTop='12px';
                list.innerHTML='<h4>Adjuntos</h4>';
                it.attachments.forEach(function(att){
                  var a=document.createElement('a');a.href=att.data||att.url||'#';a.textContent=att.name||att.nombre_original||'archivo';a.style.display='block';a.style.margin='4px 0';a.setAttribute('download',att.name||'adjunto');list.appendChild(a);
                });
                box.appendChild(list);
              }
              showDialog(box);
            } else if(action==='pdf'){
              if(window.PDFLib&&window.PDFLib.PDFDocument){
                var mapping={
                  apellidos_nombres:(it.data&&it.data.dn_nombrecompleto)||'',
                  ci:(it.data&&it.data.dn_ci)||'',
                  departamento:(it.data&&it.data.dn_departamento)||'',
                  direccion:(it.data&&it.data.dn_direccion)||'',
                  correo:(it.data&&it.data.dn_correo)||'',
                  telefono:(it.data&&it.data.dn_telefono)||'',
                  denunciado_grado_nombre:(it.data&&it.data.dd_grado_nombres)||'',
                  lugar_hecho:(it.data&&it.data.dd_lugar)||'',
                  unidad_policial:(it.data&&it.data.dd_unidad)||'',
                  cargo_funcion:(it.data&&it.data.dd_cargo)||'',
                  departamento_denunciado:(it.data&&it.data.dd_departamento)||'',
                  tipo_corrupcion:(it.data&&it.data.tipo_denuncia)==='corrupcion',
                  tipo_negativa:(it.data&&it.data.tipo_denuncia)==='negativa',
                  relacion_hecho:(it.data&&it.data.descripcion)||'',
                  fecha:(it.data&&it.data.fecha)||'',
                  hora:(it.data&&it.data.hora)||'',
                  documentacion:(it.data&&it.data.adjuntos_descripcion)||'',
                  num_fojas:(it.data&&it.data.num_fojas)||'',
                  reserva_identidad:(it.data&&it.data.reserva_identidad)||'',
                  firma:(it.data&&it.data.firma)||'',
                  fecha_firma:(it.data&&it.data.fecha_firma)||'',
                  recibido_por:(it.data&&it.data.recibido_por)||'',
                  attachments:(it.attachments||[])
                };
                generateFilledPDF(mapping).then(function(bytes){
                  var blob=new Blob([bytes],{type:'application/pdf'});
                  var url=URL.createObjectURL(blob);
                  var a=document.createElement('a');a.href=url;a.download='denuncia-'+it.id+'.pdf';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
                }).catch(function(){showMessage('Error','PDF no disponible')});
              } else {
                showMessage('Error','PDF no disponible');
              }
            }
          });
        });
      });
      stop();
    }).catch(function(){
      if(tbody)tbody.innerHTML='';
      try{stop()}catch(e){}
    });
  }
  if(adminDenTable){renderAdminDenuncias()}
  if(adminDenSearch){adminDenSearch.addEventListener('click',function(){renderAdminDenuncias()})}
  if(adminDenDownloadAll){adminDenDownloadAll.addEventListener('click',function(){
    var url=API_BASE+'/api/denuncias';
    var params=[];
    if(adminDenFrom&&adminDenFrom.value)params.push('from='+adminDenFrom.value);
    if(adminDenTo&&adminDenTo.value)params.push('to='+adminDenTo.value);
    if(params.length)url+='?'+params.join('&');
    fetch(url).then(function(r){return r.json()}).then(function(items){
      items.forEach(function(it,idx){
        if(it.image){setTimeout(function(){var a=document.createElement('a');a.href=it.image;a.download='denuncia-'+(it.id||idx)+'.png';document.body.appendChild(a);a.click();document.body.removeChild(a);},idx*300);} 
        if(it.attachments&&it.attachments.length){
          it.attachments.forEach(function(att,j){
            if(!att||!att.data)return;
            setTimeout(function(){var b=document.createElement('a');b.href=att.data;b.download=(att.name||('adjunto-'+(j+1)));document.body.appendChild(b);b.click();document.body.removeChild(b);},idx*300+(j+1)*150);
          });
        }
      });
    });
  })}

  var observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){entry.target.classList.add('in-view')}
    })
  },{threshold:0.1});
  Array.prototype.slice.call(document.querySelectorAll('.reveal')).forEach(function(el){observer.observe(el)});

  if(lightbox&&lightboxContent&&lightboxClose){
    var galleryItems=Array.prototype.slice.call(document.querySelectorAll('.gallery-item'));
    var giIndex=0;
    function renderLightbox(){
      if(galleryItems[giIndex]){lightboxContent.textContent=galleryItems[giIndex].textContent}
    }
    function openAt(i){giIndex=i;renderLightbox();lightbox.classList.add('open')}
    galleryItems.forEach(function(item,idx){
      function open(){openAt(idx)}
      item.addEventListener('click',open);
      item.addEventListener('keypress',function(e){if(e.key==='Enter'){open()}});
    });
    lightboxClose.addEventListener('click',function(){lightbox.classList.remove('open')});
    lightbox.addEventListener('click',function(e){if(e.target===lightbox){lightbox.classList.remove('open')}});
    var nextBtn=document.getElementById('lightboxNext');
    var prevBtn=document.getElementById('lightboxPrev');
    if(nextBtn){nextBtn.addEventListener('click',function(){giIndex=(giIndex+1)%galleryItems.length;renderLightbox()})}
    if(prevBtn){prevBtn.addEventListener('click',function(){giIndex=(giIndex-1+galleryItems.length)%galleryItems.length;renderLightbox()})}
  }

  if(organigramaImage&&modalOrganigrama&&modalClose){
    organigramaImage.addEventListener('click',function(){
      modalOrganigrama.setAttribute('aria-hidden','false');
      modalOrganigrama.style.display='flex';
    });
    modalClose.addEventListener('click',function(){
      modalOrganigrama.setAttribute('aria-hidden','true');
      modalOrganigrama.style.display='none';
    });
    modalOrganigrama.addEventListener('click',function(e){
      if(e.target===modalOrganigrama){modalOrganigrama.setAttribute('aria-hidden','true');modalOrganigrama.style.display='none'}
    });
  }

  if(form){
    // Autocompletar fecha y hora
    var fechaEl=document.getElementById('fecha');
    var horaEl=document.getElementById('hora');
    if(fechaEl){
      var d=new Date();
      var yyyy=d.getFullYear();
      var mm=('0'+(d.getMonth()+1)).slice(-2);
      var dd=('0'+d.getDate()).slice(-2);
      fechaEl.value=yyyy+'-'+mm+'-'+dd;
    }
    if(horaEl){
      var d2=new Date();
      var hh=('0'+d2.getHours()).slice(-2);
      var mi=('0'+d2.getMinutes()).slice(-2);
      horaEl.value=hh+':'+mi;
    }

    form.addEventListener('submit',function(e){
      var correo=document.getElementById('dn_correo');
      var descripcion=document.getElementById('descripcion');
      var fecha=document.getElementById('fecha');
      var hora=document.getElementById('hora');
      var tipoSeleccionado=document.querySelector('input[name="tipo_denuncia"]:checked');
      var adjFinal=document.getElementById('adjuntos_final');
      var valid=true;
      [correo,descripcion,fecha,hora].forEach(function(field){
        if(!field)return;field.classList.remove('invalid');
        if(!field.value||field.value.trim()===''){valid=false;field.classList.add('invalid')}
      });
      if(correo&&correo.value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.value)){valid=false;correo.classList.add('invalid')}
      if(!tipoSeleccionado){valid=false;showMessage('Validación','Seleccione un tipo de denuncia')}
      if(adjFinal&&adjFinal.files&&adjFinal.files.length>5){valid=false;showMessage('Validación','Máximo 5 archivos adjuntos')}
      if(!valid){e.preventDefault();return}
      e.preventDefault();
      var stopLoading=showLoading('Enviando denuncia...');
      var files=(adjFinal&&adjFinal.files)?Array.prototype.slice.call(adjFinal.files):[];
      html2canvas(form).then(function(canvas){
        var maxW=1280;var scale=Math.min(1,maxW/canvas.width);
        if(scale<1){var oc=document.createElement('canvas');oc.width=Math.round(canvas.width*scale);oc.height=Math.round(canvas.height*scale);var ctx=oc.getContext('2d');ctx.drawImage(canvas,0,0,oc.width,oc.height);canvas=oc;}
        var img=canvas.toDataURL('image/png');
        function readFile(f){
          return new Promise(function(resolve){
            var r=new FileReader();
            r.onload=function(){resolve({name:f.name||'adjunto',type:f.type||'',data:r.result})};
            r.readAsDataURL(f);
          });
        }
        return Promise.all(files.map(readFile)).then(function(att){
          var fd=new FormData(form);var data={};fd.forEach(function(v,k){
            if(v&&v.name){data[k]=v.name}else{data[k]=v}
          });
          return fetch(API_BASE+'/api/denuncias',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fecha:data.fecha,hora:data.hora,image:img,data:data,attachments:att})});
        });
      }).then(function(){
        stopLoading();
        showMessage('Éxito','Denuncia enviada. Gracias por su reporte.');
        form.reset();
        if(tablaDenunciados){tablaDenunciados.querySelector('tbody').innerHTML=''}
        if(fechaEl){fechaEl.value=''}
        if(horaEl){horaEl.value=''}
      }).catch(function(){
        stopLoading();
        showMessage('Error','No se pudo enviar la denuncia');
      });
    });
  }

  function regenCaptcha(){
    if(captchaBox){
      captchaBox.textContent=(''+Math.floor(1000+Math.random()*8999));
    }
  }
  regenCaptcha();

  if(btnAgregarDenunciado&&tablaDenunciados){
    btnAgregarDenunciado.addEventListener('click',function(){
      var n=document.getElementById('dd_nombres').value.trim();
      var ap=document.getElementById('dd_apaterno').value.trim();
      var am=document.getElementById('dd_amaterno').value.trim();
      if(!n||!ap){showMessage('Validación','Complete al menos nombres y apellido paterno');return}
      var tr=document.createElement('tr');
      tr.innerHTML='<td>'+n+'</td><td>'+ap+'</td><td>'+am+'</td><td><button type="button" class="btn ghost">Eliminar</button></td>';
      var tbody=tablaDenunciados.querySelector('tbody');
      tbody.appendChild(tr);
      tr.querySelector('button').addEventListener('click',function(){tr.remove()});
      document.getElementById('dd_nombres').value='';
      document.getElementById('dd_apaterno').value='';
      document.getElementById('dd_amaterno').value='';
    });
  }

  if(anonimaSi||anonimaNo){
    var fields=['dn_nombres','dn_apaterno','dn_amaterno','dn_genero','dn_telefono','dn_ubicacion'];
    function setAnonymous(on){
      fields.forEach(function(id){var el=document.getElementById(id);if(el){el.disabled=on;el.value=''}});
      var correo=document.getElementById('dn_correo');
      if(correo){correo.required=!on}
    }
    if(anonimaSi){anonimaSi.addEventListener('change',function(){if(anonimaSi.checked){setAnonymous(true)}})}
    if(anonimaNo){anonimaNo.addEventListener('change',function(){if(anonimaNo.checked){setAnonymous(false)}})}
    setAnonymous(false);
  }

  // destacar enlace activo en el menú
  var path=location.pathname.replace(/\\/g,'/');
  var links=Array.prototype.slice.call(document.querySelectorAll('.menu a'));
  links.forEach(function(a){
    var href=a.getAttribute('href');
    if(!href)return;
    var resolved=href.startsWith('http')?href:(function(){
      if(href.startsWith('../')){return href.replace('../','/')}
      if(href.startsWith('pages/')){return '/'+href}
      return '/'+href;
    })();
    if(path.endsWith(resolved)){a.classList.add('active')}
  });
});

var modal=document.getElementById('modalOrganigrama');
if(modal){
  modal.style.display='none';
}

  var newsForm=document.getElementById('newsForm');
  var newsList=document.getElementById('newsList');
  function loadNews(){
    if(newsList){
      fetch(API_BASE+'/api/news').then(function(r){return r.json()}).then(function(items){
        newsList.innerHTML='';
        items.forEach(function(it){
          var card=document.createElement('div');
          card.className='news-card';
          var media=document.createElement('div');media.className='news-media';
          if(it.image){var img=document.createElement('img');img.src=it.image;img.alt=it.title;img.style.maxWidth='100%';img.style.maxHeight='160px';media.appendChild(img)}else{media.textContent='[IMAGEN_NOTICIA]'}
          var body=document.createElement('div');body.className='news-body';
          var t=document.createElement('div');t.className='news-title';t.textContent=it.title;
          var d=document.createElement('div');d.className='news-desc';d.textContent=it.summary;
          var a=document.createElement('a');a.className='btn primary';a.href='noticia.html?id='+it.id;a.textContent='Leer';
          body.appendChild(t);body.appendChild(d);body.appendChild(a);
          card.appendChild(media);card.appendChild(body);
          newsList.appendChild(card);
        });
      }).catch(function(){})
    }
  }
  loadNews();
  if(newsForm){
    newsForm.addEventListener('submit',function(e){
      e.preventDefault();
      var title=document.getElementById('newsTitle').value.trim();
      var summary=document.getElementById('newsSummary').value.trim();
      var content=document.getElementById('newsContent').value.trim();
      var file=document.getElementById('newsImage').files[0];
      if(!title||!summary||!content){showMessage('Validación','Complete título, resumen y contenido');return}
      function post(imageData){
        fetch(API_BASE+'/api/news',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:title,summary:summary,content:content,image:imageData||''})})
          .then(function(r){return r.json()}).then(function(){newsForm.reset();loadNews();showMessage('Éxito','La noticia fue enviada con éxito')}).catch(function(){showMessage('Error','No se pudo enviar la noticia')});
      }
      if(file){var reader=new FileReader();reader.onload=function(){post(reader.result)};reader.readAsDataURL(file)}else{post('')}
    });
  }

  var homeNewsList=document.getElementById('homeNewsList');
  if(homeNewsList){
    try{
      fetch(API_BASE+'/api/news?limit=4').then(function(r){return r.json()}).then(function(items){
        if(items&&items.length){
          homeNewsList.innerHTML=items.map(function(it){
            var media=it.image?('<div class="news-media"><img src="'+it.image+'" alt="" style="max-width:100%;max-height:140px"></div>'):'<div class="news-media">[IMAGEN_NOTICIA]</div>';
            return '<div class="news-card">'+media+'<div class="news-body"><div class="news-title">'+it.title+'</div><div class="news-desc">'+it.summary+'</div><a class="btn primary" href="pages/noticia.html?id='+it.id+'">Leer</a></div></div>';
          }).join('');
        }
      }).catch(function(){})
    }catch(e){}
  }

  var adminNewsForm=document.getElementById('adminNewsForm');
  var adminNewsTable=document.getElementById('adminNewsTable');
  function renderAdminNews(){
    if(!adminNewsTable)return;
    var tbody=adminNewsTable.querySelector('tbody');
    fetch(API_BASE+'/api/news').then(function(r){return r.json()}).then(function(items){
      tbody.innerHTML=items.map(function(n){
        return '<tr><td>'+n.title+'</td><td>'+n.summary+'</td><td><button class="btn ghost" data-id="'+n.id+'">Eliminar</button></td></tr>';
      }).join('');
      Array.prototype.slice.call(tbody.querySelectorAll('button[data-id]')).forEach(function(btn){
        btn.addEventListener('click',function(){
          var id=parseInt(btn.getAttribute('data-id'),10);
          fetch(API_BASE+'/api/news/'+id,{method:'DELETE'}).then(function(){renderAdminNews()});
        });
      });
    }).catch(function(){tbody.innerHTML='';})
  }
  if(adminNewsTable){renderAdminNews()}
  if(adminNewsForm){
    adminNewsForm.addEventListener('submit',function(e){
      e.preventDefault();
      var t=document.getElementById('adminNewsTitle').value.trim();
      var s=document.getElementById('adminNewsSummary').value.trim();
      var c=document.getElementById('adminNewsContent').value.trim();
      var f=document.getElementById('adminNewsImage').files[0];
      if(!t||!s||!c){showMessage('Validación','Complete título, resumen y contenido');return}
      function save(image){
        fetch(API_BASE+'/api/news',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:t,summary:s,content:c,image:image||''})})
          .then(function(){renderAdminNews();adminNewsForm.reset();showMessage('Éxito','La noticia fue enviada con éxito')})
          .catch(function(){showMessage('Error','No se pudo enviar la noticia')});
      }
      if(f){var reader=new FileReader();reader.onload=function(){save(reader.result)};reader.readAsDataURL(f)}else{save('')}
    });
  }

  function applyIntegridadFromApi(){
    fetch(API_BASE+'/api/integridad/config').then(function(r){return r.json()}).then(function(cfg){
      var size=cfg.size||'16px';
      var color=cfg.color||'#111827';
      var cont=document.getElementById('integridad');
      if(cont){cont.style.setProperty('--int-size',size);cont.style.setProperty('--int-color',color)}
      var adminSize=document.getElementById('adminIntSize');
      var adminColor=document.getElementById('adminIntColor');
      if(adminSize){adminSize.value=size}
      if(adminColor){adminColor.value=color}
    }).catch(function(){})
  }
  applyIntegridadFromApi();
  var adminIntSave=document.getElementById('adminIntSave');
  if(adminIntSave){
    adminIntSave.addEventListener('click',function(){
      var size=document.getElementById('adminIntSize').value;
      var color=document.getElementById('adminIntColor').value;
      fetch(API_BASE+'/api/integridad/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({size:size,color:color})})
        .then(function(){applyIntegridadFromApi()}).catch(function(){alert('Error al guardar configuración')});
    });
  }

  var integridadGrid=document.getElementById('integridadGrid');
  if(integridadGrid){
    fetch(API_BASE+'/api/integridad/cards').then(function(r){return r.json()}).then(function(intItems){
      var arr=(intItems||[]).slice(0,3);
      if(arr.length){
        integridadGrid.classList.add('unified');
        integridadGrid.innerHTML=arr.map(function(it,i){
          var media=(it.text_only||!it.image)?'' : '<div class="int-media"><img src="'+it.image+'" alt="" style="max-width:100%;max-height:120px"></div>';
          var posClass=i===0?'left':(i===1?'middle':'right');
          return '<div class="integridad-card '+posClass+'">'+media+'<h3>'+(it.title||'')+'</h3><div class="int-content">'+(it.content||'')+'</div></div>';
        }).join('');
      }
    }).catch(function(){})
  }

  function applyFooterFromApi(){
    fetch(API_BASE+'/api/footer').then(function(r){return r.json()}).then(function(cfg){
      var phone=cfg.phone||'2 190107';
      var email=cfg.email||'cnt.pdhdlp@policia.gob.bo';
      var address=cfg.address||'Av. 20 de Octubre esq. c/ Lisimaco Gutiérrez #2541';
      var p=document.getElementById('footerPhone');
      var e=document.getElementById('footerEmail');
      var a=document.getElementById('footerAddress');
      if(p){p.textContent=phone}
      if(e){e.textContent=email}
      if(a){a.textContent=address}
      var ap=document.getElementById('adminPhone');
      var ae=document.getElementById('adminEmail');
      var aa=document.getElementById('adminAddress');
      if(ap){ap.value=phone}
      if(ae){ae.value=email}
      if(aa){aa.value=address}
    }).catch(function(){})
  }
  applyFooterFromApi();
  var adminFooterSave=document.getElementById('adminFooterSave');
  if(adminFooterSave){
    adminFooterSave.addEventListener('click',function(){
      var phone=document.getElementById('adminPhone').value;
      var email=document.getElementById('adminEmail').value;
      var address=document.getElementById('adminAddress').value;
      fetch(API_BASE+'/api/footer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:phone,email:email,address:address})})
        .then(function(){applyFooterFromApi()}).catch(function(){alert('Error al guardar contacto')});
    });
  }

  var adminExport=document.getElementById('adminExport');
  var adminImport=document.getElementById('adminImport');
  var adminExportResult=document.getElementById('adminExportResult');
  if(adminExport){
    adminExport.addEventListener('click',function(){
      Promise.all([
        fetch(API_BASE+'/api/news').then(function(r){return r.json()}),
        fetch(API_BASE+'/api/integridad/cards').then(function(r){return r.json()}),
        fetch(API_BASE+'/api/integridad/config').then(function(r){return r.json()}),
        fetch(API_BASE+'/api/footer').then(function(r){return r.json()})
      ]).then(function(res){
        var payload={news_items:res[0],integridad_items:res[1],integridad_cfg:res[2],footer_cfg:res[3]};
        var data=JSON.stringify(payload,null,2);
        var blob=new Blob([data],{type:'application/json'});
        var url=URL.createObjectURL(blob);
        var a=document.createElement('a');a.href=url;a.download='inspector-config.json';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
        if(adminExportResult){adminExportResult.textContent='Exportado'}
      }).catch(function(){if(adminExportResult){adminExportResult.textContent='Error al exportar'}})
    });
  }
  if(adminImport){
    adminImport.addEventListener('change',function(){
      var f=adminImport.files; if(!(f&&f.length))return;
      var reader=new FileReader();
      reader.onload=function(){
        try{
          var cfg=JSON.parse(reader.result);
          var tasks=[];
          (cfg.news_items||[]).forEach(function(n){tasks.push(fetch(API_BASE+'/api/news',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(n)}))});
          (cfg.integridad_items||[]).forEach(function(it){tasks.push(fetch(API_BASE+'/api/integridad/cards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(it)}))});
          if(cfg.integridad_cfg){tasks.push(fetch(API_BASE+'/api/integridad/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(cfg.integridad_cfg)}))}
          if(cfg.footer_cfg){tasks.push(fetch(API_BASE+'/api/footer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(cfg.footer_cfg)}))}
          Promise.all(tasks).then(function(){
            renderAdminNews();
            renderAdminIntItems();
            applyIntegridadFromApi();
            applyFooterFromApi();
            if(adminExportResult){adminExportResult.textContent='Importado'}
          }).catch(function(){if(adminExportResult){adminExportResult.textContent='Error al importar'}})
        }catch(e){if(adminExportResult){adminExportResult.textContent='Error al importar'}}
      };
      reader.readAsText(f[0]);
    });
  }

  var adminIntItemForm=document.getElementById('adminIntItemForm');
  var adminIntItemsTable=document.getElementById('adminIntItemsTable');
  var adminIntItemsHint=document.getElementById('adminIntItemsHint');
  var adminIntItemAdd=document.getElementById('adminIntItemAdd');
  function renderAdminIntItems(){
    if(!adminIntItemsTable)return;
    var tbody=adminIntItemsTable.querySelector('tbody');
    fetch(API_BASE+'/api/integridad/cards').then(function(r){return r.json()}).then(function(arr){
      tbody.innerHTML=arr.map(function(it){
        var tipo=(it.text_only||!it.image)?'Solo texto':'Con imagen';
        return '<tr><td>'+it.title+'</td><td>'+tipo+'</td><td><button class="btn ghost" data-id="'+it.id+'">Eliminar</button></td></tr>';
      }).join('');
      Array.prototype.slice.call(tbody.querySelectorAll('button[data-id]')).forEach(function(btn){
        btn.addEventListener('click',function(){
          var id=parseInt(btn.getAttribute('data-id'),10);
          fetch(API_BASE+'/api/integridad/cards/'+id,{method:'DELETE'}).then(function(){renderAdminIntItems();updateIntItemsLimit()});
        });
      });
    });
  }
  function updateIntItemsLimit(){
    fetch(API_BASE+'/api/integridad/cards').then(function(r){return r.json()}).then(function(arr){
      var count=arr.length;
      if(adminIntItemsHint){adminIntItemsHint.textContent='Máximo 3 fichas ('+count+'/3)'}
      if(adminIntItemAdd){adminIntItemAdd.disabled=count>=3}
    })
  }
  if(adminIntItemsTable){renderAdminIntItems();updateIntItemsLimit()}
  if(adminIntItemForm){
    adminIntItemForm.addEventListener('submit',function(e){
      e.preventDefault();
      fetch(API_BASE+'/api/integridad/cards').then(function(r){return r.json()}).then(function(arr){ if(arr.length>=3){alert('Máximo 3 fichas');return} });
      var title=document.getElementById('adminIntItemTitle').value.trim();
      var content=document.getElementById('adminIntItemContent').value.trim();
      var textOnly=document.getElementById('adminIntItemTextOnly').checked;
      var file=document.getElementById('adminIntItemImage').files[0];
      if(!title||!content){alert('Complete título y contenido');return}
      function add(image){
        fetch(API_BASE+'/api/integridad/cards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:title,content:content,image:image||'',text_only:textOnly})})
          .then(function(){renderAdminIntItems();updateIntItemsLimit();adminIntItemForm.reset();alert('Ficha agregada')})
          .catch(function(){alert('Error al guardar ficha')});
      }
      if(textOnly){add('')}else if(file){var reader=new FileReader();reader.onload=function(){add(reader.result)};reader.readAsDataURL(file)}else{add('')}
    });
  }

  var adminCarouselForm=document.getElementById('adminCarouselForm');
  var adminCarouselTable=document.getElementById('adminCarouselTable');
  function renderAdminCarousel(){
    if(!adminCarouselTable)return;
    var tbody=adminCarouselTable.querySelector('tbody');
    fetch(API_BASE+'/api/carousel').then(function(r){return r.json()}).then(function(items){
      tbody.innerHTML=items.map(function(c){
        var img=c.image?('<img src="'+c.image+'" alt="" style="max-height:40px">'):'[IMAGEN]';
        return '<tr><td>'+c.position+'</td><td>'+img+'</td><td><button class="btn ghost" data-id="'+c.id+'">Eliminar</button></td></tr>';
      }).join('');
      Array.prototype.slice.call(tbody.querySelectorAll('button[data-id]')).forEach(function(btn){
        btn.addEventListener('click',function(){
          var id=parseInt(btn.getAttribute('data-id'),10);
          fetch(API_BASE+'/api/carousel/'+id,{method:'DELETE'}).then(function(){renderAdminCarousel()});
        });
      });
    })
  }
  if(adminCarouselTable){renderAdminCarousel()}
  if(adminCarouselForm){
    adminCarouselForm.addEventListener('submit',function(e){
      e.preventDefault();
      var pos=parseInt(document.getElementById('adminCarouselPosition').value||'0',10);
      var f=document.getElementById('adminCarouselImage').files[0];
      if(!f){alert('Seleccione una imagen');return}
      var reader=new FileReader();
      reader.onload=function(){
        fetch(API_BASE+'/api/carousel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:reader.result,position:pos})})
          .then(function(){adminCarouselForm.reset();renderAdminCarousel();alert('Imagen agregada al carrusel')})
          .catch(function(){alert('Error al guardar carrusel')});
      };
      reader.readAsDataURL(f);
    });
  }

  var adminGalleryForm=document.getElementById('adminGalleryForm');
  var adminGalleryTable=document.getElementById('adminGalleryTable');
  function renderAdminGallery(){
    if(!adminGalleryTable)return;
    var tbody=adminGalleryTable.querySelector('tbody');
    fetch(API_BASE+'/api/gallery').then(function(r){return r.json()}).then(function(items){
      tbody.innerHTML=items.map(function(g){
        var img=g.image?('<img src="'+g.image+'" alt="" style="max-height:40px">'):'[IMAGEN]';
        return '<tr><td>'+g.position+'</td><td>'+img+'</td><td>'+(g.caption||'')+'</td><td><button class="btn ghost" data-id="'+g.id+'">Eliminar</button></td></tr>';
      }).join('');
      Array.prototype.slice.call(tbody.querySelectorAll('button[data-id]')).forEach(function(btn){
        btn.addEventListener('click',function(){
          var id=parseInt(btn.getAttribute('data-id'),10);
          fetch(API_BASE+'/api/gallery/'+id,{method:'DELETE'}).then(function(){renderAdminGallery()});
        });
      });
    })
  }
  if(adminGalleryTable){renderAdminGallery()}
  if(adminGalleryForm){
    adminGalleryForm.addEventListener('submit',function(e){
      e.preventDefault();
      var caption=document.getElementById('adminGalleryCaption').value.trim();
      var position=parseInt(document.getElementById('adminGalleryPosition').value||'0',10);
      var f=document.getElementById('adminGalleryImage').files[0];
      if(!f){alert('Seleccione una imagen');return}
      var reader=new FileReader();
      reader.onload=function(){
        fetch(API_BASE+'/api/gallery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:reader.result,caption:caption,position:position})})
          .then(function(){adminGalleryForm.reset();renderAdminGallery();alert('Imagen de galería agregada')})
          .catch(function(){alert('Error al guardar imagen')});
      };
      reader.readAsDataURL(f);
    });
  }

  var galleryGrid=document.querySelector('.gallery-grid');
  if(galleryGrid){
    fetch(API_BASE+'/api/gallery').then(function(r){return r.json()}).then(function(items){
      if(items&&items.length){
        galleryGrid.innerHTML=items.map(function(g){
          var img='<img src="'+g.image+'" alt="'+(g.caption||'')+'" style="max-width:100%;max-height:160px">';
          return '<div class="gallery-item" tabindex="0">'+img+'</div>';
        }).join('');
      }
    }).catch(function(){})
  }
