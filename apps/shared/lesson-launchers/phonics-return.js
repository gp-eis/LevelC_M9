(() => {
 const week=location.pathname.match(/week-([1-4])/)?.[1];
 if(!week||new URLSearchParams(location.search).get('from')!=='phonics')return;
 const menu=/\/phonics-week-[1-4]\.html$/.test(location.pathname);
 const back=document.querySelector('.gp-navigation__section');
 if(back){back.href=menu?`../phonics/week-${week}.html`:`phonics-week-${week}.html?from=phonics`;back.setAttribute('aria-label',menu?'Phonics Lesson':'Phonics Games');back.title=back.getAttribute('aria-label');}
 document.querySelector('[data-week-home]')?.setAttribute('href',`../week-${week}.html#card-phonics`);
 document.querySelectorAll('.game-nav-card').forEach(a=>{const url=new URL(a.href);if(url.pathname.includes('/phonics-arcade/'))url.searchParams.set('return',`/LevelC_M9/apps/level-c/games/phonics-week-${week}.html?from=phonics`);else url.searchParams.set('from','phonics');a.href=url.href;});
})();
