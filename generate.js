const fs = require('fs');
const path = require('path');

const API_URL = "https://script.google.com/macros/s/AKfycbyMD7mGXRmW9IQFIK9gRLUBRWwprCudXEhfWEDDGk9iyvNe0yyK6w5gIuhLXZOFue8Z3w/exec";

async function buildSite() {
  console.log("Hole Daten aus Google Sheet...");
  const response = await fetch(`${API_URL}?action=getAllApartments`);
  const apartments = await response.json();

  if (!Array.isArray(apartments)) {
    console.error("Ungültige Daten empfangen:", apartments);
    return;
  }

  console.log(`${apartments.length} Apartments gefunden.`);

  apartments.forEach(apt => {
    // Liest den Pfad direkt aus Spalte G (Apartment)
    const rawPath = apt.Apartment || "";
    if (!rawPath) return;

    // Entfernt führende/nachfolgende Slashes (z. B. "/a/gera1" -> "a/gera1")
    const cleanPath = rawPath.toString().replace(/^\/+|\/+$/g, '').trim();
    if (!cleanPath) return;

    const dir = path.join(process.cwd(), cleanPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Liest das Bild aus Spalte V (Bilder Link in Google Drive)
    const firstImg = apt['Bilder Link in Google Drive'] || 'https://via.placeholder.com/600x400';

    const htmlContent = `<!DOCTYPE html>
<html lang="de" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${apt.Title || 'Monteurwohnung'} | L8 Street</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.slate.min.css">
  <style>
    body { padding-bottom: 70px; margin: 0 !important; }
    main.container { max-width: 800px !important; padding: 1rem 15px !important; margin: 0 auto !important; }
    .gallery img { width: 100%; max-height: 400px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <header class="container" style="padding: 0.8rem 15px;">
    <nav>
      <ul><li><a href="javascript:history.back()" style="text-decoration:none;">← Zurück</a></li></ul>
      <ul><li><strong style="font-size: 1.4rem;">L8 Street</strong></li></ul>
    </nav>
  </header>
  <main class="container">
    <h2>${apt.Title || ''}</h2>
    <p style="color: var(--pico-muted-color);">${apt.Street || ''}, ${apt.ZIP || ''} ${apt.city || ''}</p>
    <div class="gallery">
      <img src="${firstImg}" alt="${apt.Title || 'Apartment'}">
    </div>
    <div class="grid" style="margin: 1.5rem 0; background: #f8fafc; padding: 1rem; border-radius: 8px;">
      <div><strong>Betten:</strong> ${apt.Betten || 2} Betten</div>
      <div><strong>Schlafzimmer:</strong> ${apt.Schlafzimmer || 1} Zimmer</div>
      <div><strong>Preis:</strong> ab ${apt.Preis || 49} € / Nacht</div>
    </div>
    <a href="/?apt=${apt.ID || ''}" role="button" class="contrast" style="width: 100%; text-align: center; font-size: 1.1rem; padding: 0.8rem;">
      Jetzt Verfügbarkeit prüfen & Buchen
    </a>
  </main>
</body>
</html>`;

    fs.writeFileSync(path.join(dir, 'index.html'), htmlContent);
  });

  console.log("Detailseiten erfolgreich generiert!");
}

buildSite();
