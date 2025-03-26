// AllMachinesStatus.tsx
import { useEffect, useState } from "react";
import { fetchFactories, fetchAllFactorySections } from "@/services/FactoriesService";
import { fetchAllMachines, fetchAllMachinesEnriched, fetchEnrichedMachines } from "@/services/MachineServices";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "../ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

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
}

interface AllMachinesStatusProps {
    factoryId?: number;
    factorySectionId?: number;
    handleRowSelection?: (factoryId: number, factorySectionId: number, machineId: number) => void;
}

const AllMachinesStatus = ({ factoryId, factorySectionId, handleRowSelection }: AllMachinesStatusProps) => {
    const [factories, setFactories] = useState<Factory[]>([]);
    const [factorySections, setFactorySections] = useState<FactorySection[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const fetchedFactories = await fetchFactories();
                const fetchedSections = await fetchAllFactorySections();
                const { data: enrichedMachines } = await fetchAllMachinesEnriched();

                setFactories(fetchedFactories);
                setFactorySections(fetchedSections);
                setMachines(enrichedMachines);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin mr-2" />
                <span>Loading...</span>
            </div>
        );
    }

    // If no factory is selected, show a message
    if (factoryId === undefined) {
        return (
            <Card className="mt-5">
                <CardHeader>
                    <CardTitle>Machine Status Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center items-center h-32 text-muted-foreground">
                        Please select a factory to view machine status
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Filter machines based on factoryId and factorySectionId
    const filteredMachines = machines.filter(machine => {
        if (factoryId !== undefined) {
            const section = factorySections.find(s => s.id === machine.factory_section_id);
            if (!section || section.factory_id !== factoryId) return false;
        }
        if (factorySectionId !== undefined && machine.factory_section_id !== factorySectionId) {
            return false;
        }
        return true;
    });

    // Group machines by factory and section
    const groupedMachines = filteredMachines.reduce((acc, machine) => {
        const section = factorySections.find(s => s.id === machine.factory_section_id);
        const factory = factories.find(f => f.id === section?.factory_id);
        
        if (!factory || !section) return acc;
        
        const key = `${factory.id}-${section.id}`;
        if (!acc[key]) {
            acc[key] = {
                factory: factory.name,
                section: section.name,
                machines: []
            };
        }
        acc[key].machines.push(machine);
        return acc;
    }, {} as Record<string, { factory: string; section: string; machines: Machine[] }>);

    // Sort machines in each group
    Object.values(groupedMachines).forEach(group => {
        group.machines.sort((a, b) => 
            a.name.localeCompare(b.name, undefined, {
                numeric: true,
                sensitivity: 'base'
            })
        );
    });

    return (
        <Card className="mt-5">
            <CardHeader>
                <CardTitle>Machine Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Factory</TableHead>
                            <TableHead>Section</TableHead>
                            <TableHead>Machines</TableHead>
                            <TableHead>Running Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(groupedMachines).map(([key, group]) => {
                            const [factoryId, sectionId] = key.split('-').map(Number);
                            const runningCount = group.machines.filter(m => m.is_running).length;
                            const totalCount = group.machines.length;

                            return (
                                <TableRow 
                                    key={key}
                                    className="cursor-default"
                                >
                                    <TableCell>{group.factory}</TableCell>
                                    <TableCell>{group.section}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-2">
                                            {group.machines.map((machine, index) => (
                                                <Badge
                                                    key={machine.id}
                                                    variant="secondary"
                                                    className={`text-sm cursor-pointer ${
                                                        machine.is_running
                                                            ? "bg-green-100 text-green-600"
                                                            : "bg-red-100 text-red-600"
                                                    }`}
                                                    onClick={() => handleRowSelection?.(factoryId, sectionId, machine.id)}
                                                >
                                                    {machine.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={`${
                                                runningCount === totalCount
                                                    ? "bg-green-100 text-green-600"
                                                    : runningCount === 0
                                                    ? "bg-red-100 text-red-600"
                                                    : "bg-orange-100 text-orange-600"
                                            }`}
                                        >
                                            {runningCount}/{totalCount} Running
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default AllMachinesStatus;