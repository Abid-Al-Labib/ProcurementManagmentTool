import LinkedOrdersTable from "@/components/customui/LinkedOrdersTable";
import PartInfo from "@/components/customui/PartInfo";
import { Button } from "@/components/ui/button";
import { convertUtcToBDTime } from "@/services/helper";
import { fetchOrderedPartByPartID } from "@/services/OrderedPartsService";
import { fetchPartByID } from "@/services/PartsService";
import { OrderedPart, Part } from "@/types";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";

const ViewPartPage = () => {
  const { id } = useParams<{ id: string }>();
  const [parts, setParts] = useState<Part[]>([]);
  const [linkedOrderedParts, setLinkedOrderedParts] = useState<OrderedPart[]>([]);
  const [loadingPartInfo, setLoadingPartInfo] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const loadParts = async () => {
      if (!id || isNaN(parseInt(id))) {
        toast.error("Invalid part ID");
        navigate("/parts");
        return;
      }
      const part_id = parseInt(id);
      try {
        const part_data = await fetchPartByID(part_id);
        if (part_data && part_data.length > 0) {
          setParts(part_data);
        } else {
          toast.error("Part not found");
          navigate("/parts");
        }

      } catch (error) {
        toast.error("Failed to fetch Part info");
        navigate("/parts");
      } finally {
        setLoadingPartInfo(false);
        setLoadingTable(false);
      }

      try {
        const linked_ordered_parts_data = await fetchOrderedPartByPartID(part_id);
        setLinkedOrderedParts(linked_ordered_parts_data);

      } catch (error) {
        toast.error("Failed to fetch linked orders");
      } finally {
        setLoadingPartInfo(false);
      }
    };
    loadParts();
  }, [id, navigate]);

  if (loadingPartInfo) {
    return (
      <div className='flex flex-row justify-center p-5'>
        <Loader2 className="animate-spin" />
        <span>loading...</span>
      </div>
    );
  }

  if (parts.length === 0) {
    toast.error("No order found with this id");
    return <div>No order found</div>; // Handle the case where no orders are returned
  }

  return (
    <div className="flex w-full flex-col bg-muted/40 mt-2">
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0">
        <div>
          <PartInfo
            id={parts[0].id}
            created_at={convertUtcToBDTime(parts[0].created_at)}
            name={parts[0].name}
            unit={parts[0].unit}
            lifetime={parts[0].lifetime}
            description={parts[0].description}
          />
        </div>

        {loadingTable ? (
          <div className='animate-spin flex flex-row justify-center p-5'>
            <Loader2 />
          </div>
        ) : (
          <LinkedOrdersTable
            linkedOrderedParts={linkedOrderedParts}
          />
        )}
      </main>
      <div className="flex justify-end">
        <div className="my-3 mx-3">
          <Link to={'/parts'}><Button>Back To Parts</Button></Link>
        </div>
      </div>
    </div>
  );
};

export default ViewPartPage;
