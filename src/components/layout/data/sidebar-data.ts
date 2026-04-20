import {
  BookOpen,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  MessageSquareWarning,
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
          url: '/',
          icon: LayoutDashboard,
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
      ],
    },
  ],
}
