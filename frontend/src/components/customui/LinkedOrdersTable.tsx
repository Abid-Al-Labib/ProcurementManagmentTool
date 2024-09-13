import { OrderedPart } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../ui/table';
import LinkedOrdersRow from './LinkedOrdersRow';

interface LinkedOrdersTableProp {
    linkedOrderedParts: OrderedPart[];
    searchQuery?: string;
    selectedDate?: Date;
    selectedMachineId?: number;
    selectedFactoryId?: number; // New prop for Factory ID
    selectedFactorySectionId?: number; // New prop for Factory Section ID
}

const LinkedOrdersTable: React.FC<LinkedOrdersTableProp> = ({
    linkedOrderedParts,
    searchQuery,
    selectedDate,
    selectedMachineId,
    selectedFactoryId,
    selectedFactorySectionId,
}) => {
    // Logging initial props
    console.log('LinkedOrdersTable - Initial Props:', {
        linkedOrderedParts,
        searchQuery,
        selectedDate,
        selectedMachineId,
        selectedFactoryId,
        selectedFactorySectionId,
    });

    // Filter the linkedOrderedParts based on searchQuery, selectedDate, and selectedMachineId
    const filteredParts = linkedOrderedParts.filter((part) => {
        const matchesQuery = searchQuery ? part.order_id.toString() === searchQuery : true;
        const matchesDate = selectedDate
            ? new Date(part.orders.created_at).toDateString() === selectedDate.toDateString()
            : true;
        const matchesMachineId = selectedMachineId ? part.orders.machine_id === selectedMachineId : true;
        const matchesFactoryId = selectedFactoryId ? part.orders.factory_id === selectedFactoryId : true;
        const matchesFactorySectionId = selectedFactorySectionId
            ? part.orders.factory_section_id === selectedFactorySectionId
            : true;

        // Log each condition for debugging
        console.log('Filtering Part:', {
            part,
            matchesQuery,
            matchesDate,
            matchesMachineId,
            matchesFactoryId,
            matchesFactorySectionId,
            result: matchesQuery && matchesDate && matchesMachineId && matchesFactoryId && matchesFactorySectionId,
        });

        return matchesQuery && matchesDate && matchesMachineId && matchesFactoryId && matchesFactorySectionId;
    });

    // Logging the filtered parts
    console.log('Filtered Parts:', filteredParts);

    return (
        <div>
            <Card x-chunk="dashboard-06-chunk-0" className="mt-5">
                <CardHeader>
                    <CardTitle>Linked Orders</CardTitle>
                    <CardDescription>
                        This is a list of orders that are linked to this part.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead className="hidden md:table-cell">Created at</TableHead>
                                <TableHead>Machine</TableHead>
                                <TableHead className="hidden md:table-cell">Qty</TableHead>
                                <TableHead className="hidden md:table-cell">Unit Cost</TableHead>
                                <TableHead className="hidden md:table-cell">Vendor</TableHead>
                                <TableHead className="hidden md:table-cell">Purchased Date</TableHead>
                                <TableHead className="hidden md:table-cell">Sent To Factory Date</TableHead>
                                <TableHead className="hidden md:table-cell">Received By Factory Date</TableHead>
                                <TableHead className="md:hidden">Info</TableHead>
                                <TableHead>
                                    <span>Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredParts.map((alinkedOrderedPart) => (
                                <LinkedOrdersRow
                                    key={alinkedOrderedPart.id}
                                    linkedOrderPart={alinkedOrderedPart}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default LinkedOrdersTable;