# Bulti - Vite + Supabase Auth App

This is a Vite + React + TypeScript application with Supabase authentication, using shadcn/ui components and Tailwind CSS.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   pnpm install
   ```
3. Create `.env` file from the example:
   ```
   pnpm setup-env
   ```
4. Update the `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
5. Start the development server:
   ```
   pnpm dev
   ```

## Features

- Supabase authentication
- Login and signup pages
- Protected routes
- React Router for navigation
- Shadcn/ui components
- Tailwind CSS for styling
- Form validation with Zod
- TypeScript support

## Folder Structure

- `src/` - Source code
  - `components/` - UI components
  - `lib/` - Utilities and hooks
    - `auth.tsx` - Authentication context and hooks
    - `supabase.ts` - Supabase client
    - `utils.ts` - Utility functions
  - `pages/` - Page components
    - `Login.tsx` - Login page
    - `SignUp.tsx` - Sign up page
    - `Dashboard.tsx` - Dashboard page (protected)
  - `routes.tsx` - Router configuration
  - `App.tsx` - Main app component
  - `main.tsx` - Entry point

## Deployment

To build for production:

```
pnpm build
```

The build artifacts will be in the `dist/` folder.