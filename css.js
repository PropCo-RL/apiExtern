const SHARED_CSS = `
/* Reset & Base Styles */
:root {
  --pico-font-size: 100%;
  --pico-border-radius: 10px;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.section-padding {
  padding: 2rem 0;
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

.apt-card {
  border: 1px solid var(--pico-border-color);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--pico-card-background-color);
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

.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 20px;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.badge-success { background: #dcfce7; color: #166534; }
.badge-warning { background: #fef9c3; color: #854d0e; }
.badge-danger { background: #fee2e2; color: #991b1b; }
.badge-google { background: #e0f2fe; color: #075985; }
.badge-booking { background: #f0f9ff; color: #1e40af; }

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
}

.reviews-slider {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.elfsight-style-card {
  border-radius: 12px;
  background: var(--pico-card-background-color);
  border: 1px solid var(--pico-border-color);
  padding: 1rem;
  margin-bottom: 0;
}

.review-author {
  font-weight: 700;
  font-size: 0.9rem;
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
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  background: var(--pico-card-background-color);
  border: 1px solid var(--pico-border-color);
}

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
`;

module.exports = { SHARED_CSS };
