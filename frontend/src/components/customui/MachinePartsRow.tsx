// MachinePartsRow.tsx
import { useState } from 'react';
import { TableRow, TableCell } from '../ui/table';
import { Button } from '../ui/button';
import { updateRequiredQuantity } from "@/services/MachinePartsService";
import toast from 'react-hot-toast'; // Optional: For showing success/error messages

type MachinePart = {
    id: number;
    machine_id: number;
    machine_number: number;
    part_id: number;
    part_name: string;
    qty: number;
    req_qty: number;
};

interface MachinePartsRowProps {
    MachinePart: MachinePart;
}



const MachinePartsRow: React.FC<MachinePartsRowProps> = ({ MachinePart }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newReqQty, setNewReqQty] = useState<number>(MachinePart.req_qty);

    const handleUpdate = async () => {
        try {
            await updateRequiredQuantity(MachinePart.id, newReqQty);
            setIsEditing(false); 
            MachinePart.req_qty = newReqQty; // Directly update the MachinePart object with the new quantity
        } catch (error) {
            // console.error('Failed to update required quantity:', error);
            toast.error('Failed to update required quantity.'); // Optional: Show error message
        }
    };

    return (
        <TableRow key={MachinePart.id}>
            <TableCell>{MachinePart.part_id}</TableCell>
            <TableCell>{MachinePart.part_name}</TableCell>
            <TableCell>{MachinePart.qty}</TableCell>
            <TableCell>
                {isEditing ? (
                    <input
                        type="number"
                        value={newReqQty}
                        onChange={(e) => setNewReqQty(Number(e.target.value))}
                        className="border p-1 rounded w-20"
                    />
                ) : (
                    MachinePart.req_qty
                )}
            </TableCell>
            <TableCell>
                {isEditing ? (
                    <Button onClick={handleUpdate} className="ml-2">
                        Save
                    </Button>
                ) : (
                    <Button onClick={() => setIsEditing(true)} className="ml-2">
                        Set Quantity
                    </Button>
                )}
            </TableCell>
        </TableRow>
    );
};

export default MachinePartsRow;
