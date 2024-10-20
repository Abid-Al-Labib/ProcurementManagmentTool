// AllMachinesStatus.tsx
import { useEffect, useState } from "react";
import { fetchFactories, fetchAllFactorySections } from "@/services/FactoriesService";
import { fetchMachines } from "@/services/MachineServices";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "../ui/badge";
import { Button } from "@/components/ui/button";

interface Factory {
    id: number;
    name: string;
}

interface FactorySection {
    id: number;
    name: string;
    factory_id: number;
}

interface Machine {
    id: number;
    name: string;
    is_running: boolean;
    factory: string;
    factory_section_id: number;
    factory_section_name: string;
}

interface AllMachinesStatusProps {
    factoryId?: number;
    factorySectionId?: number;
    handleRowSelection: (factoryId: number, factorySectionId: number, machineId: number) => void;
}

const AllMachinesStatus: React.FC<AllMachinesStatusProps> = ({ factoryId, factorySectionId, handleRowSelection }) => {
    const [factories, setFactories] = useState<Factory[]>([]);
    const [factorySections, setFactorySections] = useState<FactorySection[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [machinesPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                // Fetch factories and factory sections
                const fetchedFactories = await fetchFactories();
                setFactories(fetchedFactories);
                const allSections = await fetchAllFactorySections();
                setFactorySections(allSections);

                // Fetch machines for the first page
                await fetchMachinesForPage(1, sortOrder);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [factoryId, factorySectionId]);

    const fetchMachinesForPage = async (page: number, sortOrder: 'asc' | 'desc' | null) => {
        try {
            setLoading(true);

            let fetchedFactories = factories;
            if (factories.length === 0) {
                fetchedFactories = await fetchFactories();
                setFactories(fetchedFactories);
            }

            // Fetch factory sections if not already loaded
            let allSections = factorySections;
            if (factorySections.length === 0) {
                allSections = await fetchAllFactorySections();
                setFactorySections(allSections);
            }

            const { data, count } = await fetchMachines(factorySectionId ?? -1, page, machinesPerPage, sortOrder);
            console.log("Fetched Machines:", data);
            const enrichedMachines: Machine[] = data.map(machine => {
                const section = factorySections.find(s => s.id === machine.factory_section_id);
                console.log("Section:", section);
                const factoryName = section ? factories.find(f => f.id === section.factory_id)?.name || "Unknown Factory" : "Unknown Factory";
                return {
                    ...machine,
                    factory_section_id: machine.factory_section_id,
                    factory: factoryName,
                    factory_section_name: section?.name || "Unknown Section",
                };
            });

            // Set the state with the enriched machine data
            setMachines(enrichedMachines);
            setTotalCount(count ?? 0);
            setTotalPages(Math.max(1, Math.ceil((count ?? 0) / machinesPerPage)));
        } catch (error) {
            console.error("Error fetching machines:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSortByStatus = () => {
        const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        setSortOrder(newSortOrder);
        setCurrentPage(1); // Reset to the first page whenever sorting changes
        fetchMachinesForPage(1, newSortOrder);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchMachinesForPage(page, sortOrder);
    };

    if (loading) {
        return (
            <div className="flex justify-center p-5">
                <Loader2 className="animate-spin" />
                <span>Loading...</span>
            </div>
        );
    }

    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle>All Machines Status</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>A list of all machines and their running statuses.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Factory</TableHead>
                            <TableHead>Factory Section</TableHead>
                            <TableHead>Machine Name</TableHead>
                            <TableHead onClick={handleSortByStatus} className="cursor-pointer">
                                Status {sortOrder ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {machines.map((machine) => (
                            <TableRow
                                key={machine.id}
                                className="cursor-pointer hover:bg-gray-100"
                                onClick={() =>
                                    handleRowSelection(
                                        factories.find((f) => f.name === machine.factory)?.id ?? -1,
                                        machine.factory_section_id,
                                        machine.id
                                    )
                                }
                            >
                                <TableCell>{machine.factory}</TableCell>
                                <TableCell>{machine.factory_section_name}</TableCell>
                                <TableCell>{machine.name}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className={machine.is_running ? 'bg-green-100' : 'bg-red-100'}>
                                        {machine.is_running ? "Running" : "Not Running"}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {/* Pagination Controls */}
                <div className="flex justify-between items-center w-full text-xs text-muted-foreground mt-4">
                    <span>
                        Showing <strong>{(currentPage - 1) * machinesPerPage + 1}</strong> to <strong>{Math.min(currentPage * machinesPerPage, totalCount)}</strong> of <strong>{totalCount}</strong> Machines
                    </span>
                    <div className="flex gap-2 overflow-x-auto">
                        {/* Previous Button */}
                        <Button
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>

                        {/* First Page */}
                        <Button
                            size="sm"
                            variant={currentPage === 1 ? 'default' : 'outline'}
                            onClick={() => handlePageChange(1)}
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
                                    onClick={() => handlePageChange(page)}
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
                                onClick={() => handlePageChange(totalPages)}
                            >
                                {totalPages}
                            </Button>
                        )}

                        {/* Next Button */}
                        <Button
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default AllMachinesStatus;
