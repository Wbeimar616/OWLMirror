"use client";

import React, { useState, useRef, useCallback } from "react";
import { ShareControls } from "./share-controls";
import { ReceiverList } from "./connection-list";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { initiateShare, hangUp } from "@/firebase/webrtc";

export function Dashboard() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [sharingTo, setSharingTo] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleStopSharing = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    
    if (firestore && sharingTo) {
      await hangUp(firestore, sharingTo);
    }
    setSharingTo(null);
    setConnectionState('new');
  }, [stream, firestore, sharingTo]);

  const onConnectionStateChange = (state: RTCPeerConnectionState) => {
    setConnectionState(state);
     if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        handleStopSharing();
    }
  }

  const handleStartSharing = useCallback(async (receiverId: string) => {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Firestore no está inicializado.",
      });
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = displayStream;
      }
      
      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        handleStopSharing();
      });
      
      setStream(displayStream);
      setSharingTo(receiverId);

      await initiateShare(firestore, displayStream, receiverId, onConnectionStateChange);
      
    } catch (error) {
      console.error("Error al iniciar la compartición de pantalla:", error);
      toast({
        variant: "destructive",
        title: "Error al compartir",
        description: "No se pudo iniciar la compartición de pantalla. Por favor, otorga los permisos y vuelve a intentarlo.",
      });
      setSharingTo(null);
    }
  }, [firestore, toast, handleStopSharing]);

  return (
    <div className="grid gap-6 md:gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3 flex flex-col gap-6">
        <ShareControls
          isSharing={!!sharingTo}
          onStopSharing={handleStopSharing}
          videoRef={videoRef}
        />
      </div>
      <div className="lg:col-span-2">
        <ReceiverList 
          onShare={handleStartSharing} 
          sharingTo={sharingTo}
          connectionState={connectionState}
        />
      </div>
    </div>
  );
}
