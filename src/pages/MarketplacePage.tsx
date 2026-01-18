import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShoppingBag, Search, X as CloseIcon, Plus, RefreshCw, ArrowLeft } from 'lucide-react';
import { api } from '@/services/api';
import type { ProductoDTO, UserDTO } from '@/types/api.types';
import ProductoCard from '@/components/Marketplace/ProductoCard';
import ProductoModal from '@/components/Marketplace/ProductoModal';

interface MarketplacePageProps {
  user: UserDTO;
  onBack: () => void;
}

type EspecieType = 'perro' | 'gato' | null;

export default function MarketplacePage({ user, onBack }: MarketplacePageProps) {
  const [productos, setProductos] = useState<ProductoDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeEspecie, setActiveEspecie] = useState<EspecieType>(null);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getProductos(searchTerm || undefined);
      setProductos(res.data);
    } catch (error) {
      console.error("Error al cargar productos", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProductos();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleEspecieClick = (especie: EspecieType) => {
    setActiveEspecie(prev => prev === especie ? null : especie);
  };

  const productosFiltrados = useMemo(() => {
    if (!activeEspecie) return productos;
    const term = activeEspecie.toLowerCase();
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(term) || 
      p.descripcion?.toLowerCase().includes(term) ||
      p.categoria.toLowerCase().includes(term)
    );
  }, [productos, activeEspecie]);

  return (
    <div className="min-h-screen bg-slate-50 animate-in slide-in-from-right duration-300">
      <header className="bg-white p-4 border-b sticky top-0 z-40 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 p-2 rounded-xl shadow-lg">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Marketplace</h1>
          </div>
        </div>
        <button 
          onClick={handleRefresh}
          className={`p-2 text-slate-400 hover:text-orange-500 transition-all ${isRefreshing ? 'animate-spin text-orange-500' : ''}`}
        >
          <RefreshCw size={18} />
        </button>
      </header>

      <main className="p-4 space-y-6 max-w-5xl mx-auto">
        <div className="flex gap-2 items-center max-w-md mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 h-14 bg-white border-none rounded-2xl text-xs font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <CloseIcon size={16} />
              </button>
            )}
          </div>

          <div className="flex gap-1 bg-white p-1 rounded-2xl shadow-sm h-14 items-center">
            <button 
              onClick={() => handleEspecieClick('perro')}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activeEspecie === 'perro' ? 'bg-orange-500 text-white shadow-md scale-105' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <span className="text-lg">🐶</span>
            </button>
            <button 
              onClick={() => handleEspecieClick('gato')}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activeEspecie === 'gato' ? 'bg-orange-500 text-white shadow-md scale-105' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <span className="text-lg">🐱</span>
            </button>
          </div>
        </div>

        <div className="pb-20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando productos...</p>
            </div>
          ) : productosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {productosFiltrados.map(p => (
                <ProductoCard key={p.id} producto={p} currentUser={user} />
              ))}
            </div>
          ) : (
            <div className="w-full py-20 px-6 bg-white rounded-4xl border-2 border-dashed border-slate-200 flex flex-col items-center text-center gap-4 max-w-md mx-auto">
              <div className="p-4 rounded-3xl bg-orange-50 text-orange-500">
                <ShoppingBag size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="font-black uppercase text-slate-800 text-sm tracking-tight">Sin productos</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-50">
                  {searchTerm || activeEspecie ? "No hay resultados para tus filtros." : "Todavía no hay productos publicados."}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-orange-600 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-transform z-50"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      {isModalOpen && (
        <ProductoModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchProductos} 
        />
      )}
    </div>
  );
}