(() => {
  "use strict";

  const DATA_URL = "assets/data/videos.json";

  const grid = document.querySelector("[data-video-grid]");
  const empty = document.querySelector("[data-video-empty]");
  const search = document.querySelector("[data-video-search]");
  const count = document.querySelector("[data-video-count]");
  const countLabel = document.querySelector("[data-video-count-label]");

  const dialog = document.querySelector("[data-video-dialog]");
  const closeButton = document.querySelector("[data-video-close]");
  const consent = document.querySelector("[data-video-consent]");
  const player = document.querySelector("[data-video-player]");
  const acceptButton = document.querySelector("[data-video-accept]");
  const externalLink = document.querySelector("[data-video-external]");
  const dialogTitle = document.querySelector("[data-video-dialog-title]");

  if (!grid) return;

  let videos = [];
  let currentVideo = null;


  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function updateCount(number) {
    if (!count) return;

    count.textContent = number;

    if (countLabel) {
      countLabel.textContent = number > 1 ? "vidéos" : "vidéo";
    }
  }


  function cardTemplate(video) {
    const title = escapeHtml(video.title);
    const thumbnail = escapeHtml(video.thumbnail);
    const id = escapeHtml(video.id);

    return `
      <article class="video-card">

        <button
          class="video-card-media"
          type="button"
          data-video-id="${id}"
          aria-label="Lire : ${title}">

          <img
            src="${thumbnail}"
            alt=""
            loading="lazy"
            width="320"
            height="180">

          <span class="video-card-play" aria-hidden="true">▶</span>

        </button>

        <div class="video-card-body">

          <div class="video-card-meta">
            <span class="pill">Vidéo</span>
          </div>

          <h3>${title}</h3>

          <div class="video-card-actions">

            <button
              class="btn btn-text"
              type="button"
              data-video-id="${id}">
              Voir la vidéo
            </button>

            <a
              class="video-youtube-link"
              href="https://www.youtube.com/watch?v=${id}"
              target="_blank"
              rel="noopener noreferrer">
              YouTube ↗
            </a>

          </div>

        </div>

      </article>
    `;
  }


  function render(list) {

    updateCount(list.length);

    if (!list.length) {
      grid.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }

    if (empty) empty.hidden = true;

    grid.innerHTML = list.map(cardTemplate).join("");
  }


  function filterVideos() {
    const query = (search?.value || "").trim().toLocaleLowerCase("fr");

    if (!query) {
      render(videos);
      return;
    }

    render(
      videos.filter(video =>
        (video.title || "").toLocaleLowerCase("fr").includes(query)
      )
    );
  }


  function resetDialog() {
    currentVideo = null;

    if (player) {
      player.innerHTML = "";
      player.hidden = true;
    }

    if (consent) {
      consent.hidden = false;
    }
  }


  function openVideo(video) {
    currentVideo = video;

    if (!dialog) {
      window.open(
        `https://www.youtube.com/watch?v=${video.id}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    if (dialogTitle) {
      dialogTitle.textContent = video.title;
    }

    if (externalLink) {
      externalLink.href =
        `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`;
    }

    if (player) {
      player.innerHTML = "";
      player.hidden = true;
    }

    if (consent) {
      consent.hidden = false;
    }

    dialog.showModal();
  }


  function activatePlayer() {
    if (!currentVideo || !player) return;

    const iframe = document.createElement("iframe");

    iframe.src =
      "https://www.youtube-nocookie.com/embed/" +
      encodeURIComponent(currentVideo.id) +
      "?autoplay=1&rel=0&hl=fr";

    iframe.title = currentVideo.title;
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";

    player.innerHTML = "";
    player.appendChild(iframe);
    player.hidden = false;

    if (consent) {
      consent.hidden = true;
    }
  }


  grid.addEventListener("click", event => {
    const trigger = event.target.closest("[data-video-id]");
    if (!trigger) return;

    const id = trigger.dataset.videoId;
    const video = videos.find(item => item.id === id);

    if (video) {
      openVideo(video);
    }
  });


  search?.addEventListener("input", filterVideos);

  acceptButton?.addEventListener("click", activatePlayer);

  closeButton?.addEventListener("click", () => {
    dialog?.close();
  });

  dialog?.addEventListener("close", resetDialog);

  dialog?.addEventListener("click", event => {
    if (event.target === dialog) {
      dialog.close();
    }
  });


  async function loadVideos() {

    try {

      const response = await fetch(DATA_URL, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      videos = Array.isArray(data.videos) ? data.videos : [];

      if (!videos.length) {
        grid.innerHTML = `
          <div class="video-sync-empty">
            <span class="eyebrow">Synchronisation</span>
            <h2>La vidéothèque sera disponible après la première synchronisation GitHub.</h2>
            <p>
              Le workflow fourni avec cette page récupère les vidéos de la chaîne RELIER
              et enregistre leurs vignettes localement.
            </p>
            <a
              class="btn btn-secondary"
              href="https://www.youtube.com/@reseaurelier"
              target="_blank"
              rel="noopener noreferrer">
              Voir la chaîne YouTube →
            </a>
          </div>
        `;

        updateCount(0);
        return;
      }

      render(videos);

    } catch (error) {

      console.error("Impossible de charger la vidéothèque :", error);

      updateCount(0);

      grid.innerHTML = `
        <div class="video-sync-empty">
          <span class="eyebrow">Vidéothèque</span>
          <h2>Impossible de charger le catalogue local.</h2>
          <p>
            Vous pouvez néanmoins consulter directement la chaîne RELIER sur YouTube.
          </p>
          <a
            class="btn btn-secondary"
            href="https://www.youtube.com/@reseaurelier"
            target="_blank"
            rel="noopener noreferrer">
            Voir la chaîne YouTube →
          </a>
        </div>
      `;
    }
  }


  loadVideos();

})();
