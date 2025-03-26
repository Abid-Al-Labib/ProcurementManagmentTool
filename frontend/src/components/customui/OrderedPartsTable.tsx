import { Order, OrderedPart, Part, Status } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { useEffect, useState } from "react";
import { fetchOrderedPartsByOrderID, insertOrderedParts, updateApprovedBudgetByID, updateApprovedOfficeOrderByID, updateApprovedPendingOrderByID } from "@/services/OrderedPartsService";
import toast from "react-hot-toast";
import { Flag, FlagOff, Loader2 } from "lucide-react";
import OrderedPartRow from "./OrderedPartRow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { isChangeStatusAllowed, isRevertStatusAllowed } from "@/services/helper";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { deleteOrderByID, fetchRunningOrdersByMachineId, UpdateStatusByID } from "@/services/OrdersService";
import { InsertStatusTracker } from "@/services/StatusTrackerService";
import { useNavigate } from 'react-router-dom';
import { showAddPartButton , showAllBudgetApproveButton, showOfficeOrderApproveButton, showPendingOrderApproveButton } from "@/services/ButtonVisibilityHelper";
import { useAuth } from "@/context/AuthContext";
import { supabase_client } from "@/services/SupabaseClient";
import { updateMachinePartQty } from "@/services/MachinePartsService";
import { addDamagePartQuantity } from "@/services/DamagedGoodsService";
import { setMachineIsRunningById } from "@/services/MachineServices";
import { Label } from "../ui/label";
import ReactSelect from "react-select";
import { Checkbox } from "../ui/checkbox";
import { Textarea } from "../ui/textarea";
import { fetchStoragePartQuantityByFactoryID } from "@/services/StorageService";

interface OrderedPartsTableProp {
  mode:  "view" | "manage" | "invoice"
  order: Order
  parts: Part[]
  current_status: Status
}


const OrderedPartsTable:React.FC<OrderedPartsTableProp> = ({mode, order, parts, current_status}) => {
  const profile = useAuth().profile
  const [orderedParts, setOrderedParts] = useState<OrderedPart[]>([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [showActionsCompletedPopup, setShowActionsCompletedPopup] = useState(false);
  const [showEmptyOrderPopup, setShowEmptyOrderPopup] = useState(false);
  const [loadingTableButtons, setLoadingTableButtons] =useState(false)
  const [loadingAddPart, setLoadingAddPart] = useState(false);
  const [isApproveAllFactoryDialogOpen, setisApproveAllFactoryDialogOpen] = useState(false)
  const [isApproveAllOfficeDialogOpen, setisApproveAllOfficeDialogOpen] = useState(false)
  const [isApproveAllBudgetDialogOpen, setApproveAllBudgetDialogOpen] = useState(false)
  const [isAddPartDialogOpen, setIsAddPartDialogOpen] = useState(false)
  const navigate = useNavigate()
  const [totalCost, setTotalCost] = useState<string>(" - ")
  const [costBreakdown, setCostBreakdown] = useState<string>("Total Cost Breakdown: -")
  const [runCount, setRunCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanceButton, setShowAdvanceButton] = useState<boolean>(false)
  const [showRevertButton, setShowRevertButton] = useState<boolean>(false)
  const [isAdvanceDialogOpen,setIsAdvanceDialogOpen] = useState<boolean>(false)
  const [isRevertDialogOpen, setIsRevertDialogOpen] = useState<boolean>(false)

  const [searchQueryParts,setSearchQueryParts] = useState<string>('');
  const [selectedPartId, setSelectedPartId] = useState<number>(-1);
  const [selectedPartQty, setSelectedPartQty] = useState<number>(-1);
  const [isSampleSentToOffice, setIsSampleSentToOffice] = useState<boolean>(false);
  const [selectedPartNote, setSelectedPartNote] = useState<string>('');

  const handleApproveAllPendingOrder = async () => {
    setLoadingTableButtons(true)
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
      setLoadingTableButtons(false)
    }
    setisApproveAllFactoryDialogOpen(false)
  }
  
  const handleApproveAllOfficeOrder = async () => {
    setLoadingTableButtons(true)
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
      setLoadingTableButtons(false)
    }
    setisApproveAllOfficeDialogOpen(false)
  }
  
  const handleApproveAllBudgets = async () => {
    setLoadingTableButtons(true)
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
      setLoadingTableButtons(false)
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
    toast.success("Empty order was removed")
    handleNavigation()
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

const handleAdvanceOrderStatus = async () => {
  setLoadingTableButtons(true)
  try {
    if(!profile){
      toast.error("Profile not found")
      return
    }
    const next_status_id = isChangeStatusAllowed(orderedParts,current_status.name)
    if (next_status_id && next_status_id!==-1 && current_status.id !== next_status_id){
      await UpdateStatusByID(order.id,next_status_id)
      await InsertStatusTracker((new Date()), order.id, profile.id, next_status_id)
      if(order.order_type == "Machine"){
        if(next_status_id == 8){
          if((await (fetchRunningOrdersByMachineId(order.machine_id))).length==0){
            setMachineIsRunningById(order.machine_id,true)
            toast.success("Machine is now running")
          }
        }
      }
    }
    else{
      toast.error("Could not figure out next status")
    }
  } catch (error) {
    toast.error("Error when trying to advance order")
  } finally {
    setLoadingTableButtons(false)
    setShowAdvanceButton(false)
    setIsAdvanceDialogOpen(false)
  }
}  


const handleRevertOrderStatus = async() => {
  setLoadingTableButtons(true)
  if (!profile) {
    toast.error("Profile not found")
    return
  }
  try {
    const prevStatus = 3 //always goes back to waiting for quotation status
    await UpdateStatusByID(order.id, prevStatus)
    await InsertStatusTracker((new Date()), order.id, profile.id, prevStatus)
    toast.success("Successfully reverted status to Waiting For Quotation")
  } catch (error) {
    toast.error("Error occured while reverting status")
  } finally {
    setLoadingTableButtons(false)
    setIsRevertDialogOpen(false)
  }
};


const manageOrderStatus = async () => {
  const updatedOrderedParts = await loadOrderedParts()
  if (mode === "manage" && updatedOrderedParts)
  {
    const next_status_id = isChangeStatusAllowed(updatedOrderedParts,current_status.name)
    setShowRevertButton(isRevertStatusAllowed(updatedOrderedParts,current_status.name))
    
    if (next_status_id && next_status_id!==-1 && current_status.id !== next_status_id){
      setShowAdvanceButton(true);
    }else{
      setShowAdvanceButton(false);
    }
  }
}

const resetAddPart = () => {
  setSelectedPartQty(-1);
  setSelectedPartId(-1);
  setIsSampleSentToOffice(false);
  setSelectedPartNote('');
}

const handleSelectPart = (value: number) => {
  if (selectedPartId !== value) {
    setSelectedPartId(value);  
  } 
};

const handleAddPart = async () => {
  setIsAddPartDialogOpen(false);
  setLoadingAddPart(true);
  try {

      const storage_data =  await fetchStoragePartQuantityByFactoryID(selectedPartId,order.factory_id)
      if (order.order_type==="Machine" && storage_data.length>0 && storage_data[0].qty>0)
      {
        //machine and there is part in storage so send true for in_storage param  
        insertOrderedParts(
            selectedPartQty,
            order.id,
            selectedPartId,
            isSampleSentToOffice?? false,
            selectedPartNote.trim() || null,
            true,
            false
        )
      }
      else {
        //not a machine or part not in storage so send false for in_storage param
        insertOrderedParts(
          selectedPartQty,
          order.id,
          selectedPartId,
          isSampleSentToOffice?? false,
          selectedPartNote.trim() || null,
          false,
          false
      )
      }
      toast.success("Part added")
      resetAddPart()

  } catch (error) {
      toast.error(`An error occurred: ${error}`);
  } finally {
    setLoadingAddPart(false);  
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

  useEffect(()=>{
    manageOrderStatus()
  },[order])
  
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
            <TableHead></TableHead>
            <TableHead className="whitespace-nowrap">Part</TableHead>
            <TableHead className="whitespace-nowrap">In Storage</TableHead>
            <TableHead className="whitespace-nowrap">Taken from storage</TableHead>
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap">Last Cost/Unit</TableHead>}
            <TableHead className="whitespace-nowrap">Last Vendor</TableHead>
            <TableHead className="whitespace-nowrap">Last Purchase Date</TableHead>
            <TableHead className="whitespace-nowrap">Last Change Date</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Qty</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Unit</TableHead>
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap hidden md:table-cell">Brand</TableHead>}
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap hidden md:table-cell">Vendor</TableHead>}
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap hidden md:table-cell">Cost/Unit</TableHead>}
            <TableHead className="whitespace-nowrap hidden md:table-cell">Note</TableHead>
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap hidden md:table-cell">Office Note</TableHead>}
            <TableHead className="whitespace-nowrap hidden md:table-cell">Date Purchased</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Date Sent To Factory</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Date Received By Factory</TableHead>
            <TableHead className="whitespace-nowrap">MRR number</TableHead>
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
            {orderedParts.map((orderedPart,index) => (                                        
                <OrderedPartRow key={orderedPart.id}
              index={index + 1}
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

        <div>
          <h2 className="text-lg font-bold">Parts Ordered</h2>
          <p>The list of parts that were ordered.</p>
        <Table className="">
          <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Part</TableHead>
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead>Brand</TableHead>}
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead>Vendor</TableHead>}
            <TableHead>Qty(Unit)</TableHead>
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead>Cost/Unit</TableHead>}
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead>Subtotal</TableHead>}
          </TableRow>
          </TableHeader>
          {loadingTable? (
            <div className='flex flex-row justify-center'>
                <Loader2 className='h-8 w-8 animate-spin'/>
            </div>
          ):
            <TableBody>
            {orderedParts.map((orderedPart,index) => (                                        
                <OrderedPartRow key={orderedPart.id}
              index={index+1}
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
              <TableCell></TableCell>
            </TableRow>
            </TableBody>
          }  
        </Table>
        {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <div className="flex justify-end">
          <span className="font-bold">Total: {totalCost}</span>
        </div>}
        </div>
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
            <Button disabled={loadingTableButtons} onClick={()=>setisApproveAllFactoryDialogOpen(true)}>{loadingTableButtons? "Approving...": "Approve all pending parts"}</Button>
          )}
          {showOfficeOrderApproveButton(current_status.name,false) && (
            <Button disabled={loadingTableButtons} onClick={()=>setisApproveAllOfficeDialogOpen(true)}>{loadingTableButtons? "Approving...": "Approve all parts"}</Button>
          )}
          {showAllBudgetApproveButton(current_status.name, orderedParts) && (
            <Button disabled={loadingTableButtons} onClick={()=>setApproveAllBudgetDialogOpen(true)}>{loadingTableButtons? "Approving...": "Approve all budgets"}</Button>
          )}
          {showAddPartButton(current_status.name) && (
            <Button className="bg-blue-700" disabled={loadingAddPart} onClick={()=>setIsAddPartDialogOpen(true)}>{loadingAddPart? "Adding...": "Add Part"}</Button>
          )}
          {
            showAdvanceButton && 
            <Button disabled={loadingTableButtons} className="bg-green-700" onClick={()=>setIsAdvanceDialogOpen(true)}><Flag/>Advance</Button>
          }
          {
            showRevertButton && 
            <Button disabled={loadingTableButtons} className="bg-orange-600" onClick={()=>setIsRevertDialogOpen(true)}><FlagOff/>Revert to Quotation</Button>
          }
        </div>
        <Table>
        <TableHeader>
        <TableRow>
            <TableHead></TableHead>
            <TableHead className="whitespace-nowrap">Actions</TableHead>
            <TableHead className="whitespace-nowrap">Part</TableHead>
            <TableHead className="whitespace-nowrap">In Storage</TableHead>
            <TableHead className="whitespace-nowrap">Taken from storage</TableHead>
            <TableHead className="whitespace-nowrap">Current Storage Qty</TableHead>
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap">Last Cost/Unit</TableHead>}
            <TableHead className="whitespace-nowrap">Last Vendor</TableHead>
            <TableHead className="whitespace-nowrap">Last Purchase Date</TableHead>
            <TableHead className="whitespace-nowrap">Last Change Date</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Qty</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Unit</TableHead>
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap hidden md:table-cell">Brand</TableHead>}
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap hidden md:table-cell">Vendor</TableHead>}
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap hidden md:table-cell">Cost/Unit</TableHead>}
            <TableHead className="whitespace-nowrap hidden md:table-cell">Note</TableHead>
            {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableHead className="whitespace-nowrap hidden md:table-cell">Office Note</TableHead>}
            <TableHead className="whitespace-nowrap hidden md:table-cell">Date Purchased</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Date Sent To Factory</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Date Received By Factory</TableHead>
            <TableHead className="whitespace-nowrap">MRR number</TableHead>
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
            {orderedParts.map((orderedPart,index) => (                                        
                <OrderedPartRow key={orderedPart.id}
              index={index+1}
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
      
      
      <Dialog open={isAdvanceDialogOpen} onOpenChange={setIsAdvanceDialogOpen}>
        <DialogContent>
          <DialogTitle>
           Advancing Order Status
          </DialogTitle>
          <DialogDescription>
            <p className="text-sm text-muted-foreground">
              You can now advance this order to next status. Please confirm if you would like to advance.
            </p>
          </DialogDescription>
          <Button onClick={handleAdvanceOrderStatus}>Confirm</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
        <DialogContent>
          <DialogTitle>
           Reverting Order Status 
          </DialogTitle>
          <DialogDescription>
            <p className="text-sm text-muted-foreground">
              You can now revert this order to previous status. Please confirm if you would like to revert.
            </p>
          </DialogDescription>
          <Button onClick={handleRevertOrderStatus}>Confirm</Button>
        </DialogContent>
      </Dialog>
      <Dialog open={isAddPartDialogOpen} onOpenChange={setIsAddPartDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-blue-700">Add Part + </DialogTitle>
              <DialogDescription>
                <div>
                    {/* Left side: Part Selection */}
                    <div className="space-y-4">
                        <div className="mt-2">
                            <Label htmlFor="partId">Select Part</Label>
                            <ReactSelect
                                id="partId"
                                options={parts.filter((part) =>
                                        part.name.toLowerCase().includes(searchQueryParts.toLowerCase())
                                    )
                                    .sort((a, b) => a.name.localeCompare(b.name)) // Sort parts alphabetically
                                    .map((part) => ({
                                        value: part.id,
                                        label: `${part.name} (${part.unit || 'units'})`,
                                        isDisabled: orderedParts.some((p) => p.part_id === part.id), // Disable parts already added
                                    }))}
                                onChange={(selectedOption) =>
                                    handleSelectPart(Number(selectedOption?.value))

                                }
                                isSearchable
                                placeholder="Search or Select a Part"
                                value={selectedPartId > 0 ? { value: selectedPartId, label: parts.find(p => p.id === selectedPartId)?.name } : null}
                                className="w-[260px]"

                            />
                        </div>

                        {/* Setting QTY */}
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="quantity" className="font-medium"> {`Quantity${selectedPartId !== -1 ? ` in ${parts.find((p) => p.id === selectedPartId)?.unit || ''}` : ''}`}</Label>
                            <input
                                id="quantity"
                                type="number"
                                value={selectedPartQty >= 0 ? selectedPartQty : ''}
                                onChange={e => setSelectedPartQty(Number(e.target.value))}
                                placeholder={
                                  selectedPartId !== -1
                                        ? `Enter quantity in ${parts.find((p) => p.id === selectedPartId)?.unit || 'units'}`
                                        : 'Enter quantity'
                                }
                                className="input input-bordered w-[220px] max-w-xs p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>



                        {/* Sample Sent to Office */}
                        <div className="flex items-center gap-2 leading-none">
                            <label
                                htmlFor="sampleSentToOffice"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Is Sample Sent to Office?
                            </label>
                            <Checkbox
                                id="sampleSentToOffice"
                                checked={isSampleSentToOffice}
                                onCheckedChange={(checked) => setIsSampleSentToOffice(checked === true)}
                                className="h-5 w-5 border-gray-300 rounded focus:ring-gray-500 checked:bg-gray-600 checked:border-transparent"
                                />
                            <p className="text-sm text-muted-foreground">
                                {isSampleSentToOffice ? "Yes" : "No"}
                            </p>
                        </div>


                        {/* Note */}
                        <div className="space-y-2">
                            <Label htmlFor="note" className="font-medium">Note (Optional)</Label>
                            <Textarea
                                id="note"
                                value={selectedPartNote || ''}
                                onChange={e => setSelectedPartNote(e.target.value)}
                                placeholder="Enter any notes"
                                className="min-h-24 w-3/4"  
                            />
                        </div>
                    </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button className="bg-blue-700" onClick={handleAddPart}>Confirm</Button>
              <Button className="bg-red-800" onClick={resetAddPart}>Reset</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
      </Card>

      
      
    )
  }
  
}

export default OrderedPartsTable