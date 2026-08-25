(() => {
  "use strict";

  /* =========================================================
     RELIER — VIDÉOTHÈQUE
     Catalogue local + lecture YouTube après consentement
     ========================================================= */

  const DATA_URL = "assets/data/videos.json";

  /* ---------- Éléments de la page ---------- */

  const grid = document.querySelector("[data-video-grid]");
  const emptyState = document.querySelector("[data-video-empty]");
  const searchInput = document.querySelector("[data-video-search]");
  const countValue = document.querySelector("[data-video-count]");
  const countLabel = document.querySelector("[data-video-count-label]");

  const dialog = document.querySelector("[data-video-dialog]");
  const dialogClose = document.querySelector("[data-video-close]");
  const dialogConsent = document.querySelector("[data-video-consent]");
  const dialogTitle = document.querySelector("[data-video-dialog-title]");
  const player = document.querySelector("[data-video-player]");
  const acceptButton = document.querySelector("[data-video-accept]");
  const externalLink = document.querySelector("[data-video-external]");

  if (!grid) {
    return;
  }

  let videos = [];
  let currentVideo = null;


  /* =========================================================
     OUTILS
     ========================================================= */

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function updateCount(number) {
    if (countValue) {
      countValue.textContent = String(number);
    }

    if (countLabel) {
      countLabel.textContent = number > 1 ? "vidéos" : "vidéo";
    }
  }


  function youtubeWatchUrl(videoId) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  }


  function youtubeEmbedUrl(videoId) {
    return (
      "https://www.youtube-nocookie.com/embed/" +
      encodeURIComponent(videoId) +
      "?autoplay=1&rel=0&hl=fr&playsinline=1"
    );
  }


  /* =========================================================
     CARTES VIDÉO
     ========================================================= */

  function createCardMarkup(video) {
    const id = escapeHtml(video.id);
    const title = escapeHtml(video.title);
    const thumbnail = escapeHtml(
      video.thumbnail || "assets/img/video-placeholder.svg"
    );

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
              href="${youtubeWatchUrl(video.id)}"
              target="_blank"
              rel="noopener noreferrer">
              YouTube ↗
            </a>

          </div>

        </div>

      </article>
    `;
  }


  function renderVideos(list) {
    updateCount(list.length);

    if (!list.length) {
      grid.innerHTML = "";

      if (emptyState) {
        emptyState.hidden = false;
      }

      return;
    }

    if (emptyState) {
      emptyState.hidden = true;
    }

    grid.innerHTML = list.map(createCardMarkup).join("");
  }


  /* =========================================================
     RECHERCHE
     ========================================================= */

  function filterVideos() {
    const query = (searchInput?.value || "")
      .trim()
      .toLocaleLowerCase("fr");

    if (!query) {
      renderVideos(videos);
      return;
    }

    const filtered = videos.filter((video) => {
      const title = String(video.title || "").toLocaleLowerCase("fr");
      return title.includes(query);
    });

    renderVideos(filtered);
  }


  /* =========================================================
     DIALOGUE / CONSENTEMENT
     ========================================================= */

  function hidePlayer() {
    if (!player) {
      return;
    }

    player.innerHTML = "";
    player.hidden = true;
    player.style.display = "none";
  }


  function showConsent() {
    if (!dialogConsent) {
      return;
    }

    dialogConsent.hidden = false;
    dialogConsent.style.display = "block";
  }


  function hideConsent() {
    if (!dialogConsent) {
      return;
    }

    dialogConsent.hidden = true;
    dialogConsent.style.display = "none";
  }


  function resetDialog() {
    currentVideo = null;

    hidePlayer();
    showConsent();
  }


  function openVideo(video) {
    currentVideo = video;

    if (!dialog) {
      window.open(
        youtubeWatchUrl(video.id),
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    hidePlayer();
    showConsent();

    if (dialogTitle) {
      dialogTitle.textContent = video.title;
    }

    if (externalLink) {
      externalLink.href = youtubeWatchUrl(video.id);
    }

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      /* Fallback très ancien navigateur */
      dialog.setAttribute("open", "");
    }
  }


  function closeDialog() {
    if (!dialog) {
      return;
    }

    hidePlayer();

    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
      resetDialog();
    }
  }


  function activatePlayer(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!currentVideo) {
      console.error("RELIER Vidéos : aucune vidéo sélectionnée.");
      return;
    }

    if (!player) {
      console.error("RELIER Vidéos : zone lecteur introuvable.");
      return;
    }

    const iframe = document.createElement("iframe");

    iframe.src = youtubeEmbedUrl(currentVideo.id);
    iframe.title = currentVideo.title || "Vidéo RELIER";
    iframe.loading = "eager";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    );

    hideConsent();

    player.innerHTML = "";
    player.appendChild(iframe);

    player.hidden = false;
    player.style.display = "block";

    /* Aide certains navigateurs à recalculer correctement la boîte */
    requestAnimationFrame(() => {
      player.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    });
  }


  /* =========================================================
     ÉVÉNEMENTS
     ========================================================= */

  grid.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-video-id]");

    if (!trigger) {
      return;
    }

    const id = trigger.dataset.videoId;

    const video = videos.find((item) => String(item.id) === String(id));

    if (video) {
      openVideo(video);
    }
  });


  searchInput?.addEventListener("input", filterVideos);


  acceptButton?.addEventListener("click", activatePlayer);


  dialogClose?.addEventListener("click", (event) => {
    event.preventDefault();
    closeDialog();
  });


  dialog?.addEventListener("close", resetDialog);


  dialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });


  dialog?.addEventListener("click", (event) => {
    /* Fermeture uniquement si l'utilisateur clique sur le fond du <dialog> */
    if (event.target === dialog) {
      closeDialog();
    }
  });


  /* =========================================================
     CHARGEMENT DU CATALOGUE
     ========================================================= */

  async function loadVideos() {
    try {
      const response = await fetch(DATA_URL, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      videos = Array.isArray(data.videos)
        ? data.videos.filter(
            (video) => video && video.id && video.title
          )
        : [];

      if (!videos.length) {
        updateCount(0);

        grid.innerHTML = `
          <div class="video-sync-empty">

            <span class="eyebrow">Vidéothèque</span>

            <h2>
              Aucune vidéo n’est actuellement disponible.
            </h2>

            <p>
              Vous pouvez consulter directement la chaîne RELIER sur YouTube.
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

        return;
      }

      renderVideos(videos);

    } catch (error) {
      console.error(
        "RELIER Vidéos : impossible de charger le catalogue.",
        error
      );

      updateCount(0);

      grid.innerHTML = `
        <div class="video-sync-empty">

          <span class="eyebrow">Vidéothèque</span>

          <h2>
            Impossible de charger le catalogue vidéo.
          </h2>

          <p>
            Vous pouvez néanmoins consulter directement
            la chaîne RELIER sur YouTube.
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


  /* =========================================================
     INITIALISATION
     ========================================================= */

  hidePlayer();
  showConsent();
  loadVideos();

})();
