# Werkstatt-Blackout - Lokaler HTTP-Server
# Wird von start.bat aufgerufen.
# Startet einen einfachen Webserver, der die Spieldateien aus diesem Ordner ausliefert,
# und oeffnet das Spiel im Standardbrowser.

$port = 8000
$rootPath = $PSScriptRoot

# MIME-Type-Mapping: damit der Browser weiss, wie er die Dateien interpretieren soll
$mimeTypes = @{
    '.html'  = 'text/html; charset=utf-8'
    '.htm'   = 'text/html; charset=utf-8'
    '.css'   = 'text/css; charset=utf-8'
    '.js'    = 'application/javascript; charset=utf-8'
    '.json'  = 'application/json; charset=utf-8'
    '.png'   = 'image/png'
    '.jpg'   = 'image/jpeg'
    '.jpeg'  = 'image/jpeg'
    '.gif'   = 'image/gif'
    '.svg'   = 'image/svg+xml'
    '.ico'   = 'image/x-icon'
    '.webp'  = 'image/webp'
    '.mp3'   = 'audio/mpeg'
    '.wav'   = 'audio/wav'
    '.ogg'   = 'audio/ogg'
    '.mp4'   = 'video/mp4'
    '.webm'  = 'video/webm'
    '.woff'  = 'font/woff'
    '.woff2' = 'font/woff2'
    '.ttf'   = 'font/ttf'
    '.txt'   = 'text/plain; charset=utf-8'
    '.md'    = 'text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()

    Write-Host ""
    Write-Host "=========================================="
    Write-Host "  Werkstatt-Blackout - Server laeuft"
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "  Spiel-URL: http://localhost:$port"
    Write-Host ""
    Write-Host "  Der Browser sollte sich gleich oeffnen."
    Write-Host ""
    Write-Host "  Dieses Fenster bitte geoeffnet lassen,"
    Write-Host "  solange du spielst."
    Write-Host ""
    Write-Host "  Zum Beenden einfach das Fenster"
    Write-Host "  schliessen."
    Write-Host ""
    Write-Host "=========================================="
    Write-Host ""

    # Browser oeffnen
    Start-Process "http://localhost:$port"

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        try {
            # URL-Pfad dekodieren (fuer Sonderzeichen)
            $urlPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath)

            # Standard-Datei wenn Wurzel angefordert wird
            if ($urlPath -eq '/' -or $urlPath -eq '') {
                $urlPath = '/index.html'
            }

            # Pfad zur Datei zusammensetzen
            $relativePath = $urlPath.TrimStart('/').Replace('/', '\')
            $filePath = Join-Path $rootPath $relativePath

            # Sicherheitspruefung: Pfad muss innerhalb des Projektordners liegen
            $resolvedPath = [System.IO.Path]::GetFullPath($filePath)
            $resolvedRoot = [System.IO.Path]::GetFullPath($rootPath)

            if (-not $resolvedPath.StartsWith($resolvedRoot)) {
                $response.StatusCode = 403
            }
            elseif (Test-Path $filePath -PathType Leaf) {
                $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = if ($mimeTypes.ContainsKey($extension)) {
                    $mimeTypes[$extension]
                } else {
                    'application/octet-stream'
                }

                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            else {
                $response.StatusCode = 404
            }
        }
        catch {
            try { $response.StatusCode = 500 } catch {}
        }
        finally {
            try { $response.OutputStream.Close() } catch {}
        }
    }
}
catch {
    Write-Host ""
    Write-Host "FEHLER beim Server-Start:"
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "Moegliche Ursachen:"
    Write-Host "  - Port $port ist bereits belegt (anderer Server laeuft)"
    Write-Host "  - PowerShell wird durch Sicherheits-Richtlinie blockiert"
    Write-Host ""
    Write-Host "Druecke Enter zum Beenden..."
    Read-Host
}
finally {
    if ($listener -and $listener.IsListening) {
        $listener.Stop()
    }
}
