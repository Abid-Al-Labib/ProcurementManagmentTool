import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { fetchFactories, addFactory, editFactory } from "@/services/FactoriesService";
import { Factory } from "@/types";
import { Pencil, Trash2, Factory as FactoryIcon, PlusCircle, X, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";


const FactoryManagementCard = () => {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [newFactoryName, setNewFactoryName] = useState("");
  const [newFactoryAbbreviation, setNewFactoryAbbreviation] = useState("");
  const [editMode, setEditMode] = useState<number | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedAbbreviation, setEditedAbbreviation] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const loadFactories = async () => {
      const fetchedFactories = await fetchFactories();
      setFactories(fetchedFactories);
    };
    loadFactories();
  }, []);

  const handleAddFactory = async () => {
    if (!newFactoryName.trim() || !newFactoryAbbreviation.trim()) return;
    try {
      await addFactory(newFactoryName, newFactoryAbbreviation);
      toast.success("Factory added successfully");
      setNewFactoryName("");
      setNewFactoryAbbreviation("");
      setIsAdding(false);
      const updatedFactories = await fetchFactories();
      setFactories(updatedFactories);
    } catch (error) {
      toast.error("Failed to add factory");
    }
  };

  const handleEditFactory = async (factoryId: number) => {
    if (!editedName.trim() || !editedAbbreviation.trim()) return;
    try {
      await editFactory(factoryId, editedName, editedAbbreviation);
      toast.success("Factory updated successfully");
      setFactories(
        factories.map((factory) =>
          factory.id === factoryId ? { ...factory, name: editedName, abbreviation: editedAbbreviation } : factory
        )
      );
      setEditMode(null);
    } catch (error) {
      toast.error("Failed to update factory");
    }
  };

  return (
    <>
      <div className="max-h-[calc(100vh-100px)] overflow-y-auto p-4">
      <h2 className="text-xl font-semibold text-gray-800">Configure Factories</h2>

      <div className="space-y-4">
        {/* Add Factory Button (Expands on Click) */}
        <div className="rounded-lg p-4 shadow-sm">
        <AnimatePresence mode="wait">
            {!isAdding ? (
              <motion.div
                key="add-button"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 200 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={() => setIsAdding(true)}
                  className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 w-40 justify-center"
                >
                  <PlusCircle size={18} />
                  Add Factory
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="add-form"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -200 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-4"
              >
                {/* Factory Name Input */}
                <Input
                  className="w-[260px]"
                  placeholder="Enter factory name"
                  value={newFactoryName}
                  onChange={(e) => setNewFactoryName(e.target.value)}
                />

                {/* Abbreviation Input */}
                <Input
                  className="w-[160px]"
                  placeholder="Abbreviation"
                  value={newFactoryAbbreviation}
                  onChange={(e) => setNewFactoryAbbreviation(e.target.value)}
                />

                {/* Confirm Add */}
                <button
                  onClick={() => {
                    handleAddFactory();
                    setIsAdding(false); // Close after adding
                  }}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded-md border border-blue-600 hover:bg-blue-100 transition"
                >
                  <Plus size={18} />
                </button>

                {/* Cancel */}
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewFactoryName("");
                    setNewFactoryAbbreviation("");
                  }}
                  className="text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 rounded-md border border-red-600 hover:bg-red-100 transition"
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Factory List Table */}
        <div className="border rounded-lg shadow-sm overflow-x-auto">
          <div className="max-h-80 overflow-y-auto"> {/* Scrollable Table */}
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Abrv.</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {factories.map((factory) => (
                    <TableRow key={factory.id} className="hover:bg-gray-100">
                        {editMode === factory.id ? (
                        <TableCell colSpan={4} className="p-2">
                            <div className="flex flex-col gap-2 w-full">
                            <div className="flex gap-2 w-full">
                                <Input className="flex-grow" value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                                <Input className="w-32" value={editedAbbreviation} onChange={(e) => setEditedAbbreviation(e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setEditMode(null)}>Cancel</Button>
                                <Button size="sm" onClick={() => handleEditFactory(factory.id)}>Save</Button>
                            </div>
                            </div>
                        </TableCell>
                        ) : (
                        <>
                            <TableCell className="w-1/6">{factory.id}</TableCell>
                            <TableCell className="w-3/6">{factory.name}</TableCell>
                            <TableCell className="w-1/6">{factory.abbreviation}</TableCell>
                            <TableCell className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setEditMode(factory.id); setEditedName(factory.name); setEditedAbbreviation(factory.abbreviation); }}>
                                <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            </TableCell>
                        </>
                        )}
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default FactoryManagementCard;
