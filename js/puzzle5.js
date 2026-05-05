/* ===========================================================
   Werkstatt-Blackout – puzzle5.js
   -----------------------------------------------------------
   Raetsel 5 – Bohrauftrag (3-Schritt-Raetsel: Bohrer, Drehzahl,
   Einspannung).
   Inhaltliche Grundlage: Drehzahltabelle (Info-Tafel 5) und
   Bohrertypen (Info-Tafel 2).

   Ablauf:
     Intro-Screen -> Schritt 1 (Bohrer aus 3x3-Box waehlen) ->
     Schritt 2 (Drehzahl per Schieberegler einstellen) ->
     Schritt 3 (Einspann-Methode waehlen) -> Erfolgs-Screen.

   Scaffolding:
     Nach 2 Fehlern im jeweiligen Schritt erscheint ein Hinweis-
     Button, der die passende Info-Tafel oeffnet (Tafel 2 fuer
     Schritt 1, Tafel 5 fuer Schritt 2). errorCount wird fuer
     die Urkunde am Spielende mitgezaehlt.
   =========================================================== */

"use strict";

window.puzzleRenderer = window.puzzleRenderer || {};


(function () {

    // -------------------------------------------------------
    // Schwellwert fuer Scaffolding (Fehler im aktuellen Schritt,
    // ab dem der Info-Tafel-Hinweis sichtbar wird).
    // -------------------------------------------------------
    const SCHWELLE_SCAFFOLDING = 2;

    // -------------------------------------------------------
    // Richtige Antworten
    // -------------------------------------------------------
    const RICHTIGER_BOHRER   = "holz-8";
    const RPM_RICHTWERT      = 1100;
    const RPM_TOLERANZ       = 150;    // +/- 150 U/min
    const RPM_SCHRITT        = 50;
    const EINSPANN_RICHTIG   = ["schraubzwinge", "schraubstock"];


    // -------------------------------------------------------
    // 3x3-Bohrerkasten: 3 Arten x 3 Groessen.
    // -------------------------------------------------------
    const BOHRER = [
        { id: "holz-6",    typ: "holz",    size: 6,  label: "HOLZ 6 mm" },
        { id: "holz-8",    typ: "holz",    size: 8,  label: "HOLZ 8 mm" },
        { id: "holz-10",   typ: "holz",    size: 10, label: "HOLZ 10 mm" },
        { id: "metall-6",  typ: "metall",  size: 6,  label: "METALL 6 mm" },
        { id: "metall-8",  typ: "metall",  size: 8,  label: "METALL 8 mm" },
        { id: "metall-10", typ: "metall",  size: 10, label: "METALL 10 mm" },
        { id: "stein-6",   typ: "stein",   size: 6,  label: "STEIN 6 mm" },
        { id: "stein-8",   typ: "stein",   size: 8,  label: "STEIN 8 mm" },
        { id: "stein-10",  typ: "stein",   size: 10, label: "STEIN 10 mm" }
    ];


    // -------------------------------------------------------
    // Einspann-Optionen fuer Schritt 3.
    // -------------------------------------------------------
    const EINSPANN_OPTIONEN = [
        {
            id: "schraubzwinge",
            label: "Schraubzwinge",
            beschreibung: "Presst das Werkstueck auf den Bohrtisch."
        },
        {
            id: "schraubstock",
            label: "Maschinenschraubstock",
            beschreibung: "Spannt das Werkstueck seitlich fest."
        },
        {
            id: "hand",
            label: "Mit der Hand festhalten",
            beschreibung: "Werkstueck wird von Hand gegen den Tisch gedrueckt."
        }
    ];


    // =======================================================
    // SVG-Platzhalter - spaeter durch Fotos ersetzbar
    // -------------------------------------------------------
    // Liefert das SVG-Markup fuer einen Bohrer (horizontal,
    // Spitze rechts). Typ und Durchmesser steuern Farbe und
    // Schaftdicke sowie die charakteristische Spitze.
    // =======================================================
    function bohrerSvg(typ, size) {

        // Schaftdicke waechst mit dem Durchmesser (deutlich gestaffelt).
        const dicke = size === 6 ? 6 : size === 8 ? 10 : 14;
        const mitte = 24;                   // vertikale Mitte in viewBox
        const oben  = mitte - dicke / 2;

        // Farben je Typ – so gewaehlt, dass die drei Arten auf den
        // ersten Blick unterscheidbar sind.
        const farben = {
            // Holzbohrer: silbrig-chrom, helles Metall
            holz:   {
                schaft:  "#E5E7EB",
                schatten: "#B8BDC5",
                spirale: "#6B7280",
                spitze:  "#D1D5DB",
                zentrier:"#4B5563"
            },
            // Metallbohrer (HSS): dunkler, leicht blaeulich
            metall: {
                schaft:  "#4B5A72",
                schatten: "#32405A",
                spirale: "#1F2937",
                spitze:  "#2F3C55",
                zentrier:"#0F172A"
            },
            // Steinbohrer: grau-silbern mit heller Hartmetallplatte
            stein:  {
                schaft:  "#9AA3B2",
                schatten: "#6E7687",
                spirale: "#4B5160",
                spitze:  "#E5E7EB",
                zentrier:"#374151"
            }
        };
        const f = farben[typ];

        // Holz hat eine schlanke, lange Spirale; Metall eine kompakte;
        // Stein eine gedrungene, breitere Spirale (per Laenge variiert).
        const spiralStart = 34;
        const spiralEnde  = typ === "holz" ? 108 :
                            typ === "metall" ? 102 : 96;
        const spiralLaenge = spiralEnde - spiralStart;
        const uebergang = spiralEnde;

        // Stein-Bohrer: Spirale insgesamt leicht ueberdickt (optisch klobig).
        const spiralOben = typ === "stein" ? oben - 1 : oben;
        const spiralDicke = typ === "stein" ? dicke + 2 : dicke;

        let svg =
            '<svg class="p5-bohrer-svg" viewBox="0 0 140 48" ' +
            'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +

            // Einspann-Schaft (glatter Zylinder, links).
            '<rect x="4" y="' + (oben - 1) + '" width="26" height="' +
            (dicke + 2) + '" rx="1.8" fill="' + f.schaft + '"/>' +
            // untere Schattenkante am Schaft fuer 3D-Look
            '<rect x="4" y="' + (oben + dicke - 1) + '" width="26" ' +
            'height="2" fill="' + f.schatten + '" opacity="0.7"/>' +

            // Uebergangsring
            '<rect x="30" y="' + (oben - 1.5) + '" width="4" height="' +
            (dicke + 3) + '" fill="' + f.spirale + '"/>' +

            // Spiralkoerper
            '<rect x="' + spiralStart + '" y="' + spiralOben +
            '" width="' + spiralLaenge + '" height="' + spiralDicke +
            '" fill="' + f.schaft + '"/>' +
            // Schattenkante unten am Spiralkoerper
            '<rect x="' + spiralStart + '" y="' +
            (spiralOben + spiralDicke - 2) + '" width="' + spiralLaenge +
            '" height="2" fill="' + f.schatten + '" opacity="0.65"/>';

        // Wendel-Nuten: Anzahl und Dichte je Typ.
        const anzNuten = typ === "stein" ? 5 :
                         typ === "metall" ? 6 : 8;
        const nutAbstand = spiralLaenge / (anzNuten + 1);
        for (let i = 1; i <= anzNuten; i++) {
            const x1 = spiralStart + i * nutAbstand - 3;
            svg +=
                '<line x1="' + x1 + '" y1="' + spiralOben +
                '" x2="' + (x1 + 6) + '" y2="' + (spiralOben + spiralDicke) +
                '" stroke="' + f.spirale + '" stroke-width="1.3" ' +
                'stroke-linecap="round"/>';
        }

        // Groessen-Gravur auf dem Schaft ("6", "8", "10").
        // Dezente eingepraegte Zahl, passt sich dem Schaft-Ton an.
        const gravurX = 17;
        const gravurFontSize = size === 10 ? 7 : 6.5;
        svg +=
            '<text x="' + gravurX + '" y="' + (mitte + 2.2) +
            '" text-anchor="middle" font-family="Verdana, sans-serif" ' +
            'font-size="' + gravurFontSize + '" font-weight="700" ' +
            'fill="' + f.zentrier + '" opacity="0.75" ' +
            'style="letter-spacing:0.5px">' + size + '</text>';

        // Typ-spezifische Spitze.
        if (typ === "holz") {
            // Holzbohrer: zwei deutliche Vorschneider-Zaehne seitlich +
            // lange, spitze Zentrierspitze in der Mitte.
            const zObenY = oben - 4;
            const zUntenY = oben + dicke + 4;
            svg +=
                // Oberer Vorschneider-Zahn
                '<polygon points="' +
                    uebergang + ',' + oben + ' ' +
                    (uebergang + 6) + ',' + zObenY + ' ' +
                    (uebergang + 10) + ',' + (oben - 1) +
                '" fill="' + f.schaft + '" stroke="' + f.zentrier +
                '" stroke-width="0.6" stroke-linejoin="round"/>' +
                // Unterer Vorschneider-Zahn
                '<polygon points="' +
                    uebergang + ',' + (oben + dicke) + ' ' +
                    (uebergang + 6) + ',' + zUntenY + ' ' +
                    (uebergang + 10) + ',' + (oben + dicke + 1) +
                '" fill="' + f.schaft + '" stroke="' + f.zentrier +
                '" stroke-width="0.6" stroke-linejoin="round"/>' +
                // Kernkoerper bis zur Zentrierspitze
                '<polygon points="' +
                    (uebergang + 2) + ',' + (mitte - 2) + ' ' +
                    (uebergang + 12) + ',' + (mitte - 1.3) + ' ' +
                    (uebergang + 12) + ',' + (mitte + 1.3) + ' ' +
                    (uebergang + 2) + ',' + (mitte + 2) +
                '" fill="' + f.schatten + '"/>' +
                // Lange, fein ausgezogene Zentrierspitze
                '<polygon points="' +
                    (uebergang + 12) + ',' + (mitte - 1.3) + ' ' +
                    (uebergang + 30) + ',' + mitte + ' ' +
                    (uebergang + 12) + ',' + (mitte + 1.3) +
                '" fill="' + f.zentrier + '"/>';

        } else if (typ === "metall") {
            // Metallbohrer: kegelfoermige Kegelspitze (ca. 118 Grad),
            // dunkel-blaeulich, KEINE Zentrierspitze.
            const kegelEnde = uebergang + 18;
            svg +=
                '<polygon points="' +
                    uebergang + ',' + oben + ' ' +
                    uebergang + ',' + (oben + dicke) + ' ' +
                    kegelEnde + ',' + mitte +
                '" fill="' + f.spitze + '" stroke="' + f.zentrier +
                '" stroke-width="0.5" stroke-linejoin="round"/>' +
                // Angedeutete Schneidkante auf der Kegelflaeche
                '<line x1="' + (uebergang + 1) + '" y1="' + (oben + 2) +
                '" x2="' + (kegelEnde - 2) + '" y2="' + mitte +
                '" stroke="#E5E7EB" stroke-width="0.7" opacity="0.6"/>';

        } else {
            // Steinbohrer: breite, flache Hartmetallplatte
            // ("Dachspitze"), silbern glaenzend, deutlich ueberstehend.
            const pObenY = oben - 5;
            const pUntenY = oben + dicke + 5;
            const plattenEnde = uebergang + 22;
            svg +=
                // Hartmetall-Dachspitze
                '<polygon points="' +
                    uebergang + ',' + pObenY + ' ' +
                    uebergang + ',' + pUntenY + ' ' +
                    (uebergang + 10) + ',' + pUntenY + ' ' +
                    plattenEnde + ',' + mitte + ' ' +
                    (uebergang + 10) + ',' + pObenY +
                '" fill="' + f.spitze + '" stroke="' + f.zentrier +
                '" stroke-width="0.7" stroke-linejoin="round"/>' +
                // Mittelschlitz der Hartmetallplatte
                '<line x1="' + (uebergang + 2) + '" y1="' + mitte +
                '" x2="' + (plattenEnde - 2) + '" y2="' + mitte +
                '" stroke="' + f.zentrier +
                '" stroke-width="0.9" opacity="0.85"/>';
        }

        svg += '</svg>';
        return svg;
    }


    // =======================================================
    // SVG-Symbole fuer die Einspann-Optionen (Schritt 3).
    // =======================================================
    function einspannSvg(id) {
        if (id === "schraubzwinge") {
            return '<svg class="p5-einspann-svg" viewBox="0 0 80 80" ' +
                'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
                // Werkstueck (Brett)
                '<rect x="14" y="44" width="52" height="10" ' +
                'fill="#C9A66B" stroke="#1A1A1A" stroke-width="1.4"/>' +
                // Tisch
                '<rect x="8" y="54" width="64" height="6" ' +
                'fill="#6B7280" stroke="#1A1A1A" stroke-width="1.4"/>' +
                // Zwinge (C-Form) mit Spindel oben
                '<path d="M 26 12 L 54 12 L 54 64 L 48 64 L 48 18 ' +
                'L 32 18 L 32 42 L 26 42 Z" fill="#374151" ' +
                'stroke="#1A1A1A" stroke-width="1.4"/>' +
                // Spindel-Griff quer
                '<rect x="22" y="36" width="14" height="4" ' +
                'fill="#9CA3AF" stroke="#1A1A1A" stroke-width="1.2"/>' +
                '<rect x="26" y="32" width="6" height="12" ' +
                'fill="#9CA3AF" stroke="#1A1A1A" stroke-width="1.2"/>' +
                '</svg>';
        }
        if (id === "schraubstock") {
            return '<svg class="p5-einspann-svg" viewBox="0 0 80 80" ' +
                'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
                // Tischplatte
                '<rect x="6" y="58" width="68" height="6" ' +
                'fill="#6B7280" stroke="#1A1A1A" stroke-width="1.4"/>' +
                // Linke Backe
                '<rect x="10" y="36" width="14" height="22" ' +
                'fill="#4B5563" stroke="#1A1A1A" stroke-width="1.4"/>' +
                // Rechte Backe
                '<rect x="56" y="36" width="14" height="22" ' +
                'fill="#4B5563" stroke="#1A1A1A" stroke-width="1.4"/>' +
                // Werkstueck in der Mitte
                '<rect x="24" y="40" width="32" height="14" ' +
                'fill="#C9A66B" stroke="#1A1A1A" stroke-width="1.4"/>' +
                // Spindel
                '<line x1="4" y1="47" x2="20" y2="47" ' +
                'stroke="#1A1A1A" stroke-width="2.5"/>' +
                // Kurbel
                '<circle cx="4" cy="47" r="4" fill="#9CA3AF" ' +
                'stroke="#1A1A1A" stroke-width="1.2"/>' +
                '</svg>';
        }
        // Hand-Option
        return '<svg class="p5-einspann-svg" viewBox="0 0 80 80" ' +
            'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
            // Tisch
            '<rect x="6" y="58" width="68" height="6" ' +
            'fill="#6B7280" stroke="#1A1A1A" stroke-width="1.4"/>' +
            // Werkstueck
            '<rect x="14" y="48" width="52" height="10" ' +
            'fill="#C9A66B" stroke="#1A1A1A" stroke-width="1.4"/>' +
            // Hand (stilisiert)
            '<path d="M 30 16 L 30 42 L 56 42 L 56 30 L 52 30 ' +
            'L 52 22 L 48 22 L 48 16 L 44 16 L 44 22 L 40 22 ' +
            'L 40 16 L 36 16 L 36 22 L 32 22 Z" ' +
            'fill="#F3D5A7" stroke="#1A1A1A" stroke-width="1.4" ' +
            'stroke-linejoin="round"/>' +
            // Warnsymbol
            '<circle cx="64" cy="20" r="10" fill="#E63946" ' +
            'stroke="#1A1A1A" stroke-width="1.4"/>' +
            '<text x="64" y="25" text-anchor="middle" fill="#FFF" ' +
            'font-size="14" font-weight="700">!</text>' +
            '</svg>';
    }


    // -------------------------------------------------------
    // Persistenter Zustand des Raetsels.
    // -------------------------------------------------------
    function holeOderInitZustand() {
        const p = (typeof getPuzzle === "function") ? getPuzzle(5) : null;
        if (!p) return null;
        if (typeof p.currentStep        !== "number") p.currentStep = 1;
        if (typeof p.stepErrorCount     !== "number") p.stepErrorCount = 0;
        // failedChecks zählt Fehler über die GESAMTE 3-Schritt-
        // Sequenz (Vorgabe einheitliches Hilfesystem).
        if (typeof p.failedChecks       !== "number") p.failedChecks = 0;
        if (typeof p.selectedDrill      !== "string") p.selectedDrill = "";
        if (typeof p.selectedRpm        !== "number") p.selectedRpm = 0;
        if (typeof p.selectedClamping   !== "string") p.selectedClamping = "";
        return p;
    }


    // =======================================================
    // Renderer – wird von main.js aufgerufen.
    // =======================================================
    window.puzzleRenderer[5] = function rendern(inhaltEl, schliesseModal) {

        inhaltEl.innerHTML = "";
        inhaltEl.classList.add("modal-inhalt--puzzle");
        inhaltEl._schliesseModal = schliesseModal;

        const puzzleState = holeOderInitZustand();
        if (!puzzleState) {
            console.error("Puzzle 5: State nicht verfuegbar.");
            return;
        }

        if (puzzleState.solved) {
            erfolgsScreenZeigen();
            return;
        }

        // Einheitlicher Hilfe-Slot im Modal-Footer. Lebt über alle
        // 3 Schritte hinweg (Schritt-Wechsel ersetzen nur die
        // Inhalts-Bühne, nicht den Footer).
        let hilfeSlot = null;
        const footerZiel = inhaltEl._footer || inhaltEl;
        hilfeSlot = footerZiel.querySelector(".hilfe-slot");
        if (!hilfeSlot) {
            hilfeSlot = document.createElement("div");
            hilfeSlot.className = "hilfe-slot";
            footerZiel.appendChild(hilfeSlot);
        }
        function aktualisiereHilfe() {
            if (window.werkstattHilfe) {
                window.werkstattHilfe.aktualisiere(
                    5, puzzleState.failedChecks || 0, hilfeSlot
                );
            }
        }
        // Beim Wiederbetreten den vorhandenen Stand sofort anzeigen.
        aktualisiereHilfe();
        // Anderen Schritt-Funktionen verfügbar machen.
        puzzleState._aktualisiereHilfe = aktualisiereHilfe;

        if (!puzzleState.auftragStarted) {
            introScreenZeigen();
        } else {
            schrittRendern(puzzleState.currentStep);
        }


        // ===================================================
        //  INTRO-SCREEN
        // ===================================================
        function introScreenZeigen() {
            inhaltEl.innerHTML = "";

            const intro = document.createElement("div");
            intro.className = "p5-intro";

            const titel = document.createElement("h3");
            titel.className = "p5-intro-titel";
            titel.textContent = "BOHRAUFTRAG";
            intro.appendChild(titel);

            const t1 = document.createElement("p");
            t1.className = "p5-intro-text";
            t1.textContent =
                "Die Sicherheits-Leuchte 5 blinkt rot. Die Maschine hat " +
                "einen Auftrag für dich:";
            intro.appendChild(t1);

            const auftrag = document.createElement("p");
            auftrag.className = "p5-intro-auftrag";
            auftrag.textContent =
                "Bohre ein 8-mm-Loch in ein Fichtenholz-Brett (20 × 30 cm).";
            intro.appendChild(auftrag);

            const t2 = document.createElement("p");
            t2.className = "p5-intro-text";
            t2.textContent =
                "Wähle nacheinander den richtigen Bohrer, stelle die " +
                "passende Drehzahl ein und sichere das Werkstück korrekt.";
            intro.appendChild(t2);

            const startBtn = document.createElement("button");
            startBtn.type = "button";
            startBtn.className = "p5-intro-btn";
            startBtn.textContent = "AUFTRAG STARTEN";
            startBtn.addEventListener("click", function () {
                puzzleState.auftragStarted = true;
                puzzleState.currentStep = 1;
                puzzleState.stepErrorCount = 0;
                schrittRendern(1);
            });
            intro.appendChild(startBtn);

            inhaltEl.appendChild(intro);
            setTimeout(function () { startBtn.focus(); }, 0);
        }


        // ===================================================
        //  SCHRITT-WEICHE
        // ===================================================
        function schrittRendern(nummer) {
            puzzleState.currentStep = nummer;
            puzzleState.stepErrorCount = 0;
            inhaltEl.innerHTML = "";
            fortschrittskopfBauen(nummer);

            if (nummer === 1) schritt1Bauen();
            else if (nummer === 2) schritt2Bauen();
            else if (nummer === 3) schritt3Bauen();
        }


        function fortschrittskopfBauen(nummer) {
            const kopf = document.createElement("div");
            kopf.className = "p5-fortschritt";

            const label = document.createElement("div");
            label.className = "p5-fortschritt-label";
            label.textContent = "Schritt " + nummer + " von 3";
            kopf.appendChild(label);

            const balken = document.createElement("div");
            balken.className = "p5-balken";
            for (let i = 1; i <= 3; i++) {
                const seg = document.createElement("div");
                seg.className = "p5-balken-seg" +
                    (i < nummer ? " p5-balken-seg--fertig" :
                     i === nummer ? " p5-balken-seg--aktiv" : "");
                balken.appendChild(seg);
            }
            kopf.appendChild(balken);
            inhaltEl.appendChild(kopf);
        }


        // ===================================================
        //  SCHRITT 1 – BOHRER WAEHLEN
        // ===================================================
        function schritt1Bauen() {

            const titel = document.createElement("h3");
            titel.className = "p5-schritt-titel";
            titel.textContent = "Schritt 1: Bohrer wählen";
            inhaltEl.appendChild(titel);

            const frage = document.createElement("p");
            frage.className = "p5-schritt-frage";
            frage.textContent = "Welcher Bohrer passt für 8 mm in Fichtenholz?";
            inhaltEl.appendChild(frage);

            // 3x3-Bohrerkasten
            const kasten = document.createElement("div");
            kasten.className = "p5-bohrerkasten";
            kasten.setAttribute("role", "radiogroup");
            kasten.setAttribute("aria-label", "Bohrerauswahl");

            let aktuelleAuswahl = "";

            BOHRER.forEach(function (b) {
                const fach = document.createElement("button");
                fach.type = "button";
                fach.className = "p5-bohrer-fach";
                fach.dataset.bohrerId = b.id;
                fach.setAttribute("role", "radio");
                fach.setAttribute("aria-checked", "false");
                fach.setAttribute("aria-label", b.label);

                const svgBox = document.createElement("div");
                svgBox.className = "p5-bohrer-svg-box";
                svgBox.innerHTML = bohrerSvg(b.typ, b.size);
                fach.appendChild(svgBox);

                // Kein sichtbares Text-Label – die SuS muss die Art
                // am Aussehen erkennen. Die Groesse ist als Gravur
                // im SVG-Schaft angebracht.

                fach.addEventListener("click", function () {
                    aktuelleAuswahl = b.id;
                    kasten.querySelectorAll(".p5-bohrer-fach").forEach(function (f) {
                        f.classList.remove("p5-bohrer-fach--gewaehlt");
                        f.setAttribute("aria-checked", "false");
                    });
                    fach.classList.add("p5-bohrer-fach--gewaehlt");
                    fach.setAttribute("aria-checked", "true");
                    pruefenBtn.disabled = false;
                });

                kasten.appendChild(fach);
            });
            inhaltEl.appendChild(kasten);

            // Feedback-Container
            const feedback = document.createElement("div");
            feedback.className = "p5-feedback p5-feedback--versteckt";
            feedback.setAttribute("role", "status");
            feedback.setAttribute("aria-live", "polite");
            inhaltEl.appendChild(feedback);

            // Hilfe-Bereich
            const hilfe = document.createElement("div");
            hilfe.className = "p5-hilfe";
            const infoBtn = document.createElement("button");
            infoBtn.type = "button";
            infoBtn.className = "p5-info-btn p5-info-btn--versteckt";
            infoBtn.textContent = "📖 Info-Tafel Bohrertypen öffnen";
            infoBtn.addEventListener("click", function () {
                if (typeof window.openInfoPanel === "function") {
                    window.openInfoPanel("info-2");
                }
            });
            hilfe.appendChild(infoBtn);
            inhaltEl.appendChild(hilfe);

            // Pruefen-Button
            const pruefenBtn = document.createElement("button");
            pruefenBtn.type = "button";
            pruefenBtn.className = "p5-pruefen-btn";
            pruefenBtn.textContent = "AUSWAHL BESTÄTIGEN";
            pruefenBtn.disabled = true;
            pruefenBtn.addEventListener("click", function () {
                if (!aktuelleAuswahl) return;
                auswahlPruefenSchritt1(aktuelleAuswahl);
            });
            inhaltEl.appendChild(pruefenBtn);

            // Bereits vorhandene Auswahl wiederherstellen.
            if (puzzleState.selectedDrill) {
                const prev = kasten.querySelector(
                    '[data-bohrer-id="' + puzzleState.selectedDrill + '"]');
                if (prev) prev.click();
            }

            // --- Hilfs-Logik fuer Feedback & Scaffolding ---
            function auswahlPruefenSchritt1(drillId) {
                const gewaehlt = BOHRER.find(function (b) {
                    return b.id === drillId;
                });
                const richtig = BOHRER.find(function (b) {
                    return b.id === RICHTIGER_BOHRER;
                });

                if (drillId === RICHTIGER_BOHRER) {
                    puzzleState.selectedDrill = drillId;
                    feedbackZeigen(feedback, {
                        art: "richtig",
                        titel: "RICHTIG!",
                        body: "Dieser Bohrer hat eine Zentrierspitze – " +
                              "sie verhindert, dass der Bohrer im Holz " +
                              "wandert.",
                        knopfText: "WEITER",
                        onKnopf: function () {
                            schrittRendern(2);
                        }
                    });
                    // Auswahl sperren
                    kasten.querySelectorAll(".p5-bohrer-fach").forEach(function (f) {
                        f.disabled = true;
                    });
                    pruefenBtn.disabled = true;
                    pruefenBtn.style.display = "none";
                } else {
                    puzzleState.stepErrorCount += 1;
                    puzzleState.errorCount     += 1;
                    puzzleState.failedChecks   += 1;
                    if (typeof puzzleState._aktualisiereHilfe === "function") {
                        puzzleState._aktualisiereHilfe();
                    }

                    let body;
                    if (gewaehlt.typ !== richtig.typ &&
                        gewaehlt.size !== richtig.size) {
                        body = "Falscher Typ und falsche Größe. Merkmale " +
                               "der Bohrer-Arten genau anschauen.";
                    } else if (gewaehlt.typ !== richtig.typ) {
                        body = "Der Bohrer-Typ passt nicht zum Werkstoff. " +
                               "Schau dir die Spitzen der Bohrer genau " +
                               "an – für Holz brauchst du eine bestimmte " +
                               "Form.";
                    } else {
                        body = "Bohrer-Typ stimmt, aber die Größe passt " +
                               "nicht. Der Auftrag verlangt 8 mm.";
                    }

                    feedbackZeigen(feedback, {
                        art: "falsch",
                        titel: "⚠ NICHT RICHTIG",
                        body: body,
                        knopfText: "NOCHMAL VERSUCHEN",
                        onKnopf: function () {
                            feedback.classList.add("p5-feedback--versteckt");
                            feedback.innerHTML = "";
                        }
                    });

                    // Hilfe-Staffel kommt jetzt zentral aus
                    // js/hilfe.js (siehe aktualisiereHilfe oben).
                    // Die alte SCHWELLE_SCAFFOLDING-Logik ist
                    // entfallen.
                }
            }
        }


        // ===================================================
        //  SCHRITT 2 – DREHZAHL EINSTELLEN
        // ===================================================
        function schritt2Bauen() {

            const titel = document.createElement("h3");
            titel.className = "p5-schritt-titel";
            titel.textContent = "Schritt 2: Drehzahl einstellen";
            inhaltEl.appendChild(titel);

            const frage = document.createElement("p");
            frage.className = "p5-schritt-frage";
            frage.textContent =
                "Stelle die richtige Drehzahl für 8 mm in Holz ein.";
            inhaltEl.appendChild(frage);

            // ---------- Tabellen-Button (von Anfang an sichtbar) ----------
            const tabelleBtnWrap = document.createElement("div");
            tabelleBtnWrap.className = "p5-tabelle-btn-wrap";
            const tabelleBtn = document.createElement("button");
            tabelleBtn.type = "button";
            tabelleBtn.className = "p5-tabelle-btn";
            tabelleBtn.innerHTML =
                '<span class="p5-tabelle-btn-icon" aria-hidden="true">' +
                '<svg viewBox="0 0 24 24" width="18" height="18" ' +
                'fill="none" stroke="currentColor" stroke-width="2" ' +
                'stroke-linecap="round" stroke-linejoin="round">' +
                '<rect x="3" y="4" width="18" height="16" rx="2"/>' +
                '<line x1="3" y1="10" x2="21" y2="10"/>' +
                '<line x1="3" y1="15" x2="21" y2="15"/>' +
                '<line x1="9" y1="4" x2="9" y2="20"/>' +
                '<line x1="15" y1="4" x2="15" y2="20"/>' +
                '</svg></span>' +
                '<span>Drehzahl-Tabelle anzeigen</span>';
            tabelleBtn.addEventListener("click", tabellenOverlayOeffnen);
            tabelleBtnWrap.appendChild(tabelleBtn);
            inhaltEl.appendChild(tabelleBtnWrap);

            // ---------- Live-Anzeige ----------
            const anzeige = document.createElement("div");
            anzeige.className = "p5-rpm-anzeige";
            const zahl = document.createElement("span");
            zahl.className = "p5-rpm-zahl";
            zahl.textContent = "0";
            anzeige.appendChild(zahl);
            const einheit = document.createElement("span");
            einheit.className = "p5-rpm-einheit";
            einheit.textContent = " U/min";
            anzeige.appendChild(einheit);
            inhaltEl.appendChild(anzeige);

            // ---------- Schieberegler ----------
            const reglerWrap = document.createElement("div");
            reglerWrap.className = "p5-regler-wrap";

            const regler = document.createElement("input");
            regler.type = "range";
            regler.min = "0";
            regler.max = "3000";
            regler.step = String(RPM_SCHRITT);
            regler.value = String(puzzleState.selectedRpm || 0);
            regler.className = "p5-regler";
            regler.setAttribute("aria-label",
                "Drehzahl einstellen in Umdrehungen pro Minute");
            regler.setAttribute("aria-valuemin", "0");
            regler.setAttribute("aria-valuemax", "3000");
            regler.setAttribute("aria-valuenow", regler.value);

            function anzeigeAktualisieren() {
                const v = parseInt(regler.value, 10);
                zahl.textContent = String(v);
                regler.setAttribute("aria-valuenow", String(v));
                const p = Math.round((v / 3000) * 100);
                regler.style.background =
                    "linear-gradient(to right, #4ADE80 0%, #4ADE80 " +
                    p + "%, #374151 " + p + "%, #374151 100%)";
            }
            regler.addEventListener("input", anzeigeAktualisieren);
            reglerWrap.appendChild(regler);

            // Skalen-Marker
            const skala = document.createElement("div");
            skala.className = "p5-skala";
            [0, 1000, 2000, 3000].forEach(function (v) {
                const m = document.createElement("span");
                m.className = "p5-skala-marker";
                m.textContent = v;
                skala.appendChild(m);
            });
            reglerWrap.appendChild(skala);
            inhaltEl.appendChild(reglerWrap);

            anzeigeAktualisieren();

            // ---------- Feedback ----------
            const feedback = document.createElement("div");
            feedback.className = "p5-feedback p5-feedback--versteckt";
            feedback.setAttribute("role", "status");
            feedback.setAttribute("aria-live", "polite");
            inhaltEl.appendChild(feedback);

            // ---------- Pruefen-Button ----------
            const pruefenBtn = document.createElement("button");
            pruefenBtn.type = "button";
            pruefenBtn.className = "p5-pruefen-btn";
            pruefenBtn.textContent = "DREHZAHL BESTÄTIGEN";
            pruefenBtn.addEventListener("click", drehzahlPruefen);
            inhaltEl.appendChild(pruefenBtn);

            function drehzahlPruefen() {
                const v = parseInt(regler.value, 10);
                puzzleState.selectedRpm = v;

                if (v === 0) {
                    puzzleState.stepErrorCount += 1;
                    puzzleState.errorCount     += 1;
                    puzzleState.failedChecks   += 1;
                    if (typeof puzzleState._aktualisiereHilfe === "function") {
                        puzzleState._aktualisiereHilfe();
                    }
                    feedbackZeigen(feedback, {
                        art: "falsch",
                        titel: "⚠ KEINE EINSTELLUNG",
                        body: "Du musst die Drehzahl einstellen. Schau " +
                              "in der Drehzahl-Tabelle nach.",
                        knopfText: "NOCHMAL VERSUCHEN",
                        onKnopf: function () {
                            feedback.classList.add("p5-feedback--versteckt");
                            feedback.innerHTML = "";
                        }
                    });
                } else if (v >= RPM_RICHTWERT - RPM_TOLERANZ &&
                           v <= RPM_RICHTWERT + RPM_TOLERANZ) {
                    feedbackZeigen(feedback, {
                        art: "richtig",
                        titel: "RICHTIG!",
                        body: "1100 U/min ist der Richtwert für 8 mm in Holz.",
                        knopfText: "WEITER",
                        onKnopf: function () { schrittRendern(3); }
                    });
                    regler.disabled = true;
                    pruefenBtn.disabled = true;
                    pruefenBtn.style.display = "none";
                } else if (v > RPM_RICHTWERT + RPM_TOLERANZ) {
                    puzzleState.stepErrorCount += 1;
                    puzzleState.errorCount     += 1;
                    puzzleState.failedChecks   += 1;
                    if (typeof puzzleState._aktualisiereHilfe === "function") {
                        puzzleState._aktualisiereHilfe();
                    }
                    feedbackZeigen(feedback, {
                        art: "falsch",
                        titel: "⚠ ZU HOCH",
                        body: "Zu hohe Drehzahl. Der Bohrer würde das " +
                              "Holz verbrennen und stumpf werden. Schau " +
                              "in der Drehzahl-Tabelle nach.",
                        knopfText: "NOCHMAL VERSUCHEN",
                        onKnopf: function () {
                            feedback.classList.add("p5-feedback--versteckt");
                            feedback.innerHTML = "";
                        }
                    });
                } else {
                    puzzleState.stepErrorCount += 1;
                    puzzleState.errorCount     += 1;
                    puzzleState.failedChecks   += 1;
                    if (typeof puzzleState._aktualisiereHilfe === "function") {
                        puzzleState._aktualisiereHilfe();
                    }
                    feedbackZeigen(feedback, {
                        art: "falsch",
                        titel: "⚠ ZU NIEDRIG",
                        body: "Zu niedrige Drehzahl. Der Bohrer arbeitet " +
                              "unsauber und reißt das Holz. Schau in " +
                              "der Drehzahl-Tabelle nach.",
                        knopfText: "NOCHMAL VERSUCHEN",
                        onKnopf: function () {
                            feedback.classList.add("p5-feedback--versteckt");
                            feedback.innerHTML = "";
                        }
                    });
                }
            }
        }


        // ===================================================
        //  DREHZAHLTABELLEN-OVERLAY
        // -------------------------------------------------
        // Eigenstaendiges Overlay UEBER dem Raetsel-Modal.
        // Zeigt das Tabellen-Bild gross und lesbar. Raetsel-
        // State bleibt unberuehrt; Schliessen via X, Escape
        // oder Klick ausserhalb des Bildes.
        // ===================================================
        function tabellenOverlayOeffnen() {
            // Doppel-Oeffnung verhindern.
            if (document.querySelector(".p5-tabelle-overlay")) return;

            const overlay = document.createElement("div");
            overlay.className = "p5-tabelle-overlay";
            overlay.setAttribute("role", "dialog");
            overlay.setAttribute("aria-modal", "true");
            overlay.setAttribute("aria-label", "Drehzahl-Tabelle");

            const rahmen = document.createElement("div");
            rahmen.className = "p5-tabelle-rahmen";

            const schliessBtn = document.createElement("button");
            schliessBtn.type = "button";
            schliessBtn.className = "p5-tabelle-close";
            schliessBtn.setAttribute("aria-label", "Drehzahl-Tabelle schließen");
            schliessBtn.textContent = "\u00D7";
            rahmen.appendChild(schliessBtn);

            const bild = document.createElement("img");
            bild.className = "p5-tabelle-bild";
            bild.src = "assets/infotafel/Drehzahltabelle.png";
            bild.alt = "Drehzahl-Tabelle mit Richtwerten fuer Holz, " +
                       "Metall und Stein";
            bild.draggable = false;
            rahmen.appendChild(bild);

            overlay.appendChild(rahmen);
            document.body.appendChild(overlay);

            function schliessen() {
                document.removeEventListener("keydown", escHandler);
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }
            function escHandler(ev) {
                if (ev.key === "Escape") {
                    ev.stopPropagation();
                    schliessen();
                }
            }
            schliessBtn.addEventListener("click", schliessen);
            overlay.addEventListener("click", function (ev) {
                if (ev.target === overlay) schliessen();
            });
            document.addEventListener("keydown", escHandler);

            setTimeout(function () { schliessBtn.focus(); }, 0);
        }


        // ===================================================
        //  SCHRITT 3 – WERKSTUECK SICHERN
        // ===================================================
        function schritt3Bauen() {

            const titel = document.createElement("h3");
            titel.className = "p5-schritt-titel";
            titel.textContent = "Schritt 3: Werkstück sichern";
            inhaltEl.appendChild(titel);

            const frage = document.createElement("p");
            frage.className = "p5-schritt-frage";
            frage.textContent =
                "Wie sicherst du das Fichtenholz-Brett auf dem Bohrtisch?";
            inhaltEl.appendChild(frage);

            const karten = document.createElement("div");
            karten.className = "p5-karten";
            karten.setAttribute("role", "radiogroup");
            karten.setAttribute("aria-label", "Einspann-Methode");

            let aktuelleAuswahl = "";

            EINSPANN_OPTIONEN.forEach(function (opt) {
                const karte = document.createElement("button");
                karte.type = "button";
                karte.className = "p5-karte";
                karte.dataset.optId = opt.id;
                karte.setAttribute("role", "radio");
                karte.setAttribute("aria-checked", "false");
                karte.setAttribute("aria-label", opt.label);

                const svgBox = document.createElement("div");
                svgBox.className = "p5-karte-svg-box";
                svgBox.innerHTML = einspannSvg(opt.id);
                karte.appendChild(svgBox);

                const lbl = document.createElement("div");
                lbl.className = "p5-karte-label";
                lbl.textContent = opt.label;
                karte.appendChild(lbl);

                const beschreibung = document.createElement("div");
                beschreibung.className = "p5-karte-text";
                beschreibung.textContent = opt.beschreibung;
                karte.appendChild(beschreibung);

                karte.addEventListener("click", function () {
                    aktuelleAuswahl = opt.id;
                    karten.querySelectorAll(".p5-karte").forEach(function (k) {
                        k.classList.remove("p5-karte--gewaehlt");
                        k.setAttribute("aria-checked", "false");
                    });
                    karte.classList.add("p5-karte--gewaehlt");
                    karte.setAttribute("aria-checked", "true");
                    pruefenBtn.disabled = false;
                });

                karten.appendChild(karte);
            });
            inhaltEl.appendChild(karten);

            const feedback = document.createElement("div");
            feedback.className = "p5-feedback p5-feedback--versteckt";
            feedback.setAttribute("role", "status");
            feedback.setAttribute("aria-live", "polite");
            inhaltEl.appendChild(feedback);

            const pruefenBtn = document.createElement("button");
            pruefenBtn.type = "button";
            pruefenBtn.className = "p5-pruefen-btn";
            pruefenBtn.textContent = "AUSWAHL BESTÄTIGEN";
            pruefenBtn.disabled = true;
            pruefenBtn.addEventListener("click", function () {
                if (!aktuelleAuswahl) return;
                einspannPruefen(aktuelleAuswahl);
            });
            inhaltEl.appendChild(pruefenBtn);

            function einspannPruefen(id) {
                if (EINSPANN_RICHTIG.indexOf(id) !== -1) {
                    puzzleState.selectedClamping = id;
                    feedbackZeigen(feedback, {
                        art: "richtig",
                        titel: "RICHTIG!",
                        body: "Das Werkstück wird fest mit dem Bohrtisch " +
                              "verbunden – keine Gefahr des Mitdrehens.",
                        knopfText: "WEITER",
                        onKnopf: erfolgsScreenZeigen
                    });
                    karten.querySelectorAll(".p5-karte").forEach(function (k) {
                        k.disabled = true;
                    });
                    pruefenBtn.disabled = true;
                    pruefenBtn.style.display = "none";
                } else {
                    puzzleState.stepErrorCount += 1;
                    puzzleState.errorCount     += 1;
                    puzzleState.failedChecks   += 1;
                    if (typeof puzzleState._aktualisiereHilfe === "function") {
                        puzzleState._aktualisiereHilfe();
                    }
                    feedbackZeigen(feedback, {
                        art: "falsch",
                        titel: "⚠ GEFAHR!",
                        body: "Werkstücke dürfen NIE mit der Hand " +
                              "gehalten werden. Wenn der Bohrer greift, " +
                              "dreht sich das Werkstück mit und reißt " +
                              "die Hand zum Bohrer. An der " +
                              "Ständerbohrmaschine: IMMER einspannen.",
                        knopfText: "NOCHMAL VERSUCHEN",
                        onKnopf: function () {
                            feedback.classList.add("p5-feedback--versteckt");
                            feedback.innerHTML = "";
                        }
                    });
                }
            }
        }


        // ===================================================
        //  FEEDBACK-BOX (wiederverwendbar)
        // ===================================================
        function feedbackZeigen(container, cfg) {
            container.innerHTML = "";
            container.classList.remove(
                "p5-feedback--versteckt",
                "p5-feedback--richtig",
                "p5-feedback--falsch"
            );
            container.classList.add(
                "p5-feedback--" + (cfg.art === "richtig" ? "richtig" : "falsch")
            );

            const h = document.createElement("div");
            h.className = "p5-feedback-titel";
            h.textContent = cfg.titel;
            container.appendChild(h);

            const p = document.createElement("p");
            p.className = "p5-feedback-text";
            p.textContent = cfg.body;
            container.appendChild(p);

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "p5-weiter-btn";
            btn.textContent = cfg.knopfText;
            btn.addEventListener("click", cfg.onKnopf);
            container.appendChild(btn);

            setTimeout(function () { btn.focus(); }, 0);
        }


        function tippStreifen(text) {
            const tipp = document.createElement("div");
            tipp.className = "p5-tipp-streifen";
            tipp.textContent = text;
            inhaltEl.appendChild(tipp);
        }


        // ===================================================
        //  ERFOLGS-SCREEN
        // ===================================================
        function erfolgsScreenZeigen() {
            inhaltEl.innerHTML = "";

            const erfolg = document.createElement("div");
            erfolg.className = "p5-erfolg";

            const check = document.createElement("div");
            check.className = "p5-erfolg-check";
            check.textContent = "✓";
            erfolg.appendChild(check);

            const titel = document.createElement("h3");
            titel.className = "p5-erfolg-titel";
            titel.textContent = "BOHRAUFTRAG ERFOLGREICH!";
            erfolg.appendChild(titel);

            const text = document.createElement("p");
            text.className = "p5-erfolg-text";
            text.textContent =
                "Du hast den richtigen Bohrer gewählt, die passende " +
                "Drehzahl eingestellt und das Werkstück sicher gespannt. " +
                "Sicherheits-Leuchte 5 wechselt auf grün.";
            erfolg.appendChild(text);

            const weiter = document.createElement("button");
            weiter.type = "button";
            weiter.className = "p5-weiter-btn";
            weiter.textContent = "WEITER";
            weiter.addEventListener("click", abschluss);
            erfolg.appendChild(weiter);

            inhaltEl.appendChild(erfolg);
            setTimeout(function () { weiter.focus(); }, 0);

            // Draft-Felder aufraeumen, errorCount bleibt (Urkunde).
            // failedChecks wird zurückgesetzt, damit Hilfe-Stufe
            // beim nächsten Öffnen wieder bei 0 startet.
            delete puzzleState.currentStep;
            delete puzzleState.stepErrorCount;
            delete puzzleState.failedChecks;
            delete puzzleState.selectedDrill;
            delete puzzleState.selectedRpm;
            delete puzzleState.selectedClamping;
            delete puzzleState.auftragStarted;
            if (window.werkstattHilfe && hilfeSlot) {
                window.werkstattHilfe.aktualisiere(5, 0, hilfeSlot);
            }

            const autoTimer = setTimeout(abschluss, 2200);
            weiter.addEventListener("click", function () {
                clearTimeout(autoTimer);
            });

            function abschluss() {
                if (typeof window.loesePuzzle === "function") {
                    window.loesePuzzle(5);
                } else if (typeof window.markPuzzleSolved === "function") {
                    window.markPuzzleSolved(5);
                }
                if (typeof inhaltEl._schliesseModal === "function") {
                    inhaltEl._schliesseModal();
                }
            }
        }
    };

})();
