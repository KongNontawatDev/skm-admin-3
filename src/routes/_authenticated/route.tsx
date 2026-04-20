import { createFileRoute, redirect } from '@tanstack/react-router'
import { adminAuthClient } from '@/lib/admin-auth-client'
import { useAuthStore } from '@/stores/auth-store'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const { data } = await adminAuthClient.getSession()
    if (!data?.session) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: `${location.pathname}${location.searchStr}` },
      })
    }
    const u = data.user
    useAuthStore.getState().auth.setUser({
      id: u.id,
      email: u.email,
      name: u.name,
    })
  },
  component: AuthenticatedLayout,
})
