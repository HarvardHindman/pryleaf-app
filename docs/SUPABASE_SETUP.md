# Supabase CLI Setup Guide

## Option 1: Get Access Token (Recommended for CLI)

1. Go to your Supabase Dashboard: https://app.supabase.com/account/tokens
2. Click "Generate New Token"
3. Give it a name (e.g., "Pryleaf CLI")
4. Copy the token
5. Add it to your `.env.local` file:
   ```
   SUPABASE_ACCESS_TOKEN=your-token-here
   ```

## Option 2: Link Project Manually

If you have your project reference ID:
```bash
npx supabase link --project-ref your-project-ref
```

Your project ref can be found in your Supabase project URL:
`https://app.supabase.com/project/[YOUR-PROJECT-REF]`

## After Setup

Once linked, you can:
- Create migrations: `npx supabase migration new migration_name`
- Push migrations: `npx supabase db push`
- Pull schema: `npx supabase db pull`
- Generate types: `npx supabase gen types typescript`

## Alternative: Work Locally Without Link

We can also create migration files locally and you can apply them via the Supabase Dashboard SQL Editor.

