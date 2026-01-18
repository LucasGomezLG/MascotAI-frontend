import {create} from 'zustand';

// --- TIPOS ---
type ItemToDelete = { id: string; tipo: 'perdido' | 'adopcion' | 'refugio' };

// --- INTERFAZ DEL STORE ---
interface UIState {
  // Estado de los modales
  isPetModalOpen: boolean;
  isLostPetModalOpen: boolean;
  isAdoptionModalOpen: boolean;
  isRefugioModalOpen: boolean;
  isLogoutModalOpen: boolean;
  isSubscriptionModalOpen: boolean;
  isAlertsOpen: boolean;
  
  // Estado para otras UI
  zoomedPhoto: string | null;
  itemToDelete: ItemToDelete | null;

  // Acciones para modificar el estado
  togglePetModal: (isOpen: boolean) => void;
  toggleLostPetModal: (isOpen: boolean) => void;
  toggleAdoptionModal: (isOpen: boolean) => void;
  toggleRefugioModal: (isOpen: boolean) => void;
  toggleLogoutModal: (isOpen: boolean) => void;
  toggleSubscriptionModal: (isOpen: boolean) => void;
  toggleAlerts: (isOpen: boolean) => void;
  
  setZoomedPhoto: (photo: string | null) => void;
  setItemToDelete: (item: ItemToDelete | null) => void;
}

// --- IMPLEMENTACIÓN DEL STORE ---
export const useUIStore = create<UIState>((set) => ({
  // Estado inicial
  isPetModalOpen: false,
  isLostPetModalOpen: false,
  isAdoptionModalOpen: false,
  isRefugioModalOpen: false,
  isLogoutModalOpen: false,
  isSubscriptionModalOpen: false,
  isAlertsOpen: false,
  zoomedPhoto: null,
  itemToDelete: null,

  // Implementación de las acciones
  togglePetModal: (isOpen) => set({ isPetModalOpen: isOpen }),
  toggleLostPetModal: (isOpen) => set({ isLostPetModalOpen: isOpen }),
  toggleAdoptionModal: (isOpen) => set({ isAdoptionModalOpen: isOpen }),
  toggleRefugioModal: (isOpen) => set({ isRefugioModalOpen: isOpen }),
  toggleLogoutModal: (isOpen) => set({ isLogoutModalOpen: isOpen }),
  toggleSubscriptionModal: (isOpen) => set({ isSubscriptionModalOpen: isOpen }),
  toggleAlerts: (isOpen) => set({ isAlertsOpen: isOpen }),
  
  setZoomedPhoto: (photo) => set({ zoomedPhoto: photo }),
  setItemToDelete: (item) => set({ itemToDelete: item }),
}));