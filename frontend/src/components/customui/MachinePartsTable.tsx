// MachinePartsTable.tsx
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import SearchAndFilter from "@/components/customui/SearchAndFilter";
import MachinePartsRow from './MachinePartsRow'; // Import the MachinePartsRow component
import { Badge } from '../ui/badge';

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
    selectedMachine?: { is_running: boolean };
}

const MachinePartsTable: React.FC<MachinePartsTableProps> = ({ MachineParts, onRefresh, selectedMachine }) => {
    // console.log("Machine Parts of", MachineParts);

    return (
        <Card className="mt-5">
            <CardHeader className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <CardTitle>Machine Parts</CardTitle>
                        {MachineParts.length > 0 && (
                            <>
                                <Badge 
                                    variant="secondary" 
                                    className={`text-sm ${selectedMachine?.is_running ? 'bg-green-100' : 'bg-red-100'}`}
                                >
                                    {selectedMachine?.is_running ? "Running" : "Not Running"}
                                </Badge>
                                <Badge 
                                    variant="secondary" 
                                    className={`text-sm ${MachineParts.every(part => part.qty >= part.req_qty) ? 'bg-green-100' : 'bg-orange-100'}`}
                                >
                                    {MachineParts.every(part => part.qty >= part.req_qty) 
                                        ? "All parts sufficient" 
                                        : "Insufficient parts"}
                                </Badge>
                            </>
                        )}
                    </div>
                    <SearchAndFilter
                        filterConfig={[
                            { type: 'partName', label: 'Part Name' },
                            { type: 'partId', label: 'Part ID' },
                        ]}
                    />
                </div>
                <CardDescription>A list of all the machine parts in the selected machine</CardDescription>
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