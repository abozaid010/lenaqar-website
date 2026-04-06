import { Suspense } from 'react';
import OpenPage from './OpenPage';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <p>Loading...</p>
      </div>
    }>
      <OpenPage />
    </Suspense>
  );
}
