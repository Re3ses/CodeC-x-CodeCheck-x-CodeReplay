"use client"

import React, {
  createContext,
  useContext,
  useRef,
	useEffect,
	useState
} from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketInterface {
  socket: Socket | null;
}
const SocketContext = createContext<SocketInterface>({socket: null});

const useSocket = () => useContext(SocketContext);

function SocketProvider({ children }: { children: React.ReactNode }) {
	const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketIo: Socket = io(
      `${process.env.NEXT_PUBLIC_SERVER_URL}${process.env.NEXT_PUBLIC_SOCKET_PORT}`
    );
    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export { SocketContext, useSocket, SocketProvider };
