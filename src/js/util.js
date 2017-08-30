

function watchWindowState(cb) {
  document.addEventListener('webkitvisibilitychange', () => {
    cb({ visible: !document.webkitHidden });
  }, false);
}
