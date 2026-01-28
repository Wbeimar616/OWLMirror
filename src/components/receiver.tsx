"use client";

import React, { useState, useRef } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, Loader, ScreenShare } from "lucide-react";
import { answerOffer } from "@/firebase/webrtc";
import { cn } from "@/lib/utils";

type Connection = {
  id: string;
  initiatorName: string;
  status: 'offering' | 'connected' | 'disconnected';
};

export function Receiver() {
  const firestore = useFirestore();
  const { data: connections, loading } = useCollection<Connection>("connections");
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [connectedId, setConnectedId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const videoRef = useRef<HTMLVideoElement>(null);

  const availableConnections = connections?.filter(c => c.status === 'offering');

  const onConnectionStateChange = (state: RTCPeerConnectionState) => {
    setConnectionState(state);
    if (state === 'connected') {
        setIsConnecting(null);
    }
    if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        setIsConnecting(null);
        setConnectedId(null);
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }
  }

  const handleConnect = async (connectionId: string) => {
    if (!firestore) return;
    setIsConnecting(connectionId);
    setConnectedId(connectionId);
    await answerOffer(firestore, connectionId, videoRef.current, onConnectionStateChange);
  };

  const getStatusText = () => {
    if (!connectedId) return "Select a device to mirror";
    switch (connectionState) {
        case 'new': return 'Initializing...';
        case 'connecting': return 'Connecting...';
        case 'connected': return 'Connected';
        case 'disconnected': return 'Disconnected. Select another device.';
        case 'failed': return 'Connection Failed. Please try again.';
        case 'closed': return 'Connection Closed. Select another device.';
        default: return 'Select a device to mirror';
    }
  }

  return (
    <div className="grid gap-6 md:gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3 flex flex-col gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ScreenShare className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="text-2xl font-bold">Receiving Screen</CardTitle>
                <CardDescription>
                  {getStatusText()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
             <div className="aspect-video bg-muted/50 rounded-lg overflow-hidden border">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
                <Wifi className="w-8 h-8 text-primary" />
                <div>
                    <CardTitle className="text-2xl font-bold">Available Devices</CardTitle>
                    <CardDescription>
                    Devices on your network available for mirroring.
                    </CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <div className="flex items-center justify-center p-8"><Loader className="animate-spin" /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableConnections && availableConnections.length > 0 ? availableConnections.map((conn) => (
                  <TableRow key={conn.id}>
                    <TableCell className="font-medium">{conn.initiatorName}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleConnect(conn.id)}
                        disabled={!!isConnecting || !!connectedId}
                      >
                         {isConnecting === conn.id && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                        Connect
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                            No available devices found.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
