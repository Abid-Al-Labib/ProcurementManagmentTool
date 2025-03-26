import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchOrders } from "@/services/OrdersService";
import { supabase_client } from "@/services/SupabaseClient";
import SearchAndFilter from "@/components/customui/SearchAndFilter";
import OrdersTableRow from "@/components/customui/OrdersTableRow";
import { useAuth } from "@/context/AuthContext";
import { Order } from "@/types";
import toast from "react-hot-toast";
import { Loader2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import NavigationBar from "@/components/customui/NavigationBar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Filter } from "@/types";



const OrderPage = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [ordersPerPage] = useState(20);
    const [count, setCount] = useState(0);
    const profile = useAuth().profile;

    const [searchParams, setSearchParams] = useSearchParams();

    const [showCompleted, setShowCompleted] = useState<boolean>(searchParams.has("showCompleted"));

    const [currentPage, setCurrentPage] = useState(
        searchParams.get("page") ? Number(searchParams.get("page")) : 1
    );

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", String(page));
        setSearchParams(params);
    };
    
    
    const filterConfig = [
        { type: "factory"},
        { type: "factorySection"},
        { type: "machine"},
        { type: "department"},
        { type: "status"},
        { type: "id", label: ["Enter ID", "Enter Requisition Number"]},
        { type: "date"},
        { type: "orderType"},
    ];
    
    
    const [filters, setFilters] = useState<Filter>({
        searchType: searchParams.get("searchType") || "id",
        searchQuery: searchParams.get("query") || "",
        reqNumQuery: searchParams.get("reqNum") || "",
        selectedDate: searchParams.get("date") ? new Date(searchParams.get("date")!) : undefined,
        dateFilterType: searchParams.get("dateFilterType") ? Number(searchParams.get("dateFilterType")) : 1,
        selectedFactoryId: searchParams.get("factory") ? Number(searchParams.get("factory")) : undefined,
        selectedFactorySectionId: searchParams.get("section") ? Number(searchParams.get("section")) : undefined,
        selectedMachineId: searchParams.get("machine") ? Number(searchParams.get("machine")) : undefined,
        selectedDepartmentId: searchParams.get("department") ? Number(searchParams.get("department")) : undefined,
        selectedStatusId: searchParams.get("status") ? Number(searchParams.get("status")) : undefined,
        selectedOrderType: searchParams.get("orderType") || "all",
        showCompletedOrders: searchParams.has("showCompleted")
    });
    
    useEffect(() => {
        setFilters({
            searchType: searchParams.get("searchType") || "id",
            searchQuery: searchParams.get("query") || "",
            reqNumQuery: searchParams.get("reqNum") || "",
            selectedDate: searchParams.get("date") ? new Date(searchParams.get("date")!) : undefined,
            dateFilterType: searchParams.get("dateFilterType") ? Number(searchParams.get("dateFilterType")) : 1,
            selectedFactoryId: searchParams.get("factory") ? Number(searchParams.get("factory")) : undefined,
            selectedFactorySectionId: searchParams.get("section") ? Number(searchParams.get("section")) : undefined,
            selectedMachineId: searchParams.get("machine") ? Number(searchParams.get("machine")) : undefined,
            selectedDepartmentId: searchParams.get("department") ? Number(searchParams.get("department")) : undefined,
            selectedStatusId: searchParams.get("status") ? Number(searchParams.get("status")) : undefined,
            selectedOrderType: searchParams.get("orderType") || "all",
            showCompletedOrders: searchParams.has("showCompleted")

        });
        setCurrentPage(searchParams.get("page") ? Number(searchParams.get("page")) : 1);
    }, [searchParams]);


    useEffect(() => {
    fetchOrdersForPage();
}, [filters, currentPage]); 


    const fetchOrdersForPage = async (page = currentPage) => {

        try {
            setLoading(true);
            const { data, count } = await fetchOrders({
                page,
                limit: ordersPerPage,
                showCompleted: showCompleted,
                filters: filters,
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
    

    useEffect(() => {
        const channel = supabase_client
        .channel('order-changes')
        .on(
            'postgres_changes',
            {
            event: '*',
            schema: 'public',
            table: 'orders'
            },
            () => {
                console.log("Changes detected, processing realtime")
                fetchOrdersForPage();
            }
        )
        .subscribe()
        // fetchOrdersForPage(currentPage);
        
    }, [currentPage]);

    return (
        <>
            <NavigationBar />
            <div className="flex min-h-screen w-full flex-col bg-muted/40">
                <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                        <Tabs defaultValue="all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 w-full">
                                    {/* Search & Filter Button */}
                                    <SearchAndFilter filterConfig={filterConfig} />

                                    {/* Filter Summary */}
                                    {/* <span className="text-gray-500 text-ss max-w-[150px] md:max-w-[300px] lg:max-w-[400px] truncate overflow-hidden ml-4">
                                        {filterSummary}
                                    </span> */}

                                    <div className="items-top flex space-x-2">
                                    <Switch
                                        checked={showCompleted}
                                        onCheckedChange={() => {
                                            const newShowCompleted = !showCompleted;
                                            setShowCompleted(newShowCompleted); 
                                            
                                            const params = new URLSearchParams(searchParams);
                                            if (newShowCompleted) {
                                                params.set("showCompleted", "true");
                                            } else {
                                                params.delete("showCompleted");
                                            }
                                            
                                            setSearchParams(params);
                                        }}
                                    />

                                        <Label>Show Completed Orders</Label>
                                    </div>
                                </div>

                                {/* Create Order Button - Positioned on the right */}
                                { (profile?.permission==='department' || profile?.permission==="admin" || profile?.permission==='finance') &&
                                    <Link to="/createorder">
                                        <Button size="sm" className="h-8 gap-1 bg-blue-950">
                                            <PlusCircle className="h-3.5 w-3.5" />
                                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                                Create New Order
                                            </span>
                                        </Button>
                                    </Link>
                                }
                            </div>
                            <TabsContent value="all">
                                <Card x-chunk="dashboard-06-chunk-0">
                                    <CardHeader>
                                        <CardTitle>Order List</CardTitle>
                                        <CardDescription>
                                            Search, view and manage your orders.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>ID</TableHead>
                                                    <TableHead className='hidden md:table-cell'>Req Num</TableHead>
                                                    <TableHead className="hidden md:table-cell">Order for Machine/Storage</TableHead>
                                                    <TableHead className="hidden md:table-cell">Created at</TableHead>
                                                    <TableHead className="hidden md:table-cell">Created by</TableHead>
                                                    <TableHead className="hidden md:table-cell">Department</TableHead>
                                                    <TableHead className="table-cell md:hidden">Info</TableHead>
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

                                            <div className="flex gap-2 overflow-x-auto">
                                                {/* Pagination Buttons */}
                                                <Button
                                                    size="sm"
                                                    onClick={() => goToPage(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                >
                                                    Previous
                                                </Button>

                                                {/* First Page */}
                                                <Button
                                                    size="sm"
                                                    variant={currentPage === 1 ? 'default' : 'outline'}
                                                    onClick={() => goToPage(1)}
                                                >
                                                    1
                                                </Button>

                                                {/* Ellipses if needed before the current page */}
                                                {currentPage > 4 && <span className="mx-2">...</span>}

                                                {/* Pages around the current page (2 before and 2 after) */}
                                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                    .filter(page =>
                                                        page >= currentPage - 2 && page <= currentPage + 2 && page !== 1 && page !== totalPages
                                                    )
                                                    .map((page) => (
                                                        <Button
                                                            key={page}
                                                            size="sm"
                                                            variant={currentPage === page ? 'default' : 'outline'}
                                                            onClick={() => goToPage(page)}
                                                        >
                                                            {page}
                                                        </Button>
                                                    ))}

                                                {/* Ellipses if needed after the current page */}
                                                {currentPage < totalPages - 3 && <span className="mx-2">...</span>}

                                                {/* Last Page */}
                                                {totalPages > 1 && (
                                                    <Button
                                                        size="sm"
                                                        variant={currentPage === totalPages ? 'default' : 'outline'}
                                                        onClick={() => goToPage(totalPages)}
                                                    >
                                                        {totalPages}
                                                    </Button>
                                                )}

                                                <Button
                                                    size="sm"
                                                    onClick={() => goToPage(currentPage + 1)}
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
