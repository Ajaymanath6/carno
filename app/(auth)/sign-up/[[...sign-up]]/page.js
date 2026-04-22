import { SignUp } from '@clerk/nextjs';

export const metadata = {
  title: 'Create Account',
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 p-4">
      <SignUp />
    </div>
  );
}
