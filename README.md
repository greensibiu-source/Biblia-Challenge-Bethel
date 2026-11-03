# Biblia Challenge – Bethel Cloppenburg

Starter PWA for iPhone, Android and desktop. Romanian interface.

## What is included
- Responsive PWA shell and install manifest/service worker
- Supabase email/password sign-up and sign-in wiring
- Username profile creation on registration
- 20 configured level names in the UI and SQL seed
- Shared leaderboard query scaffold
- Supabase schema with Row Level Security enabled

## Important status
This is a foundation, not a finished/deployed game. It does not yet include the 420 verified questions, timed quiz flow, server-side answer validation/scoring, level unlock RPC, admin panel, competition management UI, or a deployed URL. Do not publish it as production-ready yet.

## Local setup
1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase-schema.sql`.
3. In Supabase Authentication settings, enable email/password and email confirmation.
4. Copy `.env.example` to `.env` and fill in the project's URL and publishable/anon key. Never put a `service_role` key in this frontend.
5. Run `npm install` and `npm run dev`.

## First administrator
After the owner's account has been registered and email-confirmed, promote that profile to admin manually in the Supabase SQL Editor, using the exact account email to identify it:

```sql
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id and u.email = 'OWNER_EMAIL_HERE';
```

Do not share your password. The admin panel and admin-only database policies still need to be implemented before enabling administration features.

## Next development milestones
1. Secure server-side RPC for quiz sessions, 60-second deadlines, one answer per question, scoring and progression.
2. Admin-only question editor and competition manager.
3. Import 420 original questions with verified Bible references (Cornilescu 2017 references; avoid reproducing copyrighted passage text at length).
4. Test security, mobile install flow and deploy to hosting.
