/* ===========================================================
   Werkstatt-Blackout – puzzle2.js
   -----------------------------------------------------------
   Rätsel 2: "Bohrertypen" – Werkbank-Szene mit Sprechblasen.

   Redesign-Kernidee: Der Spieler sieht eine stilisierte Holz-
   Werkbank. Darauf liegen locker verteilt fünf Bohrer (a–e).
   Rund um die Szene haften 10 "Sprechblasen-Notizen" (Chips):
   5 Bezeichnungen (z.B. "HSS-Metallbohrer") und 5 Funktions-
   Sätze (z.B. "Bohrt in Metall und Kunststoff."). Zu jedem
   Bohrer gehören zwei Notizen – eine Bezeichnung (oberhalb) und
   eine Funktion (unterhalb).

   Geprüft wird – wie in Rätsel 1 – erst beim Klick auf
   "ANTWORTEN PRÜFEN", um Brute-Force-Raten pädagogisch zu
   unterbinden. Der Zwischenstand lebt in puzzle.draftAssignments.
   =========================================================== */

"use strict";

window.puzzleRenderer = window.puzzleRenderer || {};

(function () {

    // -----------------------------------------------------
    // Korrekte Zuordnung: Buchstabe → { Bezeichnung, Funktion }.
    // -----------------------------------------------------
    // Fünf Bohrertypen – identische Namen wie in Info-Tafel 2,
    // damit SuS ihre Lern-Notizen 1:1 auf das Rätsel übertragen
    // können.
    const ZUORDNUNG = {
        a: { bezeichnung: "Steinbohrer",
             funktion:    "Hat eine Hartmetallplatte für Stein." },
        b: { bezeichnung: "Holzbohrer",
             funktion:    "Hat eine Zentrierspitze für Holz." },
        c: { bezeichnung: "Senker",
             funktion:    "Versenkt Schraubenköpfe im Material." },
        d: { bezeichnung: "HSS-Metallbohrer",
             funktion:    "Bohrt in Metall und Kunststoff." },
        e: { bezeichnung: "Forstnerbohrer",
             funktion:    "Macht große, saubere Löcher in Holz." }
    };

    const BUCHSTABEN = ["a", "b", "c", "d", "e"];

    // -----------------------------------------------------
    // Positionen auf der Werkbank (Prozent relativ zur Bühne).
    //
    // Werte 1:1 aus den Lupen-Hotspots der Infotafel "Bohrertypen"
    // übernommen (siehe infoContent.js, "info-2".hotspots), damit
    // die Drop-Zonen exakt über den Bohrer-Gruppen im Foto
    // assets/werkbank-bohrer.png sitzen:
    //   a Steinbohrer       – oben links   (32 / 30)
    //   b Holzbohrer        – oben mitte   (50 / 30)
    //   c Senker            – oben rechts  (72 / 30)
    //   d HSS-Metallbohrer  – unten links  (32 / 72)
    //   e Forstnerbohrer    – unten rechts (72 / 72)
    // Rotationen werden nicht mehr benutzt (die SVG-Bohrer sind
    // ausgeblendet, weil das Foto die echten Bohrer zeigt).
    // -----------------------------------------------------
    const BOHRER_POSITIONEN = [
        { id: "a", xPct: 20, yPct: 30, rotation: 0 },
        { id: "b", xPct: 50, yPct: 30, rotation: 0 },
        { id: "c", xPct: 72, yPct: 30, rotation: 0 },
        { id: "d", xPct: 20, yPct: 72, rotation: 0 },
        { id: "e", xPct: 72, yPct: 72, rotation: 0 }
    ];

    // Zehn Streu-Positionen für unzugeordnete Sprechblasen
    // (5 Bezeichnungen + 5 Funktionen). Rand-nah, damit die
    // Bohrer in der Mitte frei bleiben.
    const SCATTER_POSITIONEN = [
        { xPct:  4, yPct:  5 }, { xPct: 36, yPct:  4 },
        { xPct: 66, yPct:  5 }, { xPct: 95, yPct:  6 },
        { xPct:  3, yPct: 47 }, { xPct: 96, yPct: 47 },
        { xPct:  5, yPct: 93 }, { xPct: 36, yPct: 94 },
        { xPct: 65, yPct: 93 }, { xPct: 95, yPct: 92 }
    ];

    // Scaffolding-Schwellen (analog Rätsel 1).
    const SCHWELLE_MARKIERUNG = 3;
    const SCHWELLE_TELEFON    = 6;


    // -----------------------------------------------------
    // Draft-Objekt: identische Struktur wie in der Vorversion,
    // damit state.js unverändert bleiben kann.
    // -----------------------------------------------------
    function holeOderInitZustand() {
        const p = (typeof getPuzzle === "function") ? getPuzzle(2) : null;
        if (!p) return null;
        if (!p.draftAssignments || typeof p.draftAssignments !== "object") {
            p.draftAssignments = {};
        }
        if (!p.draftAssignments.bezeichnung) p.draftAssignments.bezeichnung = {};
        if (!p.draftAssignments.funktion)    p.draftAssignments.funktion    = {};
        if (typeof p.failedChecks !== "number") p.failedChecks = 0;
        return p;
    }


    // ---------------------------------------------------------
    // SVG-Bohrer-Zeichnungen.
    // Jeder Bohrer hat seine eigene Gradient-ID (metall_a …),
    // damit die Farbverläufe nicht zwischen den sechs SVGs
    // kollidieren, wenn mehrere SVGs gleichzeitig im DOM liegen.
    // Alle Bohrer zeigen mit der Spitze nach rechts; leichte
    // Rotation erhalten sie später per CSS am Container.
    // ---------------------------------------------------------
    function metallGradient(id) {
        return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
                 '<stop offset="0%"   stop-color="#F0F0F0"/>' +
                 '<stop offset="45%"  stop-color="#C0C0C0"/>' +
                 '<stop offset="100%" stop-color="#7A7A7A"/>' +
               '</linearGradient>';
    }

    // HSS-Metallbohrer (metallisch glänzend, durchgehende Spiral-
    // nuten, konische Bohrspitze).
    const SVG_HSS =
        '<svg viewBox="0 0 240 60" xmlns="http://www.w3.org/2000/svg" class="p2-svg" aria-label="HSS-Metallbohrer">' +
        '<defs>' + metallGradient("metall_a") + '</defs>' +
        '<rect x="8" y="22" width="55" height="16" fill="url(#metall_a)" stroke="#3A3A3A" stroke-width="1"/>' +
        '<rect x="63" y="22" width="145" height="16" fill="url(#metall_a)" stroke="#3A3A3A" stroke-width="1"/>' +
        // Spiralnuten (dunkle Diagonalen für plastischen Look)
        '<g stroke="#2A2A2A" stroke-width="1.2" fill="none" opacity="0.7">' +
          '<line x1="70"  y1="22" x2="85"  y2="38"/>' +
          '<line x1="90"  y1="22" x2="105" y2="38"/>' +
          '<line x1="110" y1="22" x2="125" y2="38"/>' +
          '<line x1="130" y1="22" x2="145" y2="38"/>' +
          '<line x1="150" y1="22" x2="165" y2="38"/>' +
          '<line x1="170" y1="22" x2="185" y2="38"/>' +
          '<line x1="190" y1="22" x2="205" y2="38"/>' +
        '</g>' +
        // Glanzkante oben
        '<rect x="8" y="22" width="200" height="2.5" fill="#FFF" opacity="0.55"/>' +
        // Bohrspitze (konisch)
        '<polygon points="208,22 208,38 230,30" fill="url(#metall_a)" stroke="#3A3A3A" stroke-width="1"/>' +
        '</svg>';

    // Holzbohrer (silbergrau + dunklere Zentrierspitze).
    const SVG_HOLZ =
        '<svg viewBox="0 0 240 60" xmlns="http://www.w3.org/2000/svg" class="p2-svg" aria-label="Holzbohrer">' +
        '<defs>' + metallGradient("metall_b") + '</defs>' +
        '<rect x="8" y="22" width="55" height="16" fill="url(#metall_b)" stroke="#3A3A3A" stroke-width="1"/>' +
        '<rect x="63" y="22" width="135" height="16" fill="url(#metall_b)" stroke="#3A3A3A" stroke-width="1"/>' +
        '<g stroke="#2A2A2A" stroke-width="1.2" fill="none" opacity="0.7">' +
          '<line x1="70"  y1="22" x2="85"  y2="38"/>' +
          '<line x1="95"  y1="22" x2="110" y2="38"/>' +
          '<line x1="120" y1="22" x2="135" y2="38"/>' +
          '<line x1="145" y1="22" x2="160" y2="38"/>' +
          '<line x1="170" y1="22" x2="185" y2="38"/>' +
        '</g>' +
        '<rect x="8" y="22" width="190" height="2.5" fill="#FFF" opacity="0.55"/>' +
        // Kopfblock mit Schneidflügeln (Vorschneider)
        '<rect x="198" y="15" width="12" height="30" fill="url(#metall_b)" stroke="#3A3A3A" stroke-width="1"/>' +
        '<polygon points="204,15 212,8 212,16" fill="#1E1E1E"/>' +
        '<polygon points="204,45 212,52 212,44" fill="#1E1E1E"/>' +
        // Lange, dunkle Zentrierspitze
        '<polygon points="210,26 210,34 234,30" fill="#1E1E1E"/>' +
        '</svg>';

    // Steinbohrer (silbergrau mit dunkelgrauer Hartmetallplatte).
    const SVG_STEIN =
        '<svg viewBox="0 0 240 60" xmlns="http://www.w3.org/2000/svg" class="p2-svg" aria-label="Steinbohrer">' +
        '<defs>' + metallGradient("metall_c") + '</defs>' +
        '<rect x="8" y="22" width="55" height="16" fill="url(#metall_c)" stroke="#3A3A3A" stroke-width="1"/>' +
        '<rect x="63" y="22" width="125" height="16" fill="url(#metall_c)" stroke="#3A3A3A" stroke-width="1"/>' +
        '<g stroke="#2A2A2A" stroke-width="1.2" fill="none" opacity="0.7">' +
          '<line x1="70"  y1="22" x2="85"  y2="38"/>' +
          '<line x1="95"  y1="22" x2="110" y2="38"/>' +
          '<line x1="120" y1="22" x2="135" y2="38"/>' +
          '<line x1="145" y1="22" x2="160" y2="38"/>' +
          '<line x1="170" y1="22" x2="185" y2="38"/>' +
        '</g>' +
        '<rect x="8" y="22" width="180" height="2.5" fill="#FFF" opacity="0.55"/>' +
        // Hartmetallplatte – pfeilförmig, breiter als Schaft, dunkel
        '<polygon points="188,10 188,50 214,40 224,30 214,20" fill="#4A4A4A" stroke="#222" stroke-width="1"/>' +
        '<line x1="198" y1="14" x2="198" y2="46" stroke="#1A1A1A" stroke-width="1"/>' +
        '</svg>';

    // Forstnerbohrer (kurzer Schaft, markante Schneidscheibe).
    const SVG_FORSTNER =
        '<svg viewBox="0 0 240 60" xmlns="http://www.w3.org/2000/svg" class="p2-svg" aria-label="Forstnerbohrer">' +
        '<defs>' + metallGradient("metall_d") + '</defs>' +
        // Kurzer Schaft
        '<rect x="8" y="25" width="120" height="10" fill="url(#metall_d)" stroke="#3A3A3A" stroke-width="1"/>' +
        '<rect x="8" y="25" width="120" height="2" fill="#FFF" opacity="0.55"/>' +
        // Schneidscheibe (breit, fast halbkreisförmig)
        '<path d="M 128 8 L 150 8 Q 182 30 150 52 L 128 52 Z"' +
          ' fill="url(#metall_d)" stroke="#3A3A3A" stroke-width="1"/>' +
        // Schneidkanten am Rand (zwei dunkle Zähne)
        '<polygon points="150,8 160,5 156,14" fill="#1E1E1E"/>' +
        '<polygon points="150,52 160,55 156,46" fill="#1E1E1E"/>' +
        // Zentrierspitze
        '<polygon points="150,27 150,33 176,30" fill="#1E1E1E"/>' +
        // Schneidkanten quer über die Scheibe
        '<line x1="138" y1="16" x2="172" y2="30" stroke="#2A2A2A" stroke-width="1.3" fill="none"/>' +
        '<line x1="138" y1="44" x2="172" y2="30" stroke="#2A2A2A" stroke-width="1.3" fill="none"/>' +
        '</svg>';

    // Senker – zylindrischer Schaft mit kegelförmiger Spitze.
    const SVG_SENKER =
        '<svg viewBox="0 0 240 60" xmlns="http://www.w3.org/2000/svg" class="p2-svg" aria-label="Senker">' +
        '<defs>' + metallGradient("metall_f") + '</defs>' +
        '<rect x="8" y="22" width="135" height="16" fill="url(#metall_f)" stroke="#3A3A3A" stroke-width="1"/>' +
        '<rect x="8" y="22" width="135" height="2.5" fill="#FFF" opacity="0.55"/>' +
        // Kegel – breit am Schaft, spitz nach vorn
        '<polygon points="143,10 143,50 210,30" fill="url(#metall_f)" stroke="#3A3A3A" stroke-width="1"/>' +
        // Schneidkanten am Konus (drei Linien)
        '<line x1="150" y1="14" x2="205" y2="30" stroke="#2A2A2A" stroke-width="1.2"/>' +
        '<line x1="155" y1="30" x2="205" y2="30" stroke="#2A2A2A" stroke-width="1.2"/>' +
        '<line x1="150" y1="46" x2="205" y2="30" stroke="#2A2A2A" stroke-width="1.2"/>' +
        '</svg>';

    // Zuordnung Buchstabe → SVG. Die Buchstaben sind dieselben wie in
    // ZUORDNUNG oben (a = Steinbohrer, b = Holzbohrer, …).
    const SVG_MAP = {
        a: SVG_STEIN,
        b: SVG_HOLZ,
        c: SVG_SENKER,
        d: SVG_HSS,
        e: SVG_FORSTNER
    };


    // ---------------------------------------------------------
    // Fisher-Yates-Shuffle.
    // ---------------------------------------------------------
    function mischen(feld) {
        const kopie = feld.slice();
        for (let i = kopie.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = kopie[i];
            kopie[i] = kopie[j];
            kopie[j] = tmp;
        }
        return kopie;
    }


    // =========================================================
    // RENDERER
    // =========================================================
    window.puzzleRenderer[2] = function rendern(inhaltEl, schliesseModal) {

        inhaltEl.innerHTML = "";
        inhaltEl.classList.add("modal-inhalt--puzzle");

        const puzzleState = holeOderInitZustand();
        if (!puzzleState) {
            console.error("Puzzle 2: State nicht verfügbar.");
            return;
        }

        // -----------------------------------------------------
        // Aufgabentext.
        // -----------------------------------------------------
        const aufgabe = document.createElement("p");
        aufgabe.className = "p1-aufgabe";
        aufgabe.textContent =
            "Ordne jedem Bohrer die passende Bezeichnung (Notiz OBEN) und " +
            "die passende Funktion (Notiz UNTEN) zu. Wenn alle 10 Notizen " +
            "hängen, klicke auf „ANTWORTEN PRÜFEN\u201C.";
        inhaltEl.appendChild(aufgabe);


        // -----------------------------------------------------
        // Werkbank-Bühne – positionierter Container, in dem
        // Bohrer (absolut) und Sprechblasen (absolut) liegen.
        // -----------------------------------------------------
        const buehne = document.createElement("div");
        buehne.className = "p2-buehne";
        buehne.setAttribute("role", "group");
        buehne.setAttribute("aria-label", "Werkbank mit fünf Bohrern und zehn Notizen");
        inhaltEl.appendChild(buehne);

        // Buehne in CSS-Klassen-Variante: Klassen-basierter Holz-
        // Hintergrund. Ein echtes Foto kann später per Überschreibung
        // in style.css eingesetzt werden (siehe Kommentar im CSS).


        // -----------------------------------------------------
        // Die sechs Bohrer-Container erzeugen.
        // -----------------------------------------------------
        BOHRER_POSITIONEN.forEach(function (pos) {
            const bohrer = document.createElement("div");
            bohrer.className = "p2-bohrer";
            bohrer.style.left = pos.xPct + "%";
            bohrer.style.top  = pos.yPct + "%";
            bohrer.dataset.letter = pos.id;
            // Leichte Zufallsdrehung für natürliches Layout.
            bohrer.style.setProperty("--bohrer-rot", pos.rotation + "deg");

            // Obere Drop-Zone (Bezeichnung).
            const zoneBez = document.createElement("div");
            zoneBez.className = "p2-dropzone p2-dropzone-bez";
            zoneBez.dataset.letter = pos.id;
            zoneBez.dataset.kategorie = "bezeichnung";
            zoneBez.setAttribute("role", "region");
            zoneBez.setAttribute("tabindex", "0");
            zoneBez.setAttribute("aria-label",
                "Bezeichnung für Bohrer " + pos.id);
            bohrer.appendChild(zoneBez);

            // Bohrer-Bild + Buchstaben-Marker.
            const bohrerWerk = document.createElement("div");
            bohrerWerk.className = "p2-bohrer-werk";
            bohrerWerk.innerHTML = SVG_MAP[pos.id];

            const marker = document.createElement("span");
            marker.className = "p2-buchstabe";
            marker.textContent = pos.id;
            bohrerWerk.appendChild(marker);

            bohrer.appendChild(bohrerWerk);

            // Untere Drop-Zone (Funktion).
            const zoneFun = document.createElement("div");
            zoneFun.className = "p2-dropzone p2-dropzone-fun";
            zoneFun.dataset.letter = pos.id;
            zoneFun.dataset.kategorie = "funktion";
            zoneFun.setAttribute("role", "region");
            zoneFun.setAttribute("tabindex", "0");
            zoneFun.setAttribute("aria-label",
                "Funktion für Bohrer " + pos.id);
            bohrer.appendChild(zoneFun);

            buehne.appendChild(bohrer);
        });


        // -----------------------------------------------------
        // 12 Sprechblasen (Chips) erzeugen und verteilen.
        //
        // Start: Wir mischen 6 Bezeichnungs- + 6 Funktions-Chips
        // und verteilen sie auf zwölf fix vordefinierte Streu-
        // Positionen entlang des Bühnenrands (so liegen sie nie
        // auf den Bohrern und nie übereinander).
        // -----------------------------------------------------
        const alleChipDaten = [];
        BUCHSTABEN.forEach(function (b) {
            alleChipDaten.push({ kategorie: "bezeichnung", text: ZUORDNUNG[b].bezeichnung });
            alleChipDaten.push({ kategorie: "funktion",    text: ZUORDNUNG[b].funktion });
        });

        const streuMisch = mischen(SCATTER_POSITIONEN);
        const chipMisch = mischen(alleChipDaten);
        const alleChips = [];

        chipMisch.forEach(function (daten, idx) {
            const chip = chipErstellen(daten.text, daten.kategorie);
            alleChips.push(chip);
            const pos = streuMisch[idx % streuMisch.length];
            streuChipPositionieren(chip, pos.xPct, pos.yPct);
            buehne.appendChild(chip);
        });


        // -----------------------------------------------------
        // Zwischenstand wiederherstellen: jeder zugeordnete Chip
        // wandert in die passende Dropzone.
        // -----------------------------------------------------
        ["bezeichnung", "funktion"].forEach(function (kat) {
            const draftKat = puzzleState.draftAssignments[kat] || {};
            Object.keys(draftKat).forEach(function (buchstabe) {
                const text = draftKat[buchstabe];
                const zone = buehne.querySelector(
                    '.p2-dropzone[data-kategorie="' + kat +
                    '"][data-letter="' + buchstabe + '"]'
                );
                if (!zone) return;
                const kandidat = alleChips.find(function (c) {
                    return c.dataset.term === text &&
                           c.dataset.kategorie === kat &&
                           !c.dataset.platziert;
                });
                if (kandidat) {
                    inDropzoneSetzen(kandidat, zone);
                }
            });
        });


        // -----------------------------------------------------
        // Footer (Meldung, Telefon-Hilfe, Prüfen-Button).
        // -----------------------------------------------------
        const footerZiel = inhaltEl._footer || inhaltEl;

        const meldungsBox = document.createElement("div");
        meldungsBox.className = "p1-meldung";
        meldungsBox.setAttribute("role", "status");
        meldungsBox.setAttribute("aria-live", "polite");
        footerZiel.appendChild(meldungsBox);

        // Einheitlicher Hilfe-Slot (js/hilfe.js).
        const telefonBox = document.createElement("div");
        telefonBox.className = "hilfe-slot";
        footerZiel.appendChild(telefonBox);

        const pruefenZeile = document.createElement("div");
        pruefenZeile.className = "p1-pruefen-zeile";

        const pruefenHinweis = document.createElement("span");
        pruefenHinweis.className = "p1-pruefen-hinweis";
        pruefenZeile.appendChild(pruefenHinweis);

        const pruefenBtn = document.createElement("button");
        pruefenBtn.type = "button";
        pruefenBtn.className = "p1-pruefen-btn";
        pruefenBtn.textContent = "ANTWORTEN PRÜFEN";
        pruefenBtn.disabled = true;
        pruefenBtn.addEventListener("click", antwortenPruefen);
        pruefenZeile.appendChild(pruefenBtn);

        footerZiel.appendChild(pruefenZeile);

        const zonen = buehne.querySelectorAll(".p2-dropzone");

        tastaturmodusAktivieren(inhaltEl);
        statusPruefenButton();

        if (window.werkstattHilfe) {
            window.werkstattHilfe.aktualisiere(
                2, puzzleState.failedChecks || 0, telefonBox
            );
        }

        inhaltEl._schliesseModal = schliesseModal;


        // =====================================================
        // Interne Helfer
        // =====================================================

        // -------------------------------------------------
        // Chip erzeugen.
        // -------------------------------------------------
        function chipErstellen(text, kategorie) {
            const chip = document.createElement("div");
            chip.className = "p2-chip " +
                (kategorie === "bezeichnung" ? "p2-chip-bez" : "p2-chip-fun");
            chip.textContent = text;
            chip.dataset.term = text;
            chip.dataset.kategorie = kategorie;
            chip.setAttribute("role", "button");
            chip.setAttribute("tabindex", "0");
            chip.setAttribute("aria-label",
                (kategorie === "bezeichnung" ? "Bezeichnung: " : "Funktion: ") + text);
            chip.addEventListener("pointerdown", ziehenStarten);
            return chip;
        }

        // -------------------------------------------------
        // Chip im Streu-Modus positionieren (absolut in der
        // Buehne, in Prozent-Koordinaten).
        // -------------------------------------------------
        function streuChipPositionieren(chip, xPct, yPct) {
            chip.classList.remove("p2-chip--in-zone");
            chip.classList.add("p2-chip--streu");
            chip.style.left = xPct + "%";
            chip.style.top  = yPct + "%";
            delete chip.dataset.platziert;
        }

        // -------------------------------------------------
        // Chip in eine Dropzone einrasten lassen.
        // -------------------------------------------------
        function inDropzoneSetzen(chip, zone) {
            // Inline-Positionen zurücksetzen, damit der Chip
            // seine Zone vollständig ausfüllt.
            chip.style.left = "";
            chip.style.top  = "";
            chip.classList.remove("p2-chip--streu");
            chip.classList.add("p2-chip--in-zone");
            zone.appendChild(chip);
            chip.dataset.platziert = "true";

            // Kleine Einrast-Animation auslösen (Klasse nach
            // Ablauf wieder entfernen, damit sie erneut greifen kann).
            chip.classList.remove("p2-chip--einrasten");
            // Layout erzwingen, damit die Animation neu startet.
            // (void reflow – absichtlich)
            void chip.offsetWidth;
            chip.classList.add("p2-chip--einrasten");
            setTimeout(function () {
                chip.classList.remove("p2-chip--einrasten");
            }, 260);
        }

        // -------------------------------------------------
        // Chip zurück in den Streu-Bereich legen.
        // Zielkoordinaten ergeben sich aus der Pointer-Position,
        // damit der Chip dort liegt, wo der Spieler ihn loslässt.
        // -------------------------------------------------
        function chipZurueckInStreu(chip, clientX, clientY) {
            const rect = buehne.getBoundingClientRect();
            let xPct = ((clientX - rect.left) / rect.width)  * 100;
            let yPct = ((clientY - rect.top)  / rect.height) * 100;
            // An den Rand klemmen, damit der Chip im Sichtbereich bleibt.
            xPct = Math.max(2, Math.min(98, xPct));
            yPct = Math.max(2, Math.min(98, yPct));

            buehne.appendChild(chip);
            streuChipPositionieren(chip, xPct, yPct);
        }


        // -------------------------------------------------
        // Ablage-Logik nach Drop.
        //   ziel = Dropzone        → Kategorie-Check, Tausch-Logik.
        //   ziel = "streu"         → Chip zurück in die Streu-Fläche.
        // -------------------------------------------------
        function chipAblegen(chip, ziel, clientX, clientY) {
            entferneFehlerMarkierungen();
            meldungVerbergen();

            if (ziel && ziel.classList &&
                ziel.classList.contains("p2-dropzone")) {

                if (ziel.dataset.kategorie !== chip.dataset.kategorie) {
                    // Falsche Kategorie – Chip landet stattdessen
                    // am Pointer im Streu-Bereich.
                    chipZurueckInStreu(chip, clientX, clientY);
                } else {
                    const vorhandener = ziel.querySelector(".p2-chip");
                    if (vorhandener && vorhandener !== chip) {
                        // Platztausch: der bisherige Zonen-Chip wandert
                        // an die Pointer-Position im Streu-Bereich.
                        chipZurueckInStreu(vorhandener, clientX, clientY);
                    }
                    inDropzoneSetzen(chip, ziel);
                }
            } else {
                // Drop ins Freie → Streu-Position.
                chipZurueckInStreu(chip, clientX, clientY);
            }

            speichereDraft();
            statusPruefenButton();
        }


        // -------------------------------------------------
        // Draft-Zustand schreiben.
        // -------------------------------------------------
        function speichereDraft() {
            const bez = {};
            const fun = {};
            zonen.forEach(function (zone) {
                const chip = zone.querySelector(".p2-chip");
                if (!chip) return;
                if (zone.dataset.kategorie === "bezeichnung") {
                    bez[zone.dataset.letter] = chip.dataset.term;
                } else {
                    fun[zone.dataset.letter] = chip.dataset.term;
                }
            });
            puzzleState.draftAssignments = { bezeichnung: bez, funktion: fun };
        }


        // -------------------------------------------------
        // Pointer-Drag (Maus, Touch, Stift).
        // -------------------------------------------------
        let hoverZiel = null;

        function ziehenStarten(ereignis) {
            ereignis.preventDefault();
            const chip = ereignis.currentTarget;

            try { chip.setPointerCapture(ereignis.pointerId); } catch (_) { /* alt */ }

            const rect = chip.getBoundingClientRect();
            const verschiebungX = ereignis.clientX - rect.left;
            const verschiebungY = ereignis.clientY - rect.top;

            // Ausgangsgröße merken, damit der Chip während des
            // Ziehens nicht plötzlich schrumpft oder wächst.
            chip.style.width    = rect.width  + "px";
            chip.style.height   = rect.height + "px";
            chip.style.position = "fixed";
            chip.style.left     = rect.left + "px";
            chip.style.top      = rect.top  + "px";
            chip.style.zIndex   = "3000";
            chip.classList.add("p2-chip--zieht");

            function bewegen(ev) {
                chip.style.left = (ev.clientX - verschiebungX) + "px";
                chip.style.top  = (ev.clientY - verschiebungY) + "px";
                setzeHoverZiel(chip, ev.clientX, ev.clientY);
            }

            function beenden(ev) {
                chip.removeEventListener("pointermove",   bewegen);
                chip.removeEventListener("pointerup",     beenden);
                chip.removeEventListener("pointercancel", beenden);
                loescheHoverZiel();

                chip.style.pointerEvents = "none";
                const unter = document.elementFromPoint(ev.clientX, ev.clientY);
                chip.style.pointerEvents = "";

                // Alle fixed-Inline-Styles wieder aufheben,
                // damit nachfolgende Layouts greifen.
                chip.style.position = "";
                chip.style.left     = "";
                chip.style.top      = "";
                chip.style.width    = "";
                chip.style.height   = "";
                chip.style.zIndex   = "";
                chip.classList.remove("p2-chip--zieht");

                const zone = unter && unter.closest(".p2-dropzone");
                chipAblegen(chip, zone, ev.clientX, ev.clientY);
            }

            chip.addEventListener("pointermove",   bewegen);
            chip.addEventListener("pointerup",     beenden);
            chip.addEventListener("pointercancel", beenden);
        }

        function setzeHoverZiel(chip, x, y) {
            chip.style.pointerEvents = "none";
            const el = document.elementFromPoint(x, y);
            chip.style.pointerEvents = "";
            let ziel = el && el.closest(".p2-dropzone");

            // Nur Kategorie-passende Zonen dürfen aufleuchten.
            if (ziel && ziel.dataset.kategorie !== chip.dataset.kategorie) {
                ziel = null;
            }
            if (ziel !== hoverZiel) {
                if (hoverZiel) hoverZiel.classList.remove("p2-dropzone--hover");
                if (ziel) ziel.classList.add("p2-dropzone--hover");
                hoverZiel = ziel;
            }
        }

        function loescheHoverZiel() {
            if (hoverZiel) hoverZiel.classList.remove("p2-dropzone--hover");
            hoverZiel = null;
        }


        // -------------------------------------------------
        // Prüfen-Button aktivieren / deaktivieren.
        // -------------------------------------------------
        function statusPruefenButton() {
            const gefuellte = Array.prototype.filter.call(zonen, function (z) {
                return z.querySelector(".p2-chip") !== null;
            }).length;
            const komplett = gefuellte === zonen.length;     // 10

            pruefenBtn.disabled = !komplett;
            if (komplett) {
                pruefenHinweis.textContent = "Alle Notizen hängen – jetzt prüfen.";
                pruefenHinweis.classList.remove("p1-pruefen-hinweis--warn");
            } else {
                pruefenHinweis.textContent =
                    "Ordne alle 10 Notizen zu (" + gefuellte + "/" +
                    zonen.length + ")";
                pruefenHinweis.classList.add("p1-pruefen-hinweis--warn");
            }
        }


        // -------------------------------------------------
        // Antworten prüfen.
        // -------------------------------------------------
        function antwortenPruefen() {
            if (pruefenBtn.disabled) return;

            let falscheZonen = [];
            zonen.forEach(function (zone) {
                const chip = zone.querySelector(".p2-chip");
                if (!chip) return;
                const soll = ZUORDNUNG[zone.dataset.letter][zone.dataset.kategorie];
                if (chip.dataset.term !== soll) falscheZonen.push(zone);
            });

            entferneFehlerMarkierungen();

            if (falscheZonen.length === 0) {
                alleRichtig();
                return;
            }

            puzzleState.failedChecks += 1;
            puzzleState.errorCount   += 1;

            const anzahl = falscheZonen.length;
            let text = "Noch nicht ganz richtig. " + anzahl + " von " +
                       zonen.length + " Zuordnungen stimmen nicht.";

            if (puzzleState.failedChecks >= SCHWELLE_MARKIERUNG) {
                falscheZonen.forEach(function (zone) {
                    zone.classList.add("p2-dropzone--falsch");
                    const chip = zone.querySelector(".p2-chip");
                    if (chip) chip.classList.add("p2-chip--falsch");
                });
                text += " Hinweis: Die rot markierten Notizen sind nicht korrekt.";
            }

            meldungZeigen(text, "warn");

            if (window.werkstattHilfe) {
                window.werkstattHilfe.aktualisiere(
                    2, puzzleState.failedChecks, telefonBox
                );
            }
        }


        // -------------------------------------------------
        // Erfolgs-Sequenz.
        // -------------------------------------------------
        function alleRichtig() {
            zonen.forEach(function (zone) {
                zone.classList.add("p2-dropzone--richtig");
                const chip = zone.querySelector(".p2-chip");
                if (chip) {
                    chip.classList.add("p2-chip--fixiert");
                    chip.removeEventListener("pointerdown", ziehenStarten);
                }
            });

            pruefenBtn.disabled = true;
            pruefenBtn.style.display = "none";
            pruefenHinweis.style.display = "none";
            if (window.werkstattHilfe) {
                window.werkstattHilfe.aktualisiere(2, 0, telefonBox);
            }

            meldungZeigen("Alle Bohrer richtig zugeordnet!", "erfolg");

            delete puzzleState.draftAssignments;
            delete puzzleState.failedChecks;

            setTimeout(function () {
                if (typeof window.loesePuzzle === "function") {
                    window.loesePuzzle(2);
                }
                if (typeof inhaltEl._schliesseModal === "function") {
                    inhaltEl._schliesseModal();
                }
            }, 1200);
        }


        // -------------------------------------------------
        // Telefon-Hilfe (Scaffolding-Stufe 2).
        // -------------------------------------------------
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
                "Hol dir kurz Unterstützung im Raum. Sobald die Lehrkraft " +
                "die Zuordnung mit dir besprochen hat, kannst du dieses " +
                "Rätsel freischalten.";
            telefonBox.appendChild(text);

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "p1-telefon-btn";
            btn.textContent = "LEHRKRAFT-HILFE BESTÄTIGEN";
            btn.addEventListener("click", alleRichtig);
            telefonBox.appendChild(btn);
        }


        // -------------------------------------------------
        // Meldungen / Markierungen.
        // -------------------------------------------------
        function meldungZeigen(text, typ) {
            meldungsBox.textContent = text;
            meldungsBox.classList.remove("p1-meldung--warn", "p1-meldung--erfolg");
            meldungsBox.classList.add(
                typ === "erfolg" ? "p1-meldung--erfolg" : "p1-meldung--warn"
            );
            meldungsBox.classList.add("p1-meldung--sichtbar");
        }

        function meldungVerbergen() {
            meldungsBox.classList.remove("p1-meldung--sichtbar");
        }

        function entferneFehlerMarkierungen() {
            zonen.forEach(function (zone) {
                zone.classList.remove("p2-dropzone--falsch");
                const chip = zone.querySelector(".p2-chip");
                if (chip) chip.classList.remove("p2-chip--falsch");
            });
        }


        // -------------------------------------------------
        // Tastatur-Bedienung.
        //   Tab              : Fokus wandert durch Chips und Zonen.
        //   Enter auf Chip   : Chip auswählen / Auswahl aufheben.
        //   Enter auf Zone   : ausgewählten Chip dort droppen.
        //   Pfeiltasten      : Fokus zur nächsten Drop-Zone in
        //                      angegebener Richtung verschieben.
        // -------------------------------------------------
        function tastaturmodusAktivieren(wurzel) {
            let auswahl = null;

            wurzel.addEventListener("keydown", function (ev) {
                const ziel = ev.target;

                // Pfeiltasten: zur räumlich nächsten Drop-Zone springen.
                // Nur sinnvoll, wenn ein Chip ausgewählt ist ODER der
                // Fokus bereits auf einer Zone liegt.
                if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(ev.key) >= 0) {
                    const alleZonen = Array.prototype.slice.call(zonen);
                    const aktuell = ziel.classList &&
                                    ziel.classList.contains("p2-dropzone")
                        ? ziel : null;
                    if (!aktuell) {
                        if (auswahl && alleZonen.length) {
                            ev.preventDefault();
                            alleZonen[0].focus();
                        }
                        return;
                    }
                    ev.preventDefault();
                    const naechste = zoneInRichtungFinden(aktuell, ev.key, alleZonen);
                    if (naechste) naechste.focus();
                    return;
                }

                if (ev.key !== "Enter" && ev.key !== " ") return;

                if (ziel.classList.contains("p2-chip") &&
                    !ziel.classList.contains("p2-chip--fixiert")) {
                    ev.preventDefault();
                    if (auswahl) auswahl.classList.remove("p2-chip--ausgewaehlt");
                    auswahl = (auswahl === ziel) ? null : ziel;
                    if (auswahl) auswahl.classList.add("p2-chip--ausgewaehlt");
                } else if (auswahl && ziel.classList.contains("p2-dropzone")) {
                    ev.preventDefault();
                    const chipRef = auswahl;
                    auswahl.classList.remove("p2-chip--ausgewaehlt");
                    auswahl = null;

                    const rect = ziel.getBoundingClientRect();
                    chipAblegen(chipRef, ziel,
                                rect.left + rect.width / 2,
                                rect.top + rect.height / 2);
                }
            });
        }

        // Hilfsfunktion: räumlich nächste Drop-Zone in Richtung key finden.
        function zoneInRichtungFinden(aktuell, key, alle) {
            const r0 = aktuell.getBoundingClientRect();
            const cx0 = r0.left + r0.width / 2;
            const cy0 = r0.top + r0.height / 2;
            let beste = null;
            let besteDist = Infinity;
            alle.forEach(function (z) {
                if (z === aktuell) return;
                const r = z.getBoundingClientRect();
                const cx = r.left + r.width / 2;
                const cy = r.top + r.height / 2;
                const dx = cx - cx0;
                const dy = cy - cy0;
                let passt = false;
                if (key === "ArrowUp"    && dy < -5) passt = true;
                if (key === "ArrowDown"  && dy >  5) passt = true;
                if (key === "ArrowLeft"  && dx < -5) passt = true;
                if (key === "ArrowRight" && dx >  5) passt = true;
                if (!passt) return;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < besteDist) { besteDist = dist; beste = z; }
            });
            return beste;
        }
    };

})();
