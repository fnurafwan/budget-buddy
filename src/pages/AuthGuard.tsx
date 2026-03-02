// Contoh integrasi di App.tsx (atau main router file kamu)
// Tambahkan UserProvider di root, dan LockScreen guard sebelum router

import { UserProvider, useUser } from '@/context/UserContext';
import LockScreen from '@/components/LockScreen';

// Bungkus router kamu dengan komponen ini
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useUser();
  if (!currentUser) return <LockScreen />;
  return <>{children}</>;
};

// Di root App.tsx kamu:
// <UserProvider>
//   <AuthGuard>
//     <RouterProvider router={router} />   ← atau <BrowserRouter> etc.
//   </AuthGuard>
// </UserProvider>

export { AuthGuard };
export default AuthGuard;