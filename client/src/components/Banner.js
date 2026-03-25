import React, { useState, useEffect } from 'react';
import './Banner.css';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

// Predefined list of dynamic, visually appealing banners
const allBanners = [
  // Banner 1: Grand Opening Sale
  {
    id: 'grand-opening',
    titleKey: 'banner_grand_opening_title',
    subtitleKey: 'banner_grand_opening_subtitle',
    ctaKey: 'banner_grand_opening_cta',
    className: 'grand-opening-banner',
    icon: '🎉',
  },
  // Banner 2: Flash Sale
  {
    id: 'flash-sale',
    titleKey: 'banner_flash_sale_title',
    subtitleKey: 'banner_flash_sale_subtitle',
    ctaKey: 'banner_flash_sale_cta',
    className: 'flash-sale-banner',
    icon: '⚡️',
  },
  // Banner 3: Free Shipping
  {
    id: 'free-shipping',
    titleKey: 'banner_free_shipping_title',
    subtitleKey: 'banner_free_shipping_subtitle',
    ctaKey: 'banner_free_shipping_cta',
    className: 'free-shipping-banner',
    icon: '🚚',
  },
  // Banner 4: New Arrivals
  {
    id: 'new-arrivals',
    titleKey: 'banner_new_arrivals_title',
    subtitleKey: 'banner_new_arrivals_subtitle',
    ctaKey: 'banner_new_arrivals_cta',
    className: 'new-arrivals-banner',
    icon: '✨',
  },
  // Banner 5: Weekend Bonanza
  {
    id: 'weekend-bonanza',
    titleKey: 'banner_weekend_bonanza_title',
    subtitleKey: 'banner_weekend_bonanza_subtitle',
    ctaKey: 'banner_weekend_bonanza_cta',
    className: 'weekend-bonanza-banner',
    icon: '🎁',
  },
];

// Function to shuffle an array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Banner = () => {
  const { t, i18n: i18next } = useTranslation();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [shuffledBanners, setShuffledBanners] = useState([]);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [lang, setLang] = useState(i18n.language);

  // Shuffle banners on initial render
  useEffect(() => {
    setShuffledBanners(shuffleArray(allBanners));
  }, []);

  // Auto-cycle banners every 5 seconds
  useEffect(() => {
    if (shuffledBanners.length === 0) return;

    const interval = setInterval(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % shuffledBanners.length);
        setIsFadingOut(false);
      }, 500); // Fade-out duration
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [shuffledBanners]);

  // Re-render on language change to update banner text immediately
  useEffect(() => {
    const handler = (lng) => setLang(lng);
    i18next.on('languageChanged', handler);
    return () => i18next.off('languageChanged', handler);
  }, [i18next]);

  const handleBannerClick = () => {
    // Removed alert.
    // TODO: Implement actual navigation logic here, e.g., to a product listing page or a promotional page.
    console.log(`Banner clicked: ${currentBanner.id}. Implement navigation to a relevant page.`);
  };

  if (shuffledBanners.length === 0) {
    return null; // Or a loading state
  }

  const currentBanner = shuffledBanners[currentBannerIndex];

  return (
    <div
      className={`dynamic-banner ${currentBanner.className} ${isFadingOut ? 'fade-out' : 'fade-in'}`}
      onClick={handleBannerClick}
      role="button"
      tabIndex="0"
      aria-live="polite"
    >
      <div className="banner-content">
        <span className="banner-icon">{currentBanner.icon}</span>
        <div className="banner-text">
          <h2 className="banner-title">{t(currentBanner.titleKey)}</h2>
          <p className="banner-subtitle">{t(currentBanner.subtitleKey)}</p>
        </div>
      </div>
      <div className="banner-cta">
        <span>{t(currentBanner.ctaKey)}</span>
        <span className="arrow">→</span>
      </div>
    </div>
  );
};

export default Banner;