const SHARED_CSS = `
/* Reset & Base Styles */
:root {
  --pico-font-size: 100%;
  --pico-border-radius: 10px;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* Section Spacing */
.section-padding {
  padding: 2.5rem 0;
}
.section-alt-bg {
  background-color: var(--pico-secondary-background);
  border-top: 1px solid var(--pico-border-color);
  border-bottom: 1px solid var(--pico-border-color);
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  padding-left: calc(50vw - 50%);
  padding-right: calc(50vw - 50%);
}

/* Catalog & Feature Grids */
.catalog-grid, .feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.feature-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--pico-border-color);
  border-radius: 12px;
  background: var(--pico-card-background-color);
}
.feature-icon {
  width: 32px;
  height: 32px;
  color: var(--pico-primary);
  flex-shrink: 0;
}

/* Apartment Card */
.apt-card {
  border: 1px solid var(--pico-border-color);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--pico-card-background-color);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.apt-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}
.apt-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}
.apt-card-content {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 20px;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.badge-success { background: #dcfce7; color: #166534; }
.badge-warning { background: #fef9c3; color: #854d0e; }
.badge-danger { background: #fee2e2; color: #991b1b; }
.badge-google { background: #e0f2fe; color: #075985; }
.badge-booking { background: #f0f9ff; color: #1e40af; }

/* Gallery Grid */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.8rem;
  margin-bottom: 1.5rem;
}
.gallery-grid-item {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.gallery-grid-item:hover {
  opacity: 0.85;
}

/* Reviews Horizontal Slider */
.reviews-slider {
  display: flex;
  gap: 1.25rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 0.5rem 0.5rem 1.5rem 0.5rem;
  -webkit-overflow-scrolling: touch;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.reviews-slider::-webkit-scrollbar {
  display: none;
}

.elfsight-style-card {
  flex: 0 0 300px;
  scroll-snap-align: start;
  border-radius: 14px;
  background: var(--pico-card-background-color);
  border: 1px solid var(--pico-border-color);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  padding: 1.25rem;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.review-author {
  font-weight: 700;
  font-size: 0.95rem;
  display: block;
}
.review-quote {
  font-size: 2rem;
  color: var(--pico-primary);
  line-height: 1;
  margin-bottom: -0.5rem;
}
.review-body {
  font-size: 0.9rem;
  line-height: 1.4;
  margin-top: 0.5rem;
  margin-bottom: 0;
}
.platform-pills {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 0.8rem;
}
.pill {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  background: var(--pico-card-background-color);
  border: 1px solid var(--pico-border-color);
}

/* Google Maps Styling Overrides */
.gm-style-iw-c {
  border-radius: 12px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
  padding: 12px 16px !important;
}
.gm-style-iw-d {
  overflow: hidden !important;
}

/* Step Indicator for Booking Form */
.step-indicator {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 0.5rem;
}
.step-item {
  flex: 1;
  text-align: center;
  padding: 0.6rem;
  background: var(--pico-secondary-background);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--pico-muted-color);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.step-item.active {
  background: var(--pico-primary);
  color: white;
}
.step-item.completed {
  background: var(--pico-ins-color);
  color: white;
}
.step-number {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

/* Lightbox Modal */
.lightbox-modal {
  display: none;
  position: fixed;
  z-index: 9999;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.lightbox-modal img {
  max-width: 90vw;
  max-height: 80vh;
  border-radius: 8px;
  object-fit: contain;
}
.lightbox-close {
  position: absolute;
  top: 20px;
  right: 30px;
  font-size: 40px;
  color: white;
  cursor: pointer;
}
.lightbox-controls {
  margin-top: 15px;
  display: flex;
  gap: 15px;
}
.lightbox-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}
.lightbox-btn:hover {
  background: rgba(255, 255, 255, 0.4);
}
.hidden {
  display: none !important;
}
.sub-region-btn {
  font-size: 0.8rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  background: var(--pico-secondary-background);
  border: 1px solid var(--pico-border-color);
  color: var(--pico-color);
  text-decoration: none;
}
.sub-region-btn:hover {
  background: var(--pico-primary);
  color: white;
}
`;

module.exports = { SHARED_CSS };
