import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCachedAdminSession } from '@/lib/admin-auth-client'
import { useAuthStore } from '@/stores/auth-store'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const store = useAuthStore.getState().auth
    const hasLocalAuth = Boolean(store.token && store.user)
    const { data, error } = hasLocalAuth
      ? await getCachedAdminSession()
      : await getCachedAdminSession({ force: true })

    // If no session and no user from server, and no token in store -> redirect
    if ((error || (!data?.session && !data?.user)) && !store.token) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: `${location.pathname}${location.searchStr}` },
      })
    }

    // If we have user data, update the store
    if (data?.user) {
      store.setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
      })
    }
  },
  component: AuthenticatedLayout,
})
