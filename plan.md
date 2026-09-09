

# Security Review - Two4Coaching

## Findings Summary

### CRITICAL (1)
1. **Realtime channel leakage** -- `notifications` and `user_credits` tables are published to Supabase Realtime, but any authenticated user can subscribe to any channel and see other users' notifications and credit balances.

### WARNINGS (3)
2. **Public storage bucket allows file listing** -- The `images` bucket is public AND allows listing all files. Anyone can enumerate every uploaded image.
3. **site_settings publicly readable** -- If any sensitive config (API keys, internal data) is stored as a key in `site_settings`, it would be exposed. Currently seems safe (contact info only), but no guard rail exists.
4. **No password reset flow** -- There is no "Forgot password" link or `/reset-password` page for either client or admin login. Users who forget their password have no recovery path.

### MINOR / BEST PRACTICES (3)
5. **Minimum password length too low** -- Client registration enforces only 6 characters. Recommend 8+ combined with the already-enabled HIBP check.
6. **No rate limiting on contact form** -- The `contact_messages` INSERT policy allows anonymous inserts with no throttle, enabling spam.
7. **Missing `handle_new_user` trigger** -- The `handle_new_user()` function exists but the database shows "no triggers". New signups may not get a `profiles` row auto-created.

## Proposed Fix Plan

### Step 1 -- Remove Realtime publication (Critical)
SQL migration to remove `notifications` and `user_credits` from `supabase_realtime` publication, preventing cross-user data leakage.

### Step 2 -- Restrict storage bucket listing
SQL migration to tighten the SELECT policy on `storage.objects` for the `images` bucket: allow reading individual files (public) but deny listing/enumeration.

### Step 3 -- Add password reset flow
- Add "Mot de passe oublié" link to both `/connexion` and `/admin/login`.
- Create a `/reset-password` page that reads the recovery token from the URL hash and calls `supabase.auth.updateUser({ password })`.
- Add route in `App.tsx`.

### Step 4 -- Ensure `handle_new_user` trigger exists
SQL migration to create the trigger `on_auth_user_created` on `auth.users` AFTER INSERT that calls `handle_new_user()` (if not already present).

### Step 5 -- Increase minimum password to 8 characters
Update client-side validation in `ClientRegister.tsx`.

### Step 6 -- Mark non-actionable findings
- `site_settings` exposure: acknowledge as intentional (public site content).

## Testing
After implementation, re-run the security scan to confirm all findings are resolved.

