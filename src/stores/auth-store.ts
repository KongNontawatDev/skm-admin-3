import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AuthUser {
  id: string
  email: string
  name?: string | null
}

interface AuthState {
  auth: {
    user: AuthUser | null
    token: string | null
    setUser: (user: AuthUser | null, token?: string | null) => void
    reset: () => void
  }
}

function isPersistedAuthState(value: unknown): value is Partial<AuthState> {
  return typeof value === 'object' && value !== null && 'auth' in value
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      auth: {
        user: null,
        token: null,
        setUser: (user, token) =>
          set((state) => ({
            ...state,
            auth: {
              ...state.auth,
              user,
              token: token !== undefined ? token : state.auth.token,
            },
          })),
        reset: () =>
          set((state) => ({
            ...state,
            auth: { ...state.auth, user: null, token: null },
          })),
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        auth: {
          user: state.auth.user,
          token: state.auth.token,
        },
      }),
      merge: (persistedState, currentState) => {
        const persistedAuth = isPersistedAuthState(persistedState) ? persistedState.auth : undefined
        return {
          ...currentState,
          auth: {
            ...currentState.auth,
            ...(persistedAuth || {}),
          },
        }
      },
    }
  )
)
