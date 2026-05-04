import {
  Banknote,
  Bike,
  BookOpen,
  Clock,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  MessageSquareWarning,
  PackageSearch,
  Repeat2,
  UserCircle,
  Users,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: 'เมนู',
      items: [
        {
          title: 'ภาพรวมระบบ',
          icon: LayoutDashboard,
          items: [
            { title: 'เมนูทางลัด', url: '/', icon: LayoutDashboard },
            { title: 'ภาพรวมธุรกิจ', url: '/dashboard/overview', icon: LayoutDashboard },
            { title: 'สินเชื่อ & ลูกหนี้', url: '/dashboard/finance', icon: Banknote },
            { title: 'ยอดขาย & เซลล์', url: '/dashboard/sales', icon: Bike },
            { title: 'รีไฟแนนซ์ / เทิร์น / รถยึด', url: '/dashboard/refinance', icon: Repeat2 },
            { title: 'รถมือสอง & สต๊อก', url: '/dashboard/used-stock', icon: PackageSearch },
          ],
        },
        {
          title: 'ลูกค้า LINE',
          url: '/line-customers',
          icon: MessageCircle,
        },
        {
          title: 'โปรไฟล์ของฉัน',
          url: '/profile',
          icon: UserCircle,
        },
        {
          title: 'โปรโมชัน',
          url: '/promotions',
          icon: Megaphone,
        },
        {
          title: 'ข่าวสาร / บทความ',
          url: '/articles',
          icon: FileText,
        },
        {
          title: 'วิธีใช้งานแอป',
          url: '/guides',
          icon: BookOpen,
        },
        {
          title: 'แจ้งปัญหาจากผู้ใช้',
          url: '/support',
          icon: MessageSquareWarning,
        },
        {
          title: 'ทดสอบ LINE OA',
          url: '/line-oa-test',
          icon: MessageCircle,
        },
        {
          title: 'ผู้ดูแลระบบ',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Logs ระบบ',
          url: '/log-viewer',
          icon: Clock,
        },
      ],
    },
  ],
}
