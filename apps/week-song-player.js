/* Month 8's weekly-song player, using supplied Month 9 media. */
const level = location.pathname.match(/\/level-([abc])\//i)?.[1]?.toLowerCase();
const requestedWeek = new URLSearchParams(location.search).get('week');
const week = /^[1-4]$/.test(requestedWeek || '') ? Number(requestedWeek) : 1;
const main = document.querySelector('[data-week-song]');

if (main && level) {
  const video = main.querySelector('.week-song-video');
  const shell = main.querySelector('.week-song-video-shell');
  const play = main.querySelector('.week-song-play');
  const assets = new URL(`level-c/assets/video/week-song/`, import.meta.url);
  const source = new URL(`https://pub-aa69c309a877446c857c4f2564279578.r2.dev/month9/20261030/apps/level-c/assets/video/week-song/week-${week}.mp4?v=month9-week-song-v1`);
  const poster = new URL(`week-${week}.jpg?v=month9-week-song-v1`, assets);

  document.title = `Week Song — Level ${level.toUpperCase()} Month 9 Week ${week}`;
  main.querySelector('[data-week-song-heading]').textContent = `Level ${level.toUpperCase()} · Month 9 · Week ${week}`;
  main.querySelector('.week-song-card').setAttribute('aria-label', `Level ${level.toUpperCase()} Week ${week} song video`);
  video.setAttribute('aria-label', `Level ${level.toUpperCase()} Month 9 Week ${week} song`);
  play.setAttribute('aria-label', `Play the Week ${week} song`);
  video.dataset.level = level;
  video.dataset.week = String(week);
  // The initial HTML has no source, so a different week's video never loads first.
  video.poster = poster.href;
  video.setAttribute('data-stream-lesson', 'week-song');
  window.GPStreamMedia.setVideoSource(video, source.href);

  const sync = () => {play.hidden = !video.paused && !video.ended;};
  const size = () => {
    if (video.videoWidth && video.videoHeight) {
      shell.style.setProperty('--song-media-ratio', String(video.videoWidth / video.videoHeight));
    }
  };
  play.addEventListener('click', () => {
    video.play().catch(() => {play.hidden = false;});
  });
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  video.addEventListener('ended', sync);
  video.addEventListener('error', sync);
  video.addEventListener('loadedmetadata', size);
  document.addEventListener('visibilitychange', () => {if (document.hidden) video.pause();});
  window.addEventListener('pagehide', () => video.pause());
  size();
  sync();
}
