"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { ShareControls } from "./share-controls";
import { ConnectionList } from "./connection-list";
import { useToast } from "@/hooks/use-toast";
import { getOptimizedParameters } from "@/app/actions";

export function Dashboard() {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // State for AI optimization
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [compression, setCompression] = useState(70);
  const [framerate, setFramerate] = useState(30);
  const [deviceCharacteristics, setDeviceCharacteristics] = useState("");

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
        video: { frameRate: { ideal: framerate, max: 60 } },
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
  }, [toast, handleStopSharing, framerate]);

  // Get device characteristics once
  useEffect(() => {
    const characteristics = {
      userAgent: navigator.userAgent,
      cpuCores: navigator.hardwareConcurrency,
      memory: (navigator as any).deviceMemory || 'N/A',
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    };
    setDeviceCharacteristics(JSON.stringify(characteristics, null, 2));
  }, []);

  // Refs for values needed in interval to avoid stale closures
  const compressionRef = useRef(compression);
  compressionRef.current = compression;
  const framerateRef = useRef(framerate);
  framerateRef.current = framerate;
  const deviceCharacteristicsRef = useRef(deviceCharacteristics);
  deviceCharacteristicsRef.current = deviceCharacteristics;
  const isOptimizingRef = useRef(isOptimizing);
  isOptimizingRef.current = isOptimizing;
  const streamRef = useRef(stream);
  streamRef.current = stream;

  // Background optimization effect
  useEffect(() => {
    if (!isSharing) return;

    const optimizer = async () => {
      if (isOptimizingRef.current) return;
      setIsOptimizing(true);

      const newBandwidth = Math.floor(Math.random() * (100 - 5 + 1)) + 5;

      const input = {
        bandwidth: newBandwidth,
        deviceCharacteristics: deviceCharacteristicsRef.current,
        currentCompression: compressionRef.current,
        currentFramerate: framerateRef.current,
      };

      const { data: result, error } = await getOptimizedParameters(input);

      setIsOptimizing(false);

      if (error) {
        console.error("Auto-optimization failed:", error);
      } else if (result) {
        setCompression(result.optimizedCompression);
        setFramerate(result.optimizedFramerate);

        const videoTrack = streamRef.current?.getVideoTracks()[0];
        if (videoTrack?.applyConstraints) {
          videoTrack.applyConstraints({ frameRate: result.optimizedFramerate })
            .then(() => console.log(`Stream optimized to ${result.optimizedFramerate} FPS.`))
            .catch(e => console.error("Failed to apply new framerate constraints:", e));
        }
      }
    };

    const intervalId = setInterval(optimizer, 5000);

    return () => clearInterval(intervalId);
  }, [isSharing]);

  return (
    <div className="grid gap-6 md:gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3 flex flex-col gap-6">
        <ShareControls
          isSharing={isSharing}
          onStartSharing={handleStartSharing}
          onStopSharing={() => handleStopSharing(stream)}
          videoRef={videoRef}
        />
      </div>
      <div className="lg:col-span-2">
        <ConnectionList />
      </div>
    </div>
  );
}
