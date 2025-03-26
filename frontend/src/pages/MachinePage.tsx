// MachinePage.tsx
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchFactories, fetchFactorySections } from "@/services/FactoriesService";
import { fetchMachineParts } from "@/services/MachinePartsService";
import { fetchMachineById, setMachineIsRunningById, fetchAllMachines } from "@/services/MachineServices";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import MachinePartsTable from "@/components/customui/MachinePartsTable";
import NavigationBar from "@/components/customui/NavigationBar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Machine, Order } from "@/types";
import MachineStatus from "@/components/customui/MachineStatus";
import { fetchRunningOrdersByMachineId } from "@/services/OrdersService";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AllMachinesStatus from "@/components/customui/AllMachineStatus";

type MachinePart = {
  id: number;
  machine_id: number;
  machine_name: string;
  part_id: number;
  part_name: string;
  qty: number;
  req_qty: number;
};

const MachinePartsPage = () => {
  const [MachineParts, setMachineParts] = useState<MachinePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<any>({});
  const [factories, setFactories] = useState<{ id: number; name: string }[]>([]);
  const [factorySections, setFactorySections] = useState<{ id: number; name: string }[]>([]);
  const [machines, setMachines] = useState<{ id: number; name: string }[]>([]);
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | undefined>(undefined);
  const [selectedFactorySectionId, setSelectedFactorySectionId] = useState<number | undefined>(undefined);
  const [selectedMachineId, setSelectedMachineId] = useState<number | undefined>(undefined);
  const [selectedMachine, setSelectedMachine] = useState<Machine>();
  const [runningOrders, setRunningOrders] = useState<Order[]>([]); // State for running orders

  
  const refreshComponents = useCallback(async () => {
    if (!selectedMachineId) return;

    try {
      setLoading(true);

      // Reset the machine parts, running orders, and selected machine to blank or initial states
      setMachineParts([]); // Clear machine parts
      setRunningOrders([]); // Clear running orders
      setSelectedMachine(undefined); // Reset the selected machine

      // Fetch the machine details and handle null by converting to undefined
      const machine = await fetchMachineById(selectedMachineId);
      setSelectedMachine(machine ?? undefined); // Set the machine details
      if(selectedMachine){
        const fetchedParts = await fetchMachineParts(
          selectedMachineId,
          filters.partIdQuery || undefined,
          filters.partNameQuery || undefined
        );

        const processedParts = fetchedParts.map((record: any) => ({
          id: record.id,
          machine_id: record.machine_id,
          machine_name: record.machines.name ?? "Unknown",
          part_id: record.parts.id,
          part_name: record.parts.name,
          qty: record.qty,
          req_qty: record.req_qty ?? -1,
        }));

        setMachineParts(processedParts);

      }

    } catch (error) {
      toast.error("Failed to refresh components");
    } finally {
      setLoading(false);
    }
  }, [selectedMachineId, filters]);

  useEffect(() => {
    // Fetch factories when the component mounts
    const loadFactories = async () => {
      try {
        const fetchedFactories = await fetchFactories();
        setFactories(fetchedFactories);
      } catch (error) {
        toast.error("Failed to load factories");
      }
    };
    loadFactories();
  }, []);

  useEffect(() => {
    // Fetch factory sections when a factory is selected
    const loadFactorySections = async () => {
      if (selectedFactoryId === undefined) {
        setFactorySections([]);
        return;
      }
      try {
        const fetchedSections = await fetchFactorySections(selectedFactoryId);
        setFactorySections(fetchedSections);
      } catch (error) {
        toast.error("Failed to load factory sections");
      }
    };
    loadFactorySections();
  }, [selectedFactoryId]);

  useEffect(() => {
    const loadMachines = async () => {
      if (selectedFactorySectionId !== undefined && selectedFactorySectionId !== -1) {
        try {
          const fetchedMachines = (await fetchAllMachines(selectedFactorySectionId));
          setMachines(fetchedMachines);
          setSelectedMachineId(undefined);
        } catch (error) {
          toast.error("Failed to load machines");
        }
      } else {
        setMachines([]);
        setSelectedMachineId(undefined);
      }
    };
    loadMachines();
  }, [selectedFactorySectionId]);

  useEffect(() => {
    const loadParts = async () => {
      if (selectedMachineId == undefined) {
        setMachineParts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const fetchedParts = await fetchMachineParts(
          selectedMachineId,
          filters.partIdQuery || undefined,
          filters.partNameQuery || undefined
        );

        const processedParts = fetchedParts.map((record: any) => ({
          id: record.id,
          machine_id: record.machine_id,
          machine_name: record.machines.name ?? "Unknown",
          part_id: record.parts.id,
          part_name: record.parts.name,
          qty: record.qty,
          req_qty: record.req_qty ?? -1,
        }));

        setMachineParts(processedParts);
      } catch (error) {
        toast.error("Failed to fetch parts");
      } finally {
        setLoading(false);
      }
    };
    loadParts();
  }, [selectedMachineId, filters]);

  // New function to handle machine selection

  const handleRowSelection = (factoryId: number, factorySectionId: number, machineId: number) => {
    setSelectedFactoryId(factoryId);
    setSelectedFactorySectionId(factorySectionId);
    handleSelectMachine(machineId.toString());
    setMachineParts([]);
    setRunningOrders([]);

  };

  const handleSelectMachine = async (value: string) => {
    const machineId = value == "" ? undefined : Number(value);

    
    setSelectedMachineId(undefined);
    setMachineParts([]);
    setRunningOrders([]); // Reset running orders when selecting a new machine



    if (machineId) {
      refreshComponents(); // Call refreshComponents after setting the machine ID
      try {
        const runningOrdersData = await fetchRunningOrdersByMachineId(machineId);

        setRunningOrders(runningOrdersData); // Set running orders


        if (runningOrdersData.length === 0) {
          await setMachineIsRunningById(machineId, true);
        }

        const machine = await fetchMachineById(machineId);
        if (machine) {
          setSelectedMachine(machine);
          setSelectedMachineId(machineId);
        }
      } catch (error) {
        console.error("Error fetching machine or running orders:", error);
        setSelectedMachine(undefined);
        setSelectedMachineId(undefined);

      }
    } else {
      setSelectedMachine(undefined);
      setSelectedMachineId(undefined);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-row justify-center p-5">
        <Loader2 className="animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <>
      <NavigationBar />
      <div className="flex w-full flex-col bg-muted/40">
        <main className="mt-2 p-4 sm:px-6 sm:py-0">
          {/* Container for selections, running orders, and machine status */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch gap-4 h-full">

            {/* Selections Section */}
            <div className="flex-none min-w-72 max-w-96 w-1/6"> {/* Roughly 1/6th of the width */}
              <Card className="mb-4 h-full">
                <CardHeader>
                  <CardTitle>Machine Details</CardTitle>
                </CardHeader>

                <CardContent>
                  {/* Factory Selection Dropdown */}
                  <div className="mb-4">
                    <Label className="mb-2">Select Factory</Label>
                    <Select
                      value={selectedFactoryId === undefined ? "" : selectedFactoryId.toString()}
                      onValueChange={async (value) => {
                        setSelectedFactoryId(value === "" ? undefined : Number(value));
                        setSelectedFactorySectionId(undefined);
                        setSelectedMachineId(undefined);
                        setMachineParts([]);
                        setRunningOrders([]);
                        setSelectedMachine(undefined);
                      }}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue>
                          {selectedFactoryId === undefined
                            ? "Select a Factory"
                            : factories.find((f) => f.id === selectedFactoryId)?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {factories.map((factory) => (
                          <SelectItem key={factory.id} value={factory.id.toString()}>
                            {factory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Factory Section Selection Dropdown */}
                 
                    <div className="mb-4">
                      <Label className="mb-2">Select Factory Section</Label>
                      <Select
                        value={selectedFactorySectionId === undefined ? "" : selectedFactorySectionId.toString()}
                        onValueChange={(value) => {
                          setSelectedFactorySectionId(value === "" ? undefined : Number(value));
                          setSelectedMachineId(undefined);
                          setMachineParts([]);
                          setRunningOrders([]);
                          setSelectedMachine(undefined);
                        }}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue>
                            {selectedFactorySectionId === undefined
                              ? "Select a Section"
                              : factorySections.find((s) => s.id === selectedFactorySectionId)?.name}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {factorySections.map((section) => (
                            <SelectItem key={section.id} value={section.id.toString()}>
                              {section.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  

                  {/* Machine Selection Dropdown */}
                  
                    <div className="mb-4">
                      <Label className="mb-2">Select Machine</Label>
                      <Select
                        value={selectedMachineId === undefined ? "" : selectedMachineId.toString()}
                        onValueChange={handleSelectMachine}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue>
                            {selectedMachineId === undefined
                              ? "Select a Machine"
                              : machines.find((m) => m.id === selectedMachineId)?.name}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {machines
                            .sort((a, b) => a.id - b.id) // Sorting machines by ID in ascending order
                            .map((machine) => (
                              <SelectItem key={machine.id} value={machine.id.toString()}>
                                {machine.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                
                  {/* Reset Button */}
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => {
                      // Reset all fields to their initial state
                      setSelectedFactoryId(undefined);
                      setSelectedFactorySectionId(undefined);
                      setSelectedMachineId(undefined);
                      setMachineParts([]);
                      setRunningOrders([]);
                      setSelectedMachine(undefined);
                    }}
                  >
                    Reset And Show All Statuses
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Running Orders Section */}
            <div className="flex-1"> {/* Roughly 4/6th of the width */}
                <Card className="mb-4 h-full">
                    <CardHeader>
                        <CardTitle>Running Orders</CardTitle>
                        <CardDescription>A list of current running orders.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {selectedMachineId === undefined || runningOrders.length === 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Order ID</TableHead>
                                        <TableHead className="w-[100px]">Req #</TableHead>
                                        <TableHead className="w-[120px]">Created At</TableHead>
                                        <TableHead>Order Note</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-[250px] text-muted-foreground">
                                            {selectedMachineId === undefined ? "Select a machine to view orders" : "No running orders for this machine"}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="h-[293px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Order ID</TableHead>
                                            <TableHead className="w-[100px]">Req #</TableHead>
                                            <TableHead className="w-[120px]">Created At</TableHead>
                                            <TableHead>Order Note</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {runningOrders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-blue-100">
                                                        <Link to={`/vieworder/${order.id}`}>{order.id}</Link>
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{order.req_num}</TableCell>
                                                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={order.order_note}>
                                                    {order.order_note}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            order.statuses.name === "Parts Received"
                                                                ? "bg-green-100"
                                                                : order.statuses.name === "Pending"
                                                                    ? "bg-red-100"
                                                                    : "bg-orange-100"
                                                        }
                                                        variant="secondary"
                                                    >
                                                        {order.statuses.name}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
          </div>

          {
            selectedFactoryId === undefined ? (
              <div className="mt-3">
                <Card className="min-h-[350px]">
                  <CardHeader>
                    <CardTitle>Machine Status Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center items-center h-32 text-muted-foreground">
                      Please select a factory to view machine status
                    </div>
                  </CardContent>
                </Card>
              </div>
            ): selectedFactorySectionId === undefined ? (
                <AllMachinesStatus
                  factoryId={selectedFactoryId}
                  handleRowSelection={handleRowSelection}
                />
            ): selectedMachineId === undefined ? (
                <AllMachinesStatus
                  factoryId={selectedFactoryId}
                  factorySectionId={selectedFactorySectionId}
                  handleRowSelection={handleRowSelection}
                />         
            ) : (
            <MachinePartsTable
              MachineParts={MachineParts}
              onApplyFilters={setFilters}
              onResetFilters={() => setFilters({})}
              onRefresh={refreshComponents}
              selectedMachine={selectedMachine}
            />
          )}
        </main>
      </div>
    </>
  );
};

export default MachinePartsPage;
