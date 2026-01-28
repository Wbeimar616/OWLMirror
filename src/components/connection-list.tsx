"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, Loader, ScreenShare } from "lucide-react";
import { useCollection } from "@/firebase";

type Receiver = {
  id: string;
  name: string;
  status: 'available' | 'connecting' | 'connected' | 'disconnected';
};

type ReceiverListProps = {
  onShare: (receiverId: string) => void;
  sharingTo: string | null;
  connectionState: RTCPeerConnectionState;
};

export function ReceiverList({ onShare, sharingTo, connectionState }: ReceiverListProps) {
  const { data: receivers, loading } = useCollection<Receiver>("receivers");

  const availableReceivers = receivers?.filter(r => r.status === 'available');

  const getStatus = (receiver: Receiver) => {
    if (sharingTo !== receiver.id) {
        return { text: "Disponible", variant: "default" };
    }

    switch (connectionState) {
        case 'connecting':
        case 'new':
            return { text: "Conectando...", variant: "secondary" };
        case 'connected':
             return { text: "Compartiendo", variant: "destructive" };
        case 'disconnected':
        case 'failed':
        case 'closed':
            return { text: "Desconectado", variant: "outline" };
    }
    
    return { text: receiver.status, variant: "secondary" };
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
            <Wifi className="w-8 h-8 text-primary" />
            <div>
                <CardTitle className="text-2xl font-bold">Dispositivos Disponibles</CardTitle>
                <CardDescription>
                  Dispositivos en tu red listos para recibir.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex items-center justify-center p-8"><Loader className="animate-spin" /></div> : (
        <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
            {receivers && receivers.length > 0 ? receivers.map((receiver) => {
              const status = getStatus(receiver);
              const isCurrent = sharingTo === receiver.id;
              const canShare = !sharingTo && receiver.status === 'available';
              return (
                <TableRow key={receiver.id}>
                    <TableCell className="font-medium">{receiver.name}</TableCell>
                    <TableCell>
                        <Badge variant={status.variant as any}>
                          {status.text === 'Conectando...' && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                          {status.text}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                    <Button
                        size="sm"
                        onClick={() => onShare(receiver.id)}
                        disabled={!canShare}
                        variant={isCurrent ? "destructive" : "default"}
                    >
                        {isCurrent ? <ScreenShare className="mr-2 h-4 w-4" /> : null}
                        {isCurrent ? "Compartiendo" : "Compartir"}
                    </Button>
                    </TableCell>
                </TableRow>
              )
            }) : (
                <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground p-8">
                        No se encontraron dispositivos receptores.
                        <p className="text-sm">Asegúrate de que el otro dispositivo haya abierto la aplicación en la página /tv.</p>
                    </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}
