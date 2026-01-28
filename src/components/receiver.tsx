"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useFirestore, useDoc } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader, ScreenShare, Tv } from "lucide-react";
import { answerShare, hangUp } from "@/firebase/webrtc";
import { addDoc, collection, doc, onSnapshot, deleteDoc, updateDoc } from "firebase/firestore";
import { DeviceNameModal } from "./device-name-modal";

type Receiver = {
  id: string;
  name: string;
  status: 'available' | 'connecting' | 'connected' | 'disconnected';
  offer?: any;
  sharerDeviceName?: string;
};

export function Receiver() {
  const firestore = useFirestore();
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { data: receiver, loading } = useDoc<Receiver>(receiverId ? `receivers/${receiverId}` : null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');

  const onConnectionStateChange = (state: RTCPeerConnectionState) => {
    setConnectionState(state);
    if (state === 'disconnected' || state === 'failed' || state === 'closed') {
      if (videoRef.current) {
          videoRef.current.srcObject = null;
      }
      if (firestore && receiverId) {
        // Reset status to available
        const receiverRef = doc(firestore, "receivers", receiverId);
        updateDoc(receiverRef, { status: "available", offer: null, answer: null, sharerDeviceName: null });
      }
    }
  };

  const handleSetDeviceName = async (name: string) => {
    if (!firestore) return;
    try {
      const receiverRef = await addDoc(collection(firestore, "receivers"), {
        name,
        status: 'available',
      });
      setReceiverId(receiverRef.id);
    } catch (e) {
      console.error("Error creating receiver:", e);
    }
  };
  
  useEffect(() => {
    // If we don't have a receiverId and we are not loading one, open the modal.
    if (!receiverId && firestore) {
      setIsModalOpen(true);
    }
  }, [receiverId, firestore]);

  useEffect(() => {
    if (!firestore || !receiverId) return;

    const receiverRef = doc(firestore, 'receivers', receiverId);
    
    // Listen for offers
    const unsubscribe = onSnapshot(receiverRef, (docSnap) => {
        const data = docSnap.data() as Receiver;
        if (data && data.offer && data.status === 'connecting') {
            answerShare(firestore, receiverId, videoRef.current, onConnectionStateChange);
        }
    });

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (receiverId) {
            hangUp(firestore, receiverId);
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        unsubscribe();
        window.removeEventListener('beforeunload', handleBeforeUnload);
        if (receiverId) {
            hangUp(firestore, receiverId, true); // Attempt to delete on unmount/unload
        }
    };
}, [firestore, receiverId]);


  const getStatusText = () => {
    if (loading || !receiver) return "Inicializando...";
    if (receiver.status === 'available') return `Esperando conexión para "${receiver.name}"...`;
    
    switch (connectionState) {
        case 'new': return 'Iniciando conexión...';
        case 'connecting': return `Conectando con ${receiver.sharerDeviceName || 'un dispositivo'}...`;
        case 'connected': return `Conectado a ${receiver.sharerDeviceName || 'dispositivo'}`;
        case 'disconnected': return 'Desconectado. Esperando nueva conexión.';
        case 'failed': return 'Conexión fallida. Por favor, inténtelo de nuevo.';
        case 'closed': return 'Conexión cerrada. Esperando nueva conexión.';
        default: return `Esperando conexión para "${receiver.name}"...`;
    }
  };

  const isConnected = receiver?.status === 'connected' && connectionState === 'connected';

  return (
    <>
      <DeviceNameModal
        isOpen={isModalOpen && !receiverId}
        onClose={() => {}} // Prevent closing without submitting
        onSubmit={handleSetDeviceName}
        title="Configurar este Dispositivo"
        description="Dale un nombre a esta pantalla (ej. TV de la Sala) para que otros puedan encontrarla."
        buttonText="Hacer Disponible"
      />
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-4xl shadow-lg">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Tv className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle className="text-2xl font-bold">Pantalla Receptora</CardTitle>
                        <CardDescription>
                            {getStatusText()}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="aspect-video bg-muted/50 rounded-lg overflow-hidden border relative">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
                    {!isConnected && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                           <ScreenShare className="w-16 h-16" />
                           <p className="mt-4 font-semibold">{receiver?.name || 'Cargando...'}</p>
                           <p className="text-sm">La pantalla compartida aparecerá aquí.</p>
                           {(receiver?.status === 'available' || receiver?.status === 'disconnected') && <Loader className="mt-4 animate-spin" />}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
