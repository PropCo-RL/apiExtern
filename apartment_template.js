function renderApartmentHtml({
  title,
  fullAddress,
  bedrooms,
  beds,
  price,
  description,
  aptCode,
  galleryItemsHtml,
  images,
  SHARED_CSS,
  HEADER_HTML,
  FOOTER_HTML,
  API_URL,
  FAVICON_HTML
}) {
  // Filtert HTML-Tags für die Meta-Description heraus, damit das HTML-Tag nicht ausbricht
  const cleanAddressText = fullAddress ? fullAddress.split('<br>')[0].replace(/<[^>]*>/g, '').trim() : title;

  return `<!DOCTYPE html>
<html lang="de" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | L8 Street</title>
  ${FAVICON_HTML || ''}
  <meta name="description" content="${title} in ${cleanAddressText}. Voll ausgestattete Monteurwohnung mit eigenen Zimmern, Küche, Bad, WLAN & Waschmaschine. Jetzt direkt online buchen.">
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
      if (document.referrer && document.referrer.includes(window.location.host)) { window.history.back(); } else { window.location.href = '/'; }
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
}

module.exports = { renderApartmentHtml };
