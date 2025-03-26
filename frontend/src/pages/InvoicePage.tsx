import { Order } from '@/types';
import { convertUtcToBDTime } from '@/services/helper';
import OrderedPartsTable from '@/components/customui/OrderedPartsTable';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchOrderByID } from '@/services/OrdersService';
import { Button } from '@/components/ui/button';
import { useReactToPrint } from "react-to-print";
import { Separator } from '@/components/ui/separator';
const InvoicePage = () => {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const invoiceRef = useRef<HTMLDivElement | null>(null);
    
    const handlePrint = useReactToPrint({
        contentRef: invoiceRef,
        documentTitle: `invoice-orderid-${order?.id}`,
      });
    

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
        loadOrders()
    }, []);

    
    if (loading) {
    return <div>Loading...</div>; // Add a loading state if necessary
    }
    
    if (!order) {
    toast.error("No order found with this id");
    return <div>No order found</div>; // Handle the case where no orders are returned
    }
    
    const formattedDate = new Date(new Date().getTime() + 6 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    
      return (
        <>
        <div className='flex justify-end m-2'>
            <Button onClick={() => handlePrint()}>Print Invoice</Button>
        </div>
        <div className='flex justify-center'>
        <div  ref={invoiceRef} className="flex min-h-screen flex-col mx-2 w-[1000px]">
          <div className="mt-2 mx-4">
            <h1 className="text-5xl">{order.factories.name}</h1>
            <p className='mt-2'>Purchase Requisition</p>
            <p>{formattedDate}</p>
            <Separator className='my-2'/>
          </div>
          <main className="grid mx-4">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2 mt-4">
              <div className='flex flex-row'>
              <div className="sm:flex flex-1 gap-2">
                <div className="w-full">
                  <ul className="grid gap-2 pr-10">
                    <li className="flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground">Order ID</span>
                      <span>{order.id}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground">Created at</span>
                      <span>{convertUtcToBDTime(order.created_at)}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground">Created by</span>
                      <span>{order.profiles.name}</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="sm:flex flex-1 gap-2">
                <div className="w-full">
                  <ul className="grid gap-2 pr-10">
                    <li className="flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground">Department</span>
                      <span>{order.departments.name}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground">
                        {order.factory_sections?.name && order.machines?.name ? 'Machine' : 'Order for Storage'}
                      </span>
                      <span>
                        {order.factory_sections?.name && order.machines?.name
                          ? `${order.factories.abbreviation} - ${order.factory_sections.name} - ${order.machines.name}`
                          : `${order.factories.abbreviation}`}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground">Current Status</span>
                      <span>{order.statuses.name}</span>
                    </li>
                  </ul>
                </div>
              </div>
              </div>
              <div className="max-w-xl text-balance leading-relaxed"><span className="font-semibold text-muted-foreground">Note: </span>{order.order_note}</div>
              <Separator/>
              <div className="w-full mt-2 overflow-x-auto">
                <OrderedPartsTable mode="invoice" order={order} parts={[]} current_status={order.statuses} />
              </div>
            </div>
          </main>
        </div>
        </div>
        </>
      );
}

export default InvoicePage