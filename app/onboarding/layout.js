export const metadata = {
  title: 'Complete Your Profile',
  description: 'Set up your mapmyGig account to get started.',
};

export default function OnboardingLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 flex items-center justify-center p-4">
      {children}
    </div>
  );
}
