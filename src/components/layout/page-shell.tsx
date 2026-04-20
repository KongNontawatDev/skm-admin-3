import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ConfigDrawer } from '@/components/config-drawer'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

type PageShellProps = {
  title: string
  children: React.ReactNode
}

export function PageShell({ title, children }: PageShellProps) {
  return (
    <>
      <Header>
        <h1 className='text-lg font-semibold tracking-tight'>{title}</h1>
        <div className='ms-auto flex items-center gap-2'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
        </div>
      </Header>
      <Main>{children}</Main>
    </>
  )
}
