/* ===========================================================
   Werkstatt-Blackout – puzzle4.js
   -----------------------------------------------------------
   Raetsel 4 – Handhabung und Sicherheit (Szenario-Multiple-Choice)
   Inhaltliche Grundlage: Video "Tischbohrmaschine: Richtig und
   sicher bohren" von Andreas Kalt (Herr Kalt).

   Der Spieler durchlaeuft 7 Szenen eines kompletten Bohrvorgangs
   (Freigabe/PSA, Drehzahl, Bohrer einspannen, Bohrtiefe, Eiertest,
   Bohrausfuehrung, Aufraeumen). Pro Szene gibt es eine Situations-
   beschreibung und 4 Antwort-Optionen (1 richtig, 3 falsch). Die
   Reihenfolge der Optionen wird gemischt.

   Paedagogisches Design:
   - Falsche Wahl: rote Warnbox mit Video-Zitat und Unfall-
     Konsequenz, Szene wird erneut versucht.
   - Richtige Wahl: gruene Bestaetigung, automatisch zur
     naechsten Szene.
   - Scaffolding:
       - 2 Fehler in derselben Szene -> Button "Video ansehen".
       - 3 Gesamt-Fehler -> Tipp-Text.
       - 6 Gesamt-Fehler -> Telefon-Fallback mit Freischalt-Button.
   - errorCount wird ueber puzzleState.errorCount fuer die Urkunde
     am Spielende mitgezaehlt.
   =========================================================== */

"use strict";

window.puzzleRenderer = window.puzzleRenderer || {};


(function () {

    // -------------------------------------------------------
    // Schwellwerte fuer das Hilfesystem.
    // -------------------------------------------------------
    const SCHWELLE_VIDEO_LOKAL = 2;   // Fehler in derselben Szene -> Video-Button
    const SCHWELLE_TIPP        = 3;   // Gesamt-Fehler -> automatischer Tipp
    const SCHWELLE_TELEFON     = 6;   // Gesamt-Fehler -> Telefon-Fallback


    // -------------------------------------------------------
    // Die 7 Szenen des Bohrvorgangs.
    // Zu jeder Option gehoert bei "correct" ein Feedback-Text,
    // bei "falsch" ein videoCitation-Verweis auf das Tutorial
    // sowie eine konsequenz-Beschreibung fuer den Unfall.
    // -------------------------------------------------------
    const SZENEN = [
        {
            id: 1,
            titel: "Freigabe und PSA",
            situation:
                "Du willst an der Ständerbohrmaschine arbeiten. Was tust du als " +
                "allererstes, bevor du überhaupt etwas anfasst?",
            options: [
                {
                    text: "Lehrkraft um Freigabe bitten und danach Schutzausrüstung " +
                          "anlegen (Schutzbrille, Haare zusammenbinden, enge Kleidung)",
                    correct: true,
                    feedback:
                        "Exakt! Ohne Freigabe der Lehrkraft darf die Maschine nie " +
                        "benutzt werden – und PSA gehört vor jeder Maschinenarbeit."
                },
                {
                    text: "Einfach loslegen – du weißt, wie es geht",
                    correct: false,
                    videoCitation:
                        "Die Ständerbohrmaschine darf nur nach Freigabe durch " +
                        "die Lehrkraft benutzt werden.",
                    konsequenz:
                        "Ohne Freigabe fehlt jede Sicherheits-Rückendeckung. Bei " +
                        "einem Unfall wäre niemand zuständig – und du verstößt " +
                        "gegen die Werkstatt-Regeln."
                },
                {
                    text: "Maschine einschalten und die Drehzahl schon mal einstellen",
                    correct: false,
                    videoCitation:
                        "Vor Arbeitsbeginn: Maschinenfreigabe holen, Schutz­" +
                        "ausrüstung anlegen – in dieser Reihenfolge.",
                    konsequenz:
                        "Die Maschine darf erst laufen, wenn alles vorbereitet ist " +
                        "UND du selbst geschützt bist."
                },
                {
                    text: "Bohrer aussuchen und einspannen, das ist der wichtigste Schritt",
                    correct: false,
                    videoCitation:
                        "Die eigene Sicherheit kommt vor allem anderen.",
                    konsequenz:
                        "Beim Einspannen ohne Schutzbrille können scharfe Kanten " +
                        "oder herumliegende Späne dein Auge treffen."
                }
            ]
        },
        {
            id: 2,
            titel: "Drehzahl bestimmen",
            situation:
                "PSA sitzt, Freigabe hast du. Welche Drehzahl stellst du ein?",
            options: [
                {
                    text: "In der Drehzahltabelle nachschauen – passend zu Material " +
                          "und Bohrer-Durchmesser",
                    correct: true,
                    feedback:
                        "Genau! Die Tabelle an der Maschine zeigt dir: je größer " +
                        "der Bohrer und je härter das Material, desto niedriger " +
                        "die Drehzahl."
                },
                {
                    text: "Die höchste Drehzahl, dann geht's am schnellsten",
                    correct: false,
                    videoCitation:
                        "Die richtige Drehzahl hängt vom Material und vom " +
                        "Bohrer-Durchmesser ab.",
                    konsequenz:
                        "Zu hohe Drehzahl lässt den Bohrer heiß werden und stumpf – " +
                        "oder er bricht ab und wird zum Geschoss."
                },
                {
                    text: "Die niedrigste Drehzahl, weil am sichersten",
                    correct: false,
                    videoCitation:
                        "Eine zu niedrige Drehzahl kann zum Verhaken des Bohrers " +
                        "führen.",
                    konsequenz:
                        "Zu langsame Drehung lässt den Bohrer haken statt " +
                        "schneiden – das Werkstück wird herumgerissen."
                },
                {
                    text: "Egal welche – Hauptsache er dreht sich",
                    correct: false,
                    videoCitation:
                        "Die Drehzahl ist material- und durchmesserabhängig " +
                        "einzustellen.",
                    konsequenz:
                        "Falsche Drehzahl = schlechtes Ergebnis, überhitzter " +
                        "Bohrer, Gefahr für Werkstück und Gesundheit."
                }
            ]
        },
        {
            id: 3,
            titel: "Bohrer einspannen",
            situation:
                "Drehzahl stimmt. Du nimmst den Bohrer und setzt ihn ins " +
                "Bohrfutter. Was ist wichtig?",
            options: [
                {
                    text: "Bohrer gerade und mittig einsetzen, dann das Bohrfutter " +
                          "mit der Hand kräftig zudrehen, bis der Bohrer fest sitzt",
                    correct: true,
                    feedback:
                        "Genau! Ein Schnellspann-Bohrfutter wird von Hand fest " +
                        "angezogen – gerade, mittig und wirklich fest. Das ist " +
                        "die Grundlage für einen sauberen Rundlauf."
                },
                {
                    text: "Bohrer schief in eine der drei Spannbacken legen – das " +
                          "geht schneller",
                    correct: false,
                    videoCitation:
                        "Der Bohrer muss gerade und mittig ins Bohrfutter.",
                    konsequenz:
                        "Schief eingespannt eiert der Bohrer stark, bricht im " +
                        "Material oder reißt das Werkstück auf."
                },
                {
                    text: "Locker einsetzen – zu festes Anziehen könnte den " +
                          "Bohrerschaft beschädigen",
                    correct: false,
                    videoCitation:
                        "Das Bohrfutter muss fest angezogen werden, damit der " +
                        "Bohrer sicher sitzt.",
                    konsequenz:
                        "Ein lockerer Bohrer rutscht beim Bohren durch das " +
                        "Bohrfutter oder wird herausgeschleudert."
                },
                {
                    text: "Maschine kurz einschalten, damit das Bohrfutter sich " +
                          "durch die Drehung selbst zuzieht",
                    correct: false,
                    videoCitation:
                        "Alle Einstellungen am Bohrfutter erfolgen bei " +
                        "ausgeschalteter Maschine.",
                    konsequenz:
                        "Mit losem Bohrer einschalten = unkontrollierbares " +
                        "Flugobjekt auf Augenhöhe."
                }
            ]
        },
        {
            id: 4,
            titel: "Bohrtiefe einstellen",
            situation:
                "Bohrer sitzt fest, Schlüssel liegt weg. Wie stellst du die Bohrtiefe ein?",
            options: [
                {
                    text: "Tiefenanschlag so einstellen, dass der Bohrer das Werkstück " +
                          "durchdringt, aber nicht weiter in den Bohrtisch fährt",
                    correct: true,
                    feedback:
                        "Genau! Der Tiefenanschlag schützt den Bohrtisch und stoppt " +
                        "den Vorschub automatisch."
                },
                {
                    text: "Keine Einstellung nötig – ich stoppe manuell, wenn ich durch bin",
                    correct: false,
                    videoCitation:
                        "Die Bohrtiefe wird am Tiefenanschlag voreingestellt.",
                    konsequenz:
                        "Ein kurzer Moment der Unachtsamkeit – und du bohrst durch " +
                        "das Werkstück in den Bohrtisch. Bohrer kaputt, Tisch beschädigt."
                },
                {
                    text: "Tiefenanschlag ganz öffnen für maximale Flexibilität",
                    correct: false,
                    videoCitation:
                        "Der Tiefenanschlag begrenzt die maximale Eindringtiefe gezielt.",
                    konsequenz:
                        "Ohne Begrenzung drückst du den Bohrer durch das Werkstück " +
                        "direkt in den Bohrtisch."
                },
                {
                    text: "Den Bohrtisch nach oben fahren, bis der Bohrer aufsitzt",
                    correct: false,
                    videoCitation:
                        "Die Bohrtiefe wird am Anschlag eingestellt, nicht über die " +
                        "Tischhöhe.",
                    konsequenz:
                        "Tischhöhe ist für Werkstück-Dicke, nicht für Bohrtiefe – " +
                        "beim Durchbohren triffst du trotzdem den Tisch."
                }
            ]
        },
        {
            id: 5,
            titel: "Bohrer-Prüfung (Eiertest)",
            situation:
                "Alles eingerichtet. Du schaltest die Maschine KURZ ein – noch ohne " +
                "Werkstück. Worauf achtest du jetzt?",
            options: [
                {
                    text: "Ob der Bohrer rund läuft – also nicht \u201Eeiert\u201C. " +
                          "Bei Eiern: sofort ausschalten und neu einspannen",
                    correct: true,
                    feedback:
                        "Das ist der Eiertest – ein Profi-Check direkt aus dem " +
                        "Tutorial! Ein eiernder Bohrer kann brechen oder das " +
                        "Werkstück aufreißen."
                },
                {
                    text: "Ob die Maschine laut genug klingt",
                    correct: false,
                    videoCitation:
                        "Beim Probelauf auf den Rundlauf des Bohrers achten.",
                    konsequenz:
                        "Lautstärke sagt nichts über den Rundlauf. Ein eiernder " +
                        "Bohrer bricht beim Bohren möglicherweise ab."
                },
                {
                    text: "Direkt weiter zum Bohren – Eiern merkt man eh erst im Material",
                    correct: false,
                    videoCitation:
                        "Der Rundlauf ist VOR dem Bohren zu prüfen.",
                    konsequenz:
                        "Beim Bohren merkst du es zu spät – der Bohrer kann brechen " +
                        "und Splitter fliegen durch den Raum."
                },
                {
                    text: "Mit der Hand den Bohrer abbremsen, um den Sitz zu prüfen",
                    correct: false,
                    videoCitation:
                        "Bewegte Teile der Maschine dürfen nie berührt werden.",
                    konsequenz:
                        "SCHWERSTE VERLETZUNG! Ein drehender Bohrer trennt Finger " +
                        "ab. Rundlauf-Prüfung ausschließlich durch Beobachten."
                }
            ]
        },
        {
            id: 6,
            titel: "Bohrausführung",
            situation:
                "Bohrer läuft rund. Du schaltest aus, spannst das Werkstück im " +
                "Maschinenschraubstock ein, schaltest die Maschine wieder ein. " +
                "Wie bohrst du jetzt?",
            options: [
                {
                    text: "Mit gleichmäßigem, mittlerem Druck absenken. Den " +
                          "Schraubstock seitlich mit einer Hand festhalten, damit " +
                          "er sich nicht mitdreht. Bei Holz den Bohrer mehrfach " +
                          "hochziehen, damit Späne rausfallen",
                    correct: true,
                    feedback:
                        "Perfekt! Der Schraubstock wird gehalten – nicht das " +
                        "Werkstück. So bleibt die Hand sicher weg vom Bohrer, und " +
                        "trotzdem kann sich nichts drehen. Spanabfuhr bei Holz " +
                        "ist der Tutorial-Tipp."
                },
                {
                    text: "Mit voller Kraft draufdrücken, damit es schneller geht",
                    correct: false,
                    videoCitation:
                        "Mit gleichmäßigem, mäßigem Vorschub bohren.",
                    konsequenz:
                        "Zu hoher Druck lässt den Bohrer verkanten oder brechen. " +
                        "Bohrer-Splitter fliegen durch den Raum."
                },
                {
                    text: "Das Werkstück direkt mit der zweiten Hand nahe der " +
                          "Bohrstelle festhalten, falls es wackelt",
                    correct: false,
                    videoCitation:
                        "Während des Bohrens darf weder Werkstück noch Bohrer" +
                        "bereich berührt werden – gehalten wird nur der Schraubstock.",
                    konsequenz:
                        "Wenn der Bohrer hakt, wird die Hand in den Bohrer " +
                        "gerissen. Gehalten wird der Schraubstock außen, nie das " +
                        "Werkstück."
                },
                {
                    text: "Bei Holz in einem Zug durchbohren – schnell und sauber",
                    correct: false,
                    videoCitation:
                        "Bei Holz den Bohrer mehrfach hochziehen, damit die Späne " +
                        "das Bohrloch verlassen können.",
                    konsequenz:
                        "Ohne Spanabfuhr staut sich Material, der Bohrer hakt, das " +
                        "Werkstück reißt oder der Bohrer bricht."
                }
            ]
        },
        {
            id: 7,
            titel: "Aufräumen",
            situation:
                "Die Bohrung ist fertig. Was tust du jetzt, bevor du den nächsten " +
                "Arbeitsschritt angehst oder den Platz verlässt?",
            options: [
                {
                    text: "Maschine ausschalten, warten bis der Bohrer stillsteht, " +
                          "Späne mit Handfeger entfernen, Werkplatz sauber hinterlassen",
                    correct: true,
                    feedback:
                        "Genau so! Die goldene Aufräum-Regel – Handfeger, keine Hand. " +
                        "Und ein sauberer Platz ist Pflicht für die nächste Person."
                },
                {
                    text: "Werkstück rausholen, Späne schnell mit der Hand wegwischen",
                    correct: false,
                    videoCitation:
                        "Späne ausschließlich mit Handfeger oder Pinsel entfernen.",
                    konsequenz:
                        "SCHNITTGEFAHR! Späne sind messerscharf und oft heiß. Tiefe " +
                        "Schnittwunden – häufigster Bohrmaschinen-Unfall."
                },
                {
                    text: "Späne wegpusten, damit der nächste Platz sauber ist",
                    correct: false,
                    videoCitation:
                        "Späne dürfen nicht durch Blasen entfernt werden.",
                    konsequenz:
                        "Die Späne fliegen in Augen, Haare, Kleidung – bei dir oder " +
                        "der nächsten Person."
                },
                {
                    text: "Einfach gehen – die nächste Person räumt selbst auf",
                    correct: false,
                    videoCitation:
                        "Nach Beendigung der Arbeit: Werkplatz reinigen und Bohrer " +
                        "entnehmen.",
                    konsequenz:
                        "Die nächste Person startet mit deinem Chaos, verliert Zeit " +
                        "und beginnt möglicherweise mit unklaren Einstellungen."
                }
            ]
        }
    ];


    // -------------------------------------------------------
    // Fisher-Yates-Mischung fuer die Antwort-Reihenfolge.
    // -------------------------------------------------------
    function mischen(feld) {
        const kopie = feld.slice();
        for (let i = kopie.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = kopie[i]; kopie[i] = kopie[j]; kopie[j] = tmp;
        }
        return kopie;
    }


    // -------------------------------------------------------
    // Persistenter Zustand des Raetsels.
    // - currentScene:   0..6 (Index der aktuellen Szene)
    // - sceneErrors:    Fehler in der aktuellen Szene
    // - failedChecks:   Gesamt-Fehler fuer das Scaffolding
    // - errorCount:     Gesamt-Fehler fuer die Urkunde am Ende
    // -------------------------------------------------------
    function holeOderInitZustand() {
        const p = (typeof getPuzzle === "function") ? getPuzzle(4) : null;
        if (!p) return null;
        if (typeof p.currentScene !== "number") p.currentScene = 0;
        if (typeof p.sceneErrors  !== "number") p.sceneErrors  = 0;
        if (typeof p.failedChecks !== "number") p.failedChecks = 0;
        return p;
    }


    // =========================================================
    // Renderer – wird von main.js aufgerufen, sobald der Spieler
    // Leuchte 4 anklickt.
    // =========================================================
    window.puzzleRenderer[4] = function rendern(inhaltEl, schliesseModal) {

        inhaltEl.innerHTML = "";
        inhaltEl.classList.add("modal-inhalt--puzzle");
        inhaltEl._schliesseModal = schliesseModal;

        const puzzleState = holeOderInitZustand();
        if (!puzzleState) {
            console.error("Puzzle 4: State nicht verfuegbar.");
            return;
        }

        if (puzzleState.solved) {
            erfolgsScreenZeigen();
            return;
        }

        if (puzzleState.currentScene === 0 && !puzzleState.sceneStarted) {
            introScreenZeigen();
        } else {
            szeneRendern(puzzleState.currentScene);
        }


        // =====================================================
        //  INTRO-SCREEN
        // =====================================================
        function introScreenZeigen() {
            inhaltEl.innerHTML = "";

            const intro = document.createElement("div");
            intro.className = "p4-intro";

            const titel = document.createElement("h3");
            titel.className = "p4-intro-titel";
            titel.textContent = "Sicherheits-Leuchte 4";
            intro.appendChild(titel);

            const text = document.createElement("p");
            text.className = "p4-intro-text";
            text.textContent =
                "Die Sicherheits-Leuchte 4 blinkt rot. Die Maschine will sehen, " +
                "dass du wirklich sicher bohren kannst. Führe einen kompletten " +
                "Bohrvorgang durch – triff bei jedem Schritt die richtige " +
                "Entscheidung.";
            intro.appendChild(text);

            const hinweis = document.createElement("p");
            hinweis.className = "p4-intro-hinweis";
            hinweis.textContent =
                "Tipp: An der Wand hängt ein Tutorial-Video, falls du unsicher bist.";
            intro.appendChild(hinweis);

            const startBtn = document.createElement("button");
            startBtn.type = "button";
            startBtn.className = "p4-intro-btn";
            startBtn.textContent = "BOHRVORGANG BEGINNEN";
            startBtn.addEventListener("click", function () {
                puzzleState.sceneStarted = true;
                szeneRendern(0);
            });
            intro.appendChild(startBtn);

            inhaltEl.appendChild(intro);
            setTimeout(function () { startBtn.focus(); }, 0);
        }


        // =====================================================
        //  SZENEN-RENDERING
        // =====================================================
        function szeneRendern(index) {

            const szene = SZENEN[index];
            puzzleState.currentScene = index;
            puzzleState.sceneErrors  = 0;

            inhaltEl.innerHTML = "";

            // ---- Fortschritts-Kopfzeile ----
            const kopf = document.createElement("div");
            kopf.className = "p4-fortschritt";

            const label = document.createElement("div");
            label.className = "p4-fortschritt-label";
            label.textContent = "Szene " + (index + 1) + " von " + SZENEN.length +
                                " – " + szene.titel;
            kopf.appendChild(label);

            const balken = document.createElement("div");
            balken.className = "p4-balken";
            balken.style.gridTemplateColumns =
                "repeat(" + SZENEN.length + ", minmax(0, 1fr))";
            for (let i = 0; i < SZENEN.length; i++) {
                const seg = document.createElement("div");
                seg.className = "p4-balken-seg" +
                    (i < index ? " p4-balken-seg--fertig" :
                     i === index ? " p4-balken-seg--aktiv" : "");
                balken.appendChild(seg);
            }
            kopf.appendChild(balken);
            inhaltEl.appendChild(kopf);

            // ---- Situations-Block ----
            const box = document.createElement("div");
            box.className = "p4-situation";

            const icon = document.createElement("div");
            icon.className = "p4-szene-icon";
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = "⚙️";
            box.appendChild(icon);

            const situation = document.createElement("p");
            situation.className = "p4-situation-text";
            situation.textContent = szene.situation;
            box.appendChild(situation);
            inhaltEl.appendChild(box);

            // ---- Optionen (gemischt) ----
            const optionen = mischen(szene.options);
            const optionenWrap = document.createElement("div");
            optionenWrap.className = "p4-optionen";

            const buttons = [];
            optionen.forEach(function (opt, i) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "p4-option";
                btn.setAttribute("aria-label",
                    "Option " + (i + 1) + ": " + opt.text);

                const nummer = document.createElement("span");
                nummer.className = "p4-option-nummer";
                nummer.textContent = (i + 1) + ".";
                btn.appendChild(nummer);

                const text = document.createElement("span");
                text.className = "p4-option-text";
                text.textContent = opt.text;
                btn.appendChild(text);

                btn.addEventListener("click", function () {
                    antwortVerarbeiten(opt, btn, buttons, index);
                });
                buttons.push(btn);
                optionenWrap.appendChild(btn);
            });
            inhaltEl.appendChild(optionenWrap);

            // ---- Feedback-Container ----
            const feedback = document.createElement("div");
            feedback.className = "p4-feedback p4-feedback--versteckt";
            feedback.setAttribute("role", "status");
            feedback.setAttribute("aria-live", "polite");
            inhaltEl.appendChild(feedback);

            // ---- Einheitlicher Hilfe-Slot (js/hilfe.js) ----
            const hilfe = document.createElement("div");
            hilfe.className = "p4-hilfe";

            const hilfeSlot = document.createElement("div");
            hilfeSlot.className = "hilfe-slot";
            hilfe.appendChild(hilfeSlot);

            inhaltEl.appendChild(hilfe);

            // Tastatur-Bedienung 1-4 fuer Optionen.
            tastaturfokus(buttons);

            // Scaffolding beim Oeffnen wiederherstellen.
            statusScaffolding();


            // =================================================
            //  LOKAL (Closure) – Helfer fuer diese Szene
            // =================================================

            function antwortVerarbeiten(opt, btn, alleButtons, szenenIndex) {
                if (btn.classList.contains("p4-option--richtig") ||
                    btn.classList.contains("p4-option--falsch")) return;

                if (opt.correct) {
                    btn.classList.add("p4-option--richtig");
                    alleButtons.forEach(function (b) {
                        if (b !== btn && !b.classList.contains("p4-option--falsch")) {
                            b.classList.add("p4-option--inaktiv");
                        }
                        b.disabled = true;
                    });

                    feedbackAnzeigen({
                        art: "richtig",
                        titel: "RICHTIG!",
                        body: opt.feedback,
                        knopfText: "WEITER",
                        onKnopf: function () { naechsteSzene(szenenIndex); }
                    });
                } else {
                    btn.classList.add("p4-option--falsch");
                    btn.disabled = true;

                    // Jede falsche Wahl zählt einzeln in den
                    // Gesamt-Fehlerzähler ein – auch mehrfach pro
                    // Szene (Vorgabe einheitliches Hilfesystem).
                    puzzleState.sceneErrors  += 1;
                    puzzleState.failedChecks += 1;
                    puzzleState.errorCount   += 1;

                    feedbackAnzeigen({
                        art: "falsch",
                        titel: "⚠ GEFAHR!",
                        videoZitat: opt.videoCitation,
                        konsequenz: opt.konsequenz,
                        knopfText: "NOCHMAL VERSUCHEN",
                        onKnopf: function () { erneutVersuchen(alleButtons); }
                    });

                    statusScaffolding();
                }
            }


            function feedbackAnzeigen(cfg) {
                feedback.innerHTML = "";
                feedback.classList.remove(
                    "p4-feedback--versteckt",
                    "p4-feedback--richtig",
                    "p4-feedback--falsch"
                );
                feedback.classList.add(
                    "p4-feedback--" + (cfg.art === "richtig" ? "richtig" : "falsch")
                );

                const h = document.createElement("div");
                h.className = "p4-feedback-titel";
                h.textContent = cfg.titel;
                feedback.appendChild(h);

                if (cfg.art === "richtig") {
                    const p = document.createElement("p");
                    p.className = "p4-feedback-text";
                    p.textContent = cfg.body;
                    feedback.appendChild(p);
                } else {
                    const zitat = document.createElement("p");
                    zitat.className = "p4-feedback-zitat";
                    const labelEl = document.createElement("strong");
                    labelEl.textContent = "Aus dem Tutorial: ";
                    zitat.appendChild(labelEl);
                    zitat.appendChild(document.createTextNode(
                        "\u201E" + cfg.videoZitat + "\u201C"));
                    feedback.appendChild(zitat);

                    const k = document.createElement("p");
                    k.className = "p4-feedback-text";
                    const kLabel = document.createElement("strong");
                    kLabel.textContent = "Was hätte passieren können: ";
                    k.appendChild(kLabel);
                    k.appendChild(document.createTextNode(cfg.konsequenz));
                    feedback.appendChild(k);
                }

                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "p4-weiter-btn";
                btn.textContent = cfg.knopfText;
                btn.addEventListener("click", cfg.onKnopf);
                feedback.appendChild(btn);

                setTimeout(function () { btn.focus(); }, 0);
                feedback.dataset.enterBtn = "1";
            }


            function erneutVersuchen(alleButtons) {
                feedback.classList.add("p4-feedback--versteckt");
                feedback.innerHTML = "";
                alleButtons.forEach(function (b) {
                    if (!b.classList.contains("p4-option--falsch")) {
                        b.disabled = false;
                        b.classList.remove("p4-option--inaktiv");
                    }
                });
            }


            function naechsteSzene(aktuellIndex) {
                if (aktuellIndex + 1 >= SZENEN.length) {
                    erfolgsScreenZeigen();
                } else {
                    szeneRendern(aktuellIndex + 1);
                }
            }


            function statusScaffolding() {
                // Einheitliches Hilfesystem (2/3/4-Staffel) –
                // alle bisherigen Video-Button/Tipp/Telefon-Logiken
                // werden durch werkstattHilfe ersetzt.
                if (window.werkstattHilfe) {
                    window.werkstattHilfe.aktualisiere(
                        4, puzzleState.failedChecks || 0, hilfeSlot
                    );
                }
            }


            function telefonZeigen() {
                if (!telefon.classList.contains("p4-telefon--versteckt")) return;
                telefon.classList.remove("p4-telefon--versteckt");
                telefon.innerHTML = "";

                const t = document.createElement("div");
                t.className = "p4-telefon-titel";
                t.textContent = "📞 Das Telefon klingelt";
                telefon.appendChild(t);

                const txt = document.createElement("div");
                txt.className = "p4-telefon-text";
                txt.textContent =
                    "Frag deine Lehrkraft um Hilfe. Sobald ihr die Szene " +
                    "besprochen habt, kannst du den Bohrvorgang abschließen.";
                telefon.appendChild(txt);

                const b = document.createElement("button");
                b.type = "button";
                b.className = "p4-telefon-btn";
                b.textContent = "LEHRKRAFT-HILFE BESTÄTIGEN";
                b.addEventListener("click", erfolgsScreenZeigen);
                telefon.appendChild(b);
            }


            function tastaturfokus(btns) {
                // 1-4 waehlen die jeweilige Option.
                inhaltEl.addEventListener("keydown", function (ev) {
                    if (feedback.dataset.enterBtn === "1" && ev.key === "Enter") {
                        return;   // Weiter-Button fokussiert, Default greift.
                    }
                    const n = parseInt(ev.key, 10);
                    if (!isNaN(n) && n >= 1 && n <= btns.length) {
                        ev.preventDefault();
                        const b = btns[n - 1];
                        if (!b.disabled) b.click();
                    }
                });
            }
        }


        // =====================================================
        //  VIDEO-MODAL oeffnen (Tutorial-Tafel)
        // =====================================================
        function videoOeffnen() {
            if (typeof window.openVideoInfotafel === "function") {
                window.openVideoInfotafel("info-4");
            }
        }


        // =====================================================
        //  ERFOLGS-SCREEN
        // =====================================================
        function erfolgsScreenZeigen() {
            inhaltEl.innerHTML = "";

            const erfolg = document.createElement("div");
            erfolg.className = "p4-erfolg";

            const check = document.createElement("div");
            check.className = "p4-erfolg-check";
            check.textContent = "✓";
            erfolg.appendChild(check);

            const titel = document.createElement("h3");
            titel.className = "p4-erfolg-titel";
            titel.textContent = "BOHRVORGANG ERFOLGREICH!";
            erfolg.appendChild(titel);

            const text = document.createElement("p");
            text.className = "p4-erfolg-text";
            text.textContent =
                "Du hast bewiesen, dass du sicher bohren kannst. " +
                "Sicherheits-Leuchte 4 wechselt auf grün.";
            erfolg.appendChild(text);

            const weiter = document.createElement("button");
            weiter.type = "button";
            weiter.className = "p4-weiter-btn";
            weiter.textContent = "WEITER";
            weiter.addEventListener("click", abschluss);
            erfolg.appendChild(weiter);

            inhaltEl.appendChild(erfolg);
            setTimeout(function () { weiter.focus(); }, 0);

            // Draft-Felder aufraeumen, errorCount bleibt (fuer die Urkunde).
            delete puzzleState.currentScene;
            delete puzzleState.sceneErrors;
            delete puzzleState.sceneStarted;
            delete puzzleState.failedChecks;

            const autoTimer = setTimeout(abschluss, 2200);
            weiter.addEventListener("click", function () {
                clearTimeout(autoTimer);
            });

            function abschluss() {
                if (typeof window.loesePuzzle === "function") {
                    window.loesePuzzle(4);
                } else if (typeof window.markPuzzleSolved === "function") {
                    window.markPuzzleSolved(4);
                }
                if (typeof inhaltEl._schliesseModal === "function") {
                    inhaltEl._schliesseModal();
                }
            }
        }
    };

})();
