import { useEffect, useState } from "react";
import { Table, TableHead, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { PlusCircle, Plus, X, PencilRuler, PencilOff, Check, XCircle } from "lucide-react";
import { fetchDepartments, addDepartment, deleteDepartment, updateDepartment } from "@/services/FactoriesService";

const DepartmentManagementCard = () => {
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);

  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState("");

  const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(null);
  const [editedDepartmentName, setEditedDepartmentName] = useState("");

  // Load departments on mount
  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await fetchDepartments();
      setDepartments(data);
    } catch (error) {
      toast.error("Failed to load departments.");
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) {
      toast.error("Please enter a department name.");
      return;
    }

    try {
      await addDepartment(newDepartmentName);
      toast.success("Department added!");
      setIsAddingDepartment(false);
      setNewDepartmentName("");
      loadDepartments();
    } catch (error) {
      toast.error("Error adding department.");
    }
  };

  const handleDeleteDepartment = async (departmentId: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this department?");
    if (!confirmed) return;

    try {
      await deleteDepartment(departmentId);
      loadDepartments();
    } catch (error) {
      toast.error("Failed to delete department.");
    }
  };

  const handleUpdateDepartment = async (departmentId: number) => {
    if (!editedDepartmentName.trim()) {
      toast.error("Department name cannot be empty.");
      return;
    }

    try {
      await updateDepartment(departmentId, editedDepartmentName);
      setEditingDepartmentId(null);
      setEditedDepartmentName("");
      loadDepartments();
    } catch (error) {
      toast.error("Error updating department.");
    }
  };

  return (
    <>
      {/* Heading */}
      <h2 className="text-xl font-semibold text-gray-800">Configure Departments</h2>

      <div className="border-b pb-4">
        {/* Add Department Button */}
        <AnimatePresence mode="wait">
          {!isAddingDepartment ? (
            <motion.div
              key="add-button"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 200 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={() => setIsAddingDepartment(true)}
                className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 w-40 justify-center"
              >
                <PlusCircle size={18} />
                Add Department
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
              <Input
                placeholder="Department Name"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                className="w-[260px]"
              />

              <button
                onClick={handleAddDepartment}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded-md border border-blue-600 hover:bg-blue-100 transition"
              >
                <Plus size={18} />
              </button>

              <button
                onClick={() => {
                  setIsAddingDepartment(false);
                  setNewDepartmentName("");
                }}
                className="text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 rounded-md border border-red-600 hover:bg-red-100 transition"
              >
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Departments Table */}
      <div className="rounded-md shadow-md max-h-[500px] overflow-y-auto mt-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead>ID</TableHead>
              <TableHead>Department Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell>{dept.id}</TableCell>
                <TableCell>
                  {editingDepartmentId === dept.id ? (
                    <Input
                      type="text"
                      value={editedDepartmentName}
                      onChange={(e) => setEditedDepartmentName(e.target.value)}
                      className="border rounded-md p-1 w-60 text-center"
                    />
                  ) : (
                    dept.name
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell className="flex gap-2">
                  {editingDepartmentId === dept.id ? (
                    <>
                      {/* Cancel Edit */}
                      <button
                        onClick={() => {
                          setEditingDepartmentId(null);
                          setEditedDepartmentName("");
                        }}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 rounded-md border border-red-600 hover:bg-red-100 transition"
                      >
                        <PencilOff size={18} />
                      </button>

                      {/* Confirm Edit */}
                      <button
                        onClick={() => handleUpdateDepartment(dept.id)}
                        className="text-green-600 hover:text-green-800 flex items-center gap-1 px-2 py-1 rounded-md border border-green-600 hover:bg-green-100 transition"
                      >
                        <Check size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          setEditingDepartmentId(dept.id);
                          setEditedDepartmentName(dept.name);
                        }}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded-md border border-blue-600 hover:bg-blue-100 transition"
                      >
                        <PencilRuler size={18} />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteDepartment(dept.id)}
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
    </>
  );
};

export default DepartmentManagementCard;
