import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAddressStore = create(
  persist(
    (set, get) => ({
      addresses: [
        {
          id: 'addr1',
          type: 'home',
          name: 'Hriti Singh',
          phone: '+91 9876543210',
          address: '123, Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          isDefault: true
        }
      ],
      
      addAddress: (addressData) => {
        const newAddress = {
          id: 'addr' + Date.now() + Math.random().toString(36).substr(2, 9),
          ...addressData,
          isDefault: get().addresses.length === 0 // First address is default
        };
        
        set((state) => ({
          addresses: [...state.addresses, newAddress]
        }));
        
        return newAddress;
      },
      
      updateAddress: (addressId, addressData) => {
        set((state) => ({
          addresses: state.addresses.map(addr =>
            addr.id === addressId ? { ...addr, ...addressData } : addr
          )
        }));
      },
      
      deleteAddress: (addressId) => {
        set((state) => ({
          addresses: state.addresses.filter(addr => addr.id !== addressId)
        }));
      },
      
      setDefaultAddress: (addressId) => {
        set((state) => ({
          addresses: state.addresses.map(addr => ({
            ...addr,
            isDefault: addr.id === addressId
          }))
        }));
      },
      
      getDefaultAddress: () => {
        return get().addresses.find(addr => addr.isDefault) || get().addresses[0];
      },
      
      getAddressById: (addressId) => {
        return get().addresses.find(addr => addr.id === addressId);
      }
    }),
    {
      name: 'address-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

