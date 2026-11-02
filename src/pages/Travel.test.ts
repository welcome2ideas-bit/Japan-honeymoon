import { expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Transport } from './Travel';
import transport from '../../data/transport.json';
import itinerary from '../../data/itinerary.json';
vi.mock('../context',()=>({useTrip:()=>({transport,itinerary})}));
it('shows structured estimates separately from confirmed flights and booking status',()=>{
 const html=renderToStaticMarkup(createElement(Transport));
 expect(html).toContain('🕐 Orientativa');expect(html).toContain('16:30');
 expect(html).toContain('Aprox. 45 min');expect(html).toContain('PENDIENTE DE COMPRA');
 expect(html).toContain('🔒 Confirmada · 17:45');expect(html).not.toContain('🔒 Confirmada · Pendiente');
 expect(html).toContain('TAKAYAMA → NAGOYA · HIDA 6');expect(html).toContain('NAGOYA → ODAWARA · KODAMA 822');expect(html).toContain('Llegada confirmada: 26 nov · 14:42');expect(html).toContain('🔒 Confirmada · 09:36');
});
