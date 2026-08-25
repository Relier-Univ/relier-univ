(() => {
  "use strict";

  const DATA_URL = "assets/data/videos.json";
  const FALLBACK_THUMBNAIL = "assets/img/video-placeholder.svg";

  function start() {
    const grid = document.querySelector("[data-video-grid]");
    const emptyState = document.querySelector("[data-video-empty]");
    const searchInput = document.querySelector("[data-video-search]");
    const countValue = document.querySelector("[data-video-count]");
    const countLabel = document.querySelector("[data-video-count-label]");

    const dialog = document.querySelector("[data-video-dialog]");
    const closeButton = document.querySelector("[data-video-close]");
    const consent = document.querySelector("[data-video-consent]");
    const titleElement = document.querySelector("[data-video-dialog-title]");
    const acceptButton = document.querySelector("[data-video-accept]");
    const externalLink = document.querySelector("[data-video-external]");
    const player = document.querySelector("[data-video-player]");

    if (!grid) {
      console.error("RELIER Vidéos : [data-video-grid] introuvable.");
      return;
    }

    if (!dialog || !consent || !acceptButton || !player) {
      console.error(
        "RELIER Vidéos : la fenêtre vidéo est incomplète.",
        {
          dialog: !!dialog,
          consent: !!consent,
          acceptButton: !!acceptButton,
          player: !!player
        }
      );
      return;
    }

    let videos = [];


    /* =======================================================
       OUTILS
       ======================================================= */

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function watchUrl(id) {
      return "https://www.youtube.com/watch?v=" + encodeURIComponent(id);
    }

    function embedUrl(id) {
      return (
        "https://www.youtube-nocookie.com/embed/" +
        encodeURIComponent(id) +
        "?autoplay=1&rel=0&hl=fr&playsinline=1"
      );
    }

    function setCount(number) {
      if (countValue) {
        countValue.textContent = String(number);
      }

      if (countLabel) {
        countLabel.textContent = number > 1 ? "vidéos" : "vidéo";
      }
    }


    /* =======================================================
       CARTES
       ======================================================= */

    function cardHtml(video) {
      const id = escapeHtml(video.id);
      const title = escapeHtml(video.title);
      const thumbnail = escapeHtml(
        video.thumbnail || FALLBACK_THUMBNAIL
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
                href="${watchUrl(video.id)}"
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
      setCount(list.length);

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

      grid.innerHTML = list.map(cardHtml).join("");
    }


    /* =======================================================
       LECTEUR
       ======================================================= */

    function clearPlayer() {
      player.innerHTML = "";
      player.hidden = true;
      player.style.display = "none";
    }

    function showConsent() {
      consent.hidden = false;
      consent.style.display = "";
    }

    function hideConsent() {
      consent.hidden = true;
      consent.style.display = "none";
    }

    function closeDialog() {
      clearPlayer();
      showConsent();

      if (dialog.open && typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }

    function playVideo(video) {
      console.log(
        "RELIER Vidéos : lecture demandée",
        video.id,
        video.title
      );

      const iframe = document.createElement("iframe");

      iframe.src = embedUrl(video.id);
      iframe.title = video.title || "Vidéo RELIER";
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
    }

    function openVideo(video) {
      clearPlayer();
      showConsent();

      if (titleElement) {
        titleElement.textContent = video.title;
      }

      if (externalLink) {
        externalLink.href = watchUrl(video.id);
      }

      /*
       * Le gestionnaire est affecté ICI, au moment où la vidéo
       * est sélectionnée. Il ne dépend donc pas d'un état précédent
       * ni d'un listener posé trop tôt.
       */
      acceptButton.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        playVideo(video);
      };

      if (typeof dialog.showModal === "function") {
        if (!dialog.open) {
          dialog.showModal();
        }
      } else {
        dialog.setAttribute("open", "");
      }
    }


    /* =======================================================
       ÉVÉNEMENTS
       ======================================================= */

    grid.addEventListener("click", function (event) {
      const trigger = event.target.closest("[data-video-id]");

      if (!trigger) {
        return;
      }

      event.preventDefault();

      const id = trigger.getAttribute("data-video-id");

      const video = videos.find(function (item) {
        return String(item.id) === String(id);
      });

      if (video) {
        openVideo(video);
      }
    });

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        const query = searchInput.value
          .trim()
          .toLocaleLowerCase("fr");

        if (!query) {
          render(videos);
          return;
        }

        render(
          videos.filter(function (video) {
            return String(video.title || "")
              .toLocaleLowerCase("fr")
              .includes(query);
          })
        );
      });
    }

    if (closeButton) {
      closeButton.addEventListener("click", function (event) {
        event.preventDefault();
        closeDialog();
      });
    }

    dialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      closeDialog();
    });

    dialog.addEventListener("close", function () {
      clearPlayer();
      showConsent();
      acceptButton.onclick = null;
    });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) {
        closeDialog();
      }
    });


    /* =======================================================
       DONNÉES
       ======================================================= */

    async function loadVideos() {
      try {
        const response = await fetch(DATA_URL, {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }

        const data = await response.json();

        videos = Array.isArray(data.videos)
          ? data.videos.filter(function (video) {
              return video && video.id && video.title;
            })
          : [];

        if (!videos.length) {
          setCount(0);

          grid.innerHTML = `
            <div class="video-sync-empty">

              <span class="eyebrow">Vidéothèque</span>

              <h2>Aucune vidéo n’est actuellement disponible.</h2>

              <p>
                Vous pouvez consulter directement
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

          return;
        }

        render(videos);

      } catch (error) {
        console.error(
          "RELIER Vidéos : impossible de charger le catalogue.",
          error
        );

        setCount(0);

        grid.innerHTML = `
          <div class="video-sync-empty">

            <span class="eyebrow">Vidéothèque</span>

            <h2>Impossible de charger le catalogue vidéo.</h2>

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


    /* =======================================================
       INITIALISATION
       ======================================================= */

    clearPlayer();
    showConsent();
    loadVideos();

    console.log("RELIER Vidéos : script initialisé.");
  }


  /*
   * Le script fonctionne même s'il est déplacé un jour dans le <head>.
   */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

})();
