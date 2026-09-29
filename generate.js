const fs = require('fs');
const path = require('path');

const API_URL = "https://script.google.com/macros/s/AKfycbyMD7mGXRmW9IQFIK9gRLUBRWwprCudXEhfWEDDGk9iyvNe0yyK6w5gIuhLXZOFue8Z3w/exec";

function optimizeImageUrl(url, width = 600) {
  if (!url) return 'https://via.placeholder.com/600x400?text=Bild+nicht+verf%C3%BCgbar';
  if (url.includes('googleusercontent.com') && !url.includes('=w')) {
    return `${url}=w${width}-h400-c`;
  }
  return url;
}

// ==========================================
// SHARED CSS STYLES
// ==========================================
const SHARED_CSS = `
    :root { 
      --pico-border-radius: 12px; 
      --pico-font-size: 95%; 
    }

    body { 
      padding-bottom: 70px; 
      margin: 0 !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch;
    }

    main.container {
      max-width: 1200px !important;
      box-sizing: border-box !important;
      padding-left: 15px !important;
      padding-right: 15px !important;
      margin: 0 auto !important;
      padding-top: 1.5rem !important;
      padding-bottom: 2rem !important;
    }

    .catalog-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
      gap: 1.5rem; 
      margin-top: 1.5rem;
    }

    .cities-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); 
      gap: 1.2rem; 
      margin-top: 1.5rem; 
    }

    .city-card { 
      padding: 1.2rem; 
      text-align: center; 
      font-weight: bold; 
      font-size: 1.1rem; 
      border: 1px solid var(--pico-border-color); 
      border-radius: 12px; 
      text-decoration: none; 
      color: var(--pico-color);
      display: block; 
      transition: background 0.2s ease, border-color 0.2s ease;
    }

    .city-card:hover { 
      background: var(--pico-primary-background); 
      border-color: var(--pico-primary);
    }

    .apt-card { 
      padding: 0; 
      overflow: hidden; 
      margin-bottom: 0; 
      display: flex; 
      flex-direction: column; 
      border: 1px solid var(--pico-border-color); 
    }

    .apt-card img { 
      width: 100%; 
      height: 180px; 
      object-fit: cover; 
      background-color: #f1f5f9;
    }

    .apt-card-content { 
      padding: 1rem; 
      display: flex; 
      flex-direction: column; 
      flex-grow: 1; 
    }

    .gallery-grid { 
      display: grid; 
      grid-template-columns: 2fr 1fr 1fr; 
      grid-template-rows: 170px 170px; 
      gap: 8px; 
      border-radius: 16px; 
      overflow: hidden; 
      margin-bottom: 1.5rem; 
    }

    .gallery-grid-item { 
      width: 100%; 
      height: 100%; 
      object-fit: cover; 
      cursor: pointer; 
      transition: opacity 0.2s ease; 
    }

    .gallery-grid-item:hover { opacity: 0.88; }
    .gallery-grid-item:first-child { grid-row: span 2; }

    @media (max-width: 768px) {
      .gallery-grid { 
        display: flex; 
        overflow-x: auto; 
        scroll-snap-type: x mandatory; 
        grid-template-columns: none; 
        grid-template-rows: none; 
        height: 250px; 
        border-radius: 12px; 
      }
      .gallery-grid-item { 
        flex: 0 0 85%; 
        scroll-snap-align: start; 
      }
      .gallery-grid-item:first-child { grid-row: auto; }
    }

    /* BADGE FARBEN */
    .badge { 
      display: inline-block; 
      padding: 0.25rem 0.65rem; 
      font-size: 0.75rem; 
      font-weight: 700; 
      border-radius: 20px; 
      margin-bottom: 0.5rem; 
    }
    .badge-success { background-color: #dcfce7 !important; color: #15803d !important; }
    .badge-warning { background-color: #fef3c7 !important; color: #b45309 !important; }
    .badge-danger  { background-color: #fee2e2 !important; color: #991b1b !important; }

    .trust-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 0.8rem;
      font-size: 0.9rem;
      color: var(--pico-muted-color);
    }
    .trust-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .hidden { display: none !important; }

    .lightbox-modal { 
      display: none; position: fixed; z-index: 9999; left: 0; top: 0; 
      width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); 
      justify-content: center; align-items: center; flex-direction: column; 
    }
    .lightbox-modal img { max-width: 90%; max-height: 80vh; border-radius: 8px; object-fit: contain; }
    .lightbox-controls { margin-top: 15px; display: flex; gap: 20px; }
    .lightbox-btn { background: #fff; color: #000; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; }
    .lightbox-close { position: absolute; top: 20px; right: 30px; color: #fff; font-size: 35px; font-weight: bold; cursor: pointer; }

    .detail-grid-container { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-top: 1.5rem; }
    @media (max-width: 768px) { .detail-grid-container { grid-template-columns: 1fr; } }

    /* MULTI-STEP CHECKOUT STYLES */
    .step-indicator { display: flex; justify-content: space-between; margin-bottom: 1.5rem; position: relative; }
    .step-indicator::before { content: ''; position: absolute; top: 15px; left: 0; right: 0; height: 2px; background: var(--pico-border-color); z-index: 1; }
    .step-item { position: relative; z-index: 2; background: var(--pico-card-background-color); padding: 0 10px; display: flex; flex-direction: column; align-items: center; font-size: 0.8rem; font-weight: 600; color: var(--pico-muted-color); }
    .step-number { width: 32px; height: 32px; border-radius: 50%; background: var(--pico-border-color); color: var(--pico-color); display: flex; align-items: center; justify-content: center; margin-bottom: 4px; font-weight: bold; }
    .step-item.active .step-number { background: var(--pico-primary); color: #fff; }
    .step-item.active { color: var(--pico-color); }
    .step-item.completed .step-number { background: #15803d; color: #fff; }
    .step-buttons { display: flex; justify-content: space-between; margin-top: 1.5rem; gap: 10px; }
`;

const HEADER_HTML = `
  <header class="container" style="padding-top: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--pico-border-color);">
    <nav>
      <ul>
        <li><strong style="font-size: 1.75rem; cursor: pointer; font-weight: 700;" onclick="window.location.href='/'">L8 Street</strong></li>
      </ul>
      <ul>
        <li>
          <a href="https://wa.me/4917684801295" target="_blank" style="text-decoration:none; font-weight: 600;">
            <span>+49 176 8480 1295</span>
          </a>
        </li>
      </ul>
    </nav>
  </header>
`;

const FOOTER_HTML = `
  <footer class="container" style="margin-top: 4rem; border-top: 1px solid var(--pico-border-color); padding-top: 2rem; padding-bottom: 2rem;">
    <div class="grid">
      <div>
        <strong>Monteurwohnungen</strong><br>
        <small><a href="/pforzheim/">Monteurwohnung Pforzheim</a></small><br>
        <small><a href="/karlsruhe/">Monteurwohnung Karlsruhe</a></small><br>
        <small><a href="/stuttgart/">Monteurwohnung Stuttgart</a></small>
      </div>
      <div>
        <strong>Kontakt</strong><br>
        <small><a href="https://wa.me/4917684801295" style="text-decoration:none; color:inherit;">+49 176 8480 1295</a></small><br>
        <small>support@L8Street.com</small>
      </div>
      <div>
        <strong>Rechtliches</strong><br>
        <small><a href="/impressum/">Impressum</a></small><br>
        <small><a href="/datenschutz/">Datenschutz</a></small><br>
        <small><a href="/agb/">AGB</a></small>
      </div>
    </div>
  </footer>
`;

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

// 1:1 RECHTLICHE TEXTE
const IMPRESSUM_BODY = `
<h1>IMPRESSUM</h1>
<p><strong>ANBIETER DER WEBSITE</strong><br>
L8 Street GmbH<br>
Hauptstraße 45<br>
75223 Niefern-Öschelbronn<br>
(Keine Postzustellung)</p>

<p><strong>KONTAKT</strong><br>
E-Mail: support@L8Street.com<br>
WhatsApp: +4917684801295</p>

<p>Amtsgericht Mannheim: HRB 728552<br>
USt-ID: DE314603427<br>
Steuernummer: 48051/24783<br>
Geschäftsführer: Raul Leneweit<br>
Sitz der Gesellschaft: Forststraße 65, 75223 Niefern-Öschelbronn</p>

<h2>FIRMENEINTRAGUNG</h2>
<p>Amtsgericht Mannheim, HRB 728552<br>
Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (ODR) zur Verfügung. Sie ist zu finden unter: <a href="http://ec.europa.eu/consumers/odr/" target="_blank">http://ec.europa.eu/consumers/odr/</a>. L8 Street ist weder bereit noch verpflichtet, am Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>

<h2>HAFTUNG FÜR INHALTE</h2>
<p>Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.</p>

<h2>HAFTUNG FÜR LINKS</h2>
<p>Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.</p>

<h2>COPYRIGHT</h2>
<p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.</p>

<hr style="margin: 2rem 0;">

<h1>ENGLISH TRANSLATION</h1>
<h2>Imprint</h2>
<p><strong>PROVIDER OF THE WEBSITE</strong><br>
L8 Street GmbH<br>
Hauptstraße 45 (no mail delivery)<br>
75223 Niefern-Öschelbronn</p>

<p><strong>CONTACT</strong><br>
Phone: +4917684801295<br>
E-Mail: support@L8Street.com</p>

<p><strong>COMPANY REGISTRATION</strong><br>
Court Registry: Amtsgericht Mannheim HRB728552<br>
Corporate VAT Number: DE314603427<br>
Corporate Tax Number: 48051/24783<br>
Responsible director: Mr. Raul Leneweit<br>
Registered Address and headquarter of the corporation:<br>
Forststrasse 65, 75223 Niefern-Oeschelbronn, Germany</p>

<p>The European Commission provides a platform for Online Dispute Resolution (ODR). It can be found at: <a href="http://ec.europa.eu/consumers/odr/" target="_blank">http://ec.europa.eu/consumers/odr/</a>.<br>
L8 Street is neither willing nor obliged to participate in dispute resolution proceedings before a consumer arbitration board.</p>

<h2>LIABILITY FOR CONTENTS</h2>
<p>As a service provider, we are responsible for our own content on these pages according to § 7 para.1 TMG (German Telemedia Act) and general laws. According to §§ 8 to 10 TMG we are not obliged to monitor transmitted or stored information or to investigate circumstances that indicate illegal activity. Obligations to remove or block the use of information according to general laws remain unaffected. However, liability in this respect is only possible from the time of knowledge of a concrete infringement. If we become aware of any such violations, we will remove the content in question immediately.</p>

<h2>LIABILITY FOR LINKS</h2>
<p>Our offer contains links to external websites of third parties, on whose contents we have no influence. Therefore we cannot assume any liability for these external contents. The respective provider or operator of the sites is always responsible for the contents of the linked sites. The linked sites were checked for possible legal violations at the time of linking. Illegal contents were not identified at the time of linking. However, a permanent control of the contents of the linked pages is not reasonable without concrete evidence of a violation of the law. If we become aware of any infringements, we will remove such links immediately.</p>

<h2>COPYRIGHT</h2>
<p>The contents and works on these pages created by the site operators are subject to German copyright law. The reproduction, editing, distribution and any kind of use outside the limits of copyright law require the written consent of the respective author or creator. Downloads and copies of these pages are only permitted for private, non-commercial use. Insofar as the content on this site was not created by the operator, the copyrights of third parties are observed. In particular, third-party content is identified as such. Should you nevertheless become aware of a copyright infringement, please inform us accordingly. If we become aware of any infringements, we will remove such contents immediately.</p>
`;

const AGB_BODY = `
<h1>AGB - Allgemeine Geschäftsbedingungen</h1>
<ol>
  <li><strong>Geltung:</strong> Die AGB gelten für alle Beherbergungsverträge der L8 Street GmbH (“L8”) mit Gästen. Geschäftskunden Preise netto zzgl. MwSt und Endreinigung. Kommunale Abgaben ggf. durch Gast selbst geschuldet.</li>
  <li><strong>Vertrag:</strong> Ein Vertrag kommt zustande, wenn L8 eine Buchung schriftlich bestätigt. Angebote sind freibleibend. Es besteht kein Anspruch auf ein bestimmtes Apartment.</li>
  <li><strong>Haftung:</strong> Besteller und Nutzer haften gesamtschuldnerisch. L8 haftet nur bei Vorsatz/ grober Fahrlässigkeit. Keine Haftung für Wertsachen. Schäden und Mängel sofern zulässig per Pauschalen. Nachweis abweichenden Schadens bleibt möglich.</li>
  <li><strong>Zahlung:</strong> Vorkasse per Bank. Keine Kaution.</li>
  <li><strong>Storno (Buchung/Verlängerung):</strong> an support@l8street.com bis 14 Tage vor Start (7 Tage, wenn Aufenthalt mit Verlängerung &lt;7 Tage). Danach 100% pauschaler Schadensersatz gemäß Punkt 3. Gleiches gilt bei No-Show.</li>
  <li><strong>Unbefristet:</strong> Ab der zweiten Verlängerung gilt die Buchung als unbefristet mit 14 Tagen Kündigungsfrist zum Beginn der nächsten Abrechnungsperiode. Danach 100% pauschaler Schadensersatz gemäß Punkt 3.</li>
  <li><strong>Hausordnung:</strong> Anreise 16 - 21 Uhr, Abreise bis 10 Uhr. Ruhezeit 21 - 7 Uhr. Kein Rauchen, Störungen, Gewerbe.</li>
  <li><strong>Übergabe:</strong> Mängel binnen 24h ab Anreise melden. Zugang ohne Zahlung eingeschränkt oder gegen Aufpreis.</li>
  <li><strong>Internet:</strong> inklusive, Buchender haftet und stellt L8 von Ansprüchen Dritter frei.</li>
  <li><strong>Nebenkosten:</strong> inklusive, bei übermäßigem Verbrauch (&gt;35kWh/Tag, Sommer 10kWh) Pauschale gemäß Punkt 3.</li>
  <li><strong>Reinigung:</strong> pauschal in Höhe von einem Tagespreis. Mehrkosten bei übermäßigem Aufwand (&gt;4h Reinigung) möglich.</li>
  <li><strong>Kommunikation:</strong> nur digital (e-mail, chat). Postversand nur auf ausdrücklichen Wunsch.</li>
  <li><strong>Aufrechnung/ Zurückbehalt:</strong> nur wenn unbestritten oder rechtskräftig festgestellt.</li>
  <li><strong>Datenschutz:</strong> www.L8Street.com/datenschutz.</li>
  <li><strong>Schlussbestimmungen:</strong> Gerichtsstand ist Sitz der L8 Street GmbH (sofern zulässig). Es gilt deutsches Recht. Nebenabreden bedürfen der Schriftform.</li>
</ol>

<hr style="margin: 2rem 0;">

<h1>ENGLISH TRANSLATION</h1>
<h2>Terms</h2>
<ol>
  <li><strong>Scope:</strong> These Terms apply to all accommodation contracts between L8 Street GmbH (“L8”) and guests. Business customer prices are net plus VAT and final cleaning. Potential communal stay taxes owed directly by the guest to the city.</li>
  <li><strong>Contract:</strong> A contract is concluded when L8 confirms a booking in writing. Offers are non-binding. No entitlement to a specific apartment.</li>
  <li><strong>Liability:</strong> ordering party and user are jointly and severally liable. L8 is only liable for intent or gross negligence. No liability for valuables. Damages may be compensated via flat rates where permissible. Proof of different damage remains possible.</li>
  <li><strong>Payment:</strong> Prepayment by bank transfer. No Deposit.</li>
  <li><strong>Cancellation (booking/extension):</strong> Via support@l8street.com up to 14 days before start (7 days if stay incl. extension is &lt;7 days). After that, 100% flat compensation per clause 3. The same applies to no-show.</li>
  <li><strong>Unlimited Stay:</strong> From the second extension, the booking becomes unlimited with 14-day notice to the start of the next billing period. After that, 100% flat compensation per clause 3.</li>
  <li><strong>House Rules:</strong> Check-in 16:00–21:00, check-out by 10:00. Quiet hours 21:00–07:00. No smoking, disturbances, or commercial use.</li>
  <li><strong>Handover:</strong> Report defects within 24h of arrival. Access may be limited without payment or subject to surcharge.</li>
  <li><strong>Internet:</strong> Included. Booker is liable and indemnifies L8 against third-party claims.</li>
  <li><strong>Utilities:</strong> included. Excessive use (&gt;35 kWh/day, in summer &gt;10 kWh/day) additional flat-fee per clause 3.</li>
  <li><strong>Final Cleaning:</strong> flat-fee in the amount of one nightly rate. Extra costs possible for heavy use (&gt;4h cleaning) per clause 3.</li>
  <li><strong>Communication:</strong> Digital only (email, chat). Postal delivery only upon express request.</li>
  <li><strong>Offsetting / Retention:</strong> Only if undisputed or legally established.</li>
  <li><strong>Data Protection:</strong> See www.L8Street.com/datenschutz.</li>
  <li><strong>Final Provisions:</strong> Place of jurisdiction is L8 Street GmbH's registered office (if permitted). German law applies. Side agreements must be in writing.</li>
</ol>
`;

const DATENSCHUTZ_BODY = `
<h1>DATENSCHUTZERKLÄRUNG</h1>
<h2>I. WER IST FÜR DIE DATENVERARBEITUNG VERANTWORTLICH?</h2>
<p>Verantwortlich im Sinne der Datenschutz-Grundverordnung und anderer nationaler Datenschutzgesetze der Mitgliedsstaaten sowie sonstiger datenschutzrechtlicher Bestimmungen ist die:</p>
<p>L8 Street GmbH<br>Forststraße 65<br>75223 Niefern-Öschelbronn<br>Deutschland<br>Kontaktdaten:<br>E-Mail: datenschutz@L8Street.com</p>

<h2>II. WELCHE DATEN VERARBEITEN WIR VON IHNEN?</h2>
<p>Wir verarbeiten Ihre personenbezogenen Daten, wenn Sie eine unserer Unterkünfte buchen, uns Informationen über ein Kontaktformular auf unserer Webseite mitteilen oder auf andere Art und Weise mit uns in Kontakt treten. Im Einzelnen können dies folgende Daten sein:</p>
<ul>
  <li>Daten über Ihre bei der L8 Street GmbH gemieteten Unterkünfte</li>
  <li>Daten, die für die Buchung einer unserer Unterkünfte benötigt werden (Rechnungsadresse, An- und Abreise, Mobilfunknummer, E-Mail-Adresse)</li>
  <li>Daten zur Zahlungsabwicklung (Kreditkartendaten, Kontodaten und weitere Zahlungsinformationen)</li>
  <li>Daten, die wir bei der Einlösung von Coupons erhalten (eingelöste Coupons, Datum und Ort der Einlösung)</li>
  <li>Daten, die Sie generieren, wenn Sie Produkte in Ihren Warenkorb legen Daten, die Sie bei Rezensionen und Bewertungen von Produkten u.ä. abgeben</li>
  <li>Daten, die bei der Nutzung unserer Webseite l8street.com durch die Verwendung von Cookies, (aufgerufene Seiten, angeklickte Links, genutzte Services, Zeitpunkt der Nutzung)</li>
  <li>Daten zu Ihrem Standort (wenn Sie die Erfassung von Standortdaten in Ihren Geräteeinstellungen erlaubt haben)</li>
  <li>Daten, die Sie uns bei der Bestellung des L8 Street-Newsletters mitteilen (u.a. E-Mail- Adresse, Anrede, Vorname, Nachname, Postleitzahl)</li>
  <li>Daten, die wir zum Nachweis Ihrer Einwilligung in den Erhalt des L8 Street-Newsletters benötigen (IP-Adresse und Zeitstempel der Newsletterbestellung sowie des Klicks auf den Link in der Bestätigungs-E-Mail, abgegebene Einwilligungserklärungen)</li>
  <li>Daten, die Sie uns über ein Webformular oder auf andere Weise zur Verfügung stellen, wenn Sie mit unserem Kundenservice in Kontakt treten</li>
  <li>Daten, die Sie uns mitteilen, wenn Sie sich auf eine ausgeschriebene Stelle oder initiativ bei uns bewerben (persönliche Daten, Daten zur Ausbildung, Daten zum bisherigen beruflichen Werdegang, Anschreiben, Lebenslauf, Porträtfoto, Zeugnisse)</li>
</ul>

<h2>III. BESTEHT EINE PFLICHT ZUR BEREITSTELLUNG DER DATEN?</h2>
<p>Die Bereitstellung Ihrer Daten ist gesetzlich nicht vorgeschrieben. Einige der genannten Daten sind jedoch erforderlich, um Werksverträge über unsere Dienstleistungen abschließen und durchführen zu können. Ohne die Mitteilung der zur Vertragsdurchführung benötigten Daten sind wir nicht in der Lage, mit Ihnen einen Vertrag über Dienstleistungen der L8 Street GmbH einzugehen.</p>

<h2>IV. FÜR WELCHE ZWECKE VERARBEITEN WIR IHRE DATEN UND AUF WELCHER RECHTSGRUNDLAGE ERFOLGT DIES?</h2>
<p><strong>Abwicklung von Bestellungen im Online-Shop</strong><br>
Wir verarbeiten Ihre Daten für die Abwicklung von Buchungen in unserem Online-Shop. Dazu gehören die Bereitstellung von Dienstleistungen, Abwicklung von Zahlungen, Gewährung von Rabatten, Inanspruchnahme von Gutscheinen sowie Bearbeitung von Mängelansprüchen.</p>

<p><strong>Nutzung des WhatsApp-Messenger Dienstes</strong><br>
Sofern Sie uns über WhatsApp kontaktieren oder uns zur Kontaktaufnahme per WhatsApp ausdrücklich eingewilligt haben, kommunizieren wir mit Ihnen über den Messenger-Dienst WhatsApp. Die Nutzung von WhatsApp ist freiwillig; alternative Kommunikationswege (z.B. per E-Mail an support@L8Street.com) stehen jederzeit zur Verfügung.</p>

<p><strong>Stand dieser Datenschutzerklärung:</strong> 01.01.2026</p>

<hr style="margin: 2rem 0;">

<h1>PRIVACY POLICY</h1>
<p><strong>English Translation</strong></p>
<h2>I. WHO IS RESPONSIBLE FOR DATA PROCESSING?</h2>
<p>The controller within the meaning of the General Data Protection Regulation (Germany/ EU) and other national data protection laws of the member states is:</p>
<p>L8 Street GmbH<br>Forststrasse 65<br>75223 Niefern-Oeschelbronn<br>Germany<br>Email: datenschutz@L8Street.com</p>
`;

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
    <button class="secondary outline" onclick="window.location.href='/'" style="width: auto; margin-bottom: 1.5rem;">← Zurück zur Übersicht</button>

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
            <label for="form-agb"><input type="checkbox" id="form-agb" required> Ich akzeptiere die <a href="https://l8street.com/agb" target="_blank">AGB</a> sowie die <a href="https://l8street.com/datenschutz" target="_blank">Datenschutzerklärung</a>.</label>
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

    // Sortierung der Wohnungen (Grün > Gelb > Rot)
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

  console.log("Startseite, Detailseiten, Stadtpages und Legal-Pages (AGB, Impressum, Datenschutz) erfolgreich generiert!");
}

buildSite();
