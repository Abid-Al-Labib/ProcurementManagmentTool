import { useEffect, useState } from "react";
import { Table, TableHead, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import toast from "react-hot-toast";
import { fetchFactories, fetchFactorySections } from "@/services/FactoriesService";
import { fetchAllMachines, addMachine, deleteMachine } from "@/services/MachineServices";
import { Check, PlusCircle, XCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Factory, FactorySection } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import ReactSelect from "react-select";

const MachineManagementCard = () => {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [factorySections, setFactorySections] = useState<FactorySection[]>([]);
  const [machines, setMachines] = useState<{ id: number; name: string }[]>([]);
  const [newMachineName, setNewMachineName] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAddingMachine, setIsAddingMachine] = useState(false);

  const factoryFromUrl = searchParams.get("factory");
  const sectionFromUrl = searchParams.get("factorySection");

  const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(
    factoryFromUrl ? Number(factoryFromUrl) : null
  );
  const [selectedFactorySectionId, setSelectedFactorySectionId] = useState<number | null>(
    sectionFromUrl ? Number(sectionFromUrl) : null
  );

  useEffect(() => {
    const factoryFromUrl = searchParams.get("factory");
    const sectionFromUrl = searchParams.get("factorySection");
  
    setSelectedFactoryId(factoryFromUrl ? Number(factoryFromUrl) : null);
  
    if (factoryFromUrl) {
      fetchFactorySections(Number(factoryFromUrl)).then((sections) => {
        setFactorySections(sections);
  
        if (sectionFromUrl && sections.some(s => s.id === Number(sectionFromUrl))) {
          setSelectedFactorySectionId(Number(sectionFromUrl));
        } else {
          setSelectedFactorySectionId(null);
        }
      });
    } else {
      setFactorySections([]);
      setSelectedFactorySectionId(null);
    }
  }, [searchParams]);

  const handleFactoryChange = (value: string) => {
    const newFactoryId = Number(value);
    setSelectedFactoryId(newFactoryId);
    setSearchParams((prevParams) => {
      const updatedParams = new URLSearchParams(prevParams);
      updatedParams.set("factory", newFactoryId.toString());
      updatedParams.delete("factorySection");
      return updatedParams;
    });
  };

  const handleFactorySectionChange = (value: string) => {
    const newFactorySectionId = Number(value);
    setSelectedFactorySectionId(newFactorySectionId);
    setSearchParams((prevParams) => {
      const updatedParams = new URLSearchParams(prevParams);
      updatedParams.set("factorySection", newFactorySectionId.toString());
      return updatedParams;
    });
  };

  useEffect(() => {
    const loadFactories = async () => {
      try {
        const data = await fetchFactories();
        setFactories(data);
      } catch (error) {
        toast.error("Failed to load factories.");
      }
    };
    loadFactories();
  }, []);

  useEffect(() => {
    if (selectedFactoryId !== null) {
      const loadSections = async () => {
        try {
          const sections = await fetchFactorySections(selectedFactoryId);
          setFactorySections(sections);
  
          const sectionFromUrl = searchParams.get("factorySection");
          if (sectionFromUrl && sections.some(s => s.id === Number(sectionFromUrl))) {
            setSelectedFactorySectionId(Number(sectionFromUrl));
          } else {
            setSelectedFactorySectionId(null);
          }
        } catch (error) {
          toast.error("Failed to load factory sections.");
        }
      };
      loadSections();
    } else {
      setFactorySections([]);
      setSelectedFactorySectionId(null);
    }
  }, [selectedFactoryId]);

  useEffect(() => {
    if (selectedFactorySectionId !== null) {
      loadMachines(selectedFactorySectionId);
    } else {
      setMachines([]);
    }
  }, [selectedFactorySectionId]);

  const loadMachines = async (factorySectionId: number) => {
    try {
      const response = await fetchAllMachines(factorySectionId);
      setMachines(response);
    } catch (error) {
      toast.error("Failed to load machines.");
    }
  };

  const handleAddMachine = async () => {
    if (!newMachineName.trim() || selectedFactorySectionId === null) {
      toast.error("Please select a factory section and enter a machine name.");
      return;
    }

    try {
      await addMachine(newMachineName, selectedFactorySectionId);
      toast.success("Machine added successfully!");
      setNewMachineName("");
      loadMachines(selectedFactorySectionId);
    } catch (error) {
      toast.error("Error adding machine.");
    }
  };

  const handleDeleteMachine = async (machineId: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this machine?");
    if (!confirmed) return;

    try {
      const success = await deleteMachine(machineId);
      if (success) {
        loadMachines(selectedFactorySectionId!);
      }
    } catch (error) {
      toast.error("Failed to delete machine.");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Configure Machine</h2>
        <div className="relative group">
          <Button
            onClick={() => {
              if (isAddingMachine) {
                setIsAddingMachine(false);
                setNewMachineName("");
              } else {
                setIsAddingMachine(true);
              }
            }}
            disabled={!selectedFactorySectionId}
            className={`flex items-center gap-2 ${
              isAddingMachine 
                ? "bg-red-600 text-white hover:bg-red-700" 
                : selectedFactorySectionId
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-400 text-white cursor-not-allowed"
            }`}
          >
            {isAddingMachine ? (
              <>
                <XCircle size={18} />
                Cancel
              </>
            ) : (
              <>
                <PlusCircle size={18} />
                Add Machine
              </>
            )}
          </Button>
          {!selectedFactorySectionId && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Please select a factory section first
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        {/* Factory Selection */}
        <Select 
          value={selectedFactoryId?.toString() || ""} 
          onValueChange={handleFactoryChange}
        >
          <SelectTrigger className="w-40">
            <SelectValue>
              {selectedFactoryId
                ? factories.find((f) => f.id === selectedFactoryId)?.abbreviation
                : "Select Factory"}
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

        {/* Factory Section Selection */}
        <Select 
          value={selectedFactorySectionId?.toString() || ""} 
          onValueChange={handleFactorySectionChange} 
          disabled={!selectedFactoryId}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select Section" />
          </SelectTrigger>
          <SelectContent>
            {factorySections.map((section) => (
              <SelectItem key={section.id} value={section.id.toString()}>
                {section.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Add Machine Form */}
        <AnimatePresence mode="wait">
          {isAddingMachine && (
            <motion.div
              key="add-input"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -200 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-4"
            >
              <Input
                placeholder="Machine Name"
                value={newMachineName}
                onChange={(e) => setNewMachineName(e.target.value)}
                className="w-[160px]"
              />

              <Button
                onClick={handleAddMachine}
                className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 h-10"
              >
                <PlusCircle size={18} />
                Create
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Machine List */}
      {selectedFactorySectionId && (
        <div className="border rounded-md shadow-sm max-h-80 overflow-y-auto relative">
          <Table>
            <TableHeader className="top-0 bg-white shadow-sm z-10">
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {machines.map((machine) => (
                <TableRow key={machine.id}>
                  <TableCell>{machine.id}</TableCell>
                  <TableCell>{machine.name}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleDeleteMachine(machine.id)}
                      className="text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <XCircle size={18} />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
};

export default MachineManagementCard;
