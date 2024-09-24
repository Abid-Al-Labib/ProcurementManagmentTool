// MachinePage.tsx
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchFactories, fetchFactorySections } from "@/services/FactoriesService";
import { fetchMachineParts } from "@/services/MachinePartsService";
import { fetchMachines, fetchMachineById, setMachineIsRunningById } from "@/services/MachineServices";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import MachinePartsTable from "@/components/customui/MachinePartsTable";
import NavigationBar from "@/components/customui/NavigationBar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Machine, Order } from "@/types";
import MachineStatus from "@/components/customui/MachineStatus";
import { fetchRunningOrdersByMachineId } from "@/services/OrdersService";

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
      const fetchedParts = await fetchMachineParts(selectedMachineId, filters.partIdQuery, filters.partNameQuery);
      const processedParts = fetchedParts.map((record: any) => ({
        id: record.id,
        machine_id: record.machine_id,
        machine_name: record.machines.name ?? "Unknown", // Correctly mapped machine_name
        part_id: record.parts.id,                       // Ensure part_id is included
        part_name: record.parts.name,                   // Correctly mapped part_name
        qty: record.qty,                                // Current quantity
        req_qty: record.req_qty ?? -1,                   // Required quantity, defaulting to 0 if missing
      }));

      setMachineParts(processedParts); // Correctly set state with processed data

      const orders = await fetchRunningOrdersByMachineId(selectedMachineId);
      setRunningOrders(orders);

      // Fetch the machine and handle null by converting to undefined
      const machine = await fetchMachineById(selectedMachineId);
      setSelectedMachine(machine ?? undefined); // Convert null to undefined
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
          const fetchedMachines = await fetchMachines(selectedFactorySectionId);
          setMachines(fetchedMachines);
          setSelectedMachineId(-1);
        } catch (error) {
          toast.error("Failed to load machines");
        }
      } else {
        setMachines([]);
        setSelectedMachineId(-1);
      }
    };
    loadMachines();
  }, [selectedFactorySectionId]);

  useEffect(() => {
    const loadParts = async () => {
      if (selectedMachineId === undefined) {
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
  const handleSelectMachine = async (value: string) => {
    const machineId = value === "" ? undefined : Number(value);
    setSelectedMachineId(machineId);
    setMachineParts([]);
    setRunningOrders([]); // Reset running orders when selecting a new machine

    console.log("inHandleMachine");

    if (machineId) {
      refreshComponents(); // Call refreshComponents after setting the machine ID
      try {
        const runningOrdersData = await fetchRunningOrdersByMachineId(machineId);
        setRunningOrders(runningOrdersData); // Set running orders


        if (runningOrdersData.length === 0) {
          console.log("in running orders check");
          await setMachineIsRunningById(machineId, true);
        }

        const machine = await fetchMachineById(machineId);
        if (machine) {
          setSelectedMachine(machine);
        }
      } catch (error) {
        console.error("Error fetching machine or running orders:", error);
        setSelectedMachine(undefined);
      }
    } else {
      setSelectedMachine(undefined);
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
      <div className="flex w-full flex-col bg-muted/40 mt-2">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0">
          <div className="flex justify-between items-start mb-4">
            <div className="w-1/2">
              {/* Factory Selection Dropdown */}
              <div className="mb-4">
                <Label className="mb-2">Select Factory</Label>
                <Select
                  value={selectedFactoryId === undefined ? "" : selectedFactoryId.toString()}
                  onValueChange={(value) => {
                    setSelectedFactoryId(value === "" ? undefined : Number(value));
                    setSelectedFactorySectionId(undefined);
                    setSelectedMachineId(undefined);
                    setMachineParts([]);
                  }}
                >
                  <SelectTrigger className="w-[220px] mt-2">
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
              {selectedFactoryId !== undefined && (
                <div className="mb-4">
                  <Label className="mb-2">Select Factory Section</Label>
                  <Select
                    value={selectedFactorySectionId === undefined ? "" : selectedFactorySectionId.toString()}
                    onValueChange={(value) => {
                      setSelectedFactorySectionId(value === "" ? undefined : Number(value));
                      setSelectedMachineId(undefined);
                      setMachineParts([]);
                    }}
                  >
                    <SelectTrigger className="w-[220px] mt-2">
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
              )}

              {/* Machine Selection Dropdown */}
              {selectedFactorySectionId !== undefined && (
                <div className="mb-4">
                  <Label className="mb-2">Select Machine</Label>
                  <Select
                    value={selectedMachineId === undefined ? "" : selectedMachineId.toString()}
                    onValueChange={handleSelectMachine} // Use the new function
                  >
                    <SelectTrigger className="w-[220px] mt-2">
                      <SelectValue>
                        {selectedMachineId === undefined
                          ? "Select a Machine"
                          : machines.find((m) => m.id === selectedMachineId)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {machines.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id.toString()}>
                          {machine.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Display Running Orders Table */}
            <div className="w-1/2 ml-4">
              {runningOrders.length > 0 && (
                <div className="bg-white p-4 rounded shadow">
                  <h3 className="font-bold text-lg mb-2">Running Orders</h3>
                  {/* Scrollable container with a max-height and overflow properties */}
                  <div className="max-h-64 overflow-y-auto"> {/* Set max-height and make it scrollable */}
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order ID
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created At
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order Note
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {runningOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
                              <Link to={`/vieworder/${order.id}`}>{order.id}</Link> {/* Link to view order page */}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.order_note}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.statuses.name}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Machine Status Display */}
            <MachineStatus machineId={selectedMachineId} />
          </div>

          {MachineParts.length === 0 ? (
            <div>No parts found</div>
          ) : (
            <MachinePartsTable
              MachineParts={MachineParts}
              onApplyFilters={setFilters}
              onResetFilters={() => setFilters({})}
              onRefresh={refreshComponents} // Pass refresh function to the table

            />
          )}
        </main>
        <div className="flex justify-end">
          <div className="my-3 mx-3"></div>
        </div>
      </div>
    </>
  );
};

export default MachinePartsPage;
