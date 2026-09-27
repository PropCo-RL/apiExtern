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

  // ==========================================
  // 1. APARTMENT-DETAILSEITEN GENERIEREN (/a/...)
  // ==========================================
  apartments.forEach(apt => {
    const rawPath = apt.Apartment || apt.apartmentPath || apt.apartment || "";
    if (!rawPath) return;

    const cleanPath = rawPath.toString().replace(/^\/+|\/+$/g, '').trim(); 
    if (!cleanPath) return;

    const dir = path.join(process.cwd(), cleanPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const title = apt.title || apt.Title || 'Monteurwohnung';
    const city = apt.city || '';
    const street = apt.street || apt.Street || '';
    const zip = apt.zip || apt.ZIP || '';
    const fullAddress = `${street}${street ? ', ' : ''}${zip} ${city}`.trim();
    const bedrooms = apt.bedrooms || apt.Schlafzimmer || 1;
    const beds = apt.beds || apt.Betten || 1;
    const price = apt.pricePerNight || apt.Preis || '49';
    const aptCode = apt.code || cleanPath.replace(/^a\//, '');

    let images = apt.images || [];
    if (!Array.isArray(images) || images.length === 0) {
      images = ['https://via.placeholder.com/600x400?text=Apartment+L8+Street'];
    }

    let galleryItemsHtml = '';
    images.slice(0, 5).forEach(imgUrl => {
      galleryItemsHtml += `<img src="${imgUrl}" class="gallery-grid-item" alt="${title}">`;
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="de" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | L8 Street</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.slate.min.css">
  <style>
    :root { --pico-border-radius: 12px; --pico-font-size: 95%; }
    body { padding-bottom: 70px; margin: 0 !important; }
    main.container { max-width: 100vw !important; padding: 0.5rem 10px 1rem 10px !important; margin: 0 auto !important; }
    .gallery-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 170px 170px; gap: 8px; border-radius: 16px; overflow: hidden; margin-bottom: 1.5rem; }
    .gallery-grid-item { width: 100%; height: 100%; object-fit: cover; }
    .gallery-grid-item:first-child { grid-row: span 2; }
    @media (max-width: 768px) {
      .gallery-grid { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; grid-template-columns: none; grid-template-rows: none; height: 250px; border-radius: 12px; }
      .gallery-grid-item { flex: 0 0 85%; scroll-snap-align: start; }
      .gallery-grid-item:first-child { grid-row: auto; }
    }
    .hidden { display: none !important; }
    .detail-grid-container { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-top: 1.5rem; }
    @media (max-width: 768px) { .detail-grid-container { grid-template-columns: 1fr; } }
    .step-indicator { display: flex; justify-content: space-between; margin-bottom: 1.5rem; position: relative; }
    .step-indicator::before { content: ''; position: absolute; top: 15px; left: 0; right: 0; height: 2px; background: var(--pico-border-color); z-index: 1; }
    .step-item { position: relative; z-index: 2; background: var(--pico-card-background-color); padding: 0 10px; display: flex; flex-direction: column; align-items: center; font-size: 0.8rem; font-weight: 600; color: var(--pico-muted-color); }
    .step-number { width: 32px; height: 32px; border-radius: 50%; background: var(--pico-border-color); color: var(--pico-color); display: flex; align-items: center; justify-content: center; margin-bottom: 4px; font-weight: bold; }
    .step-item.active .step-number { background: var(--pico-primary); color: #fff; }
    .step-item.active { color: var(--pico-color); }
    .step-item.completed .step-number { background: #15803d; color: #fff; }
    .step-buttons { display: flex; justify-content: space-between; margin-top: 1.5rem; gap: 10px; }
  </style>
</head>
<body>
  <header class="container" style="padding: 0.8rem 10px;">
    <nav>
      <ul><li><strong style="font-size: 1.75rem; cursor: pointer;" onclick="window.location.href='/'">L8 Street</strong></li></ul>
      <ul><li><a href="https://wa.me/4917684801295" target="_blank" style="text-decoration:none;">+49 176 8480 1295</a></li></ul>
    </nav>
  </header>
  <main class="container">
    <button class="secondary outline" onclick="window.location.href='/'" style="width: auto; margin-bottom: 1rem;">← Zurück zur Übersicht</button>
    <article>
      <div class="gallery-grid">${galleryItemsHtml}</div>
      <h2 style="margin-bottom: 0.2rem; margin-top: 1rem;">${title}</h2>
      <p style="color: var(--pico-muted-color); font-size: 0.95rem; margin-bottom: 1.5rem;">${fullAddress}</p>
      <div class="detail-grid-container">
        <div>
          <p><strong>Gesamte Monteurwohnung mit eigener Küche und eigenem Badezimmer.</strong></p>
          <div style="margin: 1rem 0;">
            <p style="margin-bottom: 0.2rem;"><strong>Schlafzimmer:</strong> ${bedrooms}</p>
            <p style="margin-bottom: 0.2rem;"><strong>Einzelbetten:</strong> ${beds}</p>
          </div>
          <p style="margin-bottom: 0.5rem;"><strong>Ausstattung:</strong></p>
          <ul style="padding-left: 1.2rem; margin-bottom: 1.5rem;">
            <li>2 Einzelbetten pro Schlafzimmer</li>
            <li>Voll ausgestattete Küche</li>
            <li>Eigenes Badezimmer</li>
            <li>Smart TV & WLAN inklusive</li>
            <li>Waschmaschine kostenfrei inklusive</li>
          </ul>
        </div>
        <div>
          <article style="background: var(--pico-card-background-color); border: 1px solid var(--pico-border-color); padding: 1.2rem; border-radius: 12px;">
            <h3 style="margin-bottom: 0.2rem; color: var(--pico-primary);">${price} € pro Nacht</h3>
            <p style="font-size: 0.8rem; color: var(--pico-muted-color); margin-bottom: 1rem;">gesamt für alle Personen</p>
            <hr style="margin: 1rem 0;">
            <strong>Kontakt</strong><br>
            <small>E-Mail: support@L8Street.com</small><br>
            <small>Telefon: +49 176 8480 1295</small>
          </article>
        </div>
      </div>
      <hr style="margin: 2rem 0;">
      <h3>Apartment buchen</h3>
      <div class="step-indicator">
        <div class="step-item active" id="step-tab-1"><div class="step-number">1</div><span>Reisedaten</span></div>
        <div class="step-item" id="step-tab-2"><div class="step-number">2</div><span>Kontaktdaten</span></div>
        <div class="step-item" id="step-tab-3"><div class="step-number">3</div><span>Rechnung</span></div>
      </div>
      <form id="booking-form" onsubmit="handleBookingSubmit(event)">
        <input type="hidden" id="form-apt-title" value="${title}">
        <input type="hidden" id="form-apt-code" value="${aptCode}">
        <div id="step-1">
          <div class="grid">
            <div><label>Anreise</label><input type="date" id="form-start" required></div>
            <div><label>Abreise</label><input type="date" id="form-end" required></div>
          </div>
          <div class="step-buttons"><div></div><button type="button" onclick="goToStep(2)">Weiter zu Kontaktdaten →</button></div>
        </div>
        <div id="step-2" class="hidden">
          <label>Firma</label><input type="text" id="form-company" required>
          <label>E-Mail</label><input type="email" id="form-email" required>
          <div class="step-buttons"><button type="button" onclick="goToStep(1)">← Zurück</button><button type="button" onclick="goToStep(3)">Weiter zu Rechnungsanschrift →</button></div>
        </div>
        <div id="step-3" class="hidden">
          <label>Straße</label><input type="text" id="form-street" required>
          <div class="step-buttons"><button type="button" onclick="goToStep(2)">← Zurück</button><button type="submit">Jetzt verbindlich buchen</button></div>
        </div>
      </form>
    </article>
  </main>
  <script>
    const API_URL = "${API_URL}";
    let currentStep = 1;
    function goToStep(s) {
      document.getElementById('step-1').classList.add('hidden');
      document.getElementById('step-2').classList.add('hidden');
      document.getElementById('step-3').classList.add('hidden');
      document.getElementById('step-' + s).classList.remove('hidden');
      currentStep = s;
    }
  </script>
</body>
</html>`;

    fs.writeFileSync(path.join(dir, 'index.html'), htmlContent);
  });

  // ==========================================
  // 2. STÄDTE-LANDINGPAGES GENERIEREN (/gera/, /heilbronn/, etc.)
  // ==========================================
  const citiesMap = {};
  apartments.forEach(apt => {
    const rawCity = apt.city || "";
    if (!rawCity) return;
    const cleanCityKey = rawCity.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (!citiesMap[cleanCityKey]) {
      citiesMap[cleanCityKey] = { name: rawCity, list: [] };
    }
    citiesMap[cleanCityKey].list.push(apt);
  });

  Object.keys(citiesMap).forEach(cityKey => {
    const cityData = citiesMap[cityKey];
    const cityDir = path.join(process.cwd(), cityKey);

    if (!fs.existsSync(cityDir)) {
      fs.mkdirSync(cityDir, { recursive: true });
    }

    let cardsHtml = '';
    cityData.list.forEach(apt => {
      const title = apt.title || apt.Title || 'Monteurwohnung';
      const street = apt.street || apt.Street || '';
      const zip = apt.zip || apt.ZIP || '';
      const bedrooms = apt.bedrooms || apt.Schlafzimmer || 1;
      const beds = apt.beds || apt.Betten || 1;
      const price = apt.pricePerNight || apt.Preis || '49';
      const rawPath = apt.Apartment || apt.apartmentPath || '';
      const cleanPath = rawPath.toString().replace(/^\/+|\/+$/g, '').trim();

      let firstImg = 'https://via.placeholder.com/600x400';
      if (Array.isArray(apt.images) && apt.images.length > 0) firstImg = apt.images[0];

      cardsHtml += `
        <article class="apt-card" style="padding:0; overflow:hidden; display:flex; flex-direction:column; border:1px solid var(--pico-border-color); background:#fff;">
          <img src="${firstImg}" style="width:100%; height:180px; object-fit:cover;">
          <div style="padding:1rem; display:flex; flex-direction:column; flex-grow:1;">
            <h4 style="margin-bottom:0.2rem;">${title}</h4>
            <p style="font-size:0.8rem; color:var(--pico-muted-color); margin-bottom:0.5rem;">${street}, ${zip} ${cityData.name}</p>
            <p style="font-size:0.85rem; margin:0.5rem 0;">${beds} Betten | ${bedrooms} Zimmer</p>
            <p style="font-weight:bold; margin-top:auto; margin-bottom:0.8rem;">ab ${price} € <small>/ Nacht</small></p>
            <a href="/${cleanPath}/" role="button" style="text-align:center;">Details & Buchen</a>
          </div>
        </article>
      `;
    });

    const cityHtmlContent = `<!DOCTYPE html>
<html lang="de" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monteurunterkünfte in ${cityData.name} | L8 Street</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.slate.min.css">
  <style>
    body { padding-bottom: 70px; margin: 0 !important; }
    main.container { max-width: 100vw !important; padding: 0.5rem 10px 1rem 10px !important; margin: 0 auto !important; }
    .catalog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
  </style>
</head>
<body>
  <header class="container" style="padding: 0.8rem 10px;">
    <nav>
      <ul><li><strong style="font-size: 1.75rem; cursor: pointer;" onclick="window.location.href='/'">L8 Street</strong></li></ul>
      <ul><li><a href="https://wa.me/4917684801295" target="_blank" style="text-decoration:none;">+49 176 8480 1295</a></li></ul>
    </nav>
  </header>
  <main class="container">
    <h3 style="margin-bottom: 1rem;">Verfügbare Monteurwohnungen in ${cityData.name}</h3>
    <div class="catalog-grid">${cardsHtml}</div>
  </main>
</body>
</html>`;

    fs.writeFileSync(path.join(cityDir, 'index.html'), cityHtmlContent);
  });

  console.log("Detailseiten und Stadtpages erfolgreich generiert!");
}

buildSite();
