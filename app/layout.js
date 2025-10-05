export const metadata = {
	title: 'Metro Sound',
	description: 'Web Audio metronome built with Next.js',
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
				{children}
			</body>
		</html>
	);
}


