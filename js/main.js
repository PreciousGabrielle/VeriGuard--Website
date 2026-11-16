// =====================================================
// VERIGUARD WEBSITE
// 1. Hero video: sound on/off + fullscreen buttons
// 2. Mobile menu: opens/closes the navbar on small screens
// 3. Prototype tabs: shows one prototype step at a time
// =====================================================

// ---------- 1. Hero video sound button ----------
document.addEventListener("DOMContentLoaded", function () {
    var video = document.querySelector(".hero-video-player");
    var button = document.querySelector(".sound-toggle");
    if (!video || !button) return;

    // make sure the muted autoplay starts (some browsers need a nudge)
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked: poster stays */ });

    // keep the sound button in sync (also when muted via the fullscreen controls)
    function syncSound() {
        button.classList.toggle("is-on", !video.muted);
        button.setAttribute("aria-pressed", String(!video.muted));
        button.setAttribute("aria-label", video.muted ? "Turn sound on" : "Turn sound off");
    }
    video.addEventListener("volumechange", syncSound);

    button.addEventListener("click", function () {
        video.muted = !video.muted;
        if (!video.muted) video.play();
    });

    // ---------- Fullscreen button (double-clicking the video works too) ----------
    var fsButton = document.querySelector(".fullscreen-toggle");

    function isFullscreen() {
        return (document.fullscreenElement || document.webkitFullscreenElement) === video;
    }

    function openFullscreen() {
        video.controls = true;   // show the normal player controls while fullscreen
        video.muted = false;     // watching fullscreen = watching with sound
        video.play();
        if (video.requestFullscreen) video.requestFullscreen();
        else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
        else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen(); // iPhone
    }

    function onFullscreenExit() {
        if (isFullscreen()) return;
        video.controls = false;  // back to the clean autoplay look
        video.play();            // keep looping in the hero
    }

    document.addEventListener("fullscreenchange", onFullscreenExit);
    document.addEventListener("webkitfullscreenchange", onFullscreenExit);
    video.addEventListener("webkitendfullscreen", onFullscreenExit); // iPhone

    if (fsButton) fsButton.addEventListener("click", openFullscreen);
    video.addEventListener("dblclick", openFullscreen);
});

// ---------- 3. Prototype screen carousel ----------
// The chosen screen sits large in the centre and the others shrink and fan
// out to the sides. Move with the arrows, by swiping/dragging, with a
// sideways trackpad scroll, with the arrow keys, or by clicking a side card.
document.addEventListener("DOMContentLoaded", function () {
    var carousel = document.querySelector(".proto-carousel");
    if (!carousel) return;

    var stage = carousel.querySelector(".carousel-stage");
    var cards = Array.prototype.slice.call(stage.querySelectorAll(".screen-card"));
    var caption = document.querySelector(".carousel-caption");
    var dotsBox = document.querySelector(".carousel-dots");
    var count = cards.length;
    var active = 0; // start on the Sign In (login) screen
    var narrow = window.matchMedia("(max-width: 640px)");
    var prevBtn = carousel.querySelector(".carousel-prev");
    var nextBtn = carousel.querySelector(".carousel-next");

    carousel.classList.add("is-ready");

    var dots = cards.map(function (card, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.tabIndex = -1;
        dot.addEventListener("click", function () { go(i); });
        dotsBox.appendChild(dot);
        return dot;
    });

    function offset(i) {
        return i - active;
    }

    function layout() {
        var cardW = cards[0].offsetWidth;
        var maxSide = narrow.matches ? 1 : 2;
        cards.forEach(function (card, i) {
            var d = offset(i);
            var a = Math.abs(d);
            var side = d < 0 ? -1 : 1;
            // cards sit side by side with a clear gap between them (no overlap)
            var scale = a === 0 ? 1 : a === 1 ? 0.62 : 0.46;
            var gap = narrow.matches ? 16 : 26;
            var x = 0;
            if (a >= 1) x = cardW * (0.5 + 0.31) + gap;
            if (a >= 2) x += cardW * (0.31 + 0.23) + gap;
            x *= side;
            // flat 2D movement only (3D tilts make the screenshots blurry); the centre card has no transform at all
            card.style.transform = a === 0 ? "none" : "translateX(" + Math.round(x) + "px) scale(" + scale + ")";
            card.style.zIndex = String(10 - a);
            card.style.opacity = a > maxSide ? "0" : "1";
            card.style.pointerEvents = a > maxSide ? "none" : "auto";
            card.classList.toggle("is-active", a === 0);
            card.setAttribute("aria-hidden", a === 0 ? "false" : "true");
        });
        dots.forEach(function (dot, i) { dot.classList.toggle("is-active", i === active); });
        prevBtn.disabled = active === 0;
        nextBtn.disabled = active === count - 1;
        var current = cards[active];
        var label = current.querySelector("figcaption");
        caption.innerHTML = "<small>" + label.querySelector("small").textContent + "</small><strong>" + label.lastChild.textContent + "</strong><span>" + current.getAttribute("data-desc") + "</span>";
    }

    function go(i) {
        // no looping: screens run in order from Sign In (left) to Profile (right)
        active = Math.max(0, Math.min(count - 1, i));
        layout();
    }

    prevBtn.addEventListener("click", function () { go(active - 1); });
    nextBtn.addEventListener("click", function () { go(active + 1); });

    cards.forEach(function (card, i) {
        card.addEventListener("click", function () {
            if (dragged) return;
            if (i !== active) go(i);
            else openViewer(card.querySelector("img"));
        });
    });

    stage.addEventListener("keydown", function (event) {
        if (event.key === "ArrowRight") { event.preventDefault(); go(active + 1); }
        if (event.key === "ArrowLeft")  { event.preventDefault(); go(active - 1); }
    });

    // swipe / drag
    var startX = null, dragged = false;
    stage.addEventListener("pointerdown", function (event) { startX = event.clientX; dragged = false; });
    window.addEventListener("pointerup", function (event) {
        if (startX === null) return;
        var dx = event.clientX - startX;
        startX = null;
        if (Math.abs(dx) > 40) {
            dragged = true;
            go(active + (dx < 0 ? 1 : -1));
            setTimeout(function () { dragged = false; }, 50);
        }
    });
    stage.addEventListener("dragstart", function (event) { event.preventDefault(); });

    // sideways trackpad scroll / shift + mouse wheel
    var wheelLock = false;
    stage.addEventListener("wheel", function (event) {
        var dx = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : (event.shiftKey ? event.deltaY : 0);
        if (Math.abs(dx) < 12) return;
        event.preventDefault();
        if (wheelLock) return;
        wheelLock = true;
        go(active + (dx > 0 ? 1 : -1));
        setTimeout(function () { wheelLock = false; }, 450);
    }, { passive: false });

    // full-size viewer: click the centre screen to read it properly
    var viewer = document.createElement("div");
    viewer.className = "screen-viewer";
    viewer.setAttribute("role", "dialog");
    viewer.setAttribute("aria-modal", "true");
    viewer.innerHTML = '<button class="screen-viewer-close" type="button" aria-label="Close">&times;</button><img alt="">';
    document.body.appendChild(viewer);
    var viewerImg = viewer.querySelector("img");

    function openViewer(img) {
        viewerImg.src = img.src;
        viewerImg.alt = img.alt;
        viewer.classList.add("is-open");
        viewer.querySelector("button").focus();
    }

    function closeViewer() {
        if (!viewer.classList.contains("is-open")) return;
        viewer.classList.remove("is-open");
        stage.focus();
    }

    viewer.addEventListener("click", closeViewer);
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeViewer();
    });
    stage.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openViewer(cards[active].querySelector("img")); }
    });

    // when the Prototype section is scrolled out of view, quietly go back
    // to the Sign In screen so it starts from the beginning next time
    if ("IntersectionObserver" in window) {
        var section = carousel.closest("section") || carousel;
        new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting || active === 0) return;
            carousel.classList.add("no-anim");
            go(0);
            stage.offsetWidth; // apply the jump instantly
            carousel.classList.remove("no-anim");
        }).observe(section);
    }

    window.addEventListener("resize", layout);
    // card size follows the screen height, so re-place the cards whenever it changes
    if ("ResizeObserver" in window) new ResizeObserver(layout).observe(cards[0]);
    window.addEventListener("load", layout);
    layout();
});

// ---------- 2. Mobile menu ----------
document.addEventListener("DOMContentLoaded", function () {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.getElementById("nav-menu");

    if (!header || !toggle || !menu) return;

    function setOpen(open) {
        header.classList.toggle("nav-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    toggle.addEventListener("click", function () {
        setOpen(!header.classList.contains("nav-open"));
    });

    menu.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            setOpen(false);
        });
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") setOpen(false);
    });
});
