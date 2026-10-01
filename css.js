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

    /* PICO V2 BEWERTUNGS-SLIDER STYLES */
    .reviews-slider {
      display: flex;
      gap: 1.25rem;
      overflow-x: auto;
      padding: 0.5rem 0 1.5rem 0;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
    }

    .reviews-slider article {
      flex: 0 0 290px;
      scroll-snap-align: start;
      margin-bottom: 0;
      padding: 1.25rem;
      border-radius: 12px;
      background: #ffffff;
      border: 1px solid var(--pico-border-color, #e2e8f0);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .reviews-slider header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 0 0.5rem 0;
      margin-bottom: 0.6rem;
      background: transparent;
      border-bottom: 1px solid #f1f5f9;
    }

    .review-author {
      font-weight: 700;
      font-size: 0.9rem;
      color: #0f172a;
    }

    .badge-google { background: #e8f0fe; color: #1a73e8; font-weight: 600; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }
    .badge-airbnb { background: #ffe5e9; color: #ff385c; font-weight: 600; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }
    .badge-booking { background: #e6f0fa; color: #003580; font-weight: 600; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }

    .review-body {
      font-size: 0.85rem;
      color: #334155;
      line-height: 1.45;
      font-style: italic;
    }

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

module.exports = { SHARED_CSS };
