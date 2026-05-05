/* ===========================================================
   Werkstatt-Blackout – infoContent.js
   -----------------------------------------------------------
   Lerninhalte der sechs Info-Tafeln im Panorama.

   Struktur je Tafel:
     - Einfache Tafeln: werkstattInfoContent[id] = { title, sections }
       Die generische Rendering-Schleife in main.js erzeugt daraus
       Überschriften, Absätze und Stichpunktlisten.
     - Spezial-Tafeln: registrieren zusätzlich eine Renderer-
       Funktion unter window.infoRenderer[id]. Diese darf das
       komplette Body-Element selbst befüllen (z. B. mit einer
       interaktiven SVG-Zeichnung wie bei Tafel 1).

   Inhalte sind selbst verfasst und altersgerecht für Klasse 7.
   =========================================================== */

"use strict";


// -----------------------------------------------------------
// Daten-Objekt für alle Tafeln (Title wird in der Kopfzeile
// des Modals angezeigt – auch bei Spezial-Renderern).
// -----------------------------------------------------------
window.werkstattInfoContent = {

    "info-1": {
        id: "info-1",
        title: "Teile der Bohrmaschine"
        // Renderer: siehe weiter unten (window.infoRenderer["info-1"])
    },

    // Tafeln 2–6: Platzhalter, bis eigene Inhalte folgen.
    "info-2": {
        id: "info-2",
        topic: "Bohrertypen",
        // title erscheint in der Kopfzeile des Info-Modals.
        title: "Bohrertypen",
        // Spezial-Layout: Werkbank-Foto als Bühne + Zoom-Interaktion.
        // Renderer: siehe weiter unten (window.infoRenderer["info-2"])
        layout: "werkbank-zoom",
        backgroundImage: "assets/bohrer/werkbank-bohrer.png",
        // "heading" ist die Banderole, die über dem Werkbank-Bild liegt.
        heading: "Die wichtigsten Bohrertypen",
        intro: "Nicht jeder Bohrer ist für jedes Material geeignet. " +
               "Klicke auf die Lupen, um mehr zu erfahren.",
        // 5 Bohrer-Hotspots auf dem Werkbank-Foto.
        // x/y sind Prozent vom linken bzw. oberen Bildrand.
        // Die Namen sind identisch mit den Bezeichnungen in Rätsel 2,
        // damit SuS aus der Info-Tafel 1:1 zuordnen können.
        hotspots: [
            {
                id: "steinbohrer",
                name: "Steinbohrer",
                merkmal: "Hat eine breite Hartmetallplatte an der Spitze.",
                erklaerung:
                    "Für Beton, Mauerwerk und Stein wird ein spezieller " +
                    "Bohrer benutzt. Der Steinbohrer hat vorne eine breite, " +
                    "pfeilförmige Platte aus Hartmetall. Diese Platte ist " +
                    "extrem hart und widerstandsfähig, damit sie durch die " +
                    "harten Materialien arbeiten kann.",
                // x/y: Position der Lupe (auf der Bohrer-Gruppe).
                // zoomX/zoomY: Fokuspunkt im Zoom – die Bohrer-SPITZE,
                // damit die didaktisch wichtige Hartmetallplatte groß
                // und zentriert im Bildbereich erscheint.
                x: 32, y: 30, zoomX: 32, zoomY: 30
            },
            {
                id: "holzbohrer",
                name: "Holzbohrer",
                merkmal: "Hat eine Zentrierspitze in der Mitte.",
                erklaerung:
                    "Dieser Bohrer erkennt man an der deutlich " +
                    "hervorstehenden Zentrierspitze in der Mitte. Sie " +
                    "sorgt dafür, dass der Holzbohrer genau an der " +
                    "gewünschten Stelle ansetzt und nicht verrutscht. " +
                    "Die beiden Schneidflügel rechts und links schneiden " +
                    "das Holz sauber, ohne es auszureißen.",
                x: 50, y: 30, zoomX: 50, zoomY: 30
            },
            {
                id: "senker",
                name: "Senker",
                merkmal: "Hat einen kegelförmigen Bohrkopf.",
                erklaerung:
                    "Damit Schraubenköpfe bündig mit dem Material " +
                    "abschließen und nicht herausstehen, wird ein Senker " +
                    "eingesetzt. Der kegelförmige Bohrkopf erzeugt eine " +
                    "konische Vertiefung im Loch. Beim anschließenden " +
                    "Einschrauben verschwindet der Schraubenkopf in " +
                    "dieser Vertiefung.",
                x: 72, y: 30, zoomX: 72, zoomY: 30
            },
            {
                id: "hss-metallbohrer",
                name: "HSS-Metallbohrer",
                merkmal: "Silbergrauer Schaft mit durchgehenden Spiralnuten.",
                erklaerung:
                    "Der HSS-Metallbohrer ist der klassische Bohrer für " +
                    "Metall und Kunststoff. Er hat einen zylindrischen " +
                    "Schaft mit durchgehenden spiralförmigen Nuten. HSS " +
                    "steht für \u201EHochleistungs-Schnellarbeitsstahl\u201C" +
                    " – ein sehr harter Stahl, der sich auch bei hohen " +
                    "Drehzahlen nicht verformt.",
                x: 32, y: 72, zoomX: 32, zoomY: 72
            },
            {
                id: "forstnerbohrer",
                name: "Forstnerbohrer",
                merkmal: "Hat eine flache Schneidscheibe mit Zentrierspitze.",
                erklaerung:
                    "Wenn große, saubere Löcher in Holz gebohrt werden " +
                    "sollen – zum Beispiel für Topfscharniere – kommt " +
                    "dieser Bohrer zum Einsatz. Der Forstnerbohrer hat " +
                    "eine flache, runde Schneidscheibe mit einer " +
                    "Zentrierspitze in der Mitte und Schneidkanten am " +
                    "Rand. Er macht ein präzises, rundes Loch mit " +
                    "glattem Grund.",
                x: 72, y: 72, zoomX: 72, zoomY: 72
            }
        ]
    },
    // -------------------------------------------------------
    // Info-Tafel 3 – Betriebsanweisung als Wandaushang (Bild)
    // -------------------------------------------------------
    // Infotafel 3 – Betriebsanweisung Ständerbohrmaschine
    // -------------------------------------------------------
    // Vorgesehen als "Zoom-to-Wall"-Tafel: Im echten 360°-Foto
    // des PH-Technikraums hängt der Aushang an einer Wand. Klick
    // auf den Hotspot soll die Kamera sanft zum Plakat hinfahren,
    // damit es lesbar wird. Solange das echte Foto nicht vorliegt,
    // ist das Feature über enabled:false deaktiviert – es wird
    // KEIN Hotspot im Panorama gerendert und kein Klick-Handler
    // aktiv.
    // Aktiviert, sobald targetYaw/Pitch aus echtem 360°-Foto bekannt sind.
    "info-3": {
        id: "info-3",
        topic: "Betriebsanweisung Ständerbohrmaschine",
        title: "Betriebsanweisung Ständerbohrmaschine",
        type: "zoom-to-wall",
        enabled: true,
        hotspotLabel: "Betriebsanweisung – zum Heranzoomen klicken",
        imageAlt: "Betriebsanweisung für das Arbeiten an " +
                  "Ständerbohrmaschinen – offizieller Schulaushang",
        // Platzhalter-Position, anpassen wenn echtes 360-Grad-Foto vorliegt.
        targetYaw: 45,
        targetPitch: 0,
        targetHfov: 30,
        animationDuration: 600,
        image: "assets/infotafel/Betriebsanweisung.png"
    },
    // -------------------------------------------------------
    // Info-Tafel 4 – Video-Embed via youtube-nocookie.com
    // DSGVO-konform: kein Tracking vor User-Interaktion.
    // -------------------------------------------------------
    // Die nocookie-Variante setzt erst Cookies, wenn das Video
    // tatsaechlich abgespielt wird – das Oeffnen der Seite allein
    // erzeugt keinen Tracking-Request. Damit ist die Einbindung
    // ohne vorgeschaltete Einwilligung DSGVO-konform.
    "info-4": {
        id: "info-4",
        topic: "Tutorial: Sicher bohren",
        title: "Tutorial: Sicher bohren an der Ständerbohrmaschine",
        type: "video-embed",
        videoId: "4L0BfQDh8ss",
        embedUrl: "https://www.youtube-nocookie.com/embed/4L0BfQDh8ss?rel=0",
        attribution: "Video von Herr Kalt (Andreas Kalt) – datenschutzkonform " +
                     "eingebunden über youtube-nocookie.com"
    },
    // -------------------------------------------------------
    // Info-Tafel 5 – Drehzahltabelle als Wandaushang (Bild)
    // -------------------------------------------------------
    // Zweite "Zoom-to-Wall"-Tafel nach demselben Muster wie
    // Infotafel 3 (Betriebsanweisung). Das fertige Bild der
    // Drehzahl-Tabelle hängt im Panorama als kleines Schild;
    // Klick fährt die Kamera heran und blendet die Grafik
    // formatfüllend ein. Wird später in Rätsel 5 (Drehzahl
    // bestimmen) als Nachschlagewerk genutzt.
    // Platzhalter-Position, anpassen wenn echtes 360-Grad-Foto vorliegt.
    "info-5": {
        id: "info-5",
        topic: "Drehzahl-Tabelle",
        title: "Drehzahl-Tabelle",
        type: "zoom-to-wall",
        enabled: true,
        hotspotLabel: "Drehzahl-Tabelle ansehen",
        imageAlt: "Drehzahl-Tabelle mit Richtwerten für Holz, Metall und Stein",
        // Wandposition (passend zum Hotspot in state.js).
        targetYaw: -116.5,
        targetPitch: -0.9,
        targetHfov: 30,
        animationDuration: 600,
        image: "assets/infotafel/Drehzahltabelle.png"
    }
};


// -----------------------------------------------------------
// Fallback-Zugriff: holt Daten oder liefert Platzhalter.
// -----------------------------------------------------------
window.getInfoContent = function (id) {
    return window.werkstattInfoContent[id] || {
        id: id,
        title: "Info",
        sections: [
            { heading: "Kein Inhalt",
              paragraphs: ["Für diese Tafel ist noch kein Text hinterlegt."] }
        ]
    };
};


// ===========================================================
// Spezial-Renderer: window.infoRenderer[<id>]
// -----------------------------------------------------------
// main.js ruft diesen Renderer (falls vorhanden) beim Öffnen
// der Info-Tafel auf und übergibt den scrollbaren Body-
// Container (DIV.info-panel-body). Der Renderer darf das
// Element komplett befüllen.
// ===========================================================
window.infoRenderer = window.infoRenderer || {};


// -----------------------------------------------------------
// Bauteil-Datensatz für Tafel 1
// -----------------------------------------------------------
// Jedes Bauteil bekommt:
//   nr    – Markerzahl (1..9)
//   name  – kurzer Titel
//   text  – Beschreibung (Klasse 7)
//   marker – {x, y}: Koordinaten im SVG-viewBox (400 x 600)
// -----------------------------------------------------------
// Hinweis Didaktik: In den Tooltip-Texten taucht der Bauteil-
// Name jeweils im Fließtext auf, wird aber NICHT hervorgehoben.
// Die Schülerin / der Schüler soll den Text lesen und das
// Bauteil selbst identifizieren – das aktiviert echtes Lernen.
// Das Feld "name" wird nur intern (z. B. für aria-label) genutzt
// und nicht an der Oberfläche sichtbar gemacht.
// Bauteil-Datensatz für Tafel 1.
// 9 Hotspots, exakt deckungsgleich mit den 9 Drop-Feldern aus
// Rätsel 1 (siehe DROP_ZIELE in puzzles.js). Reihenfolge wie im
// Rätsel; marker.xPct/yPct sind 1:1 die left/top-Werte der jewei-
// ligen Drop-Zone.
const BAUTEILE_TAFEL1 = [
    { nr: 1, name: "Ein-/Ausschalter",
      text: "Mit dem Ein-/Ausschalter startest und stoppst du die " +
            "Maschine. Der grüne Knopf schaltet sie ein, der rote " +
            "Knopf aus. Wichtig: Bevor du etwas einspannst oder den " +
            "Bohrer wechselst, muss die Maschine immer ausgeschaltet " +
            "sein – Sicherheit geht vor!",
      marker: { xPct: 15.6, yPct: 24.1 } },
    { nr: 2, name: "Drehzahlregler",
      text: "Mit dem Drehzahlregler stellst du ein, wie schnell sich " +
            "der Bohrer dreht. Für harte Werkstoffe wie Metall wählst " +
            "du eine niedrige Drehzahl, für weiches Holz oder dünne " +
            "Bohrer eine höhere. Eine Kurzanleitung direkt am Regler " +
            "zeigt dir die passende Stufe für jeden Werkstoff.",
      marker: { xPct: 16.5, yPct: 48.9 } },
    { nr: 3, name: "Bohrfutter",
      text: "In dieses Greifwerkzeug wird der Bohrer eingespannt. Ein " +
            "Schnellspannbohrfutter kann man mit der Hand öffnen und " +
            "schließen – das geht schnell. Ein Zahnkranzbohrfutter braucht " +
            "einen Bohrschlüssel, hält den Bohrer dafür aber besonders " +
            "fest.",
      marker: { xPct: 21.7, yPct: 64.5 } },
    { nr: 4, name: "Bohrer",
      text: "Der Bohrer ist das eigentliche Schneidwerkzeug. Er wird " +
            "ins Bohrfutter eingespannt und schneidet sich beim Drehen " +
            "ins Material. Welcher Bohrer für welches Material taugt, " +
            "siehst du auf der Infotafel „Bohrertypen“.",
      marker: { xPct: 22.7, yPct: 75.4 } },
    { nr: 5, name: "Vorschubhebel",
      text: "Dieser Hebel wird mit der Hand nach unten gedrückt. Durch " +
            "den Vorschubhebel senkt sich die Bohrspindel langsam ab und " +
            "führt den Bohrer kontrolliert ins Werkstück. Wenn du ihn " +
            "loslässt, fährt der Bohrer durch eine Feder wieder nach oben.",
      marker: { xPct: 78.3, yPct: 36.7 } },
    { nr: 6, name: "Tiefenanschlag",
      text: "Mit dem Tiefenanschlag (auch Bohrtiefenanzeige genannt) " +
            "stellst du ein, wie tief der Bohrer in das Werkstück " +
            "eindringen soll. So bohrst du z. B. ein Sackloch in eine " +
            "Holzplatte, ohne unten wieder herauszukommen.",
      marker: { xPct: 73.5, yPct: 65.0 } },
    { nr: 7, name: "Säule",
      text: "Die Säule – auch Ständer genannt – ist der senkrechte, " +
            "tragende Teil der Maschine. An ihr sind der Bohrkopf oben " +
            "und der Bohrtisch in der Mitte befestigt. Sie verbindet alle " +
            "Teile miteinander.",
      marker: { xPct: 74.6, yPct: 73.8 } },
    { nr: 8, name: "Maschinenschraubstock",
      text: "Der Maschinenschraubstock spannt das Werkstück fest auf " +
            "dem Bohrtisch ein, damit es beim Bohren nicht verrutschen " +
            "oder vom Bohrer mitgerissen werden kann. Niemals mit der " +
            "Hand festhalten – ein eingespanntes Werkstück ist ein " +
            "sicheres Werkstück.",
      marker: { xPct: 73.4, yPct: 82.7 } },
    { nr: 9, name: "Maschinentisch",
      text: "Auf diesem verstellbaren Tisch liegt das Werkstück beim " +
            "Bohren – meist im Maschinenschraubstock eingespannt. Der " +
            "Maschinentisch lässt sich in der Höhe verschieben und " +
            "oft auch drehen, manche Modelle kann man sogar schräg " +
            "stellen.",
      marker: { xPct: 77.4, yPct: 92.4 } }
];


// -----------------------------------------------------------
// (Frühere Inline-SVG-Skizze entfernt – die Tafel verwendet
// jetzt das Patentbild aus Rätsel 1 (assets/Baugruppen.png)
// als Hintergrund. Die nummerierten Marker sind HTML-Buttons,
// die per Prozent-Koordinaten über das Bild gelegt werden.)
// -----------------------------------------------------------
// (Konstante SVG_BOHRMASCHINE wurde komplett entfernt – siehe
// Renderer unten, dort wird stattdessen das Patentbild eingebunden.)


// -----------------------------------------------------------
// Renderer für Tafel 1
// -----------------------------------------------------------
// Neues Layout (kein Scrollen!):
//   - Intro-Block (2-3 Zeilen)
//   - Zentrale SVG-Zeichnung mit Markern 1..9
//   - Beim Hover / Fokus / Tap auf einen Marker öffnet sich
//     ein Tooltip direkt am Kreis mit dem Erklärtext.
//   - Merke-Box unten mit 3 Stichpunkten
//
// Der Modal-Body wird durch eine Modifier-Klasse ("--tafel1")
// so umgestellt, dass der Inhalt ohne Scrollbalken auf einen
// Bildschirm passt (Flex-Layout, overflow: hidden).
// -----------------------------------------------------------
window.infoRenderer["info-1"] = function (bodyEl) {

    // Body-Element auf "kein Scrollen"-Modus stellen.
    bodyEl.classList.add("info-panel-body--tafel1");

    // ---------- 1. Intro-Block ----------
    const intro = document.createElement("section");
    intro.className = "i1-intro";

    const h1 = document.createElement("h1");
    h1.className = "i1-haupttitel";
    h1.textContent = "Teile der Bohrmaschine";
    intro.appendChild(h1);

    const lead = document.createElement("p");
    lead.className = "i1-lead";
    lead.textContent =
        "Bevor du mit der Bohrmaschine arbeitest, solltest du ihre " +
        "wichtigsten Teile kennen. Bewege den Mauszeiger über die " +
        "Zahlen (oder tippe sie an), um mehr über jedes Bauteil zu " +
        "erfahren. Lies die Texte genau – sie helfen dir beim Rätsel!";
    intro.appendChild(lead);

    bodyEl.appendChild(intro);

    // ---------- 2. Patentbild-Bühne ----------
    // Wrapper-Struktur exakt wie in Rätsel 1 (.p1-bildwrap):
    // relative + width:fit-content + align-self:center, damit
    // sich die Bühne an die Bildgröße schmiegt und die Marker-
    // Positionen in % zuverlässig auf das Bild bezogen sind.
    const buehne = document.createElement("div");
    buehne.className = "i1-buehne";

    const svgBox = document.createElement("div");
    svgBox.className = "i1-svg-box i1-bildwrap";

    const bild = document.createElement("img");
    bild.className = "i1-bild";
    bild.src = "assets/Baugruppen.png";
    bild.alt = "Patentschrift-Skizze einer Standbohrmaschine mit " +
               "nummerierten Bauteilen.";
    bild.draggable = false;
    svgBox.appendChild(bild);

    buehne.appendChild(svgBox);

    // Tooltip-Element (wird später positioniert).
    // Nur EINS – wir befüllen es je nach aktivem Marker neu.
    const tooltip = document.createElement("div");
    tooltip.className = "i1-tooltip";
    tooltip.setAttribute("role", "tooltip");
    tooltip.id = "i1-tooltip";
    tooltip.setAttribute("aria-hidden", "true");

    const tooltipPfeil = document.createElement("div");
    tooltipPfeil.className = "i1-tooltip-pfeil";

    const tooltipText = document.createElement("p");
    tooltipText.className = "i1-tooltip-text";

    tooltip.appendChild(tooltipPfeil);
    tooltip.appendChild(tooltipText);
    buehne.appendChild(tooltip);

    bodyEl.appendChild(buehne);

    // ---------- 3. (Merke-Block ersatzlos entfernt.) ----------

    // ---------- 4. HTML-Marker absolut über das Bild legen ----------
    // Jeder Marker ist ein <button> mit kursivem "i" als Zeichen,
    // sein Mittelpunkt sitzt per left/top:% + translate(-50%, -50%)
    // auf den hinterlegten Bildkoordinaten.
    //
    // Pulse-Animation: alle 9 Hotspots pulsieren dezent; eine
    // animation-delay-Variation (idx × 0.2 s) verhindert, dass sie
    // im Gleichschritt blinken. Sobald der Spieler einen Hotspot
    // einmal aktiviert hat, wird er als "gesehen" markiert und
    // pulsiert nicht mehr (siehe oeffneTooltip → markiereGesehen).
    //
    // Persistenz: window.werkstattState.tafel1Gesehen ist ein
    // Array mit den nr-Werten bereits gesehener Hotspots. Lebt im
    // Arbeitsspeicher (kein localStorage) und wird beim Reload
    // automatisch verworfen – bewusst so, weil ein Neustart eines
    // Durchlaufs auch das Pulsieren wiederherstellen soll.
    if (window.werkstattState &&
        !Array.isArray(window.werkstattState.tafel1Gesehen)) {
        window.werkstattState.tafel1Gesehen = [];
    }
    const gesehenListe = (window.werkstattState &&
        window.werkstattState.tafel1Gesehen) || [];

    BAUTEILE_TAFEL1.forEach(function (b, idx) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "i1-marker";
        btn.dataset.nr = String(b.nr);
        // Screenreader-Label: neutral ("Bauteil 3"), damit der
        // Bauteil-Name nicht schon vor dem Lesen verraten wird.
        btn.setAttribute("aria-label", "Bauteil " + b.nr);
        btn.setAttribute("aria-describedby", "i1-tooltip");
        btn.style.left = b.marker.xPct + "%";
        btn.style.top  = b.marker.yPct + "%";
        // Versetzte Pulse-Phase, damit nicht alle gleichzeitig atmen.
        btn.style.animationDelay = (idx * 0.2) + "s";
        // Inhalt: kursives "i" als Informations-Symbol.
        btn.innerHTML = "<i>i</i>";
        // Bereits gesehene Hotspots starten nicht mehr im Pulse-Modus.
        if (gesehenListe.indexOf(b.nr) !== -1) {
            btn.classList.add("i1-marker--gesehen");
        }
        svgBox.appendChild(btn);
    });

    // markiereGesehen: nimmt einen Hotspot dauerhaft aus der Pulse-
    // Animation und merkt sich die nr im State.
    function markiereGesehen(nr) {
        const numerischeNr = Number(nr);
        if (window.werkstattState &&
            window.werkstattState.tafel1Gesehen.indexOf(numerischeNr) === -1) {
            window.werkstattState.tafel1Gesehen.push(numerischeNr);
        }
        const el = svgBox.querySelector(
            '.i1-marker[data-nr="' + nr + '"]'
        );
        if (el) el.classList.add("i1-marker--gesehen");
    }

    // ---------- 5. Tooltip-Logik ----------
    // Eine zentrale "Aktiv"-Variable merkt sich, welcher Marker
    // gerade den Tooltip angefordert hat. So können Hover (Maus)
    // und Tap (Touch/Klick) sauber zusammenspielen.
    let aktiveNr = null;

    function findeBauteil(nr) {
        for (let i = 0; i < BAUTEILE_TAFEL1.length; i++) {
            if (String(BAUTEILE_TAFEL1[i].nr) === String(nr)) {
                return BAUTEILE_TAFEL1[i];
            }
        }
        return null;
    }

    // Tooltip anhand des Markers positionieren. Positions-
    // reihenfolge (je nach Platz): rechts → links → unten → oben.
    function positioniereTooltip(markerEl) {
        const buehneRect = buehne.getBoundingClientRect();
        const markerRect = markerEl.getBoundingClientRect();
        const tRect      = tooltip.getBoundingClientRect();

        // Marker-Mittelpunkt relativ zur Bühne.
        const mx = (markerRect.left + markerRect.right) / 2 - buehneRect.left;
        const my = (markerRect.top + markerRect.bottom) / 2 - buehneRect.top;

        const abstand = 14;          // Lücke zwischen Marker und Tooltip
        const markerHalb = markerRect.width / 2;
        const tw = tRect.width || 280;
        const th = tRect.height || 100;

        let links, oben;
        let seite = "rechts";

        // 1) rechts davon?
        if (mx + markerHalb + abstand + tw <= buehneRect.width) {
            seite = "rechts";
            links = mx + markerHalb + abstand;
            oben  = my - th / 2;
        }
        // 2) links davon?
        else if (mx - markerHalb - abstand - tw >= 0) {
            seite = "links";
            links = mx - markerHalb - abstand - tw;
            oben  = my - th / 2;
        }
        // 3) unterhalb?
        else if (my + markerHalb + abstand + th <= buehneRect.height) {
            seite = "unten";
            links = mx - tw / 2;
            oben  = my + markerHalb + abstand;
        }
        // 4) Fallback: oberhalb.
        else {
            seite = "oben";
            links = mx - tw / 2;
            oben  = my - markerHalb - abstand - th;
        }

        // Innerhalb der Bühne halten (kleine Ränder einplanen).
        const rand = 8;
        if (links < rand) links = rand;
        if (links + tw > buehneRect.width - rand) {
            links = buehneRect.width - tw - rand;
        }
        if (oben < rand) oben = rand;
        if (oben + th > buehneRect.height - rand) {
            oben = buehneRect.height - th - rand;
        }

        tooltip.style.left = Math.round(links) + "px";
        tooltip.style.top  = Math.round(oben)  + "px";

        // Seite fürs Pfeil-Styling am Tooltip markieren.
        tooltip.dataset.seite = seite;
    }

    function oeffneTooltip(nr, markerEl) {
        const b = findeBauteil(nr);
        if (!b) return;
        tooltipText.textContent = b.text;
        tooltip.classList.add("i1-tooltip--sichtbar");
        tooltip.setAttribute("aria-hidden", "false");
        // Markieren, welcher Marker gerade aktiv ist.
        svgBox.querySelectorAll(".i1-marker").forEach(function (m) {
            m.classList.toggle("i1-marker--aktiv",
                m.dataset.nr === String(nr));
        });
        aktiveNr = String(nr);
        // Hotspot dauerhaft als „gesehen" markieren – das stoppt das
        // Pulsieren und merkt den Zustand bis zum nächsten Reload.
        markiereGesehen(nr);
        // Positionieren erst NACH dem Einblenden (Maße bekannt).
        requestAnimationFrame(function () {
            positioniereTooltip(markerEl);
        });
    }

    function schliesseTooltip() {
        tooltip.classList.remove("i1-tooltip--sichtbar");
        tooltip.setAttribute("aria-hidden", "true");
        svgBox.querySelectorAll(".i1-marker--aktiv").forEach(function (m) {
            m.classList.remove("i1-marker--aktiv");
        });
        aktiveNr = null;
    }

    // Touch-Erkennung: auf echten Touch-Geräten soll der Tooltip
    // auf Tap umschaltbar sein und auf "Klick daneben" schließen.
    let letzterTouch = 0;
    function istKuerzlichTouch() {
        return (Date.now() - letzterTouch) < 500;
    }

    svgBox.querySelectorAll(".i1-marker").forEach(function (m) {
        const nr = m.dataset.nr;

        // Maus: Hover öffnet, Verlassen schließt – aber nur, wenn
        // nicht gerade per Touch getoggelt wurde (sonst würde ein
        // simuliertes mouseleave den Tooltip sofort wegnehmen).
        m.addEventListener("mouseenter", function () {
            if (istKuerzlichTouch()) return;
            oeffneTooltip(nr, m);
        });
        m.addEventListener("mouseleave", function () {
            if (istKuerzlichTouch()) return;
            // Nur schließen, wenn kein Tastatur-Fokus aktiv ist.
            if (document.activeElement !== m) {
                schliesseTooltip();
            }
        });

        // Tastatur: Fokus öffnet, Fokus-Verlust schließt.
        m.addEventListener("focus", function () { oeffneTooltip(nr, m); });
        m.addEventListener("blur",  schliesseTooltip);
        m.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (aktiveNr === nr) {
                    schliesseTooltip();
                } else {
                    oeffneTooltip(nr, m);
                }
            } else if (e.key === "Escape") {
                schliesseTooltip();
            }
        });

        // Touch: Tap toggelt den Tooltip.
        m.addEventListener("touchstart", function (e) {
            letzterTouch = Date.now();
            e.preventDefault();     // verhindert simulierten Klick danach
            if (aktiveNr === nr) {
                schliesseTooltip();
            } else {
                oeffneTooltip(nr, m);
            }
        }, { passive: false });

        // Klick (Desktop-Fallback, z. B. wenn Hover nicht greift).
        m.addEventListener("click", function (e) {
            if (istKuerzlichTouch()) return; // schon per touchstart behandelt
            if (aktiveNr === nr) {
                schliesseTooltip();
            } else {
                oeffneTooltip(nr, m);
            }
        });
    });

    // Tap außerhalb eines Markers schließt den Tooltip.
    function aussenhandler(e) {
        if (!aktiveNr) return;
        const ziel = e.target;
        if (tooltip.contains(ziel)) return;
        // Ziel in einem Marker? (closest funktioniert auch auf SVG)
        if (ziel.closest && ziel.closest(".i1-marker")) return;
        schliesseTooltip();
    }
    bodyEl.addEventListener("click", aussenhandler);
    bodyEl.addEventListener("touchstart", aussenhandler, { passive: true });

    // Bei Fenster-Resize: aktiven Tooltip neu positionieren.
    function reposition() {
        if (!aktiveNr) return;
        const aktiverMarker = svgBox.querySelector(
            '.i1-marker[data-nr="' + aktiveNr + '"]'
        );
        if (aktiverMarker) positioniereTooltip(aktiverMarker);
    }
    window.addEventListener("resize", reposition);
};


// ===========================================================
// Renderer für Tafel 2 – Layout "werkbank-zoom"
// -----------------------------------------------------------
// Konzept:
//   Phase 1 (Übersicht): Werkbank-Foto füllt das Panel aus.
//     Eine dezente, halbtransparente Banderole oben trägt den
//     Titel und die kurze Einleitung. Auf jeder Bohrer-Gruppe
//     pulsiert ein goldgelber Lupen-Button.
//   Phase 2 (Zoom-Animation): Klick auf eine Lupe zoomt das
//     Bild auf diese Gruppe (transform: scale + translate),
//     Lupen-Icons blenden aus.
//   Phase 3 (Detail): Dunkles Panel mit Bezeichnung, Merkmal
//     und Erklärungstext erscheint am rechten Rand (Desktop)
//     bzw. unten (Mobil). Enthält Button "Zurück zur Übersicht".
//   Phase 4 (Zurück): Zoom-Out und Lupen wieder sichtbar.
//
// Tastatur: Tab → Lupe, Enter/Leertaste → öffnen,
//           Escape → Detail-Ansicht schließen; auf der
//           Übersicht schließt Escape die ganze Info-Tafel
//           (dafür sorgt bereits main.js → openInfoPanel).
// ===========================================================
window.infoRenderer["info-2"] = function (bodyEl) {

    const daten = window.werkstattInfoContent["info-2"];
    if (!daten) return;

    // Body als Flex-Column: oben die Stage (flex:1), unten ein
    // schmaler Tipp-Streifen mit der Einleitung. Der Titel
    // "Bohrertypen" wird bereits von der Modal-Kopfzeile gestellt
    // (siehe openInfoPanel in main.js) – wir bauen hier keinen
    // zweiten Header.
    bodyEl.classList.add("info-panel-body--werkbank");

    // ---------- Stage: Flex-Row (Bildbereich links, Detail rechts) ----------
    // In Phase 1 nimmt der Bildbereich die volle Breite ein.
    // In Phase 2 schrumpft er auf 65 %, das Detail-Panel füllt 35 %.
    const stage = document.createElement("div");
    stage.className = "werkbank-stage";

    // Linke Spalte: zentriert die Bühne und hat den dunklen
    // Werkbank-Hintergrund für dezente Letterbox-Ränder.
    const bildbereich = document.createElement("div");
    bildbereich.className = "werkbank-bildbereich";

    // Bühne = Wrapper, der den gesamten Bildbereich füllt. Das Bild
    // nutzt object-fit: cover und wird ggf. oben/unten leicht zu-
    // geschnitten, damit der Platz voll ausgenutzt wird. Lupen- und
    // Zoom-Koordinaten beziehen sich auf diesen Wrapper (nicht auf
    // das Natural-Seitenverhältnis des Bildes).
    const buehne = document.createElement("div");
    buehne.className = "werkbank-buehne";

    const bild = document.createElement("img");
    bild.className = "werkbank-bild";
    bild.src = daten.backgroundImage;
    bild.alt = "Werkbank mit fünf verschiedenen Bohrertypen.";
    bild.draggable = false;
    buehne.appendChild(bild);

    // Lupen-Schicht: overlay in Bildgröße, Kinder sind die Buttons.
    const lupenSchicht = document.createElement("div");
    lupenSchicht.className = "werkbank-lupen";
    buehne.appendChild(lupenSchicht);

    bildbereich.appendChild(buehne);
    stage.appendChild(bildbereich);

    // ---------- Detail-Panel (rechte Spalte, in Phase 1 unsichtbar) ----------
    const detail = document.createElement("aside");
    detail.className = "werkbank-detail";
    detail.setAttribute("role", "dialog");
    detail.setAttribute("aria-labelledby", "werkbank-detail-titel");
    detail.setAttribute("aria-hidden", "true");

    // Innerer Scroll-Container: nur er scrollt bei langem Text,
    // nicht die gesamte Stage. So bleibt der Zurück-Button immer
    // ohne Layout-Sprünge sichtbar.
    const detailInhalt = document.createElement("div");
    detailInhalt.className = "werkbank-detail-inhalt";

    const detailTitel = document.createElement("h2");
    detailTitel.id = "werkbank-detail-titel";
    detailTitel.className = "werkbank-detail-titel";

    const detailMerkmal = document.createElement("p");
    detailMerkmal.className = "werkbank-detail-merkmal";

    const detailTrenner = document.createElement("div");
    detailTrenner.className = "werkbank-detail-trenner";

    const detailText = document.createElement("p");
    detailText.className = "werkbank-detail-text";

    const zurueckBtn = document.createElement("button");
    zurueckBtn.type = "button";
    zurueckBtn.className = "werkbank-zurueck-btn";
    zurueckBtn.textContent = "\u2190 Zurück zur Übersicht";

    detailInhalt.appendChild(detailTitel);
    detailInhalt.appendChild(detailMerkmal);
    detailInhalt.appendChild(detailTrenner);
    detailInhalt.appendChild(detailText);
    detail.appendChild(detailInhalt);
    detail.appendChild(zurueckBtn);
    stage.appendChild(detail);

    bodyEl.appendChild(stage);

    // ---------- Fuß-Streifen mit Einleitungstext ----------
    const fussStreifen = document.createElement("div");
    fussStreifen.className = "werkbank-intro";
    fussStreifen.textContent = daten.intro;
    bodyEl.appendChild(fussStreifen);

    // ---------- Lupen-Buttons platzieren ----------
    daten.hotspots.forEach(function (h) {
        const lupe = document.createElement("button");
        lupe.type = "button";
        lupe.className = "werkbank-lupe";
        lupe.style.left = h.x + "%";
        lupe.style.top  = h.y + "%";
        lupe.dataset.hotspotId = h.id;
        lupe.setAttribute("aria-label",
            "Mehr über " + h.name + " erfahren");
        lupe.title = "Klicken für Info";
        lupe.innerHTML =
            '<svg class="werkbank-lupe-svg" viewBox="0 0 24 24" ' +
            'aria-hidden="true">' +
              '<circle cx="10" cy="10" r="6" fill="none" ' +
                      'stroke="currentColor" stroke-width="2.2"/>' +
              '<line x1="15" y1="15" x2="21" y2="21" ' +
                    'stroke="currentColor" stroke-width="2.5" ' +
                    'stroke-linecap="round"/>' +
            '</svg>';
        lupe.addEventListener("click", function () {
            oeffneDetail(h);
        });
        lupenSchicht.appendChild(lupe);
    });

    // ---------- Zoom-Logik ----------
    // transform-origin wird auf die Lupen-Koordinate (h.x/h.y)
    // gesetzt; scale(z) lässt das Bild um genau diesen Punkt
    // wachsen. Da der Bildbereich in Phase 2 zusätzlich auf 65 %
    // schrumpft, wird die fokussierte Stelle noch einmal stärker
    // herangeholt.
    let aktiverHotspot = null;

    function zoomFaktor() {
        const b = window.innerWidth;
        if (b < 720)  return 1.8;   // Smartphone
        if (b < 1200) return 2.0;   // Tablet
        return 2.2;                 // Desktop
    }

    function wendeZoomAn(h) {
        // Bohrergruppe exakt in der Bildmitte landen lassen.
        //
        // Hintergrund: transform-origin am Fokus + scale() hält den
        // Fokuspunkt nur an seiner ursprünglichen Position fest, NICHT
        // im Mittelpunkt des Bildbereichs. Stattdessen:
        //   1. translate so, dass der Fokuspunkt visuell zur Bühnen-
        //      mitte rückt (Δ = 50 − zoomX bzw. 50 − zoomY, mal s
        //      weil translate-% auf die unscaled Bühne wirkt und um
        //      den Skalierungsfaktor mitwächst).
        //   2. scale um die Bühnenmitte (transform-origin 50/50).
        // Damit liegt die Bohrergruppe garantiert zentriert im Frame.
        const s = zoomFaktor();
        const tx = (50 - h.zoomX) * s;
        const ty = (50 - h.zoomY) * s;
        buehne.style.transformOrigin = "50% 50%";
        buehne.style.transform =
            "translate(" + tx + "%, " + ty + "%) scale(" + s + ")";
    }

    function oeffneDetail(h) {
        aktiverHotspot = h;
        wendeZoomAn(h);

        bodyEl.classList.add("werkbank-layout--gezoomt");

        detailTitel.textContent = h.name;
        detailMerkmal.textContent = h.merkmal;
        detailText.textContent = h.erklaerung;
        detail.setAttribute("aria-hidden", "false");
        detail.classList.add("werkbank-detail--sichtbar");

        requestAnimationFrame(function () {
            zurueckBtn.focus();
        });
    }

    function schliesseDetail() {
        if (!aktiverHotspot) return;
        aktiverHotspot = null;

        buehne.style.transform = "";
        buehne.style.transformOrigin = "";
        bodyEl.classList.remove("werkbank-layout--gezoomt");
        detail.classList.remove("werkbank-detail--sichtbar");
        detail.setAttribute("aria-hidden", "true");
    }

    zurueckBtn.addEventListener("click", schliesseDetail);

    // Escape schließt zuerst das Detail; nur auf der Übersicht
    // schließt Escape die ganze Info-Tafel (Handler in main.js).
    bodyEl.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape" && aktiverHotspot) {
            ev.stopPropagation();
            schliesseDetail();
        }
    }, true);

    // Bei Viewport-Änderung (Breakpoint-Wechsel) den Zoom-Faktor
    // neu anwenden, damit z. B. nach Tablet→Desktop der Fokus stimmt.
    window.addEventListener("resize", function () {
        if (aktiverHotspot) wendeZoomAn(aktiverHotspot);
    });
};


