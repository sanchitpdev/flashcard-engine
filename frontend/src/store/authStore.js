import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
    persist(
        (set) => ({
          accessToken: null,
          user: null,
          setAuth: (accessToken, user) => set({ accessToken, user }),
          clearAuth: () => set({ accessToken: null, user: null }),
        }),
        {
          name: 'flashcard-auth-storage', // The name of the key in localStorage
        }
    )
)

export default useAuthStore 