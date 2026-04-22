import { SignIn } from '@clerk/nextjs';

export const metadata = {
  title: 'Sign In',
};

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 p-4">
      <SignIn />
    </div>
  );
}
