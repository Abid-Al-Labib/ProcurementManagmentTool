// MachinePartsRow.tsx
import { useState } from 'react';
import { TableRow, TableCell } from '../ui/table';
import { Button } from '../ui/button';
import { updateRequiredQuantity } from "@/services/MachinePartsService";
import toast from 'react-hot-toast'; // Optional: For showing success/error messages

type MachinePart = {
    id: number;
    machine_id: number;
    machine_name: string;
    part_id: number;
    part_name: string;
    qty: number;
    req_qty: number;
};

interface MachinePartsRowProps {
    MachinePart: MachinePart;
    onRefresh: () => Promise<void>; // Add onRefresh prop to the row interface
}

const MachinePartsRow: React.FC<MachinePartsRowProps> = ({ MachinePart, onRefresh }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newCurQty, setNewCurQty] = useState<number>(MachinePart.qty);
    const [newReqQty, setNewReqQty] = useState<number>(MachinePart.req_qty);

    const handleUpdate = async () => {
        try {
            await updateRequiredQuantity(MachinePart.id, newCurQty, newReqQty);
            setIsEditing(false); 
            MachinePart.req_qty = newReqQty; // Directly update the MachinePart object with the new quantity
            await onRefresh(); // Trigger a refresh after successful update
        } catch (error) {
            // console.error('Failed to update required quantity:', error);
            toast.error('Failed to update required quantity.'); // Optional: Show error message
        }
    };

    return (
        <TableRow key={MachinePart.id}>
            <TableCell>{MachinePart.part_id}</TableCell>
            <TableCell>{MachinePart.part_name}</TableCell>
            <TableCell>
                {isEditing ? (
                <input
                    type="number"
                    value={newCurQty}
                        onChange={(e) => setNewCurQty(Number(e.target.value))}
                    className="border p-1 rounded w-20"
                />
            ) : (
                <span className={MachinePart.qty < MachinePart.req_qty ? 'text-orange-500' : ''}>
                    {MachinePart.qty}
                </span>
            )}</TableCell>
            <TableCell>
                {isEditing ? (
                    <input
                        type="number"
                        value={newReqQty}
                        onChange={(e) => setNewReqQty(Number(e.target.value))}
                        className="border p-1 rounded w-20"
                    />
                ) : (
                    MachinePart.req_qty === -1 ? (
                        <span className="text-red-500">--</span>
                    ) : (
                        MachinePart.req_qty
                    )
                )}
            </TableCell>
            <TableCell>
                {isEditing ? (
                    <>
                        <Button onClick={handleUpdate} className="ml-auto">
                            Save
                        </Button>
                        <Button onClick={() => setIsEditing(false)} className="ml-2">
                            Cancel
                        </Button>
                    </>
                ) : (
                    <Button onClick={() => setIsEditing(true)} className="ml-auto">
                        Edit
                    </Button>
                )}
            </TableCell>
        </TableRow>
    );
};

export default MachinePartsRow;
