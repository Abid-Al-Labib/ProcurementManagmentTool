import { useEffect, useState } from "react";
import { Table, TableHead, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import toast from "react-hot-toast";
import { fetchFactories, fetchFactorySections, addFactorySection, deleteFactorySection } from "@/services/FactoriesService";
import { Plus, PlusCircle, X, XCircle } from "lucide-react"; 
import { useSearchParams } from "react-router-dom";
import { Factory, FactorySection } from "@/types";
import { AnimatePresence, motion } from "framer-motion";

const FactorySectionManagementCard = () => {
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const factoryIdFromUrl = searchParams.get("factory");

  const [factories, setFactories] = useState<Factory[]>([]);
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(
    factoryIdFromUrl ? Number(factoryIdFromUrl) : null
  );  

  const [factorySection, setFactorySections] = useState<FactorySection[]>([]);
  const [newSectionName, setNewSectionName] = useState("");

  const handleFactoryChange = (value: string) => {
    const newFactoryId = Number(value);
    setSelectedFactoryId(newFactoryId);
      setSearchParams((prevParams) => {
      const updatedParams = new URLSearchParams(prevParams);
      updatedParams.set("factory", newFactoryId.toString());
      return updatedParams;
    });
  };

  useEffect(() => {
    const factoryFromUrl = searchParams.get("factory");
    if (factoryFromUrl) {
      setSelectedFactoryId(Number(factoryFromUrl));
    }
  }, [searchParams]); 
  
  // Load factories on mount
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

  // Load factory sections when a factory is selected
  useEffect(() => {
    if (selectedFactoryId !== null) {
      loadFactorySections(selectedFactoryId);
    } else {
      setFactorySections([]); // Reset sections when no factory is selected
    }
  }, [selectedFactoryId]);

  const loadFactorySections = async (factoryId: number) => {
    try {
      const data = await fetchFactorySections(factoryId);
      setFactorySections(data);
    } catch (error) {
      toast.error("Failed to load factory sections.");
    }
  };

  const handleAddSection = async () => {
    if (!newSectionName.trim() || selectedFactoryId === null) {
      toast.error("Please select a factory and enter a section name.");
      return;
    }

    try {
      await addFactorySection(newSectionName, selectedFactoryId);
      setNewSectionName("");
      loadFactorySections(selectedFactoryId); // Refresh the list
    } catch (error) {
      toast.error("Error adding factory section.");
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this factory section?");
    if (!confirmed) return;

    try {
      const success = await deleteFactorySection(sectionId);
      if (success) {
        loadFactorySections(selectedFactoryId!); // Refresh list after deletion
      }
    } catch (error) {
      toast.error("Failed to delete factory section.");
    }
  };

  return (
    <>  
      <h2 className="text-xl font-semibold text-gray-800">Configure Factory Section</h2>
      {/* Select Factory */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">Select Factory</label>
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
      </div>

      {/* Add New Section */}
      {selectedFactoryId && (
        <>
          <AnimatePresence mode="wait">
            {!isAddingSection ? (
              <motion.div
                key="add-button"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 200 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={() => setIsAddingSection(true)}
                  className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                >
                  <PlusCircle size={18} />
                  Add Factory Section
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="add-input"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -200 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-4"
              >
                {/* Input for New Section Name */}
                <Input
                  placeholder="Factory Section Name"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  className="w-[260px]"
                />

                {/* Confirm Button */}
                <button
                  onClick={() => {
                    handleAddSection();
                    setIsAddingSection(false); // Optional: close on add
                  }}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded-md border border-blue-600 hover:bg-blue-100 transition"
                >
                  <Plus size={18} />
                </button>

                {/* Cancel Button */}
                <button
                  onClick={() => {
                    setIsAddingSection(false);
                    setNewSectionName(""); // Optional: clear the input on cancel
                  }}
                  className="text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 rounded-md border border-red-600 hover:bg-red-100 transition"
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>


          
          {/* List Sections (Scrollable) */}
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
                  {factorySection.map((section) => (
                    <TableRow key={section.id}>
                      <TableCell>{section.id}</TableCell>
                      <TableCell>{section.name}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleDeleteSection(section.id)}
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
        </>
      )}
    </>
  );
};

export default FactorySectionManagementCard;
