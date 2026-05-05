/* ===========================================================
   Werkstatt-Blackout – puzzles.js
   -----------------------------------------------------------
   Sammel-Datei für die echten Rätsel-Inhalte.

   Jedes Rätsel registriert seinen Renderer unter
   window.puzzleRenderer[<id>]. main.js ruft den Renderer auf,
   sobald der Spieler auf die zugehörige Leuchte klickt und
   das Rätsel noch nicht gelöst ist.

   Signatur der Renderer:
     render(inhaltEl, schliesseModal)
       inhaltEl      – Container im Modal (.modal-inhalt)
       schliesseModal – Callback, um das Modal zu schließen.
   =========================================================== */

"use strict";

window.puzzleRenderer = window.puzzleRenderer || {};


// ===========================================================
// Puzzle 1: "Teile der Standbohrmaschine"
// ===========================================================
// Zuordnungsaufgabe: 10 Bauteile (Buchstaben a–j) werden per
// Drag-and-Drop mit ihrem Namen verbunden.
//
// Pädagogisches Design (gegen "Brute-Force-Raten"):
//   – Beim Ablegen gibt es KEIN sofortiges Richtig/Falsch-
//     Feedback. Der Begriff wird neutral gesetzt.
//   – Chips lassen sich jederzeit wieder herausziehen oder mit
//     einem anderen Chip tauschen.
//   – Erst der Klick auf "ANTWORTEN PRÜFEN" bewertet die
//     gesamte Lösung. Der Button ist ausgegraut, solange noch
//     nicht alle 10 Zonen belegt sind.
//   – Bei einer Teillösung erfährt der Spieler nur, WIE VIELE
//     Zuordnungen falsch sind (nicht welche).
//   – Ab dem 4. fehlgeschlagenen Prüfversuch werden die falschen
//     Zuordnungen rot markiert (Scaffolding-Stufe 1).
//   – Ab dem 6. Fehlversuch erscheint ein Telefon-Hinweis
//     "Frag deine Lehrkraft" (Stufe 2). Ein Klick darauf darf
//     das Rätsel freischalten – niemand soll hängenbleiben.
// ===========================================================
(function () {

    // -----------------------------------------------------
    // Layout-Daten für das Bild assets/Baugruppen.png.
    //
    // Im Bild sind bereits visuell eingezeichnet:
    //   – 9 gestrichelte Rechtecke an den Bauteilen
    //     (Drop-Ziele für die Begriffe)
    //   – 9 Begriffe-Chips am unteren Bildrand
    //     (Drag-Quellen, im Bild gemalt – statisch)
    //
    // DROP_ZIELE  – unsichtbare HTML-Bereiche über den Rechtecken
    //               im Bild. Mappen Buchstabe → korrekter Begriff
    //               und tragen die prozentuale Position auf dem
    //               Bild (responsive).
    // CHIP_QUELLEN – unsichtbare HTML-Bereiche über den im Bild
    //               gemalten Begriffe-Chips. Beim Drag erzeugen
    //               sie einen Geist-Chip, der dem Cursor folgt.
    //
    // Alle Werte sind PROZENT der Bildgröße. Erst grob geschätzt –
    // nach erstem Test einfach hier feinjustieren.
    // -----------------------------------------------------
    // Drop-Ziele – unsichtbare HTML-Bereiche über den im Bild
    // gemalten leeren Rechtecken. Position in PROZENT der Bild-
    // größe (responsive).
    //
    // WICHTIG: left/top sind jetzt der MITTELPUNKT des Drop-Felds.
    // Im CSS wird per `transform: translate(-50%, -50%)` zentriert,
    // damit man die per Kalibrierungs-Modus (Strg+D) gemessenen
    // Klick-Koordinaten direkt 1:1 übernehmen kann.
    const DROP_ZIELE = [
        { letter: "a", begriff: "Ein-/Ausschalter",      left: 15.6, top: 24.1, width: 28, height: 5 },
        { letter: "b", begriff: "Drehzahlregler",        left: 16.5, top: 48.9, width: 28, height: 5 },
        { letter: "c", begriff: "Vorschubhebel",         left: 78.3, top: 36.7, width: 28, height: 5 },
        { letter: "d", begriff: "Bohrfutter",            left: 21.7, top: 64.5, width: 28, height: 5 },
        { letter: "e", begriff: "Tiefenanschlag",        left: 73.5, top: 65.0, width: 28, height: 5 },
        { letter: "f", begriff: "Bohrer",                left: 75.4, top: 82.7, width: 28, height: 5 },
        { letter: "g", begriff: "Säule",                 left: 76.6, top: 73.8, width: 28, height: 5 },
        { letter: "h", begriff: "Maschinenschraubstock", left: 24.7, top: 75.4, width: 28, height: 5 },
        { letter: "i", begriff: "Maschinentisch",        left: 79.4, top: 92.4, width: 28, height: 5 }
    ];

    // Aus DROP_ZIELE abgeleitete Buchstabe → Begriff-Tabelle für
    // die Prüfungs-Logik (antwortenPruefen).
    const ZUORDNUNG = {};
    DROP_ZIELE.forEach(function (dz) { ZUORDNUNG[dz.letter] = dz.begriff; });

    // Schwellwerte für das Scaffolding.
    const SCHWELLE_MARKIERUNG = 3;   // ab dem (SCHWELLE+1). Fehlversuch: Falsche rot
    const SCHWELLE_TELEFON    = 6;   // ab diesem Fehlversuch: Telefon-Hilfe


    // ---------------------------------------------------------
    // Persistenz-Helfer
    // ---------------------------------------------------------
    // Der Zwischenstand des Rätsels (welcher Begriff liegt in
    // welcher Zone + Zahl der bisherigen Prüfungs-Fehlversuche)
    // wird im globalen Puzzle-Objekt abgelegt. Dadurch kann das
    // Modal jederzeit geschlossen werden (SCHLIESSEN-Button,
    // Escape, Klick auf Overlay), ohne dass Fortschritt verloren
    // geht. Beim erneuten Öffnen stellt der Renderer den Stand
    // wieder her.
    //
    // Format:
    //   puzzle.draftAssignments = { a: "Motor", b: "Bohrer", ... }
    //   puzzle.failedChecks     = 2
    //
    // Gelöscht wird der Draft beim erfolgreichen Lösen (löschen
    // in alleRichtig) sowie beim "Nochmal spielen" (resetState
    // in state.js baut die Puzzle-Objekte komplett neu aus den
    // ANFANGS_PUZZLES, Draft-Felder sind dort nicht gesetzt und
    // fehlen daher nach dem Reset).
    // ---------------------------------------------------------
    function holeOderInitZustand() {
        const p = (typeof getPuzzle === "function") ? getPuzzle(1) : null;
        if (!p) return null;
        if (!p.draftAssignments || typeof p.draftAssignments !== "object") {
            p.draftAssignments = {};
        }
        if (typeof p.failedChecks !== "number") {
            p.failedChecks = 0;
        }
        return p;
    }

    // ---------------------------------------------------------
    // (Frühere SVG-Skizze und Baugruppen-Overlay entfernt –
    // das Patent-Layout nutzt assets/Bohrmaschine.png als
    // reine Strichzeichnung in der Mitte; Drop-Felder stehen
    // links/rechts daneben und sind via SVG-Linien mit dem
    // Bauteil verbunden.)
    // ---------------------------------------------------------
    // ---------------------------------------------------------
    // Zufallsreihenfolge (Fisher-Yates) für die Chip-Liste.
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


    // ---------------------------------------------------------
    // Drop-Feld-Kalibrierungs-Modus (Strg+D, nur Dev-Hilfe)
    // ---------------------------------------------------------
    // Aktiviert eine deutliche rote Umrandung um alle 9 Drop-Felder,
    // blendet die aktuellen %-Koordinaten als Label ein und schaltet
    // einen Klick-Tool-Modus frei: Klick auf das Patent-Bild zeigt
    // die Maus-Position als Prozentwert in einem Toast – damit kann
    // die Wunsch-Position eines Drop-Feldes direkt aus dem Bild
    // abgelesen und im Code-Array DROP_ZIELE eingetragen werden.
    //
    // Aktivierung:  Strg+D (preventDefault verhindert das Browser-
    //               Lesezeichen-Menü).
    // Geltungs-
    // bereich:      Nur während das Rätsel-1-Modal offen ist – sobald
    //               der bildWrap nicht mehr im DOM hängt, deaktiviert
    //               sich der Listener selbst.
    // ---------------------------------------------------------
    function dropKalibrierungInitialisieren(bildWrap, zielListe) {

        let aktiv = false;

        function keyHandler(ev) {
            if (!ev.ctrlKey) return;
            if (ev.key !== "d" && ev.key !== "D") return;
            // Wenn der Bild-Wrapper nicht mehr im DOM ist (Modal
            // geschlossen), Listener entfernen und nichts tun.
            if (!bildWrap.isConnected) {
                window.removeEventListener("keydown", keyHandler, true);
                return;
            }
            ev.preventDefault();
            ev.stopPropagation();
            aktiv = !aktiv;
            anwenden();
        }

        function anwenden() {
            if (aktiv) {
                bildWrap.classList.add("p1-kalibrieren");
                zielListe.forEach(function (z) {
                    let label = z.querySelector(".p1-kalib-label");
                    if (!label) {
                        label = document.createElement("span");
                        label.className = "p1-kalib-label";
                        z.appendChild(label);
                    }
                    label.textContent =
                        (z.style.left || "?") + " / " +
                        (z.style.top  || "?");
                });
                // Konsolenausgabe mit allen aktuellen Positionen
                // (CSS-Prozentwerte + tatsächliche Bildschirm-Pixel).
                const positionen = zielListe.map(function (z) {
                    const rect = z.getBoundingClientRect();
                    return {
                        letter: z.dataset.letter,
                        css: {
                            left:   z.style.left,
                            top:    z.style.top,
                            width:  z.style.width,
                            height: z.style.height
                        },
                        px: {
                            left:   Math.round(rect.left),
                            top:    Math.round(rect.top),
                            width:  Math.round(rect.width),
                            height: Math.round(rect.height)
                        }
                    };
                });
                console.log("Drop-Kalibrierung AN", positionen);
                kalibrierToastZeigen("Drop-Feld-Kalibrierung AN");
            } else {
                bildWrap.classList.remove("p1-kalibrieren");
                zielListe.forEach(function (z) {
                    const label = z.querySelector(".p1-kalib-label");
                    if (label && label.parentNode) {
                        label.parentNode.removeChild(label);
                    }
                });
                console.log("Drop-Kalibrierung AUS");
                kalibrierToastZeigen("Drop-Feld-Kalibrierung AUS");
            }
        }

        // Klick aufs Bild im Kalibrierungs-Modus: %-Position des
        // Mauszeigers ermitteln und in einem Toast anzeigen.
        function clickHandler(ev) {
            if (!aktiv) return;
            const bild = bildWrap.querySelector(".p1-bild");
            if (!bild) return;
            const rect = bild.getBoundingClientRect();
            if (ev.clientX < rect.left || ev.clientX > rect.right ||
                ev.clientY < rect.top  || ev.clientY > rect.bottom) {
                return;
            }
            const xPct = ((ev.clientX - rect.left) / rect.width)  * 100;
            const yPct = ((ev.clientY - rect.top)  / rect.height) * 100;
            const text =
                "Klick: x=" + xPct.toFixed(1) +
                "%, y=" + yPct.toFixed(1) + "%";
            kalibrierToastZeigen(text);
            console.log("Drop-Kalib " + text);
        }

        window.addEventListener("keydown", keyHandler, true);
        bildWrap.addEventListener("click", clickHandler, true);
    }

    // Eigenes Toast unten rechts (3 s sichtbar). Nutzt die
    // Klassen .p1-kalib-toast / --sichtbar im Stylesheet.
    function kalibrierToastZeigen(text) {
        const toast = document.createElement("div");
        toast.className = "p1-kalib-toast";
        toast.textContent = text;
        document.body.appendChild(toast);
        requestAnimationFrame(function () {
            toast.classList.add("p1-kalib-toast--sichtbar");
        });
        setTimeout(function () {
            toast.classList.remove("p1-kalib-toast--sichtbar");
            setTimeout(function () {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 2500);
    }


    // ---------------------------------------------------------
    // Renderer: baut das Rätsel im übergebenen Inhalts-Container auf.
    // Der gesamte Rätsel-Zustand lebt im Closure dieser Funktion –
    // beim nächsten Öffnen des Rätsels wird alles frisch aufgebaut.
    // ---------------------------------------------------------
    window.puzzleRenderer[1] = function rendern(inhaltEl, schliesseModal) {

        // Inhalt leeren und in den Patent-Look bringen.
        inhaltEl.innerHTML = "";
        inhaltEl.classList.add("modal-inhalt--puzzle");

        // Modal-Panel im Patent-Look einfärben (cremefarbener Hinter-
        // grund, schwarzer Doppelrahmen, Schraubenköpfe in den Ecken).
        // Beim Schließen wird das Panel komplett aus dem DOM entfernt –
        // Cleanup ist daher nicht nötig.
        const panelEl = inhaltEl.parentElement;
        if (panelEl) {
            panelEl.classList.add("modal-panel--p1");
            if (!panelEl.querySelector(".p1-schraube")) {
                ["tl", "tr", "bl", "br"].forEach(function (ecke) {
                    const schraube = document.createElement("span");
                    schraube.className = "p1-schraube p1-schraube--" + ecke;
                    schraube.setAttribute("aria-hidden", "true");
                    panelEl.appendChild(schraube);
                });
            }
        }

        // Persistenten Rätsel-Zustand laden (Draft-Zuordnungen + Fehl-
        // versuche überleben damit das Schließen und Wiederöffnen).
        const puzzleState = holeOderInitZustand();
        if (!puzzleState) {
            console.error("Puzzle 1: State nicht verfügbar.");
            return;
        }

        // Wurzel-Elemente, auf die interne Helfer zugreifen.
        let pruefenBtn, pruefenHinweis, meldungsBox, telefonBox;
        let zielListe;        // Array mit allen Drop-Ziel-Elementen
        let chipPool;         // Container der ziehbaren Chip-Leiste

        // -----------------------------------------------------
        // Patent-Wrapper. Der Modal-Header (vom generischen
        // openPuzzle gebaut) zeigt bereits den Titel
        // "RÄTSEL 1: Teile der Maschine" – der wird hier nicht
        // dupliziert.
        // -----------------------------------------------------
        const patent = document.createElement("div");
        patent.className = "p1-patent";

        const aufgabe = document.createElement("p");
        aufgabe.className = "p1-aufgabe";
        aufgabe.textContent =
            "Ordne die neun Begriffe den passenden Stellen am " +
            "Patentbild zu. Wenn du fertig bist, klicke auf " +
            "ANTWORTEN PRÜFEN.";
        patent.appendChild(aufgabe);

        // Bild-Wrapper: trägt das Patentbild und 9 transparente
        // Drop-Ziele über den im Bild gemalten Rechtecken.
        const bildWrap = document.createElement("div");
        bildWrap.className = "p1-bildwrap";

        const bild = document.createElement("img");
        bild.className = "p1-bild";
        bild.src = "assets/Baugruppen.png";
        bild.alt =
            "Patentbild der Standbohrmaschine mit 9 leeren Drop-" +
            "Feldern, die mit Linien zu den Bauteilen verbunden sind";
        bild.draggable = false;
        bildWrap.appendChild(bild);

        // 9 unsichtbare Drop-Ziele über den gestrichelten Rechtecken
        // im Bild positionieren. Beim Pointer-Down auf ein bereits
        // belegtes Ziel wird der dort liegende Begriff zurück in den
        // Pool gezogen (über zielPointerDown).
        zielListe = DROP_ZIELE.map(function (dz) {
            const ziel = document.createElement("div");
            ziel.className = "p1-drop-ziel";
            ziel.dataset.letter = dz.letter;
            ziel.style.left   = dz.left   + "%";
            ziel.style.top    = dz.top    + "%";
            ziel.style.width  = dz.width  + "%";
            ziel.style.height = dz.height + "%";
            ziel.setAttribute("role", "button");
            ziel.setAttribute("tabindex", "0");
            ziel.setAttribute("aria-label",
                "Drop-Feld " + dz.letter +
                " (Soll-Begriff: " + dz.begriff + ")");
            ziel.addEventListener("pointerdown", zielPointerDown);
            bildWrap.appendChild(ziel);
            return ziel;
        });

        patent.appendChild(bildWrap);

        // Chip-Leiste UNTER dem Bild: 9 ziehbare HTML-Chips in
        // zufälliger Reihenfolge. Die Chips werden beim erfolg-
        // reichen Drop aus der Leiste entfernt; bei Drop ins Leere
        // oder beim Verdrängen aus einem Drop-Ziel kommen sie
        // wieder in den Pool zurück.
        const poolWrap = document.createElement("div");
        poolWrap.className = "p1-pool-wrap";

        const poolUeberschrift = document.createElement("div");
        poolUeberschrift.className = "p1-pool-titel";
        poolUeberschrift.textContent = "BEGRIFFE ZUR AUSWAHL:";
        poolWrap.appendChild(poolUeberschrift);

        chipPool = document.createElement("div");
        chipPool.className = "p1-pool";
        mischen(Object.values(ZUORDNUNG)).forEach(function (begriff) {
            chipPool.appendChild(chipErstellen(begriff));
        });
        poolWrap.appendChild(chipPool);
        patent.appendChild(poolWrap);

        inhaltEl.appendChild(patent);

        // -----------------------------------------------------
        // Footer-Slot des Modals: Meldungs-Box, Telefon-Hilfe,
        // PRÜFEN-Zeile (Status-Hinweis + Button).
        // -----------------------------------------------------
        const footerZiel = inhaltEl._footer || inhaltEl;

        meldungsBox = document.createElement("div");
        meldungsBox.className = "p1-meldung";
        meldungsBox.setAttribute("role", "status");
        meldungsBox.setAttribute("aria-live", "polite");
        footerZiel.appendChild(meldungsBox);

        // Hilfe-Slot (einheitlich, wird von js/hilfe.js bedient).
        telefonBox = document.createElement("div");
        telefonBox.className = "hilfe-slot";
        footerZiel.appendChild(telefonBox);

        const pruefenZeile = document.createElement("div");
        pruefenZeile.className = "p1-pruefen-zeile";

        pruefenHinweis = document.createElement("span");
        pruefenHinweis.className = "p1-pruefen-hinweis";
        pruefenHinweis.textContent = "Ordne erst alle Begriffe zu.";

        pruefenBtn = document.createElement("button");
        pruefenBtn.type = "button";
        pruefenBtn.className = "p1-pruefen-btn";
        pruefenBtn.textContent = "ANTWORTEN PRÜFEN";
        pruefenBtn.disabled = true;
        pruefenBtn.addEventListener("click", antwortenPruefen);

        pruefenZeile.appendChild(pruefenHinweis);
        pruefenZeile.appendChild(pruefenBtn);
        footerZiel.appendChild(pruefenZeile);

        // -----------------------------------------------------
        // Zwischenstand wiederherstellen: für jede gespeicherte
        // Zuordnung den Chip aus dem Pool entfernen und den Begriff
        // im Drop-Ziel anzeigen.
        // -----------------------------------------------------
        Object.keys(puzzleState.draftAssignments).forEach(function (letter) {
            const begriff = puzzleState.draftAssignments[letter];
            const ziel = bildWrap.querySelector(
                '.p1-drop-ziel[data-letter="' + letter + '"]'
            );
            if (!ziel || !begriff) return;
            zuweisungSetzen(ziel, begriff);
            const chipImPool = findeChipImPool(begriff);
            if (chipImPool && chipImPool.parentNode) {
                chipImPool.parentNode.removeChild(chipImPool);
            }
        });

        // Tastatur-Bedienung aktivieren.
        tastaturmodusAktivieren(inhaltEl);

        // Drop-Feld-Kalibrierungs-Modus (nur während Modal offen).
        // Strg+D toggelt rote Umrandung + Klick-Tool für die Drop-
        // Felder; ist nur in der Entwicklung gedacht.
        dropKalibrierungInitialisieren(bildWrap, zielListe);

        // Erste Aktualisierung des Button-Status (X/9-Anzeige).
        statusPruefenButton();

        // Hilfe-Stand wiederherstellen (Tipp/Auto-Tafel/Telefon).
        if (window.werkstattHilfe) {
            window.werkstattHilfe.aktualisiere(
                1, puzzleState.failedChecks || 0, telefonBox
            );
        }

        // Schließ-Callback merken (für alleRichtig-Sequenz).
        inhaltEl._schliesseModal = schliesseModal;


        // =====================================================
        //  Drag-and-Drop-Logik (Pointer-Events, Touch-fähig)
        // =====================================================
        //
        // Datenmodell:
        //   – Pool enthält ein <div class="p1-chip"> pro noch nicht
        //     zugewiesenem Begriff.
        //   – ziel.dataset.begriff = "Bohrer" → Begriff ist diesem
        //     Drop-Ziel zugewiesen, Text-Overlay sichtbar.
        //
        // Drag-Pfade:
        //   1. Pointer-Down auf Pool-Chip → Chip aus dem Pool
        //      ausblenden, Geist-Chip folgt dem Cursor.
        //   2. Pointer-Down auf belegtes Drop-Ziel → Zuweisung
        //      lösen, Geist-Chip folgt dem Cursor.
        //
        // Drop-Pfade:
        //   – Auf Drop-Ziel: Begriff zuweisen. Falls Ziel schon
        //     belegt, alter Begriff geht zurück in den Pool.
        //   – Ins Leere: Begriff geht zurück in den Pool.
        // =====================================================
        let aktuellerHover = null;   // Drop-Ziel unter dem Cursor

        // chipErstellen(begriff): Pool-Chip mit Drag-Handler.
        function chipErstellen(begriff) {
            const chip = document.createElement("div");
            chip.className = "p1-chip";
            chip.textContent = begriff;
            chip.dataset.term = begriff;
            chip.setAttribute("role", "button");
            chip.setAttribute("tabindex", "0");
            chip.setAttribute("aria-label",
                "Begriff " + begriff + " – ziehen oder mit Enter auswählen");
            chip.addEventListener("pointerdown", chipPointerDown);
            return chip;
        }

        // Pointer-Down auf Pool-Chip → Drag startet, Original-Chip
        // wird ausgeblendet (kommt zurück, falls Drop ins Leere).
        function chipPointerDown(ereignis) {
            ereignis.preventDefault();
            const chip = ereignis.currentTarget;
            const term = chip.dataset.term;
            // Original-Chip im Pool transparent stellen (sichtbar aber
            // visuell entkoppelt). Pointer-Events deaktivieren, damit
            // er keinen Re-Drag oder Hover triggert.
            chip.style.opacity = "0.3";
            chip.style.pointerEvents = "none";
            dragStarten(term, ereignis, chip, null);
        }

        // Pointer-Down auf belegtes Drop-Ziel → Zuweisung lösen,
        // Geist-Chip startet aus dem Ziel heraus.
        function zielPointerDown(ereignis) {
            const ziel = ereignis.currentTarget;
            const begriff = ziel.dataset.begriff;
            if (!begriff) return;
            ereignis.preventDefault();
            zuweisungEntfernen(ziel);
            dragStarten(begriff, ereignis, null, ziel);
        }

        // Zentrale Drag-Logik:
        //   – term:        Begriff der gerade gezogen wird
        //   – ereignis:    auslösendes Pointer-Event
        //   – poolChip:    Original-Chip im Pool, der bei "Drop ins
        //                  Leere" wieder sichtbar gemacht wird.
        //                  null, falls der Drag aus einem Ziel kam.
        //   – ursprungZiel: Drop-Ziel, aus dem der Begriff kam.
        //                  null, falls der Drag aus dem Pool kam.
        function dragStarten(term, ereignis, poolChip, ursprungZiel) {

            // Vor jeder Umordnung Fehler-Markierungen + Meldung weg.
            entferneFehlerMarkierungen();
            meldungVerbergen();

            const geist = document.createElement("div");
            geist.className = "p1-geist-chip";
            geist.textContent = term;
            geist.style.left = (ereignis.clientX + 10) + "px";
            geist.style.top  = (ereignis.clientY + 10) + "px";
            document.body.appendChild(geist);

            function bewegen(ev) {
                geist.style.left = (ev.clientX + 10) + "px";
                geist.style.top  = (ev.clientY + 10) + "px";
                aktualisiereHoverZiel(geist, ev.clientX, ev.clientY);
            }

            function beenden(ev) {
                window.removeEventListener("pointermove",   bewegen);
                window.removeEventListener("pointerup",     beenden);
                window.removeEventListener("pointercancel", beenden);
                loescheHoverZiel();

                // Drop-Ziel ermitteln (Geist kurz durchlässig machen).
                geist.style.pointerEvents = "none";
                const unter = document.elementFromPoint(ev.clientX, ev.clientY);
                geist.style.pointerEvents = "";
                const ziel = unter && unter.closest(".p1-drop-ziel");

                if (ziel) {
                    // Falls Ziel schon belegt: alter Begriff zurück
                    // in den Pool (frischer Chip mit dem alten Term).
                    if (ziel.dataset.begriff) {
                        const alterBegriff = ziel.dataset.begriff;
                        zuweisungEntfernen(ziel);
                        chipPool.appendChild(chipErstellen(alterBegriff));
                    }
                    zuweisungSetzen(ziel, term);
                    // Original-Pool-Chip dauerhaft entfernen, falls
                    // er aus dem Pool stammte.
                    if (poolChip && poolChip.parentNode) {
                        poolChip.parentNode.removeChild(poolChip);
                    }
                } else {
                    // Drop ins Leere → Begriff zurück in den Pool.
                    if (poolChip) {
                        // Original-Chip war nur transparent – wieder
                        // voll sichtbar und interaktiv machen.
                        poolChip.style.opacity = "";
                        poolChip.style.pointerEvents = "";
                    } else {
                        // Drag kam aus einem Drop-Ziel: neuen Chip
                        // im Pool anlegen.
                        chipPool.appendChild(chipErstellen(term));
                    }
                }

                if (geist.parentNode) geist.parentNode.removeChild(geist);
                speichereDraft();
                statusPruefenButton();
            }

            window.addEventListener("pointermove",   bewegen);
            window.addEventListener("pointerup",     beenden);
            window.addEventListener("pointercancel", beenden);
        }

        // Helfer: ersten Pool-Chip mit gegebenem Begriff finden.
        function findeChipImPool(begriff) {
            return chipPool.querySelector(
                '.p1-chip[data-term="' + cssEscape(begriff) + '"]'
            );
        }
        // Minimaler CSS-Escape für Attribut-Selektor (Anführungs-
        // zeichen + Backslashes entwerten). Reicht für unsere
        // Begriffe ("/", "-", Umlaute werden nicht escapt – kein
        // Sonderzeichen in unseren Begriffen, dass das nötig wäre).
        function cssEscape(s) {
            return String(s).replace(/(["\\])/g, "\\$1");
        }

        function aktualisiereHoverZiel(geist, x, y) {
            geist.style.pointerEvents = "none";
            const el = document.elementFromPoint(x, y);
            geist.style.pointerEvents = "";
            const ziel = el && el.closest(".p1-drop-ziel");
            if (ziel !== aktuellerHover) {
                if (aktuellerHover) {
                    aktuellerHover.classList.remove("p1-drop-ziel--hover");
                }
                if (ziel) ziel.classList.add("p1-drop-ziel--hover");
                aktuellerHover = ziel;
            }
        }
        function loescheHoverZiel() {
            if (aktuellerHover) {
                aktuellerHover.classList.remove("p1-drop-ziel--hover");
            }
            aktuellerHover = null;
        }

        // -----------------------------------------------------
        // zuweisungSetzen / zuweisungEntfernen / findeZielMitBegriff
        // -----------------------------------------------------
        // Verwalten den Zuweisungs-Status pro Drop-Ziel und das
        // Text-Overlay (Schablonenschrift, schwarz, zentriert).
        // -----------------------------------------------------
        function zuweisungSetzen(ziel, begriff) {
            ziel.dataset.begriff = begriff;
            ziel.classList.add("p1-drop-ziel--belegt");
            let overlay = ziel.querySelector(".p1-zuweisung-overlay");
            if (!overlay) {
                overlay = document.createElement("span");
                overlay.className = "p1-zuweisung-overlay";
                ziel.appendChild(overlay);
            }
            overlay.textContent = begriff;
        }

        function zuweisungEntfernen(ziel) {
            delete ziel.dataset.begriff;
            ziel.classList.remove(
                "p1-drop-ziel--belegt",
                "p1-drop-ziel--falsch",
                "p1-drop-ziel--richtig"
            );
            const overlay = ziel.querySelector(".p1-zuweisung-overlay");
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }

        function findeZielMitBegriff(term) {
            for (let i = 0; i < zielListe.length; i++) {
                if (zielListe[i].dataset.begriff === term) return zielListe[i];
            }
            return null;
        }

        // -----------------------------------------------------
        // speichereDraft(): aktuellen Stand in puzzleState ablegen.
        // -----------------------------------------------------
        function speichereDraft() {
            const draft = {};
            zielListe.forEach(function (z) {
                if (z.dataset.begriff) {
                    draft[z.dataset.letter] = z.dataset.begriff;
                }
            });
            puzzleState.draftAssignments = draft;
        }


        // =====================================================
        //  PRÜFEN, Erfolg, Fehler-Markierung, Telefon-Hilfe,
        //  Meldungen, Tastatur-Modus
        // =====================================================

        function statusPruefenButton() {
            const gefuellte = zielListe.filter(function (z) {
                return !!z.dataset.begriff;
            }).length;
            const komplett = gefuellte === zielListe.length;

            pruefenBtn.disabled = !komplett;
            if (komplett) {
                pruefenHinweis.textContent =
                    "Alle Zuordnungen gesetzt – jetzt prüfen.";
                pruefenHinweis.classList.remove("p1-pruefen-hinweis--warn");
            } else {
                pruefenHinweis.textContent =
                    "Ordne erst alle Begriffe zu. (" + gefuellte +
                    "/" + zielListe.length + ")";
                pruefenHinweis.classList.add("p1-pruefen-hinweis--warn");
            }
        }

        function antwortenPruefen() {
            if (pruefenBtn.disabled) return;

            // Falsch zugeordnete Ziele sammeln.
            const falsche = zielListe.filter(function (z) {
                const soll = ZUORDNUNG[z.dataset.letter];
                return z.dataset.begriff !== soll;
            });

            entferneFehlerMarkierungen();

            if (falsche.length === 0) {
                alleRichtig();
                return;
            }

            puzzleState.failedChecks += 1;
            puzzleState.errorCount   += 1;

            const anzahl = falsche.length;
            let text = "Noch nicht ganz richtig. " + anzahl + " von " +
                       zielListe.length + " Zuordnungen stimmen nicht.";

            // Optisches Feedback: falsche Zuordnungen rot markieren
            // (immer ab dem ersten Fehler, nicht mehr verstaffelt).
            if (puzzleState.failedChecks >= SCHWELLE_MARKIERUNG) {
                falsche.forEach(function (z) {
                    z.classList.add("p1-drop-ziel--falsch");
                });
                text +=
                    " Hinweis: Die rot markierten Zuordnungen sind " +
                    "nicht korrekt.";
            }
            meldungZeigen(text, "warn");

            // Einheitliches Hilfesystem (2/3/4-Staffelung).
            if (window.werkstattHilfe) {
                window.werkstattHilfe.aktualisiere(
                    1, puzzleState.failedChecks, telefonBox
                );
            }
        }

        function alleRichtig() {
            zielListe.forEach(function (z) {
                z.classList.add("p1-drop-ziel--richtig");
                // Drag-Handler abklemmen, damit nichts mehr verschoben wird.
                z.removeEventListener("pointerdown", zielPointerDown);
            });
            // Pool-Chips deaktivieren (Drag würde ohnehin nichts mehr
            // bewirken, da alle Begriffe schon zugewiesen sind, aber
            // wir entfernen den Listener sauber).
            chipPool.querySelectorAll(".p1-chip").forEach(function (c) {
                c.removeEventListener("pointerdown", chipPointerDown);
            });

            pruefenBtn.disabled = true;
            pruefenBtn.style.display = "none";
            pruefenHinweis.style.display = "none";
            // Hilfe-Slot leeren (Erfolg → Fehlerzähler zurück auf 0).
            if (window.werkstattHilfe) {
                window.werkstattHilfe.aktualisiere(1, 0, telefonBox);
            }

            meldungZeigen("Alle Teile richtig zugeordnet!", "erfolg");

            delete puzzleState.draftAssignments;
            delete puzzleState.failedChecks;

            setTimeout(function () {
                if (typeof window.loesePuzzle === "function") {
                    window.loesePuzzle(1);
                }
                if (typeof inhaltEl._schliesseModal === "function") {
                    inhaltEl._schliesseModal();
                }
            }, 1200);
        }

        function telefonHilfeZeigen() {
            if (!telefonBox.classList.contains("p1-telefon--versteckt")) return;
            telefonBox.classList.remove("p1-telefon--versteckt");
            telefonBox.innerHTML = "";

            const t = document.createElement("div");
            t.className = "p1-telefon-titel";
            t.textContent = "📞 Frag deine Lehrkraft!";
            telefonBox.appendChild(t);

            const txt = document.createElement("div");
            txt.className = "p1-telefon-text";
            txt.textContent =
                "Hol dir kurz Unterstützung im Raum. Sobald die Lehrkraft " +
                "die Zuordnung mit dir besprochen hat, kannst du dieses " +
                "Rätsel freischalten.";
            telefonBox.appendChild(txt);

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "p1-telefon-btn";
            btn.textContent = "LEHRKRAFT-HILFE BESTÄTIGEN";
            btn.addEventListener("click", alleRichtig);
            telefonBox.appendChild(btn);
        }

        function meldungZeigen(text, typ) {
            meldungsBox.textContent = text;
            meldungsBox.classList.remove(
                "p1-meldung--warn", "p1-meldung--erfolg"
            );
            meldungsBox.classList.add(
                typ === "erfolg" ? "p1-meldung--erfolg" : "p1-meldung--warn"
            );
            meldungsBox.classList.add("p1-meldung--sichtbar");
        }

        function meldungVerbergen() {
            meldungsBox.classList.remove("p1-meldung--sichtbar");
        }

        function entferneFehlerMarkierungen() {
            zielListe.forEach(function (z) {
                z.classList.remove("p1-drop-ziel--falsch");
            });
        }

        // -----------------------------------------------------
        // Tastatur-Bedienung (Barrierefreiheit).
        // Enter/Leertaste auf Drag-Quelle    → Begriff "in der Hand"
        //                                     merken (oder erneut
        //                                     drücken zum Abwählen).
        // Enter/Leertaste auf Drop-Ziel      → markierten Begriff
        //                                     dort ablegen, oder –
        //                                     wenn das Ziel schon
        //                                     belegt ist und keiner
        //                                     in der Hand – Begriff
        //                                     aus dem Ziel nehmen.
        // -----------------------------------------------------
        function tastaturmodusAktivieren(wurzel) {
            // Tastatur-Modus für die neue Pool-Variante:
            //   – Enter/Leertaste auf Pool-Chip   → Chip auswählen
            //     (zweites Drücken hebt Auswahl auf).
            //   – Enter/Leertaste auf Drop-Ziel:
            //       • Hat man einen Chip in der Hand → ablegen (mit
            //         Pool-Recycle, falls Ziel belegt war).
            //       • Andernfalls und Ziel belegt → Begriff zurück
            //         in den Pool.
            let aktiverChip = null;

            wurzel.addEventListener("keydown", function (ev) {
                if (ev.key !== "Enter" && ev.key !== " ") return;
                const treffer = ev.target;

                if (treffer.classList.contains("p1-chip") &&
                    treffer.parentNode === chipPool) {
                    ev.preventDefault();
                    if (aktiverChip === treffer) {
                        treffer.classList.remove("p1-chip--ausgewaehlt");
                        aktiverChip = null;
                    } else {
                        if (aktiverChip) {
                            aktiverChip.classList.remove("p1-chip--ausgewaehlt");
                        }
                        aktiverChip = treffer;
                        treffer.classList.add("p1-chip--ausgewaehlt");
                    }
                } else if (treffer.classList.contains("p1-drop-ziel")) {
                    ev.preventDefault();
                    if (aktiverChip) {
                        const begriff = aktiverChip.dataset.term;
                        // Falls Ziel belegt: alten Begriff in den Pool.
                        if (treffer.dataset.begriff) {
                            const alterBegriff = treffer.dataset.begriff;
                            zuweisungEntfernen(treffer);
                            chipPool.appendChild(chipErstellen(alterBegriff));
                        }
                        zuweisungSetzen(treffer, begriff);
                        // Aktiven Chip aus Pool entfernen.
                        if (aktiverChip.parentNode) {
                            aktiverChip.parentNode.removeChild(aktiverChip);
                        }
                        aktiverChip = null;
                        speichereDraft();
                        statusPruefenButton();
                    } else if (treffer.dataset.begriff) {
                        // Begriff aus belegtem Ziel zurück in den Pool.
                        const begriff = treffer.dataset.begriff;
                        zuweisungEntfernen(treffer);
                        chipPool.appendChild(chipErstellen(begriff));
                        speichereDraft();
                        statusPruefenButton();
                    }
                }
            });
        }
    };

})();
