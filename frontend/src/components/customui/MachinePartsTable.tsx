// MachinePartsTable.tsx
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '../ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import SearchAndFilter from "@/components/customui/SearchAndFilter";
import MachinePartsRow from './MachinePartsRow'; // Import the MachinePartsRow component
 

type MachinePart = {
    id: number;
    machine_id: number;
    machine_name: string;
    part_id: number;
    part_name: string;
    qty: number;
    req_qty: number;
};

interface MachinePartsTableProps {
    MachineParts: MachinePart[];
    onApplyFilters: (filters: any) => void;
    onResetFilters: () => void;
    onRefresh: () => Promise<void>; // Add this line to include the onRefresh prop
}

const MachinePartsTable: React.FC<MachinePartsTableProps> = ({ MachineParts, onApplyFilters, onResetFilters, onRefresh}) => {
    console.log("Machine Parts of", MachineParts);

    return (
        <Card className="mt-5">
            <CardHeader className="flex justify-between">
                <CardTitle>Machine Parts</CardTitle>
                <CardDescription>This is a list of machine parts.</CardDescription>
                <div className="ml-auto">
                    <SearchAndFilter
                        filterConfig={[
                            // { type: 'factory', label: 'Factory'},
                            // { type: 'factorySection' , label: 'Factory Section'},
                            // { type: 'machine', label: 'Machine' },
                            { type: 'partName', label: 'Part Name' },
                            { type: 'partId', label: 'Part ID' },
                        ]}
                        onApplyFilters={onApplyFilters}
                        onResetFilters={onResetFilters}
                        hideDefaultIdDateSearch={true}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Part ID</TableHead>
                            <TableHead>Part Name</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Required Quantity</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {MachineParts.map((MachinePart) => (
                            <MachinePartsRow key={MachinePart.id} MachinePart={MachinePart} onRefresh={onRefresh}/>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default MachinePartsTable;