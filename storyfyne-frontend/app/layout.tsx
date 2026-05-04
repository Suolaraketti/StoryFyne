export const metadata = {
  title: 'StoryFyne',
  description: 'Reddit story to expressive audio generator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0a0a0a', color: '#e0e0e0' }}>
        {children}
      </body>
    </html>
  );
}
