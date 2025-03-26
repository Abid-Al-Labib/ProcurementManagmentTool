import { OrderedPart } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../ui/table';
import LinkedOrdersRow from './LinkedOrdersRow';
import SearchAndFilter from './SearchAndFilter';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { convertBDTimeToUtc } from '@/services/helper';

interface LinkedOrdersTableProps {
    linkedOrderedParts: OrderedPart[];
}

const LinkedOrdersTable: React.FC<LinkedOrdersTableProps> = ({ linkedOrderedParts }) => {
    const profile = useAuth().profile;
    const [searchParams] = useSearchParams();

    const filterConfig = [
        {type: "id", label: ["Enter Order ID","Enter Requistion Number"]},
        {type: "date"},
        {type: "factory"},
        {type: "factorySection"},
        {type: "machine"},
    ];

    const [filteredParts, setFilteredParts] = useState<OrderedPart[]>(linkedOrderedParts);

    useEffect(() => {
        const searchQuery = searchParams.get("query") || "";
        const reqNumQuery = searchParams.get("reqNum") || "";
        const selectedDate = searchParams.get("date") ? new Date(searchParams.get("date")!) : undefined;
        const dateFilterType = searchParams.get("dateFilterType") ? Number(searchParams.get("dateFilterType")) : 1;
        const selectedFactoryId = searchParams.get("factory") ? Number(searchParams.get("factory")) : undefined;
        const selectedFactorySectionId = searchParams.get("section") ? Number(searchParams.get("section")) : undefined;
        const selectedMachineId = searchParams.get("machine") ? Number(searchParams.get("machine")) : undefined;

        const filtered = linkedOrderedParts.filter((part) => {
            const matchesQuery = searchQuery ? part.order_id.toString() === searchQuery : true;
            const matchesReqNumQuery = reqNumQuery ? part.orders.req_num.toString() === reqNumQuery : true;
            const matchesDate = selectedDate ? (() => {
                const searchDateStr = selectedDate.toISOString().split('T')[0];
            
                // Convert selected date to UTC start and end using Bangladesh time
                const startOfDayUTC = convertBDTimeToUtc(`${searchDateStr}T00:00:00`);
                const endOfDayUTC = convertBDTimeToUtc(`${searchDateStr}T23:59:59`);
            
                if (dateFilterType === 1) {
                    return new Date(part.orders.created_at) >= new Date(startOfDayUTC) &&
                           new Date(part.orders.created_at) <= new Date(endOfDayUTC);
                } else if (dateFilterType === 2) {
                    return new Date(part.orders.created_at) <= new Date(startOfDayUTC);
                } else if (dateFilterType === 3) {
                    return new Date(part.orders.created_at) >= new Date(endOfDayUTC);
                }
                return true;
            })() : true;
            
            const matchesFactory = selectedFactoryId ? part.orders.factory_id === selectedFactoryId : true;
            const matchesFactorySection = selectedFactorySectionId ? part.orders.factory_section_id === selectedFactorySectionId : true;
            const matchesMachineId = selectedMachineId ? part.orders.machine_id === selectedMachineId : true;

            return matchesQuery && matchesReqNumQuery && matchesDate && matchesFactory && matchesFactorySection && matchesMachineId;
        });

        setFilteredParts(filtered);
    }, [searchParams, linkedOrderedParts]); // Runs whenever filters or linkedOrderedParts change

    return (
        <div>
            <Card x-chunk="dashboard-06-chunk-0" className="mt-5">
                <CardHeader className="flex justify-between">
                    <div>
                        <CardTitle>Past Orders</CardTitle>
                        <CardDescription>
                            This is a list of orders where this part was previously purchased.
                        </CardDescription>
                    </div>
                    <div className="ml-auto">
                        <SearchAndFilter filterConfig={filterConfig} />
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
                                {(profile?.permission === 'admin' || profile?.permission === 'finance') && (
                                    <>
                                        <TableHead className="hidden md:table-cell">Brand</TableHead>
                                        <TableHead className="hidden md:table-cell">Unit Cost</TableHead>
                                        <TableHead className="hidden md:table-cell">Vendor</TableHead>
                                    </>
                                )}
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
