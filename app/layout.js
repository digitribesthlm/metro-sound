export const metadata = {
	title: 'Metro Sound',
	description: 'Web Audio metronome built with Next.js',
};

export default function RootLayout({ children }) {
	return (
		<html lang="en" data-theme="dark">
			<body className="min-h-dvh bg-base-200 text-base-content">
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
				<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
				{children}
			</body>
		</html>
	);
}



