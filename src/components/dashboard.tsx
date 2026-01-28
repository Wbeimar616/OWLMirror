"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { ShareControls } from "./share-controls";
import { ConnectionList } from "./connection-list";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { createOffer, hangUp } from "@/firebase/webrtc";
import { DeviceNameModal } from "./device-name-modal";


export function Dashboard() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSharing, setIsSharing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const handleStopSharing = useCallback(async (streamToStop: MediaStream | null) => {
    const currentStream = streamToStop || stream;
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsSharing(false);
    
    if (firestore && connectionId) {
      await hangUp(firestore, connectionId);
    }
    setConnectionId(null);
    setConnectionState('new');
  }, [stream, firestore, connectionId]);

  const onConnectionStateChange = (state: RTCPeerConnectionState) => {
    setConnectionState(state);
  }

  const handleStartSharing = useCallback(async (deviceName: string) => {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Firestore is not initialized.",
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
        handleStopSharing(displayStream);
      });
      
      setStream(displayStream);
      setIsSharing(true);

      const newConnectionId = await createOffer(firestore, displayStream, null, deviceName, onConnectionStateChange);
      setConnectionId(newConnectionId);
      
    } catch (error) {
      console.error("Error starting screen share:", error);
      toast({
        variant: "destructive",
        title: "Screen Share Failed",
        description: "Could not start screen sharing. Please grant permission and try again.",
      });
      setIsSharing(false);
    }
  }, [firestore, toast, handleStopSharing]);

  return (
    <>
      <DeviceNameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleStartSharing}
      />
      <div className="grid gap-6 md:gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <ShareControls
            isSharing={isSharing}
            onStartSharing={() => setIsModalOpen(true)}
            onStopSharing={() => handleStopSharing(stream)}
            videoRef={videoRef}
          />
        </div>
        <div className="lg:col-span-2">
          <ConnectionList connectionId={connectionId} connectionState={connectionState} />
        </div>
      </div>
    </>
  );
}
