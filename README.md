# carno

Conversational food & symptom tracker (**GutTrack**) — Next.js 16, Tailwind 4, Prisma, Neon.

## App location

- Source: [`my-app/`](my-app/)
- Setup: copy `my-app/.env.example` to `my-app/.env`, set `DATABASE_URL` and `AUTH_SECRET`, then:

  ```bash
  cd my-app && npm install && npx prisma migrate deploy && npm run dev
  ```

Do not commit `.env` (secrets stay local).
