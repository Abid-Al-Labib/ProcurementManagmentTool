import { useEffect, useState } from "react";
import { Table, TableHead, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import toast from "react-hot-toast";
import { fetchFactories, fetchFactorySections } from "@/services/FactoriesService";
import { fetchAllMachines } from "@/services/MachineServices";
import { fetchMachineParts, upsertMachineParts, updateMachinePartQuantities, deleteMachinePart } from "@/services/MachinePartsService";
import { Check, PencilOff, PencilRuler, Plus, PlusCircle, X, XCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Factory, FactorySection, Machine, MachinePart, Part } from "@/types";
import { fetchAllParts } from "@/services/PartsService";
import { AnimatePresence, motion } from "framer-motion";
import ReactSelect from "react-select";

const MachinePartsManagementCard = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [factories, setFactories] = useState<Factory[]>([]);
  const [factorySections, setFactorySections] = useState<FactorySection[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineParts, setMachineParts] = useState<MachinePart[]>([]); // Machine parts list

  const factoryFromUrl = searchParams.get("factory");
  const sectionFromUrl = searchParams.get("factorySection");
  const machineFromUrl = searchParams.get("machine");

  const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(
    factoryFromUrl ? Number(factoryFromUrl) : null
  );
  const [selectedFactorySectionId, setSelectedFactorySectionId] = useState<number | null>(
    sectionFromUrl ? Number(sectionFromUrl) : null
  );
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(
    machineFromUrl ? Number(machineFromUrl) : null
  );

  const [editingPartId, setEditingPartId] = useState<number | null>(null);
    const [editedQty, setEditedQty] = useState<number>(0);
    const [editedReqQty, setEditedReqQty] = useState<number>(0);

    const [parts, setParts] = useState<Part[]>([]);
    const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
    const [partQty, setPartQty] = useState<number>(1);
    const [isAddingPart, setIsAddingPart] = useState(false);

  // Sync state with URL params
  useEffect(() => {
    const factoryFromUrl = searchParams.get("factory");
    const sectionFromUrl = searchParams.get("factorySection");
    const machineFromUrl = searchParams.get("machine");

    setSelectedFactoryId(factoryFromUrl ? Number(factoryFromUrl) : null);
    setSelectedFactorySectionId(sectionFromUrl ? Number(sectionFromUrl) : null);
    setSelectedMachineId(machineFromUrl ? Number(machineFromUrl) : null);
  }, [searchParams]);

  //Load Parts
  useEffect(() => {
    const loadParts = async () => {
      try {
        const data = await fetchAllParts();
        setParts(data);
      } catch (error) {
        toast.error("Failed to load parts.");
      }
    };
    loadParts();
  }, []);
  
  // Load Factories
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

  // Load Factory Sections when Factory is selected
  useEffect(() => {
    if (selectedFactoryId !== null) {
      const loadSections = async () => {
        try {
          const data = await fetchFactorySections(selectedFactoryId);
          setFactorySections(data);
        } catch (error) {
          toast.error("Failed to load factory sections.");
        }
      };
      loadSections();

      setMachineParts([]);
    } else {
      setFactorySections([]);
    }
  }, [selectedFactoryId]);
  

  // Load Machines when Factory Section is selected
  useEffect(() => {
    if (selectedFactorySectionId !== null) {
      const loadMachines = async () => {
        try {
          const data = await fetchAllMachines(selectedFactorySectionId);
          setMachines(data);
        } catch (error) {
          toast.error("Failed to load machines.");
        }
      };
      loadMachines();
      setMachineParts([]);
    } else {
      setMachines([]);
    }
  }, [selectedFactorySectionId]);

  // Load Machine Parts when Machine is selected
  useEffect(() => {
    if (selectedMachineId !== null) {
      const loadMachineParts = async () => {
        try {
          const data = await fetchMachineParts(selectedMachineId);
          setMachineParts(data);
        } catch (error) {
          toast.error("Failed to load machine parts.");
        }
      };
      loadMachineParts();
    } else {
      setMachineParts([]);
    }
  }, [selectedMachineId]);

  

  // Handle Factory selection
  const handleFactoryChange = (value: string) => {
    const newFactoryId = Number(value);
    setSelectedFactoryId(newFactoryId);
    setSearchParams((prevParams) => {
      const updatedParams = new URLSearchParams(prevParams);
      updatedParams.set("factory", newFactoryId.toString());
      updatedParams.delete("factorySection");
      updatedParams.delete("machine");
      return updatedParams;
    });
  };

  // Handle Factory Section selection
  const handleFactorySectionChange = (value: string) => {
    const newFactorySectionId = Number(value);
    setSelectedFactorySectionId(newFactorySectionId);
    setSearchParams((prevParams) => {
      const updatedParams = new URLSearchParams(prevParams);
      updatedParams.set("factorySection", newFactorySectionId.toString());
      updatedParams.delete("machine");
      return updatedParams;
    });
  };

  // Handle Machine selection
  const handleMachineChange = (value: string) => {
    const newMachineId = Number(value);
    setSelectedMachineId(newMachineId);
    setSearchParams((prevParams) => {
      const updatedParams = new URLSearchParams(prevParams);
      updatedParams.set("machine", newMachineId.toString());
      return updatedParams;
    });
  };

  const handleAddPart = async () => {
    if (!selectedMachineId || !selectedPartId || partQty < 1) {
      toast.error("Select a part and enter a valid quantity.");
      return;
    }
  
    try {
      await upsertMachineParts(selectedPartId, selectedMachineId, partQty);
      toast.success("Part added successfully!");
  
      // Refresh parts list
      const updatedParts = await fetchMachineParts(selectedMachineId);
      setMachineParts(updatedParts);
  
      // Reset form
      setSelectedPartId(null);
      setPartQty(1);
    } catch (error) {
      toast.error("Error adding part.");
    }
  };

  // Delete Machine Part
  const handleDeleteMachinePart = async (partId: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this machine part?");
    if (!confirmed) return;

    try {
      const success = await deleteMachinePart(partId);
      if (success && selectedMachineId) {
        const updatedParts = await fetchMachineParts(selectedMachineId);
        setMachineParts(updatedParts);
      }
    } catch (error) {
      toast.error("Failed to delete machine part.");
    }
  };

  const startEditing = (part: MachinePart) => {
    setEditingPartId(part.id);
    setEditedQty(part.qty);
    setEditedReqQty(part.req_qty ?? -1); // Default to 0 if null
};


  const handleUpdateMachineParts = async (part: MachinePart) => {
    if (!part || !selectedMachineId) {
      toast.error("Invalid machine or part selection.");
      return;
    }
  
    // Ensure we use the edited values, but fallback to existing part values if empty
    const updatedQty = editedQty !== null ? editedQty : part.qty;
    const updatedReqQty = editedReqQty !== null ? editedReqQty : part.req_qty;
  
    try {
        console.log(part.id, updatedQty, updatedReqQty?updatedReqQty:-1)
      await updateMachinePartQuantities(part.id, updatedQty, updatedReqQty?updatedReqQty:-1);
  
  
      // Reset edit state
      setEditingPartId(null);
      setEditedQty(0);
      setEditedReqQty(0);
  
      // Refresh machine parts list
      const updatedParts = await fetchMachineParts(selectedMachineId);
      setMachineParts(updatedParts);
    } catch (error) {
      toast.error("Error updating machine part.");
    }
  };
  

  return (
    <>  
      {/* Heading */}
      <h2 className="text-xl font-semibold text-gray-800">Configure Machine Parts</h2>
  
      {/* Selection Controls - Horizontal Layout */}
      <div className="flex items-center space-x-4 ">
        {/* Factory Selection - Always a Dropdown */}
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
  
        {/* Factory Section Selection - Always a Dropdown */}
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
  
        {/* Machine Selection - Always a Dropdown */}
        <Select 
          value={selectedMachineId?.toString() || ""} 
          onValueChange={handleMachineChange} 
          disabled={!selectedFactorySectionId}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select Machine" />
          </SelectTrigger>
          <SelectContent>
            {machines
              .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
              .map((machine) => (
                <SelectItem key={machine.id} value={machine.id.toString()}>
                  {machine.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border-b pb-4">
        
    {/* Add Part Button - Shows Inputs When Clicked */}
    <AnimatePresence mode="wait">
    {!isAddingPart ? (
        <motion.div
        key="add-button"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 200 }}
        transition={{ duration: 0.2 }}
        className=""  // Ensures it does not affect layout

        >
        <Button 
            onClick={() => setIsAddingPart(true)}
            className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
            >
            <PlusCircle size={18} />
            Add Part
        </Button>
        </motion.div>
    ) : (
        <div className="flex items-center gap-4">
        {/* Select Part */}
        <ReactSelect
            id="partId"
            options={parts
                .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
                .map((part) => ({
                    value: part.id,
                    label: `${part.name} (${part.unit || "units"})`,
                    isDisabled: machineParts.some((mp) => mp.parts.id === part.id),
                }))
            }
            onChange={(selectedOption) => setSelectedPartId(Number(selectedOption?.value))}
            isSearchable
            placeholder="Search or Select a Part"
            value={selectedPartId ? { value: selectedPartId, label: parts.find((p) => p.id === selectedPartId)?.name } : null}
            className="w-[260px]"
        />

        {/* Input for Quantity */}
        <Input
            type="number"
            value={partQty}
            onChange={(e) => setPartQty(Number(e.target.value))}
            className="w-20 text-center border rounded-md"
            min={1}
        />

        {/* Confirm (✔) Button */}
        <button 
            onClick={handleAddPart}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded-md border border-blue-600 hover:bg-blue-100 transition"
        >
            <Plus size={18} />
        </button>

        {/* Cancel (✖) Button */}
        <button 
            onClick={() => setIsAddingPart(false)}
            className="text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 rounded-md border border-red-600 hover:bg-red-100 transition"
        >
            <X size={18} />
        </button>
        </div>
    )}
    </AnimatePresence>
</div>
  
      {/* Machine Parts Table */}
      {selectedMachineId && (
        <div className=" rounded-md shadow-md max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead>Part ID</TableHead>
                <TableHead>Part Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Req Qty</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {machineParts.map((part) => (
                <TableRow key={part.id}>
                  <TableCell>{part.parts.id}</TableCell>
                  <TableCell>
                    <Link to={`/viewpart/${part.parts.id}`} className="text-blue-600 hover:underline">
                      {part.parts.name}
                    </Link>
                  </TableCell>
                  {/* Editable Quantity Fields */}
                  <TableCell>
                    {editingPartId === part.id ? (
                      <input
                        type="number"
                        value={editedQty ?? part.qty}
                        onChange={(e) => setEditedQty(Number(e.target.value))}
                        className="border rounded-md p-1 w-16 text-center"
                      />
                    ) : (
                      part.qty
                    )}
                  </TableCell>
                  <TableCell>
                    {editingPartId === part.id ? (
                      <input
                        type="number"
                        value={editedReqQty ?? part.req_qty}
                        onChange={(e) => setEditedReqQty(Number(e.target.value))}
                        className="border rounded-md p-1 w-16 text-center"
                      />
                    ) : (
                      part.req_qty
                    )}
                  </TableCell>
  
                  {/* Actions */}
                  <TableCell className="flex gap-2">
                    {editingPartId === part.id ? (
                      <>
                      {/* Cancel Edit Button */}
                        <button
                          onClick={() => setEditingPartId(null)}
                          className="text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 rounded-md border border-red-600 hover:bg-red-100 transition"
                        >
                          <PencilOff size={18} />
                        </button>

                        {/* Confirm Edit Button */}
                        <button
                          onClick={() => handleUpdateMachineParts(part)}
                          className="text-green-600 hover:text-green-800 flex items-center gap-1 px-2 py-1 rounded-md border border-green-600 hover:bg-blue-100 transition"
                        >
                          <Check size={18} />
                        </button>
                        
                      </>
                    ) : (
                      <>
                        {/* Edit Button */}
                        <button
                          onClick={() => startEditing(part)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded-md border border-blue-600 hover:bg-blue-100 transition"
                        >
                          <PencilRuler size={18} />
                        </button>
  
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteMachinePart(part.id)}
                          className="text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 rounded-md border border-red-600 hover:bg-red-100 transition"
                        >
                          <XCircle size={18} />
                        </button>
                      </>
                    )}
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

export default MachinePartsManagementCard;
