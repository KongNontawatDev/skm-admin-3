import { createFileRoute } from '@tanstack/react-router'
import { ArticlesPage } from '@/features/articles'

export const Route = createFileRoute('/_authenticated/articles/')({
  component: ArticlesPage,
})
