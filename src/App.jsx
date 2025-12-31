import React, { useState, useEffect, useRef } from 'react';
import { 
  LogIn, Store, Monitor, Map as MapIcon, Users, 
  Plus, Save, Download, ArrowLeft, LogOut, 
  ScanLine, AlertCircle, ChevronRight, FileText, 
  Smartphone, Camera, History, Edit3, Trash2, Loader2, CheckCircle2,
  Image as ImageIcon, Upload, MousePointer2
} from 'lucide-react';

/**
 * IMPORTANT: Replace with your NEW Web App URL after re-deploying the backend.
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

const Card = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden ${className} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-all duration-200' : ''}`}
  >
    {children}
  </div>
);

const Input = ({ label, icon: Icon, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />}
      <input 
        {...props} 
        className={`w-full py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 focus:bg-white ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
      />
    </div>
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false, loading = false, type = "button" }) => {
  const variants = {
    primary: "bg-blue-600 text-white shadow-blue-100",
    success: "bg-emerald-600 text-white shadow-emerald-100",
    secondary: "bg-slate-100 text-slate-600 shadow-none",
    danger: "bg-red-50 text-red-600 border border-red-100 shadow-none"
  };
  return (
    <button 
      type={type}
      disabled={disabled || loading}
      onClick={onClick} 
      className={`px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${variants[variant]} ${className} ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
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
      onAddNew(nv);
      onChange(nv);
      setAdd(false);
      setNv('');
    } catch (e) {
      alert("Failed to save company");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">{label}</label>
      {add ? (
        <div className="flex gap-2">
          <input autoFocus className="flex-1 py-3 px-4 rounded-xl border-2 border-blue-500 outline-none shadow-sm" placeholder="Company Name..." value={nv} onChange={e => setNv(e.target.value)} />
          <Button onClick={handleAdd} loading={adding} className="!px-3">Add</Button>
          <Button onClick={() => setAdd(false)} variant="secondary" className="!px-3">X</Button>
        </div>
      ) : (
        <select value={value} onChange={e => e.target.value === 'NEW' ? setAdd(true) : onChange(e.target.value)} className="w-full py-3 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none shadow-sm appearance-none font-bold text-slate-700">
          <option value="">Select Company</option>
          {options.map((o, idx) => <option key={`${idx}-${o}`} value={o}>{o}</option>)}
          <option value="NEW" className="text-blue-600 font-black">+ Add New Company</option>
        </select>
      )}
    </div>
  );
};

// --- Inventory Section ---
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
    setActiveStore(store);
    setSubView('details');
    setFetchingProducts(true);
    try {
      // FORCE NO-CACHE fetching to get the REAL latest balance
      const res = await fetch(`${SCRIPT_URL}?action=get_latest_inventory&branch=${encodeURIComponent(store.branch)}&t=${Date.now()}`);
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        setProducts(data.data.map(p => ({ 
          code: p.code, 
          name: p.name, 
          delivered: Number(p.delivered) || 0, // This IS the 'Remaining' from last session
          used: '' 
        })));
      } else { setProducts([]); }
    } catch (e) { setProducts([]); } finally { setFetchingProducts(false); }
  };

  const saveDailyInventory = async () => {
    if (products.length === 0) return alert('Nothing to save');
    setSaving(true);
    const payload = products.map(p => {
      const opening = Number(p.delivered) || 0;
      const usedToday = Number(p.used) || 0;
      return {
        company: activeStore.company, branch: activeStore.branch, 
        code: p.code, name: p.name, delivered: opening, 
        used: usedToday, remaining: opening - usedToday, 
        recorder: user.username
      };
    });
    try {
      const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'save_inventory', payload }) });
      if ((await res.json()).status === 'success') {
        alert('Stock updated! The current balance will be your next opening stock.');
        setSubView('list');
        fetchMasterData();
      }
    } catch (e) { alert("Network error"); } finally { setSaving(false); }
  };

  const exportToPDF = () => {
    if (!window.jspdf) return alert('PDF Library not ready');
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235);
      doc.text(`Daily Inventory Report`, 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Store: ${activeStore.branch} (${activeStore.company})`, 14, 30);
      doc.text(`Recorded by: ${user.username}`, 14, 36);
      doc.text(`Sync Time: ${new Date().toLocaleString()}`, 14, 42);
      const tableData = products.filter(p => p.code !== 'MASTER_INIT').map(p => [
        p.code, p.name, Number(p.delivered), Number(p.used)||0, Number(p.delivered) - (Number(p.used)||0)
      ]);
      doc.autoTable({ 
        startY: 50, 
        head: [['Code', 'Product', 'Opening', 'Used Today', 'Balance']], 
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] }
      });
      doc.save(`Inventory_${activeStore.branch}.pdf`);
    } catch (err) { alert('PDF Export failed'); }
  };

  if (subView === 'details') return (
    <div className="animate-fade-in pb-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 leading-tight">{activeStore.branch}</h2>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{activeStore.company}</p>
        </div>
        <button onClick={() => setSubView('list')} className="p-2 bg-slate-100 rounded-full"><ArrowLeft size={20}/></button>
      </div>
      <div className="flex gap-2 mb-6">
        <Button onClick={() => setShowAddProd(true)} variant="secondary" className="flex-1 text-xs">ADD NEW ITEM</Button>
        <Button onClick={exportToPDF} variant="secondary" className="flex-1 text-xs">EXPORT PDF</Button>
      </div>
      {showAddProd && (
        <Card className="p-5 mb-4 bg-blue-50 border-blue-200 border-2">
          <Input label="Code" value={newProd.code} onChange={e => setNewProd({...newProd, code: e.target.value})} />
          <Input label="Name" value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} />
          <Input label="Opening Stock" type="number" value={newProd.delivered} onChange={e => setNewProd({...newProd, delivered: e.target.value})} />
          <div className="flex gap-2">
            <Button onClick={() => { if(!newProd.code||!newProd.name) return; setProducts([...products, {...newProd, delivered: Number(newProd.delivered)||0}]); setShowAddProd(false); setNewProd({code:'',name:'',delivered:'',used:''}); }} className="flex-1">Add</Button>
            <Button onClick={() => setShowAddProd(false)} variant="secondary" className="flex-1">Cancel</Button>
          </div>
        </Card>
      )}
      <div className="space-y-3 mb-28">
        {fetchingProducts ? <div className="py-20 text-center text-slate-400 font-bold animate-pulse">Syncing store records...</div> : 
          products.filter(p => p.code !== 'MASTER_INIT').map((p, i) => {
            const balance = Number(p.delivered) - (Number(p.used) || 0);
            return (
              <Card key={i} className="p-4 border-l-8 border-l-blue-600">
                <div className="flex justify-between font-black text-slate-700 mb-2"><span>{p.name}</span><span className="text-xs text-slate-300">{p.code}</span></div>
                <div className="grid grid-cols-3 gap-2 text-center items-center">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-400 block font-black uppercase">Opening</span>
                    <span className="font-black text-slate-800 text-lg">{p.delivered}</span>
                  </div>
                  <div className="px-1 border-x border-slate-100">
                    <span className="text-[9px] text-slate-400 block font-black uppercase mb-1">Used</span>
                    <input type="number" placeholder="0" className="w-full border-b-2 border-blue-100 font-black outline-none text-blue-600 text-center text-xl bg-transparent" value={p.used} onChange={e => { const up = [...products]; up[i].used = e.target.value; setProducts(up); }} />
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-xl">
                    <span className="text-[9px] text-emerald-500 block font-black uppercase">Balance</span>
                    <span className="font-black text-emerald-700 text-lg">{isNaN(balance) ? p.delivered : balance}</span>
                  </div>
                </div>
              </Card>
            );
          })
        }
      </div>
      <div className="fixed bottom-6 left-6 right-6 z-10"><Button onClick={saveDailyInventory} loading={saving} disabled={fetchingProducts} className="w-full py-5 text-xl font-black uppercase tracking-widest shadow-2xl">COMPLETE & SAVE</Button></div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <Card className="p-6 mb-8 border-2 border-slate-50 shadow-md">
        <DynamicDropdown label="Company" value={form.company} onChange={v => setForm({...form, company: v})} options={companies} onAddNew={(v) => setCompanies([...companies, v])} />
        <Input label="Branch Name" placeholder="e.g. Bangna" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} />
        <Button onClick={async () => {
          if (!form.company || !form.branch) return alert('Fill required fields');
          setSaving(true);
          const payload = [{ company: form.company, branch: form.branch, code: 'MASTER_INIT', name: 'Init', delivered: 0, used: 0, remaining: 0, recorder: user.username }];
          try {
            await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'save_inventory', payload }) });
            await fetchMasterData();
            startWorking(form);
          } catch (e) { alert("Network error"); } finally { setSaving(false); }
        }} loading={saving} className="w-full mt-2 font-black uppercase">Open Store Inventory</Button>
      </Card>
      <h3 className="font-black text-slate-800 mb-4 px-2 uppercase text-lg">Stores List</h3>
      <div className="space-y-3">
        {stores.map((s, i) => (
          <Card key={i} onClick={() => startWorking(s)} className="p-5 flex justify-between items-center group bg-white border-2 border-slate-50 hover:border-blue-200 transition-all">
            <div><div className="text-[10px] font-black text-blue-600 uppercase mb-1">{s.company}</div><div className="font-black text-slate-900 text-xl leading-tight">{s.branch}</div></div>
            <ChevronRight className="text-slate-200 group-hover:text-blue-600 transition-all" size={28}/>
          </Card>
        ))}
      </div>
    </div>
  );
};

// --- Layout Manager with Flexible Canvas Editor ---
const LayoutManager = ({ user, companies, setCompanies, stores }) => {
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
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = image;
      img.onload = () => {
        const maxWidth = window.innerWidth - 48;
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        render();
      };

      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.6)'; // Green 60% Transparency
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2;
        rects.forEach(r => {
          ctx.fillRect(r.x, r.y, r.w, r.h);
          ctx.strokeRect(r.x, r.y, r.w, r.h);
        });
        if (currentRect) {
          ctx.fillRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
          ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
        }
      };
      render();
    }
  }, [image, rects, currentRect, subView]);

  const getEventPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => {
    const pos = getEventPos(e);
    setStartPos(pos);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const pos = getEventPos(e);
    setCurrentRect({
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      w: Math.abs(pos.x - startPos.x),
      h: Math.abs(pos.y - startPos.y)
    });
  };

  const stopDrawing = () => {
    if (isDrawing && currentRect && currentRect.w > 2) {
      setRects([...rects, currentRect]);
    }
    setIsDrawing(false);
    setCurrentRect(null);
  };

  const handleSave = async () => {
    setLoading(true);
    // Draw Timestamp
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white'; ctx.fillRect(0, canvas.height-20, canvas.width, 20);
    ctx.fillStyle = 'black'; ctx.font = 'bold 10px sans-serif';
    ctx.fillText(`Saved: ${new Date().toLocaleString()} | by ${user.username}`, 10, canvas.height - 5);
    
    const editedData = canvas.toDataURL('image/png');
    const payload = { company: activeStore.company, branch: activeStore.branch, image: editedData, recorder: user.username };
    try {
      await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'upload_layout', ...payload }) });
      alert('Layout archived successfully');
      setSubView('list');
    } catch (e) { alert('Save failed'); } finally { setLoading(false); }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `Layout_${activeStore?.branch}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  if (subView === 'editor') return (
    <div className="animate-fade-in flex flex-col items-center pb-10">
      <div className="w-full flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-800">{activeStore?.branch}</h2>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Flexible Layout Editor</p>
        </div>
        <button onClick={() => setSubView('list')} className="p-2 bg-slate-100 rounded-full"><ArrowLeft size={20}/></button>
      </div>

      {!image ? (
        <div onClick={() => fileInputRef.current.click()} className="w-full aspect-video border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center bg-white cursor-pointer hover:border-blue-300 shadow-inner">
          <input type="file" hidden ref={fileInputRef} onChange={(e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result);
            reader.readAsDataURL(file);
          }} />
          <Upload className="text-slate-300 mb-2" size={48} />
          <span className="text-slate-400 font-black uppercase text-xs">Tap to upload floor plan</span>
        </div>
      ) : (
        <>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest text-center">Drag on map to draw green progress areas</p>
          <div className="relative border-4 border-white shadow-2xl rounded-[2rem] overflow-hidden bg-white">
            <canvas 
              ref={canvasRef} 
              onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
              onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
              onTouchMove={(e) => { e.preventDefault(); draw(e); }}
              onTouchEnd={(e) => { e.preventDefault(); stopDrawing(); }}
              className="cursor-crosshair block" style={{ touchAction: 'none' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 w-full mt-8">
            <Button onClick={() => setRects([])} variant="secondary">Clear</Button>
            <Button onClick={handleDownload} variant="secondary"><Download size={18}/> Download</Button>
            <Button onClick={handleSave} loading={loading} variant="success" className="col-span-2 py-5 text-lg font-black uppercase tracking-widest">SAVE & ARCHIVE</Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in">
       <div className="mb-8 p-6 bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 uppercase mb-4 text-lg">Layout Progress Editor</h3>
          <p className="text-slate-400 text-xs font-bold leading-relaxed">Draw green markers on the floor plan to mark installation zones as completed.</p>
       </div>
       <div className="space-y-3">
        {stores.map((s, i) => (
          <Card key={i} onClick={() => { setActiveStore(s); setSubView('editor'); setImage(''); setRects([]); }} className="p-5 flex justify-between items-center group border-2 border-slate-50 hover:border-orange-200 transition-all">
            <div><div className="text-[10px] font-black text-orange-600 uppercase mb-1">{s.company}</div><div className="font-black text-slate-900 text-xl leading-tight">{s.branch}</div></div>
            <ChevronRight className="text-slate-200 group-hover:text-orange-500 transition-all" size={28}/>
          </Card>
        ))}
      </div>
    </div>
  );
};

// --- Form Manager (LCD, Customer, Borrow, Damage) ---
const FormManager = ({ type, user, companies, setCompanies }) => {
  const [f, setF] = useState({ company: '', branch: '', serial: '', name: '', phone: '', pos: '', lcdType: 'Single' });
  const [hist, setHist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [init, setInit] = useState(true);

  const sheets = { lcd: 'LCD Install', customer: 'Customer Info', borrow: 'Borrow List', damage: 'Damage List' };

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
    if (!f.company || !f.branch) return alert('Required fields missing');
    setLoading(true);
    const action = 'save_' + type;
    const payload = { ...f, item: f.name, recorder: user.username };
    try {
      const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action, payload }) });
      if ((await res.json()).status === 'success') {
        alert('Saved!'); setF({ ...f, serial: '', name: '', phone: '', pos: '' }); fetchHistory();
      }
    } catch (e) { alert('Save failed'); } finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in pb-10">
      <Card className="p-6 mb-6 border-2 border-slate-50 shadow-md">
        <DynamicDropdown label="Company" value={f.company} onChange={v => setF({...f, company: v})} options={companies} onAddNew={v => setCompanies([...companies, v])} />
        <Input label="Branch" placeholder="Branch name..." value={f.branch} onChange={e => setF({...f, branch: e.target.value})} />

        {type === 'lcd' && (
          <>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Config</label>
              <div className="flex gap-2">
                {['Single', 'Dual'].map(t => (
                  <button key={t} onClick={() => setF({...f, lcdType: t})} className={`flex-1 py-3 rounded-xl font-bold transition-all ${f.lcdType === t ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>{t}</button>
                ))}
              </div>
            </div>
            <Input label="Serial Number" value={f.serial} onChange={e => setF({...f, serial: e.target.value})} />
          </>
        )}

        {type === 'customer' && (
          <>
            <Input label="Contact Name" value={f.name} onChange={e => setF({...f, name: e.target.value})} />
            <Input label="Phone" value={f.phone} onChange={e => setF({...f, phone: e.target.value})} />
            <Input label="Position" value={f.pos} onChange={e => setF({...f, pos: e.target.value})} />
          </>
        )}

        {(type === 'borrow' || type === 'damage') && (
          <>
            <Input label="Asset ID" value={f.serial} onChange={e => setF({...f, serial: e.target.value})} />
            <Input label="Item Name" value={f.name} onChange={e => setF({...f, name: e.target.value})} />
          </>
        )}

        <Button onClick={handleSave} loading={loading} className="w-full mt-2 font-black uppercase tracking-widest shadow-blue-100">Submit Record</Button>
      </Card>

      <h3 className="font-black text-slate-800 mb-4 px-2 uppercase text-lg flex items-center gap-2"><History size={20}/> History Log</h3>
      <div className="space-y-2">
        {init ? <div className="py-10 text-center font-bold text-slate-300 animate-pulse tracking-widest uppercase">Syncing...</div> : 
          hist.map((h, i) => (
            <Card key={i} className="p-4 flex justify-between items-center border-slate-100 bg-white">
              <div className="flex-1 pr-4">
                <div className="font-black text-slate-800 truncate">
                  {type === 'lcd' ? `Serial: ${h[3]}` : (type === 'customer' ? `Name: ${h[3]}` : `Asset: ${h[3]}`)}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                  {type === 'lcd' ? `${h[2]} • ${h[4]}` : (type === 'customer' ? `${h[2]} • ${h[4]}` : `${h[2]} • ${h[4]}`)}
                </div>
              </div>
              <div className="text-[10px] font-bold text-blue-500 text-right uppercase whitespace-nowrap leading-tight">
                {new Date(h[0]).toLocaleDateString()}<br/>{new Date(h[0]).toLocaleTimeString()}
              </div>
            </Card>
          ))
        }
      </div>
    </div>
  );
};

// --- Main App Root ---
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
    libs();
    if (SCRIPT_URL) fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    if (!SCRIPT_URL) return;
    try {
      const [resC, resS] = await Promise.all([
        fetch(`${SCRIPT_URL}?action=get_master_companies&t=${Date.now()}`),
        fetch(`${SCRIPT_URL}?action=get_stores&t=${Date.now()}`)
      ]);
      const dataC = await resC.json();
      const dataS = await resS.json();
      if (dataC.status === 'success') setCompanies(dataC.data);
      if (dataS.status === 'success') setStores(dataS.data);
    } catch (e) {}
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${SCRIPT_URL}?action=get_users&t=${Date.now()}`);
      const data = await res.json();
      const valid = data.data.find(u => u[0]?.toString().trim() === loginForm.username.trim() && u[1]?.toString().trim() === loginForm.password.trim());
      if (valid) { setUser({ username: loginForm.username }); setView('home'); }
      else alert('Login failed');
    } catch (e) { alert('Connection error'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 selection:bg-blue-100">
      {view !== 'login' && (
        <header className="bg-white border-b sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            {view !== 'home' && <button onClick={() => setView('home')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-blue-600"><ArrowLeft size={20}/></button>}
            <span className="font-black text-slate-900 text-xl uppercase tracking-widest">{view === 'home' ? 'Operational Dashboard' : view}</span>
          </div>
          <button onClick={() => { setUser(null); setView('login'); }} className="text-slate-300 hover:text-red-500 p-2"><LogOut size={22} /></button>
        </header>
      )}

      <main className="p-6 max-w-2xl mx-auto">
        {view === 'login' ? (
          <div className="min-h-[80vh] flex items-center justify-center">
            <Card className="w-full max-w-sm p-10 rounded-[4rem] bg-white shadow-2xl border-b-8 border-blue-600 animate-slide-up">
              <div className="text-center mb-10">
                <div className="bg-blue-600 w-24 h-24 rounded-[3rem] flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-12 transition-transform hover:rotate-0">
                  <Smartphone className="text-white -rotate-12" size={40} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Sign In</h1>
                <p className="text-slate-400 font-bold uppercase text-[10px] mt-2 opacity-50 tracking-widest">Inventory Management System</p>
              </div>
              <form onSubmit={handleLogin}>
                <Input label="Username" placeholder="Username..." value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
                <Input label="Password" type="password" placeholder="Password..." value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
                <Button type="submit" loading={loading} className="w-full py-5 mt-4 text-lg font-black uppercase tracking-widest">Launch Dashboard</Button>
              </form>
            </Card>
          </div>
        ) : view === 'home' ? (
          <div className="animate-fade-in">
            <div className="mb-10 font-black text-slate-900 text-4xl leading-tight tracking-tight uppercase">Operational Center,<br/><span className="text-blue-600 block">{user?.username}!</span></div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'inventory', label: 'Inventory', icon: Store, color: 'bg-emerald-500' },
                { id: 'lcd', label: 'LCD Install', icon: Monitor, color: 'bg-blue-500' },
                { id: 'layout', label: 'Layout Progress', icon: MapIcon, color: 'bg-orange-500' },
                { id: 'customer', label: 'Customer Info', icon: Users, color: 'bg-purple-500' },
                { id: 'borrow', label: 'Borrow List', icon: History, color: 'bg-pink-500' },
                { id: 'damage', label: 'Damage List', icon: AlertCircle, color: 'bg-red-500' },
              ].map(m => (
                <button key={m.id} onClick={() => setView(m.id)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-2xl active:scale-95 transition-all group h-44">
                  <div className={`${m.color} p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}><m.icon size={28}/></div>
                  <span className="font-black text-slate-800 text-left leading-tight text-xs uppercase tracking-tighter">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : view === 'inventory' ? (
          <InventoryManager user={user} companies={companies} setCompanies={setCompanies} stores={stores} fetchMasterData={fetchMasterData} />
        ) : view === 'layout' ? (
          <LayoutManager user={user} companies={companies} setCompanies={setCompanies} stores={stores} />
        ) : (
          <FormManager type={view} user={user} companies={companies} setCompanies={setCompanies} />
        )}
      </main>
    </div>
  );
}