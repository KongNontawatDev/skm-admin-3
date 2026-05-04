# SKM Admin 3 - API Usage Documentation

Updated: 2026-05-01

## API Client

Primary client: `src/lib/api.ts`

Default base URL:

```text
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Normal requests send:

```text
X-Client-App: skm-admin-3
```

## Auth

Admin auth uses Better Auth through `src/lib/admin-auth-client.ts` and API-side admin auth middleware. Protected screens should rely on the existing route/auth guards.

## Admin Feature APIs

The admin app consumes `/api/v1/admin/*` feature groups for:

- Dashboard
- Users/customers
- Support tickets
- Promotions
- Articles
- Guides
- CMS image uploads
- LINE customer tools
- LINE OA test tools
- Logs

## Log Viewer

Log viewer filters should stay aligned with the API log service:

- level
- category
- request id
- actor type
- actor id
- text search
- pagination/limit

## Uploads

CMS image uploads use `multipart/form-data`. Images are compressed in the browser before upload; the API still validates and compresses again when appropriate.

## Error Handling

Admin screens may show more operational detail than customer screens, but must not expose secrets, raw cookies, raw authorization headers, OTPs, passwords, or full internal stack traces to normal users.

