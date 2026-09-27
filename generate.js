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
    // Falls Spalte G gefüllt ist (z.B. "/a/gera1" oder "/a/ax")
    const rawPath = apt.apartmentPath || apt.Apartment || "";
    if (!rawPath) return;

    // Entfernt führende und nachfolgende Slashes, damit z.B. "a/gera1" entsteht
    const cleanPath = rawPath.replace(/^\/+|\/+$/g, ''); 
    const dir = path.join(process.cwd(), cleanPath);

    // Erstellt die Ordnerstruktur (z. B. Ordner "a" -> Unterordner "gera1")
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const firstImg = (apt.images && apt.images.length > 0) ? apt.images[0] : 'https://via.placeholder.com/600x400';

    const htmlContent = `<!DOCTYPE html>
<html lang="de" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${apt.title || 'Monteurwohnung'} | L8 Street</title>
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
    <h2>${apt.title || ''}</h2>
    <p style="color: var(--pico-muted-color);">${apt.address || apt.city || ''}</p>
    <div class="gallery">
      <img src="${firstImg}" alt="${apt.title || 'Apartment'}">
    </div>
    <div class="grid" style="margin: 1.5rem 0; background: #f8fafc; padding: 1rem; border-radius: 8px;">
      <div><strong>Betten:</strong> ${apt.beds || 2} Betten</div>
      <div><strong>Schlafzimmer:</strong> ${apt.rooms || 1} Zimmer</div>
      <div><strong>Preis:</strong> ab ${apt.price || 49} € / Nacht</div>
    </div>
    <a href="/?apt=${apt.id}" role="button" class="contrast" style="width: 100%; text-align: center; font-size: 1.1rem; padding: 0.8rem;">
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
