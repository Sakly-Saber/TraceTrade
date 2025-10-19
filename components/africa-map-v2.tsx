"use client";

import { useState, useRef, useEffect } from "react";
import { animate } from "animejs";

interface TooltipState {
  visible: boolean;
  content: string;
  x: number;
  y: number;
}

interface CountryData {
  id: string;
  name: string;
  path: string;
}

// We'll build the country list at runtime by parsing the authoritative SVG
// placed in `public/africa.svg`. This keeps the component small and ensures
// we use accurate country shapes maintained as a single SVG asset.


export default function AfricaMap() {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    content: "",
    x: 0,
    y: 0,
  });
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [svgViewBox, setSvgViewBox] = useState<string | null>('0 0 750 950');
  
  const mapRef = useRef<SVGSVGElement>(null);
  const hoveredElRef = useRef<SVGPathElement | null>(null);

  // Fetch and parse public/africa.svg on mount. We extract <path> elements
  // that have an id and title (or use id as name fallback) and store them in state.
  useEffect(() => {
    let cancelled = false;
    async function loadSvg() {
      try {
        const res = await fetch('/africa.svg');
        if (!res.ok) return;
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');

        // If the root <svg> has a viewBox, use it so scaling is correct
        const svgEl = doc.querySelector('svg');
        if (svgEl?.getAttribute('viewBox')) {
          setSvgViewBox(svgEl.getAttribute('viewBox'));
        } else if (svgEl?.getAttribute('width') && svgEl?.getAttribute('height')) {
          // fallback to width/height when viewBox missing
          setSvgViewBox(`0 0 ${svgEl.getAttribute('width')} ${svgEl.getAttribute('height')}`);
        }

        const paths = Array.from(doc.querySelectorAll('path')) as SVGPathElement[];

        // Whitelist of African ISO2 codes (upper-case). This quickly accepts
        // standard two-letter ids. However some SVGs use full names or
        // different id conventions, so we also accept entries whose title or
        // id (normalized) contains a known African country name.
        const AFRICAN_ISO2 = new Set([
          'DZ','AO','BJ','BW','BF','BI','CV','CM','CF','TD','KM','CG','CD','CI','DJ','EG','GQ','ER','SZ','ET',
          'GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW',
          'ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','EH','ZM','ZW'
        ]);

        // Broad list of African country name hints / common English variants
        // (lower-cased and accent-insensitive). This helps catch entries like
        // "Côte d'Ivoire", "Ivory Coast", "South Africa" or long titles.
        const AFRICAN_NAME_HINTS = [
          'algeria','angola','benin','botswana','burkina','burundi','cape','cameroon','central african','chad','comoros',
          'congo','democratic republic of congo','republic of congo','cote','ivoire','ivory coast','djibouti','egypt',
          'equatorial guinea','eritrea','eswatini','eswatini','swaziland','ethiopia','gabon','gambia','ghana','guinea',
          'guinea-bissau','kenya','lesotho','liberia','libya','madagascar','malawi','mali','mauritania','mauritius','morocco',
          'mozambique','namibia','niger','nigeria','rwanda','sao tome','sao tome and principe','senegal','seychelles',
          'sierra leone','somalia','south africa','south sudan','sudan','tanzania','togo','tunisia','uganda','zambia','zimbabwe',
          'western sahara','sahara','eritrea','burkina faso'
        ];

        const normalize = (s: string) =>
          s
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const parsed: CountryData[] = paths
          .filter(p => {
            const rawId = p.id && p.id.trim();
            const hasD = !!p.getAttribute('d');
            if (!rawId || !hasD) return false;

            const up = rawId.toUpperCase();
            if (up.length === 2 && AFRICAN_ISO2.has(up)) return true;

            // Try matching the title or name attributes against known country hints.
            const title = (p.getAttribute('title') || p.getAttribute('name') || '').toString();
            const normTitle = normalize(title);
            if (normTitle) {
              if (AFRICAN_NAME_HINTS.some(h => normTitle.includes(h))) return true;
            }

            // Also try normalizing the id (some SVGs use full names as ids)
            const normId = normalize(rawId);
            if (AFRICAN_NAME_HINTS.some(h => normId.includes(h))) return true;

            return false;
          })
          .map(p => ({
            id: p.id.trim(),
            name: (p.getAttribute('title') || p.getAttribute('name') || p.id).trim(),
            path: p.getAttribute('d') || ''
          }));

        if (!cancelled) setCountries(parsed);
      } catch (err) {
        // ignore parsing errors; keep countries empty
        console.error('Failed to load/parse africa.svg', err);
      }
    }

    loadSvg();
    return () => { cancelled = true; };
  }, []);

  const handleCountryEnter = (event: React.MouseEvent, country: CountryData) => {
    const target = event.currentTarget as SVGPathElement;
    hoveredElRef.current = target;
    
    // Animate country with anime.js
    animate(target, {
      scale: 1.05,
      duration: 250,
      easing: 'easeOutCubic'
    });

    // Add glow effect and color change
    target.style.filter = 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))';
    target.style.fill = '#3b82f6';

    // Show tooltip
    // Position tooltip near the center of the hovered path's screen bbox so
    // it remains correct when the SVG scales responsively.
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    setTooltip({
      visible: true,
      content: country.name,
      x: Math.round(centerX),
      y: Math.round(centerY),
    });
  };

  const handleCountryLeave = (event: React.MouseEvent) => {
    const target = event.currentTarget as SVGPathElement;
    hoveredElRef.current = null;
    // Animate back to normal
    animate(target, {
      scale: 1,
      duration: 250,
      easing: 'easeOutCubic'
    });

    // Remove glow effect
    target.style.filter = 'none';
    target.style.fill = '#6b7280';

    // Hide tooltip
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!tooltip.visible) return;

    // If we're hovering a path, position the tooltip relative to that
    // element's screen bounding box center. This keeps the tooltip anchored
    // to the country even when the SVG is scaled via CSS or responsive
    // viewBox scaling.
    const hovered = hoveredElRef.current;
    if (hovered) {
      const rect = hovered.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      setTooltip(prev => ({ ...prev, x: Math.round(centerX), y: Math.round(centerY) }));
      return;
    }

    // Fallback to mouse coordinates
    setTooltip(prev => ({ ...prev, x: event.clientX, y: event.clientY }));
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      {/* Glassmorphic container - fill available space */}
      <div className="glass-map relative overflow-hidden w-full h-full">
        <svg
          ref={mapRef}
          viewBox={svgViewBox || '0 0 750 950'}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full max-w-none"
          onMouseMove={handleMouseMove}
          role="img"
          aria-label="Interactive map of Africa"
        >
          {/* Background */}
          <rect width="750" height="950" fill="transparent" />
          
          {/* Africa continent silhouette - accurate shape */}
          <path
            d="M 160 85 Q 200 80 280 82 Q 350 85 420 90 Q 480 95 540 100 Q 580 105 600 130 Q 610 160 615 200 Q 620 240 625 280 Q 630 320 635 360 Q 640 400 645 440 Q 650 480 655 520 Q 660 560 665 600 Q 670 640 675 680 Q 680 720 685 760 Q 690 800 685 840 Q 680 880 665 910 Q 640 930 600 935 Q 560 940 520 935 Q 480 930 440 925 Q 400 920 360 915 Q 320 910 280 905 Q 240 900 200 890 Q 160 880 130 860 Q 100 840 80 810 Q 60 780 50 740 Q 40 700 45 660 Q 50 620 55 580 Q 60 540 65 500 Q 70 460 75 420 Q 80 380 85 340 Q 90 300 95 260 Q 100 220 105 180 Q 110 140 125 110 Q 140 90 160 85 Z"
            fill="rgba(34, 197, 94, 0.03)"
            stroke="rgba(34, 197, 94, 0.1)"
            strokeWidth="1.5"
          />
          
          {/* Country paths (populated from public/africa.svg) */}
          {countries.map((country) => (
            <path
              key={country.id}
              id={country.id}
              d={country.path}
              fill="#6b7280"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="0.8"
              className="country-path"
              style={{ transformOrigin: 'center' }}
              onMouseEnter={(e) => handleCountryEnter(e, country)}
              onMouseLeave={handleCountryLeave}
            />
          ))}
        </svg>
      </div>

      {/* Enhanced Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed pointer-events-none z-50 transition-all duration-200"
          style={{
            left: tooltip.x + 15,
            top: tooltip.y - 45,
            transform: 'translateZ(0)' // Force hardware acceleration
          }}
        >
          <div className="bg-gradient-to-r from-slate-900/95 to-blue-900/95 text-white px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-sm border border-blue-400/30 shadow-2xl">
            <div className="relative">
              {tooltip.content}
              {/* Tooltip arrow */}
              <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-900/95 border-r border-b border-blue-400/30 transform rotate-45"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}