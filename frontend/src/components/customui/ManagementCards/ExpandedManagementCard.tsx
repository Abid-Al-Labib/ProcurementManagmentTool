import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { ManagementType } from "@/types"; // Import the globally declared type
import FactoryManagementCard from "@/components/customui/ManagementCards/FactoryManagementCard";
import FactorySectionManagementCard from "./FactorySectionManagementCard";
import MachineManagementCard from "./MachineManagementCard";
import DepartmentManagementCard from "./DepartmentManagementCard";
import { useSearchParams } from "react-router-dom";
import MachinePartsManagementCard from "./MachinePartsManagementCard";

interface ExpandedManagementCardProps {
  type: ManagementType;
  onClose: () => void;
}

// Object mapping for cleaner component rendering
const managementCards: Record<ManagementType, JSX.Element> = {
  factory: <FactoryManagementCard />,
  factorySections: <FactorySectionManagementCard />,
  machines: <MachineManagementCard />,
  machineParts: <MachinePartsManagementCard />, // Placeholder
  departments: <DepartmentManagementCard />, // Placeholder
};

const ExpandedManagementCard: React.FC<ExpandedManagementCardProps> = ({ type, onClose }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const managementType = searchParams.get("card") as ManagementType | null;
  
  if (!managementType || !managementCards[managementType]) return null; // Close if invalid or not set

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <Card className="bg-white w-full max-w-xl rounded-lg shadow-lg relative overflow-y-auto">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-black">
          <X size={20} />
        </button>
        <CardContent>
          <div className="w-full max-w-2xl p-6 space-y-6">
            {managementCards[managementType]}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpandedManagementCard;
