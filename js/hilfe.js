/* ===========================================================
   Werkstatt-Blackout – hilfe.js
   -----------------------------------------------------------
   Einheitliches Hilfesystem für alle 5 Rätsel.

   Staffelung anhand des Fehlerzählers (failedChecks):
     2 Fehler  → Tipp + Button "Info-Tafel öffnen"
     3 Fehler  → Info-Tafel öffnet sich automatisch
     4+ Fehler → Telefon-Hinweis "Frag deine Lehrkraft"

   Pro Rätsel ist genau eine Info-Tafel hinterlegt
   (HILFE_TAFEL). Die Info-Tafel wird über das bestehende
   window.openInfoPanel(id) (main.js) geöffnet – der
   Bearbeitungsstand des Rätsels bleibt im Hintergrund-Modal
   erhalten, weil die Info-Tafel als eigenes Overlay darüber
   erscheint.

   Keine Zeit-/Inaktivitätslogik – ausschließlich der Fehler-
   zähler steuert die Staffelung.
   =========================================================== */

"use strict";

(function () {

    // Zuordnung Rätsel-Id → Info-Tafel-Id.
    const HILFE_TAFEL = {
        1: "info-1",   // Aufbau der Standbohrmaschine
        2: "info-2",   // Bohrertypen
        3: "info-3",   // Betriebsanweisung
        4: "info-4",   // Sicheres Arbeiten (Erklärfilm)
        5: "info-5"    // Drehzahltabelle
    };

    // Schwellwerte – einheitlich für alle Rätsel.
    const SCHWELLE_TIPP    = 2;
    const SCHWELLE_AUTO    = 3;
    const SCHWELLE_TELEFON = 4;

    // -----------------------------------------------------------
    // aktualisiere(puzzleId, failedChecks, slotEl, opts)
    // -----------------------------------------------------------
    // Rendert den passenden Hilfe-Zustand in das übergebene
    // slot-Element (ein <div>, das das Rätsel im Footer-Bereich
    // bereitstellt). Bei jeder neuen Fehler-Eingabe rufen die
    // einzelnen Rätsel diese Funktion mit dem aktuellen Wert
    // von failedChecks auf.
    //
    // opts (optional):
    //   onBestaetigt: function – wird aufgerufen, wenn der
    //                 Spieler den Telefon-Hinweis quittiert
    //                 (Klick auf "Habe ich gemacht").
    // -----------------------------------------------------------
    function aktualisiere(puzzleId, failedChecks, slotEl, opts) {
        if (!slotEl) return;
        opts = opts || {};

        const tafelId = HILFE_TAFEL[puzzleId];
        slotEl.innerHTML = "";
        slotEl.classList.remove(
            "hilfe-slot--tipp",
            "hilfe-slot--telefon"
        );

        if (failedChecks >= SCHWELLE_TELEFON) {
            slotEl.classList.add("hilfe-slot--telefon");
            renderTelefon(slotEl, opts);
            return;
        }

        if (failedChecks >= SCHWELLE_AUTO) {
            // Stufe 2: Info-Tafel automatisch öffnen. Damit das
            // nicht bei jedem Render-Aufruf erneut passiert
            // (z. B. beim Wiederbetreten des Rätsels), merken
            // wir uns am Slot, ob die automatische Öffnung
            // schon ausgelöst wurde.
            const bisher = slotEl.dataset.autoGeoeffnetBei;
            if (bisher !== String(failedChecks)) {
                slotEl.dataset.autoGeoeffnetBei = String(failedChecks);
                oeffneInfoTafel(tafelId, puzzleId);
            }
            // Trotzdem den Tipp-Block als Hinweis stehen lassen,
            // falls der Spieler die Info-Tafel schließt.
            slotEl.classList.add("hilfe-slot--tipp");
            renderTipp(slotEl, tafelId, puzzleId);
            return;
        }

        if (failedChecks >= SCHWELLE_TIPP) {
            slotEl.classList.add("hilfe-slot--tipp");
            renderTipp(slotEl, tafelId, puzzleId);
            return;
        }

        // Unter der Tipp-Schwelle: Slot bleibt leer.
        delete slotEl.dataset.autoGeoeffnetBei;
    }

    // -----------------------------------------------------------
    // Tipp-Block: kurzer Hinweis + Button zum Öffnen der Tafel.
    // -----------------------------------------------------------
    function renderTipp(slotEl, tafelId, puzzleId) {
        const text = document.createElement("p");
        text.className = "hilfe-tipp";
        text.textContent =
            "Tipp: Schau dir die zugehörige Info-Tafel an. " +
            "Dort findest du die Lösung.";
        slotEl.appendChild(text);

        if (tafelId) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "hilfe-btn";
            btn.textContent = "Info-Tafel öffnen";
            btn.addEventListener("click", function () {
                oeffneInfoTafel(tafelId, puzzleId);
            });
            slotEl.appendChild(btn);
        }
    }

    // -----------------------------------------------------------
    // Telefon-Block (Stufe 3): "Frag deine Lehrkraft".
    // Klick auf "Habe ich gemacht" entfernt den Block aus dem
    // Slot und ruft optional opts.onBestaetigt auf, damit das
    // Rätsel den Stand zurücksetzen oder die Eingabe freigeben
    // kann.
    // -----------------------------------------------------------
    function renderTelefon(slotEl, opts) {
        const titel = document.createElement("div");
        titel.className = "hilfe-telefon-titel";
        titel.textContent = "📞 Frag deine Lehrkraft";
        slotEl.appendChild(titel);

        const text = document.createElement("p");
        text.className = "hilfe-telefon-text";
        text.textContent =
            "Komm zum Pult und stell deine Frage.";
        slotEl.appendChild(text);

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "hilfe-btn";
        btn.textContent = "Habe ich gemacht";
        btn.addEventListener("click", function () {
            slotEl.innerHTML = "";
            slotEl.classList.remove(
                "hilfe-slot--tipp",
                "hilfe-slot--telefon"
            );
            if (typeof opts.onBestaetigt === "function") {
                opts.onBestaetigt();
            }
        });
        slotEl.appendChild(btn);
    }

    // -----------------------------------------------------------
    // oeffneInfoTafel(id): ruft das globale openInfoPanel auf,
    // mit kleinem Schutz gegen fehlende Funktion.
    // -----------------------------------------------------------
    function oeffneInfoTafel(id, puzzleId) {
        if (!id) return;
        // Wenn die Tafel aus einem Rätsel heraus aufgerufen wird
        // (puzzleId gesetzt), erscheint sie als Overlay innerhalb
        // des Spielfensters – das Rätsel-Modal bleibt im Hinter-
        // grund vollständig offen und der Bearbeitungsstand
        // ohnehin unverändert.
        if (typeof puzzleId === "number" &&
            typeof window.openInfoTafelOverlay === "function") {
            window.openInfoTafelOverlay(id);
            return;
        }
        // Freier Aufruf (z. B. aus der Werkstatt-Ansicht über den
        // Hotspot): Vollbild-Layer wie bisher.
        if (typeof window.openInfoPanel === "function") {
            window.openInfoPanel(id);
        } else {
            console.warn(
                "hilfe.js: weder openInfoTafelOverlay noch " +
                "openInfoPanel verfügbar – Info-Tafel " + id +
                " konnte nicht geöffnet werden."
            );
        }
    }

    // Öffentliches API.
    window.werkstattHilfe = {
        aktualisiere:    aktualisiere,
        getInfoTafelId:  function (puzzleId) { return HILFE_TAFEL[puzzleId]; },
        SCHWELLE_TIPP:   SCHWELLE_TIPP,
        SCHWELLE_AUTO:   SCHWELLE_AUTO,
        SCHWELLE_TELEFON: SCHWELLE_TELEFON
    };

})();
