document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  console.log("RELIER Vidéos — version définitive chargée");

  var DATA_URL = "assets/data/videos.json";
  var FALLBACK_THUMBNAIL = "assets/img/video-placeholder.svg";

  var grid = document.querySelector("[data-video-grid]");
  var emptyState = document.querySelector("[data-video-empty]");
  var searchInput = document.querySelector("[data-video-search]");
  var countValue = document.querySelector("[data-video-count]");
  var countLabel = document.querySelector("[data-video-count-label]");

  var dialog = document.querySelector("[data-video-dialog]");
  var dialogClose = document.querySelector("[data-video-close]");
  var consentBlock = document.querySelector("[data-video-consent]");
  var dialogTitle = document.querySelector("[data-video-dialog-title]");
  var acceptButton = document.querySelector("[data-video-accept]");
  var externalLink = document.querySelector("[data-video-external]");
  var player = document.querySelector("[data-video-player]");

  var videos = [];
  var currentVideo = null;

  if (!grid) {
    console.error("RELIER Vidéos : la grille vidéo est introuvable.");
    return;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function youtubeWatchUrl(id) {
    return "https://www.youtube.com/watch?v=" + encodeURIComponent(id);
  }

  function youtubeEmbedUrl(id) {
    return "https://www.youtube-nocookie.com/embed/" +
      encodeURIComponent(id) +
      "?autoplay=1&rel=0&hl=fr&playsinline=1";
  }

  function updateCount(number) {
    if (countValue) {
      countValue.textContent = String(number);
    }

    if (countLabel) {
      countLabel.textContent = number === 1 ? "vidéo" : "vidéos";
    }
  }

  function videoCard(video) {
    var id = escapeHtml(video.id);
    var title = escapeHtml(video.title);
    var thumbnail = escapeHtml(video.thumbnail || FALLBACK_THUMBNAIL);

    return '' +
      '<article class="video-card">' +
        '<button class="video-card-media" type="button" data-video-id="' + id + '" aria-label="Lire : ' + title + '">' +
          '<img src="' + thumbnail + '" alt="" loading="lazy" width="320" height="180">' +
          '<span class="video-card-play" aria-hidden="true">▶</span>' +
        '</button>' +
        '<div class="video-card-body">' +
          '<div class="video-card-meta"><span class="pill">Vidéo</span></div>' +
          '<h3>' + title + '</h3>' +
          '<div class="video-card-actions">' +
            '<button class="btn btn-text" type="button" data-video-id="' + id + '">Voir la vidéo</button>' +
            '<a class="video-youtube-link" href="' + youtubeWatchUrl(video.id) + '" target="_blank" rel="noopener noreferrer">YouTube ↗</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function render(list) {
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

    grid.innerHTML = list.map(videoCard).join("");
  }

  function filterVideos() {
    var query = searchInput ? searchInput.value.trim().toLowerCase() : "";

    if (!query) {
      render(videos);
      return;
    }

    render(videos.filter(function (video) {
      return String(video.title || "").toLowerCase().indexOf(query) !== -1;
    }));
  }

  function clearPlayer() {
    if (!player) {
      return;
    }

    player.innerHTML = "";
    player.hidden = true;
    player.style.display = "none";
  }

  function showConsent() {
    if (!consentBlock) {
      return;
    }

    consentBlock.hidden = false;
    consentBlock.style.display = "";
  }

  function hideConsent() {
    if (!consentBlock) {
      return;
    }

    consentBlock.hidden = true;
    consentBlock.style.display = "none";
  }

  function openVideo(video) {
    currentVideo = video;

    if (!dialog || !acceptButton || !player || !consentBlock) {
      window.open(youtubeWatchUrl(video.id), "_blank", "noopener,noreferrer");
      return;
    }

    clearPlayer();
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
      dialog.setAttribute("open", "");
    }
  }

  function playCurrentVideo() {
    if (!currentVideo || !player) {
      console.error("RELIER Vidéos : aucune vidéo sélectionnée.");
      return;
    }

    console.log("RELIER Vidéos : lecture de", currentVideo.id);

    var iframe = document.createElement("iframe");
    iframe.src = youtubeEmbedUrl(currentVideo.id);
    iframe.title = currentVideo.title || "Vidéo RELIER";
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

  function closeVideoDialog() {
    clearPlayer();
    showConsent();
    currentVideo = null;

    if (!dialog) {
      return;
    }

    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  grid.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-video-id]");

    if (!trigger) {
      return;
    }

    event.preventDefault();

    var id = trigger.getAttribute("data-video-id");
    var video = videos.find(function (item) {
      return String(item.id) === String(id);
    });

    if (video) {
      openVideo(video);
    }
  });

  if (searchInput) {
    searchInput.addEventListener("input", filterVideos);
  }

  if (acceptButton) {
    acceptButton.addEventListener("click", function (event) {
      event.preventDefault();
      playCurrentVideo();
    });
  }

  if (dialogClose) {
    dialogClose.addEventListener("click", function (event) {
      event.preventDefault();
      closeVideoDialog();
    });
  }

  if (dialog) {
    dialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      closeVideoDialog();
    });

    dialog.addEventListener("close", function () {
      clearPlayer();
      showConsent();
      currentVideo = null;
    });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) {
        closeVideoDialog();
      }
    });
  }

  fetch(DATA_URL, { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      return response.json();
    })
    .then(function (data) {
      videos = Array.isArray(data.videos)
        ? data.videos.filter(function (video) {
            return video && video.id && video.title;
          })
        : [];

      console.log("RELIER Vidéos :", videos.length, "vidéo(s) chargée(s)");

      render(videos);
    })
    .catch(function (error) {
      console.error("RELIER Vidéos : impossible de charger videos.json", error);

      updateCount(0);

      grid.innerHTML =
        '<div class="video-sync-empty">' +
          '<span class="eyebrow">Vidéothèque</span>' +
          '<h2>Impossible de charger le catalogue vidéo.</h2>' +
          '<p>Vous pouvez consulter directement la chaîne RELIER sur YouTube.</p>' +
          '<a class="btn btn-secondary" href="https://www.youtube.com/@reseaurelier" target="_blank" rel="noopener noreferrer">Voir la chaîne YouTube →</a>' +
        '</div>';
    });
});
