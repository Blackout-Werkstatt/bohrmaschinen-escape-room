===============================================
  Werkstatt-Blackout: Bohrmaschinen-Fuehrerschein
  Digitaler Escape-Room
===============================================

So startest du das Spiel:

1. Doppelklick auf "start.bat"

2. Beim ersten Aufruf zeigt Windows eventuell eine
   Sicherheitswarnung an:
   ("Computer durch Windows geschuetzt -
    Unbekannter Herausgeber")

   In diesem Fall:
   - Auf "Weitere Informationen" klicken
   - Dann auf "Trotzdem ausfuehren" klicken

3. Ein schwarzes Konsolenfenster oeffnet sich.
   Bitte geoeffnet lassen, solange du spielst.

4. Der Standardbrowser oeffnet sich automatisch
   mit dem Spiel.

5. Wenn du fertig bist:
   - Browser-Tab schliessen
   - Schwarzes Konsolenfenster ebenfalls schliessen


===============================================
  Falls etwas nicht funktioniert:
===============================================

Das Spiel ist auch online spielbar unter:

https://blackout-werkstatt.github.io/bohrmaschinen-escape-room/

Einfach den Link im Browser oeffnen, dann laeuft
es ohne lokale Installation.


===============================================
  Hintergrund (fuer Interessierte):
===============================================

Das Spiel ist eine eigenentwickelte HTML/CSS/JS-Anwendung
auf Basis der Open-Source-Bibliothek Pannellum fuer die
360-Grad-Panorama-Darstellung. Moderne Browser blockieren
aus Sicherheitsgruenden den direkten Zugriff auf lokale
Dateien per Doppelklick (Cross-Origin-Policy). Daher
startet "start.bat" einen kleinen lokalen Webserver mit
PowerShell-Bordmitteln, damit das Spiel ohne externe
Installationen lauffaehig ist.
