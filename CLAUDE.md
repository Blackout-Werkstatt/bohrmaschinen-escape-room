# Projekt: Digitaler Escape-Room "Werkstatt-Blackout"

## Kontext
Dies ist ein digitales Lernmedium für den Technikunterricht (Klasse 7, Realschule Baden-Württemberg). Es handelt sich um meine Modulprüfung M4 an der Pädagogischen Hochschule Freiburg.

## Zielgruppe
- Klasse 7, Realschule Baden-Württemberg
- Fach: Technik (Wahlpflichtfach)
- Einzelarbeit am eigenen Endgerät (Tablet, PC, Smartphone)
- Spielzeit: 30-45 Minuten

## Narrative
"Werkstatt-Blackout": Die Schülerin/der Schüler ist in der Schulwerkstatt eingeschlossen. Stromausfall, flackerndes Notlicht. Um rauszukommen, muss die Standbohrmaschine aktiviert werden. Dafür müssen fünf rote Sicherheits-Leuchten durch Lösen von fünf Aufgaben auf grün geschaltet werden.

## Technische Anforderungen
- Statische Website (HTML + CSS + JavaScript), keine Server, keine Datenbank
- 360-Grad-Panorama-Viewer: Pannellum (https://pannellum.org) - Open Source, DSGVO-unkritisch
- Keine externen Tracker, Cookies oder Analytics (Datenschutz strikt!)
- Hardwareunabhängig: muss auf Smartphone, Tablet, Desktop in allen modernen Browsern laufen
- Deployment: als statischer Ordner, der per USB-Stick verteilt oder auf Schulserver gelegt werden kann

## Ordnerstruktur (Ziel)
/
├── index.html              (Haupt-HTML)
├── css/
│   └── style.css           (Alle Stile)
├── js/
│   ├── main.js             (Spiellogik)
│   ├── puzzles.js          (Rätsel-Daten)
│   └── state.js            (Spielzustand)
├── assets/
│   ├── panorama.jpg        (360-Grad-Foto, zunächst Platzhalter)
│   ├── images/             (Weitere Bilder)
│   └── sounds/             (Sound-Dateien, optional)
├── lib/
│   └── pannellum/          (Pannellum-Bibliothek, lokal)
└── CLAUDE.md               (Diese Datei)

## Rätsel-Struktur (5 Aufgaben)
1. Teile der Maschine - Bauteile benennen
2. Bohrertypen - Bohrer zu Werkstoff zuordnen
3. PSA - Persönliche Schutzausrüstung, Fehler finden
4. Handhabung/Sicherheit - Handlungsreihenfolge
5. Bohrauftrag - Bohrer wählen, Drehzahl einstellen, Werkstück einspannen (mit Drehzahltabelle)

## Hilfesystem (dreistufig + Telefon-Fallback)
- Nach 60 Sekunden Inaktivität: Tipp 1 (allgemein): "Schau dich im Raum um"
- Nach 120 Sekunden Inaktivität: Tipp 2 (konkret): Verweis auf relevante Info-Tafel
- Nach 3 Fehlversuchen: Info-Tafel öffnet sich direkt im Rätsel-Fenster
- Nach 6 Fehlversuchen: "Telefon klingelt" - SuS soll reale Lehrkraft fragen

## Info-Schicht
Neben den 5 Rätsel-Hotspots gibt es mehrere Info-Tafel-Hotspots im Raum, die Lerninhalte anzeigen. Diese sind frei zugänglich ohne Aufgabe.

## Offene Punkte
- Infotafel 3 (Betriebsanweisung) ist als Zoom-to-Wall-Tafel vorbereitet, wartet auf echtes 360°-Foto. `assets/infotafel/Betriebsanweisung.png` liegt bereit. Aktivierung über `enabled: true` in `js/infoContent.js` sowie Eintragen von `targetYaw`/`targetPitch`, sobald die Wandposition aus dem echten Foto bekannt ist.

## Design-Richtlinien
- Farbschema: Dunkel-industriell (Grau #1A1A1A bis #3A3A3A), Akzente: Rot #E63946 (Warnung), Grün #4ADE80 (Erfolg)
- Typografie: Klare, gut lesbare Schrift (System-Fonts oder Inter/Roboto)
- Barrierefreiheit: Ausreichende Kontraste, Tastaturnavigation, große Klickflächen
- Sprache: Altersgerecht (Klasse 7), klare einfache Sätze

## Arbeitsweise
- Arbeite inkrementell: erst Grundgerüst, dann Features
- Keine externen CDNs laden (offline-fähig)
- Kommentiere den Code auf Deutsch, damit ich ihn für meine Dokumentation verstehen und zitieren kann
- Bei jeder größeren Änderung: kurz erklären, was du gemacht hast und warum
