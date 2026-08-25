"use client"

import { useState, useEffect } from 'react'

export default function InstallPrompt() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Detect iOS devices
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        // Detect if app is already running in standalone mode (installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches

        // Only show if it's iOS, not installed, and user hasn't dismissed it
        if (isIOS && !isStandalone && !localStorage.getItem('pwaPromptShown')) {
            setIsVisible(true)
        }
    }, [])

    if (!isVisible) return null

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 max-w-md mx-auto">
            <div className="bg-card text-card-foreground shadow-lg border border-primary/20 rounded-xl p-4 flex justify-between items-center gap-4">
                <p className="text-sm leading-tight">
                    Tap the share button and then <span className="font-bold">&quot;Add to Home Screen&quot;</span> to install the SASE App.
                </p>
                <button
                    className="p-2 hover:bg-muted rounded-full"
                    onClick={() => {
                        setIsVisible(false)
                        localStorage.setItem('pwaPromptShown', 'true')
                    }}
                >
                    ✕
                </button>
            </div>
        </div>
    )
}
