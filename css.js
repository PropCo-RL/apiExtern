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

    /* FEATURE GRID (FEATURING 2-COL MOBILE / 3-6 COL DESKTOP) */
    .feature-grid {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
      gap: 1rem !important;
      margin: 1.5rem 0 2.5rem 0 !important;
    }

    .feature-box {
      display: flex !important;
      align-items: center !important;
      gap: 0.8rem !important;
      padding: 1rem 1.2rem !important;
      border: 1px solid var(--pico-border-color, #e2e8f0) !important;
      border-radius: 12px !important;
      background: var(--pico-card-background-color, #ffffff) !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02) !important;
    }

    .feature-icon {
      width: 28px;
      height: 28px;
      color: var(--pico-primary, #1e293b);
      flex-shrink: 0;
    }

    /* SEKTIONS-TRENNUNGEN UND WEICHE ÜBERGÄNGE */
    .section-padding {
      padding: 2rem 0;
      border-bottom: 1px solid var(--pico-border-color, #f1f5f9);
    }

    .section-alt-bg {
      background-color: #f8fafc;
      margin-left: calc(-50vw + 50%);
      margin-right: calc(-50vw + 50%);
      padding-left: calc(50vw - 50%);
      padding-right: calc(50vw - 50%);
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
    }

    .catalog-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
      gap: 1.5rem; 
      margin-top: 1.5rem;
    }

    .apt-card { 
      padding: 0; 
      overflow: hidden; 
      margin-bottom: 0; 
      display: flex; 
      flex-direction: column; 
      border: 1px solid var(--pico-border-color); 
      border-radius: var(--pico-border-radius);
      background: var(--pico-card-background-color);
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

    /* PLATFORM PILLS OBEN */
    .platform-pills {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .pill {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: 20px;
      color: #fff;
    }
    .pill-booking { background: #003580; }
    .pill-airbnb { background: #ff385c; }
    .pill-google { background: #1a73e8; }

    /* BEWERTUNGS-SLIDER */
    .reviews-slider {
      display: flex;
      gap: 1.25rem;
      overflow-x: auto;
      padding: 0.8rem 0 1.2rem 0;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
    }

    .elfsight-style-card {
      flex: 0 0 300px;
      scroll-snap-align: start;
      margin-bottom: 0;
      padding: 1.4rem;
      border-radius: 16px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .elfsight-style-card header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0;
      margin-bottom: 0.6rem;
      background: transparent;
      border: none;
    }

    .review-author {
      font-weight: 700;
      font-size: 0.92rem;
      color: #0f172a;
    }

    .badge-google { background: #e8f0fe; color: #1a73e8; font-weight: 600; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }
    .badge-airbnb { background: #ffe5e9; color: #ff385c; font-weight: 600; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }
    .badge-booking { background: #e6f0fa; color: #003580; font-weight: 600; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }

    .review-body {
      font-size: 0.88rem;
      color: #334155;
      line-height: 1.45;
      margin: 0;
    }

    /* CLUSTER CARDS OPTIMIERUNG FOR ADS */
    .cluster-main-link {
      font-size: 1.25rem;
      font-weight: 700;
      text-decoration: none;
      color: #0f172a;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: color 0.2s ease;
    }
    .cluster-main-link:hover {
      color: #1a73e8;
    }

    .sub-region-btn {
      font-size: 0.85rem;
      padding: 0.3rem 0.75rem;
      border-radius: 20px;
      border: 1px solid var(--pico-border-color, #cbd5e1);
      text-decoration: none;
      color: var(--pico-color, #334155);
      background: #ffffff;
      display: inline-block;
      transition: all 0.2s ease;
    }
    .sub-region-btn:hover {
      border-color: #1a73e8;
      color: #1a73e8;
      background: #f0f7ff;
    }

    /* BADGES */
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
`;

module.exports = { SHARED_CSS };
