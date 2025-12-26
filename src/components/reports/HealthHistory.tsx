import React, { useEffect, useState } from 'react';
import { 
  Calendar, Syringe, ShieldCheck, Clock, Trash2, 
  AlertCircle, CheckCircle2, Edit3, X, ClipboardPlus 
} from 'lucide-react';
import { api } from '../../services/api';
import { Toast } from '../../utils/alerts';

const HealthHistory = ({ mascotaId }: { mascotaId: string }) => {
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<any>(null); // Estado para el modal de edición

  const cargarHistorial = async () => {
    try {
      const res = await api.getHistorialSalud(mascotaId);
      setEventos(res.data);
    } catch (e) {
      console.error("Error al cargar historial de salud");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mascotaId) cargarHistorial();
  }, [mascotaId]);

  const handleBorrar = (id: string) => {
    Toast.fire({
      title: '¿Eliminar registro?',
      text: "Esta acción quitará el evento de la cartilla.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'SÍ, BORRAR',
      cancelButtonText: 'CANCELAR',
      confirmButtonColor: '#ef4444'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await api.borrarEventoSalud(id);
        cargarHistorial();
        Toast.fire({ icon: 'success', title: 'Eliminado' });
      }
    });
  };

  const handleGuardarEdicion = async () => {
    try {
      await api.actualizarEventoSalud(editando.id, editando);
      setEditando(null);
      cargarHistorial();
      Toast.fire({ icon: 'success', title: 'Cambios guardados' });
    } catch (e) {
      Toast.fire({ icon: 'error', title: 'Error al actualizar' });
    }
  };

  const proximos = eventos.filter(e => 
    e.completado === true && 
    e.proximaFecha && 
    new Date(e.proximaFecha) >= new Date()
  ).sort((a, b) => new Date(a.proximaFecha).getTime() - new Date(b.proximaFecha).getTime());

  if (loading) return <div className="p-8 text-center font-bold text-slate-400">Cargando cartilla...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-left">
      
      {/* SECCIÓN DE PRÓXIMOS REFUERZOS */}
      {proximos.length > 0 && (
        <div className="bg-orange-50 p-6 rounded-[2rem] border-2 border-orange-100">
          <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock size={14} /> Próximos Vencimientos
          </h4>
          <div className="space-y-3">
            {proximos.slice(0, 2).map((p, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
                    {p.tipo === 'Vacuna' ? <Syringe size={18} /> : <ShieldCheck size={18} />}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm leading-none">{p.nombre}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Refuerzo: {p.proximaFecha}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-orange-600 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase">
                    {Math.ceil((new Date(p.proximaFecha).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} días
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HISTORIAL COMPLETO */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 relative">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <span className="text-emerald-500">🛡️</span> Historial Sanitario
        </h3>
        
        {eventos.length === 0 ? (
          <p className="text-center text-slate-400 font-bold italic py-10">No hay registros aún.</p>
        ) : (
          <div className="space-y-6">
            {eventos.map((e, i) => (
              <div key={i} className={`flex gap-4 group transition-opacity ${!e.completado ? 'opacity-70' : ''}`}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                    e.completado ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400 border-dashed'
                  }`}>
                    {e.completado ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                  </div>
                  <div className="w-0.5 h-full bg-slate-100 group-last:hidden"></div>
                </div>
                
                <div className="pb-4 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase">
                      {e.completado ? `Aplicada: ${e.fechaAplicacion}` : `Programada: ${e.fechaAplicacion}`}
                    </p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditando(e)} className="p-1.5 text-slate-300 hover:text-emerald-600 transition-colors"><Edit3 size={14}/></button>
                      <button onClick={() => handleBorrar(e.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  
                  <h5 className="font-black text-slate-800 text-base leading-none mb-1">{e.nombre}</h5>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase">{e.tipo}</span>
                    {e.completado && e.proximaFecha && (
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tight">• Refuerzo: {e.proximaFecha}</span>
                    )}
                    {!e.completado && <span className="bg-slate-200 text-slate-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Pendiente</span>}
                  </div>

                  {e.notas && <p className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-bold text-slate-500 italic">"{e.notas}"</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE EDICIÓN (Reusando estilo del Scanner) */}
      {editando && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative text-left animate-in zoom-in-95">
            <button onClick={() => setEditando(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"><X size={24} /></button>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600"><ClipboardPlus size={24} /></div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">Editar Registro</h3>
              </div>
              <button 
                onClick={() => setEditando({...editando, completado: !editando.completado})}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${editando.completado ? 'bg-emerald-500' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${editando.completado ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Nombre</p>
                <input className="w-full bg-transparent font-black text-slate-800 outline-none border-b-2 border-slate-200 focus:border-emerald-500" value={editando.nombre} onChange={e => setEditando({...editando, nombre: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Aplicación</p>
                  <input type="date" className="w-full bg-transparent text-xs font-black text-slate-700 outline-none" value={editando.fechaAplicacion} onChange={e => setEditando({...editando, fechaAplicacion: e.target.value})} />
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Refuerzo</p>
                  <input type="date" className="w-full bg-transparent text-xs font-black text-slate-700 outline-none" value={editando.proximaFecha} onChange={e => setEditando({...editando, proximaFecha: e.target.value})} />
                </div>
              </div>
            </div>

            <button onClick={handleGuardarEdicion} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg uppercase text-xs tracking-widest">Guardar Cambios</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthHistory;