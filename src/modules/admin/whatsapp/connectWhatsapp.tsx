"use client";

import { useEffect, useState, useRef } from "react";

type QRData = {
    type: "qr" | "status" | "info";
    data: string | null;
};

export default function ConnectWhatsapp() {
    const [qr, setQr] = useState<string | null>(null);
    const [status, setStatus] = useState<string>("disconnected");
    const [info, setInfo] = useState<string | null>(null);
    const [wsStatus, setWsStatus] = useState<string>("connecting");
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

    const connectWebSocket = () => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (wsRef.current) {
            wsRef.current.close();
        }

        const wsUrl = "wss://water-web-server-production.up.railway.app";

        console.log("🔌 Connecting to:", wsUrl);
        setWsStatus("connecting");

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("✅ Connected to WebSocket server");
            setWsStatus("connected");
        };

        ws.onmessage = (event) => {
            try {
                const message: QRData = JSON.parse(event.data);
                console.log("📨 Received message:", message);

                if (message.type === "qr") {
                    setQr(message.data);
                    if (message.data) {
                        console.log("📱 QR Code received");
                    }
                } else if (message.type === "status") {
                    setStatus(message.data || "disconnected");
                    console.log("📊 Status updated:", message.data);
                } else if (message.type === "info") {
                    setInfo(message.data || null);
                    console.log("ℹ️ Info updated:", message.data);
                }
            } catch (err) {
                console.error("Failed to parse WebSocket message:", err);
            }
        };

        ws.onclose = (event) => {
            console.log("❌ WebSocket disconnected. Code:", event.code, "Reason:", event.reason);
            setWsStatus("disconnected");
            
            if (event.code !== 1000) {
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log("🔄 Attempting to reconnect...");
                    connectWebSocket();
                }, 5000);
            }
        };

        ws.onerror = (event) => {
            console.error("❌ WebSocket error:", event);
            setWsStatus("error");
        };
    };

    useEffect(() => {
        connectWebSocket();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const handleDisconnect = async () => {
        if (!confirm("Are you sure you want to disconnect WhatsApp? You'll need to scan the QR code again.")) {
            return;
        }

        try {
            console.log("🚪 Logging out from WhatsApp...");
            
            const res = await fetch("https://water-web-server-production.up.railway.app/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!res.ok) {
                throw new Error(`Logout failed: ${res.status}`);
            }

            const data = await res.json();
            console.log("✅ Logout response:", data);

            setStatus("disconnected");
            setQr(null);
            setInfo(null);

            alert("Disconnected successfully! A new QR code will be generated shortly.");
        } catch (err) {
            console.error("❌ Failed to disconnect:", err);
            alert(`Failed to disconnect: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    const handleManualReconnect = () => {
        connectWebSocket();
    };

    const handleForceNewQR = async () => {
        try {
            console.log("🔄 Forcing new QR code generation...");
            
            const res = await fetch("https://water-web-server-production.up.railway.app/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!res.ok) {
                throw new Error(`Failed to generate QR: ${res.status}`);
            }

            const data = await res.json();
            console.log("✅ Response:", data);
            
            alert("Generating new QR code... Please wait a moment.");
        } catch (err) {
            console.error("❌ Failed:", err);
            alert(`Failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br  flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg">
                        <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">WhatsApp Connection</h1>
                    <p className="text-gray-600">Connect your WhatsApp account securely</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Status Bar */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
                        <div className="flex items-center justify-between text-white">
                            <div className="flex items-center space-x-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${
                                    wsStatus === "connected" ? "bg-green-300 animate-pulse" :
                                    wsStatus === "connecting" ? "bg-yellow-300 animate-pulse" :
                                    "bg-red-300"
                                }`}></div>
                                <span className="text-sm font-medium">
                                    {wsStatus === "connected" ? "Server Connected" :
                                     wsStatus === "connecting" ? "Connecting..." :
                                     "Server Disconnected"}
                                </span>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                status === "connected" 
                                    ? "bg-green-400 bg-opacity-30 text-green-100" 
                                    : "bg-white bg-opacity-20 text-white"
                            }`}>
                                {status === "connected" ? "Active" : "Inactive"}
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-8">
                        {qr ? (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Scan QR Code</h2>
                                    <p className="text-sm text-gray-600">Open WhatsApp on your phone and scan this code</p>
                                </div>
                                
                                <div className="flex justify-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl blur-xl opacity-30"></div>
                                        <img 
                                            src={qr} 
                                            alt="WhatsApp QR code" 
                                            className="relative w-72 h-72 border-4 border-white rounded-2xl shadow-xl"
                                        />
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <div className="flex items-start space-x-3">
                                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                                        </svg>
                                        <div className="text-sm text-blue-800">
                                            <p className="font-medium mb-1">How to scan:</p>
                                            <ol className="list-decimal list-inside space-y-1 text-blue-700">
                                                <li>Open WhatsApp on your phone</li>
                                                <li>Tap Menu or Settings</li>
                                                <li>Tap Linked Devices</li>
                                                <li>Tap Link a Device</li>
                                                <li>Point your phone at this screen</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : status === "connected" ? (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-4 shadow-lg">
                                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Connected Successfully!</h2>
                                    <p className="text-gray-600">Your WhatsApp account is now linked</p>
                                </div>

                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
                                                {info?.charAt(0) || "?"}
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium">Connected Account</p>
                                                <p className="text-lg font-semibold text-gray-800">{info || "User"}</p>
                                            </div>
                                        </div>
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleDisconnect}
                                    className="w-full px-6 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    <span className="flex items-center justify-center space-x-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                        </svg>
                                        <span>Disconnect Account</span>
                                    </span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                                        <svg className="w-10 h-10 text-gray-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Waiting for Connection</h2>
                                    <p className="text-gray-600">Setting up your WhatsApp connection...</p>
                                </div>

                                {wsStatus !== "connected" && (
                                    <button
                                        onClick={handleManualReconnect}
                                        className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        <span className="flex items-center justify-center space-x-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                            </svg>
                                            <span>Reconnect to Server</span>
                                        </span>
                                    </button>
                                )}

                                {status === "disconnected" && wsStatus === "connected" && (
                                    <button
                                        onClick={handleForceNewQR}
                                        className="w-full px-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        <span className="flex items-center justify-center space-x-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                                            </svg>
                                            <span>Generate New QR Code</span>
                                        </span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-xs text-gray-500">
                        🔒 Secure connection via Railway Production Server
                    </p>
                </div>
            </div>
        </div>
    );
}