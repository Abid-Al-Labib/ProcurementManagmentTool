import { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { Loader2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import NavigationBar from "@/components/customui/NavigationBar";
import toast from 'react-hot-toast';
import OrdersTableRow from '@/components/customui/OrdersTableRow';
import { Order } from '@/types';
import { fetchOrders } from '@/services/OrdersService';
import SearchAndFilter from '@/components/customui/SearchAndFilter'; // Import the new component

const OrderPage = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [ordersPerPage] = useState(5); // Set the number of orders per page here
    const [count, setCount] = useState(0);

    const handleApplyFilters = async (filters: any) => {
        console.log('Applied Filters:', filters);
        try {
            setLoading(true);
            const { data, count } = await fetchOrders({
                page: currentPage,
                limit: ordersPerPage,
                query: filters.searchType === 'id' ? filters.searchQuery : '',
                searchDate: filters.selectedDate,
                statusId: filters.selectedStatusId !== -1 ? filters.selectedStatusId : undefined,
                departmentId: filters.selectedDepartmentId !== -1 ? filters.selectedDepartmentId : undefined,
                factoryId: filters.selectedFactoryId !== -1 ? filters.selectedFactoryId : undefined,
                factorySectionId: filters.selectedFactorySectionId !== -1 ? filters.selectedFactorySectionId : undefined,
                machineId: filters.selectedMachineId !== -1 ? filters.selectedMachineId : undefined,
            });
            setOrders(data);
            setCount(count ?? 0);
            setTotalPages(Math.ceil((count ?? 0) / ordersPerPage));
        } catch (error) {
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const handleResetFilters = () => {
        setCurrentPage(1);
        handleApplyFilters({
            searchType: 'id',
            searchQuery: '',
            selectedDate: undefined,
            selectedFactoryId: -1,
            selectedFactorySectionId: -1,
            selectedMachineId: -1,
            selectedDepartmentId: -1,
            selectedStatusId: -1,
        });
    };

    useEffect(() => {
        handleApplyFilters({});
    }, [currentPage]);

    return (
        <>
            <NavigationBar />
            <div className="flex min-h-screen mt-3 w-full flex-col bg-muted/40">
                <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                        <Tabs defaultValue="all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Search & Filter Component */}
                                    <SearchAndFilter
                                        filterConfig={[
                                            { type: 'factory', label: 'Factory' },
                                            { type: 'factorySection', label: 'Factory Section' },
                                            { type: 'machine', label: 'Machine' },
                                            { type: 'department', label: 'Department' },
                                            { type: 'status', label: 'Status' },
                                            { type: 'id', label: 'Enter ID' },
                                            { type: 'date', label: 'Select Date' },
                                        ]}
                                        onApplyFilters={handleApplyFilters} // Use the handleApplyFilters callback
                                        onResetFilters={handleResetFilters} // Use the handleResetFilters callback
                                    />
                                </div>

                                {/* Create Order Button - Positioned on the right */}
                                <Link to="/createorder">
                                    <Button size="sm" className="h-8 gap-1 bg-blue-950">
                                        <PlusCircle className="h-3.5 w-3.5" />
                                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                            Create New Order
                                        </span>
                                    </Button>
                                </Link>
                            </div>
                            <TabsContent value="all">
                                <Card x-chunk="dashboard-06-chunk-0">
                                    <CardHeader>
                                        <CardTitle>Order List</CardTitle>
                                        <CardDescription>
                                            Search and view orders.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Machine</TableHead>
                                                    <TableHead className="hidden md:table-cell">Created at</TableHead>
                                                    <TableHead>Created by user</TableHead>
                                                    <TableHead>Department</TableHead>
                                                    <TableHead>Current status</TableHead>
                                                    <TableHead>
                                                        <span className="sr-only">Actions</span>
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            {loading ? (
                                                <div className='flex flex-row justify-center'>
                                                    <Loader2 className='h-8 w-8 animate-spin' />
                                                </div>
                                            ) : (
                                                <TableBody>
                                                    {orders.map(order => (
                                                        <OrdersTableRow
                                                            order={order}
                                                            onDeleteRefresh={() => handleApplyFilters({})}
                                                        />
                                                    ))}
                                                </TableBody>
                                            )}
                                        </Table>
                                    </CardContent>
                                    <CardFooter>
                                        <div className="flex justify-between items-center w-full text-xs text-muted-foreground">
                                            <span>
                                                Showing <strong>{(currentPage - 1) * ordersPerPage + 1}</strong> to <strong>{Math.min(currentPage * ordersPerPage, count)}</strong> of <strong>{count}</strong> Orders
                                            </span>

                                            <div className="flex gap-2">
                                                {/* Pagination Buttons */}
                                                <Button
                                                    size="sm"
                                                    onClick={() => setCurrentPage(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                >
                                                    Previous
                                                </Button>
                                                {[...Array(totalPages)].map((_, i) => (
                                                    <Button
                                                        key={i}
                                                        size="sm"
                                                        variant={currentPage === i + 1 ? 'default' : 'outline'}
                                                        onClick={() => setCurrentPage(i + 1)}
                                                    >
                                                        {i + 1}
                                                    </Button>
                                                ))}
                                                <Button
                                                    size="sm"
                                                    onClick={() => setCurrentPage(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </main>
                </div>
            </div>
        </>
    );
}

export default OrderPage;
