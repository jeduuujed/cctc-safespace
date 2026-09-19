import { Inter, Merriweather } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const merriweather = Merriweather({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-merriweather'
});

export default function MyApp({ Component, pageProps }) {
  return (
    <div className={`${inter.variable} ${merriweather.variable}`}>
      <Component {...pageProps} />
    </div>
  );
}
