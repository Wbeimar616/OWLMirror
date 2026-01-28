"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wifi, Loader } from "lucide-react";
import { useDoc } from "@/firebase";

type ConnectionListProps = {
  connectionId: string | null;
  connectionState: RTCPeerConnectionState;
};

type Connection = {
  id: string;
  initiatorName: string;
  status: 'offering' | 'connected' | 'disconnected';
}

export function ConnectionList({ connectionId, connectionState }: ConnectionListProps) {
  const { data: connection, loading } = useDoc<Connection>(connectionId ? `connections/${connectionId}`: null);

  const getStatus = () => {
    if (!connectionId) return { text: "Idle", variant: "outline" };
    if (loading) return { text: "Initializing...", variant: "secondary" };
    if (!connection) return { text: "Not Found", variant: "destructive" };

    switch (connectionState) {
        case 'connecting':
        case 'new':
            return { text: "Connecting...", variant: "secondary" };
        case 'connected':
             return { text: "Connected", variant: "default" };
        case 'disconnected':
             return { text: "Disconnected", variant: "destructive" };
        case 'failed':
            return { text: "Failed", variant: "destructive" };
        case 'closed':
            return { text: "Closed", variant: "outline" };
    }

    if (connection.status === 'offering') {
      return { text: "Offering...", variant: "secondary" };
    }
    
    return { text: connection.status, variant: "secondary" };
  }

  const status = getStatus();

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
            <Wifi className="w-8 h-8 text-primary" />
            <div>
                <CardTitle className="text-2xl font-bold">Connection Status</CardTitle>
                <CardDescription>
                  Your current screen sharing session status.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {connectionId && connection ? (
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                    <TableCell className="font-medium">{connection.initiatorName}</TableCell>
                    <TableCell className="text-right">
                        <Badge variant={status.variant as any}>
                          {status.text === 'Connecting...' && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                          {status.text}
                        </Badge>
                    </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        ) : (
            <div className="text-center text-muted-foreground p-8">
                <p>Not currently sharing.</p>
                <p className="text-sm">Click "Start Sharing" to begin.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
