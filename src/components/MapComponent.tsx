import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useGameStore } from '../store/gameStore';
import { playClick } from '../utils/sfx';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Plus, Minus, Home } from 'lucide-react';

export default function MapComponent({ onSeatClick }: { onSeatClick: (id: string) => void }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<any, any>>(null);
  const svgRef  = useRef<d3.Selection<any, any, any, any>>(null);
  const seats = useGameStore(state => state.seats);
  const [svgLoaded, setSvgLoaded] = useState(false);

  // List of seats that are enclaves (physically inside another seat)
  // These need special handling so they aren't covered by their containers when raised.
  const ENCLAVE_SEATS = ['P114', 'P115', 'P116', 'P117', 'P118', 'P119', 'P120', 'P121', 'P122', 'P123', 'P124', 'P125'];

  // Load SVG once — inject into a .map-pan-layer wrapper inside mapContainerRef
  useEffect(() => {
    fetch('./assets/map/map_2022_final.svg')
      .then(res => res.text())
      .then(svgText => {
        if (!mapContainerRef.current) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const originalSvg = doc.querySelector('svg');

        if (originalSvg) {
          originalSvg.removeAttribute('width');
          originalSvg.removeAttribute('height');
          originalSvg.setAttribute('width', '100%');
          originalSvg.setAttribute('height', '100%');
          // Allow paths to render outside the SVG viewport rectangle when
          // panned/zoomed — the outer wrapper div clips at the real boundary.
          originalSvg.setAttribute('overflow', 'visible');

          // Wrap all SVG children in the zoom-group (receives scale attr only)
          const zoomGroup = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
          zoomGroup.setAttribute('class', 'zoom-group');

          // ── Robust Layer Separation ────────────────────────────────────────
          // We create two identical clones of the SVG content.
          // One will contain only interactive seats, the other only non-interactive labels.
          // This preserves all nested group transforms perfectly.
          
          const seatsLayer = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
          seatsLayer.setAttribute('class', 'seats-layer');
          
          const labelsLayer = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
          labelsLayer.setAttribute('class', 'labels-layer');
          labelsLayer.style.pointerEvents = 'none';

          // Move original children to a temporary holder to clone from
          const tempHolder = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
          while (originalSvg.firstChild) tempHolder.appendChild(originalSvg.firstChild);

          // Clone hierarchies
          seatsLayer.appendChild(tempHolder.cloneNode(true));
          labelsLayer.appendChild(tempHolder.cloneNode(true));

          // In seats layer: hide anything that isn't a seat or a container
          // Using regex to catch P001, P.001, S001 formats
          const seatRegex = /^[PS]\.?\d+/i;
          const shapeTags = ['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'tspan', 'image'];

          seatsLayer.querySelectorAll('*').forEach(el => {
            const nodeName = el.nodeName.toLowerCase();
            if (shapeTags.includes(nodeName)) {
              const id = el.getAttribute('id') || el.getAttribute('data-seat') || '';
              const isSeat = nodeName === 'path' && seatRegex.test(id);
              
              if (!isSeat) {
                // If it's a shape but not a seat, hide it AND disable pointer events
                // so it cannot intercept clicks meant for seat paths below.
                (el as SVGElement).setAttribute('visibility', 'hidden');
                (el as SVGElement).style.pointerEvents = 'none';
              }
            }
          });

          // In labels layer: hide ALL paths so they don't cover the seats below.
          // Labels are text glyphs inside <g aria-label="..."> groups — those stay visible.
          // Background/boundary paths with white fills would otherwise cover the seat colors.
          labelsLayer.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, line, image').forEach(el => {
            // Check if this element is inside a label group (text glyph)
            const parent = el.closest('g[aria-label]');
            if (!parent) {
              // Not a text glyph — hide it and disable pointer events
              (el as SVGElement).setAttribute('visibility', 'hidden');
              (el as SVGElement).style.pointerEvents = 'none';
            }
          });

          // Build hierarchy: seats on bottom, labels on top
          zoomGroup.appendChild(seatsLayer);
          zoomGroup.appendChild(labelsLayer);
          originalSvg.appendChild(zoomGroup);

          // Create the pan layer div
          const panLayer = document.createElement('div');
          panLayer.className = 'map-pan-layer';
          panLayer.innerHTML = originalSvg.outerHTML;

          mapContainerRef.current.innerHTML = '';
          mapContainerRef.current.appendChild(panLayer);
        } else {
          // Fallback: no viewBox found, inject raw SVG
          mapContainerRef.current.innerHTML = svgText;
        }

        setSvgLoaded(true);
      });
  }, []);

  // Update map colors and set up zoom behavior
  useEffect(() => {
    if (!svgLoaded || !seats.length) return;

    const svg = d3.select(mapContainerRef.current).select('svg');
    const zoomGroup = svg.select('.zoom-group');
    
    // ── D3 zoom: decompose transform into CSS translate (pan) + SVG scale (zoom)
    //
    // Why split?
    //   - CSS translate on .map-pan-layer is GPU composited — the browser moves
    //     existing pixels without re-rendering anything. Zero cost.
    //   - SVG scale on .zoom-group forces the SVG renderer to re-draw vector paths
    //     at the new scale, keeping them crisp at any zoom level.
    //
    const zoom = d3.zoom()
      .scaleExtent([0.5, 20])
      .filter((event) => !event.ctrlKey || event.type === 'wheel')
      .on('zoom', (event) => {
        // Unified Vector Transform: Apply both Pan (x, y) and Zoom (k) 
        // to the SVG attribute. This forces the browser to re-render 
        // vector paths at the correct resolution, preventing pixelation.
        zoomGroup.attr('transform', event.transform.toString());
      });

    // Enable zooming on the main svg
    svg.call(zoom as any);
    
    // Store refs for external control
    (zoomRef as any).current = zoom;
    (svgRef as any).current = svg;
    
    // Add interaction classes and attributes ONLY to seats
    zoomGroup.select('.seats-layer').selectAll('path')
      .classed('map-path', true)
      .classed('enclave-seat', function() {
        const id = d3.select(this).attr('data-seat') || d3.select(this).attr('id');
        return id ? ENCLAVE_SEATS.some(e => id.includes(e)) : false;
      })
      .on('click', function() {
        playClick();
        const id = d3.select(this).attr('data-seat') || d3.select(this).attr('id');
        if (id && id.startsWith('P')) onSeatClick(id);
      })
      .on('mouseenter', function() {
        // We no longer call .raise() here because mutating the DOM on hover 
        // can cancel subsequent click events in modern browsers.
        // Instead, we ensure enclaves are moved to the top exactly once during init.
      });

    // One-time pass: Ensure enclaves (like Putrajaya P125) are at the very top of the 
    // seats-layer so they are never covered by their container seats.
    zoomGroup.selectAll('.enclave-seat').raise();

    // Color code based on leading coalition
    seats.forEach(seat => {
      let leader = 'Others';
      let firstPop = -1;
      let secondPop = -1;
      
      for (const [coalition, pop] of Object.entries(seat.popularityTracker)) {
        if (pop > firstPop) {
          secondPop = firstPop;
          firstPop = pop;
          leader = coalition;
        } else if (pop > secondPop) {
          secondPop = pop;
        }
      }

      if (firstPop - secondPop <= 5) {
        leader = 'Undecided';
      }

      const factionColors = useGameStore.getState().factionColors;
      let fill = 'var(--bg-card)';
      if (leader === 'Faction1') fill = factionColors.Faction1;
      else if (leader === 'Faction2') fill = factionColors.Faction2;
      else if (leader === 'Faction3') fill = factionColors.Faction3;
      else if (leader === 'Others') fill = factionColors.Others;
      else if (leader === 'Undecided') fill = factionColors.Undecided;

      const seatId = seat.id.replace('.', '');
      zoomGroup.select('.seats-layer').selectAll(`path[id="${seatId}"], path[data-seat="${seatId}"]`)
         .style('fill', fill)
         .style('opacity', 1.0);
    });

  }, [seats, svgLoaded, onSeatClick]);

  // ── Navigation Helpers ────────────────────────────────────────────────────
  // Button pan: short smooth transition is fine for discrete clicks
  const panMap = useCallback((dx: number, dy: number) => {
    if (svgRef.current && zoomRef.current) {
      svgRef.current.transition().duration(150).call(zoomRef.current.translateBy, dx, dy);
    }
  }, []);

  // Button zoom: brief ease feels intentional
  const zoomMap = useCallback((factor: number) => {
    if (svgRef.current && zoomRef.current) {
      svgRef.current.transition().duration(150).call(zoomRef.current.scaleBy, factor);
    }
  }, []);

  const resetMap = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      svgRef.current.transition().duration(400)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  }, []);

  // ── Hold-to-pan via requestAnimationFrame ────────────────────────────────
  // Tracks which WASD keys are currently pressed
  const keysHeld = useRef<Set<string>>(new Set());
  const rafId    = useRef<number | null>(null);

  const startRafLoop = useCallback(() => {
    if (rafId.current !== null) return; // already running
    const PAN_STEP   = 6;   // pixels per frame at 60 fps  (~360 px/s)
    const ZOOM_STEP_INC = 1.015;
    const ZOOM_STEP_DEC = 1 / ZOOM_STEP_INC;

    const tick = () => {
      if (keysHeld.current.size === 0) {
        rafId.current = null;
        return;
      }
      const svg  = svgRef.current;
      const zoom = zoomRef.current;
      if (svg && zoom) {
        let dx = 0, dy = 0;
        if (keysHeld.current.has('w')) dy += PAN_STEP;
        if (keysHeld.current.has('s')) dy -= PAN_STEP;
        if (keysHeld.current.has('a')) dx += PAN_STEP;
        if (keysHeld.current.has('d')) dx -= PAN_STEP;
        // Direct (no transition) for silky-smooth frame-by-frame panning
        if (dx !== 0 || dy !== 0) svg.call(zoom.translateBy, dx, dy);
        if (keysHeld.current.has('+') || keysHeld.current.has('=')) svg.call(zoom.scaleBy, ZOOM_STEP_INC);
        if (keysHeld.current.has('-')) svg.call(zoom.scaleBy, ZOOM_STEP_DEC);
      }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
  }, []);

  // Keyboard Listener (WASD + Arrows, hold-to-pan enabled)
  useEffect(() => {
    const ARROW_KEY_MAP: Record<string, string> = {
      'arrowup': 'w',
      'arrowdown': 's',
      'arrowleft': 'a',
      'arrowright': 'd'
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const mappedKey = ARROW_KEY_MAP[key] || key;
      
      if (['w','a','s','d','+','=','-'].includes(mappedKey)) {
        e.preventDefault(); // prevent page-scroll on arrow keys
        keysHeld.current.add(mappedKey);
        startRafLoop();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const mappedKey = ARROW_KEY_MAP[key] || key;
      keysHeld.current.delete(mappedKey);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup',   handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup',   handleKeyUp);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [startRafLoop]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div 
        ref={mapContainerRef} 
        className="map-container flex-center"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Floating Navigation Controls */}
      <div className="glass-panel animate-fade-in" style={{ 
        position: 'absolute', 
        bottom: '24px', 
        right: '24px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        padding: '12px',
        zIndex: 20
      }}>
        {/* Pan Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 40px)', gap: '4px', justifyItems: 'center' }}>
            <div />
            <button className="glass-button" style={{ padding: '8px' }} onClick={() => { panMap(0, 100); playClick(); }} title="Move Up (W)">
                <ChevronUp size={20} />
            </button>
            <div />
            <button className="glass-button" style={{ padding: '8px' }} onClick={() => { panMap(100, 0); playClick(); }} title="Move Left (A)">
                <ChevronLeft size={20} />
            </button>
            <button className="glass-button" style={{ padding: '8px' }} onClick={() => { panMap(0, -100); playClick(); }} title="Move Down (S)">
                <ChevronDown size={20} />
            </button>
            <button className="glass-button" style={{ padding: '8px' }} onClick={() => { panMap(-100, 0); playClick(); }} title="Move Right (D)">
                <ChevronRight size={20} />
            </button>
        </div>
        
        {/* Zoom & Home Controls */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
            <button className="glass-button" style={{ padding: '8px' }} onClick={() => { zoomMap(1.4); playClick(); }} title="Zoom In (+)">
                <Plus size={20} />
            </button>
            <button className="glass-button" style={{ padding: '8px' }} onClick={() => { zoomMap(0.7); playClick(); }} title="Zoom Out (-)">
                <Minus size={20} />
            </button>
            <button className="glass-button" style={{ padding: '8px' }} onClick={() => { resetMap(); playClick(); }} title="Reset">
                <Home size={20} />
            </button>
        </div>
      </div>
    </div>
  );
}
