import { useState, useRef, useEffect } from 'react';
import { Download, Calendar, Users, Car, Map, Sun, Moon, Lock } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { format, differenceInDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import PassengerRegistration from './components/PassengerRegistration';

function App() {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addDays(new Date(), 3));
  const [isHighSeason, setIsHighSeason] = useState(false);
  
  const [adults, setAdults] = useState(2);
  const [teens, setTeens] = useState(0);
  const [children, setChildren] = useState(0);

  const [includeTour, setIncludeTour] = useState(false);
  const [includeCar, setIncludeCar] = useState(false);
  const [carDays, setCarDays] = useState(1);

  // Autenticación simple
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Navegación
  const [activeTab, setActiveTab] = useState('quote');

  const handleLogin = (e) => {
    e.preventDefault();
    // Contraseña por defecto (puedes cambiarla luego)
    if (passwordInput === 'secreto123') {
      setIsAuthenticated(true);
    } else {
      setPasswordError(true);
    }
  };

  const invoiceRef = useRef(null);

  const nights = Math.max(1, differenceInDays(endDate, startDate) || 1);

  const totalGuests = adults + teens + children;

  // Pricing Logic
  let priceAdult = isHighSeason ? 35000 : 30000;
  if (totalGuests >= 10) {
    priceAdult = 25000; // Grupo grande (10 o más personas)
  }
  const priceTeen = 15000;
  const priceChild = 0;

  const totalAdults = adults * priceAdult * nights;
  const totalTeens = teens * priceTeen * nights;
  const totalChildren = children * priceChild * nights;
  
  // Extras pricing placeholders
  const tourPricePerPerson = 25000; // Fixed placeholder
  const carPricePerDay = carDays >= 3 ? 40000 : 45000;

  const totalTour = includeTour ? (adults + teens) * tourPricePerPerson : 0;
  const totalCar = includeCar ? carDays * carPricePerDay : 0;

  const subtotal = totalAdults + totalTeens + totalChildren;
  const grandTotal = subtotal + totalTour + totalCar;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(value);
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
      filename: `Presupuesto_Cabanas_${format(startDate, 'dd-MM-yyyy')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
      element.style.width = originalWidth;
      element.style.minWidth = originalMinWidth;
    });
  };

  const handleStartDateChange = (e) => {
    const date = new Date(e.target.value);
    setStartDate(date);
    if (date >= endDate) {
      setEndDate(addDays(date, 1));
    }
  };

  const handleEndDateChange = (e) => {
    const date = new Date(e.target.value);
    if (date > startDate) {
      setEndDate(date);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', margin: 0 }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--primary-color)', color: 'white', padding: '15px', borderRadius: '50%' }}>
              <Lock size={32} />
            </div>
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Acceso Privado</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>Ingresa el PIN para generar presupuestos</p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Contraseña" 
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
              style={{ textAlign: 'center', letterSpacing: '2px', fontSize: '1.2rem' }}
            />
            {passwordError && <div style={{ color: '#d9534f', fontSize: '0.9rem', fontWeight: '500' }}>Contraseña incorrecta</div>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Desbloquear Sistema</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 2rem 0', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button 
          style={{ 
            padding: '12px 24px', 
            background: activeTab === 'quote' ? 'var(--glass-bg)' : 'transparent', 
            color: activeTab === 'quote' ? 'var(--primary-color)' : 'var(--text-muted)', 
            border: '1px solid',
            borderColor: activeTab === 'quote' ? 'var(--glass-border)' : 'transparent',
            borderBottom: 'none',
            borderRadius: '12px 12px 0 0', 
            cursor: 'pointer', 
            fontWeight: '600', 
            fontSize: '1.05rem',
            transition: 'var(--transition)',
            boxShadow: activeTab === 'quote' ? '0 -4px 10px rgba(0,0,0,0.02)' : 'none',
            backdropFilter: activeTab === 'quote' ? 'blur(10px)' : 'none'
          }}
          onClick={() => setActiveTab('quote')}
        >
          <Calendar size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> Cotizador de Estadía
        </button>
        <button 
          style={{ 
            padding: '12px 24px', 
            background: activeTab === 'passenger' ? 'var(--glass-bg)' : 'transparent', 
            color: activeTab === 'passenger' ? 'var(--primary-color)' : 'var(--text-muted)', 
            border: '1px solid',
            borderColor: activeTab === 'passenger' ? 'var(--glass-border)' : 'transparent',
            borderBottom: 'none',
            borderRadius: '12px 12px 0 0', 
            cursor: 'pointer', 
            fontWeight: '600', 
            fontSize: '1.05rem',
            transition: 'var(--transition)',
            boxShadow: activeTab === 'passenger' ? '0 -4px 10px rgba(0,0,0,0.02)' : 'none',
            backdropFilter: activeTab === 'passenger' ? 'blur(10px)' : 'none'
          }}
          onClick={() => setActiveTab('passenger')}
        >
          <Users size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> Registro de Pasajeros
        </button>
      </div>

      <div style={{ display: activeTab === 'quote' ? 'block' : 'none' }}>
        <div className="app-container" style={{ paddingTop: '1rem' }}>
      <div className="form-section">
        <div className="header">
          <h1>Reserva de Cabañas</h1>
          <p>Generador de Presupuestos Premium</p>
        </div>

        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h2><Calendar size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Detalles de Estadía</h2>
          
          <div className="date-picker-wrapper">
            <div className="input-group">
              <label>Check-in</label>
              <input 
                type="date" 
                className="form-control"
                value={format(startDate, 'yyyy-MM-dd')}
                onChange={handleStartDateChange}
              />
            </div>
            <div className="input-group">
              <label>Check-out</label>
              <input 
                type="date" 
                className="form-control"
                value={format(endDate, 'yyyy-MM-dd')}
                onChange={handleEndDateChange}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginTop: '1rem' }}>
            <label className="checkbox-label" style={{ background: isHighSeason ? 'rgba(44, 76, 59, 0.1)' : ''}}>
              <div className="checkbox-content">
                {isHighSeason ? <Sun size={20} color="var(--primary-color)"/> : <Moon size={20} color="var(--primary-color)"/>}
                <div>
                  <strong>Temporada Alta</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Aplica tarifas de temporada alta (35.000 base, grupos grandes 25.000)</div>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={isHighSeason} 
                onChange={(e) => setIsHighSeason(e.target.checked)}
              />
            </label>
          </div>
        </div>

        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h2><Users size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Húespedes</h2>
          
          <div className="counter-group">
            <div className="counter-label">
              <strong>Adultos</strong>
              <span className="desc">Mayor a 15 años</span>
            </div>
            <div className="counter-controls">
              <button className="counter-btn" onClick={() => setAdults(Math.max(1, adults - 1))} disabled={adults <= 1}>-</button>
              <span className="counter-value">{adults}</span>
              <button className="counter-btn" onClick={() => setAdults(adults + 1)}>+</button>
            </div>
          </div>

          <div className="counter-group">
            <div className="counter-label">
              <strong>Adolescentes</strong>
              <span className="desc">Entre 7 y 15 años (Tarifa reducida)</span>
            </div>
            <div className="counter-controls">
              <button className="counter-btn" onClick={() => setTeens(Math.max(0, teens - 1))} disabled={teens <= 0}>-</button>
              <span className="counter-value">{teens}</span>
              <button className="counter-btn" onClick={() => setTeens(teens + 1)}>+</button>
            </div>
          </div>

          <div className="counter-group" style={{ borderBottom: 'none' }}>
            <div className="counter-label">
              <strong>Niños</strong>
              <span className="desc">Menores de 7 años (Gratis)</span>
            </div>
            <div className="counter-controls">
              <button className="counter-btn" onClick={() => setChildren(Math.max(0, children - 1))} disabled={children <= 0}>-</button>
              <span className="counter-value">{children}</span>
              <button className="counter-btn" onClick={() => setChildren(children + 1)}>+</button>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h2>Servicios Extra</h2>
          <div className="checkbox-group">
            <label className="checkbox-label" style={{ background: includeTour ? 'rgba(44, 76, 59, 0.1)' : ''}}>
              <div className="checkbox-content">
                <Map size={20} color="var(--primary-color)"/>
                <div>
                  <strong>Tour Guiado</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatCurrency(tourPricePerPerson)} por pasajero adulto/adolescente</div>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={includeTour} 
                onChange={(e) => setIncludeTour(e.target.checked)}
              />
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="checkbox-label" style={{ background: includeCar ? 'rgba(44, 76, 59, 0.1)' : ''}}>
                <div className="checkbox-content">
                  <Car size={20} color="var(--primary-color)"/>
                  <div>
                    <strong>Arriendo de Vehículo</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatCurrency(carPricePerDay)} por día</div>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={includeCar} 
                  onChange={(e) => setIncludeCar(e.target.checked)}
                />
              </label>
              {includeCar && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingRight: '10px' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '500' }}>Cantidad de días:</span>
                  <input 
                    type="number" 
                    min="1" 
                    value={carDays} 
                    onChange={(e) => setCarDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="form-control"
                    style={{ width: '80px', padding: '6px 12px' }}
                  />
                </div>
              )}
            </div>
          </div>
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
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: 'white', letterSpacing: '1px' }}>PRESUPUESTO DE ESTADÍA</h3>
            </div>
            <div></div>
          </div>

          <div style={{ padding: '40px' }}>
            <div className="invoice-row">
              <span className="label">Check-in:</span>
              <span className="value">{format(startDate, "dd MMM yyyy", { locale: es })}</span>
            </div>
            <div className="invoice-row">
              <span className="label">Check-out:</span>
              <span className="value">{format(endDate, "dd MMM yyyy", { locale: es })}</span>
            </div>
            <div className="invoice-row">
              <span className="label">Duración:</span>
              <span className="value">{nights} {nights === 1 ? 'noche' : 'noches'}</span>
            </div>
            <div className="invoice-row">
              <span className="label">Húespedes:</span>
              <span className="value">{adults + teens + children} total</span>
            </div>

          <h4 style={{ fontSize: '1.1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Desglose</h4>

          {adults > 0 && (
            <div className="invoice-row">
              <span className="label">{adults}x Adultos ({formatCurrency(priceAdult)}/noche):</span>
              <span className="value">{formatCurrency(totalAdults)}</span>
            </div>
          )}
          
          {teens > 0 && (
            <div className="invoice-row">
              <span className="label">{teens}x Adolescentes ({formatCurrency(priceTeen)}/noche):</span>
              <span className="value">{formatCurrency(totalTeens)}</span>
            </div>
          )}

          {children > 0 && (
            <div className="invoice-row">
              <span className="label">{children}x Niños (Gratis):</span>
              <span className="value">{formatCurrency(0)}</span>
            </div>
          )}

          {(includeTour || includeCar) && (
            <>
              <h4 style={{ fontSize: '1.1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', margin: '1.5rem 0 1rem 0' }}>Extras</h4>
              {includeTour && (
                <div className="invoice-row">
                  <span className="label">Tour Guiado ({adults + teens} pax):</span>
                  <span className="value">{formatCurrency(totalTour)}</span>
                </div>
              )}
              {includeCar && (
                <div className="invoice-row">
                  <span className="label">Arriendo Vehículo ({carDays} {carDays === 1 ? 'día' : 'días'}):</span>
                  <span className="value">{formatCurrency(totalCar)}</span>
                </div>
              )}
            </>
          )}

          <div style={{ marginTop: '20px', marginBottom: '20px', padding: '15px', backgroundColor: '#fffef9', borderLeft: '8px solid #d4a373', fontSize: '0.85rem', color: '#6b4c2a', borderTop: '1px solid #f0e6d2', borderRight: '1px solid #f0e6d2', borderBottom: '1px solid #f0e6d2' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '0.9rem' }}>Detalles del Servicio:</div>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Incluye servicio de traslado desde y hacia el aeropuerto.</li>
              <li>Incluye bienvenida con collar de flores.</li>
              <li>No incluye servicio de desayuno, ni tampoco se realiza este servicio.</li>
            </ul>
          </div>

          <div className="invoice-row total">
            <span>Total Estimado:</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>

          <button 
            data-html2canvas-ignore="true"
            className="btn btn-accent" 
            style={{ marginTop: '1.5rem' }}
            onClick={handleExportPDF}
          >
            <Download size={20} /> Exportar a PDF
          </button>
          </div>
        </div>
      </div>
      </div>
      </div>

      <div style={{ display: activeTab === 'passenger' ? 'block' : 'none' }}>
        <PassengerRegistration />
      </div>
    </>
  );
}

export default App;
