# Awaaz Uthao — Setup Guide

Everything below is free. Follow in order.

## 1. Create accounts (5 min each)
- GitHub — github.com
- Vercel — vercel.com (sign in with GitHub)
- Supabase — supabase.com (sign in with GitHub)

## 2. Set up Supabase
1. Create a new Supabase project.
2. Go to SQL Editor -> paste the entire contents of `supabase/schema.sql` -> Run.
3. Go to Authentication -> Providers -> make sure Email is enabled.
4. **Important:** Go to Authentication -> URL Configuration -> Redirect URLs,
   and add your live site's confirm page, e.g.
   `https://awaaz-uthao.vercel.app/support/confirm` and
   `https://awaaz-uthao.vercel.app/admin/dashboard`
   (add both the `.vercel.app` domain Vercel gave you, and later your real
   domain if you buy one). Without this, clicking the email link will fail
   with a "redirect not allowed" error.
5. This app uses Supabase's free built-in email sending (no custom SMTP,
   no domain purchase needed) — it sends a clickable confirmation link
   instead of a typed code. This works for any real email address for
   free. The only limit: Supabase's free default email sender has a low
   hourly sending cap (fine for organic early growth; if the campaign
   goes viral and people report delayed emails, that's the signal to add
   a proper email provider like Resend — which does require owning a
   domain, roughly ₹500-900/year).
6. Go to Project Settings -> API. Copy:
   - Project URL -> NEXT_PUBLIC_SUPABASE_URL
   - anon public key -> NEXT_PUBLIC_SUPABASE_ANON_KEY
   - service_role key -> SUPABASE_SERVICE_ROLE_KEY (keep this secret, never
     put it in any client-facing code)

## 3. Add yourself as admin
In Supabase SQL Editor, run:
```sql
insert into admin_users (email) values ('your-real-email@example.com');
```
Use the same email you'll log into /admin with.

## 4. Fill in the MP directory (this part is manual — no free API exists for this)
The `mp_directory` table starts empty. You need to populate it with
pincode-prefix -> MP mappings. Source: Lok Sabha official website
(loksabha.nic.in) has a list of all 543 MPs by constituency. You'll need to
manually map pincode prefixes (first 3 digits) to constituencies — this is
a one-time data-entry task. Insert rows like:
```sql
insert into mp_directory (pincode_prefix, constituency, mp_name, mp_email)
values ('110', 'New Delhi', 'MP Name Here', 'mp@sansad.nic.in');
```
Start with the 20-30 most populous/relevant pincodes first and expand later
— the app works fine even with partial coverage (users outside the mapped
list simply won't see an MP suggestion, but their pledge still counts).

## 5. Generate push notification keys
On your own computer, run:
```
npx web-push generate-vapid-keys
```
This prints a public and private key — put them into your Vercel
environment variables as shown in `.env.example`.

## 6. Deploy
1. Push this project to a new GitHub repository.
2. On Vercel: New Project -> Import your GitHub repo.
3. Add all the environment variables from `.env.example` (with your real
   values) in the Vercel project settings.
4. Deploy.

## 7. Test before sharing publicly
- Submit a real pledge yourself, confirm the OTP email arrives and works.
- Confirm the live counter updates on a second browser tab in real time.
- Log into /admin, approve your own test message, confirm it shows on
  /wall, confirm "I agree too" only counts once per browser.
- Publish a test update and confirm the push notification arrives (on
  Android/desktop Chrome — iOS Safari needs 16.4+ and the site added to
  home screen first).

## Known limitations (by design, to stay free)
- Rate limiting resets on server cold start — fine at this scale, revisit
  with Upstash Redis (free tier) only if traffic gets very large.
- iOS push notifications require the user to "Add to Home Screen" first;
  this is an Apple restriction, not something this app can work around.
- Pincode-to-MP mapping is only as complete as the data you enter.
