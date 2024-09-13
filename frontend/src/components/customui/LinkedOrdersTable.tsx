import { OrderedPart } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../ui/table';
import LinkedOrdersRow from './LinkedOrdersRow';
import SearchAndFilter from './SearchAndFilter';
import { useState } from 'react';

interface LinkedOrdersTableProps {
    linkedOrderedParts: OrderedPart[];
}

const LinkedOrdersTable: React.FC<LinkedOrdersTableProps> = ({ linkedOrderedParts }) => {
    const [filters, setFilters] = useState({
        searchQuery: '',
        selectedDate: undefined as Date | undefined,
        selectedFactoryId: -1,
        selectedFactorySectionId: -1,
        selectedMachineId: -1,
        selectedDepartmentId: -1,
        selectedStatusId: -1,
    });

    const handleApplyFilters = (newFilters: typeof filters) => {
        setFilters(newFilters);
        console.log('Applied Filters:', newFilters); // Debug log for applied filters
    };

    const handleResetFilters = () => {
        const resetFilters = {
            searchQuery: '',
            selectedDate: undefined,
            selectedFactoryId: -1,
            selectedFactorySectionId: -1,
            selectedMachineId: -1,
            selectedDepartmentId: -1,
            selectedStatusId: -1,
        };
        setFilters(resetFilters);
        console.log('Reset Filters:', resetFilters); // Debug log for reset filters
    };

    const filteredParts = linkedOrderedParts.filter((part) => {
        const matchesQuery = filters.searchQuery
            ? part.order_id.toString() === filters.searchQuery
            : true;

        const matchesDate = filters.selectedDate
            ? new Date(part.orders.created_at).toDateString() === filters.selectedDate.toDateString()
            : true;

        console.log("TESTING MATCHES FACTORY", filters.selectedFactoryId);

        const matchesFactory = (filters.selectedFactoryId !== -1 && filters.selectedFactoryId !== undefined)
            ? part.orders.factory_id === filters.selectedFactoryId
            : true;

        const matchesFactorySection = (filters.selectedFactorySectionId !== -1 && filters.selectedFactorySectionId !== undefined)
            ? part.orders.factory_section_id === filters.selectedFactorySectionId
            : true;

        const matchesMachineId = (filters.selectedMachineId !== -1 && filters.selectedMachineId !== undefined)
            ? part.orders.machine_id === filters.selectedMachineId
            : true;

        console.log("matchesFactory:", matchesFactory); // Log to see the state of matchesFactory

        return (
            matchesQuery &&
            matchesDate &&
            matchesFactory &&
            matchesFactorySection &&
            matchesMachineId
        );
    });

    console.log('Filtered Parts:', filteredParts); // Debug log for filtered parts

        return (
        <div>
            <Card x-chunk="dashboard-06-chunk-0" className="mt-5">
                <CardHeader className="flex justify-between ">
                        <div>
                            <CardTitle>Linked Orders</CardTitle>
                            <CardDescription>
                                This is a list of orders that are linked to this part.
                            </CardDescription>
                        </div>
                        <div className="ml-auto"> {/* Use ml-auto to push the button to the right */}
                            <SearchAndFilter
                                filterConfig={[
                                    { type: 'id', label: 'Enter Order ID' },
                                    { type: 'date', label: 'Select Date' },
                                    { type: 'factory', label: 'Factory' },
                                    { type: 'factorySection', label: 'Factory Section' },
                                    { type: 'machine', label: 'Machine' },
                                ]}
                                onApplyFilters={handleApplyFilters}
                                onResetFilters={handleResetFilters}
                            />
                        </div>
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