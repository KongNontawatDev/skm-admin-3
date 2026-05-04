# SKM Admin 3 - Database Documentation

Updated: 2026-05-01

## Database Access

`skm-admin-3` does not connect directly to the database. All reads and writes go through `skm-easy-api-v3`.

## Safety Rule

Never add database credentials, direct SQL calls, or direct production database access to this frontend. Any database support work belongs in the API project and must follow the production DB safety policy.

## Admin Data Domains

The admin app consumes API-backed data for:

- Staff/admin auth state
- Dashboard metrics
- Customer/user views
- Support ticket operations
- Promotion/article/guide CMS records
- LINE customer/test tools
- Operational logs

## Log Data

The log viewer reads processed log data from the API. It must use filters and limits so large production log files remain usable.

