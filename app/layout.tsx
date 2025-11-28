import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'MyLink - Remote Peripheral Bridge',
    description: 'Access your laptop camera, microphone, and keyboard from anywhere',
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
        userScalable: false,
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className="bg-gray-950 text-white">{children}</body>
        </html>
    )
}
