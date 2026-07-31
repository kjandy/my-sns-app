import { ClientLayout } from '@/components/ClientLayout';
import './globals.css';
import Header from '@/components/Header';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Header />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
