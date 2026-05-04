# SKM Admin 3 - Project Spec

Updated: 2026-05-01

## Purpose

`skm-admin-3` is the SKM backoffice web application for staff operations. It manages CMS content, support tickets, customers/LINE tools, dashboards, and operational log viewing.

## Stack

- React 19
- TypeScript 6
- Vite 8
- TanStack Router
- TanStack Query
- TanStack Table
- Tailwind CSS v4
- Radix/shadcn-style UI components
- Better Auth client
- Axios API client
- Tiptap rich text editor

## Main Entry Points

- `src/main.tsx`
- `src/routes/*`
- `src/lib/api.ts`
- `src/lib/admin-auth-client.ts`
- `src/lib/cms-upload.ts`
- `src/lib/image-compression.ts`
- `src/features/log-viewer/*`

## Feature Areas

- Admin sign-in, forgot password, reset password
- Authenticated dashboard pages
- User/customer tools
- Support ticket management
- Promotions, articles, and guides CMS
- Rich text content editing and image uploads
- LINE customer and LINE OA test tools
- Log viewer with filters
- Error pages for common operational states

## Current Product Rules

- Admin UI is an operational backoffice tool: dense, clear, and task-focused.
- CMS image uploads are compressed in the browser and again on the API when needed.
- Log viewer must support large logs by filtering/paging instead of loading unbounded data.
- Logs should expose actor/request context when available so staff can trace who performed an action.

## API Dependency

Default API base URL is `http://localhost:3000/api/v1` through `VITE_API_BASE_URL`. Requests identify this client with `X-Client-App: skm-admin-3` and use Better Auth session/cookies plus the existing token store where applicable.

