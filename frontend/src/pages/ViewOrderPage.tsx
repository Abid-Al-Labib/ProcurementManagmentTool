import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StatusTracker from "@/components/customui/StatusTracker";
import OrderInfo from "@/components/customui/OrderInfo";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Order } from "@/types";
import { fetchOrderByID } from "@/services/OrdersService";
import OrderedPartsTable from "@/components/customui/OrderedPartsTable";
import { supabase_client } from "@/services/SupabaseClient";
import { useAuth } from "@/context/AuthContext";
import NavigationBar from "@/components/customui/NavigationBar";

const ViewOrderPage = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const profile = useAuth().profile;
  const loadOrders = async () => {
    if (!id || isNaN(parseInt(id))) {
      toast.error("Invalid order ID");
      navigate("/orders");
      return;
    }
    const order_id = parseInt(id);
    try {
      const data = await fetchOrderByID(order_id);
      if (data) {
        setOrder(data);
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
              console.log("Changes detect, processing realtime")
              loadOrders();
          }
      )
      .subscribe()
    loadOrders();
  }, [id, navigate,supabase_client]);

  
  const CreateInvoice = () => {
    window.open(`/invoice/${id}`, '_blank');
  };

  if (loading) {
    return <div>Loading...</div>; // Add a loading state if necessary
  }
  
  if (!order) {
    toast.error("No order found with this id");
    return <div>No order found</div>; // Handle the case where no orders are returned
  }

  return (
    <>
    <NavigationBar />
      <div className="flex min-h-screen w-full flex-col bg-muted/40 mx-2">
        <main className="grid m-4">
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="sm:flex flex-1 gap-2">
              <div className="w-full mt-4">
                <OrderInfo order={order} mode="view"/>
              </div>
              <div className="mt-4">
                <StatusTracker order_id={order.id} />
              </div>
            </div>
            <div className="w-full mt-4 overflow-x-auto">
              <OrderedPartsTable mode="view" order={order} parts={[]} current_status={order.statuses} />
            </div>
          </div>
        </main>
        <div className="flex justify-end">
          <div className="my-3 mx-3 flex gap-2">
              <Button  
                onClick={CreateInvoice}
              >
                Create Invoice
              </Button>
            <Link to={'/orders'}>
              <Button>Back To Orders</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewOrderPage;
