// MachineStatus.tsx
import { useEffect, useState } from "react";
import { fetchMachineById } from "@/services/MachineServices";
import { fetchMachineParts } from "@/services/MachinePartsService";
import { Loader2 } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

interface MachineStatusProps {
    machineId?: number;
}

const MachineStatus: React.FC<MachineStatusProps> = ({ machineId }) => {
    const [isRunning, setIsRunning] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [sufficientParts, setSufficientParts] = useState<boolean>(false);

    useEffect(() => {
        const loadMachineStatus = async () => {
            if (machineId === undefined) {
                setIsRunning(null);
                setSufficientParts(false);
                return;
            }

            setLoading(true);
            try {
                // Fetch machine details to get the running status
                const machine = await fetchMachineById(machineId);
                console.log("Fetched Machine:", machine); // Log the fetched machine details
                if (machine) {
                    setIsRunning(machine.is_running);
                } else {
                    setIsRunning(null);
                }

                // Fetch machine parts to check part sufficiency
                const fetchedParts = await fetchMachineParts(machineId);
                console.log("Fetched Parts:", fetchedParts); // Log the fetched parts details

                setSufficientParts(true);

                let allPartsSufficient = true; // Assume all parts are sufficient

                for (const part of fetchedParts) {
                    console.log("Checking part:", part); 
                    console.log(part.qty, " ", part.req_qty);
                    if (part.req_qty > part.qty) {
                        console.log("Insufficient part:",  "Qty:", part.qty, "Req Qty:", part.req_qty);
                        allPartsSufficient = false; 
                        break; 
                    }
                }
                setSufficientParts(allPartsSufficient); // Set the state once after the loop


            } catch (error) {
                console.error("Failed to fetch machine status or parts:", error);
                setIsRunning(null);
                setSufficientParts(false);
            } finally {
                setLoading(false);
            }
        };

        loadMachineStatus();
    }, [machineId],);

    if (loading) {
        return <Loader2 className="animate-spin" />;
    }

    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle>Machine Status</CardTitle>
            </CardHeader>

            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Part Sufficiency</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                {machineId === undefined ? (
                                    "No machine selected"
                                ) : isRunning !== null ? (
                                        <Badge variant="secondary" className={isRunning ? 'bg-green-100' : 'bg-red-100'}>
                                            {isRunning ? "Running" : "Not Running"}
                                        </Badge>
                                ) : (
                                    "No machine selected"
                                )}
                            </TableCell>
                            <TableCell>
                                {machineId !== undefined && machineId !== -1 ? (
                                    sufficientParts ? (
                                        <Badge variant="secondary" className="bg-green-100">All parts are sufficient.</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-orange-100">Insufficient parts to meet requirements.</Badge>
                                    )
                                ) : (
                                    "No machine parts loaded."
                                )}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default MachineStatus;
