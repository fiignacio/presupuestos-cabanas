import { useState, useRef } from 'react';
import { Download, Users, FileText, Plane, PlaneTakeoff, PlaneLanding, Mail, Trash2, Plus } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PassengerRegistration() {
  const [rawText, setRawText] = useState('');
  
  // Parsed Form State
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [flightIn, setFlightIn] = useState('');
  const [flightOut, setFlightOut] = useState('');
  const [email, setEmail] = useState('');
  const [titular, setTitular] = useState('');
  const [passengers, setPassengers] = useState([]);
  
  const invoiceRef = useRef(null);

  const handleParseText = () => {
    // Basic Parsing Heuristics
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let foundDates = [];
    let foundRuts = [];
    let foundEmails = [];
    let newPassengers = [];

    const rutRegex = /\b(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])\b/gi;
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const dateRegex = /\b(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\b/g;
    const flightRegex = /\b([A-Za-z0-9]{2,3}\s?\d{3,4})\b/g; // e.g., LA123, H2 456

    let possibleFlights = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Extract Emails
      const emailsInLine = line.match(emailRegex);
      if (emailsInLine) foundEmails.push(...emailsInLine);

      // Extract Dates
      const datesInLine = line.match(dateRegex);
      if (datesInLine) foundDates.push(...datesInLine);

      // Extract Flights (Basic guess)
      const flightsInLine = line.match(flightRegex);
      if (flightsInLine) possibleFlights.push(...flightsInLine);

      // Extract RUTs and Names
      const rutsInLine = line.match(rutRegex);
      if (rutsInLine) {
        rutsInLine.forEach(rut => {
          // Try to find the name on the same line or previous line
          let name = line.replace(rutRegex, '').replace(emailRegex, '').replace(dateRegex, '').replace(flightRegex, '').trim();
          
          if (name.length < 3 && i > 0) {
            // Name might be on the previous line
            name = lines[i-1].replace(emailRegex, '').replace(dateRegex, '').replace(flightRegex, '').trim();
          }

          // Cleanup name (remove extra words)
          name = name.replace(/numero de vuelo ida/i, '').replace(/rut/i, '').replace(/pasajero/i, '').trim();
          
          if (!name) name = 'Pasajero Sin Nombre';
          
          newPassengers.push({ name, rut });
        });
      }
    }

    if (foundDates.length >= 1) setCheckIn(foundDates[0]);
    if (foundDates.length >= 2) setCheckOut(foundDates[foundDates.length - 1]);
    
    if (foundEmails.length > 0) setEmail(foundEmails[0]);

    if (possibleFlights.length >= 1) setFlightIn(possibleFlights[0]);
    if (possibleFlights.length >= 2) setFlightOut(possibleFlights[possibleFlights.length - 1]);

    if (newPassengers.length > 0) {
      setPassengers(newPassengers);
    }
  };

  const addPassenger = () => {
    setPassengers([...passengers, { name: '', rut: '' }]);
  };

  const removePassenger = (index) => {
    const newP = [...passengers];
    newP.splice(index, 1);
    setPassengers(newP);
  };

  const handlePassengerChange = (index, field, value) => {
    const newP = [...passengers];
    newP[index][field] = value;
    setPassengers(newP);
  };

  const handleExportPDF = () => {
    const element = invoiceRef.current;
    const originalWidth = element.style.width;
    const originalMinWidth = element.style.minWidth;
    
    // Forzar ancho de escritorio para que el PDF salga perfecto aunque estemos en móvil
    element.style.width = '800px';
    element.style.minWidth = '800px';

    const opt = {
      margin: 1,
      filename: `Confirmacion Reserva-${titular || 'SinTitular'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
      element.style.width = originalWidth;
      element.style.minWidth = originalMinWidth;
    });
  };

  return (
    <div className="app-container">
      <div className="form-section">
        <div className="header">
          <h1>Registro de Pasajeros</h1>
          <p>Autocompletado de Reservas y Vuelos</p>
        </div>

        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h2><FileText size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Texto de la Reserva</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Pega aquí la información que te envía el cliente (correo, whatsapp, etc). El sistema intentará extraer los datos automáticamente.
          </p>
          <textarea
            className="form-control"
            rows={5}
            placeholder="Pega el texto aquí..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            style={{ resize: 'vertical' }}
          />
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            onClick={handleParseText}
            disabled={!rawText.trim()}
          >
            Analizar y Extraer Datos
          </button>
        </div>

        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h2><Plane size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Detalles del Viaje</h2>
          
          <div style={{ display: 'grid', gap: '1rem' }} className="responsive-grid-2">
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label>Titular de la Reserva</label>
              <input type="text" className="form-control" value={titular} onChange={e => setTitular(e.target.value)} placeholder="Ej: Juan Pérez" />
            </div>
            <div className="input-group">
              <label>Fecha Ida (Check-in)</label>
              <input type="text" className="form-control" value={checkIn} onChange={e => setCheckIn(e.target.value)} placeholder="Ej: 15/10/2026" />
            </div>
            <div className="input-group">
              <label>Fecha Vuelta (Check-out)</label>
              <input type="text" className="form-control" value={checkOut} onChange={e => setCheckOut(e.target.value)} placeholder="Ej: 20/10/2026" />
            </div>
            <div className="input-group">
              <label><PlaneLanding size={16} style={{ display: 'inline' }}/> Vuelo Llegada (Ida)</label>
              <input type="text" className="form-control" value={flightIn} onChange={e => setFlightIn(e.target.value)} placeholder="Ej: LA123" />
            </div>
            <div className="input-group">
              <label><PlaneTakeoff size={16} style={{ display: 'inline' }}/> Vuelo Salida (Vuelta)</label>
              <input type="text" className="form-control" value={flightOut} onChange={e => setFlightOut(e.target.value)} placeholder="Ej: LA456" />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label><Mail size={16} style={{ display: 'inline' }}/> Correo de Contacto</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2><Users size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Lista de Pasajeros</h2>
            <button className="btn btn-outline" onClick={addPassenger} style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
              <Plus size={16} /> Agregar
            </button>
          </div>
          
          {passengers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
              No hay pasajeros agregados.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {passengers.map((p, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={p.name} 
                      onChange={e => handlePassengerChange(index, 'name', e.target.value)} 
                      placeholder="Nombre Completo" 
                    />
                  </div>
                  <div style={{ width: '150px' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={p.rut} 
                      onChange={e => handlePassengerChange(index, 'rut', e.target.value)} 
                      placeholder="RUT" 
                    />
                  </div>
                  <button 
                    onClick={() => removePassenger(index)} 
                    style={{ background: 'transparent', border: 'none', color: '#d9534f', cursor: 'pointer', padding: '8px' }}
                    title="Eliminar"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="preview-section">
        <div className="glass-card invoice-panel" ref={invoiceRef} style={{ padding: 0, overflow: 'hidden', background: '#fff' }}>
          {/* Header tipo Fotografía 2 */}
          <div style={{ background: '#6b4c2a', color: 'white', padding: '30px 20px', display: 'grid', gridTemplateColumns: '120px 1fr 120px', alignItems: 'center' }}>
            <div style={{ background: 'white', borderRadius: '50%', padding: '5px', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', justifySelf: 'center' }}>
              <img src="/logo.png" alt="Manuara Logo" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '50%', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold', color: 'white', letterSpacing: '1px' }}>CABAÑAS MANUARA</h2>
              <div style={{ fontSize: '0.8rem', margin: '6px 0', letterSpacing: '1px' }}>CÓDIGO SERNATUR: 34494</div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: 'white', letterSpacing: '1px' }}>CONFIRMACIÓN DE RESERVA</h3>
            </div>
            <div></div>
          </div>

          <div style={{ padding: '40px' }}>
            {/* Detalles Reserva */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ borderLeft: '12px solid #d4a373', paddingLeft: '15px', color: '#6b4c2a', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '20px', letterSpacing: '0.5px' }}>
                DETALLES DE LA RESERVA
              </div>
              <div style={{ paddingLeft: '27px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ fontSize: '0.95rem', color: '#333' }}><strong style={{ display: 'inline-block', width: '160px', fontWeight: '700' }}>Titular de la Reserva:</strong> {titular || '—'}</div>
                <div style={{ fontSize: '0.95rem', color: '#333' }}><strong style={{ display: 'inline-block', width: '160px', fontWeight: '700' }}>Fecha de Entrada:</strong> {checkIn || '—'}</div>
                <div style={{ fontSize: '0.95rem', color: '#333' }}><strong style={{ display: 'inline-block', width: '160px', fontWeight: '700' }}>Fecha de Salida:</strong> {checkOut || '—'}</div>
                <div style={{ fontSize: '0.95rem', color: '#333' }}><strong style={{ display: 'inline-block', width: '160px', fontWeight: '700' }}>Vuelo de Entrada:</strong> {flightIn || '—'}</div>
                <div style={{ fontSize: '0.95rem', color: '#333' }}><strong style={{ display: 'inline-block', width: '160px', fontWeight: '700' }}>Vuelo de Salida:</strong> {flightOut || '—'}</div>
              </div>
            </div>

            {/* Lista Pasajeros */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ borderLeft: '12px solid #d4a373', paddingLeft: '15px', color: '#6b4c2a', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '20px', letterSpacing: '0.5px' }}>
                LISTA DE PASAJEROS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', border: '1px solid #f0e6d2' }}>
                <thead>
                  <tr style={{ background: '#6b4c2a', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'center', width: '60px', fontWeight: '600' }}>N°</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Nombre Completo</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>RUT</th>
                  </tr>
                </thead>
                <tbody>
                  {passengers.map((p, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fffef9' : '#fdf6e3', borderBottom: '1px solid #f0e6d2' }}>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#333' }}>{i + 1}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#333' }}>{p.name || '—'}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#333' }}>{p.rut || '—'}</td>
                    </tr>
                  ))}
                  {passengers.length === 0 && (
                    <tr style={{ backgroundColor: '#fffef9' }}>
                      <td colSpan="3" style={{ padding: '12px', textAlign: 'center', color: '#666' }}>Sin pasajeros registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <button 
            data-html2canvas-ignore="true"
            className="btn btn-accent" 
            style={{ marginTop: 'auto' }}
            onClick={handleExportPDF}
          >
            <Download size={20} /> Exportar Ficha a PDF
          </button>
        </div>
      </div>
    </div>
  );
}
