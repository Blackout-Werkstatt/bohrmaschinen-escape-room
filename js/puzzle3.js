/* ===========================================================
   Werkstatt-Blackout – puzzle3.js
   -----------------------------------------------------------
   Rätsel 3 "Persönliche Schutzausrüstung" – Spind-vs-Maschine.

   Binäre Sortierung: Jedes der 10 Items landet entweder im
   SPIND (links: vor dem Bohren ablegen) oder an der MASCHINE
   (rechts: bei der Arbeit tragen). Keine Körperzonen, kein
   Ankleide-Puzzle – die pädagogische Kernbotschaft ist „Was
   muss weg? Was muss dran?“.

   Pädagogisches Design (analog Rätsel 1):
   - Kein Sofort-Feedback, sondern zentraler Prüfen-Button.
   - Jeder mögliche Fehler hat einen Erklärtext mit BA-Bezug.
   - Ab 3 Fehlversuchen: Tipp-Box mit BA-Sprung-Button.
   - Ab 6 Fehlversuchen: Telefon-Hilfe.
   - Zwischenstand in puzzle.draftAssignments erhalten, damit
     der Spieler die Betriebsanweisung aufrufen kann, ohne
     Fortschritt zu verlieren.
   =========================================================== */

"use strict";

window.puzzleRenderer = window.puzzleRenderer || {};


(function () {

    // -------------------------------------------------------
    // Die 10 Items.
    //   korrekt: "links"  → in den Spind (ablegen)
    //   korrekt: "rechts" → an die Maschine (tragen)
    // -------------------------------------------------------
    const ITEMS = [
        // RECHTS – Schutzausrüstung, die bei der Arbeit getragen wird.
        { id: "schutzbrille",            label: "Schutzbrille",       icon: "🥽",  korrekt: "rechts" },
        { id: "haargummi",               label: "Haargummi",          icon: "➰",  korrekt: "rechts" },
        { id: "eng-anliegende-kleidung", label: "Eng anliegende Kleidung", icon: "👕",  korrekt: "rechts" },
        { id: "geeignetes-schuhwerk",    label: "Geeignetes Schuhwerk",icon: "🥾",  korrekt: "rechts" },
        // LINKS – Dinge, die in den Spind gehören.
        { id: "handschuhe",              label: "Handschuhe",         icon: "🧤",  korrekt: "links"  },
        { id: "schal",                   label: "Schal",              icon: "🧣",  korrekt: "links"  },
        { id: "armbanduhr",              label: "Armbanduhr",         icon: "⌚",  korrekt: "links"  },
        { id: "ring",                    label: "Ring",               icon: "💍",  korrekt: "links"  },
        { id: "halskette",               label: "Halskette",          icon: "📿",  korrekt: "links"  },
        { id: "kapuzenpulli",            label: "Kapuzenpulli",       icon: "🧥",  korrekt: "links"  }
    ];

    // -------------------------------------------------------
    // Feedback-Texte für falsche Zuordnungen. Schlüssel:
    //   "itemId@seite" – seite ist die FALSCHE Seite (links/rechts).
    // -------------------------------------------------------
    const FEEDBACK = {
        "handschuhe@rechts":
            "Die Betriebsanweisung sagt klar: Handschuhe dürfen bei " +
            "Arbeiten an Bohrmaschinen NICHT getragen werden. Sie können " +
            "vom drehenden Bohrer erfasst werden. Handschuhe gehören " +
            "in den Spind.",
        "schal@rechts":
            "Lose Kleidung, Schals und Kordeln können von der Spindel " +
            "erfasst werden. Die BA sagt: eng anliegende Kleidung tragen. " +
            "Schal ab in den Spind.",
        "kapuzenpulli@rechts":
            "Lose Kleidung, Schals und Kordeln können von der Spindel " +
            "erfasst werden. Die BA sagt: eng anliegende Kleidung tragen. " +
            "Der Kapuzenpulli gehört in den Spind.",
        "armbanduhr@rechts":
            "Die BA fordert: Armbanduhren, Hand- und Armschmuck, Ketten " +
            "und Uhren ablegen. Schmuck kann vom Werkzeug erfasst werden.",
        "ring@rechts":
            "Die BA fordert: Armbanduhren, Hand- und Armschmuck, Ketten " +
            "und Uhren ablegen. Ein Ring kann vom Werkzeug erfasst werden.",
        "halskette@rechts":
            "Die BA fordert: Armbanduhren, Hand- und Armschmuck, Ketten " +
            "und Uhren ablegen. Eine Halskette kann vom Werkzeug erfasst werden.",
        // Schutzausrüstung im Spind → pädagogisch „weggesperrt“.
        "schutzbrille@links":
            "Das ist doch wichtige Schutzausrüstung! Die Schutzbrille " +
            "gehört an den Körper, nicht in den Spind.",
        "haargummi@links":
            "Das ist doch wichtige Schutzausrüstung! Der Haargummi " +
            "gehört an den Körper, nicht in den Spind.",
        "eng-anliegende-kleidung@links":
            "Das ist doch wichtige Schutzausrüstung! Eng anliegende " +
            "Kleidung gehört an den Körper, nicht in den Spind.",
        "geeignetes-schuhwerk@links":
            "Das ist doch wichtige Schutzausrüstung! Geeignetes Schuhwerk " +
            "gehört an den Körper, nicht in den Spind."
    };

    const SCHWELLE_BA      = 3;
    const SCHWELLE_TELEFON = 6;


    // -------------------------------------------------------
    // Platzhalter-SVGs für die beiden Drop-Zonen.
    // Werden später durch echte Fotos ersetzt (siehe style.css,
    // background-image auf .p3-zone-bild).
    // -------------------------------------------------------
    const SVG_SPIND =
        '<svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" ' +
        'aria-hidden="true" class="p3-zone-svg">' +
        // Rückwand/Korpus
        '<rect x="20" y="15" width="120" height="190" rx="4" ' +
            'fill="#3B4A59" stroke="#0F1419" stroke-width="2"/>' +
        // Türflügel geöffnet, schräg
        '<path d="M 140 15 L 175 35 L 175 205 L 140 205 Z" ' +
            'fill="#4A5A6B" stroke="#0F1419" stroke-width="2"/>' +
        // Innenraum-Höhe: Hutablage
        '<line x1="25" y1="45" x2="140" y2="45" stroke="#0F1419" stroke-width="1.5"/>' +
        // Kleiderstange
        '<line x1="30" y1="65" x2="135" y2="65" stroke="#9CA3AF" stroke-width="2"/>' +
        // Kleiderbügel
        '<path d="M 70 65 L 60 80 L 80 80 Z" fill="none" stroke="#9CA3AF" stroke-width="1.5"/>' +
        '<path d="M 100 65 L 90 80 L 110 80 Z" fill="none" stroke="#9CA3AF" stroke-width="1.5"/>' +
        // Fachboden unten
        '<line x1="25" y1="160" x2="140" y2="160" stroke="#0F1419" stroke-width="1.5"/>' +
        // Türgriff
        '<circle cx="155" cy="110" r="3" fill="#9CA3AF"/>' +
        // Lüftungsschlitze
        '<line x1="55" y1="30" x2="105" y2="30" stroke="#0F1419" stroke-width="1"/>' +
        '<line x1="55" y1="34" x2="105" y2="34" stroke="#0F1419" stroke-width="1"/>' +
        '<line x1="55" y1="38" x2="105" y2="38" stroke="#0F1419" stroke-width="1"/>' +
        '</svg>';

    const SVG_MASCHINE =
        '<svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" ' +
        'aria-hidden="true" class="p3-zone-svg">' +
        // Bohrmaschinen-Silhouette
        // Fuß
        '<rect x="70" y="185" width="80" height="18" rx="2" ' +
            'fill="#5C4A3A" stroke="#1A0E06" stroke-width="1.5"/>' +
        // Säule
        '<rect x="100" y="50" width="14" height="135" ' +
            'fill="#5C4A3A" stroke="#1A0E06" stroke-width="1.5"/>' +
        // Kopf
        '<rect x="75" y="30" width="55" height="30" rx="3" ' +
            'fill="#5C4A3A" stroke="#1A0E06" stroke-width="1.5"/>' +
        // Bohrfutter
        '<rect x="93" y="60" width="14" height="18" ' +
            'fill="#9CA3AF" stroke="#1A0E06" stroke-width="1.5"/>' +
        // Bohrer
        '<path d="M 98 78 L 102 78 L 102 92 L 100 96 L 98 92 Z" ' +
            'fill="#1A0E06"/>' +
        // Bohrtisch
        '<rect x="70" y="130" width="60" height="8" ' +
            'fill="#5C4A3A" stroke="#1A0E06" stroke-width="1.5"/>' +
        // Person links daneben (vereinfacht)
        '<circle cx="35" cy="80" r="12" fill="#F4E8D3" ' +
            'stroke="#1A0E06" stroke-width="1.5"/>' +
        '<path d="M 22 95 L 48 95 L 48 155 L 42 155 L 42 195 ' +
            'L 28 195 L 28 155 L 22 155 Z" fill="#F4E8D3" ' +
            'stroke="#1A0E06" stroke-width="1.5"/>' +
        // Arm zur Maschine
        '<path d="M 48 105 L 85 130 L 82 135 L 45 112 Z" ' +
            'fill="#F4E8D3" stroke="#1A0E06" stroke-width="1.5"/>' +
        '</svg>';


    // -------------------------------------------------------
    // Fisher-Yates-Mischung.
    // -------------------------------------------------------
    function mischen(feld) {
        const k = feld.slice();
        for (let i = k.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = k[i]; k[i] = k[j]; k[j] = t;
        }
        return k;
    }


    // -------------------------------------------------------
    // State-Helfer: Draft + Fehlversuche.
    // draftAssignments = { itemId: "links" | "rechts" | "pool" }
    // -------------------------------------------------------
    function holeOderInitZustand() {
        const p = (typeof getPuzzle === "function") ? getPuzzle(3) : null;
        if (!p) return null;
        if (!p.draftAssignments || typeof p.draftAssignments !== "object") {
            p.draftAssignments = {};
        }
        if (typeof p.failedChecks !== "number") {
            p.failedChecks = 0;
        }
        return p;
    }


    // =======================================================
    // RENDERER
    // =======================================================
    window.puzzleRenderer[3] = function rendern(inhaltEl, schliesseModal) {

        inhaltEl.innerHTML = "";
        inhaltEl.classList.add("modal-inhalt--puzzle");

        const puzzleState = holeOderInitZustand();
        if (!puzzleState) return;


        // ---------- Aufgabenstellung ----------
        const aufgabe = document.createElement("p");
        aufgabe.className = "p3-aufgabe";
        aufgabe.textContent =
            "Was kommt vor dem Bohren in den Spind – und was muss an " +
            "der Maschine am Körper bleiben? Zieh jedes Teil auf die " +
            "richtige Seite und klicke auf „PRÜFEN“.";
        inhaltEl.appendChild(aufgabe);

        // Tipp-Box oben (wird ab 3 Fehlversuchen sichtbar).
        const tippBox = document.createElement("div");
        tippBox.className = "p3-tipp p3-tipp--versteckt";
        inhaltEl.appendChild(tippBox);


        // ---------- Haupt-Layout (3 Spalten) ----------
        const layout = document.createElement("div");
        layout.className = "p3-layout";

        // --- LINKS: Spind-Drop-Zone ---
        // Platzhalter-Bilder, werden später durch echte Fotos ersetzt
        // (assets/raetsel3/spind.jpg und assets/raetsel3/person-an-maschine.jpg).
        const zoneLinks = dropZoneBauen({
            seite:  "links",
            titel:  "IN DEN SPIND",
            unter:  "vor dem Bohren ablegen",
            svg:    SVG_SPIND,
            bildAlt: "Offener Werkstattspind mit Kleiderstange – Ablage vor Beginn der Arbeit."
        });
        layout.appendChild(zoneLinks);

        // --- MITTE: Item-Pool ---
        const poolWrap = document.createElement("div");
        poolWrap.className = "p3-pool-wrap";
        const poolTitel = document.createElement("div");
        poolTitel.className = "p3-pool-titel";
        poolTitel.textContent = "AUSRÜSTUNG UND SACHEN";
        poolWrap.appendChild(poolTitel);
        const pool = document.createElement("div");
        pool.className = "p3-pool";
        pool.dataset.seite = "pool";
        pool.setAttribute("role", "region");
        pool.setAttribute("aria-label",
            "Pool mit noch nicht zugeordneten Teilen");
        poolWrap.appendChild(pool);
        layout.appendChild(poolWrap);

        // --- RECHTS: Maschinen-Drop-Zone ---
        const zoneRechts = dropZoneBauen({
            seite:  "rechts",
            titel:  "ZUR MASCHINE",
            unter:  "bei der Arbeit tragen",
            svg:    SVG_MASCHINE,
            bildAlt: "Person an einer Ständerbohrmaschine – bei der Arbeit tragen."
        });
        layout.appendChild(zoneRechts);

        inhaltEl.appendChild(layout);


        // ---------- BA-Hilfe-Leiste ----------
        const hilfe = document.createElement("div");
        hilfe.className = "p3-hilfe";

        const hilfeTitel = document.createElement("span");
        hilfeTitel.className = "p3-hilfe-titel";
        hilfeTitel.textContent = "Hilfe:";
        hilfe.appendChild(hilfeTitel);

        const hilfeText = document.createElement("span");
        hilfeText.className = "p3-hilfe-text";
        hilfeText.textContent =
            "In der Werkstatt hängt eine Betriebsanweisung. " +
            "Dort findest du alle Regeln.";
        hilfe.appendChild(hilfeText);

        const baBtn = document.createElement("button");
        baBtn.type = "button";
        baBtn.className = "p3-ba-btn";
        baBtn.textContent = "Betriebsanweisung aufrufen";
        baBtn.addEventListener("click", betriebsanweisungOeffnen);
        hilfe.appendChild(baBtn);

        inhaltEl.appendChild(hilfe);


        // ---------- Feedback-Bereich ----------
        const feedbackBox = document.createElement("div");
        feedbackBox.className = "p3-feedback";
        feedbackBox.setAttribute("role", "status");
        feedbackBox.setAttribute("aria-live", "polite");
        inhaltEl.appendChild(feedbackBox);


        // ---------- Footer: Prüfen + Telefon ----------
        const footerZiel = inhaltEl._footer || inhaltEl;

        const meldung = document.createElement("div");
        meldung.className = "p1-meldung";
        meldung.setAttribute("role", "status");
        meldung.setAttribute("aria-live", "polite");
        footerZiel.appendChild(meldung);

        // Einheitlicher Hilfe-Slot (js/hilfe.js).
        const telefonBox = document.createElement("div");
        telefonBox.className = "hilfe-slot";
        footerZiel.appendChild(telefonBox);

        const pruefenZeile = document.createElement("div");
        pruefenZeile.className = "p1-pruefen-zeile";
        const pruefenHinweis = document.createElement("span");
        pruefenHinweis.className = "p1-pruefen-hinweis";
        pruefenHinweis.textContent =
            "Sortiere alle Teile und klicke dann auf PRÜFEN.";
        const pruefenBtn = document.createElement("button");
        pruefenBtn.type = "button";
        pruefenBtn.className = "p1-pruefen-btn";
        pruefenBtn.textContent = "PRÜFEN";
        pruefenBtn.addEventListener("click", antwortenPruefen);
        pruefenZeile.appendChild(pruefenHinweis);
        pruefenZeile.appendChild(pruefenBtn);
        footerZiel.appendChild(pruefenZeile);


        // ---------- Pool befüllen (gemischt) ----------
        const reihenfolge = mischen(ITEMS.map(function (i) { return i.id; }));
        reihenfolge.forEach(function (id) {
            pool.appendChild(chipErstellen(itemById(id)));
        });

        // Zwischenstand zurückspielen.
        Object.keys(puzzleState.draftAssignments).forEach(function (itemId) {
            const seite = puzzleState.draftAssignments[itemId];
            if (seite !== "links" && seite !== "rechts") return;
            const chip = pool.querySelector(
                '.p3-chip[data-item-id="' + itemId + '"]'
            );
            if (!chip) return;
            const zone = layout.querySelector(
                '.p3-dropzone[data-seite="' + seite + '"] .p3-dropzone-ablage'
            );
            if (zone) zone.appendChild(chip);
        });

        tastaturmodusAktivieren(inhaltEl);

        if (window.werkstattHilfe) {
            window.werkstattHilfe.aktualisiere(
                3, puzzleState.failedChecks || 0, telefonBox
            );
        }

        inhaltEl._schliesseModal = schliesseModal;


        // =====================================================
        // Interne Helfer
        // =====================================================

        function itemById(id) {
            return ITEMS.find(function (i) { return i.id === id; });
        }

        function dropZoneBauen(cfg) {
            const wrap = document.createElement("div");
            wrap.className = "p3-dropzone p3-dropzone--" + cfg.seite;
            wrap.dataset.seite = cfg.seite;

            const kopf = document.createElement("div");
            kopf.className = "p3-dropzone-kopf";
            const k1 = document.createElement("div");
            k1.className = "p3-dropzone-titel";
            k1.textContent = cfg.titel;
            const k2 = document.createElement("div");
            k2.className = "p3-dropzone-unter";
            k2.textContent = cfg.unter;
            kopf.appendChild(k1);
            kopf.appendChild(k2);
            wrap.appendChild(kopf);

            // Platzhalter-Bild. Später einfach das <div>-Markup ersetzen
            // durch <img src="assets/raetsel3/…"> mit gleichem alt-Text.
            const bild = document.createElement("div");
            bild.className = "p3-zone-bild";
            bild.setAttribute("role", "img");
            bild.setAttribute("aria-label", cfg.bildAlt);
            bild.innerHTML = cfg.svg;
            wrap.appendChild(bild);

            // Ablage-Bereich, in den Chips gelegt werden.
            const ablage = document.createElement("div");
            ablage.className = "p3-dropzone-ablage";
            ablage.dataset.seite = cfg.seite;
            ablage.setAttribute("role", "region");
            ablage.setAttribute("tabindex", "0");
            ablage.setAttribute("aria-label",
                cfg.titel + " – Teile hier ablegen");
            wrap.appendChild(ablage);

            return wrap;
        }


        function chipErstellen(item) {
            const chip = document.createElement("div");
            chip.className = "p3-chip";
            chip.dataset.itemId = item.id;
            chip.setAttribute("role", "button");
            chip.setAttribute("tabindex", "0");
            chip.setAttribute("aria-label",
                item.label +
                " – mit Maus ziehen, oder mit Enter auswählen und dann " +
                "auf Spind oder Maschine ablegen.");

            const icon = document.createElement("span");
            icon.className = "p3-chip-icon";
            icon.textContent = item.icon;
            icon.setAttribute("aria-hidden", "true");
            chip.appendChild(icon);

            const label = document.createElement("span");
            label.className = "p3-chip-label";
            label.textContent = item.label;
            chip.appendChild(label);

            chip.addEventListener("pointerdown", ziehenStarten);
            return chip;
        }


        function chipAblegen(chip, ziel) {
            if (!ziel) return;
            entferneFehlerMarkierungen();
            feedbackBox.innerHTML = "";
            meldung.classList.remove("p1-meldung--sichtbar");

            if (ziel.classList.contains("p3-dropzone-ablage") ||
                ziel.classList.contains("p3-pool")) {
                ziel.appendChild(chip);
                speichereDraft();
            }
        }

        function speichereDraft() {
            const draft = {};
            inhaltEl.querySelectorAll(".p3-chip").forEach(function (chip) {
                const ablage = chip.closest(".p3-dropzone-ablage");
                if (ablage) draft[chip.dataset.itemId] = ablage.dataset.seite;
            });
            puzzleState.draftAssignments = draft;
        }


        // ---------- Drag (Pointer-Events) ----------
        let hoverZiel = null;

        function ziehenStarten(ev) {
            ev.preventDefault();
            const chip = ev.currentTarget;
            try { chip.setPointerCapture(ev.pointerId); } catch (_) { /* ältere Browser */ }

            const rect = chip.getBoundingClientRect();
            const dx = ev.clientX - rect.left;
            const dy = ev.clientY - rect.top;

            chip.style.width    = rect.width  + "px";
            chip.style.height   = rect.height + "px";
            chip.style.position = "fixed";
            chip.style.left     = rect.left + "px";
            chip.style.top      = rect.top  + "px";
            chip.style.zIndex   = "3000";
            chip.classList.add("p3-chip--zieht");

            function bewegen(e) {
                chip.style.left = (e.clientX - dx) + "px";
                chip.style.top  = (e.clientY - dy) + "px";
                setzeHover(chip, e.clientX, e.clientY);
            }
            function beenden(e) {
                chip.removeEventListener("pointermove",   bewegen);
                chip.removeEventListener("pointerup",     beenden);
                chip.removeEventListener("pointercancel", beenden);
                loescheHover();

                chip.style.pointerEvents = "none";
                const unter = document.elementFromPoint(e.clientX, e.clientY);
                chip.style.pointerEvents = "";

                chip.style.position = "";
                chip.style.left = ""; chip.style.top = "";
                chip.style.width = ""; chip.style.height = "";
                chip.style.zIndex = "";
                chip.classList.remove("p3-chip--zieht");

                const zone = unter && (
                    unter.closest(".p3-dropzone-ablage") ||
                    (unter.closest(".p3-dropzone") &&
                     unter.closest(".p3-dropzone").querySelector(".p3-dropzone-ablage"))
                );
                const poolTreffer = unter && unter.closest(".p3-pool");
                if (zone) chipAblegen(chip, zone);
                else if (poolTreffer) chipAblegen(chip, poolTreffer);
            }

            chip.addEventListener("pointermove",   bewegen);
            chip.addEventListener("pointerup",     beenden);
            chip.addEventListener("pointercancel", beenden);
        }

        function setzeHover(chip, x, y) {
            chip.style.pointerEvents = "none";
            const el = document.elementFromPoint(x, y);
            chip.style.pointerEvents = "";
            const dropZone = el && el.closest(".p3-dropzone");
            const pool = el && el.closest(".p3-pool");
            const ziel = dropZone || pool;
            if (ziel !== hoverZiel) {
                if (hoverZiel) hoverZiel.classList.remove("p3-dropzone--hover", "p3-pool--hover");
                if (ziel && ziel.classList.contains("p3-dropzone")) {
                    ziel.classList.add("p3-dropzone--hover");
                } else if (ziel && ziel.classList.contains("p3-pool")) {
                    ziel.classList.add("p3-pool--hover");
                }
                hoverZiel = ziel;
            }
        }

        function loescheHover() {
            if (hoverZiel) {
                hoverZiel.classList.remove("p3-dropzone--hover", "p3-pool--hover");
            }
            hoverZiel = null;
        }


        // ---------- Prüfen ----------
        function antwortenPruefen() {
            entferneFehlerMarkierungen();
            feedbackBox.innerHTML = "";

            const imPool   = [];         // Array<{item}>
            const falsche  = [];         // Array<{item, seite}>
            let richtigeAnzahl = 0;

            ITEMS.forEach(function (item) {
                const chip = inhaltEl.querySelector(
                    '.p3-chip[data-item-id="' + item.id + '"]'
                );
                if (!chip) return;
                const ablage = chip.closest(".p3-dropzone-ablage");
                if (!ablage) {
                    imPool.push({ item: item, chip: chip });
                    return;
                }
                const seite = ablage.dataset.seite;
                if (seite === item.korrekt) {
                    richtigeAnzahl += 1;
                } else {
                    falsche.push({ item: item, seite: seite, chip: chip,
                                   ablage: ablage });
                }
            });

            if (imPool.length === 0 && falsche.length === 0) {
                alleRichtig();
                return;
            }

            puzzleState.failedChecks += 1;
            puzzleState.errorCount   += 1;

            // Falsche Zuordnungen gelb markieren.
            falsche.forEach(function (f) {
                f.chip.classList.add("p3-chip--falsch");
                f.ablage.parentElement.classList.add("p3-dropzone--falsch");
            });

            // Feedback-Texte zusammenstellen.
            const kopf = document.createElement("p");
            kopf.className = "p3-feedback-head";
            kopf.textContent =
                "Noch nicht sicher. Das sagt die Betriebsanweisung:";
            feedbackBox.appendChild(kopf);

            // Pool-Rückstand separat melden.
            if (imPool.length > 0) {
                const liste = imPool.map(function (p) { return p.item.label; })
                                    .join(", ");
                const p = document.createElement("p");
                p.className = "p3-feedback-absatz p3-feedback-absatz--warn";
                p.textContent =
                    "Du hast noch nicht alles einsortiert: " + liste +
                    ". Zur Maschine oder in den Spind?";
                feedbackBox.appendChild(p);
            }

            const gezeigt = {};
            falsche.forEach(function (f) {
                const txt = FEEDBACK[f.item.id + "@" + f.seite];
                if (!txt || gezeigt[txt]) return;
                gezeigt[txt] = true;
                const p = document.createElement("p");
                p.className = "p3-feedback-absatz";
                p.textContent = txt;
                feedbackBox.appendChild(p);
            });

            meldung.textContent =
                richtigeAnzahl + " von " + ITEMS.length +
                " richtig – schau dir die Hinweise an.";
            meldung.classList.remove("p1-meldung--erfolg");
            meldung.classList.add("p1-meldung--warn");
            meldung.classList.add("p1-meldung--sichtbar");

            if (window.werkstattHilfe) {
                window.werkstattHilfe.aktualisiere(
                    3, puzzleState.failedChecks, telefonBox
                );
            }
        }


        function alleRichtig() {
            layout.querySelectorAll(".p3-dropzone").forEach(function (z) {
                z.classList.add("p3-dropzone--richtig");
            });
            inhaltEl.querySelectorAll(".p3-chip").forEach(function (chip) {
                chip.classList.add("p3-chip--fixiert");
                chip.removeEventListener("pointerdown", ziehenStarten);
            });

            pruefenBtn.disabled = true;
            pruefenBtn.style.display = "none";
            pruefenHinweis.style.display = "none";
            if (window.werkstattHilfe) {
                window.werkstattHilfe.aktualisiere(3, 0, telefonBox);
            }

            feedbackBox.innerHTML = "";
            meldung.textContent = "Alle Sicherheitsregeln verstanden!";
            meldung.classList.remove("p1-meldung--warn");
            meldung.classList.add("p1-meldung--erfolg");
            meldung.classList.add("p1-meldung--sichtbar");

            delete puzzleState.draftAssignments;
            delete puzzleState.failedChecks;

            setTimeout(function () {
                if (typeof window.loesePuzzle === "function") {
                    window.loesePuzzle(3);
                }
                if (typeof inhaltEl._schliesseModal === "function") {
                    inhaltEl._schliesseModal();
                }
            }, 1400);
        }


        function entferneFehlerMarkierungen() {
            inhaltEl.querySelectorAll(".p3-chip--falsch")
                .forEach(function (el) { el.classList.remove("p3-chip--falsch"); });
            inhaltEl.querySelectorAll(".p3-dropzone--falsch")
                .forEach(function (el) { el.classList.remove("p3-dropzone--falsch"); });
        }


        // ---------- Hilfesystem ----------
        function tippBoxZeigen() {
            if (!tippBox.classList.contains("p3-tipp--versteckt")) return;
            tippBox.classList.remove("p3-tipp--versteckt");
            tippBox.innerHTML = "";

            const titel = document.createElement("div");
            titel.className = "p3-tipp-titel";
            titel.textContent = "💡 Tipp";
            tippBox.appendChild(titel);

            const text = document.createElement("div");
            text.className = "p3-tipp-text";
            text.textContent =
                "Die Betriebsanweisung erklärt alles. Dort steht, was " +
                "abgelegt werden muss – und was am Körper bleiben darf.";
            tippBox.appendChild(text);

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "p3-ba-btn p3-ba-btn--tipp";
            btn.textContent = "Betriebsanweisung aufrufen";
            btn.addEventListener("click", betriebsanweisungOeffnen);
            tippBox.appendChild(btn);
        }

        function telefonHilfeZeigen() {
            if (!telefonBox.classList.contains("p1-telefon--versteckt")) return;
            telefonBox.classList.remove("p1-telefon--versteckt");
            telefonBox.innerHTML = "";

            const titel = document.createElement("div");
            titel.className = "p1-telefon-titel";
            titel.textContent = "📞 Frag deine Lehrkraft!";
            telefonBox.appendChild(titel);

            const text = document.createElement("div");
            text.className = "p1-telefon-text";
            text.textContent =
                "Frag deine Lehrkraft – gemeinsam lernt sich das leichter. " +
                "Sobald ihr die Schutzausrüstung besprochen habt, kannst " +
                "du dieses Rätsel freischalten.";
            telefonBox.appendChild(text);

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "p1-telefon-btn";
            btn.textContent = "LEHRKRAFT-HILFE BESTÄTIGEN";
            btn.addEventListener("click", alleRichtig);
            telefonBox.appendChild(btn);
        }


        // ---------- Sprung zur Betriebsanweisung ----------
        function betriebsanweisungOeffnen() {
            speichereDraft();
            const oeffnen = function () {
                if (typeof window.activateZoomToWall === "function") {
                    window.activateZoomToWall("info-3");
                }
            };
            if (typeof inhaltEl._schliesseModal === "function") {
                inhaltEl._schliesseModal();
                setTimeout(oeffnen, 320);
            } else {
                oeffnen();
            }
        }


        // ---------- Tastatur-Bedienung ----------
        // Enter/Leertaste auf Chip: Auswahl setzen/aufheben.
        // Enter/Leertaste auf Ablage oder Pool: Auswahl ablegen.
        // Pfeil-Links/Pfeil-Rechts auf fokussierten Chip: direkt in
        // Spind (links) oder Maschine (rechts) verschieben.
        function tastaturmodusAktivieren(wurzel) {
            let auswahl = null;

            wurzel.addEventListener("keydown", function (ev) {
                const ziel = ev.target;

                if (ziel.classList && ziel.classList.contains("p3-chip") &&
                    !ziel.classList.contains("p3-chip--fixiert")) {
                    if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") {
                        ev.preventDefault();
                        const seite = ev.key === "ArrowLeft" ? "links" : "rechts";
                        const ablage = wurzel.querySelector(
                            '.p3-dropzone-ablage[data-seite="' + seite + '"]'
                        );
                        if (ablage) chipAblegen(ziel, ablage);
                        return;
                    }
                    if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        if (auswahl) auswahl.classList.remove("p3-chip--ausgewaehlt");
                        auswahl = (auswahl === ziel) ? null : ziel;
                        if (auswahl) auswahl.classList.add("p3-chip--ausgewaehlt");
                        return;
                    }
                }

                if ((ev.key === "Enter" || ev.key === " ") && auswahl &&
                    ziel.classList &&
                    (ziel.classList.contains("p3-dropzone-ablage") ||
                     ziel.classList.contains("p3-pool"))) {
                    ev.preventDefault();
                    const ref = auswahl;
                    auswahl.classList.remove("p3-chip--ausgewaehlt");
                    auswahl = null;
                    chipAblegen(ref, ziel);
                }
            });
        }
    };

})();
