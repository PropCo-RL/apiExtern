const fs = require('fs');
const path = require('path');
const { SHARED_CSS } = require('./css');

const API_URL = "https://script.google.com/macros/s/AKfycbyMD7mGXRmW9IQFIK9gRLUBRWwprCudXEhfWEDDGk9iyvNe0yyK6w5gIuhLXZOFue8Z3w/exec";

// ==========================================
// HEADER & FOOTER EINLESEN
// ==========================================
let HEADER_HTML = "";
let FOOTER_HTML = "";

try {
  const hfPath = path.join(process.cwd(), 'header_footer.html');
  const hfContent = fs.readFileSync(hfPath, 'utf8');
  HEADER_HTML = hfContent.split('<!-- HEADER -->')[1]?.split('<!-- /HEADER -->')[0] || '';
  FOOTER_HTML = hfContent.split('<!-- FOOTER -->')[1]?.split('<!-- /FOOTER -->')[0] || '';
} catch (err) {
  console.warn("Warnung: header_footer.html konnte nicht gelesen werden.", err);
}

// ==========================================
// RECHTLICHE TEXTE EINLESEN
// ==========================================
let IMPRESSUM_BODY = "";
let AGB_BODY = "";
let DATENSCHUTZ_BODY = "";

try {
  const legalHtmlPath = path.join(process.cwd(), 'legal.html');
  const legalHtmlContent = fs.readFileSync(legalHtmlPath, 'utf8');

  if (legalHtmlContent.includes('<!-- IMPRESSUM -->')) {
    IMPRESSUM_BODY = legalHtmlContent.split('<!-- IMPRESSUM -->')[1]?.split('<!-- /IMPRESSUM -->')[0] || '';
    AGB_BODY = legalHtmlContent.split('<!-- AGB -->')[1]?.split('<!-- /AGB -->')[0] || '';
    DATENSCHUTZ_BODY = legalHtmlContent.split('<!-- DATENSCHUTZ -->')[1]?.split('<!-- /DATENSCHUTZ -->')[0] || '';
  } else {
    IMPRESSUM_BODY = legalHtmlContent;
    AGB_BODY = legalHtmlContent;
    DATENSCHUTZ_BODY = legalHtmlContent;
  }
} catch (err) {
  console.warn("Warnung: legal.html konnte nicht gelesen werden.", err);
}

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
    try {
      images = JSON.parse(images);
    } catch (e) {
      images = images.split(',').map(s => s.trim());
    }
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

  console.log("Hole Verfügbarkeiten für Voraus-Sortierung...");
  const allIds = apartments.map(a => a.id).filter(Boolean);
  let availMap = {};
  try {
    const availRes = await fetch(`${API_URL}?action=getAvailability&ids=${allIds.join(',')}`);
    availMap = await availRes.json();
  } catch (err) {
    console.warn("Konnte Verfügbarkeiten nicht abrufen:", err);
  }

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

    const htmlContent = `<!DOCTYPE html>
<html lang="de" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | L8 Street</title>
  <meta name="description" content="${title} in ${fullAddress}. Voll ausgestattete Monteurwohnung mit eigenen Zimmern, Küche, Bad, WLAN & Waschmaschine. Jetzt direkt online buchen.">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.slate.min.css">
  <style>${SHARED_CSS}</style>
</head>
<body>

  ${HEADER_HTML}

  <main class="container">
    <button class="secondary outline" onclick="smartBack()" style="width: auto; margin-bottom: 1.5rem;">← Zurück zur Übersicht</button>

    <article>
      <div id="detail-gallery-grid" class="gallery-grid">${galleryItemsHtml}</div>

      <h2 style="margin-bottom: 0.2rem; margin-top: 1rem;">${title}</h2>
      <p style="color: var(--pico-muted-color); font-size: 0.95rem; margin-bottom: 1.5rem;">${fullAddress}</p>

      <div class="detail-grid-container">
        <div>
          <p><strong>Gesamte Monteurwohnung mit eigener Küche und eigenem Badezimmer (keine geteilten Bereiche).</strong></p>
          <div style="margin: 1rem 0;">
            <p style="margin-bottom: 0.2rem;"><strong>Schlafzimmer:</strong> <span>${bedrooms}</span></p>
            <p style="margin-bottom: 0.2rem;"><strong>Einzelbetten:</strong> <span>${beds}</span></p>
          </div>
          <p style="margin-bottom: 0.5rem;"><strong>Ausstattung:</strong></p>
          <ul style="padding-left: 1.2rem; margin-bottom: 1.5rem;">
            <li>2 Einzelbetten pro Schlafzimmer</li>
            <li>Voll ausgestattete Küche</li>
            <li>Eigenes Badezimmer</li>
            <li>Smart TV (via WLAN)</li>
            <li>WLAN (50mb/s) kostenfrei inklusive</li>
            <li>Waschmaschine kostenfrei inklusive</li>
            <li>Parkmöglichkeiten vorhanden</li>
          </ul>
          <p style="color: var(--pico-muted-color); font-size: 0.95rem;">${description}</p>
        </div>

        <div>
          <article style="background: var(--pico-card-background-color); border: 1px solid var(--pico-border-color); padding: 1.2rem; border-radius: 12px;">
            <h3 style="margin-bottom: 0.2rem; color: var(--pico-primary);">${price} € pro Nacht</h3>
            <p style="font-size: 0.8rem; color: var(--pico-muted-color); margin-bottom: 1rem;">gesamt für alle Personen<br><small>(unabhängig von Anzahl der Personen)</small></p>
            <hr style="margin: 1rem 0;">
            <strong>Kontakt</strong><br>
            <small>E-Mail: support@L8Street.com</small><br>
            <small>Telefon: <a href="https://wa.me/4917684801295" style="text-decoration:none;">+49 176 8480 1295</a></small>
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
            <div><label for="form-start">Anreise</label><input type="date" id="form-start" required></div>
            <div><label for="form-end">Abreise</label><input type="date" id="form-end" required></div>
          </div>
          <div class="grid">
            <div><label for="form-guests">Anzahl der Personen</label><input type="number" id="form-guests" value="4" min="1" required></div>
            <div>
              <label for="form-billing-cycle">Abrechnungszyklus</label>
              <select id="form-billing-cycle" required>
                <option value="14-taegig" selected>14-tägige Abrechnung</option>
                <option value="woechentlich">Wöchentliche Abrechnung</option>
                <option value="monatlich">Monatliche Abrechnung</option>
                <option value="gesamt">Gesamtzahlung bei Anreise</option>
              </select>
            </div>
          </div>
          <div class="step-buttons"><div></div><button type="button" onclick="goToStep(2)" style="width: auto;">Weiter zu Kontaktdaten →</button></div>
        </div>

        <div id="step-2" class="hidden">
          <label for="form-company">Firma / Unternehmensname</label>
          <input type="text" id="form-company" placeholder="z. B. Muster Bau GmbH" required>
          <div class="grid">
            <div><label for="form-vatid">Umsatzsteuer-ID (USt-ID)</label><input type="text" id="form-vatid" placeholder="DE123456789"></div>
            <div><label for="form-ref">Referenznummer <small>(optional)</small></label><input type="text" id="form-ref" placeholder="z. B. Projekt 2026-B"></div>
          </div>
          <div class="grid">
            <div><label for="form-email">E-Mail-Adresse (für Rechnungen)</label><input type="email" id="form-email" placeholder="name@firma.de" required></div>
            <div><label for="form-phone">Telefon / WhatsApp</label><input type="text" id="form-phone" placeholder="+49 170 1234567" required></div>
          </div>
          <div class="step-buttons"><button type="button" class="secondary outline" onclick="goToStep(1)" style="width: auto;">← Zurück</button><button type="button" onclick="goToStep(3)" style="width: auto;">Weiter zu Rechnungsanschrift →</button></div>
        </div>

        <div id="step-3" class="hidden">
          <fieldset style="margin-bottom: 1rem;">
            <legend><strong>Rechnungsanschrift</strong></legend>
            <div class="grid"><div style="grid-column: span 2;"><label for="form-street">Straße & Hausnummer</label><input type="text" id="form-street" placeholder="Musterstraße 12" required></div></div>
            <div class="grid">
              <div><label for="form-zip">PLZ</label><input type="text" id="form-zip" placeholder="75175" required></div>
              <div><label for="form-city">Ort</label><input type="text" id="form-city" placeholder="Pforzheim" required></div>
            </div>
            <label for="form-country">Land</label><input type="text" id="form-country" value="Deutschland" required>
          </fieldset>
          <blockquote style="margin: 1.5rem 0; font-size: 0.85rem;"><strong>Wichtiger Hinweis zu Stornierungen:</strong> Kostenfreie Stornierung per E-Mail bis 14 Tage vor Anreise. Bei späterer Stornierung oder Nichtanreise (No-Show) fallen 100% Stornogebühren an.</blockquote>
          <fieldset>
            <label for="form-agb"><input type="checkbox" id="form-agb" required> Ich akzeptiere die <a href="/agb/" target="_blank">AGB</a> sowie die <a href="/datenschutz/" target="_blank">Datenschutzerklärung</a>.</label>
          </fieldset>
          <div class="step-buttons"><button type="button" class="secondary outline" onclick="goToStep(2)" style="width: auto;">← Zurück</button><button type="submit" style="width: auto;">Jetzt verbindlich buchen</button></div>
        </div>
      </form>
      <p id="form-msg" style="text-align: center; font-weight: bold; margin-top: 1rem;"></p>
    </article>
  </main>

  ${FOOTER_HTML}

  <div id="lightboxModal" class="lightbox-modal">
    <span class="lightbox-close" onclick="closeLightbox()">&times;</span>
    <img id="lightboxImg" src="" alt="Großansicht">
    <div class="lightbox-controls"><button class="lightbox-btn" onclick="changeLightboxImg(-1)">← Vorheriges</button><button class="lightbox-btn" onclick="changeLightboxImg(1)">Nächstes →</button></div>
  </div>

  <script>
    const API_URL = "${API_URL}";
    const currentGalleryImages = ${JSON.stringify(images)};
    let currentImageIndex = 0; let currentStep = 1;

    function smartBack() {
      if (document.referrer && document.referrer.includes(window.location.host)) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    }

    window.onload = function() {
      const today = new Date(); const nextWeek = new Date(today.getTime() + 7*24*60*60*1000);
      document.getElementById('form-start').value = formatDateForInput(today);
      document.getElementById('form-end').value = formatDateForInput(nextWeek);
    };
    function goToStep(stepNum) {
      document.getElementById('step-1').classList.add('hidden');
      document.getElementById('step-2').classList.add('hidden');
      document.getElementById('step-3').classList.add('hidden');
      document.getElementById('step-' + stepNum).classList.remove('hidden');
      for (let i = 1; i <= 3; i++) {
        const tab = document.getElementById('step-tab-' + i);
        tab.classList.remove('active', 'completed');
        if (i < stepNum) tab.classList.add('completed');
        if (i === stepNum) tab.classList.add('active');
      }
      currentStep = stepNum;
    }
    function openLightbox(index) { currentImageIndex = index; if (currentGalleryImages.length > 0) { document.getElementById('lightboxImg').src = currentGalleryImages[currentImageIndex]; document.getElementById('lightboxModal').style.display = 'flex'; } }
    function closeLightbox() { document.getElementById('lightboxModal').style.display = 'none'; }
    function changeLightboxImg(step) {
      if (currentGalleryImages.length === 0) return;
      currentImageIndex += step;
      if (currentImageIndex < 0) currentImageIndex = currentGalleryImages.length - 1;
      if (currentImageIndex >= currentGalleryImages.length) currentImageIndex = 0;
      document.getElementById('lightboxImg').src = currentGalleryImages[currentImageIndex];
    }
    function handleBookingSubmit(e) {
      e.preventDefault();
      const payload = {
        aptTitle: document.getElementById('form-apt-title').value,
        aptCode: document.getElementById('form-apt-code').value,
        startDate: document.getElementById('form-start').value,
        endDate: document.getElementById('form-end').value,
        company: document.getElementById('form-company').value,
        vatId: document.getElementById('form-vatid').value,
        street: document.getElementById('form-street').value,
        zip: document.getElementById('form-zip').value,
        city: document.getElementById('form-city').value,
        country: document.getElementById('form-country').value,
        email: document.getElementById('form-email').value,
        phone: document.getElementById('form-phone').value,
        guestsCount: document.getElementById('form-guests').value,
        billingCycle: document.getElementById('form-billing-cycle').value,
        refNumber: document.getElementById('form-ref').value,
        userAgent: navigator.userAgent
      };
      const msgEl = document.getElementById('form-msg'); msgEl.innerText = "Verarbeite Buchung..."; msgEl.style.color = "var(--pico-primary)";
      fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) }).then(res => res.json()).then(res => {
        if (res.success) { msgEl.innerText = res.message; msgEl.style.color = "var(--pico-ins-color)"; document.getElementById('booking-form').reset(); goToStep(1); }
        else { msgEl.innerText = res.message; msgEl.style.color = "var(--pico-del-color)"; }
      });
    }
    function formatDateForInput(dateObj) {
      const year = dateObj.getFullYear(); const month = String(dateObj.getMonth() + 1).padStart(2, '0'); const day = String(dateObj.getDate()).padStart(2, '0');
      return \`\${year}-\${month}-\${day}\`;
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

  // ==========================================
  // 3. HAUPT-STARTSEITE GENERIEREN (/index.html)
  // ==========================================
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

  // ==========================================
  // 4. EIGENE STATISCHE LEGAL-PAGES GENERIEREN (/agb/, /impressum/, /datenschutz/)
  // ==========================================
  const generateLegalPage = (folderName, titleStr, bodyHtml) => {
    const legalDir = path.join(process.cwd(), folderName);
    if (!fs.existsSync(legalDir)) {
      fs.mkdirSync(legalDir, { recursive: true });
    }
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
