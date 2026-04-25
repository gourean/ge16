import { useState } from 'react';
import MapComponent from '../components/MapComponent';
import NationalDashboard from '../components/NationalDashboard';
import SeatInspector from '../components/SeatInspector';
import ActionMenu from '../components/ActionMenu';
import EventModal from '../components/EventModal';

export default function Campaign() {
  const [activeSeatId, setActiveSeatId] = useState<string | null>(null);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      
      {/* Background container for the D3 Map */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <MapComponent onSeatClick={setActiveSeatId} />
      </div>

      <NationalDashboard />
      
      <SeatInspector seatId={activeSeatId} onClose={() => setActiveSeatId(null)} />
      
      <ActionMenu activeSeatId={activeSeatId} />
      
      <EventModal />

    </div>
  );
}
