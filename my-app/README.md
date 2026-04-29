This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment variables (History calorie estimates)

Estimated calories on **History** (per day and per meal) use the same Gemini backends as other AI features. On **Vercel**, mirror your local setup so totals are not shown as `— kcal`:

- Set **`GEMINI_API_KEY`** (Google AI Studio path when using the Studio API), **or**
- Set **`VERTEX_PROJECT_ID`** / **`GOOGLE_CLOUD_PROJECT`** plus **`GOOGLE_EXTERNAL_ACCOUNT_JSON`** (or AWS Secrets Manager per `VERTEX_CREDENTIAL_SECRET_ID`) for Vertex.

Do **not** set **`VERTEX_DISABLED=true`** in production if you want calorie estimates. Optional: **`AI_PROVIDER`** = `studio` | `vertex` | auto (default).

Server logs prefix **`[calorie-kcal]`** when estimation is skipped so you can diagnose missing env in deployment logs.
