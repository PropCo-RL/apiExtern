function renderApartmentHtml(data) {
  const {
    title, fullAddress, bedrooms, beds, price, description, aptCode,
    galleryItemsHtml, images, SHARED_CSS, HEADER_HTML, FOOTER_HTML, API_URL, FAVICON_HTML
  } = data;

  return `<!DOCTYPE html>
<html lang="de" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} mieten | L8 Street</title>
  ${FAVICON_HTML}
  <meta name="description" content="${title} in ${fullAddress.replace(/<[^>]*>/g, '')}. Buchen Sie direkt ohne Aufschlag. Betten: ${beds}, Zimmer: ${bedrooms}.">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.slate.min.css">
  <style>
    ${SHARED_CSS}
  </style>
</head>
<body>
  ${HEADER_HTML}

  <main class="container">
    <button class="secondary outline" onclick="window.history.back()" style="width: auto; margin-bottom: 1rem;">← Zurück zur Übersicht</button>

    <div class="gallery-grid">
      ${galleryItemsHtml}
    </div>

    <div class="grid">
      <div>
        <h1 style="margin-bottom: 0.2rem;">${title}</h1>
        <p style="color: var(--pico-muted-color); font-size: 1rem; margin-bottom: 1.5rem;">${fullAddress}</p>

        <article style="padding: 1.2rem; margin-bottom: 1.5rem;">
          <p style="margin: 0; font-size: 1rem; line-height: 1.5;">${description || 'Gesamte Monteurwohnung mit eigener Küche und eigenem Badezimmer (keine geteilten Bereiche).'}</p>
          <hr style="margin: 1rem 0;">
          <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
            <div><strong>Schlafzimmer:</strong> ${bedrooms}</div>
            <div><strong>Einzelbetten:</strong> ${beds}</div>
            <div><strong>WLAN:</strong> Inklusive</div>
            <div><strong>Parkplatz:</strong> Inklusive</div>
          </div>
        </article>
      </div>

      <div>
        <article style="position: sticky; top: 1rem; padding: 1.5rem; border-radius: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem;">
            <h3 style="margin: 0; font-size: 1.8rem; color: var(--pico-primary);">${price} € <small style="font-size: 0.9rem; font-weight: normal;">pro Nacht</small></h3>
            <span style="font-size: 0.8rem; color: var(--pico-muted-color);">gesamt für alle Personen</span>
          </div>

          <form id="bookingForm" onsubmit="handleBookingSubmit(event)">
            <input type="hidden" name="apartment" value="${aptCode}">
            
            <label for="startDate">Anreise
              <input type="date" id="startDate" name="startDate" required onchange="calculatePrice()">
            </label>

            <label for="endDate">Abreise
              <input type="date" id="endDate" name="endDate" required onchange="calculatePrice()">
            </label>

            <label for="guests">Anzahl Personen
              <select id="guests" name="guests" required>
                ${Array.from({length: beds}, (_, i) => `<option value="${i+1}">${i+1} Personen</option>`).join('')}
              </select>
            </label>

            <label for="company">Firmenname
              <input type="text" id="company" name="company" placeholder="z.B. Bau GmbH" required>
            </label>

            <label for="name">Ansprechpartner
              <input type="text" id="name" name="name" placeholder="Vor- und Nachname" required>
            </label>

            <label for="phone">Telefonnummer
              <input type="tel" id="phone" name="phone" placeholder="+49 123 456789" required>
            </label>

            <label for="email">E-Mail
              <input type="email" id="email" name="email" placeholder="name@firma.de" required>
            </label>

            <button type="submit" id="submitBtn" style="width: 100%; margin-top: 1rem;">Verbindlich Anfragen</button>
          </form>
          <div id="bookingResult" style="margin-top: 1rem;"></div>
        </article>
      </div>
    </div>
  </main>

  <div id="lightbox" class="lightbox-modal">
    <span class="lightbox-close" onclick="closeLightbox()">&times;</span>
    <img id="lightboxImg" src="" alt="Großansicht">
    <div class="lightbox-controls">
      <button class="lightbox-btn" onclick="changeLightboxImg(-1)">← Vorheriges</button>
      <button class="lightbox-btn" onclick="changeLightboxImg(1)">Nächstes →</button>
    </div>
  </div>

  ${FOOTER_HTML}

  <script>
    const imagesList = ${JSON.stringify(images)};
    let currentImgIdx = 0;

    function openLightbox(idx) {
      currentImgIdx = idx;
      document.getElementById('lightboxImg').src = imagesList[currentImgIdx];
      document.getElementById('lightbox').style.display = 'flex';
    }

    function closeLightbox() {
      document.getElementById('lightbox').style.display = 'none';
    }

    function changeLightboxImg(dir) {
      currentImgIdx = (currentImgIdx + dir + imagesList.length) % imagesList.length;
      document.getElementById('lightboxImg').src = imagesList[currentImgIdx];
    }

    async function handleBookingSubmit(e) {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      const res = document.getElementById('bookingResult');
      btn.disabled = true;
      btn.innerText = 'Wird gesendet...';

      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch('${API_URL}?action=createBooking', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
          res.innerHTML = '<ins style="color: var(--pico-ins-color);">✓ Anfrage erfolgreich gesendet! Wir melden uns in Kürze.</ins>';
          e.target.reset();
        } else {
          res.innerHTML = '<del style="color: var(--pico-del-color);">Anfrage fehlgeschlagen. Bitte erneut versuchen.</del>';
        }
      } catch (err) {
        res.innerHTML = '<del style="color: var(--pico-del-color);">Fehler beim Senden. Bitte rufen Sie uns direkt an.</del>';
      } finally {
        btn.disabled = false;
        btn.innerText = 'Verbindlich Anfragen';
      }
    }
  </script>
</body>
</html>`;
}

module.exports = { renderApartmentHtml };
