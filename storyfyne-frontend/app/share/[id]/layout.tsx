import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Listen on Dialfyne',
  description: 'AI-generated audio sales pitch powered by Dialfyne.',
  openGraph: {
    title: 'Listen on Dialfyne',
    description: 'AI-generated audio sales pitch powered by Dialfyne.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Listen on Dialfyne',
    description: 'AI-generated audio sales pitch powered by Dialfyne.',
  },
};

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
