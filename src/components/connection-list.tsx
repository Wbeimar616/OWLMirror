import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi } from "lucide-react";

const devices = [
  { name: "Living Room TV", status: "Available", type: "TV" },
  { name: "John's Laptop", status: "Connected", type: "Laptop" },
  { name: "Conference Room Projector", status: "Available", type: "Projector" },
  { name: "Mary's Tablet", status: "Unavailable", type: "Tablet" },
];

export function ConnectionList() {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
            <Wifi className="w-8 h-8 text-primary" />
            <div>
                <CardTitle className="text-2xl font-bold">Available Devices</CardTitle>
                <CardDescription>
                Devices on your network for mirroring.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.name}>
                <TableCell className="font-medium">{device.name}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      device.status === "Connected"
                        ? "default"
                        : device.status === "Available"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {device.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant={device.status === 'Connected' ? 'outline' : 'default'}
                    disabled={device.status === "Unavailable"}
                  >
                    {device.status === "Connected" ? "Disconnect" : "Connect"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
