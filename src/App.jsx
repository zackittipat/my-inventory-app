import React, { useState, useEffect, useRef } from 'react';
import { 
  LogIn, Store, Monitor, Map as MapIcon, Users, 
  Plus, Save, Download, ArrowLeft, LogOut, 
  ScanLine, AlertCircle, ChevronRight, FileText, 
  Smartphone, Camera, History, Edit3, Trash2, Loader2, CheckCircle2,
  Image as ImageIcon, Upload, MousePointer2, X, ZoomIn, ZoomOut, Move, Target
} from 'lucide-react';

/**
 * V.2.7 - ESL Project System (Final Production Version)
 * - LCD Install: Zoom/Pan, Click-to-place, Labeling (1,2,3...), Auto Image Export.
 * - Inventory: Rolling balance logic.
 * - Stability: iPad memory optimization for large images.
 */
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxB3vwdJe66H0nYbIEfbA2kTV245RCdgiDylVwd7pEuChbUJCOLUCL-0ueskAG6xnRq/exec'; 

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

// --- Shared UI Components ---
const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden ${className} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-all duration-200' : ''}`}>
    {children}
  </div>
);

const Input = ({ label, icon: Icon, rightElement, ...props }) => (
  <div className="mb-4 text-left">
    {label && <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">{label}</label>}
    <div className="relative flex gap-2">
      <div className="relative flex-1">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />}
        <input {...props} className={`w-full py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 focus:bg-white ${Icon ? 'pl-10 pr-4' : 'px-4'}`} />
      </div>
      {rightElement}
    </div>
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false, loading = false, type = "button" }) => {
  const variants = {
    primary: "bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700",
    success: "bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700",
    secondary: "bg-slate-100 text-slate-600 shadow-none hover:bg-slate-200",
    danger: "bg-red-50 text-red-600 border border-red-100 shadow-none hover:bg-red-100"
  };
  return (
    <button type={type} disabled={disabled || loading} onClick={onClick} className={`px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${variants[variant]} ${className} ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {loading ? <Loader2 className="animate-spin" size={20} /> : children}
    </button>
  );
};

const DynamicDropdown = ({ label, value, onChange, options, onAddNew }) => {
  const [add, setAdd] = useState(false);
  const [nv, setNv] = useState('');
  const [adding, setAdding] = useState(false);
  const handleAdd = async () => {
    if(!nv) return;
    setAdding(true);
    try {
      await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'add_master_company', value: nv }) });
      onAddNew(nv); onChange(nv); setAdd(false); setNv('');
    } catch (e) { alert("Error adding company"); } finally { setAdding(false); }
  };
  return (
    <div className="mb-4 text-left">
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">{label}</label>
      {add ? (
        <div className="flex gap-2">
          <input autoFocus className="flex-1 py-3 px-4 rounded-xl border-2 border-blue-500 outline-none shadow-sm" placeholder="Enter name..." value={nv} onChange={e => setNv(e.target.value)} />
          <Button onClick={handleAdd} loading={adding} className="!px-3">Add</Button>
          <Button onClick={() => setAdd(false)} variant="secondary" className="!px-3">X</Button>
        </div>
      ) : (
        <select value={value} onChange={e => e.target.value === 'NEW' ? setAdd(true) : onChange(e.target.value)} className="w-full py-3 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none shadow-sm appearance-none font-bold text-slate-700">
          <option value="">Select Company</option>
          {options.map((o, idx) => <option key={`${idx}-${o}`} value={String(o)}>{String(o)}</option>)}
          <option value="NEW" className="text-blue-600 font-black">+ Add New</option>
        </select>
      )}
    </div>
  );
};

const ScannerModal = ({ onScan, onClose }) => {
  const [error, setError] = useState(null);
  useEffect(() => {
    let html5QrCode;
    const startScanner = async () => {
      try {
        await loadScript("https://unpkg.com/html5-qrcode");
        html5QrCode = new window.Html5Qrcode("reader");
        await html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 150 } }, (text) => { onScan(text); html5QrCode.stop(); onClose(); }, () => {});
      } catch (err) { setError("Camera access denied"); }
    };
    startScanner();
    return () => { if (html5QrCode) html5QrCode.stop().catch(() => {}); };
  }, []);
  return (
    <div className="fixed inset-0 z-[500] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden p-6 relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full z-10"><X size={20}/></button>
        <h3 className="font-black mb-4 uppercase tracking-tighter text-slate-800 text-center">Scan Serial</h3>
        <div id="reader" className="w-full rounded-2xl overflow-hidden bg-slate-100 aspect-square"></div>
        {error && <p className="text-red-500 text-xs mt-4 font-bold">{error}</p>}
      </div>
    </div>
  );
};

// --- LCD Install Image Editor ---
const LCDImageEditor = ({ user, companies, setCompanies }) => {
  const [step, setStep] = useState('config');
  const [form, setForm] = useState({ company: '', branch: '', image: null });
  const [markers, setMarkers] = useState([]);
  const [activeMarker, setActiveMarker] = useState(null);
  const [tool, setTool] = useState('pan');
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const isDragging = useRef(false);
  const startPointer = useRef({ x: 0, y: 0 });
  const lastOffset = useRef({ x: 0, y: 0 });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm({ ...form, image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handlePointerDown = (e) => {
    if (tool !== 'pan') return;
    isDragging.current = true;
    startPointer.current = { x: e.clientX, y: e.clientY };
    lastOffset.current = { ...offset };
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current || tool !== 'pan') return;
    const dx = e.clientX - startPointer.current.x;
    const dy = e.clientY - startPointer.current.y;
    setOffset({ x: lastOffset.current.x + dx, y: lastOffset.current.y + dy });
  };

  const handlePointerUp = () => { isDragging.current = false; };

  const handleWheel = (e) => {
    e.preventDefault();
    setScale(s => Math.min(Math.max(1, scale - e.deltaY * 0.001), 8));
  };

  const handleMapClick = (e) => {
    if (tool !== 'add') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const nextNum = markers.length + 1;
    const newMarker = { id: Date.now(), label: String(nextNum), x, y, type: 'Single', serial: '', name: '', isComplete: false };
    setMarkers([...markers, newMarker]);
    setActiveMarker(newMarker);
    setTool('pan');
  };

  const updateMarker = (field, value) => {
    setActiveMarker(prev => {
      const updated = { ...prev, [field]: value };
      updated.isComplete = !!(updated.serial && updated.name && updated.label);
      return updated;
    });
  };

  const saveMarkerDetails = () => {
    setMarkers(markers.map(m => m.id === activeMarker.id ? activeMarker : m));
    setActiveMarker(null);
  };

  const deleteMarker = () => {
    setMarkers(markers.filter(m => m.id !== activeMarker.id));
    setActiveMarker(null);
  };

  const handleSaveAndExport = async () => {
    setLoading(true);
    setStatusMsg({ type: 'loading', text: 'Saving...' });
    try {
      const payload = { company: form.company, branch: form.branch, markers: JSON.stringify(markers), recorder: user.username };
      await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'save_lcd_layout_v3', ...payload }) });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = form.image;
      await new Promise(res => img.onload = res);
      
      const MAX_SIZE = 3000;
      let w = img.width, h = img.height;
      if (w > MAX_SIZE || h > MAX_SIZE) {
        const ratio = Math.min(MAX_SIZE/w, MAX_SIZE/h);
        w *= ratio; h *= ratio;
      }

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const radius = Math.max(w * 0.012, 18);
      markers.forEach(m => {
        const px = (m.x / 100) * w;
        const py = (m.y / 100) * h;
        ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = m.isComplete ? 'black' : 'red'; ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = radius * 0.15; ctx.stroke();
        ctx.fillStyle = 'white'; ctx.font = `bold ${radius}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(m.label, px, py);
      });
      
      const link = document.createElement('a');
      link.download = `LCD_PLAN_${form.branch}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setStatusMsg({ type: 'success', text: 'Saved & Exported!' });
      setTimeout(() => { setStatusMsg(null); setStep('config'); }, 2000);
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Error' });
      setTimeout(() => setStatusMsg(null), 3000);
    } finally { setLoading(false); }
  };

  if (step === 'editor') return (
    <div className="animate-fade-in flex flex-col h-[85vh]">
      <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-2xl border shadow-sm z-10">
        <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
          <button onClick={() => setTool('pan')} className={`p-2 px-4 rounded-lg flex items-center gap-2 transition-all font-bold text-xs ${tool === 'pan' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}><Move size={16}/> PAN</button>
          <button onClick={() => setTool('add')} className={`p-2 px-4 rounded-lg flex items-center gap-2 transition-all font-bold text-xs ${tool === 'add' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}><Target size={16}/> ADD</button>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setScale(s => Math.min(8, s + 0.5))} className="p-2 bg-slate-50 rounded-xl"><ZoomIn size={18}/></button>
           <button onClick={() => setScale(s => Math.max(1, s - 0.5))} className="p-2 bg-slate-50 rounded-xl"><ZoomOut size={18}/></button>
           <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
           <button onClick={() => setStep('config')} className="p-2 bg-slate-50 rounded-xl text-slate-400"><X size={20}/></button>
        </div>
      </div>

      <div ref={containerRef} className={`flex-1 bg-slate-300 rounded-[3rem] border-4 border-white shadow-inner overflow-hidden relative touch-none select-none ${tool === 'pan' ? 'cursor-move' : 'cursor-crosshair'}`} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onWheel={handleWheel}>
        <div ref={mapRef} onClick={handleMapClick} className="relative origin-top-left transition-transform duration-75" style={{ width: '100%', aspectRatio: '16/9', backgroundImage: `url(${form.image})`, backgroundSize: '100% 100%', transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, pointerEvents: tool === 'add' ? 'auto' : 'none' }}>
          {markers.map(m => (
            <div key={m.id} onClick={(e) => { e.stopPropagation(); setActiveMarker(m); }} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center border-2 border-white shadow-xl cursor-pointer transition-all hover:scale-110 ${m.isComplete ? 'bg-black text-white' : 'bg-red-600 text-white animate-pulse'}`} style={{ left: `${m.x}%`, top: `${m.y}%`, width: '32px', height: '32px', transform: `translate(-50%, -50%) scale(${1/scale})`, pointerEvents: 'auto' }}>
              <span className="text-[10px] font-black">{m.label}</span>
            </div>
          ))}
        </div>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
           <div className={`px-4 py-2 rounded-full font-black text-[10px] uppercase shadow-xl transition-all ${tool === 'add' ? 'bg-emerald-600 text-white animate-bounce' : 'bg-white/90 text-slate-500'}`}>
             {tool === 'add' ? 'Tap map to place marker' : `Pan Mode (Zoom: x${scale.toFixed(1)})`}
           </div>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-2 relative">
        <Button onClick={handleSaveAndExport} loading={loading} className="w-full py-5 text-xl font-black uppercase tracking-widest shadow-xl">SAVE & DOWNLOAD IMAGE</Button>
      </div>

      {statusMsg && (
        <div className="fixed inset-x-6 top-24 z-[1000] animate-in slide-in-from-top-4">
           <div className={`p-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 border-2 ${statusMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-blue-200 text-blue-600'}`}>
              {statusMsg.type === 'loading' ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle2 size={20}/>}
              <span className="font-black text-sm uppercase tracking-tight">{statusMsg.text}</span>
           </div>
        </div>
      )}

      {activeMarker && (
        <div className="fixed inset-0 z-[600] bg-black/70 flex items-center justify-center p-6 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
           <Card className="w-full max-w-sm p-8 relative">
              <button onClick={() => setActiveMarker(null)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full"><X size={18}/></button>
              <h3 className="font-black text-2xl mb-6 flex items-center gap-3 text-slate-800">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${activeMarker.isComplete ? 'bg-black' : 'bg-red-600'} text-white shadow-lg`}>{activeMarker.label}</div>
                LCD DETAILS
              </h3>
              <div className="space-y-4 text-left">
                <Input label="LCD Number (Label)" value={activeMarker.label} onChange={e => updateMarker('label', e.target.value)} />
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Type</label>
                  <div className="flex gap-2">
                    {['Single', 'Dual'].map(t => (
                      <button key={t} onClick={() => updateMarker('type', t)} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeMarker.type === t ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <Input label="Serial" value={activeMarker.serial} onChange={e => updateMarker('serial', e.target.value)} rightElement={<button onClick={() => setIsScanning(true)} className="bg-blue-100 text-blue-600 p-3 rounded-xl"><Camera size={24}/></button>} />
                <Input label="Name" placeholder="e.g. Zone A-1" value={activeMarker.name} onChange={e => updateMarker('name', e.target.value)} />
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button onClick={deleteMarker} variant="danger" className="font-black uppercase">Delete</Button>
                  <Button onClick={saveMarkerDetails} className="font-black uppercase">Confirm</Button>
                </div>
              </div>
           </Card>
        </div>
      )}
      {isScanning && <ScannerModal onScan={(v) => { updateMarker('serial', v); setIsScanning(false); }} onClose={() => setIsScanning(false)} />}
    </div>
  );

  return (
    <div className="animate-fade-in">
      <Card className="p-8 mb-8 border-2 border-slate-50 shadow-md">
        <DynamicDropdown label="Company" value={form.company} onChange={v => setForm({...form, company: v})} options={companies} onAddNew={v => setCompanies([...companies, v])} />
        <Input label="Branch" placeholder="e.g. Bangna" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} />
        <div className="mb-6 text-left">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Plan</label>
          <div onClick={() => fileInputRef.current.click()} className="w-full aspect-video border-4 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50 cursor-pointer overflow-hidden relative group hover:border-blue-300 transition-all">
            {form.image ? <img src={form.image} className="w-full h-full object-contain" /> : <><Upload className="text-slate-300 mb-2 group-hover:text-blue-500 transition-colors" size={40} /><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center px-4">Upload plan image</span></>}
            <input type="file" hidden ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
          </div>
        </div>
        <Button disabled={!form.company || !form.branch || !form.image} onClick={() => setStep('editor')} className="w-full py-5 text-xl font-black uppercase shadow-xl tracking-tight">Open Editor</Button>
      </Card>
    </div>
  );
};

// --- Inventory Manager ---
const InventoryManager = ({ user, companies, setCompanies, stores, fetchMasterData }) => {
  const [subView, setSubView] = useState('list');
  const [form, setForm] = useState({ company: '', branch: '' });
  const [activeStore, setActiveStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [showAddProd, setShowAddProd] = useState(false);
  const [newProd, setNewProd] = useState({ code: '', name: '', delivered: '', used: '' });
  const [saving, setSaving] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(false);

  const startWorking = async (store) => {
    setActiveStore(store); setSubView('details'); setFetchingProducts(true);
    try {
      const res = await fetch(`${SCRIPT_URL}?action=get_latest_inventory&branch=${encodeURIComponent(store.branch)}&t=${Date.now()}`);
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        setProducts(data.data.map(p => ({ code: String(p.code), name: String(p.name), delivered: Number(p.delivered) || 0, used: '' })));
      } else { setProducts([]); }
    } catch (e) { setProducts([]); } finally { setFetchingProducts(false); }
  };

  const exportToPDF = (currentProducts) => {
    if (!window.jspdf) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(37, 99, 235); doc.text(`Daily Inventory Report`, 14, 20);
    doc.setFontSize(10); doc.setTextColor(100); doc.text(`Branch: ${activeStore.branch}`, 14, 30);
    doc.text(`Recorder: ${user.username} | Date: ${new Date().toLocaleString()}`, 14, 36);
    const tableData = currentProducts.filter(p => p.code !== 'MASTER_INIT').map(p => [p.code, p.name, p.delivered, p.used||0, p.delivered - (p.used||0)]);
    doc.autoTable({ startY: 45, head: [['Code', 'Name', 'Stock', 'Used', 'Balance']], body: tableData, theme: 'grid', headStyles: { fillColor: [37, 99, 235] } });
    doc.save(`Inventory_${activeStore.branch}.pdf`);
  };

  const saveDailyInventory = async () => {
    if (products.length === 0) return;
    setSaving(true);
    const payload = products.map(p => {
      const op = Number(p.delivered) || 0; const us = Number(p.used) || 0;
      return { company: activeStore.company, branch: activeStore.branch, code: p.code, name: p.name, delivered: op, used: us, remaining: op - us, recorder: user.username };
    });
    try {
      const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'save_inventory', payload }) });
      if ((await res.json()).status === 'success') { exportToPDF(products); alert('Stock Saved!'); setSubView('list'); fetchMasterData(); }
    } catch (e) { alert("Save failed"); } finally { setSaving(false); }
  };

  if (subView === 'details') return (
    <div className="animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-6 px-1 text-left">
        <div><h2 className="text-xl font-black text-slate-800">{activeStore.branch}</h2><p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{activeStore.company}</p></div>
        <button onClick={() => setSubView('list')} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-blue-600 transition-colors"><ArrowLeft size={20}/></button>
      </div>
      <Button onClick={() => setShowAddProd(true)} variant="secondary" className="w-full mb-6 py-4 text-xs tracking-widest uppercase font-black">ADD NEW ITEM</Button>
      {showAddProd && (
        <Card className="p-6 mb-6 bg-blue-50 border-blue-100 border-2 text-left text-slate-800">
          <Input label="Item Number" value={newProd.code} onChange={e => setNewProd({...newProd, code: e.target.value})} />
          <Input label="Item Name" value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} />
          <Input label="Delivered" type="number" value={newProd.delivered} onChange={e => setNewProd({...newProd, delivered: e.target.value})} />
          <div className="flex gap-2"><Button onClick={() => { if(!newProd.code) return; setProducts([...products, {...newProd, delivered: Number(newProd.delivered)||0}]); setShowAddProd(false); setNewProd({code:'',name:'',delivered:'',used:''}); }} className="flex-1">Add</Button><Button onClick={() => setShowAddProd(false)} variant="secondary" className="flex-1">Cancel</Button></div>
        </Card>
      )}
      <div className="space-y-3">
        {fetchingProducts ? <div className="py-20 text-center text-slate-300 font-bold animate-pulse uppercase tracking-widest text-sm">Syncing Stock...</div> : 
          products.filter(p => p.code !== 'MASTER_INIT').map((p, i) => {
            const balance = Number(p.delivered) - (Number(p.used) || 0);
            return (
              <Card key={i} className="p-4 border-l-8 border-l-blue-600 shadow-sm text-left">
                <div className="flex justify-between font-black text-slate-700 mb-2"><span>{p.name}</span><span className="text-xs text-slate-300">{p.code}</span></div>
                <div className="grid grid-cols-3 gap-2 text-center items-center">
                  <div className="bg-slate-50 p-2 rounded-xl text-center border"><span className="text-[9px] text-slate-400 font-bold block uppercase">STOCK</span><span className="font-black text-slate-800 text-lg">{p.delivered}</span></div>
                  <div className="px-1 text-center"><span className="text-[9px] text-slate-400 font-bold block mb-1 uppercase text-center">USED</span><input type="number" placeholder="0" className="w-full border-b-2 border-blue-100 font-black outline-none text-blue-600 text-center text-xl bg-transparent" value={p.used} onChange={e => { const up = [...products]; up[i].used = e.target.value; setProducts(up); }} /></div>
                  <div className="bg-emerald-50 p-2 rounded-xl text-center border"><span className="text-[9px] text-emerald-500 font-bold block uppercase">BALANCE</span><span className="font-black text-emerald-700 text-lg">{isNaN(balance) ? p.delivered : balance}</span></div>
                </div>
              </Card>
            );
          })}
      </div>
      <div className="fixed bottom-6 left-6 right-6 z-50"><Button onClick={saveDailyInventory} loading={saving} disabled={fetchingProducts} className="w-full py-5 text-lg font-black uppercase shadow-2xl tracking-widest">SAVE</Button></div>
    </div>
  );

  return (
    <div className="animate-fade-in text-center text-left">
      <Card className="p-6 mb-8 border-2 border-slate-50 shadow-md">
        <DynamicDropdown label="Company" value={form.company} onChange={v => setForm({...form, company: v})} options={companies} onAddNew={(v) => setCompanies([...companies, v])} />
        <Input label="Branch" placeholder="e.g. Bangna" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} />
        <Button onClick={async () => {
          if (!form.company || !form.branch) return alert('Select company and branch');
          setSaving(true);
          try {
            await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'save_inventory', payload: [{ company: form.company, branch: form.branch, code: 'MASTER_INIT', name: 'Init', delivered: 0, used: 0, remaining: 0, recorder: user.username }] }) });
            fetchMasterData(); startWorking(form);
          } catch (e) { alert("Error"); } finally { setSaving(false); }
        }} loading={saving} className="w-full mt-2 font-black uppercase shadow-lg">Create Store</Button>
      </Card>
      <div className="space-y-3">
        {stores.map((s, i) => (
          <Card key={i} onClick={() => startWorking(s)} className="p-5 flex justify-between items-center group border-2 border-slate-50 hover:border-blue-200 transition-all duration-300">
            <div className="text-left"><div className="text-[10px] font-black text-blue-600 uppercase mb-1">{String(s.company)}</div><div className="font-black text-slate-900 text-xl leading-tight text-left">{String(s.branch)}</div></div>
            <ChevronRight className="text-slate-200 group-hover:text-blue-600 transition-all" size={28}/>
          </Card>
        ))}
      </div>
    </div>
  );
};

// --- restored Layout Manager (Progress Drawing) ---
const LayoutManager = ({ user, stores }) => {
  const [subView, setSubView] = useState('list');
  const [activeStore, setActiveStore] = useState(null);
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [rects, setRects] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState(null);

  useEffect(() => {
    if (subView === 'editor' && image) {
      const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
      const img = new Image(); img.src = image;
      img.onload = () => {
        const maxWidth = window.innerWidth - 48; const scale = maxWidth / img.width;
        canvas.width = maxWidth; canvas.height = img.height * scale;
        render();
      };
      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.6)'; ctx.strokeStyle = '#059669'; ctx.lineWidth = 2;
        rects.forEach(r => { ctx.fillRect(r.x, r.y, r.w, r.h); ctx.strokeRect(r.x, r.y, r.w, r.h); });
        if (currentRect) { ctx.fillRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h); ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h); }
      };
      render();
    }
  }, [image, rects, currentRect, subView]);

  const handleSave = async () => {
    setLoading(true);
    const canvas = canvasRef.current; const editedData = canvas.toDataURL('image/png');
    try {
      await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'upload_layout', company: activeStore.company, branch: activeStore.branch, image: editedData, recorder: user.username }) });
      alert('Map saved successfully'); setSubView('list');
    } catch (e) { alert('Save error'); } finally { setLoading(false); }
  };

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.clientX || (e.touches && e.touches[0].clientX);
    const cy = e.clientY || (e.touches && e.touches[0].clientY);
    return { x: cx - rect.left, y: cy - rect.top };
  };

  if (subView === 'editor') return (
    <div className="animate-fade-in flex flex-col items-center pb-10">
      <div className="w-full flex justify-between items-center mb-6 px-1 text-left"><div><h2 className="text-xl font-black text-slate-800 text-left">{activeStore?.branch}</h2><p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest text-left">PROGRESS EDITOR</p></div><button onClick={() => setSubView('list')} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-blue-600 transition-colors"><ArrowLeft size={20}/></button></div>
      {!image ? (
        <div onClick={() => fileInputRef.current.click()} className="w-full aspect-video border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center bg-white cursor-pointer shadow-inner">
          <input type="file" hidden ref={fileInputRef} onChange={(e) => { const reader = new FileReader(); reader.onloadend = () => setImage(reader.result); reader.readAsDataURL(e.target.files[0]); }} />
          <Upload className="text-slate-300 mb-2" size={48} /><span className="text-slate-400 font-black uppercase text-xs text-center tracking-widest text-left">Tap to upload map</span>
        </div>
      ) : (
        <>
          <div className="relative border-4 border-white shadow-2xl rounded-[2rem] overflow-hidden bg-white">
            <canvas ref={canvasRef} onMouseDown={(e) => { setStartPos(getPos(e)); setIsDrawing(true); }} onMouseMove={(e) => { if(!isDrawing) return; const p = getPos(e); setCurrentRect({x: Math.min(startPos.x, p.x), y: Math.min(startPos.y, p.y), w: Math.abs(p.x-startPos.x), h: Math.abs(p.y-startPos.y)}); }} onMouseUp={() => { if(isDrawing && currentRect) setRects([...rects, currentRect]); setIsDrawing(false); setCurrentRect(null); }} onTouchStart={(e) => { e.preventDefault(); setStartPos(getPos(e)); setIsDrawing(true); }} onTouchMove={(e) => { e.preventDefault(); if(!isDrawing) return; const p = getPos(e); setCurrentRect({x: Math.min(startPos.x, p.x), y: Math.min(startPos.y, p.y), w: Math.abs(p.x-startPos.x), h: Math.abs(p.y-startPos.y)}); }} onTouchEnd={() => { if(isDrawing && currentRect) setRects([...rects, currentRect]); setIsDrawing(false); setCurrentRect(null); }} className="cursor-crosshair block" />
          </div>
          <div className="grid grid-cols-2 gap-3 w-full mt-8">
            <Button onClick={() => setRects([])} variant="secondary">Reset</Button>
            <Button onClick={handleSave} loading={loading} variant="success" className="col-span-2 py-5 text-lg font-black uppercase tracking-tight shadow-xl">SAVE PROGRESS</Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in space-y-3">
      {stores.map((s, i) => (
        <Card key={i} onClick={() => { setActiveStore(s); setSubView('editor'); setImage(''); setRects([]); }} className="p-5 flex justify-between items-center group border-2 border-slate-50 hover:border-orange-200 transition-all duration-300">
          <div className="text-left"><div className="text-[10px] font-black text-orange-600 uppercase mb-1 text-left">{String(s.company)}</div><div className="font-black text-slate-900 text-xl leading-tight text-left">{String(s.branch)}</div></div>
          <ChevronRight className="text-slate-200 group-hover:text-orange-500 transition-all" size={28}/>
        </Card>
      ))}
    </div>
  );
};

// --- Generic Form Manager ---
const FormManager = ({ type, user, companies, setCompanies }) => {
  const [f, setF] = useState({ company: '', branch: '', serial: '', name: '', phone: '', pos: '', lcdType: 'Single' });
  const [hist, setHist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [init, setInit] = useState(true);
  const sheets = { customer: 'Customer Info', borrow: 'Borrow List', damage: 'Damage List' };

  useEffect(() => { fetchHistory(); }, [type]);

  const fetchHistory = async () => {
    setInit(true);
    try {
      const res = await fetch(`${SCRIPT_URL}?action=get_history&sheetName=${encodeURIComponent(sheets[type])}&t=${Date.now()}`);
      const data = await res.json();
      if (data.status === 'success') setHist(data.data);
    } catch (e) {} finally { setInit(false); }
  };

  const handleSave = async () => {
    if (!f.company || !f.branch) return alert('Missing info');
    setLoading(true);
    try {
      const payload = type === 'customer' ? { ...f, item: `${f.name} - ${f.phone}`, recorder: user.username } : { ...f, item: f.name, recorder: user.username };
      const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'save_' + type, payload }) });
      if ((await res.json()).status === 'success') { alert('Saved!'); setF({ ...f, serial: '', name: '', phone: '', pos: '' }); fetchHistory(); }
    } catch (e) { alert('Error'); } finally { setLoading(false); }
  };

  const handleEdit = (item) => {
    const col1 = String(item[1] || ""); const col2 = String(item[2] || ""); const col3 = String(item[3] || ""); const col4 = String(item[4] || "");
    if (type === 'customer') {
      const parts = col3.split(' - ');
      setF({ ...f, company: col1, branch: col2, name: parts[0] || "", phone: parts[1] || "", pos: col4 });
    } else {
      setF({ ...f, company: col1, branch: col2, serial: col3, name: col4 });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="animate-fade-in pb-10 text-left">
      <Card className="p-6 mb-8 border-2 border-slate-50 shadow-md">
        <DynamicDropdown label="Company" value={f.company} onChange={v => setF({...f, company: v})} options={companies} onAddNew={v => setCompanies([...companies, v])} />
        <Input label="Branch" value={f.branch} onChange={e => setF({...f, branch: e.target.value})} />
        {type === 'customer' && <><Input label="Customer Name" value={f.name} onChange={e => setF({...f, name: e.target.value})} /><Input label="Phone Number" type="tel" value={f.phone} onChange={e => setF({...f, phone: e.target.value})} /><Input label="Position" value={f.pos} onChange={e => setF({...f, pos: e.target.value})} /></>}
        {(type === 'borrow' || type === 'damage') && <><Input label="SERIAL NUMBER" value={f.serial} onChange={e => setF({...f, serial: e.target.value})} rightElement={<button onClick={() => setIsScanning(true)} className="bg-blue-100 text-blue-600 p-3 rounded-xl hover:bg-blue-200"><Camera size={24}/></button>} /><Input label="EQUIPMENT NAME" value={f.name} onChange={e => setF({...f, name: e.target.value})} /></>}
        <Button onClick={handleSave} loading={loading} className="w-full mt-4 py-4 text-lg font-black uppercase tracking-tight shadow-md">SAVE</Button>
      </Card>
      <h3 className="font-black text-slate-800 mb-4 px-2 uppercase text-xs flex items-center gap-2 tracking-widest text-left"><History size={16}/> Recent Logs</h3>
      <div className="space-y-3">
        {init ? <div className="py-10 text-center font-bold animate-pulse uppercase text-slate-300 tracking-widest text-sm text-left">Syncing Log...</div> : 
          hist.map((h, i) => {
            const col1 = String(h[1] || ""); const col2 = String(h[2] || ""); const col3 = String(h[3] || "");
            const parts = col3.split(' - ');
            return (
              <Card key={i} className="p-4 border-l-4 border-l-slate-100 shadow-sm text-left">
                <div className="flex justify-between items-start pr-1 text-left">
                  <div className="flex-1 pr-4 text-left">
                    {type === 'customer' ? (
                      <>
                        <div className="font-black text-slate-800 text-sm text-left">{col1} ({col2})</div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 text-left">
                          {col3} {parts[1] && <a href={`tel:${parts[1]}`} className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full text-[9px] flex items-center gap-1 shadow-sm"><Phone size={10}/> CALL</a>}
                        </div>
                      </>
                    ) : (
                      <><div className="font-black text-slate-800 text-sm text-left">{col3}</div><div className="text-[10px] text-slate-400 uppercase font-bold mt-1 tracking-tighter text-left">{col1} • {col2} {h[4] ? `• ${String(h[4])}` : ''}</div></>
                    )}
                  </div>
                  <button onClick={() => handleEdit(h)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Edit3 size={18}/></button>
                </div>
              </Card>
            )
          })}
      </div>
    </div>
  );
};

// --- App Root ---
export default function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState(["Lotus's", "Makro"]);
  const [stores, setStores] = useState([]);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  useEffect(() => {
    const libs = async () => {
      try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js');
      } catch (e) {}
    };
    libs(); if (SCRIPT_URL) fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    if (!SCRIPT_URL) return;
    try {
      const [resC, resS] = await Promise.all([fetch(`${SCRIPT_URL}?action=get_master_companies&t=${Date.now()}`), fetch(`${SCRIPT_URL}?action=get_stores&t=${Date.now()}`)]);
      const dataC = await resC.json(); const dataS = await resS.json();
      if (dataC.status === 'success') setCompanies(dataC.data); if (dataS.status === 'success') setStores(dataS.data);
    } catch (e) {}
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch(`${SCRIPT_URL}?action=get_users&t=${Date.now()}`);
      const data = await res.json();
      const valid = data.data.find(u => u[0]?.toString().trim() === loginForm.username.trim() && u[1]?.toString().trim() === loginForm.password.trim());
      if (valid) { setUser({ username: String(loginForm.username) }); setView('home'); } else alert('Invalid Credentials');
    } catch (e) { alert('Connection error'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 selection:bg-blue-100 text-left">
      {view !== 'login' && (
        <header className="bg-white border-b sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3 text-left">
            {view !== 'home' && <button onClick={() => setView('home')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-blue-600 transition-colors"><ArrowLeft size={20}/></button>}
            <span className="font-black text-slate-900 text-lg uppercase tracking-widest text-left">{view === 'home' ? 'ESL Project' : view === 'lcd' ? 'LCD Install' : view}</span>
          </div>
          <button onClick={() => { setUser(null); setView('login'); }} className="text-slate-300 hover:text-red-500 p-2"><LogOut size={22} /></button>
        </header>
      )}
      <main className="p-6 max-w-2xl mx-auto">
        {view === 'login' ? (
          <div className="min-h-[80vh] flex items-center justify-center animate-fade-in text-center">
            <Card className="w-full max-w-sm p-10 rounded-[4rem] bg-white shadow-2xl border-b-8 border-blue-600 text-center">
              <div className="bg-blue-600 w-24 h-24 rounded-[3rem] flex items-center justify-center mx-auto mb-6 shadow-xl rotate-12 transition-transform hover:rotate-0 text-center"><Smartphone className="text-white -rotate-12" size={40} /></div><h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter text-center">Sign In</h1><p className="text-slate-400 font-bold uppercase text-[9px] mt-2 mb-8 tracking-widest opacity-60 text-center tracking-widest text-center">ESL PROJECT V2</p>
              <form onSubmit={handleLogin}><Input label="Username" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} /><Input label="Password" type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} /><Button type="submit" loading={loading} className="w-full py-4 mt-4 font-black uppercase shadow-lg">START</Button></form>
            </Card>
          </div>
        ) : view === 'home' ? (
          <div className="animate-fade-in text-left"><div className="mb-10 text-left px-2 text-left"><p className="text-slate-400 font-bold text-xs tracking-tight uppercase tracking-widest text-left">Welcome,</p><h2 className="text-blue-600 font-black text-sm uppercase leading-none tracking-widest text-left">{String(user?.username || "")}</h2></div><div className="grid grid-cols-2 gap-4 text-left">
            {[ { id: 'inventory', label: 'Inventory', icon: Store, color: 'bg-emerald-500' }, { id: 'lcd', label: 'LCD Install', icon: Monitor, color: 'bg-blue-500' }, { id: 'layout', label: 'Layout Progress', icon: MapIcon, color: 'bg-orange-500' }, { id: 'customer', label: 'Customer Info', icon: Users, color: 'bg-purple-500' }, { id: 'borrow', label: 'Borrow List', icon: History, color: 'bg-pink-500' }, { id: 'damage', label: 'Damage List', icon: AlertCircle, color: 'bg-red-500' } ].map(m => (
              <button key={m.id} onClick={() => setView(m.id)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-4 hover:shadow-xl active:scale-95 h-44 group text-center transition-all shadow-blue-50/50"><div className={`${m.color} p-4 rounded-2xl text-white shadow-md group-hover:scale-110 transition-transform`}><m.icon size={28}/></div><span className="font-black text-slate-800 leading-tight text-[11px] uppercase tracking-tighter text-left">{m.label}</span></button>
            ))}
          </div></div>
        ) : view === 'inventory' ? (
          <InventoryManager user={user} companies={companies} setCompanies={setCompanies} stores={stores} fetchMasterData={fetchMasterData} />
        ) : view === 'lcd' ? (
          <LCDImageEditor user={user} companies={companies} setCompanies={setCompanies} />
        ) : view === 'layout' ? (
          <LayoutManager user={user} stores={stores} />
        ) : (
          <FormManager type={view} user={user} companies={companies} setCompanies={setCompanies} />
        )}
      </main>
    </div>
  );
}