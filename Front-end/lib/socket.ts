import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        const token = typeof window !== "undefined"
            ? sessionStorage.getItem("accessToken")
            : null;

        socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
            autoConnect: false,
            transports: ["websocket"],
            auth: token ? { token } : undefined,
        });
    }
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
