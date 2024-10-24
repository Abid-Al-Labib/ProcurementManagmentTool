import { Order, OrderedPart, Status } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { useEffect, useState } from "react";
import { fetchOrderedPartsByOrderID, updateApprovedBudgetByID, updateApprovedOfficeOrderByID, updateApprovedPendingOrderByID } from "@/services/OrderedPartsService";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import OrderedPartRow from "./OrderedPartRow";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { isChangeStatusAllowed } from "@/services/helper";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { deleteOrderByID, fetchRunningOrdersByMachineId, UpdateStatusByID } from "@/services/OrdersService";
import { InsertStatusTracker } from "@/services/StatusTrackerService";
import { useNavigate } from 'react-router-dom';
import { showBudgetApproveButton, showOfficeOrderApproveButton, showPendingOrderApproveButton } from "@/services/ButtonVisibilityHelper";
import { useAuth } from "@/context/AuthContext";
import { supabase_client } from "@/services/SupabaseClient";
import { updateMachinePartQty } from "@/services/MachinePartsService";
import { addDamagePartQuantity } from "@/services/DamagedGoodsService";
import { setMachineIsRunningById } from "@/services/MachineServices";

interface OrderedPartsTableProp {
  mode:  "view" | "manage" | "invoice"
  order: Order
  current_status: Status
}


const OrderedPartsTable:React.FC<OrderedPartsTableProp> = ({mode, order, current_status}) => {
  const profile = useAuth().profile
  const [orderedParts, setOrderedParts] = useState<OrderedPart[]>([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [showActionsCompletedPopup, setShowActionsCompletedPopup] = useState(false);
  const [showEmptyOrderPopup, setShowEmptyOrderPopup] = useState(false);
  const [loadingApproval, setLoadingApproval] =useState(false)
  const [isApproveAllFactoryDialogOpen, setisApproveAllFactoryDialogOpen] = useState(false)
  const [isApproveAllOfficeDialogOpen, setisApproveAllOfficeDialogOpen] = useState(false)
  const [isApproveAllBudgetDialogOpen, setApproveAllBudgetDialogOpen] = useState(false)
  const navigate = useNavigate()
  const [totalCost, setTotalCost] = useState<string>(" - ")
  const [costBreakdown, setCostBreakdown] = useState<string>("Total Cost Breakdown: -")
  const [runCount, setRunCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApproveAllPendingOrder = async () => {
    setLoadingApproval(true)
    try {
      const updatePromises = orderedParts.map(async (ordered_part) => {
        const promises = []

        if (!(ordered_part.in_storage && ordered_part.approved_storage_withdrawal)) {
          promises.push(updateApprovedPendingOrderByID(ordered_part.id, true));
        }
   
        // If order type is "Machine" and the part is not approved, update quantities
        if (order.order_type === "Machine" && !ordered_part.approved_pending_order) {
          await updateMachinePartQty(
            order.machine_id,
            ordered_part.part_id,
            ordered_part.qty,
            'subtract'
          )
          promises.push(addDamagePartQuantity(order.factory_id, ordered_part.part_id, ordered_part.qty));
          
        }

        return Promise.all(promises);
      });
      await Promise.all(updatePromises);
      toast.success("Approved all parts in the pending order")
    } catch (error) {
      toast.error("Failed to bulk approve")
    } finally {
      setLoadingApproval(false)
    }
    setisApproveAllFactoryDialogOpen(false)
  }
  
  const handleApproveAllOfficeOrder = async () => {
    setLoadingApproval(true)
    try {
      const updatePromises = orderedParts.map((ordered_part) => {
        if (!(ordered_part.in_storage && ordered_part.approved_storage_withdrawal)){
          return updateApprovedOfficeOrderByID(ordered_part.id, true);
        }
      });
      await Promise.all(updatePromises);
      toast.success("Approved all ordered items from office")
    } catch (error) {
      toast.error("Failed to bulk approve")
    } finally {
      setLoadingApproval(false)
    }
    setisApproveAllOfficeDialogOpen(false)
  }
  
  const handleApproveAllBudgets = async () => {
    setLoadingApproval(true)
    try {
      const updatePromises = orderedParts.map((ordered_part) => {
        if (!(ordered_part.in_storage && ordered_part.approved_storage_withdrawal)){
          return updateApprovedBudgetByID(ordered_part.id, true);
        }
      });
      await Promise.all(updatePromises);
      toast.success("Approved budgets for all parts")
    } catch (error) {
      toast.error("Failed to bulk approve")
    } finally {
      setLoadingApproval(false)
    }
    setApproveAllBudgetDialogOpen(false)
  }
  
 const deleteEmptyOrder = async () => {
    if(mode==="manage")
      {
          setShowEmptyOrderPopup(true);
          try {
            await deleteOrderByID(order.id) 
          } catch (error) {
            toast.error("Could not delete order by id")
          }

      }
  }

const loadOrderedParts = async () => {
    try {
      setLoadingTable(true)
      const order_id = order.id
      const orderedPartsList = await fetchOrderedPartsByOrderID(order_id)
      if (orderedPartsList) {
        setOrderedParts(orderedPartsList)
        if (orderedPartsList.length===0){
          await deleteEmptyOrder()
        }
        return orderedPartsList
      }
      else {
        toast.error("Could not load ordered parts for this order")
      }
    } catch (error) {
      toast.error("Error loading parts")
    } finally {
      setLoadingTable(false);
    }
  }

const manageOrderStatus = async () => {
  const updatedOrderedParts = await loadOrderedParts()
  if (mode === "manage" && updatedOrderedParts)
  {
    console.log("managing:",updatedOrderedParts)
    const next_status_id = isChangeStatusAllowed(updatedOrderedParts,current_status.name)
    console.log("current status id: ", current_status.id)
    console.log("next status id: ",next_status_id)
    if (next_status_id && next_status_id!==-1 && current_status.id !== next_status_id){
      console.log("changing status")
      if(!profile){
        toast.error("Profile not found")
        return
      }
      try { 
        console.log("updating status and inserting to status tracker")
        await UpdateStatusByID(order.id,next_status_id)
        await InsertStatusTracker((new Date()), order.id, profile.id, next_status_id)
        if(next_status_id == 8){
          if((await (fetchRunningOrdersByMachineId(order.machine_id))).length==0){
            setMachineIsRunningById(order.machine_id,true)
            toast.success("Machine is now running")
          }
        }
      } catch (error) {
        toast.error("Error updating status")
      }
      setShowActionsCompletedPopup(true);
    }
  }
}

const calculateTotalCost = () => {
  if (orderedParts.length > 0) {
    let totalCost = 0; 
    let ans_string = "";

    orderedParts.forEach((part, index) => {
      if (part.qty && part.unit_cost) {
        const cost = part.qty * part.unit_cost;
        totalCost += cost;
        ans_string += `(${part.qty} x ${part.unit_cost})`; // Add current part to string
        if (index < orderedParts.length - 1) {
          ans_string += " + ";
        }
      }
    });

    const finalTotalCostString = totalCost > 0
      ? `BDT ${totalCost}`
      : "-"; // Handle case where there are no valid parts

    const finalCostBreakdownString = totalCost > 0
    ? `Total Cost Breakdown: BDT ${ans_string}`
    : "Total Cost Breakdown: -"; // Handle case where there are no valid parts

    setTotalCost(finalTotalCostString);
    setCostBreakdown(finalCostBreakdownString)
  } else {
     // Handle case where orderedParts is empty
    setTotalCost("Total Cost: -");
    setCostBreakdown("Total Cost Breakdown: -")
  }
};

const handleOrderManagement = async () => {
    if (runCount > 0 && !isProcessing) {
      setIsProcessing(true)
      await manageOrderStatus();
      setRunCount(0);
      setIsProcessing(false) // Reset the count after running
    }
    else{
      return;
    }
};

  //use effect to calculet total cost everytime orderedParts is reloaded
  useEffect( () => {
    calculateTotalCost();
  }, [orderedParts]);

  // useEffect to monitor and process the queue
  useEffect( () => {
    handleOrderManagement();
}, [runCount, isProcessing]);

  const handleChanges = async (payload: any) => {
    console.log(isProcessing)
    if (!isProcessing) {
    setRunCount(prevCount => prevCount + 1);
  }
  };
  

  useEffect(()=>{
    const channel = supabase_client
    .channel('order_parts-changes')
    .on(
        'postgres_changes',
        {
        event: '*',
        schema: 'public',
        table: 'order_parts'
        },handleChanges
    )
    .subscribe()
  },[])

  useEffect(()=>{
    loadOrderedParts()
  },[])
  
  const handleNavigation = () => {
    navigate('/orders'); 
  };

  if (mode==="view"){
    return(      
      <Card x-chunk="dashboard-06-chunk-0" className="mt-1">
      <CardHeader>
          <CardTitle>Parts Ordered</CardTitle>
          <CardDescription>
          <p>This is a list of parts that were ordered.</p>
          </CardDescription>
      </CardHeader>
      {(loadingTable===true)? (
                  <div className='animate-spin flex flex-row justify-center p-5'>
                      <Loader2 />
                  </div>
        ):
      <CardContent>
        <Table>
        <TableHeader>
        <TableRow>
            <TableHead className="whitespace-nowrap">Part</TableHead>
            <TableHead className="whitespace-nowrap">In Storage</TableHead>
            <TableHead className="whitespace-nowrap">Taken from storage</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Qty</TableHead>
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap hidden md:table-cell">Brand</TableHead>}
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap hidden md:table-cell">Vendor</TableHead>}
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap hidden md:table-cell">Cost/Unit</TableHead>}
            <TableHead className="whitespace-nowrap hidden md:table-cell">Note</TableHead>
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap hidden md:table-cell">Office Note</TableHead>}
            <TableHead className="whitespace-nowrap hidden md:table-cell">Date Purchased</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Date Sent To Factory</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Date Received By Factory</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Office Sample Sent/Received</TableHead>
            <TableHead className="md:hidden">Info</TableHead>
        </TableRow>
        </TableHeader>
        {loadingTable? (
            <div className='flex flex-row justify-center'>
                <Loader2 className='h-8 w-8 animate-spin'/>
            </div>
        ):
            <TableBody>
            {orderedParts.map(orderedPart => (                                        
                <OrderedPartRow key={orderedPart.id}
              mode="view"
              orderedPartInfo={orderedPart}
              current_status={current_status}
              factory_id={order.factory_id}
              machine_id={order.machine_id}
              order_type={order.order_type}/>
            ))}
              {(profile?.permission === 'admin' || profile?.permission === 'finance') && ( <TableRow>
                <TableCell className="font-bold">Total:</TableCell>
                <TableCell className="font-bold">{totalCost}</TableCell>
              </TableRow>
              )}
            </TableBody>
        }  
      </Table>
      </CardContent>
    }
    </Card>
    )
  }
  else if (mode==="invoice"){
    return(      
      <Card x-chunk="dashboard-06-chunk-0" className="mt-1">
        <CardHeader>
          <CardTitle>Parts Ordered</CardTitle>
          <CardDescription>
          <p>The list of parts that were ordered.</p>
          </CardDescription>
        </CardHeader>
          {(loadingTable===true)? (
                  <div className='animate-spin flex flex-row justify-center p-5'>
                      <Loader2 />
                  </div>
          ):


        <CardContent>
          <Table>
            <TableHeader>
            <TableRow>
              <TableHead>Part</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Cost/Unit</TableHead>
              <TableHead>Subtotal</TableHead>
            </TableRow>
            </TableHeader>
            {loadingTable? (
              <div className='flex flex-row justify-center'>
                  <Loader2 className='h-8 w-8 animate-spin'/>
              </div>
            ):
              <TableBody>
              {orderedParts.map(orderedPart => (                                        
                  <OrderedPartRow key={orderedPart.id}
                mode="invoice"
                orderedPartInfo={orderedPart}
                current_status={current_status}
                factory_id={order.factory_id}
                machine_id={order.machine_id}
                order_type={order.order_type}/>
              ))}
              <TableRow>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="font-bold">Total:</TableCell>
                <TableCell className="font-bold">{totalCost}</TableCell>
              </TableRow>
              </TableBody>
            }  
          </Table>
        </CardContent>
        }
      </Card>
    )
  }
  else if (mode==="manage"){
    return(
      <Card x-chunk="dashboard-06-chunk-0" className="mt-5">
      <CardHeader>
          <CardTitle>Manage Parts Ordered</CardTitle>
          <CardDescription>
              This is a list of parts that were ordered, you can complete actions on each ordered part.
          </CardDescription>
      </CardHeader>
      {(loadingTable===true)? (
                  <div className='animate-spin flex flex-row justify-center p-5'>
                      <Loader2 />
                  </div>
        ):
        <CardContent>
        <div className="flex justify-end gap-2 mb-2">
          {showPendingOrderApproveButton(current_status.name,false) && (
            <Button disabled={loadingApproval} onClick={()=>setisApproveAllFactoryDialogOpen(true)}>{loadingApproval? "Approving...": "Approve all pending parts"}</Button>
          )}
          {showOfficeOrderApproveButton(current_status.name,false) && (
            <Button disabled={loadingApproval} onClick={()=>setisApproveAllOfficeDialogOpen(true)}>{loadingApproval? "Approving...": "Approve all parts"}</Button>
          )}
          {showBudgetApproveButton(current_status.name,false) && (
            <Button disabled={loadingApproval} onClick={()=>setApproveAllBudgetDialogOpen(true)}>{loadingApproval? "Approving...": "Approve all budgets"}</Button>
          )}
        </div>
        <Table>
        <TableHeader>
        <TableRow>
            <TableHead className="whitespace-nowrap"></TableHead>
            <TableHead className="whitespace-nowrap">Part</TableHead>
            <TableHead className="whitespace-nowrap">In Storage</TableHead>
            <TableHead className="whitespace-nowrap">Taken from storage</TableHead>
            <TableHead className="whitespace-nowrap">Current Storage Qty</TableHead>
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap">Last Cost/Unit</TableHead>}
            <TableHead className="whitespace-nowrap">Last Purchase Date</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Qty</TableHead>
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap hidden md:table-cell">Brand</TableHead>}
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap hidden md:table-cell">Vendor</TableHead>}
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap hidden md:table-cell">Cost/Unit</TableHead>}
            <TableHead className="whitespace-nowrap hidden md:table-cell">Note</TableHead>
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap hidden md:table-cell">Office Note</TableHead>}
            <TableHead className="whitespace-nowrap hidden md:table-cell">Date Purchased</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Date Sent To Factory</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Date Received By Factory</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Office Sample Sent/Received</TableHead>
            <TableHead className="md:hidden">Info</TableHead>
        </TableRow>
        </TableHeader>
        {loadingTable? (
            <div className='flex flex-row justify-center'>
                <Loader2 className='h-8 w-8 animate-spin'/>
            </div>
        ):
            <TableBody>
            {orderedParts.map(orderedPart => (                                        
                <OrderedPartRow key={orderedPart.id}
              mode="manage"
              orderedPartInfo={orderedPart}
              current_status={current_status}
              factory_id={order.factory_id}
              machine_id={order.machine_id}
              order_type={order.order_type}/>
            ))}
              {(profile?.permission === 'admin' || profile?.permission === 'finance') && ( <TableRow>
                <TableCell className="font-bold">Total:</TableCell>
                <TableCell className="font-bold">{totalCost}</TableCell>
              </TableRow>
              )}
            </TableBody>
        }  
      </Table>
      </CardContent>
      }
      <Dialog open={showActionsCompletedPopup} onOpenChange={handleNavigation}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-green-600">All action completed for current status</DialogTitle>
              <DialogDescription>
                <p>Order will be moved to next status.</p>
                <p>You will be moved back to orders page.</p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleNavigation}>OK</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
      <Dialog open={showEmptyOrderPopup} onOpenChange={handleNavigation}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">This order has no parts ordered.</DialogTitle>
              <DialogDescription>
                <p>Order will be deleted.</p>
                <p>You will be moved back to orders page.</p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleNavigation}>OK</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>

      <Dialog open={isApproveAllFactoryDialogOpen} onOpenChange={setisApproveAllFactoryDialogOpen}>
        <DialogContent>
          <DialogTitle>
           Approve All
          </DialogTitle>
          <DialogDescription>
            <p className="text-sm text-muted-foreground">
              You are approving all the parts in this pending order. This cannot be undone and you will move to next status.
            </p>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to approve?
            </p>
          </DialogDescription>
          <Button onClick={handleApproveAllPendingOrder}>Approve</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isApproveAllOfficeDialogOpen} onOpenChange={setisApproveAllOfficeDialogOpen}>
        <DialogContent>
          <DialogTitle>
           Approve All
          </DialogTitle>
          <DialogDescription>
            <p className="text-sm text-muted-foreground">
              You are approving all the parts in this order. This cannot be undone and you will move to next status.
            </p>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to approve?
            </p>
          </DialogDescription>
          <Button onClick={handleApproveAllOfficeOrder}>Approve</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isApproveAllBudgetDialogOpen} onOpenChange={setApproveAllBudgetDialogOpen}>
        <DialogContent>
          <DialogTitle>
           Approve All 
          </DialogTitle>
          <DialogDescription>
            <p className="text-sm text-muted-foreground">
              You are approving budgets for all parts. Only approve if you are okay with the whole quotation. 
              This cannot be undone and you will be moved to the next status.
            </p>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to approve?
            </p>
          </DialogDescription>
          <Button onClick={handleApproveAllBudgets}>Approve</Button>
        </DialogContent>
      </Dialog>
      </Card>
      
    )
  }
  
}

export default OrderedPartsTable