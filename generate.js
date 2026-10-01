const fs = require('fs');
const path = require('path');
const { SHARED_CSS } = require('./css');
const { renderApartmentHtml } = require('./apartment_template');

const API_URL = "https://script.google.com/macros/s/AKfycbyMD7mGXRmW9IQFIK9gRLUBRWwprCudXEhfWEDDGk9iyvNe0yyK6w5gIuhLXZOFue8Z3w/exec";
const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

const CITY_COORDS = {
  'pforzheim': [48.8911, 8.7025],
  'karlsruhe': [49.0069, 8.4037],
  'stuttgart': [48.7758, 9.1829],
  'mannheim': [49.4875, 8.4660],
  'heilbronn': [49.1427, 9.2109],
  'gera': [50.8811, 12.0833],
  'goppingen': [48.7042, 9.6521],
  'kaiserslautern': [49.4401, 7.7491],
  'calw': [48.7153, 8.7410],
  'besigheim': [48.9984, 9.1415],
  'badwildbad': [48.7503, 8.5511],
  'renningen': [48.7656, 8.9348],
  'reutlingen': [48.4914, 9.2043],
  'hosbach': [50.0033, 9.2056],
  'muhlacker': [48.9482, 8.8410],
  'monsheim': [48.8631, 8.8639],
  'worms': [49.6353, 8.3598],
  'ketsch': [49.3658, 8.5306],
  'ladenburg': [49.4722, 8.6083],
  'heimsheim': [48.8839, 8.8617],
  'vaihingenanderenz': [48.9328, 8.9567]
};

let HEADER_HTML = "", FOOTER_HTML = "", FAVICON_HTML = "";
try {
  const hfContent = fs.readFileSync(path.join(__dirname, 'header_footer.html'), 'utf8');
  FAVICON_HTML = hfContent.split('<!-- FAVICON -->')[1]?.split('<!-- /FAVICON -->')[0]?.trim() || '';
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

// === NEU: Einzelne Sektions-Dateien laden ===
let FEATURE_GRID_HTML = "", REVIEWS_SECTION_HTML = "", MAP_SECTION_HTML = "";

try {
  FEATURE_GRID_HTML = fs.readFileSync(path.join(__dirname, 'home_s_ausstattung_mitSpezialCss.html'), 'utf8');
} catch (e) { console.warn("home_s_ausstattung_mitSpezialCss.html nicht gefunden."); }

try {
  REVIEWS_SECTION_HTML = fs.readFileSync(path.join(__dirname, 'home_s_bewertungen_mitSpezialCss.html'), 'utf8');
} catch (e) { console.warn("home_s_bewertungen_mitSpezialCss.html nicht gefunden."); }

try {
  MAP_SECTION_HTML = fs.readFileSync(path.join(__dirname, 'home_s_karte_mitSpezialCss.html'), 'utf8');
} catch (e) { console.warn("home_s_karte_mitSpezialCss.html nicht gefunden."); }

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

function parseApartmentRegions(apt) {
  const rawW = apt.regions || apt.city || "";
  if (!rawW) return { mainRegion: "", regionList: [] };

  let mainRegion = "";
  const bracketMatch = rawW.match(/\(([^)]+)\)/);
  if (bracketMatch) {
    mainRegion = bracketMatch[1].trim();
  }

  const cleanStr = rawW.replace(/[()]/g, '');
  const parts = cleanStr.split(',').map(s => s.trim()).filter(Boolean);

  if (!mainRegion && parts.length > 0) {
    mainRegion = parts[0];
  }

  return { mainRegion, regionList: parts };
}

function parseGermanDateStr(dateStr) {
  if (!dateStr) return 9999999999999;
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
  }
  return 9999999999999;
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
  const allInternalTitles = apartments.map(a => a.internalTitle).filter(Boolean);
  let availMap = {};
  try {
    const param = encodeURIComponent(allInternalTitles.join(','));
    const availRes = await fetch(`${API_URL}?action=getAvailability&ids=${param}`);
    availMap = await availRes.json();
  } catch (err) {
    console.warn("Konnte Verfügbarkeiten nicht abrufen:", err);
  }

  // 1. APARTMENT-DETAILSEITEN GENERIEREN (/a/...) (Favicon-Stelle 1)
  apartments.forEach(apt => {
    const rawPath = apt.Apartment || apt.apartmentPath || apt.apartment || "";
    if (!rawPath) return;

    const cleanPath = rawPath.toString().replace(/^\/+|\/+$/g, '').trim(); 
    if (!cleanPath) return;

    const dir = path.join(process.cwd(), cleanPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const title = apt.title || apt.Title || 'Monteurwohnung';
    const city = apt.city || '';
    
    const fullAddress = apt.isAnonymous 
      ? `${city} <br><small style="color:var(--pico-muted-color);">🔒 Genaue Adresse erhalten Sie automatisch nach der Buchung.</small>`
      : apt.displayAddress;

    // Fallback auf 4 Schlafzimmer und 8 Betten
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
      galleryItemsHtml, images, SHARED_CSS, HEADER_HTML, FOOTER_HTML, API_URL, FAVICON_HTML
    });

    fs.writeFileSync(path.join(dir, 'index.html'), htmlContent);
  });

  // 2. REGIONEN-LANDINGPAGES GENERIEREN (Favicon-Stelle 2)
  const regionsMap = {};
  const clustersMap = {};
  const mapMarkers = [];

  apartments.forEach(apt => {
    const { mainRegion, regionList } = parseApartmentRegions(apt);
    if (regionList.length === 0) return;

    const cleanMainKey = mainRegion ? mainRegion.toLowerCase().trim().replace(/[^a-z0-9]/g, '') : '';

    if (cleanMainKey && !clustersMap[cleanMainKey]) {
      clustersMap[cleanMainKey] = {
        mainName: mainRegion,
        subRegions: new Map()
      };
    }

    regionList.forEach((regName, idx) => {
      const cleanKey = regName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (!cleanKey) return;

      if (!regionsMap[cleanKey]) {
        regionsMap[cleanKey] = { name: regName, list: [] };
      }

      regionsMap[cleanKey].list.push({
        apt: apt,
        distanceIndex: idx
      });

      if (cleanMainKey && cleanKey !== cleanMainKey) {
        clustersMap[cleanMainKey].subRegions.set(cleanKey, regName);
      }
    });
  });

  Object.keys(regionsMap).forEach(regionKey => {
    const regionData = regionsMap[regionKey];
    const regionDir = path.join(process.cwd(), regionKey);
    if (!fs.existsSync(regionDir)) fs.mkdirSync(regionDir, { recursive: true });

    if (CITY_COORDS[regionKey]) {
      mapMarkers.push({
        name: regionData.name,
        key: regionKey,
        coords: CITY_COORDS[regionKey]
      });
    }

    regionData.list.sort((itemA, itemB) => {
      const aptA = itemA.apt;
      const aptB = itemB.apt;
      const infoA = availMap[aptA.internalTitle] || {};
      const infoB = availMap[aptB.internalTitle] || {};

      const scoreA = infoA.isDirectlyAvailable ? 3 : (infoA.availableFromDate ? 2 : 1);
      const scoreB = infoB.isDirectlyAvailable ? 3 : (infoB.availableFromDate ? 2 : 1);

      if (scoreB !== scoreA) return scoreB - scoreA;

      if (scoreA === 2 && scoreB === 2) {
        const timeA = parseGermanDateStr(infoA.availableFromDate);
        const timeB = parseGermanDateStr(infoB.availableFromDate);
        if (timeA !== timeB) return timeA - timeB;
      }

      if (itemA.distanceIndex !== itemB.distanceIndex) return itemA.distanceIndex - itemB.distanceIndex;
      return (aptA.ranking || 999) - (aptB.ranking || 999);
    });

    let cardsHtml = '';
    regionData.list.forEach((item, index) => {
      const apt = item.apt;
      const title = apt.title || apt.Title || 'Monteurwohnung';
      
      const bedrooms = apt.bedrooms || apt.Schlafzimmer || 1;
      const beds = apt.beds || apt.Betten || 1;
      const price = apt.pricePerNight || apt.Preis || '49';
      const rawPath = apt.Apartment || apt.apartmentPath || apt.apartment || '';
      const cleanPath = rawPath.toString().replace(/^\/+|\/+$/g, '').trim();

      const addressDisplay = apt.isAnonymous 
        ? `${apt.city || regionData.name} <br><small style="color:var(--pico-muted-color);">🔒 Genaue Adresse nach Buchung</small>`
        : apt.displayAddress;

      const images = parseImages(apt.images);
      const firstImg = optimizeImageUrl(images[0], 600);
      const loadingAttr = index === 0 ? 'fetchpriority="high"' : 'loading="lazy"';

      let badgeHtml = '';
      const info = availMap[apt.internalTitle] || {};
      
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
              <p style="font-size:0.8rem; color:var(--pico-muted-color); margin-bottom:0.5rem;">${addressDisplay}</p>
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
  <title>Monteurwohnungen in ${regionData.name} | L8 Street</title>
  ${FAVICON_HTML}
  <meta name="description" content="Monteurunterkünfte & Monteurwohnungen in ${regionData.name} mieten. Eigene Küche, Bad, WLAN & Waschmaschine inklusive. Jetzt Verfügbarkeit prüfen & buchen.">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.slate.min.css">
  <style>${SHARED_CSS}</style>
</head>
<body>
  ${HEADER_HTML}
  <main class="container">
    <div style="margin-bottom: 2rem;">
      <h1 style="margin-bottom: 0.5rem; font-size: 2rem; font-weight: 700;">Monteurwohnungen in ${regionData.name}</h1>
      <p style="color: var(--pico-muted-color); font-size: 1.05rem; margin-bottom: 0.8rem;">
        Voll ausgestattete Unterkünfte für Handwerker & Teams direkt in ${regionData.name} und Umgebung.
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

    fs.writeFileSync(path.join(regionDir, 'index.html'), cityHtmlContent);
  });

  // 3. HAUPT-STARTSEITE GENERIEREN (/index.html) (Favicon-Stelle 3)
  let homepageClustersHtml = '';
  Object.keys(clustersMap).sort().forEach(mainKey => {
    const cluster = clustersMap[mainKey];
    
    let subBtnsHtml = '';
    cluster.subRegions.forEach((subName, subKey) => {
      if (subKey !== mainKey) {
        subBtnsHtml += `<a href="/${subKey}/" class="sub-region-btn">📍 ${subName}</a>\n`;
      }
    });

    homepageClustersHtml += `
      <div class="cluster-card" style="border: 1px solid var(--pico-border-color); border-radius: 12px; padding: 1.2rem; margin-bottom: 1.2rem; background: var(--pico-card-background-color);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.6rem; flex-wrap:wrap; gap:0.5rem;">
          <a href="/${mainKey}/" class="cluster-main-link">📍 Monteurunterkünfte ${cluster.mainName}</a>
          <a href="/${mainKey}/" role="button" class="outline" style="padding: 0.35rem 0.9rem; font-size: 0.85rem; width: auto; margin-bottom:0;">Wohnungen anzeigen →</a>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-top: 0.8rem;">
          <span style="font-size:0.8rem; color:var(--pico-muted-color); font-weight:600;">Standorte:</span>
          <a href="/${mainKey}/" class="sub-region-btn">📍 ${cluster.mainName}</a>
          ${subBtnsHtml}
        </div>
      </div>
    `;
  });

  const homepageContent = `<!DOCTYPE html>
<html lang="de" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monteurwohnungen L8 Street</title>
  ${FAVICON_HTML}
  <meta name="description" content="Mieten Sie voll ausgestattete Monteurwohnungen & Monteurunterkünfte in über 20 Städten. Inklusive Küche, Bad, WLAN & Parkmöglichkeiten.">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.slate.min.css">
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    ${SHARED_CSS}
  </style>
</head>
<body>
  ${HEADER_HTML}
  <main class="container">
    <div style="text-align: center; margin-top: 1rem; margin-bottom: 2rem;">
      <h1 style="font-size: 2.2rem; font-weight: 700; margin-bottom: 0.5rem;">Monteurunterkünfte & Monteurwohnungen</h1>
      <p style="color: var(--pico-muted-color); font-size: 1.15rem;">Voll ausgestattete Apartments für Firmen, Handwerker & Teams direkt buchen.</p>
    </div>

    ${FEATURE_GRID_HTML}

    ${REVIEWS_SECTION_HTML}

    ${MAP_SECTION_HTML}

    <h3 style="margin-bottom: 1rem;">Standort auswählen:</h3>
    <div class="clusters-container">
      ${homepageClustersHtml}
    </div>
  </main>
  ${FOOTER_HTML}

  <script>
    document.addEventListener("DOMContentLoaded", function() {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    });

    function initMap() {
      const markersData = ${JSON.stringify(mapMarkers)};
      const mapContainer = document.getElementById("map") || document.getElementById("overview-map");
      if (!mapContainer) return;

      const map = new google.maps.Map(mapContainer, {
        zoom: 8,
        center: { lat: 48.95, lng: 8.70 },
        styles: [
          { "featureType": "administrative", "elementType": "labels.text.fill", "stylers": [{ "color": "#444444" }] },
          { "featureType": "landscape", "elementType": "all", "stylers": [{ "color": "#f2f2f2" }] },
          { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] },
          { "featureType": "road", "elementType": "all", "stylers": [{ "saturation": -100 }, { "lightness": 45 }] },
          { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#cbd5e1" }, { "visibility": "on" }] }
        ]
      });

      const bounds = new google.maps.LatLngBounds();
      let validMarkers = 0;
      markersData.forEach(m => {
        if (!m.coords || !m.coords[0]) return;
        const pos = { lat: m.coords[0], lng: m.coords[1] };
        
        if (pos.lat < 47 || pos.lat > 55 || pos.lng < 5 || pos.lng > 15) return;

        const marker = new google.maps.Marker({
          position: pos,
          map: map,
          title: m.name
        });

        const infoWindow = new google.maps.InfoWindow({
          content: '<strong>' + m.name + '</strong><br><a href="/' + m.key + '/">Wohnungen sehen →</a>'
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });

        bounds.extend(pos);
        validMarkers++;
      });

      if (validMarkers > 0) {
        map.fitBounds(bounds);
      }
    }
  </script>
  <script src="https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&callback=initMap" async defer></script>
</body>
</html>`;

  fs.writeFileSync(path.join(process.cwd(), 'index.html'), homepageContent);

  // 4. RECHTLICHE SEITEN (Favicon-Stelle 4)
  const generateLegalPage = (folderName, titleStr, bodyHtml) => {
    const legalDir = path.join(process.cwd(), folderName);
    if (!fs.existsSync(legalDir)) fs.mkdirSync(legalDir, { recursive: true });

    const fullHtml = `<!DOCTYPE html>
<html lang="de" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleStr} | L8 Street</title>
  ${FAVICON_HTML}
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
