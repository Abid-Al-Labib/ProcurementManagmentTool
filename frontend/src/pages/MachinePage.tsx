// MachinePartsPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchFactories, fetchFactorySections} from "@/services/FactoriesService";
import { fetchMachineParts } from "@/services/MachinePartsService";
import { fetchMachines, fetchMachineById } from "@/services/MachineServices";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import MachinePartsTable from "@/components/customui/MachinePartsTable";
import NavigationBar from "@/components/customui/NavigationBar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Machine } from "@/types";
import MachineStatus from "@/components/customui/MachineStatus"; // Import the MachineStatus component



type MachinePart = {
  id: number;
  machine_id: number;
  machine_number: number;
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
  const [machines, setMachines] = useState<{ id: number; number: number }[]>([]);
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | undefined>(undefined);
  const [selectedFactorySectionId, setSelectedFactorySectionId] = useState<number | undefined>(undefined);
  const [selectedMachineId, setSelectedMachineId] = useState<number | undefined>(undefined);
  const [selectedMachine, setSelectedMachine] = useState<Machine>(); // Use the existing Machine type

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
      // Check if selectedFactorySectionId is not undefined and not -1
      if (selectedFactorySectionId !== undefined && selectedFactorySectionId !== -1) {
        try {
          const fetchedMachines = await fetchMachines(selectedFactorySectionId);
          setMachines(fetchedMachines);
          setSelectedMachineId(-1); // Reset machine ID when the section changes
          setTimeout(() => setSelectedMachineId(-1), 0); // Clear and reset
        } catch (error) {
          toast.error("Failed to load machines");
        }
      } else {
        setMachines([]);
        setSelectedMachineId(-1); // Reset if no section is selected
      }
    };

    loadMachines();
  }, [selectedFactorySectionId]);
  

  useEffect(() => {
    // Load machine parts when a machine is selected
    const loadParts = async () => {
      if (selectedMachineId === undefined) {
        setMachineParts([]);
        setLoading(false); // Ensure loading is set to false if no machine is selected
        return;
      }

      setLoading(true);
      try {
        const fetchedParts = await fetchMachineParts(
          selectedMachineId,
          filters.partIdQuery || undefined,
          filters.partNameQuery || undefined
        );

        console.log(fetchedParts);

        const processedParts = fetchedParts.map((record: any) => ({
          id: record.id,
          machine_id: record.machine_id,
          machine_number: record.machines.number ?? -1,
          part_id: record.parts.id,
          part_name: record.parts.name,
          qty: record.qty,
          req_qty: record.req_qty ?? 0,
          
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
                    onValueChange={async (value) => {
                      setSelectedMachineId(value === "" ? undefined : Number(value));
                      setMachineParts([]);

                      if (selectedMachineId !== undefined) {
                        try {
                          const machine = await fetchMachineById(selectedMachineId); // Fetch machine details by ID
                          if (machine) {
                            setSelectedMachine(machine); // Set the selected machine state if not null
                          } else {
                            setSelectedMachine(undefined); // Set to undefined if the machine is null
                          }
                        } catch (error) {
                          console.error("Error fetching machine:", error);
                          setSelectedMachine(undefined); // Reset in case of error
                        }
                      } else {
                        setSelectedMachine(undefined); // Reset if no machine is selected
                      }
                    }}
                  >
                    <SelectTrigger className="w-[220px] mt-2">
                      <SelectValue>
                        {selectedMachineId === undefined
                          ? "Select a Machine"
                          : machines.find((m) => m.id === selectedMachineId)?.number}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {machines.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id.toString()}>
                          {machine.number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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