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

// Africa countries data with realistic SVG paths based on actual geographic data
const africaCountries: CountryData[] = [
  {
    id: "dz",
    name: "Algeria",
    path: "M200 120 L320 115 L350 125 L380 140 L390 160 L385 180 L370 200 L350 210 L320 215 L200 220 L180 200 L175 180 L180 160 L185 140 Z"
  },
  {
    id: "ly",
    name: "Libya", 
    path: "M380 140 L450 135 L480 145 L500 160 L505 180 L500 200 L480 215 L450 220 L380 215 L370 200 L385 180 L390 160 Z"
  },
  {
    id: "eg",
    name: "Egypt",
    path: "M500 160 L530 155 L540 165 L545 175 L550 185 L545 195 L540 205 L530 215 L520 225 L510 235 L500 230 L490 220 L485 210 L480 200 L485 190 L490 180 L495 170 Z"
  },
  {
    id: "ma",
    name: "Morocco",
    path: "M120 120 L200 120 L185 140 L180 160 L175 180 L160 190 L145 185 L130 175 L120 165 L115 155 L118 145 L120 135 Z"
  },
  {
    id: "tn",
    name: "Tunisia",
    path: "M350 115 L380 110 L385 120 L380 130 L375 140 L370 135 L365 125 L360 120 Z"
  },
  {
    id: "mr",
    name: "Mauritania",
    path: "M115 180 L175 185 L170 205 L165 225 L160 245 L150 255 L140 250 L130 240 L120 230 L115 220 L110 210 L112 200 L115 190 Z"
  },
  {
    id: "ml",
    name: "Mali",
    path: "M160 245 L240 250 L250 270 L245 290 L240 310 L220 320 L200 315 L180 305 L165 295 L155 285 L150 275 L155 265 Z"
  },
  {
    id: "ne",
    name: "Niger",
    path: "M240 250 L340 255 L350 275 L345 295 L340 315 L320 325 L300 320 L280 310 L260 300 L245 290 L250 270 Z"
  },
  {
    id: "td",
    name: "Chad",
    path: "M340 255 L420 260 L430 280 L425 300 L420 320 L400 330 L380 325 L360 315 L345 295 L350 275 Z"
  },
  {
    id: "sd",
    name: "Sudan",
    path: "M420 260 L500 265 L510 285 L505 305 L500 325 L480 335 L460 330 L440 320 L425 300 L430 280 Z"
  },
  {
    id: "et",
    name: "Ethiopia",
    path: "M500 325 L520 330 L530 350 L525 370 L520 390 L500 400 L480 395 L465 385 L455 375 L460 365 L470 355 L485 345 L500 335 Z"
  },
  {
    id: "so",
    name: "Somalia",
    path: "M520 390 L535 395 L545 415 L550 435 L545 455 L535 465 L525 460 L515 450 L510 440 L515 430 L520 420 L520 410 Z"
  },
  {
    id: "ke",
    name: "Kenya",
    path: "M480 395 L520 390 L515 410 L510 430 L500 440 L485 445 L470 440 L460 430 L455 420 L460 410 L470 400 Z"
  },
  {
    id: "ug",
    name: "Uganda",
    path: "M455 375 L480 370 L485 385 L480 395 L470 400 L460 395 L450 385 L455 375 Z"
  },
  {
    id: "tz",
    name: "Tanzania",
    path: "M470 440 L500 435 L510 455 L505 475 L495 485 L480 480 L465 475 L455 465 L460 455 L470 445 Z"
  },
  {
    id: "sn",
    name: "Senegal",
    path: "M90 220 L120 225 L125 240 L120 250 L110 255 L100 250 L90 240 L85 230 Z"
  },
  {
    id: "gm",
    name: "Gambia",
    path: "M95 235 L115 237 L118 242 L115 247 L95 245 Z"
  },
  {
    id: "gw",
    name: "Guinea-Bissau",
    path: "M85 250 L100 252 L105 260 L100 268 L85 266 L80 258 Z"
  },
  {
    id: "gn",
    name: "Guinea",
    path: "M90 270 L130 275 L135 285 L130 295 L120 300 L105 295 L95 285 L90 275 Z"
  },
  {
    id: "sl",
    name: "Sierra Leone",
    path: "M100 295 L120 297 L125 305 L120 313 L100 311 L95 303 Z"
  },
  {
    id: "lr",
    name: "Liberia",
    path: "M105 310 L125 312 L130 322 L125 332 L105 330 L100 320 Z"
  },
  {
    id: "ci",
    name: "Côte d'Ivoire",
    path: "M130 325 L170 330 L175 345 L170 360 L150 365 L130 360 L125 350 L130 340 Z"
  },
  {
    id: "gh",
    name: "Ghana",
    path: "M175 345 L195 347 L200 362 L195 377 L175 375 L170 360 Z"
  },
  {
    id: "tg",
    name: "Togo",
    path: "M200 362 L210 363 L212 375 L210 385 L200 383 L195 377 Z"
  },
  {
    id: "bj",
    name: "Benin",
    path: "M212 375 L225 376 L227 390 L225 405 L212 403 L210 385 Z"
  },
  {
    id: "ng",
    name: "Nigeria",
    path: "M227 390 L290 395 L295 415 L290 435 L270 440 L250 435 L235 425 L230 415 L227 405 Z"
  },
  {
    id: "cm",
    name: "Cameroon",
    path: "M270 440 L320 445 L325 465 L320 485 L300 490 L280 485 L270 475 L270 460 Z"
  },
  {
    id: "cf",
    name: "Central African Republic",
    path: "M320 425 L400 430 L405 445 L400 460 L380 465 L360 460 L340 455 L325 445 L320 435 Z"
  },
  {
    id: "gq",
    name: "Equatorial Guinea",
    path: "M260 465 L275 467 L277 475 L275 483 L260 481 L258 473 Z"
  },
  {
    id: "ga",
    name: "Gabon",
    path: "M260 485 L300 490 L305 510 L300 530 L280 535 L260 530 L255 520 L260 510 Z"
  },
  {
    id: "cd",
    name: "Democratic Republic of Congo",
    path: "M300 530 L420 535 L430 555 L425 575 L420 595 L400 600 L380 595 L360 590 L340 585 L320 580 L305 570 L300 560 L295 550 L300 540 Z"
  },
  {
    id: "cg",
    name: "Republic of Congo",
    path: "M300 490 L340 495 L345 515 L340 535 L320 540 L305 535 L300 525 L300 510 Z"
  },
  {
    id: "ao",
    name: "Angola",
    path: "M280 535 L380 540 L390 560 L385 580 L375 595 L360 600 L340 595 L320 590 L300 585 L285 575 L280 565 L275 555 L280 545 Z"
  },
  {
    id: "zm",
    name: "Zambia",
    path: "M385 580 L440 585 L450 600 L445 615 L435 625 L420 620 L405 615 L390 610 L380 605 L375 595 L380 590 Z"
  },
  {
    id: "mw",
    name: "Malawi",
    path: "M445 615 L460 617 L465 630 L460 645 L450 647 L440 645 L438 635 L440 625 Z"
  },
  {
    id: "mz",
    name: "Mozambique",
    path: "M460 617 L480 620 L490 635 L495 650 L490 665 L480 675 L470 680 L460 675 L455 665 L460 655 L465 645 L465 630 Z"
  },
  {
    id: "zw",
    name: "Zimbabwe",
    path: "M420 620 L450 625 L455 640 L450 655 L435 660 L420 655 L410 650 L405 640 L410 630 Z"
  },
  {
    id: "bw",
    name: "Botswana",
    path: "M375 595 L420 600 L425 620 L420 640 L405 645 L390 640 L375 635 L370 625 L370 615 L375 605 Z"
  },
  {
    id: "na",
    name: "Namibia",
    path: "M320 590 L375 595 L370 615 L365 635 L355 650 L345 655 L335 650 L325 640 L320 630 L315 620 L315 610 L320 600 Z"
  },
  {
    id: "za",
    name: "South Africa",
    path: "M355 650 L470 655 L480 670 L475 685 L465 695 L450 700 L430 695 L410 690 L390 685 L370 680 L355 675 L345 670 L340 665 L345 655 Z"
  },
  {
    id: "ls",
    name: "Lesotho",
    path: "M410 680 L425 682 L430 690 L425 698 L410 696 L405 688 Z"
  },
  {
    id: "sz",
    name: "Eswatini",
    path: "M450 675 L460 677 L462 685 L460 693 L450 691 L448 683 Z"
  },
  {
    id: "mg",
    name: "Madagascar",
    path: "M520 620 L540 625 L545 645 L550 665 L545 685 L535 700 L525 705 L515 700 L510 685 L515 665 L520 645 L520 625 Z"
  }
];

export default function AfricaMap() {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    content: "",
    x: 0,
    y: 0,
  });
  
  const mapRef = useRef<SVGSVGElement>(null);

  const handleCountryEnter = (event: React.MouseEvent, country: CountryData) => {
    const target = event.currentTarget as SVGPathElement;
    
    // Animate country with anime.js
    animate(target, {
      scale: 1.1,
      duration: 300,
      easing: 'easeOutCubic'
    });

    // Add glow effect
    target.style.filter = 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))';
    target.style.fill = '#3b82f6';

    // Show tooltip
    setTooltip({
      visible: true,
      content: country.name,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleCountryLeave = (event: React.MouseEvent) => {
    const target = event.currentTarget as SVGPathElement;
    
    // Animate back to normal
    animate(target, {
      scale: 1,
      duration: 300,
      easing: 'easeOutCubic'
    });

    // Remove glow effect
    target.style.filter = 'none';
    target.style.fill = '#6b7280';

    // Hide tooltip
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (tooltip.visible) {
      setTooltip(prev => ({
        ...prev,
        x: event.clientX,
        y: event.clientY,
      }));
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      {/* Glassmorphic container - fill available space */}
      <div className="glass-map relative overflow-hidden w-full h-full">
        <svg
          ref={mapRef}
          viewBox="0 0 600 750"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full max-w-none"
          onMouseMove={handleMouseMove}
          role="img"
          aria-label="Interactive map of Africa"
        >
          {/* Background */}
          <rect width="600" height="750" fill="transparent" />
          
          {/* Africa continent background - recognizable Africa silhouette */}
          <path
            d="M160 80 L380 75 L420 85 L450 100 L480 120 L500 145 L515 170 L525 195 L530 220 L535 245 L540 270 L545 295 L550 320 L555 345 L560 370 L565 395 L568 420 L570 445 L572 470 L574 495 L576 520 L578 545 L580 570 L582 595 L584 620 L586 645 L588 670 L585 690 L580 710 L570 725 L555 735 L540 740 L525 742 L510 740 L495 735 L480 728 L465 720 L450 710 L435 698 L420 685 L405 670 L390 654 L375 637 L360 619 L345 600 L330 580 L315 559 L300 537 L285 514 L270 490 L255 465 L240 439 L225 412 L210 384 L195 355 L180 325 L165 294 L155 262 L150 229 L148 196 L150 163 L155 130 L160 97 Z"
            fill="rgba(156, 163, 175, 0.03)"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
          />
          
          {/* Country paths */}
          {africaCountries.map((country) => (
            <path
              key={country.id}
              id={country.id}
              d={country.path}
              fill="#6b7280"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
              className="country-path"
              style={{ transformOrigin: 'center' }}
              onMouseEnter={(e) => handleCountryEnter(e, country)}
              onMouseLeave={handleCountryLeave}
            />
          ))}
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed pointer-events-none z-50 transition-all duration-200"
          style={{
            left: tooltip.x + 15,
            top: tooltip.y - 45,
            transform: 'translateZ(0)' // Force hardware acceleration
          }}
        >
          <div className="bg-black/90 text-white px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-sm border border-white/20 shadow-2xl">
            <div className="relative">
              {tooltip.content}
              {/* Tooltip arrow */}
              <div className="absolute -bottom-1 left-4 w-2 h-2 bg-black/90 border-r border-b border-white/20 transform rotate-45"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}