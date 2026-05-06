/* ===========================================================
   Werkstatt-Blackout – main.js
   -----------------------------------------------------------
   Einstiegspunkt der Spiellogik.
   - Initialisiert den 360-Grad-Panorama-Viewer (Pannellum).
   - Setzt die 6 Sicherheits-Leuchten als Hotspots.
   - Baut den Intro-Screen auf (Namenseingabe, Start-Button).
   - Öffnet Rätsel-Modale und aktualisiert die Fortschrittsanzeige.

   Der Spielzustand selbst liegt in js/state.js (window.werkstattState)
   und wird hier nur gelesen und über die dortigen Hilfsfunktionen
   verändert.
   =========================================================== */

"use strict";

// Wartet, bis das HTML-Dokument vollständig aufgebaut ist,
// bevor auf Elemente zugegriffen wird.
document.addEventListener("DOMContentLoaded", () => {

    // Referenz auf den Panorama-Container.
    const panoramaContainer = document.getElementById("panorama");

    if (!panoramaContainer) {
        console.error("Fehler: #panorama-Container nicht gefunden.");
        return;
    }

    // Prüfen, ob Pannellum erfolgreich geladen wurde.
    if (typeof pannellum === "undefined") {
        console.error("Fehler: Pannellum-Bibliothek ist nicht geladen.");
        return;
    }

    // -----------------------------------------------------------
    // Pannellum-Viewer initialisieren
    // -----------------------------------------------------------
    // Die Konfiguration entspricht der offiziellen API-Dokumentation:
    // https://pannellum.org/documentation/reference/
    //
    // Ziel dieses Grundgerüsts: freier Rundumblick ohne die
    // Standard-Bedienelemente von Pannellum. Eigene UI-Elemente
    // (Hotspots, Hilfesystem) werden später ergänzt.
    // -----------------------------------------------------------
    // Hotspots werden in der Steampunk-Scene konfiguriert; im
    // echten Werkstatt-Foto (Phase 1–5) sind sie absichtlich nicht
    // vorhanden, damit der Spieler sich erst frei umsehen kann.
    const steampunkHotspots = [].concat(
        // Werkbank-Hotspot: Klemmbrett mit Notfallprotokoll.
        // scale:false ist Pannellums Schalter, der eine Hfov-
        // abhängige Skalierung des Hotspots ausschließt. Damit
        // bleibt das Wandschild beim Zoom konstant groß.
        [{
            id:                  "notfallprotokoll",
            pitch:               2.0,
            yaw:                 -80.1,
            type:                "custom",
            scale:               false,
            createTooltipFunc:   notfallprotokollHotspotErstellen,
            createTooltipArgs:   null,
            clickHandlerFunc:    function () { openNotfallprotokoll(); }
        }],
        // 5 Info-Tafeln – ebenfalls fest in Bildschirmpixeln.
        getAllInfoPanels().map(function (t) {
            return {
                id:                  t.id,
                pitch:               t.pitch,
                yaw:                 t.yaw,
                type:                "custom",
                scale:               false,
                createTooltipFunc:   infoTafelErstellen,
                createTooltipArgs:   t,
                clickHandlerFunc:    function () { openInfoPanel(t.id); }
            };
        })
    );

    // Multi-Scene-Konfiguration:
    //   – Scene "original":  echtes Werkstatt-Foto (panoramaoriginal.png)
    //                        ohne Hotspots → Spieler sieht sich um, dann
    //                        kommt die Blackout-Sequenz.
    //   – Scene "steampunk": KI-generiertes Bild (panorama.png) mit allen
    //                        Hotspots → wird in Phase 6 eingewechselt.
    //   sceneFadeDuration:0  weil das schwarze Overlay den Übergang
    //                        komplett abdeckt.
    const viewer = pannellum.viewer("panorama", {
        default: {
            firstScene: "original",
            sceneFadeDuration: 0,

            // Bedien- und Anzeigeparameter werden auf die Scenes vererbt.
            autoLoad: true,
            yaw: -170.9,
            pitch: 0.8,
            // Zoom komplett deaktiviert: Hfov ist auf 100° fixiert,
            // damit die Hotspots beim Bewegen keine wahrgenommene
            // Größenänderung erfahren.
            hfov: 100,
            minHfov: 100,
            maxHfov: 100,
            minPitch: -90,
            maxPitch: 90,
            mouseZoom: false,
            keyboardZoom: true,
            doubleClickZoom: false,
            draggable: true,
            disableKeyboardCtrl: false,
            showZoomCtrl: false,
            showFullscreenCtrl: false,
            showControls: false,
            autoRotate: 0,
            compass: false,
            hotSpotDebug: false
        },
        scenes: {
            original: {
                type: "equirectangular",
                panorama: "assets/panoramaoriginal.png"
            },
            steampunk: {
                type: "equirectangular",
                panorama: "assets/panorama.png",
                hotSpots: steampunkHotspots
            }
        }
    });

    // Fortschrittsanzeige auf aktuellen Stand setzen (z. B. nach Reload).
    aktualisiereFortschritt();

    // Bestätigung, dass Initialisierung erfolgt ist.
    // Dient als zweite Konsolen-Testmeldung zusätzlich zum Pannellum-eigenen Log.
    console.log("Werkstatt-Blackout: Panorama-Viewer initialisiert.");

    // Referenz global verfügbar machen (für spätere Rätsel-/Hotspot-Logik nützlich).
    window.werkstattViewer = viewer;

    // Intro-Screen-Logik einhängen (Namenseingabe, Start-Button).
    introScreenInitialisieren();

    // Kalibrierungs-Modus für späteres Hotspot-Tuning aktivieren.
    kalibrierungInitialisieren(viewer, panoramaContainer);

    // Test-Skip-Modus für die Blackout-Sequenz (Strg+S auf Intro).
    skipModusInitialisieren();

    // Test-Abkürzung zur Urkunde (Strg+U / Cmd+U).
    urkundeAbkuerzungInitialisieren();
});


// ===========================================================
// TEST-ABKÜRZUNG zur Urkunde (Strg+U / Cmd+U)
// -----------------------------------------------------------
// Springt unabhängig vom aktuellen Spielzustand direkt zum
// Endscreen mit der Urkunde. Wird zum schnellen Testen des
// Finales benutzt – nicht für reguläre Spieler:innen gedacht.
//
// Verhalten:
//   – Falls noch kein Name eingegeben wurde, wird "TESTNAME"
//     als Platzhalter gesetzt.
//   – Alle 5 Sicherheits-Checks werden intern als bestanden
//     markiert (puzzle.solved = true), damit die Urkunde mit
//     vollständigem Spielstand gerendert wird.
//   – preventDefault() unterdrückt den Browser-Standard
//     (Strg+U öffnet sonst den Seiten-Quelltext).
// ===========================================================
function urkundeAbkuerzungInitialisieren() {
    document.addEventListener("keydown", function (ereignis) {
        const ctrlOrCmd = ereignis.ctrlKey || ereignis.metaKey;
        if (!ctrlOrCmd) return;
        if (ereignis.key !== "u" && ereignis.key !== "U") return;

        ereignis.preventDefault();
        ereignis.stopPropagation();

        // Platzhalter-Name, falls Spieler:in noch keinen
        // eingetippt hat.
        if (!window.werkstattState.playerName ||
            !String(window.werkstattState.playerName).trim()) {
            window.werkstattState.playerName = "TESTNAME";
        }

        // Alle Rätsel als bestanden markieren (intern, ohne
        // Side-Effekte aus markPuzzleSolved – das würde die
        // Finale-Sequenz starten, wir wollen aber direkt zur
        // Urkunde springen).
        if (typeof getAllPuzzles === "function") {
            getAllPuzzles().forEach(function (p) { p.solved = true; });
        }
        if (typeof aktualisiereFortschritt === "function") {
            aktualisiereFortschritt();
        }

        // Falls bereits eine Urkunde im DOM hängt, nichts tun
        // (Doppel-Auslösung verhindern).
        if (document.querySelector(".finale-buehne")) return;

        // Etwaige offene Modale wegräumen, damit die Urkunde
        // sauber im Vordergrund erscheint.
        document.querySelectorAll(
            ".modal-overlay, .info-modal, .info-tafel-overlay, " +
            ".video-modal, .notfall-overlay, .terminal-modal"
        ).forEach(function (el) {
            if (el.parentNode) el.parentNode.removeChild(el);
        });

        if (typeof zeigeUrkunde === "function") {
            zeigeUrkunde();
        }
        console.log("Strg+U: Sprung zur Urkunde (Spieler: " +
                    window.werkstattState.playerName + ")");
    });
}


// ===========================================================
// SKIP-MODUS für die Blackout-Eintritts-Sequenz (Strg+S)
// -----------------------------------------------------------
// Während der Entwicklung kann mit Strg+S auf der Intro-Seite
// (also vor "Werkstatt betreten") die 9-sekündige Blackout-
// Sequenz übersprungen werden. Klick auf Start lädt dann sofort
// das KI-Bild und schaltet Hotspots/UI frei (Phase 8 direkt).
//
// Standard:  AUS → reguläre Sequenz läuft.
// Reload:    setzt skipMode automatisch zurück (RAM-only state).
// ===========================================================
function skipModusInitialisieren() {

    // Listener auf window registrieren (statt auf document), damit
    // er auch bei Fokus außerhalb des Document-Body sicher feuert.
    window.addEventListener("keydown", function (ereignis) {
        if (!ereignis.ctrlKey) return;
        if (ereignis.key !== "s" && ereignis.key !== "S") return;

        // Browser-Standardverhalten "Seite speichern" IMMER
        // unterdrücken, sobald die Kombi getriggert wird – auch dann,
        // wenn der Toggle wegen laufendem Spiel keine Wirkung hat.
        // Vor allen anderen Checks aufrufen.
        ereignis.preventDefault();
        ereignis.stopPropagation();

        // Nur auf der Intro-Seite toggelbar – sobald das Spiel
        // läuft, soll die Tastenkombi nichts mehr verändern.
        if (window.werkstattState && window.werkstattState.gestartet) {
            return;
        }
        skipModusToggle();
    });

    // Fallback Strg+Shift+S – greift, falls Strg+S in einer
    // Browser-/OS-Kombination doch noch durchgeleitet wird.
    window.addEventListener("keydown", function (ereignis) {
        if (!ereignis.ctrlKey || !ereignis.shiftKey) return;
        if (ereignis.key !== "s" && ereignis.key !== "S") return;

        ereignis.preventDefault();
        ereignis.stopPropagation();

        if (window.werkstattState && window.werkstattState.gestartet) {
            return;
        }
        skipModusToggle();
    });
}

function skipModusToggle() {
    const aktuellerWert = !!(window.werkstattState && window.werkstattState.skipMode);
    const neu = !aktuellerWert;
    if (window.werkstattState) {
        window.werkstattState.skipMode = neu;
    }
    // Diagnose-Log: bestätigt, dass der Toggle tatsächlich erreicht
    // wurde und welcher neue Status gesetzt ist.
    console.log("Skip-Toggle ausgelöst (neuer Status: " +
                (neu ? "AN" : "AUS") + ")");
    if (neu) {
        console.log("Skip-Modus AN");
        skipToastZeigen("Skip-Modus AN");
    } else {
        console.log("Skip-Modus AUS");
        skipToastZeigen("Skip-Modus AUS");
    }
}

function skipToastZeigen(text) {

    const toast = document.createElement("div");
    toast.className = "skip-toast";
    toast.textContent = text;
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
        toast.classList.add("skip-toast--sichtbar");
    });

    setTimeout(function () {
        toast.classList.remove("skip-toast--sichtbar");
        setTimeout(function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 2000);
}


// ===========================================================
// KALIBRIERUNGS-MODUS (Strg+K)
// -----------------------------------------------------------
// Hilfswerkzeug für die Entwicklung: Klick aufs Panorama liefert
// die yaw/pitch-Koordinaten eines Punktes, damit Hotspot-Positionen
// (Leuchten + Infotafeln) für ein neues 360°-Foto exakt eingetragen
// werden können.
//
// Aktivierung:  Strg+K (toggle)
// Anzeige:      roter Rahmen rund um das Panorama + Banner oben
// Klick:        Konsolen-Log "Hotspot-Position: yaw=..., pitch=..."
//               + kleine Toast-Notification rechts unten
// Hotspots:     im Kalibrierungs-Modus deaktiviert (kein Modal)
// ===========================================================
let kalibrierungAktiv  = false;
let kalibrierungBanner = null;

function kalibrierungInitialisieren(viewer, panoramaEl) {

    // 1) Strg+K toggelt den Modus. preventDefault verhindert, dass
    //    der Browser sein Lesezeichen-Dialog (Strg+K = Suchleiste in
    //    manchen Browsern) öffnet.
    document.addEventListener("keydown", function (ereignis) {
        if (ereignis.ctrlKey && (ereignis.key === "k" || ereignis.key === "K")) {
            ereignis.preventDefault();
            kalibrierungToggle(panoramaEl);
        }
    });

    // 2) Klick aufs Panorama im Capture-Phase abfangen, damit die
    //    Hotspot-Klick-Handler (Leuchten/Infotafeln) im Kalibrierungs-
    //    Modus NICHT mehr feuern. Im Normalbetrieb tut der Listener
    //    nichts und stört auch nicht.
    panoramaEl.addEventListener("click", function (ereignis) {
        if (!kalibrierungAktiv) return;

        // Pannellum liefert die Panorama-Koordinaten zum Maus-Event.
        // Rückgabe: [pitch, yaw].
        let coords = null;
        try {
            coords = viewer.mouseEventToCoords(ereignis);
        } catch (fehler) {
            console.warn("Kalibrierung: mouseEventToCoords fehlgeschlagen.", fehler);
        }
        if (!coords) {
            ereignis.stopPropagation();
            return;
        }

        const pitch = coords[0];
        const yaw   = coords[1];
        console.log(
            "Hotspot-Position: yaw=" + yaw.toFixed(1) +
            ", pitch=" + pitch.toFixed(1)
        );
        kalibrierungToastZeigen(yaw, pitch);

        // Hotspot-Klicks unterdrücken (kein Rätsel-/Info-Modal öffnen).
        ereignis.stopPropagation();
    }, true);
}

function kalibrierungToggle(panoramaEl) {

    kalibrierungAktiv = !kalibrierungAktiv;

    if (kalibrierungAktiv) {
        panoramaEl.classList.add("panorama--kalibrierung");

        kalibrierungBanner = document.createElement("div");
        kalibrierungBanner.className = "kalibrierung-banner";
        kalibrierungBanner.textContent =
            "🎯 KALIBRIERUNGS-MODUS AKTIV — Klick aufs Panorama für " +
            "Koordinaten — Strg+K beendet";
        document.body.appendChild(kalibrierungBanner);

        console.log("Kalibrierungs-Modus aktiviert.");
    } else {
        panoramaEl.classList.remove("panorama--kalibrierung");

        if (kalibrierungBanner && kalibrierungBanner.parentNode) {
            kalibrierungBanner.parentNode.removeChild(kalibrierungBanner);
        }
        kalibrierungBanner = null;

        console.log("Kalibrierungs-Modus deaktiviert.");
    }
}

function kalibrierungToastZeigen(yaw, pitch) {

    const toast = document.createElement("div");
    toast.className = "kalibrierung-toast";
    toast.textContent =
        "yaw=" + yaw.toFixed(1) + ", pitch=" + pitch.toFixed(1);
    document.body.appendChild(toast);

    // Sichtbar machen im nächsten Frame (CSS-Transition greift sonst nicht).
    requestAnimationFrame(function () {
        toast.classList.add("kalibrierung-toast--sichtbar");
    });

    // Nach 4 Sekunden ausblenden und entfernen.
    setTimeout(function () {
        toast.classList.remove("kalibrierung-toast--sichtbar");
        setTimeout(function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 400);
    }, 4000);
}


// -----------------------------------------------------------
// Intro-Screen
// -----------------------------------------------------------
// Verwaltet Namenseingabe, Aktivierung des Start-Buttons und
// das Ausblenden des Overlays per Fade-Out beim Spielstart.
// -----------------------------------------------------------
function introScreenInitialisieren() {

    const intro       = document.getElementById("intro-screen");
    const form        = document.getElementById("intro-form");
    const nameInput   = document.getElementById("player-name");
    const startButton = document.getElementById("start-button");

    if (!intro || !form || !nameInput || !startButton) {
        console.error("Fehler: Intro-Screen-Elemente nicht gefunden.");
        return;
    }

    // Autofokus auf das Namensfeld, damit SuS direkt tippen können.
    nameInput.focus();

    // Button nur aktivieren, wenn das Namensfeld nicht leer ist.
    // trim() verhindert, dass reine Leerzeichen-Eingaben zulässig sind.
    nameInput.addEventListener("input", () => {
        const hatInhalt = nameInput.value.trim().length > 0;
        startButton.disabled = !hatInhalt;
    });

    // Formular-Submit behandelt sowohl Button-Klick als auch Enter-Taste.
    form.addEventListener("submit", (ereignis) => {
        ereignis.preventDefault();

        const name = nameInput.value.trim();
        if (name.length === 0) {
            return;                      // Sicherheitsnetz: leerer Name nie akzeptiert
        }

        spielStarten(name, intro);
    });
}


// -----------------------------------------------------------
// Spiel starten: Namen speichern, Intro ausblenden.
// -----------------------------------------------------------
function spielStarten(name, introElement) {

    // 1. Namen und Startzustand im globalen State merken.
    window.werkstattState.playerName = name;
    window.werkstattState.gestartet  = true;

    // 2. Fade-Out anstoßen (CSS-Transition 0.8s, siehe style.css).
    introElement.classList.add("intro-screen--hidden");

    // 3. Nach Ende der Animation komplett aus dem Layout nehmen,
    //    damit keine Tab-Navigation mehr auf unsichtbare Elemente
    //    zugreift. 800 ms entspricht der CSS-Dauer.
    setTimeout(() => {
        introElement.style.display = "none";
    }, 800);

    // 4. Rückmeldung für Tests in der Konsole.
    console.log("Spiel gestartet für Spieler: " + name);

    // 5. Eintritts-Sequenz starten – oder im Test-Skip-Modus
    //    direkt in Phase 8 springen (kein Knall, kein Flackern,
    //    kein Bildwechsel-Show, keine Terminal-Nachricht).
    if (window.werkstattState && window.werkstattState.skipMode) {
        console.log("Spielstart mit Skip-Modus");
        spielSofortFreigeben();
    } else {
        console.log("Spielstart mit voller Sequenz");
        playBlackoutSequence();
    }
}


// -----------------------------------------------------------
// spielSofortFreigeben()
// -----------------------------------------------------------
// Test-Pfad: lädt sofort die Steampunk-Scene mit KI-Bild und
// nimmt die Body-Klasse blackout-vor-spiel weg, damit Hotspots
// und Sicherheits-Checks-Anzeige direkt sichtbar/klickbar sind.
// -----------------------------------------------------------
function spielSofortFreigeben() {
    if (window.werkstattViewer &&
        typeof window.werkstattViewer.loadScene === "function") {
        try {
            window.werkstattViewer.loadScene("steampunk", 0.8, -170.9, 100);
        } catch (e) {
            console.error("loadScene fehlgeschlagen (Skip-Modus):", e);
        }
    }
    document.body.classList.remove("blackout-vor-spiel");
}


// ===========================================================
// BLACKOUT-EINTRITTS-SEQUENZ
// -----------------------------------------------------------
// Achtphasige Inszenierung direkt nach dem Klick auf SPIEL STARTEN:
//   Phase 1 |   0 ms |  Echtes Foto + Hinweis "Sieh dich kurz um..."
//   Phase 2 |   0–5 s | freie Umsicht
//   Phase 3 | 5000 ms | Tür-Knall-Sound + Screenshake (0.4 s)
//   Phase 4 | 5400 ms | Stromausfall-Sound + 2 s Lichtflackern
//   Phase 5 | 7400 ms | 1 s komplett schwarz
//   Phase 6 | 8400 ms | Bildwechsel original → steampunk + Alarmton +
//                       Schwarz-Overlay 0.6 s ausblenden
//   Phase 7 | 9000 ms | Terminal-Modal mit Typewriter-Text
//   Phase 8 | Klick   | Hotspots/UI freigeschaltet
//
// Während Phase 1–7 hält body.blackout-vor-spiel die Hotspots und
// die Sicherheits-Checks-Anzeige verborgen.
// ===========================================================
function playBlackoutSequence() {

    const panoramaEl = document.getElementById("panorama");
    if (!panoramaEl) {
        console.error("playBlackoutSequence: #panorama nicht gefunden.");
        return;
    }

    // ---- Audio-Referenzen + sanfte Lautstärke -----------------
    const audioTuer        = document.getElementById("audio-tuerzu");
    const audioStromausfall= document.getElementById("audio-stromausfall");
    const audioAlarm       = document.getElementById("audio-alarm");
    [audioTuer, audioStromausfall, audioAlarm].forEach(function (a) {
        if (a) a.volume = 0.6;
    });

    function abspielen(audio) {
        if (!audio) return;
        try {
            audio.currentTime = 0;
            const p = audio.play();
            if (p && typeof p.catch === "function") {
                p.catch(function (err) {
                    console.warn("Audio-Wiedergabe blockiert:", err);
                });
            }
        } catch (e) {
            console.warn("Audio-Fehler:", e);
        }
    }

    // ---- Phase 1: Hinweis "Sieh dich kurz um..." --------------
    console.log("Phase 1: Echtes Foto geladen");
    const hinweis = document.createElement("div");
    hinweis.className = "umsehen-hinweis";
    hinweis.textContent = "Sieh dich kurz um …";
    document.body.appendChild(hinweis);
    requestAnimationFrame(function () {
        hinweis.classList.add("umsehen-hinweis--sichtbar");
    });
    // Nach 4 Sekunden ausblenden, dann aus dem DOM entfernen.
    setTimeout(function () {
        hinweis.classList.remove("umsehen-hinweis--sichtbar");
        setTimeout(function () {
            if (hinweis.parentNode) hinweis.parentNode.removeChild(hinweis);
        }, 700);
    }, 4000);

    // ---- Schwarzes Vollflächen-Overlay vorbereiten ------------
    // Wird in Phase 4 zum Flackern, in Phase 5 dauerhaft schwarz und
    // in Phase 6 zum Ausblenden verwendet.
    const blackOverlay = document.createElement("div");
    blackOverlay.className = "blackout-overlay";
    document.body.appendChild(blackOverlay);

    // ---- Phase 3: Tür-Knall + Screenshake (5000 ms) -----------
    setTimeout(function () {
        console.log("Phase 3: Tuerknall");
        abspielen(audioTuer);
        panoramaEl.classList.add("screenshake");
        setTimeout(function () {
            panoramaEl.classList.remove("screenshake");
        }, 400);
    }, 5000);

    // ---- Phase 4: Lichtflackern + Stromausfall-Sound (5400 ms) -
    setTimeout(function () {
        console.log("Phase 4: Lichtflackern startet");
        abspielen(audioStromausfall);
        blackOverlay.classList.add("blackout-overlay--flicker");
    }, 5400);

    // ---- Phase 5: 1 s komplett schwarz halten (7400 ms) -------
    // Die Flackern-Animation endet selbst bei opacity 1; hier nur
    // sicherstellen, dass das Overlay schwarz bleibt.
    setTimeout(function () {
        blackOverlay.classList.remove("blackout-overlay--flicker");
        blackOverlay.classList.add("blackout-overlay--solid");
    }, 7400);

    // ---- Phase 6: Bildwechsel + Alarm + Fade-Out (8400 ms) ----
    setTimeout(function () {
        console.log("Phase 6: Bildwechsel zum KI-Bild");
        // Pannellum-Scene wechseln. loadScene(sceneId, pitch, yaw, hfov).
        if (window.werkstattViewer &&
            typeof window.werkstattViewer.loadScene === "function") {
            try {
                window.werkstattViewer.loadScene(
                    "steampunk", 0.8, -170.9, 100
                );
            } catch (e) {
                console.error("loadScene fehlgeschlagen:", e);
            }
        }
        abspielen(audioAlarm);
        // Schwarz-Overlay 0.6 s ausblenden (CSS-Transition).
        blackOverlay.classList.add("blackout-overlay--fade-out");
        // Nach Fade-Out aus dem DOM entfernen.
        setTimeout(function () {
            if (blackOverlay.parentNode) {
                blackOverlay.parentNode.removeChild(blackOverlay);
            }
        }, 700);
    }, 8400);

    // ---- Phase 7: Terminal-Modal mit Typewriter (9000 ms) -----
    setTimeout(function () {
        console.log("Phase 7: Terminal erscheint");
        zeigeTerminalNachricht();
    }, 9000);
}


// -----------------------------------------------------------
// Phase 7 – Terminal-Modal mit Typewriter-Effekt
// -----------------------------------------------------------
// Baut ein zentrales Modal im CRT-Look auf. Der Text wird Zeichen
// für Zeichen mit ca. 30 Zeichen/Sekunde eingegeben. Nach Ende
// erscheint der "VERSTANDEN"-Button, dessen Klick die Hotspots
// und die Sicherheits-Checks-Anzeige freischaltet (Phase 8).
// -----------------------------------------------------------
function zeigeTerminalNachricht() {

    const NACHRICHT =
        "SYSTEM-AUSFALL.\n" +
        "NOTSTROM AKTIV.\n" +
        "TÜR VERRIEGELT.\n" +
        "\n" +
        "Die Stromzufuhr wurde unterbrochen.\n" +
        "Der Notstrom hält die Werkstatt\n" +
        "nur eingeschränkt aufrecht.\n" +
        "\n" +
        "Die Verriegelung lässt sich nur \n" +
        "aufheben, wenn die Standbohrmaschine\n" +
        "reaktiviert wird.\n" +
        "\n" +
        "Die Sicherheits-Checks zur\n" +
        "Reaktivierung sind im Notfallplan\n" +
        "an der Wand dokumentiert.";

    const overlay = document.createElement("div");
    overlay.className = "terminal-modal";

    const panel = document.createElement("div");
    panel.className = "terminal-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "System-Meldung");

    const text = document.createElement("pre");
    text.className = "terminal-text";

    const cursor = document.createElement("span");
    cursor.className = "terminal-cursor";
    cursor.textContent = "▍";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "terminal-btn";
    button.textContent = "VERSTANDEN";
    button.hidden = true;

    // Cursor in das <pre>-Element legen, damit er optisch direkt
    // hinter dem letzten getippten Zeichen sitzt und nicht in eine
    // eigene Zeile umbricht.
    text.appendChild(cursor);
    panel.appendChild(text);
    panel.appendChild(button);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    requestAnimationFrame(function () {
        overlay.classList.add("terminal-modal--sichtbar");
    });

    // Typewriter: ~40 Zeichen pro Sekunde → 25 ms pro Zeichen.
    // Wir fügen jedes Zeichen als Text-Node VOR dem Cursor ein,
    // damit der Cursor immer am Ende sitzt (textContent würde
    // den Cursor-Node entfernen).
    let i = 0;
    const intervall = setInterval(function () {
        if (i >= NACHRICHT.length) {
            clearInterval(intervall);
            cursor.classList.add("terminal-cursor--blink");
            button.hidden = false;
            requestAnimationFrame(function () {
                button.classList.add("terminal-btn--sichtbar");
                button.focus();
            });
            return;
        }
        text.insertBefore(
            document.createTextNode(NACHRICHT.charAt(i)),
            cursor
        );
        i += 1;
    }, 25);

    button.addEventListener("click", function () {
        // Phase 8: Spiel freigeben.
        console.log("Phase 8: Spiel freigegeben");
        document.body.classList.remove("blackout-vor-spiel");
        // Modal ausblenden und entfernen.
        overlay.classList.add("terminal-modal--fade-out");
        setTimeout(function () {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 400);
    });
}


// -----------------------------------------------------------
// Sicherheits-Leuchte (Pannellum-Hotspot) erzeugen
// -----------------------------------------------------------
// Pannellum ruft diese Funktion einmal pro Hotspot auf und
// übergibt den äußeren Hotspot-Container sowie die in
// createTooltipArgs hinterlegten Puzzle-Daten.
//
// Wichtig: Pannellum setzt auf dem hotSpotDiv selbst laufend
// inline-Styles (u. a. transform), um die Position im Panorama
// zu berechnen. Deshalb fügen wir die eigentliche Grafik in
// ein INNERES Kind-Element ein, damit unsere CSS-Transformen
// (scale auf Hover, Puls-Animation) nicht mit Pannellums
// Positionierung kollidieren.
// -----------------------------------------------------------
function leuchteErstellen(hotSpotDiv, puzzle) {

    // Äußerer Container bekommt eine neutrale Wrapper-Klasse,
    // damit wir ihn im CSS selektieren könnten, ohne Pannellums
    // Positions-Transform anzutasten.
    hotSpotDiv.classList.add("leuchte-wrapper");

    // Inneres Element trägt die sichtbare Gestaltung.
    const leuchte = document.createElement("div");
    leuchte.classList.add("leuchte");
    leuchte.classList.add(puzzle.solved ? "leuchte-gruen" : "leuchte-rot");

    // Daten-Attribute für spätere Aktualisierung und CSS-Tooltip.
    leuchte.dataset.puzzleId = String(puzzle.id);
    leuchte.dataset.label    = puzzle.label;

    // Barrierefreiheit: Screenreader-Beschriftung und Tastatur-Rolle.
    leuchte.setAttribute("role", "button");
    leuchte.setAttribute("tabindex", "0");
    leuchte.setAttribute("aria-label",
        "Rätsel " + puzzle.id + ": " + puzzle.label);

    hotSpotDiv.appendChild(leuchte);
}


// -----------------------------------------------------------
// notfallprotokollHotspotErstellen(hotSpotDiv)
// -----------------------------------------------------------
// Klemmbrett-Hotspot auf der Werkbank vor der Bohrmaschine.
// Aufbau analog zu Leuchte/Info-Tafel: Pannellum positioniert
// den äußeren Wrapper, das innere Element trägt Styling und
// Pulsations-Animation.
// -----------------------------------------------------------
function notfallprotokollHotspotErstellen(hotSpotDiv) {

    hotSpotDiv.classList.add("notfall-hotspot-wrapper");

    const knopf = document.createElement("div");
    knopf.className = "notfall-hotspot";
    knopf.dataset.label = "Notfallplan lesen";
    knopf.setAttribute("role", "button");
    knopf.setAttribute("tabindex", "0");
    knopf.setAttribute("aria-label", "Notfallplan lesen");

    const icon = document.createElement("img");
    icon.className = "notfall-hotspot-icon";
    icon.src = "assets/notfallplan-icon.png";
    icon.alt = "";
    icon.setAttribute("aria-hidden", "true");
    icon.draggable = false;
    knopf.appendChild(icon);

    hotSpotDiv.appendChild(knopf);
}


// -----------------------------------------------------------
// Notfallprotokoll-Modal
// -----------------------------------------------------------
// Zeigt die Karte assets/notfallprotokoll.png mit 5 anklickbaren
// Stations-Medaillons. Jede Station öffnet das zugehörige
// Rätsel-Modal. Bereits gelöste Stationen erhalten ein grünes
// Häkchen-Overlay (wird beim Öffnen aus dem State berechnet).
//
// Reihenfolge der Stationen entspricht der Karte:
//   Station 1 (oben links)  → Rätsel 1: Teile der Maschine
//   Station 2 (oben mitte)  → Rätsel 3: PSA
//   Station 3 (oben rechts) → Rätsel 2: Bohrertypen
//   Station 4 (unten rechts)→ Rätsel 4: Handhabung & Sicherheit
//   Station 5 (unten links) → Rätsel 5: Bohrauftrag
// -----------------------------------------------------------
const NOTFALL_STATIONEN = [
    { stationNr: 1, puzzleId: 1, x: 20.5, y: 31.0, label: "Kenne deine Maschine" },
    { stationNr: 2, puzzleId: 3, x: 48.0, y: 31.0, label: "Rüst dich aus" },
    { stationNr: 3, puzzleId: 2, x: 75.5, y: 31.0, label: "Wähle dein Werkzeug" },
    { stationNr: 4, puzzleId: 4, x: 62.0, y: 64.0, label: "Folge dem Verfahren" },
    { stationNr: 5, puzzleId: 5, x: 39.5, y: 64.0, label: "Setze den Bohrauftrag um" }
];

function openNotfallprotokoll() {

    // Doppel-Öffnung verhindern.
    if (document.querySelector(".notfall-overlay")) return;

    // Halbtransparenter Hintergrund.
    const overlay = document.createElement("div");
    overlay.className = "notfall-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Notfallprotokoll der Werkstatt");

    // Bild-Wrapper hält das Seitenverhältnis (3:2) und ist die
    // Referenz für die prozentuale Stations-Positionierung.
    const wrapper = document.createElement("div");
    wrapper.className = "notfall-bild-wrapper";

    const bild = document.createElement("img");
    bild.className = "notfall-bild";
    bild.src = "assets/notfallprotokoll.png";
    bild.alt = "Notfallprotokoll mit fünf Sicherheits-Stationen";
    bild.draggable = false;
    wrapper.appendChild(bild);

    // Schließen-Button oben rechts auf dem Bild.
    const schliessenBtn = document.createElement("button");
    schliessenBtn.type = "button";
    schliessenBtn.className = "notfall-close";
    schliessenBtn.setAttribute("aria-label", "Notfallprotokoll schließen");
    schliessenBtn.textContent = "×"; // ×
    wrapper.appendChild(schliessenBtn);

    // Stations-Medaillons als unsichtbare Klickflächen.
    NOTFALL_STATIONEN.forEach(function (s) {
        const station = document.createElement("button");
        station.type = "button";
        station.className = "notfall-station";
        station.style.left = s.x + "%";
        station.style.top  = s.y + "%";
        station.setAttribute("aria-label",
            "Station " + s.stationNr + ": " + s.label);
        station.title = "Station " + s.stationNr + ": " + s.label;
        station.dataset.puzzleId = String(s.puzzleId);

        // Status-Häkchen (anfangs versteckt, wird per .solved sichtbar).
        const status = document.createElement("span");
        status.className = "status-overlay";
        status.setAttribute("aria-hidden", "true");
        status.textContent = "✓"; // ✓
        const puzzle = (typeof getPuzzle === "function")
            ? getPuzzle(s.puzzleId) : null;
        if (puzzle && puzzle.solved) {
            status.classList.add("solved");
            station.classList.add("notfall-station--solved");
        }
        station.appendChild(status);

        station.addEventListener("click", function (ev) {
            ev.stopPropagation();
            schliesseJetzt();
            // Nach kurzem Fade-Out das Rätsel-Modal öffnen.
            setTimeout(function () { openPuzzle(s.puzzleId); }, 200);
        });

        wrapper.appendChild(station);
    });

    overlay.appendChild(wrapper);
    document.body.appendChild(overlay);

    // -------------------------------------------------------
    // Schließ-Logik (X-Button, Escape, Klick auf Overlay).
    // -------------------------------------------------------
    function escHandler(ev) {
        if (ev.key === "Escape") schliesseJetzt();
    }
    function schliesseJetzt() {
        overlay.classList.add("notfall-overlay--fade-out");
        document.removeEventListener("keydown", escHandler);
        setTimeout(function () {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 200);
    }

    document.addEventListener("keydown", escHandler);
    schliessenBtn.addEventListener("click", schliesseJetzt);
    overlay.addEventListener("click", function (ev) {
        if (ev.target === overlay) schliesseJetzt();
    });
    // Klick auf den Bild-Bereich (Wrapper, aber außerhalb der
    // Stationen) soll NICHT schließen – das Bild selbst ist
    // Lese-Inhalt. Stations-Klicks haben ihr stopPropagation.

    // Fade-In im nächsten Frame.
    requestAnimationFrame(function () {
        overlay.classList.add("notfall-overlay--sichtbar");
        schliessenBtn.focus();
    });
}

window.openNotfallprotokoll = openNotfallprotokoll;


// -----------------------------------------------------------
// aktualisiereFortschritt()
// -----------------------------------------------------------
// Liest den gelösten Stand aus dem State und schreibt ihn in
// die Fortschrittsanzeige oben rechts.
// -----------------------------------------------------------
function aktualisiereFortschritt() {
    const wertEl = document.getElementById("fortschritt-wert");
    if (!wertEl) return;
    wertEl.textContent = String(getSolvedCount());
}


// -----------------------------------------------------------
// openPuzzle(puzzleId)
// -----------------------------------------------------------
// Baut das Rätsel-Modal dynamisch auf, zeigt es an und
// registriert sämtliche Schließ-Wege (Button "SCHLIESSEN",
// Klick auf den Hintergrund, Escape-Taste) sowie den
// Test-Lösen-Button.
// -----------------------------------------------------------
function openPuzzle(puzzleId) {

    const puzzle = getPuzzle(puzzleId);
    if (!puzzle) {
        console.error("openPuzzle: kein Puzzle mit id " + puzzleId);
        return;
    }

    // Verhindern, dass bei schnellem Mehrfachklick zwei Modale
    // gleichzeitig entstehen.
    if (document.querySelector(".modal-overlay")) {
        return;
    }

    // Halbtransparentes Overlay.
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    // Zentrales Panel (dunkel, roter Akzent-Rand).
    const panel = document.createElement("div");
    panel.className = "modal-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "modal-titel");

    // Überschrift.
    // Anzeige-Nummer kann von der internen puzzle.id abweichen,
    // damit die im Modal sichtbare Nummerierung mit der Reihenfolge
    // auf der Notfallprotokoll-Karte übereinstimmt. Aktuell tauschen
    // sich Puzzle 2 (Bohrertypen) und Puzzle 3 (PSA) gegen die
    // Karten-Reihenfolge: Karte zeigt Station 2 = PSA, Station 3 =
    // Bohrertypen. Interne IDs, Renderer und Verlinkung bleiben
    // davon unberührt.
    const ANZEIGE_NUMMER = { 2: 3, 3: 2 };
    const anzeigeId = ANZEIGE_NUMMER[puzzle.id] || puzzle.id;
    const titel = document.createElement("h2");
    titel.id = "modal-titel";
    titel.className = "modal-titel";
    titel.textContent = "RÄTSEL " + anzeigeId + ": " + puzzle.label;

    // Inhaltsbereich – wird entweder durch einen registrierten
    // Puzzle-Renderer (window.puzzleRenderer[id]) oder durch einen
    // schlichten Platzhalter-Text gefüllt.
    const inhalt = document.createElement("div");
    inhalt.className = "modal-inhalt";

    // Prüfen, ob für dieses Rätsel ein echter Renderer vorliegt
    // und das Puzzle noch nicht gelöst wurde.
    const renderer = (!puzzle.solved &&
                      window.puzzleRenderer &&
                      window.puzzleRenderer[puzzle.id]) || null;

    if (renderer) {
        // Breiteres Panel, damit SVG + Chips nebeneinander passen.
        panel.classList.add("modal-panel--wide");
        inhalt.classList.add("modal-inhalt--puzzle");
    } else {
        const platzhalter = document.createElement("p");
        platzhalter.textContent = puzzle.solved
            ? "Dieses Rätsel wurde bereits gelöst."
            : "[Hier kommt später die Aufgabe zu " + puzzle.label + "]";
        inhalt.appendChild(platzhalter);
    }

    // Button-Leiste.
    const aktionen = document.createElement("div");
    aktionen.className = "modal-aktionen";

    const schliessenBtn = document.createElement("button");
    schliessenBtn.type = "button";
    schliessenBtn.className = "modal-button modal-button-neutral";
    schliessenBtn.textContent = "SCHLIESSEN";

    const loesenBtn = document.createElement("button");
    loesenBtn.type = "button";
    loesenBtn.className = "modal-button modal-button-erfolg";
    loesenBtn.textContent = "LÖSEN (Testmodus)";
    // Wenn schon gelöst ODER ein echter Renderer aktiv ist,
    // den Test-Lösen-Button ausblenden.
    if (puzzle.solved || renderer) {
        loesenBtn.style.display = "none";
    }

    aktionen.appendChild(schliessenBtn);
    aktionen.appendChild(loesenBtn);

    // -------------------------------------------------------
    // Schließ-Logik (vor dem DOM-Zusammenbau definiert, damit
    // sowohl der klassische SCHLIESSEN-Button als auch das
    // X-Symbol im Puzzle-Header auf dieselbe Callback-Kette
    // zugreifen können).
    // -------------------------------------------------------
    function escHandler(ereignis) {
        if (ereignis.key === "Escape") {
            schliesseJetzt();
        }
    }
    function schliesseJetzt() {
        modalSchliessen(overlay, escHandler);
    }

    // -------------------------------------------------------
    // Zusammenbau je nach Modus:
    //   (a) Puzzle-Renderer-Modus (großes Modal)
    //       -> Header mit Titel + X, scrollbarer Inhalt, fixer
    //          Footer-Slot für die Renderer-Bedienleiste.
    //       -> Overlay erhält Modifier-Klasse für Styling ohne
    //          Innenabstand auf dem Smartphone.
    //   (b) Standard-Modus (Platzhalter-Rätsel)
    //       -> Klassischer Aufbau mit Titel, Inhalt, Button-Leiste.
    // -------------------------------------------------------
    let xSchliessen = null;
    if (renderer) {
        overlay.classList.add("modal-overlay--wide");

        // Header: Titel + X-Schließen-Button.
        const header = document.createElement("div");
        header.className = "modal-header";

        xSchliessen = document.createElement("button");
        xSchliessen.type = "button";
        xSchliessen.className = "modal-close-x";
        xSchliessen.setAttribute("aria-label", "Rätsel schließen");
        xSchliessen.textContent = "\u00D7";   // ×

        header.appendChild(titel);
        header.appendChild(xSchliessen);

        // Footer-Slot, den der Renderer mit seiner Bedienleiste
        // befüllt (siehe puzzles.js → footerZiel).
        const footer = document.createElement("div");
        footer.className = "modal-footer";
        inhalt._footer = footer;

        panel.appendChild(header);
        panel.appendChild(inhalt);
        panel.appendChild(footer);

        // Die alte Button-Leiste wird im Renderer-Modus NICHT
        // eingehängt – der X-Button im Header übernimmt das
        // Schließen.
    } else {
        panel.appendChild(titel);
        panel.appendChild(inhalt);
        panel.appendChild(aktionen);
    }

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // -------------------------------------------------------
    // Schließ-Handler binden (Escape, Overlay-Klick, Buttons).
    // -------------------------------------------------------
    document.addEventListener("keydown", escHandler);

    // Klick außerhalb des Panels (also auf den halbtransparenten
    // Hintergrund) schließt das Modal. Wichtig: auch im Puzzle-
    // Modus bleibt der Zwischenstand erhalten, weil jede Drag-
    // Aktion bereits in window.werkstattState gespeichert wurde.
    overlay.addEventListener("click", function (ereignis) {
        if (ereignis.target === overlay) {
            schliesseJetzt();
        }
    });

    schliessenBtn.addEventListener("click", schliesseJetzt);
    if (xSchliessen) {
        xSchliessen.addEventListener("click", schliesseJetzt);
    }

    // -------------------------------------------------------
    // Lösen (Testmodus) – nur relevant, wenn kein Renderer läuft.
    // -------------------------------------------------------
    loesenBtn.addEventListener("click", function () {
        loesePuzzle(puzzle.id);
        schliesseJetzt();
    });

    // Echten Rätsel-Renderer (falls vorhanden) JETZT aufrufen –
    // erst wenn das Panel im DOM hängt (inhalt._footer existiert)
    // und getBoundingClientRect korrekte Werte liefert.
    if (renderer) {
        inhalt._schliesseModal = schliesseJetzt;
        try {
            renderer(inhalt, schliesseJetzt);
        } catch (fehler) {
            console.error("Puzzle-Renderer-Fehler:", fehler);
        }
    }

    // Fokus auf das erste sinnvolle Steuerelement legen
    // (Tastaturbedienung): im Renderer-Modus das X, sonst den
    // neutralen SCHLIESSEN-Button.
    requestAnimationFrame(function () {
        (xSchliessen || schliessenBtn).focus();
    });
}

// Global verfügbar – wird vom Hilfesystem (js/hilfe.js) und vom
// Zurück-zum-Rätsel-Button in der Info-Tafel aufgerufen.
window.openPuzzle = openPuzzle;


// -----------------------------------------------------------
// loesePuzzle(id)
// -----------------------------------------------------------
// Zentrale Helferfunktion, die vom Test-Lösen-Button UND von
// echten Rätsel-Renderern (js/puzzles.js) aufgerufen wird.
// Markiert das Puzzle als gelöst, schaltet die Leuchte grün,
// aktualisiert den Fortschritt und loggt das Ergebnis.
// -----------------------------------------------------------
function loesePuzzle(id) {
    const hatGewechselt = markPuzzleSolved(id);
    if (hatGewechselt) {
        aktualisiereFortschritt();
        console.log(
            "Rätsel " + id + " gelöst. Fortschritt: " +
            getSolvedCount() + "/5"
        );
    }
    return hatGewechselt;
}
window.loesePuzzle = loesePuzzle;


// -----------------------------------------------------------
// modalSchliessen(overlay, escHandler)
// -----------------------------------------------------------
// Blendet das Modal mit 300 ms Fade-Out aus, entfernt den
// Escape-Listener und nimmt das Overlay anschließend komplett
// aus dem DOM.
// -----------------------------------------------------------
function modalSchliessen(overlay, escHandler) {
    if (!overlay) return;
    overlay.classList.add("modal-overlay--fade-out");
    if (escHandler) {
        document.removeEventListener("keydown", escHandler);
    }
    setTimeout(function () {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }, 300);
}


// ===========================================================
// FINALE – Cinematische Sequenz nach dem 5. gelösten Rätsel
// ===========================================================
//
// Ablauf (alle Zeiten in ms, Start = 0 beim Aufruf):
//
//   Phase 1 |    0 –  1000 | Modal schließt (läuft bereits),
//                            Leuchte 5 ist grün, Fortschritt 5/5.
//   Phase 2 | 1000 –  4000 | Panorama wird heller (CSS-Filter-
//                            Transition 3 s) mit kurzem Leucht-
//                            stoffröhren-Flacker in den ersten
//                            1,2 s.
//   Phase 3 | 4000 –  6500 | "TÜR ENTRIEGELT"-Overlay:
//                            4000–4500 Fade-In, bis 6000 sichtbar,
//                            6000–6500 Fade-Out.
//   Phase 4 | 6500 –   ... | Urkunde fadet ein inkl. Buttons.
// -----------------------------------------------------------
function starteFinale() {

    // Doppelstart verhindern, falls markPuzzleSolved mehrfach
    // triggern sollte (z. B. durch Debugging-Aufrufe).
    if (document.querySelector(".finale-buehne") ||
        document.querySelector(".finale-text-overlay")) {
        return;
    }

    console.log("Finale gestartet.");

    const panorama = document.getElementById("panorama");

    // Phase 2 – Licht kommt zurück (nach 1 s).
    setTimeout(function () {
        if (!panorama) return;
        panorama.classList.add("panorama--final");
        panorama.classList.add("panorama--flicker");

        // Flacker-Klasse nach Animationsende wieder entfernen,
        // damit das Element seinen normalen Zustand behält.
        setTimeout(function () {
            panorama.classList.remove("panorama--flicker");
        }, 1300);
    }, 1000);

    // Phase 3 – "TÜR ENTRIEGELT" (nach 4 s).
    setTimeout(zeigeTuerEntriegelt, 4000);

    // Phase 4 – Urkunde einblenden (nach 6,5 s).
    setTimeout(zeigeUrkunde, 6500);
}


// -----------------------------------------------------------
// Phase 3: großer Text "TÜR ENTRIEGELT"
// -----------------------------------------------------------
function zeigeTuerEntriegelt() {

    const overlay = document.createElement("div");
    overlay.className = "finale-text-overlay";

    const inner = document.createElement("div");
    inner.className = "finale-text-inner";

    const icon = document.createElement("div");
    icon.className = "finale-tuer-icon";
    icon.textContent = "🔓";

    const titel = document.createElement("div");
    titel.className = "finale-tuer-titel";
    titel.textContent = "TÜR ENTRIEGELT";

    const untertitel = document.createElement("div");
    untertitel.className = "finale-tuer-untertitel";
    untertitel.textContent =
        "Du hast die Bohrmaschine ordnungsgemäß aktiviert.";

    inner.appendChild(icon);
    inner.appendChild(titel);
    inner.appendChild(untertitel);
    overlay.appendChild(inner);
    document.body.appendChild(overlay);

    // Einblenden (nächster Frame, damit die Transition greift).
    requestAnimationFrame(function () {
        overlay.classList.add("finale-text-overlay--sichtbar");
    });

    // Nach ~2 s Sichtbarkeit wieder ausblenden, dann aus dem DOM.
    setTimeout(function () {
        overlay.classList.remove("finale-text-overlay--sichtbar");
    }, 2000);
    setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 2500);
}


// -----------------------------------------------------------
// Phase 4: Urkunde + Aktions-Buttons
// -----------------------------------------------------------
function zeigeUrkunde() {

    const name = (window.werkstattState.playerName || "").trim() || "Unbekannt";
    const datumHeute = datumFormatiert(new Date());

    // Bühne (Overlay + Ausrichtung).
    const buehne = document.createElement("div");
    buehne.className = "finale-buehne";

    // Urkunde.
    const urkunde = document.createElement("div");
    urkunde.className = "urkunde";
    urkunde.id = "urkunde";
    urkunde.setAttribute("role", "img");
    urkunde.setAttribute("aria-label",
        "Urkunde: Bohrmaschinen-Führerschein für " + name);

    // Dezente Bohrmaschinen-Silhouette im Hintergrund (inline SVG).
    urkunde.innerHTML =
        '<svg class="urkunde-silhouette" viewBox="0 0 200 120"' +
        ' xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<!-- Stilisierte Standbohrmaschine (Säule + Kopf + Bohrfutter). -->' +
          '<rect x="95" y="10" width="12" height="95" fill="#2A1810"/>' +
          '<rect x="70" y="5"  width="70" height="22" rx="3" fill="#2A1810"/>' +
          '<rect x="88" y="27" width="26" height="18" fill="#2A1810"/>' +
          '<rect x="96" y="45" width="10" height="30" fill="#2A1810"/>' +
          '<polygon points="96,75 106,75 101,95" fill="#2A1810"/>' +
          '<rect x="60" y="105" width="85" height="8" rx="2" fill="#2A1810"/>' +
          '<circle cx="55" cy="16" r="6" fill="#2A1810"/>' +
        '</svg>';

    // Inhalts-Elemente anlegen und sicher via textContent einfüllen.
    const titel = document.createElement("div");
    titel.className = "urkunde-titel";
    titel.textContent = "BOHRMASCHINEN-FÜHRERSCHEIN";

    const kern = document.createElement("div");
    kern.className = "urkunde-kern";

    const bestaetigt = document.createElement("div");
    bestaetigt.className = "urkunde-bestaetigt";
    bestaetigt.textContent = "Dies bestätigt, dass";

    const nameEl = document.createElement("div");
    nameEl.className = "urkunde-name";
    nameEl.textContent = name;

    const text = document.createElement("div");
    text.className = "urkunde-text";
    text.textContent =
        "die theoretische Prüfung zum sicheren Umgang mit der " +
        "Standbohrmaschine erfolgreich bestanden hat.";

    kern.appendChild(bestaetigt);
    kern.appendChild(nameEl);
    kern.appendChild(text);

    // Fuß-Zeile: Datum links, Werkstattleitung rechts.
    const fuss = document.createElement("div");
    fuss.className = "urkunde-fuss";

    const datumBlock = document.createElement("div");
    datumBlock.className = "urkunde-fuss-block";
    const datumLinie = document.createElement("div");
    datumLinie.className = "urkunde-linie";
    datumBlock.appendChild(datumLinie);
    const datumLabel = document.createElement("div");
    datumLabel.textContent = "Datum: " + datumHeute;
    datumBlock.appendChild(datumLabel);

    const leitungBlock = document.createElement("div");
    leitungBlock.className = "urkunde-fuss-block";
    const signatur = document.createElement("div");
    signatur.className = "urkunde-signatur";
    signatur.textContent = "i. V. Schmidt";
    leitungBlock.appendChild(signatur);
    const leitungLinie = document.createElement("div");
    leitungLinie.className = "urkunde-linie";
    leitungBlock.appendChild(leitungLinie);
    const leitungLabel = document.createElement("div");
    leitungLabel.textContent = "Werkstattleitung";
    leitungBlock.appendChild(leitungLabel);

    fuss.appendChild(datumBlock);
    fuss.appendChild(leitungBlock);

    urkunde.appendChild(titel);
    urkunde.appendChild(kern);
    urkunde.appendChild(fuss);

    // Buttons.
    const aktionen = document.createElement("div");
    aktionen.className = "finale-aktionen";

    const speichernBtn = document.createElement("button");
    speichernBtn.type = "button";
    speichernBtn.className = "finale-button finale-button-primaer";
    speichernBtn.textContent = "ALS BILD SPEICHERN";
    speichernBtn.addEventListener("click", function () {
        urkundeAlsBildSpeichern(urkunde, name, datumHeute, speichernBtn);
    });

    const nochmalBtn = document.createElement("button");
    nochmalBtn.type = "button";
    nochmalBtn.className = "finale-button finale-button-neutral";
    nochmalBtn.textContent = "NOCHMAL SPIELEN";
    nochmalBtn.addEventListener("click", nochmalSpielen);

    aktionen.appendChild(speichernBtn);
    aktionen.appendChild(nochmalBtn);

    buehne.appendChild(urkunde);
    buehne.appendChild(aktionen);
    document.body.appendChild(buehne);

    // Fade-In im nächsten Frame, damit der Übergang greift.
    requestAnimationFrame(function () {
        buehne.classList.add("finale-buehne--sichtbar");
    });
}


// -----------------------------------------------------------
// Datum im Format DD.MM.YYYY (für die Urkunde).
// -----------------------------------------------------------
function datumFormatiert(d) {
    const tag   = String(d.getDate()).padStart(2, "0");
    const monat = String(d.getMonth() + 1).padStart(2, "0");
    const jahr  = d.getFullYear();
    return tag + "." + monat + "." + jahr;
}


// -----------------------------------------------------------
// Urkunde per html2canvas als PNG herunterladen.
// -----------------------------------------------------------
// html2canvas ist lokal in lib/html2canvas/ eingebunden und
// beim Seitenstart bereits geladen (defer). Der Download
// erfolgt komplett client-seitig – keine Netzwerk-Anfrage,
// nichts verlässt das Gerät.
// -----------------------------------------------------------
function urkundeAlsBildSpeichern(urkundeEl, name, datum, button) {

    if (typeof html2canvas !== "function") {
        console.error("html2canvas nicht verfügbar – Download abgebrochen.");
        alert("Bild-Export derzeit nicht möglich (html2canvas fehlt).");
        return;
    }

    // Dateiname: "Bohrmaschinenfuehrerschein_{Name}_{Datum}.png"
    // – Umlaute im Namen ersetzen, ungültige Zeichen bereinigen,
    // – Datum als YYYY-MM-DD (dateiname-tauglich, sortierbar).
    const nameSauber = dateinameSauber(name);
    const datumIso = datum.split(".").reverse().join("-");
    const dateiname = "Bohrmaschinenfuehrerschein_" +
                      nameSauber + "_" + datumIso + ".png";

    // UX: kurze Rückmeldung während des Renderns.
    const urText = button.textContent;
    button.disabled = true;
    button.textContent = "Speichere ...";

    html2canvas(urkundeEl, {
        backgroundColor: null,           // durchsichtig außerhalb der Urkunde
        scale: 2,                         // doppelte Auflösung für Druckqualität
        logging: false,
        useCORS: false                    // alle Ressourcen sind lokal/inline
    }).then(function (canvas) {
        canvas.toBlob(function (blob) {
            if (!blob) {
                throw new Error("Leerer Blob");
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = dateiname;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log("Urkunde gespeichert: " + dateiname);
        }, "image/png");
    }).catch(function (fehler) {
        console.error("Fehler beim Export:", fehler);
        alert("Beim Speichern ist ein Fehler aufgetreten.");
    }).finally(function () {
        button.disabled = false;
        button.textContent = urText;
    });
}


// -----------------------------------------------------------
// Dateiname-Bereinigung: Umlaute ersetzen, nur A-Z/a-z/0-9/_/-
// zulassen, mehrfache Unterstriche zusammenfassen.
// -----------------------------------------------------------
function dateinameSauber(rohName) {
    if (!rohName) return "Anonym";
    return rohName
        .replace(/ä/g, "ae").replace(/Ä/g, "Ae")
        .replace(/ö/g, "oe").replace(/Ö/g, "Oe")
        .replace(/ü/g, "ue").replace(/Ü/g, "Ue")
        .replace(/ß/g, "ss")
        .replace(/[^A-Za-z0-9_-]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
        || "Anonym";
}


// -----------------------------------------------------------
// "NOCHMAL SPIELEN"
// -----------------------------------------------------------
// Setzt den Spielzustand zurück, entfernt alle Finale-Elemente,
// stellt die roten Leuchten wieder her und blendet den Intro-
// Screen erneut ein. Ein F5-Reload ist jederzeit ebenfalls
// möglich (zusätzlicher Fallback).
// -----------------------------------------------------------
function nochmalSpielen() {

    // 1. State zurücksetzen (state.js).
    if (typeof resetState === "function") {
        resetState();
    }

    // 2. Panorama-Filter zurückstellen.
    const panorama = document.getElementById("panorama");
    if (panorama) {
        panorama.classList.remove("panorama--final");
        panorama.classList.remove("panorama--flicker");
    }

    // 3. Fortschrittsanzeige auf 0 setzen. (Die Status-Häkchen
    //    auf der Karte werden beim nächsten Öffnen des Notfall-
    //    protokoll-Modals neu aus dem State berechnet.)
    aktualisiereFortschritt();

    // 4. Finale-, Notfall-, Blackout- und Terminal-Elemente entfernen.
    document.querySelectorAll(
        ".finale-buehne, .finale-text-overlay, .modal-overlay, " +
        ".notfall-overlay, .blackout-overlay, .terminal-modal, " +
        ".umsehen-hinweis"
    ).forEach(function (el) {
        if (el.parentNode) el.parentNode.removeChild(el);
    });

    // 4b. Pannellum zurück auf das echte Werkstatt-Foto schalten,
    //     damit die Sequenz beim erneuten Start wieder von vorn
    //     mit dem Original-Bild beginnt.
    if (window.werkstattViewer &&
        typeof window.werkstattViewer.loadScene === "function") {
        try {
            window.werkstattViewer.loadScene("original", 0.8, -170.9, 100);
        } catch (e) {
            console.warn("nochmalSpielen: loadScene fehlgeschlagen", e);
        }
    }

    // 4c. Body-Klasse wieder setzen, damit Hotspots und
    //     Sicherheits-Checks-Anzeige in Phase 1–7 versteckt sind.
    document.body.classList.add("blackout-vor-spiel");

    // 5. Intro-Screen wieder einblenden und Eingabefeld leeren.
    const intro = document.getElementById("intro-screen");
    const nameInput = document.getElementById("player-name");
    const startBtn = document.getElementById("start-button");
    if (intro) {
        intro.style.display = "";
        intro.classList.remove("intro-screen--hidden");
    }
    if (nameInput) {
        nameInput.value = "";
        nameInput.focus();
    }
    if (startBtn) {
        startBtn.disabled = true;
    }

    console.log("Spiel zurückgesetzt.");
}


// starteFinale global verfügbar machen, damit state.js den Trigger
// beim Lösen des 6. Rätsels aufrufen kann.
window.starteFinale = starteFinale;


// ===========================================================
// INFO-TAFELN (zweite Hotspot-Schicht)
// ===========================================================
//
// Neben den 6 roten/grünen Rätsel-Leuchten gibt es 6 Info-
// Tafeln im Panorama. Sie sind visuell klar anders gestaltet
// (goldgelb, quadratisch, Buch-Symbol) und öffnen beim Klick
// ein großes Lern-Modal mit ausführlichen Texten.
//
// Die Tafeln sind jederzeit klickbar – auch unabhängig vom
// Spielfortschritt. Ein Rätsel-Modal muss vorher geschlossen
// werden, dann kann man in Ruhe nachlesen und das Rätsel
// anschließend erneut öffnen.
// ===========================================================


// -----------------------------------------------------------
// Info-Tafel-Hotspot erzeugen
// -----------------------------------------------------------
// Aufbau analog zur Sicherheits-Leuchte:
// Pannellum setzt das Positions-Transform auf hotSpotDiv –
// deshalb liegt die eigentliche Grafik (Quadrat + Icon) in
// einem inneren Element, damit Hover-Scale und ein sehr
// langsames "Atmen" nicht mit der Pannellum-Positionierung
// kollidieren.
// -----------------------------------------------------------
function infoTafelErstellen(hotSpotDiv, tafel) {

    hotSpotDiv.classList.add("info-hotspot-wrapper");

    // Inhalt holen, um Sonderfälle (z. B. deaktivierte Zoom-to-Wall-
    // Tafeln) rechtzeitig zu erkennen.
    const content = (typeof window.getInfoContent === "function")
        ? window.getInfoContent(tafel.id)
        : null;

    // Zoom-to-Wall-Tafeln: solange enabled:false gilt (z. B. weil das
    // echte 360°-Foto noch fehlt), wird kein Hotspot gerendert.
    if (content && content.type === "zoom-to-wall" && !content.enabled) {
        hotSpotDiv.style.display = "none";
        return;
    }

    // Aktive Zoom-to-Wall-Tafel: das PNG-Plakat wird direkt ins
    // Panorama eingebettet (als an der Wand hängendes Schild). Klick
    // fährt die Kamera heran (activateZoomToWall).
    if (content && content.type === "zoom-to-wall" && content.enabled) {
        const rahmen = document.createElement("div");
        rahmen.className = "ba-wand-rahmen";
        rahmen.dataset.infoId = tafel.id;
        rahmen.setAttribute("role", "button");
        rahmen.setAttribute("tabindex", "0");
        const hotspotLabel = content.hotspotLabel ||
                             (content.title
                                ? content.title + " – zum Heranzoomen klicken"
                                : "Infotafel – zum Heranzoomen klicken");
        rahmen.setAttribute("aria-label", hotspotLabel);
        rahmen.title = hotspotLabel;

        const bild = document.createElement("img");
        bild.className = "ba-wand-bild";
        bild.src = content.image;
        bild.alt = content.imageAlt ||
                   (content.title || "Wandaushang in der Werkstatt");
        bild.draggable = false;
        rahmen.appendChild(bild);

        // Lupen-Badge oben rechts als Interaktions-Hinweis.
        const lupe = document.createElement("span");
        lupe.className = "ba-wand-lupe";
        lupe.setAttribute("aria-hidden", "true");
        lupe.innerHTML =
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" ' +
                 'stroke="currentColor" stroke-width="2.4" ' +
                 'stroke-linecap="round">' +
              '<circle cx="10" cy="10" r="6"/>' +
              '<line x1="15" y1="15" x2="21" y2="21"/>' +
            '</svg>';
        rahmen.appendChild(lupe);

        hotSpotDiv.appendChild(rahmen);
        return;
    }

    // Video-Infotafel: unsichtbarer Klickbereich direkt auf dem
    // Computer-Bildschirm im Panorama. Kein Icon, nur ein dezent
    // pulsierender gelber Glow um den Bildschirm-Bereich, damit
    // der Spieler sieht "da leuchtet was".
    // Klick öffnet das YouTube-NoCookie-Modal (openVideoInfotafel).
    if (content && content.type === "video-embed") {
        const screen = document.createElement("div");
        screen.className = "video-wand-rahmen";
        screen.dataset.infoId = tafel.id;
        screen.setAttribute("role", "button");
        screen.setAttribute("tabindex", "0");
        screen.setAttribute("aria-label", "Video: Sicher bohren - Tutorial");
        screen.title = "Video: Sicher bohren - Tutorial";

        const icon = document.createElement("img");
        icon.className = "video-wand-icon";
        icon.src = "assets/play-icon-gold.png";
        icon.alt = "";
        icon.setAttribute("aria-hidden", "true");
        icon.draggable = false;
        screen.appendChild(icon);

        hotSpotDiv.appendChild(screen);
        return;
    }

    // ------- Standard-Info-Hotspot (goldgelbes Buch) -------
    const hotspot = document.createElement("div");
    hotspot.classList.add("info-hotspot");
    hotspot.dataset.infoId = tafel.id;
    hotspot.dataset.label  = "Info: " + tafel.topic;

    const icon = document.createElement("span");
    icon.className = "info-hotspot-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "i";
    hotspot.appendChild(icon);

    hotspot.setAttribute("role", "button");
    hotspot.setAttribute("tabindex", "0");
    hotspot.setAttribute("aria-label", "Info-Tafel: " + tafel.topic);

    hotSpotDiv.appendChild(hotspot);
}


// -----------------------------------------------------------
// openInfoPanel(id)
// -----------------------------------------------------------
// Baut das Info-Modal dynamisch auf und zeigt es an.
// Inhalte kommen aus window.getInfoContent(id) (infoContent.js).
// Schließbar per X-Button, Escape-Taste und Klick auf den
// Overlay-Hintergrund außerhalb des Panels.
// -----------------------------------------------------------
function openInfoPanel(id) {

    // Doppel-Öffnung verhindern.
    if (document.querySelector(".info-modal")) {
        return;
    }

    const content = (typeof window.getInfoContent === "function")
        ? window.getInfoContent(id)
        : null;

    if (!content) {
        console.error("openInfoPanel: kein Inhalt für " + id);
        return;
    }

    // Zoom-to-Wall-Tafeln öffnen kein Modal, sondern fahren die
    // Kamera zur Wand. Solange enabled:false gilt, passiert nichts –
    // der Hotspot wird ohnehin nicht gerendert.
    if (content.type === "zoom-to-wall") {
        if (content.enabled) {
            activateZoomToWall(id);
        }
        return;
    }

    // Video-Embed-Tafeln bekommen ein eigenes, kompaktes Video-Modal.
    if (content.type === "video-embed") {
        openVideoInfotafel(id);
        return;
    }

    // Overlay (dunkler, halbtransparenter Hintergrund).
    const overlay = document.createElement("div");
    overlay.className = "info-modal";

    // Panel (heller Lesehintergrund).
    const panel = document.createElement("div");
    panel.className = "info-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "info-panel-titel");

    // Fixe Kopfzeile: Titel + X-Schließen.
    const header = document.createElement("div");
    header.className = "info-panel-header";

    const titel = document.createElement("h2");
    titel.id = "info-panel-titel";
    titel.className = "info-panel-titel";
    titel.textContent = content.title;

    const xSchliessen = document.createElement("button");
    xSchliessen.type = "button";
    xSchliessen.className = "info-panel-close";
    xSchliessen.setAttribute("aria-label", "Info-Tafel schließen");
    xSchliessen.textContent = "\u00D7"; // ×

    header.appendChild(titel);
    header.appendChild(xSchliessen);

    // Scrollbarer Inhaltsbereich.
    const body = document.createElement("div");
    body.className = "info-panel-body";

    // Gibt es einen spezialisierten Renderer (z. B. für Tafel 1
    // mit interaktiver SVG und Bauteil-Cards)? Dann übernimmt er
    // den Aufbau des Body-Elements. Ansonsten greift das generische
    // Abschnitts-Rendering darunter.
    const customInfoRenderer =
        (window.infoRenderer && window.infoRenderer[id]) || null;

    if (customInfoRenderer) {
        try {
            customInfoRenderer(body);
        } catch (fehler) {
            console.error("Info-Renderer-Fehler:", fehler);
        }
    } else {
    // Abschnitte rendern (generisch).
    (content.sections || []).forEach(function (sec) {
        if (sec.heading) {
            const h = document.createElement("h3");
            h.className = "info-panel-heading";
            h.textContent = sec.heading;
            body.appendChild(h);
        }
        if (Array.isArray(sec.paragraphs)) {
            sec.paragraphs.forEach(function (text) {
                const p = document.createElement("p");
                p.className = "info-panel-absatz";
                p.textContent = text;
                body.appendChild(p);
            });
        }
        if (Array.isArray(sec.list)) {
            const ul = document.createElement("ul");
            ul.className = "info-panel-liste";
            sec.list.forEach(function (eintrag) {
                const li = document.createElement("li");
                li.textContent = eintrag;
                ul.appendChild(li);
            });
            body.appendChild(ul);
        }
    });
    }

    // Fixer Fuß: Tastatur-Hinweis.
    const footer = document.createElement("div");
    footer.className = "info-panel-footer";
    footer.textContent = "Tipp: Mit Escape-Taste schließen";

    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // -----------------------------------------------------
    // Schließ-Logik
    // -----------------------------------------------------
    function escHandler(e) {
        if (e.key === "Escape") schliesseJetzt();
    }
    function schliesseJetzt() {
        overlay.classList.add("info-modal--fade-out");
        document.removeEventListener("keydown", escHandler);
        setTimeout(function () {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 300);
    }

    document.addEventListener("keydown", escHandler);
    xSchliessen.addEventListener("click", schliesseJetzt);
    overlay.addEventListener("click", function (e) {
        if (e.target === overlay) schliesseJetzt();
    });

    // Fade-In: zuerst DOM einfügen, dann im nächsten Frame die
    // sichtbar-Klasse setzen, damit die Transition greift.
    requestAnimationFrame(function () {
        overlay.classList.add("info-modal--sichtbar");
        // Fokus auf den Schließen-Button für Tastatur-Bedienung.
        xSchliessen.focus();
    });
}

// Global verfügbar (z. B. für Debugging in der Konsole).
window.openInfoPanel = openInfoPanel;


// ===========================================================
// openInfoTafelOverlay(id)
// -----------------------------------------------------------
// Variante für Aufrufe AUS einem Rätsel heraus (z. B. über das
// Hilfesystem). Die Info-Tafel erscheint als Overlay innerhalb
// der Spielfläche – das Rätsel-Modal bleibt im Hintergrund
// vollständig offen. Schließen über X-Button oder Escape; beim
// Schließen sind alle bisherigen Eingaben im Rätsel unverändert
// erhalten, weil das Rätsel-Modal nie zerstört wurde.
//
// Unterstützt alle drei Tafel-Typen aus infoContent.js:
//   – Standard-Sektionen (oder custom infoRenderer)
//   – zoom-to-wall (zeigt das Plakat-Bild)
//   – video-embed (zeigt das eingebettete Video)
// ===========================================================
function openInfoTafelOverlay(id) {

    if (document.querySelector(".info-tafel-overlay")) {
        return;
    }

    const content = (typeof window.getInfoContent === "function")
        ? window.getInfoContent(id)
        : null;
    if (!content) {
        console.error("openInfoTafelOverlay: kein Inhalt für " + id);
        return;
    }

    // Backdrop + zentriertes Panel.
    const overlay = document.createElement("div");
    overlay.className = "info-tafel-overlay";

    const panel = document.createElement("div");
    panel.className = "info-tafel-overlay-panel info-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "info-tafel-overlay-titel");
    panel.addEventListener("click", function (ev) { ev.stopPropagation(); });

    // Header (Titel + X).
    const header = document.createElement("div");
    header.className = "info-panel-header";

    const titel = document.createElement("h2");
    titel.id = "info-tafel-overlay-titel";
    titel.className = "info-panel-titel";
    titel.textContent = content.title || "";
    header.appendChild(titel);

    const xBtn = document.createElement("button");
    xBtn.type = "button";
    xBtn.className = "info-panel-close";
    xBtn.setAttribute("aria-label", "Info-Tafel schließen");
    xBtn.textContent = "×"; // ×
    header.appendChild(xBtn);

    panel.appendChild(header);

    // Body abhängig vom Tafel-Typ.
    const body = document.createElement("div");
    body.className = "info-panel-body";

    if (content.type === "zoom-to-wall") {
        const bild = document.createElement("img");
        bild.src = content.image;
        bild.alt = content.imageAlt || content.title || "";
        bild.className = "info-tafel-overlay-bild";
        bild.draggable = false;
        body.appendChild(bild);
    } else if (content.type === "video-embed") {
        const wrap = document.createElement("div");
        wrap.className = "info-tafel-overlay-video-wrap";
        const iframe = document.createElement("iframe");
        iframe.className = "video-modal-iframe";
        iframe.src = content.embedUrl;
        iframe.title = content.title || "";
        iframe.loading = "lazy";
        iframe.allow = "accelerometer; clipboard-write; encrypted-media; " +
                       "gyroscope; picture-in-picture";
        iframe.setAttribute("allowfullscreen", "");
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("referrerpolicy",
                           "strict-origin-when-cross-origin");
        wrap.appendChild(iframe);
        body.appendChild(wrap);

        if (content.attribution) {
            const sub = document.createElement("p");
            sub.className = "video-modal-attribution";
            sub.textContent = content.attribution;
            body.appendChild(sub);
        }
    } else {
        // Standard: custom Renderer oder generische Sektionen.
        const customRenderer =
            (window.infoRenderer && window.infoRenderer[id]) || null;
        if (customRenderer) {
            try { customRenderer(body); }
            catch (e) { console.error("Info-Renderer-Fehler:", e); }
        } else {
            (content.sections || []).forEach(function (sec) {
                if (sec.heading) {
                    const h = document.createElement("h3");
                    h.className = "info-panel-heading";
                    h.textContent = sec.heading;
                    body.appendChild(h);
                }
                if (Array.isArray(sec.paragraphs)) {
                    sec.paragraphs.forEach(function (text) {
                        const p = document.createElement("p");
                        p.className = "info-panel-absatz";
                        p.textContent = text;
                        body.appendChild(p);
                    });
                }
                if (Array.isArray(sec.list)) {
                    const ul = document.createElement("ul");
                    ul.className = "info-panel-liste";
                    sec.list.forEach(function (eintrag) {
                        const li = document.createElement("li");
                        li.textContent = eintrag;
                        ul.appendChild(li);
                    });
                    body.appendChild(ul);
                }
            });
        }
    }

    panel.appendChild(body);

    // Footer mit Tastatur-Hinweis (kein Zurück-Button mehr nötig –
    // das Rätsel liegt bereits im Hintergrund).
    const footer = document.createElement("div");
    footer.className = "info-panel-footer";
    const tippText = document.createElement("span");
    tippText.className = "info-panel-footer-tipp";
    tippText.textContent = "Tipp: Mit Escape-Taste schließen";
    footer.appendChild(tippText);
    panel.appendChild(footer);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Schließ-Logik.
    function escHandler(e) {
        if (e.key === "Escape") {
            e.stopPropagation();
            schliesseJetzt();
        }
    }
    function schliesseJetzt() {
        overlay.classList.add("info-tafel-overlay--fade-out");
        document.removeEventListener("keydown", escHandler, true);
        setTimeout(function () {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 300);
    }
    // Capture-Phase, damit Escape hier zuerst greift (noch vor
    // Escape-Handlern des darunterliegenden Rätsel-Modals).
    document.addEventListener("keydown", escHandler, true);
    xBtn.addEventListener("click", schliesseJetzt);
    overlay.addEventListener("click", function (ev) {
        if (ev.target === overlay) schliesseJetzt();
    });

    requestAnimationFrame(function () {
        overlay.classList.add("info-tafel-overlay--sichtbar");
        xBtn.focus();
    });
}

window.openInfoTafelOverlay = openInfoTafelOverlay;


// ===========================================================
// ZOOM-TO-WALL – Infrastruktur (Phase 1, deaktiviert)
// -----------------------------------------------------------
// Ersetzt den früheren Bild-Viewer für Tafel 3. Sobald das echte
// 360°-Foto des PH-Technikraums vorliegt, hängt der BA-Aushang
// an einer Wand im Panorama. Ein Klick auf den zugehörigen
// Hotspot soll die Kamera per Pannellum-API sanft zur Wand
// zoomen, damit das Plakat scharf lesbar ist. Rücksprung zur
// Ursprungsposition per Escape oder X-Button.
//
// Aktuell ist die Funktion *vorbereitet*, aber nicht aktiv:
// in infoContent.js steht enabled:false, die Hotspots werden
// in infoTafelErstellen übersprungen und openInfoPanel ruft
// activateZoomToWall nur auf, wenn enabled:true gesetzt wird.
// ===========================================================

// Merkt sich die Kamera-Lage VOR dem Zoom, damit deactivate-
// ZoomToWall punktgenau zurückfahren kann. Zusätzlich ein
// Handle auf den aktiven Escape-Listener, damit er beim
// Schließen wieder abgemeldet wird.
let zoomToWallState = null;

function activateZoomToWall(tafelId) {

    // Doppelstart verhindern.
    if (zoomToWallState) return;

    const viewer = window.werkstattViewer;
    const content = (typeof window.getInfoContent === "function")
        ? window.getInfoContent(tafelId) : null;
    if (!viewer || !content || content.type !== "zoom-to-wall") return;

    // Ohne Ziel-Koordinaten (targetYaw/Pitch) ist der Zoom
    // sinnlos – das ist der Fall, solange das echte Foto fehlt.
    if (content.targetYaw == null || content.targetPitch == null) {
        console.warn("activateZoomToWall: keine Ziel-Koordinaten für " +
                     tafelId + " – Aktion abgebrochen.");
        return;
    }

    const dauer = typeof content.animationDuration === "number"
        ? content.animationDuration : 600;
    const zielHfov = typeof content.targetHfov === "number"
        ? content.targetHfov : 30;

    // Aktuelle Kameraposition speichern (für Rücksprung).
    zoomToWallState = {
        tafelId:   tafelId,
        startYaw:  viewer.getYaw(),
        startPitch: viewer.getPitch(),
        startHfov: viewer.getHfov(),
        escHandler: null,
        vignette:   null,
        button:     null,
        overlayBild: null,
        overlayTimer: null
    };

    // Pannellum-Interaktion sperren (keine Drag-/Scroll-Steuerung
    // während der Zoom-Ansicht).
    if (typeof viewer.setMouseZoom === "function") viewer.setMouseZoom(false);
    if (typeof viewer.setDraggable === "function") viewer.setDraggable(false);

    // Sanfte Kamerafahrt zur Wand.
    viewer.lookAt(content.targetPitch, content.targetYaw, zielHfov, dauer, "easeInOutQuad");

    // Dezente Vignette über das Panorama (fokussiert das Auge
    // auf die Bildmitte, wo das Plakat gleich scharf wird).
    const vignette = document.createElement("div");
    vignette.className = "zoom-to-wall-vignette";
    document.body.appendChild(vignette);
    zoomToWallState.vignette = vignette;

    // Kleiner X-Button oben rechts, um wieder auszuzoomen.
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "zoom-to-wall-close";
    btn.setAttribute("aria-label", "Zoom beenden und zurück zur Übersicht");
    btn.title = "Zurück (Escape)";
    btn.textContent = "\u00D7";
    btn.addEventListener("click", deactivateZoomToWall);
    document.body.appendChild(btn);
    zoomToWallState.button = btn;

    // Escape schließt ebenfalls.
    function escHandler(e) {
        if (e.key === "Escape") deactivateZoomToWall();
    }
    document.addEventListener("keydown", escHandler);
    zoomToWallState.escHandler = escHandler;

    // Klick auf die Vignette (außerhalb des Plakats) schließt.
    vignette.style.pointerEvents = "auto";
    vignette.addEventListener("click", function (e) {
        if (e.target === vignette) deactivateZoomToWall();
    });

    // Hochauflösendes Overlay-Bild vorbereiten – wird erst nach Ende
    // der Kamerafahrt eingeblendet, damit es nicht durch Panorama-
    // Textur-Skalierung weichgezeichnet wirkt.
    const overlayBild = document.createElement("img");
    overlayBild.className = "zoom-to-wall-bild";
    overlayBild.src = content.image;
    overlayBild.alt = "Betriebsanweisung fuer das Arbeiten an " +
                      "Staenderbohrmaschinen - offizieller Schulaushang";
    overlayBild.draggable = false;
    document.body.appendChild(overlayBild);
    zoomToWallState.overlayBild = overlayBild;

    // Fade-In im nächsten Frame (CSS-Transition greift sonst nicht).
    requestAnimationFrame(function () {
        vignette.classList.add("zoom-to-wall-vignette--sichtbar");
        btn.classList.add("zoom-to-wall-close--sichtbar");
        btn.focus();
    });

    // Am Ende der Kamerafahrt das scharfe Plakat einblenden.
    zoomToWallState.overlayTimer = setTimeout(function () {
        if (zoomToWallState && zoomToWallState.overlayBild) {
            zoomToWallState.overlayBild.classList.add("zoom-to-wall-bild--sichtbar");
        }
    }, dauer);
}

function deactivateZoomToWall() {

    if (!zoomToWallState) return;
    const viewer = window.werkstattViewer;
    const s = zoomToWallState;

    // Rücksprung zur gespeicherten Kameraposition.
    if (viewer && typeof viewer.lookAt === "function") {
        viewer.lookAt(s.startPitch, s.startYaw, s.startHfov, 600, "easeInOutQuad");
    }

    // Panorama-Interaktion wieder freigeben.
    if (viewer && typeof viewer.setMouseZoom === "function") viewer.setMouseZoom(true);
    if (viewer && typeof viewer.setDraggable === "function") viewer.setDraggable(true);

    // Escape-Listener abmelden.
    if (s.escHandler) {
        document.removeEventListener("keydown", s.escHandler);
    }

    // Noch anstehenden Overlay-Einblend-Timer abbrechen, falls
    // Nutzer ganz schnell wieder schließt.
    if (s.overlayTimer) {
        clearTimeout(s.overlayTimer);
    }

    // Overlay-Elemente ausblenden und nach Fade-Out entfernen.
    // Scharfes Plakat zuerst ausblenden (damit die Rückfahrt
    // direkt das Panorama zeigt, nicht das stehende Standbild).
    if (s.overlayBild) {
        s.overlayBild.classList.remove("zoom-to-wall-bild--sichtbar");
    }
    if (s.vignette) {
        s.vignette.classList.remove("zoom-to-wall-vignette--sichtbar");
    }
    if (s.button) {
        s.button.classList.remove("zoom-to-wall-close--sichtbar");
    }
    setTimeout(function () {
        if (s.vignette && s.vignette.parentNode) {
            s.vignette.parentNode.removeChild(s.vignette);
        }
        if (s.button && s.button.parentNode) {
            s.button.parentNode.removeChild(s.button);
        }
        if (s.overlayBild && s.overlayBild.parentNode) {
            s.overlayBild.parentNode.removeChild(s.overlayBild);
        }
    }, 300);

    zoomToWallState = null;
}

// Für manuellen Aufruf / Debug in der Konsole.
window.activateZoomToWall   = activateZoomToWall;
window.deactivateZoomToWall = deactivateZoomToWall;


// ===========================================================
// openVideoInfotafel(tafelId)
// -----------------------------------------------------------
// Video-Infotafel-Modal (separat vom normalen Info-Panel und
// vom Zoom-to-Wall). Zeigt ein eingebettetes YouTube-Video
// ueber youtube-nocookie.com. DSGVO-konform: es werden erst
// Requests an Googles Server gesendet, wenn der Nutzer
// tatsaechlich auf Play klickt.
//
// Schliessen:
//   - X-Button oben rechts
//   - Escape-Taste
//   - Klick auf den halbtransparenten Hintergrund
// ===========================================================
function openVideoInfotafel(tafelId) {
    // Doppel-Öffnung verhindern.
    if (document.querySelector(".video-modal")) return;

    const content = (typeof window.getInfoContent === "function")
        ? window.getInfoContent(tafelId)
        : null;
    if (!content || content.type !== "video-embed") {
        console.warn("openVideoInfotafel: keine Video-Tafel für " + tafelId);
        return;
    }

    // Overlay (dunkler Hintergrund, schließt bei Klick).
    const overlay = document.createElement("div");
    overlay.className = "video-modal";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "video-modal-titel");

    // Panel (dunkler Container).
    const panel = document.createElement("div");
    panel.className = "video-modal-panel";
    panel.addEventListener("click", function (ev) { ev.stopPropagation(); });

    // Kopfzeile: Titel + X-Button.
    const header = document.createElement("div");
    header.className = "video-modal-header";

    const titelBox = document.createElement("div");
    titelBox.className = "video-modal-titel-box";

    const titel = document.createElement("h2");
    titel.id = "video-modal-titel";
    titel.className = "video-modal-titel";
    titel.textContent = content.title;
    titelBox.appendChild(titel);

    const sub = document.createElement("p");
    sub.className = "video-modal-attribution";
    sub.textContent = content.attribution;
    titelBox.appendChild(sub);

    const xBtn = document.createElement("button");
    xBtn.type = "button";
    xBtn.className = "video-modal-x";
    xBtn.setAttribute("aria-label", "Video schließen");
    xBtn.textContent = "\u2715";
    xBtn.addEventListener("click", schliessen);

    header.appendChild(titelBox);
    header.appendChild(xBtn);
    panel.appendChild(header);

    // Video-Wrapper mit 16:9-Verhältnis.
    const wrap = document.createElement("div");
    wrap.className = "video-modal-wrap";

    const iframe = document.createElement("iframe");
    iframe.className = "video-modal-iframe";
    iframe.src = content.embedUrl;
    iframe.title = content.title;
    iframe.loading = "lazy";
    iframe.allow = "accelerometer; clipboard-write; encrypted-media; " +
                   "gyroscope; picture-in-picture";
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    wrap.appendChild(iframe);
    panel.appendChild(wrap);

    overlay.appendChild(panel);

    // Klick auf das Overlay (außerhalb des Panels) schließt.
    overlay.addEventListener("click", function (ev) {
        if (ev.target === overlay) schliessen();
    });

    // Escape schließt.
    function escHandler(ev) {
        if (ev.key === "Escape") schliessen();
    }
    document.addEventListener("keydown", escHandler);

    function schliessen() {
        document.removeEventListener("keydown", escHandler);
        // iframe src leeren, damit das Video wirklich stoppt
        // (einige Browser laufen sonst im Hintergrund weiter).
        iframe.src = "about:blank";
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    document.body.appendChild(overlay);

    // Fokus auf X-Button, damit Tab-Navigation sofort greift.
    setTimeout(function () { xBtn.focus(); }, 0);
}

window.openVideoInfotafel = openVideoInfotafel;


