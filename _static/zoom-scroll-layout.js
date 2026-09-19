(() => {
  const root = document.documentElement;
  root.dataset.zoomScrollExperiment = "fixed-initial-viewport";
  root.style.setProperty("--zoom-experiment-width", `${window.innerWidth}px`);
  root.style.setProperty("--zoom-experiment-height", `${window.innerHeight}px`);
})();
