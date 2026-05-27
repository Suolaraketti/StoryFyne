import './globals.css';

export const metadata = {
  title: 'StoryFyne — Turn Stories Into Audio & Video',
  description: 'AI-powered audio and video generation for stories, sales pitches, and explainer content.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
