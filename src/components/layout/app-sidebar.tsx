import { useLayout } from '@/context/layout-provider'
import { useAuthStore } from '@/stores/auth-store'
import { Logo } from '@/assets/logo'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const authUser = useAuthStore((s) => s.auth.user)
  const navUser = {
    name: authUser?.name?.trim() || authUser?.email?.split('@')[0] || 'ผู้ดูแล',
    email: authUser?.email ?? '',
    avatar: '',
  }

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader className='flex flex-row items-center gap-2 border-b px-3 py-3'>
        <Logo className='size-8' />
        <div className='flex flex-col leading-tight'>
          <span className='text-sm font-semibold'>SKM Easy</span>
          <span className='text-xs text-muted-foreground'>แอดมิน</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
