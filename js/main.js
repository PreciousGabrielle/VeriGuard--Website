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

// ---------- 3. Prototype tabs ----------
document.addEventListener("DOMContentLoaded", function () {
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".proto-tab"));
    if (!tabs.length) return;

    function select(tab, focus) {
        tabs.forEach(function (t) {
            var on = t === tab;
            t.setAttribute("aria-selected", String(on));
            t.tabIndex = on ? 0 : -1;
            var panel = document.getElementById(t.getAttribute("aria-controls"));
            panel.hidden = !on;
            // stop any video in a panel that is being hidden
            if (!on) panel.querySelectorAll("video").forEach(function (v) { v.pause(); });
        });
        if (focus) tab.focus();
    }

    tabs.forEach(function (tab, i) {
        tab.addEventListener("click", function () { select(tab, false); });
        tab.addEventListener("keydown", function (event) {
            var next = null;
            if (event.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
            if (event.key === "ArrowLeft")  next = tabs[(i - 1 + tabs.length) % tabs.length];
            if (event.key === "Home") next = tabs[0];
            if (event.key === "End")  next = tabs[tabs.length - 1];
            if (next) { event.preventDefault(); select(next, true); }
        });
    });

    // show only the first panel once JavaScript is running
    select(tabs[0], false);
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
