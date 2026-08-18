import { ClientLayout } from '@/components/ClientLayout';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
