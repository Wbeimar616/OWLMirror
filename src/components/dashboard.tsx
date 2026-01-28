"use client";

import React, { useState, useRef, useCallback } from "react";
import { ShareControls } from "./share-controls";
import { OptimizationControls } from "./optimization-controls";
import { ConnectionList } from "./connection-list";
import { useToast } from "@/hooks/use-toast";

export function Dashboard() {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleStopSharing = useCallback((streamToStop: MediaStream | null) => {
    const currentStream = streamToStop || stream;
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsSharing(false);
  }, [stream]);

  const handleStartSharing = useCallback(async () => {
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
    } catch (error) {
      console.error("Error starting screen share:", error);
      toast({
        variant: "destructive",
        title: "Screen Share Failed",
        description: "Could not start screen sharing. Please grant permission and try again.",
      });
    }
  }, [toast, handleStopSharing]);

  return (
    <div className="grid gap-6 md:gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3 flex flex-col gap-6">
        <ShareControls
          isSharing={isSharing}
          onStartSharing={handleStartSharing}
          onStopSharing={() => handleStopSharing(stream)}
          videoRef={videoRef}
        />
        <OptimizationControls />
      </div>
      <div className="lg:col-span-2">
        <ConnectionList />
      </div>
    </div>
  );
}
