// @ts-check

// Shared interactions for slide decks. Tab selection is stored in session storage
// so that it persists across page loads.

/**
 * @type {Record<string, HTMLElement[]>}
 */
let sd_id_to_elements = {};
const storageKeyPrefix = "sphinx-design-tab-id-";

/**
 * Create a key for a tab element.
 * @param {HTMLElement} el - The tab element.
 * @returns {[string, string, string] | null} - The key.
 *
 */
function create_key(el) {
  let syncId = el.getAttribute("data-sync-id");
  let syncGroup = el.getAttribute("data-sync-group");
  if (!syncId || !syncGroup) return null;
  return [syncGroup, syncId, syncGroup + "--" + syncId];
}

/**
 * Initialize the tab selection.
 *
 */
function ready() {
  // Find all tabs with sync data

  /** @type {string[]} */
  let groups = [];

  document.querySelectorAll(".sd-tab-label").forEach((label) => {
    if (label instanceof HTMLElement) {
      let data = create_key(label);
      if (data) {
        let [group, id, key] = data;

        // add click event listener
        // @ts-ignore
        label.onclick = onSDLabelClick;

        // store map of key to elements
        if (!sd_id_to_elements[key]) {
          sd_id_to_elements[key] = [];
        }
        sd_id_to_elements[key].push(label);

        if (groups.indexOf(group) === -1) {
          groups.push(group);
          // Check if a specific tab has been selected via URL parameter
          const tabParam = new URLSearchParams(window.location.search).get(
            group
          );
          if (tabParam) {
            console.log(
              "sphinx-design: Selecting tab id for group '" +
                group +
                "' from URL parameter: " +
                tabParam
            );
            window.sessionStorage.setItem(storageKeyPrefix + group, tabParam);
          }
        }

        // Check is a specific tab has been selected previously
        let previousId = window.sessionStorage.getItem(
          storageKeyPrefix + group
        );
        if (previousId === id) {
          // console.log(
          //   "sphinx-design: Selecting tab from session storage: " + id
          // );
          // @ts-ignore
          label.previousElementSibling.checked = true;
        }
      }
    }
  });

  initialize_image_viewer();
}

/**
 *  Activate other tabs with the same sync id.
 *
 * @this {HTMLElement} - The element that was clicked.
 */
function onSDLabelClick() {
  let data = create_key(this);
  if (!data) return;
  let [group, id, key] = data;
  for (const label of sd_id_to_elements[key]) {
    if (label === this) continue;
    // @ts-ignore
    label.previousElementSibling.checked = true;
  }
  window.sessionStorage.setItem(storageKeyPrefix + group, id);
}

const imageZoomStep = 0.25;
const imageZoomMin = 0.5;
const imageZoomMax = 4;

/**
 * Create an icon button for the image viewer toolbar.
 *
 * @param {string} label - Accessible label and tooltip.
 * @param {string} symbol - Visible button symbol.
 * @returns {HTMLButtonElement}
 */
function create_image_viewer_button(label, symbol) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "image-viewer__button";
  button.setAttribute("aria-label", label);
  button.title = label;
  button.textContent = symbol;
  return button;
}

/**
 * Add a zoomable, scrollable overlay to Reveal slide images.
 */
function initialize_image_viewer() {
  const slideImages = Array.from(
    document.querySelectorAll(
      ".reveal .slides img:not([data-no-image-viewer])"
    )
  ).filter((image) => image instanceof HTMLImageElement);

  if (slideImages.length === 0) return;

  const viewer = document.createElement("div");
  viewer.className = "image-viewer";
  viewer.hidden = true;
  viewer.tabIndex = -1;
  viewer.setAttribute("role", "dialog");
  viewer.setAttribute("aria-modal", "true");
  viewer.setAttribute("aria-label", "Image viewer");

  const toolbar = document.createElement("div");
  toolbar.className = "image-viewer__toolbar";

  const zoomOutButton = create_image_viewer_button(
    "Zoom out",
    "\u2212"
  );
  const resetButton = create_image_viewer_button("Reset zoom", "100%");
  resetButton.classList.add("image-viewer__button--reset");
  resetButton.setAttribute("aria-live", "polite");
  const zoomInButton = create_image_viewer_button("Zoom in", "+");
  const closeButton = create_image_viewer_button(
    "Close image viewer",
    "\u00d7"
  );

  toolbar.append(
    zoomOutButton,
    resetButton,
    zoomInButton,
    closeButton
  );

  const stage = document.createElement("div");
  stage.className = "image-viewer__stage";
  const canvas = document.createElement("div");
  canvas.className = "image-viewer__canvas";
  const viewerImage = document.createElement("img");
  viewerImage.className = "image-viewer__image";
  viewerImage.draggable = false;
  canvas.append(viewerImage);
  stage.append(canvas);
  viewer.append(toolbar, stage);
  document.body.append(viewer);

  /** @type {HTMLImageElement | null} */
  let sourceImage = null;
  let zoom = 1;
  let fitScale = 1;
  let activePointerId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartScrollLeft = 0;
  let dragStartScrollTop = 0;

  function get_image_dimensions() {
    const sourceRect = sourceImage
      ? sourceImage.getBoundingClientRect()
      : { width: 1, height: 1 };
    return {
      width: viewerImage.naturalWidth || sourceRect.width || 1,
      height: viewerImage.naturalHeight || sourceRect.height || 1,
    };
  }

  function calculate_fit_scale() {
    const dimensions = get_image_dimensions();
    const availableWidth = Math.max(stage.clientWidth - 48, 1);
    const availableHeight = Math.max(stage.clientHeight - 48, 1);
    return Math.min(
      availableWidth / dimensions.width,
      availableHeight / dimensions.height
    );
  }

  /**
   * @param {boolean} preserveCenter - Keep the same point centered while zooming.
   */
  function render_zoom(preserveCenter) {
    const centerX = preserveCenter
      ? (stage.scrollLeft + stage.clientWidth / 2) / stage.scrollWidth
      : 0.5;
    const centerY = preserveCenter
      ? (stage.scrollTop + stage.clientHeight / 2) / stage.scrollHeight
      : 0.5;
    const dimensions = get_image_dimensions();

    viewerImage.style.width = `${Math.max(
      1,
      Math.round(dimensions.width * fitScale * zoom)
    )}px`;
    viewerImage.style.height = "auto";
    const zoomPercent = Math.round(zoom * 100);
    resetButton.textContent = `${zoomPercent}%`;
    resetButton.setAttribute("aria-label", `Reset zoom (${zoomPercent}%)`);
    resetButton.title = `Reset zoom (${zoomPercent}%)`;
    zoomOutButton.disabled = zoom <= imageZoomMin;
    zoomInButton.disabled = zoom >= imageZoomMax;

    window.requestAnimationFrame(() => {
      stage.scrollLeft = Math.max(
        0,
        centerX * stage.scrollWidth - stage.clientWidth / 2
      );
      stage.scrollTop = Math.max(
        0,
        centerY * stage.scrollHeight - stage.clientHeight / 2
      );
      const canPan = stage.scrollWidth > stage.clientWidth + 1 ||
        stage.scrollHeight > stage.clientHeight + 1;
      stage.classList.toggle("is-pannable", canPan);
    });
  }

  function reset_zoom() {
    zoom = 1;
    fitScale = calculate_fit_scale();
    render_zoom(false);
  }

  /**
   * @param {number} direction - Positive to zoom in, negative to zoom out.
   */
  function change_zoom(direction) {
    const nextZoom = Math.min(
      imageZoomMax,
      Math.max(imageZoomMin, zoom + direction * imageZoomStep)
    );
    if (nextZoom === zoom) return;
    zoom = nextZoom;
    render_zoom(true);
  }

  function close_image_viewer() {
    if (viewer.hidden) return;
    activePointerId = null;
    stage.classList.remove("is-pannable", "is-dragging");
    viewer.hidden = true;
    document.body.classList.remove("image-viewer-open");
    viewerImage.removeAttribute("src");
    if (sourceImage && sourceImage.isConnected) sourceImage.focus();
    sourceImage = null;
  }

  /**
   * @param {HTMLImageElement} image - Slide image to display.
   */
  function open_image_viewer(image) {
    sourceImage = image;
    viewerImage.alt = image.alt || "Enlarged slide image";
    viewerImage.src = image.currentSrc || image.src;
    viewer.hidden = false;
    document.body.classList.add("image-viewer-open");

    if (viewerImage.complete) {
      reset_zoom();
    } else {
      viewerImage.addEventListener("load", reset_zoom, { once: true });
    }
    closeButton.focus();
  }

  zoomOutButton.addEventListener("click", () => change_zoom(-1));
  zoomInButton.addEventListener("click", () => change_zoom(1));
  resetButton.addEventListener("click", reset_zoom);
  closeButton.addEventListener("click", close_image_viewer);

  stage.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !stage.classList.contains("is-pannable")) {
      return;
    }
    activePointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragStartScrollLeft = stage.scrollLeft;
    dragStartScrollTop = stage.scrollTop;
    stage.setPointerCapture(event.pointerId);
    stage.classList.add("is-dragging");
    event.preventDefault();
  });

  stage.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointerId) return;
    stage.scrollLeft = dragStartScrollLeft - (event.clientX - dragStartX);
    stage.scrollTop = dragStartScrollTop - (event.clientY - dragStartY);
    event.preventDefault();
  });

  function finish_drag(event) {
    if (event.pointerId !== activePointerId) return;
    if (
      event.type !== "lostpointercapture" &&
      stage.hasPointerCapture(event.pointerId)
    ) {
      stage.releasePointerCapture(event.pointerId);
    }
    activePointerId = null;
    stage.classList.remove("is-dragging");
  }

  stage.addEventListener("pointerup", finish_drag);
  stage.addEventListener("pointercancel", finish_drag);
  stage.addEventListener("lostpointercapture", finish_drag);

  slideImages.forEach((image) => {
    if (!image.hasAttribute("tabindex")) image.tabIndex = 0;
    if (!image.hasAttribute("role")) image.setAttribute("role", "button");
    if (!image.hasAttribute("aria-label")) {
      const description = image.alt || "slide image";
      image.setAttribute("aria-label", `Open image viewer: ${description}`);
    }
    if (!image.hasAttribute("title")) image.title = "Open image viewer";
  });

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (
        !(target instanceof HTMLImageElement) ||
        !target.matches(".reveal .slides img:not([data-no-image-viewer])")
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      open_image_viewer(target);
    },
    true
  );

  window.addEventListener(
    "keydown",
    (event) => {
      const target = event.target;

      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (viewer.hidden) {
        if (
          target instanceof HTMLImageElement &&
          target.matches(
            ".reveal .slides img:not([data-no-image-viewer])"
          ) &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          event.stopPropagation();
          open_image_viewer(target);
        }
        return;
      }

      if (event.key === "Escape") {
        close_image_viewer();
      } else if (event.key === "+" || event.key === "=") {
        change_zoom(1);
      } else if (event.key === "-" || event.key === "_") {
        change_zoom(-1);
      } else if (event.key === "0") {
        reset_zoom();
      } else if (event.key === "ArrowLeft") {
        stage.scrollLeft -= Math.max(60, stage.clientWidth * 0.1);
      } else if (event.key === "ArrowRight") {
        stage.scrollLeft += Math.max(60, stage.clientWidth * 0.1);
      } else if (event.key === "ArrowUp") {
        stage.scrollTop -= Math.max(60, stage.clientHeight * 0.1);
      } else if (event.key === "ArrowDown") {
        stage.scrollTop += Math.max(60, stage.clientHeight * 0.1);
      } else if (event.key === "PageUp") {
        stage.scrollTop -= stage.clientHeight * 0.8;
      } else if (event.key === "PageDown" || event.key === " ") {
        stage.scrollTop += stage.clientHeight * 0.8;
      } else if (event.key === "Home") {
        stage.scrollTop = 0;
      } else if (event.key === "End") {
        stage.scrollTop = stage.scrollHeight;
      } else if (event.key === "Tab") {
        const buttons = [
          zoomOutButton,
          zoomInButton,
          resetButton,
          closeButton,
        ].filter((button) => !button.disabled);
        const currentIndex = buttons.indexOf(document.activeElement);
        const direction = event.shiftKey ? -1 : 1;
        const nextIndex = currentIndex === -1
          ? (event.shiftKey ? buttons.length - 1 : 0)
          : (currentIndex + direction + buttons.length) % buttons.length;
        buttons[nextIndex].focus();
      } else if (event.key === "n" || event.key === "N" ||
                 event.key === "p" || event.key === "P") {
        // Reveal uses these keys for navigation; keep the viewer modal instead.
      } else {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    },
    true
  );

  window.addEventListener("resize", () => {
    if (!viewer.hidden) reset_zoom();
  });
  window.addEventListener("hashchange", close_image_viewer);
}

document.addEventListener("DOMContentLoaded", ready, false);
