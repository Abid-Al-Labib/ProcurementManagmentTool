// MachineStatus.tsx
import { useEffect, useState } from "react";
import { fetchMachineById } from "@/services/MachineServices";
import { fetchMachineParts } from "@/services/MachinePartsService";
import { Loader2 } from "lucide-react";

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
        <div className="p-6 border rounded-lg bg-gray-100 shadow-md w-1/2">
            <h3 className="text-lg font-bold mb-2">Machine Status</h3>
            {machineId === undefined ? (
                <p className="mb-2">No machine selected</p>
            ) : isRunning !== null ? (
                <p className={`mb-2 ${isRunning ? 'text-green-500' : 'text-red-500'}`}>
                    Status: {isRunning ? "Running" : "Not Running"}
                </p>
            ) : (
                <p className="mb-2">No machine selected</p>
            )}
            {machineId !== undefined && machineId !== -1 ? (
                sufficientParts ? (
                    <p className="text-green-500">All parts are sufficient.</p>
                ) : (
                    <p className="text-yellow-500">Insufficient parts to meet requirements.</p>
                )
            ) : (
                <p>No machine parts loaded.</p>
            )}
        </div>
    );
};

export default MachineStatus;
