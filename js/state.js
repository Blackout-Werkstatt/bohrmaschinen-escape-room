/* ===========================================================
   Werkstatt-Blackout – state.js
   -----------------------------------------------------------
   Zentrales Spielzustand-Modul.

   Die gesamte Session-Information liegt in window.werkstattState
   und wird ausschließlich im Arbeitsspeicher gehalten — kein
   localStorage, kein sessionStorage, keine Cookies (Datenschutz).

   Diese Datei wird VOR main.js eingebunden, damit der State
   bereit ist, wenn die Spiellogik startet.
   =========================================================== */

"use strict";


// -----------------------------------------------------------
// Ausgangszustand der 5 Rätsel
// -----------------------------------------------------------
// yaw/pitch: Position der Leuchte im 360-Grad-Panorama
//            (später an echte Werkstatt-Foto-Koordinaten angepasst)
// solved:    true, sobald das Rätsel erfolgreich gelöst wurde
// errorCount: zählt Fehlversuche (für das Hilfesystem, siehe
//            CLAUDE.md – ab 3 Fehlversuchen öffnet sich die
//            Info-Tafel im Rätsel-Fenster)
// -----------------------------------------------------------
const ANFANGS_PUZZLES = [
    { id: 1, label: "Teile der Maschine",           solved: false, yaw: -25, pitch: -5, errorCount: 0 },
    { id: 2, label: "Bohrertypen",                  solved: false, yaw: -15, pitch: -5, errorCount: 0 },
    { id: 3, label: "Persönliche Schutzausrüstung", solved: false, yaw:  -5, pitch: -5, errorCount: 0 },
    { id: 4, label: "Handhabung und Sicherheit",    solved: false, yaw:   5, pitch: -5, errorCount: 0 },
    { id: 5, label: "Einspannen",                   solved: false, yaw:  15, pitch: -5, errorCount: 0 }
];


// -----------------------------------------------------------
// Info-Tafeln (zweite Hotspot-Schicht im Panorama)
// -----------------------------------------------------------
// Jede Tafel ist einem der 5 Rätsel thematisch zugeordnet.
// Position: gegenüber der zugehörigen Leuchte etwas versetzt
// (yaw + 8°, pitch + 10°), damit sich die Hotspots nicht
// überlappen. Die Tafeln sind jederzeit (auch ohne Rätsel-
// Lösung) anklickbar und zeigen Lerninhalte als kleines
// Wissensseiten-Modal.
// -----------------------------------------------------------
const INFO_PANELS = [
    { id: "info-1", topic: "Teile der Bohrmaschine",              yaw: -171.1, pitch: -23.2 },
    { id: "info-2", topic: "Bohrertypen",                         yaw: -138.1, pitch: -14.6 },
    // Platzhalter-Position, anpassen wenn echtes 360-Grad-Foto vorliegt.
    { id: "info-3", topic: "Betriebsanweisung Ständerbohrmaschine", yaw: 173.8, pitch: 1.5 },
    // Platzhalter-Position, anpassen wenn echtes 360-Grad-Foto vorliegt.
    { id: "info-4", topic: "Handhabung und Sicherheit",           yaw: 134.7,   pitch: -3.2 },
    // Platzhalter-Position, anpassen wenn echtes 360-Grad-Foto vorliegt.
    { id: "info-5", topic: "Drehzahl-Tabelle",                    yaw: -116.5,  pitch: -0.9 }
];


// -----------------------------------------------------------
// Globaler Spielzustand
// -----------------------------------------------------------
// puzzles wird als Kopie der Ausgangsdaten abgelegt, damit
// ein späterer Neustart (F5) wieder frische Werte bekommt,
// ohne dass der ANFANGS_PUZZLES-Array mutiert wird.
// -----------------------------------------------------------
window.werkstattState = {
    playerName: "",
    gestartet: false,
    // Test-Hilfsmittel: per Strg+S auf der Intro-Seite toggelbar.
    // Wenn true, überspringt main.js die Blackout-Eintritts-Sequenz
    // und springt direkt in Phase 8 (freies Spiel). Beim Reload
    // wird der Wert verworfen, da werkstattState nur im RAM lebt.
    skipMode: false,
    puzzles: ANFANGS_PUZZLES.map(function (p) { return Object.assign({}, p); })
};


// -----------------------------------------------------------
// getPuzzle(id)
// -----------------------------------------------------------
// Liefert das Puzzle-Objekt mit der angegebenen id zurück
// oder undefined, falls es kein Puzzle mit dieser id gibt.
// -----------------------------------------------------------
function getPuzzle(id) {
    return window.werkstattState.puzzles.find(function (p) {
        return p.id === id;
    });
}


// -----------------------------------------------------------
// markPuzzleSolved(id)
// -----------------------------------------------------------
// Setzt das Feld solved auf true. Gibt true zurück, wenn das
// Puzzle gefunden und als gelöst markiert wurde – sonst false.
// Bereits gelöste Puzzles werden nicht doppelt gemeldet.
// -----------------------------------------------------------
function markPuzzleSolved(id) {
    const puzzle = getPuzzle(id);
    if (!puzzle) {
        console.warn("markPuzzleSolved: kein Puzzle mit id " + id);
        return false;
    }
    if (puzzle.solved) {
        return false;                        // schon gelöst, kein Status-Wechsel
    }
    puzzle.solved = true;

    // Finale auslösen, sobald alle fünf Rätsel gelöst sind.
    // setTimeout(0) sorgt dafür, dass die normale UI-Aktualisierung
    // des Aufrufers (Leuchte grün, Fortschritt 5/5, Modal-Fade-Out)
    // vor dem Finale zu Ende läuft – entspricht Phase 1 der Sequenz.
    if (getSolvedCount() === 5 && typeof window.starteFinale === "function") {
        setTimeout(window.starteFinale, 0);
    }
    return true;
}


// -----------------------------------------------------------
// resetState()
// -----------------------------------------------------------
// Setzt den kompletten Spielzustand auf die Ausgangswerte zurück
// (alle Puzzles ungelöst, errorCount 0, leerer Name, nicht gestartet).
// Wird vom "NOCHMAL SPIELEN"-Button im Finale aufgerufen.
// -----------------------------------------------------------
function resetState() {
    window.werkstattState.playerName = "";
    window.werkstattState.gestartet  = false;
    window.werkstattState.puzzles = ANFANGS_PUZZLES.map(function (p) {
        return Object.assign({}, p);
    });
}


// -----------------------------------------------------------
// getSolvedCount()
// -----------------------------------------------------------
// Gibt die Anzahl der bereits gelösten Rätsel zurück (0 bis 6).
// -----------------------------------------------------------
function getSolvedCount() {
    return window.werkstattState.puzzles.filter(function (p) {
        return p.solved;
    }).length;
}


// -----------------------------------------------------------
// getAllPuzzles()
// -----------------------------------------------------------
// Liefert alle Puzzle-Objekte als Array zurück (Referenz, nicht
// Kopie – Änderungen an einzelnen Puzzles via markPuzzleSolved
// wirken sich direkt aus).
// -----------------------------------------------------------
function getAllPuzzles() {
    return window.werkstattState.puzzles;
}


// -----------------------------------------------------------
// getAllInfoPanels()
// -----------------------------------------------------------
// Gibt die komplette Liste der Info-Tafel-Definitionen zurück.
// Die Tafeln sind statisch und ändern ihren Zustand nicht
// während des Spiels – Inhalte liegen in js/infoContent.js.
// -----------------------------------------------------------
function getAllInfoPanels() {
    return INFO_PANELS;
}


// -----------------------------------------------------------
// Global verfügbar machen
// -----------------------------------------------------------
// Ohne ES-Module-Setup verteilen wir die Hilfsfunktionen über
// das window-Objekt – passt zur statischen Auslieferung ohne
// Build-Pipeline.
// -----------------------------------------------------------
window.getPuzzle        = getPuzzle;
window.markPuzzleSolved = markPuzzleSolved;
window.getSolvedCount   = getSolvedCount;
window.getAllPuzzles    = getAllPuzzles;
window.getAllInfoPanels = getAllInfoPanels;
window.resetState       = resetState;
