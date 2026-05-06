# Arbeitsjournal — Escape-Room Werkstatt-Blackout

## 17.04.2026 — Tag 1: Setup und Grundgerüst

### Erledigt
- Node.js v24.15.0 installiert
- Claude Code via npm installiert (v2.1.113)
- Git for Windows installiert (v2.53)
- Projektordner C:\Projekte\Escape-Room-Bohrmaschine angelegt
- Projekt-Kontext in CLAUDE.md dokumentiert
- HTML/CSS/JS-Grundgerüst erstellt und erfolgreich im Browser getestet
- Modell: Opus 4.7

### Entscheidungen
- Projektordner lokal (nicht OneDrive) wegen möglicher Sync-Probleme
- Visual Studio Build Tools nicht installiert (für unseren Stack nicht benötigt)
- Dunkles Farbschema passt zum Blackout-Narrativ

### Offene Punkte
- KI-Nutzung mit Daniel Albicker abklären
- 360°-Kamera ausleihen
- Inhalte für die Rätsel recherchieren

### Morgen geplant
- Pannellum einbinden
- Platzhalter-Panorama testen
- Erste 360°-Ansicht im Browser

## 18.04.2026 — Tag 2: Pannellum-Integration und Intro-Screen

### Erledigt
- Pannellum 2.5.7 lokal eingebunden (heruntergeladen und entpackt nach lib/pannellum/)
- Bewusst KEINE CDN-Einbindung → Offline-Fähigkeit und DSGVO-Konformität
- Platzhalter-Panorama (2048x1024 equirectangular) per PowerShell + System.Drawing generiert
  → mit Beschriftungen NORD/OST/SÜD/WEST/DECKE/BODEN zur Orientierung
- index.html, main.js, style.css an Pannellum-Integration angepasst
- Fullscreen-Panorama-Viewer läuft (100vh/100vw)
- Steuerung getestet: Maus-Drag, Mausrad-Zoom, Touch, Pfeiltasten – alles funktional
- Pannellum-UI-Elemente (Autorotate, Zoom, Fullscreen, Kompass) ausgeblendet für cleanen Look
- Lokaler Entwicklungsserver per npx http-server auf Port 8000 eingerichtet
  → umgeht Browser-Sicherheitsbeschränkungen bei file:///-Zugriffen während Entwicklung
- Intro-Screen mit Blackout-Atmosphäre gebaut:
  → SYSTEM-AUSFALL-Warnmeldung in monospace-Schrift
  → Rotes pulsierendes Notlicht-Overlay (CSS-Animation)
  → Eingabefeld für Spielernamen
  → Button "SPIEL STARTEN" (disabled solange Namensfeld leer)
  → Fade-Out-Animation beim Übergang zum Panorama
  → Enter-Taste als Alternative zum Button-Klick (Barrierefreiheit)
  → Spielername in window.werkstattState gespeichert (nur Session, keine Persistenz)
- Effort-Level in Claude Code von xhigh auf high gesetzt (Kontingent-Management)

### Design-Entscheidungen
- Lokaler Server nur für Entwicklung, Endnutzer:innen brauchen ihn nicht
  → Spätere Deployment-Optionen: GitHub Pages, Schulserver, gepackte HTML
- Pannellum lokal statt CDN (Datenschutz: keine externen Requests)
- Startblickrichtung yaw/pitch 0 (Spieler:in blickt zu NORD beim Start)

### Offene Punkte
- Rätsel-Hotspots (6 Leuchten)
- Rätsel-Inhalte
- 360°-Foto der echten Werkstatt

### Morgen geplant
- 6 rote Leuchten als Hotspots im Panorama
- State-Management für Rätsel
- Rätsel-Modal-System

## 19.04.2026 — Tag 3: Rätsel-Hotspots und Finale-Sequenz

### Erledigt
- State-Management-Modul (js/state.js) erstellt
  → puzzles-Array mit id, label, solved, yaw, pitch, errorCount für jedes der 6 Rätsel
  → Globale Funktionen: getPuzzle, markPuzzleSolved, getSolvedCount, getAllPuzzles
- 6 rote Sicherheits-Leuchten als Pannellum-Hotspots eingebunden
  → Positionen: yaw -25° bis +25° in 10°-Schritten, pitch -5° (dicht unter Horizont)
  → CSS-Animation "leuchte-pulsieren" (1.5s Zyklus, Opacity + Scale)
  → Rot-Glow (box-shadow) für visuelle Präsenz
  → Tooltip beim Hover zeigt Rätsel-Label
  → Hover- und Tastatur-Fokus (Outline) für Barrierefreiheit
- Rätsel-Modal-System
  → Dynamisch erzeugtes Overlay mit halbtransparentem Hintergrund
  → Zentrales Panel mit dunklem Design und rotem Akzent-Rand
  → Platzhalter-Inhalt + "LÖSEN (Testmodus)"-Button für spätere Rätsel-Inhalte
  → Schließbar per SCHLIESSEN-Button, Klick außerhalb, Escape-Taste
- Fortschrittsanzeige "Sicherheits-Checks: X/6" (fixiert oben rechts)
- Leuchten-State-Wechsel beim Lösen
  → Rot pulsierend → grün konstant (kein Puls mehr, grüner Glow)
  → Pannellum-Hotspot wird in-place aktualisiert (kein Panorama-Neuladen)
- Finale-Sequenz beim Lösen des letzten Rätsels:
  → Phase 1 (0-1s): Letzte Leuchte wird grün
  → Phase 2 (1-4s): Panorama wird heller (CSS-Filter: brightness + saturation + contrast)
                    Leichter Flacker-Effekt wie anspringende Leuchtstoffröhre
  → Phase 3 (4-6.5s): Großer Text "🔓 TÜR ENTRIEGELT" fadet ein
  → Phase 4 (6.5s+): Personalisierte Urkunde erscheint
- Urkunde mit Kreditkartenformat:
  → Cremefarbener Hintergrund mit subtilem Raster
  → "BOHRMASCHINEN-FÜHRERSCHEIN" mit Spielername, Datum, Werkstattleitung-Signatur
  → Statistik: Anzahl Fehlversuche
  → Stilisierte Bohrmaschinen-Silhouette als Hintergrund-Element
- PNG-Export der Urkunde via html2canvas (lokal eingebunden, nicht per CDN)
- "Nochmal spielen"-Button mit State-Reset
- Dateiname-Sanitizer für Urkunden-Download (Umlaut-Transkription: Müller → Mueller)

### Design-Entscheidungen
- html2canvas lokal statt CDN → Offline-Fähigkeit (USB-Stick-Deployment)
- defer-Loading für html2canvas → Performance beim Seitenstart
- CSS-Filter statt JavaScript-Animation → Barrierefreiheit via prefers-reduced-motion
  → Browser-nativ, ruckelfrei auf Mobilgeräten
- textContent statt innerHTML für Spielernamen → XSS-Schutz
- Grid-Layout mit clamp() für responsive Urkunde
- Licht-Effekt beim Finale bewusst subtil mit Platzhalter-Panorama
  → Wird mit echtem Foto später deutlich ausdrucksstärker

### Offene Punkte
- Erstes echtes Rätsel (Rätsel 1: Teile der Maschine) bauen
- Info-Tafeln als zweite Hotspot-Schicht (eigenständige Lerninhalte-Fenster)
- Hilfesystem: Tipps nach 60s/120s Inaktivität
- Echtes 360°-Foto der Werkstatt aufnehmen
- Fotos einzelner Bohrmaschinen-Details

### Morgen geplant
- Rätsel 1 als echte Zuordnungsaufgabe (Drag-and-Drop)
- SVG-Zeichnung der Bohrmaschine

## 23.04.2026 — Tag 5: Rätsel 3 (PSA) und Zoom-to-Wall-Mechanik

### Erledigt

- Infotafel 3 "Betriebsanweisung Ständerbohrmaschine" implementiert
  als Zoom-to-Wall-Lösung (neuartiges Konzept)
  → Betriebsanweisung liegt als Bild im Panorama, Klick fliegt
     die Kamera zur Wand, Plakat wird bildschirmfüllend und
     scharf lesbar
  → Steuerung: Escape/X/Klick-auf-Rand schließt die Ansicht
  → 20 Prozent Vignette am Rand, 600ms Animation
  → Infrastruktur (activateZoomToWall/deactivateZoomToWall) für
     weitere Wandaushänge in Zukunft vorbereitet
  → Platzhalter-Position (yaw 45, pitch 0), wird angepasst
     sobald echtes 360-Grad-Foto vorliegt

- Rätsel 3 "Persönliche Schutzausrüstung" als binäre
  Sortier-Aufgabe umgesetzt:
  → 3-Spalten-Layout (Spind links, Item-Pool mitte,
     Person an Maschine rechts)
  → 10 Items: 4 tragen (Schutzbrille, Haargummi, eng anliegende
     Kleidung, geeignetes Schuhwerk) und 6 ablegen
     (Handschuhe, Schal, Armbanduhr, Ring, Halskette, Kapuzenpulli)
  → Drag-and-Drop mit Touch-Support, Tastaturbedienung
  → Prüfen-Logik ohne Instant-Feedback
  → BA-Zitate als Fehler-Feedback (Quelle: offizielle
     Schul-Betriebsanweisung, Freigabe Schulleitung, Stand 2019)
  → Scaffolding nach 3 Fehlversuchen (BA-Link) und nach
     6 Fehlversuchen (Telefon-Fallback zur Lehrkraft)
  → Platzhalter-Illustrationen für Spind und Person, echte
     Fotos werden später eingefügt

### Didaktische Entscheidungen

- Binäre Sortierung (tragen/ablegen) statt Körperzonen:
  schlichtere UX, fokussiert auf Kern-Entscheidung
- Handschuhe als gezielte Falle: kontraintuitives
  Sicherheitswissen wird aktiv aufgebaut
- Feedback-Texte zitieren direkt die offizielle Schul-BA:
  authentische Quelle, rechtssichere Formulierung
- 6:4-Schieflage (6 ablegen, 4 tragen) pädagogisch gewollt:
  "Mehr muss weg als dran"
- Arbeitskleidung und Sicherheitsschuhe aus Item-Liste
  gestrichen: BA fordert nicht Arbeitskleidung, sondern eng
  anliegende Kleidung; Schulwerkstatt braucht geeignetes
  Schuhwerk, nicht Sicherheitsschuhe nach ISO
- Offene Haare bewusst weggelassen: Haargummi als Pflicht-Item
  transportiert das Richtige, ohne unlogisches
  "offene Haare ablegen"
- Schutzbrille bewusst als Pflicht-Item gesetzt: zwar nach BA
  nur bei spröden Werkstoffen und Metallen, aber in der
  Schulwerkstatt "wenn unsicher, dann ja"
- Zoom-to-Wall statt Popup-Modal: immersiv, realitätsnah
  (man steht in der Werkstatt, liest den Aushang an der Wand),
  SuS lernt auch das Wiedererkennen echter Werkstatt-Aushänge

### Offene Punkte

- Echte Fotos für Spind und Person an Maschine (Rätsel 3)
- Echtes 360-Grad-Foto der PH-Werkstatt (für alle Tafeln)
- Rätsel 4, 5, 6 (Handhabung, Einspannen, Drehzahl)
- Infotafeln 4, 5, 6 (bisher nur Platzhalter-Hotspots)
- Design-Feinabstimmung des Rätsels 3 (auf später verschoben)

### Morgen geplant

- Foto-Termin in der PH-Werkstatt klären
- Rätsel 4 (Handhabung und Sicherheit) starten


## 20.04.2026 — Tag 4: Rätsel 1 "Teile der Maschine"

### Erledigt
- Rätsel 1 als echte Zuordnungsaufgabe umgesetzt (ersetzt Testmodus-Platzhalter)
- SVG-Zeichnung einer Standbohrmaschine eigens erstellt (Urheberrechts-sicher)
- Drag-and-Drop-Logik mit Touch-Support (für Tablet-Nutzung)
- Tastaturbedienung (Enter/Pfeiltasten) als Barrierefreiheits-Alternative
- Zwischenstand-Speicherung (draftAssignments in window.werkstattState)
  → Schüler:innen können Rätsel schließen und später weitermachen
- Prüfen-Button statt sofortigem Rot/Grün-Feedback
  → Verhindert Brute-Force-Raten, fördert echtes Nachdenken
- Scaffolding-System nach 3 Fehlversuchen (falsche Zuordnungen werden markiert)
- Telefon-Fallback nach 6 Fehlversuchen (Hinweis an Lehrkraft zu wenden)
- 3-Spalten-Layout: Drop-Zeilen links (a,e,f,h,j) – SVG Mitte – Drop-Zeilen rechts (b,c,d,g,i)
- Anatomisch passende Buchstaben-Zuordnung (Bauteile auf der Seite, wo sie an der Maschine sind)
- Leitlinien von Buchstaben-Markern zu den Bauteilen (wie Technik-Lehrbuch)
- Kompaktes Layout ohne Scrolling auf Desktop

### Design-Entscheidungen
- Eigene SVG statt Schulbuch-Scan (Urheberrecht, Anpassbarkeit)
- "Prüfen"-Mechanik statt Instant-Feedback (didaktisch: echtes Lernen statt Raten)
- Anatomische Zuordnung der Buchstaben (räumliches Verständnis der Maschine)
- Zwischenstand-Speicherung (Info-Tafel-Besuche ohne Verlust des Fortschritts)
- Scaffolding in zwei Stufen (3 Fehlversuche: Markierung; 6: Lehrkraft)

### Zusätzlich am 20.04.2026 erledigt

- Info-Tafel-Infrastruktur aufgebaut:
  → 6 gelbe Info-Hotspots im Panorama neben den Rätsel-Leuchten
  → Visuell klar unterscheidbar (quadratisch, goldgelb, Buch-Symbol)
  → Vollbild-Modal für ausführliche Lerninhalte
  → Pro Rätsel-Thema eine Info-Tafel (6 insgesamt)
  → Modul für Inhalte: js/infoContent.js

- Info-Tafel 1 "Aufbau der Bohrmaschine" komplett ausgestaltet:
  → Interaktive SVG-Zeichnung mit 10 nummerierten Markern
  → Tooltip-System: Hover (Desktop) bzw. Tap (Tablet) öffnet Erklärtext
  → Erklärtexte für Klasse 7 verfasst (urheberrechts-sicher, eigene Formulierung)
  → Bauteil-Name ist bewusst im Fließtext versteckt (nicht hervorgehoben)
    → SuS müssen den Text LESEN, um Bauteil zu identifizieren
    → Verhindert oberflächliches Überfliegen

- Begriffs-Vereinheitlichung zwischen Rätsel 1 und Info-Tafel 1:
  → 10 einheitliche Bauteile als Master-Liste:
    Schutzhaube, Motor, Höhenverstellung, Bohrmaschinenfuß, Bohrtisch,
    Bohrfutter, Bohrspindel, Vorschubhebel, Säule/Ständer, Ein-/Ausschalter
  → Bohrer aus Rätsel 1 entfernt (passt thematisch in Rätsel 2 "Bohrertypen")
  → Ein-/Ausschalter in beiden ergänzt (Bedienelement, sicherheitsrelevant)
  → Alle Schreibweisen identisch (Rätsel-Chip-Text = Info-Tafel-Tooltip-Text)

### Didaktische Entscheidungen am 20.04.

- Info-Tafeln als eigenständige Lerninhalte (zweite Schicht neben Rätseln)
- Hover-Tooltips statt Scroll-Seite: kompakt, fokussiert, aktiv statt passiv
- Bauteil-Namen im Text versteckt: erzwingt echtes Lesen
- Konsistente Begriffe: SuS sollen das im Info-Text gefundene Wort exakt im
  Rätsel wiederfinden
- Ein-/Ausschalter (statt Bohrer): Bedienelement der Maschine, nicht Werkzeug

### Offene Punkte
- Rätsel 2–6 müssen noch gebaut werden
- Info-Tafeln 2–6 mit Lerninhalten füllen (Infrastruktur steht)
- Echtes 360°-Foto der Werkstatt
- Einzelne Fotos der Bohrmaschine
- Recherche der Inhalte für die Rätsel (Bildungsplan, DGUV, Schulbuch)

### Morgen geplant
- Inhalte für Rätsel 2 recherchieren (Bohrertypen)
- Rätsel 2 bauen (orientiert an der Rätsel-1-Vorlage, dadurch schneller)


## Optimierungs-Ideen-Liste (offene Punkte für später)

1. Rätsel 1 erweitern: Nicht nur Bezeichnung zuordnen, sondern auch die
   richtige Funktion des Bauteils nennen
   → Didaktik: tieferes Verständnis statt nur Wortschatz

2. Foto-Tausch-Tag: Nach PH-Werkstatt-Termin alle SVGs durch echte Fotos
   ersetzen (Bohrmaschinen-Zeichnungen in Rätsel 1, Info-Tafel 1 und
   Urkunde; alle 6 Bohrer-Bilder in Rätsel 2 und Info-Tafel 2)

3. Rätsel 2 Design-Überholung: Aktueller Look ist noch nicht ideal –
   Werkbank-Hintergrund wirkt nicht authentisch genug, Bohrer-SVGs zu
   schematisch. Zusammen mit echten Fotos nach PH-Termin überarbeiten.

4. Info-Tafel 2 Zoom/Lupen-Positionen final justieren nachdem echte Fotos
   da sind


## Dokumentations-Notizen (für die schriftliche Ausarbeitung)

1. Rätsel 2: Zwei Zonen (Bezeichnung + Funktion) statt nur eine
   - Didaktische Begründung: Verhindert stumpfes Abfragen und Auswendiglernen
     von Wortschatz
   - Lernziel höherer Ordnung: SuS müssen nicht nur WIE ein Bohrer heißt
     wissen, sondern auch verstehen WAS er tut und WOFÜR er geeignet ist
   - Kognitive Aktivierung durch Zuordnung auf zwei Dimensionen fördert
     Transferdenken
   - Bezug zur Lernzieltaxonomie: vom Wissen zum Verstehen und Anwenden


## 24.04.2026 - Tag X: Raetsel 5 (Bohrauftrag) und Reduktion auf 5 Raetsel

### Erledigt

- Infotafel 5 "Drehzahl-Tabelle" als Zoom-to-Wall im Panorama umgesetzt
  -> Verwendung des bereits gestalteten Tabellen-Bildes 
     (assets/infotafel/Drehzahltabelle.png)
  -> Selbe Mechanik wie Infotafel 3 (Betriebsanweisung): Plakat an der 
     Wand, Klick zoomt die Kamera ran, Escape/X/Rand-Klick schliesst
  -> Platzhalter-Position (yaw 30, pitch -5), wird angepasst sobald 
     echtes 360-Grad-Foto vorliegt

- Raetsel 5 "Bohrauftrag" als sequenzielles 3-Schritt-Raetsel 
  implementiert (Arbeitsauftrag: 8-mm-Loch in Fichtenholz-Brett)
  -> Schritt 1: Bohrer waehlen aus 3x3-Raster (9 Bohrer: Holz, Metall, 
     Stein in jeweils 6, 8, 10 mm), dargestellt als SVG-Platzhalter 
     mit typspezifischen Merkmalen (Zentrierspitze bei Holz, 
     118-Grad-Spitze bei Metall, Hartmetallplatte bei Stein)
     - Bewusst KEINE Art-Labels unter den Bohrern, nur Groessen-Gravur 
       auf dem Schaft -> Erkennung ueber visuelle Merkmale erzwungen
  -> Schritt 2: Drehzahl am Schieberegler einstellen (0-3000 U/min, 
     50er Schritte). Richtwert 1100 U/min (Toleranz +/- 150) aus 
     Drehzahl-Tabelle
     - Tabellen-Overlay direkt im Raetsel verfuegbar 
       (raetsel-eigene Overlay-Komponente ueber dem Modal), damit 
       die SuS beim Nachschlagen nicht aus dem Raetsel-Kontext 
       geworfen wird
  -> Schritt 3: Werkstueck sichern (Schraubzwinge/Maschinenschraubstock 
     richtig, Hand falsch). Falsch-Feedback thematisiert explizit die 
     Gefahr des Mitdrehens
  -> Progress-Anzeige "Schritt X von 3" oben im Modal
  -> Scaffolding in Schritt 1 nach 2 Fehlversuchen: Button zum 
     Oeffnen der Infotafel Bohrertypen
  -> Feedback-Texte didaktisch differenziert: falscher Typ vs. falsche 
     Groesse vs. beides falsch erzeugen jeweils eigenes Feedback

- Projektumfang von 6 auf 5 Raetsel reduziert
  -> Nicht gebaute Huellen "Raetsel 6" und "Infotafel 6" vollstaendig 
     aus dem Code entfernt (State, Panorama-Hotspots, Zaehler-Arrays, 
     Schleifen, UI-Texte)
  -> Anzeige jetzt "X von 5" statt "X von 6"
  -> Finale-Logik triggert ab 5/5 geloesten Raetseln
  -> CLAUDE.md an den neuen Stand angepasst, Arbeitsjournal als 
     historische Projektdokumentation unveraendert belassen
  -> Fremdbibliothek lib/html2canvas nicht angefasst

### Didaktische Entscheidungen

- Sequenzielles 3-Schritt-Design fuer Raetsel 5 statt einem 
  Multiple-Choice-Paket: bildet den realen Handlungsablauf an der 
  Staenderbohrmaschine ab (Bohrer waehlen -> Drehzahl -> Einspannen) 
  und verankert das Wissen in einer nachvollziehbaren Abfolge
- Keine Beschriftung der Bohrer-Typen im Raster: zwingt zur visuellen 
  Analyse der Merkmale (Zentrierspitze, Spitzenwinkel, Hartmetallplatte) 
  und verhindert, dass die Aufgabe durch Textlesen statt Fachwissen 
  geloest wird
- Drehzahl-Tabelle als raetsel-internes Overlay statt Ruecksprung ins 
  Panorama: Nachschlagen wird zum selbstverstaendlichen Teil der 
  Handlung, der Bearbeitungskontext bleibt erhalten, gespeicherte 
  Regler-Werte gehen nicht verloren
- Richtwert 1100 U/min aus der eigenen Tabelle uebernommen statt 
  Standard-Werten aus Fachbuechern: Konsistenz zwischen dem im Raum 
  haengenden Material und dem Raetsel wahrt das didaktische Versprechen 
  "was an der Wand haengt, ist richtig"
- Toleranzfenster +/- 150 U/min am Schieberegler: akzeptiert die 
  Unschaerfe der Bedienung und fokussiert auf die Groessenordnung 
  (nicht auf Pixel-Genauigkeit)
- Reduktion auf 5 Raetsel: die Inhaltsbereiche der Zielvereinbarung 
  (Einzelteile, Aufbau, Funktion, Handhabung, PSA, Sicherheit, 
  Bohrertypen, Drehzahlen, Einspannverfahren) sind durch Raetsel 1-5 
  vollstaendig abgedeckt. Ein sechstes Raetsel haette Inhalte 
  dupliziert statt ergaenzt

### Offene Punkte

- Bohrer-SVGs in Schritt 1 durch echte Fotos aus der PH-Werkstatt 
  ersetzen, sobald Foto-Termin steht
- Echtes 360-Grad-Foto der PH-Werkstatt fuer alle Infotafeln
- Design-Feinabstimmung von Raetsel 5 (Abstaende, Farben des 
  Schiebereglers) nach Usability-Eindruck
- Kompletter Spieltest mit allen 5 Raetseln am Stueck
- Endscreen/Finale pruefen, ob es bei 5/5 sauber triggert

### Morgen geplant

- Kompletten Spieldurchlauf als Funktionstest
- Entscheidung ueber naechsten Baustein: Intro-Screen ausbauen, 
  Reset-Button, oder erste Version der schriftlichen Dokumentation


## 05.05.2026 — Tag X: Online-Veröffentlichung via GitHub Pages

### Erledigt

- GitHub-Account eingerichtet und auf neutralen Namen "Blackout-Werkstatt" 
  umbenannt (statt Klarname)
  → thematisch zur narrativen Einbettung des Spiels passend
  → vermeidet Personenbezug in der späteren öffentlichen URL

- Lokales Projekt unter Versionsverwaltung gestellt
  → git init im Projektordner ausgeführt
  → .gitignore angelegt (Ausschluss von .claude/, node_modules/, 
    .DS_Store, Thumbs.db)
  → Standardbranch von "master" auf "main" umbenannt
    (moderne Git-Konvention, GitHub-Standard)
  → user.name und user.email für Commit-Identität konfiguriert

- Initial Commit mit 43 Dateien (~43 MB) erstellt
  → enthält Code, Assets (Panorama-Bild, Sounds, Info-Tafeln), 
    Lib-Dateien (Pannellum, html2canvas)

- Repository auf GitHub angelegt
  → Name: bohrmaschinen-escape-room
  → Sichtbarkeit: Public (zwingend für kostenloses GitHub Pages Hosting)
  → keine automatische README/LICENSE/.gitignore-Erzeugung
    (Konflikt mit lokalem Stand vermieden)

- Lokales Repo mit GitHub verbunden und Push durchgeführt
  → Authentifizierung via Browser (Git Credential Manager)
  → 43 Objekte erfolgreich hochgeladen

- GitHub Pages aktiviert
  → Source: Deploy from a branch (main, /root)
  → Online-URL: https://blackout-werkstatt.github.io/bohrmaschinen-escape-room/
  → Build- und Deploy-Zeit ca. 2 Minuten

- Bug-Identifikation und -behebung via Browser-Entwicklertools (F12)

  Bug 1: Groß-/Kleinschreibung des Asset-Ordners
  → Symptom: 404-Fehler für assets/infotafel/Betriebsanweisung.png 
    und Drehzahltabelle.png; Info-Tafeln-Popup erschien als 
    zerstückelte Textfragmente
  → Ursache: Ordnername lokal "Infotafel" (mit großem I), Code 
    referenziert "infotafel" (mit kleinem i). Auf Windows 
    case-insensitive funktional, auf Linux-Servern (GitHub Pages) 
    case-sensitive und damit defekt.
  → Fix: git mv-Doppel-Rename (Infotafel → infotafel_temp → infotafel), 
    da git auf case-insensitivem Dateisystem direktes Umbenennen 
    nicht erkennt. Commit "Fix Groß-/Kleinschreibung: Infotafel -> 
    infotafel" gepusht. Online-Verifikation: 404-Fehler in der 
    Konsole verschwunden.

  Bug 2: Inkonsistenz im Startbildschirm-Text
  → Symptom: Text "sechs Sicherheits-Checks" widerspricht 
    Counter-Anzeige "0/5"
  → Ursache: Im finalen Reduktions-Schritt von 6 auf 5 Rätsel 
    wurde der Counter angepasst, der Intro-Text aber übersehen
  → Fix: index.html in Notepad geöffnet, "sechs Sicherheits-Checks" 
    durch "fünf Sicherheits-Checks" ersetzt; Commit + Push. 
    Online-Verifikation: Startbildschirm zeigt korrekt "fünf".

- Standard-Workflow für Folge-Änderungen etabliert und einmal 
  selbständig durchlaufen:
  Datei lokal bearbeiten → git add . → git commit -m "..." → 
  git push → 1-3 Min warten → Strg+F5 → online verifiziert

### Design- und Prozessentscheidungen

- Account-Name "Blackout-Werkstatt" statt Klarname gewählt: 
  Privatsphäre der Lehrkraft gewahrt, thematische Kohärenz 
  des Spiels gestärkt.

- GitHub Pages als Hoster gewählt: kostenfrei, kein Tracking 
  durch das eigene Spiel, HTTPS standardmäßig aktiv, weltweite 
  Verfügbarkeit. Damit Anforderungen "kostenfrei" und 
  "datenschutzkonform" der Zielvereinbarung erfüllt.

- Public-Repository akzeptiert: Quellcode öffentlich einsehbar. 
  Für ein didaktisches Medium ohne Geschäftsgeheimnisse 
  unkritisch, ermöglicht zugleich Nachnutzung durch andere 
  Lehrkräfte (Open-Educational-Resource-Gedanke).

- Iterative Qualitätssicherung über GitHub-Pages-Umgebung: 
  Lokales Testen (localhost:8000) reicht nicht aus, da 
  Linux-Server der GitHub-Infrastruktur sich anders verhalten 
  als Windows-Entwicklungsumgebung (case-sensitivity, 
  Pfadbehandlung). Erst der Live-Test deckte die Bugs auf — 
  ein Argument für reale Test-Bedingungen statt 
  Entwicklungs-Workarounds.

### Offene Punkte

- 360°-Werkstattfoto wird noch durch finale Aufnahme ersetzt
- QR-Code für Verteilung an Schüler:innen erstellen 
  (datenschutzkonformer Generator wie qrcode-monkey.com 
  oder qrcode.tec-it.com)
- Test auf weiteren Endgeräten: iPad, alternative 
  Smartphone-Browser, Schul-Chromebook
- Pilot-Test mit echten Schüler:innen für UX-Beobachtungen
- Optional: Backup-Variante als gepackte HTML-Datei zum 
  Doppelklick (für Schulen ohne Internet-Anbindung)
- Verbleibende "sechs"-Stellen im Code prüfen 
  (js/infoContent.js: "sechs Info-Tafeln" — Frage, ob 
  inhaltlich passend oder Anpassungsbedarf)

### Morgen geplant

- (vom Verfasser zu ergänzen)
