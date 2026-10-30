(() => {
 const dialog=document.querySelector('.reading-activity-dialog');
 const open=document.querySelector('[data-open-reading]');
 open?.addEventListener('click',()=>dialog?.showModal());
 document.querySelector('[data-close-reading]')?.addEventListener('click',()=>dialog.close());
 dialog?.addEventListener('close',()=>{window.speechSynthesis?.cancel();open?.focus();});
})();
