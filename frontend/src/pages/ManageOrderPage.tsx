import { Link, useNavigate, useParams } from "react-router-dom";
import OrderInfo from "@/components/customui/OrderInfo";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Order, Part } from "@/types";
import { fetchOrderByID } from "@/services/OrdersService";
import OrderedPartsTable from "@/components/customui/OrderedPartsTable";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { managePermission } from "@/services/helper";
import { supabase_client } from "@/services/SupabaseClient";
import { DialogContent, Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";

import NavigationBar from "../components/customui/NavigationBar"
import { fetchAllParts } from "@/services/PartsService";

const ManageOrderPage = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true);
  const [partsLoading, setPartsLoading] = useState(true)
  const navigate = useNavigate();
  const profile = useAuth().profile
  const [isManageOrderAuthorizedDialogOpen, setIsManageOrderAuthorizedDialogOpen] = useState<boolean>(false)
  const handleNavigationToOrderPage = () => {
    navigate("/orders");
  }

  const handleNavigationToViewOrderPage = () => {
    navigate(`/vieworder/${id}`)
  }

  const loadOrder = async () => {
    if (!id || isNaN(parseInt(id))) {
      toast.error("Invalid order ID");
      navigate("/orders");
      return;
    }
    const order_id = parseInt(id);
    try {
      const data = await fetchOrderByID(order_id);
      if (data) {
        const order = data
        setOrder(order);
        if (profile && profile.permission && !managePermission(order.statuses.name,profile.permission))
        {
          setIsManageOrderAuthorizedDialogOpen(true)
        }
      } else {
        toast.error("Order not found");
        navigate("/orders");
      }
    } catch (error) {
      toast.error("Failed to fetch order info");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  const loadParts = async () => {
    try {
      setPartsLoading(true)
      const parts_data = await fetchAllParts();
      if (parts_data) {
        setParts(parts_data.data)
      }
      else {
        setParts([])
      }
    } catch (error) {
      toast.error("Failed to fetch parts")
    } finally {
      setPartsLoading(false)
    }
  }

  useEffect(() => {
    const channel = supabase_client
        .channel('order-changes')
        .on(
            'postgres_changes',
            {
            event: '*',
            schema: 'public',
            table: 'orders'
            },
            () => {
                console.log("Changes detected for order, processing realtime")
                loadOrder();
            }
        )
        .subscribe()  

  }, [id, navigate]);
  
  useEffect(() => { 
    loadParts();
    loadOrder();
  }, []);

  if (loading || partsLoading) {
    return <div>Loading...</div>; // Add a loading state if necessary
  }

  if(!order)
  {  
    toast.error("No order found with this id")
    return <div>No order found</div>; // Handle the case where no orders are returned
  }

  return (
    <>
      <NavigationBar />
      <div className="mx-4 my-4">
        <OrderInfo
          order={order}
          mode="manage"
        />
        <OrderedPartsTable
          mode="manage"
          order={order}
          parts = {parts}
          current_status={order.statuses}
        />
      <div className="flex justify-end">
        <div className="my-3 mx-3">
          <Link to={'/orders'}><Button>Back To Orders</Button></Link>
        </div>
      </div>
    </div>

      <Dialog open={isManageOrderAuthorizedDialogOpen} onOpenChange={handleNavigationToOrderPage}>
        <DialogContent>
          <DialogTitle>
           Unauthorized to manage order
          </DialogTitle>
          <DialogDescription>
            <p className="text-sm text-muted-foreground">
              This order is in a status that cannot be managed by you. You will be redirected to view order page. 
            </p>
          </DialogDescription>
          <Button onClick={handleNavigationToViewOrderPage}>Okay</Button>
        </DialogContent>
      </Dialog>
    </>
    
  )
}

export default ManageOrderPage