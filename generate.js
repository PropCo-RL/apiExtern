const fs = require('fs');
const path = require('path');
const { SHARED_CSS } = require('./css');
const { renderApartmentHtml } = require('./apartment_template');

const API_URL = "https://script.google.com/macros/s/AKfycbyMD7mGXRmW9IQFIK9gRLUBRWwprCudXEhfWEDDGk9iyvNe0yyK6w5gIuhLXZOFue8Z3w/exec";

// ==========================================
// RESSOURCEN DIREKT EINLESEN
// ==========================================
let HEADER_HTML = "", FOOTER_HTML = "";
try {
  const hfContent = fs.readFileSync(path.join(__dirname, 'header_footer.html'), 'utf8');
  HEADER_HTML = hfContent.split('<!-- HEADER -->')[1]?.split('<!-- /HEADER -->')[0] || '';
  FOOTER_HTML = hfContent.split('<!-- FOOTER -->')[1]?.split('<!-- /FOOTER -->')[0] || '';
} catch (e) { console.warn("header_footer.html nicht gefunden."); }

let IMPRESSUM_BODY = "", AGB_BODY = "", DATENSCHUTZ_BODY = "";
try {
  const legalContent = fs.readFileSync(path.join(__dirname, 'legal.html'), 'utf8');
  IMPRESSUM_BODY = legalContent.split('<!-- IMPRESSUM -->')[1]?.split('<!-- /IMPRESSUM -->')[0] || legalContent;
  AGB_BODY = legalContent.split('<!-- AGB -->')[1]?.split('<!-- /AGB -->')[0] || legalContent;
  DATENSCHUTZ_BODY = legalContent.split('<!-- DATENSCHUTZ -->')[1]?.split('<!-- /DATENSCHUTZ -->')[0] || legalContent;
} catch (e) { console.warn("legal.html nicht gefunden."); }

// ==========================================
// INTERNE HILFSFUNKTIONEN
// ==========================================
function optimizeImageUrl(url, width = 600) {
  if (!url) return 'https://via.placeholder.com/600x400?text=Bild+nicht+verf%C3%BCgbar';
  if (url.includes('googleusercontent.com') && !url.includes('=w')) {
    return `${url}=w${width}-h400-c`;
  }
  return url;
}

function parseImages(rawImages) {
  let images = rawImages;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } 
    catch (e) { images = images.split(',').map(s => s.trim()); }
  }

  if (Array.isArray(images)) {
    images = images
      .map(img => (typeof img === 'string' ? img.trim() : ''))
      .filter(img => img.length > 0 && /^https?:\/\//i.test(img));
  } else {
    images = [];
  }

  if (images.length === 0) {
    images = ['https://via.placeholder.com/600x400?text=Apartment+L8+Street'];
  }
  return images;
}

async function buildSite() {
  console.log("Hole Daten aus Google Sheet...");
  const response = await fetch(`${API_URL}?action=getAllApartments`);
  const apartments = await response.json();

  if (!Array.isArray(apartments)) {
    console.error("Ungültige Daten empfangen:", apartments);
    return;
  }

  console.log(`${apartments.length} Apartments gefunden.`);

  console.log("Hole Verfügbarkeiten...");
  const allIds = apartments.map(a => a.id).filter(Boolean);
  let availMap = {};
  try {
    const availRes = await fetch(`${API_URL}?action=getAvailability&ids=${allIds.join(',')}`);
    availMap = await availRes.json();
  } catch (err) {
    console.warn("Konnte Verfügbarkeiten nicht abrufen:", err);
  }

  // 1. APARTMENT-DETAILSEITEN GENERIEREN (/a/...)
  apartments.forEach(apt => {
    const rawPath = apt.Apartment || apt.apartmentPath || apt.apartment || "";
    if (!rawPath) return;

    const cleanPath = rawPath.toString().replace(/^\/+|\/+$/g, '').trim(); 
    if (!cleanPath) return;

    const dir = path.join(process.cwd(), cleanPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const title = apt.title || apt.Title || 'Monteurwohnung';
    const city = apt.city || '';
    const street = apt.street || apt.Street || '';
    const zip = apt.zip || apt.ZIP || '';
    const fullAddress = `${street}${street ? ', ' : ''}${zip} ${city}`.trim();
    const bedrooms = apt.bedrooms || apt.Schlafzimmer || 4;
    const beds = apt.beds || apt.Betten || 8;
    const price = apt.pricePerNight || apt.Preis || '49';
    const description = apt.description || '';
    const aptCode = apt.code || cleanPath.replace(/^a\//, '');

    const images = parseImages(apt.images);
    const placeholderImg = 'https://via.placeholder.com/600x400?text=Bild+nicht+verf%C3%BCgbar';

    let galleryItemsHtml = '';
    images.slice(0, 5).forEach((imgUrl, index) => {
      const optUrl = optimizeImageUrl(imgUrl, 800);
      const loadingAttr = index === 0 ? 'fetchpriority="high"' : 'loading="lazy"';
      galleryItemsHtml += `<img src="${optUrl}" class="gallery-grid-item" onclick="openLightbox(${index})" alt="${title}" ${loadingAttr} onerror="this.onerror=null;this.src='${placeholderImg}';">`;
    });

    const htmlContent = renderApartmentHtml({
      title, fullAddress, bedrooms, beds, price, description, aptCode,
      galleryItemsHtml, images, SHARED_CSS, HEADER_HTML, FOOTER_HTML, API_URL
    });

    fs.writeFileSync(path.join(dir, 'index.html'), htmlContent);
  });

  // 2. STÄDTE-LANDINGPAGES GENERIEREN (/gera/, /heilbronn/, etc.)
  const citiesMap = {};
  apartments.forEach(apt => {
    const rawCity = apt.city || "";
    if (!rawCity) return;
    const cleanCityKey = rawCity.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (!citiesMap[cleanCityKey]) citiesMap[cleanCityKey] = { name: rawCity, list: [] };
    citiesMap[cleanCityKey].list.push(apt);
  });

  Object.keys(citiesMap).forEach(cityKey => {
    const cityData = citiesMap[cityKey];
    const cityDir = path.join(process.cwd(), cityKey);
    if (!fs.existsSync(cityDir)) fs.mkdirSync(cityDir, { recursive: true });

    cityData.list.sort((a, b) => {
      const infoA = availMap[a.id] || {};
      const infoB = availMap[b.id] || {};
      const scoreA = infoA.isDirectlyAvailable ? 3 : (infoA.availableFromDate ? 2 : 1);
      const scoreB = infoB.isDirectlyAvailable ? 3 : (infoB.availableFromDate ? 2 : 1);
      return scoreB - scoreA;
    });

    let cardsHtml = '';
    cityData.list.forEach((apt, index) => {
      const title = apt.title || apt.Title || 'Monteurwohnung';
      const street = apt.street || apt.Street || '';
      const zip = apt.zip || apt.ZIP || '';
      const bedrooms = apt.bedrooms || apt.Schlafzimmer || 1;
      const beds = apt.beds || apt.Betten || 1;
      const price = apt.pricePerNight || apt.Preis || '49';
      const rawPath = apt.Apartment || apt.apartmentPath || apt.apartment || '';
      const cleanPath = rawPath.toString().replace(/^\/+|\/+$/g, '').trim();
      const aptId = apt.id || '';

      const images = parseImages(apt.images);
      const firstImg = optimizeImageUrl(images[0], 600);
      const loadingAttr = index === 0 ? 'fetchpriority="high"' : 'loading="lazy"';

      let badgeHtml = '';
      const info = availMap[aptId] || {};
      if (info.isDirectlyAvailable) {
        badgeHtml = `<span class="badge badge-success">Sofort verfügbar</span>`;
      } else if (info.availableFromDate) {
        badgeHtml = `<span class="badge badge-warning">Frei ab: ${info.availableFromDate}</span>`;
      } else {
        badgeHtml = `<span class="badge badge-danger">Dauerhaft belegt</span>`;
      }

      cardsHtml += `
        <article class="apt-card">
          <img src="${firstImg}" alt="${title}" ${loadingAttr} onerror="this.onerror=null;this.src='https://via.placeholder.com/600x400?text=Bild+nicht+verf%C3%BCgbar';">
          <div class="apt-card-content">
            <div>
              ${badgeHtml}
              <h4 style="margin-bottom:0.2rem;">${title}</h4>
              <p style="font-size:0.8rem; color:var(--pico-muted-color); margin-bottom:0.5rem;">${street}, ${zip} ${cityData.name}</p>
            </div>
            <p style="font-size:0.85rem; margin:0.5rem 0;">${beds} Betten | ${bedrooms} Zimmer</p>
            <p style="font-weight:bold; margin-top:auto; margin-bottom:0.8rem;">ab ${price} € <small>/ Nacht</small></p>
            <a href="/${cleanPath}/" role="button" style="padding:0.5rem; font-size:0.9rem; text-align:center;">Details & Buchen</a>
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
  <meta name="description" content="Monteurunterkünfte & Monteurwohnungen in ${cityData.name} mieten. Eigene Küche, Bad, WLAN & Waschmaschine inklusive. Jetzt Verfügbarkeit prüfen & buchen.">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.slate.min.css">
  <style>${SHARED_CSS}</style>
</head>
<body>
  ${HEADER_HTML}
  <main class="container">
    <div style="margin-bottom: 2rem;">
      <h1 style="margin-bottom: 0.5rem; font-size: 2rem; font-weight: 700;">Monteurwohnungen in ${cityData.name}</h1>
      <p style="color: var(--pico-muted-color); font-size: 1.05rem; margin-bottom: 0.8rem;">
        Voll ausgestattete Unterkünfte für Handwerker & Teams direkt in ${cityData.name} und Umgebung.
      </p>
      <div class="trust-badges">
        <div class="trust-item"><span>✓</span> <strong>Eigene Küche & Bad</strong> (Keine geteilten Bereiche)</div>
        <div class="trust-item"><span>✓</span> <strong>Kostenloses WLAN & Waschmaschine</strong></div>
        <div class="trust-item"><span>✓</span> <strong>Rechnung mit ausgewiesener MwSt.</strong></div>
      </div>
    </div>
    <div class="catalog-grid">${cardsHtml}</div>
  </main>
  ${FOOTER_HTML}
</body>
</html>`;

    fs.writeFileSync(path.join(cityDir, 'index.html'), cityHtmlContent);
  });

  // 3. HAUPT-STARTSEITE GENERIEREN (/index.html)
  let cityCardsHtml = '';
  Object.keys(citiesMap).sort().forEach(key => {
    const c = citiesMap[key];
    cityCardsHtml += `<a href="/${key}/" class="city-card">${c.name}</a>\n`;
  });

  const homepageContent = `<!DOCTYPE html>
<html lang="de" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monteurunterkünfte & Monteurwohnungen | L8 Street</title>
  <meta name="description" content="Mieten Sie voll ausgestattete Monteurwohnungen & Monteurunterkünfte in über 20 Städten. Inklusive Küche, Bad, WLAN & Parkmöglichkeiten.">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.slate.min.css">
  <style>${SHARED_CSS}</style>
</head>
<body>
  ${HEADER_HTML}
  <main class="container">
    <div style="text-align: center; margin-top: 1rem; margin-bottom: 2rem;">
      <h1 style="font-size: 2.2rem; font-weight: 700; margin-bottom: 0.5rem;">Monteurunterkünfte & Monteurwohnungen</h1>
      <p style="color: var(--pico-muted-color); font-size: 1.15rem;">Wählen Sie Ihren Standort aus, um alle verfügbaren Wohnungen zu sehen:</p>
    </div>
    <div class="cities-grid">
      ${cityCardsHtml}
    </div>
  </main>
  ${FOOTER_HTML}
</body>
</html>`;

  fs.writeFileSync(path.join(process.cwd(), 'index.html'), homepageContent);

  // 4. STATISCHE LEGAL-PAGES GENERIEREN (/agb/, /impressum/, /datenschutz/)
  const generateLegalPage = (folderName, titleStr, bodyHtml) => {
    const legalDir = path.join(process.cwd(), folderName);
    if (!fs.existsSync(legalDir)) fs.mkdirSync(legalDir, { recursive: true });

    const fullHtml = `<!DOCTYPE html>
<html lang="de" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleStr} | L8 Street</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.slate.min.css">
  <style>
    ${SHARED_CSS}
    .legal-content { line-height: 1.6; }
    .legal-content h1 { font-size: 1.8rem; margin-bottom: 1rem; border-bottom: 2px solid var(--pico-border-color); padding-bottom: 0.5rem; }
    .legal-content h2 { font-size: 1.3rem; margin-top: 1.8rem; margin-bottom: 0.5rem; }
    .legal-content p, .legal-content li { font-size: 0.95rem; color: var(--pico-color); }
    .legal-content ol, .legal-content ul { padding-left: 1.2rem; }
  </style>
</head>
<body>
  ${HEADER_HTML}
  <main class="container">
    <button class="secondary outline" onclick="window.location.href='/'" style="width: auto; margin-bottom: 1.5rem;">← Zurück zur Startseite</button>
    <article class="legal-content">
      ${bodyHtml}
    </article>
  </main>
  ${FOOTER_HTML}
</body>
</html>`;
    fs.writeFileSync(path.join(legalDir, 'index.html'), fullHtml);
  };

  generateLegalPage('impressum', 'Impressum', IMPRESSUM_BODY);
  generateLegalPage('agb', 'AGB - Allgemeine Geschäftsbedingungen', AGB_BODY);
  generateLegalPage('datenschutz', 'Datenschutzerklärung', DATENSCHUTZ_BODY);

  console.log("Startseite, Detailseiten, Stadtpages und Legal-Pages erfolgreich generiert!");
}

buildSite();
