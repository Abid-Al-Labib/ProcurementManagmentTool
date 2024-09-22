import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { TableCell, TableRow } from "../ui/table"
import { Button } from "../ui/button"
import { ExternalLink, MoreHorizontal, Notebook, NotebookPen,  } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { useEffect, useState } from "react"
import { Calendar } from "../ui/calendar"
import { OrderedPart, Status } from "@/types"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import toast from "react-hot-toast"
import { deleteOrderedPartByID, fetchLastCostAndPurchaseDate, updateApprovedBudgetByID, updateApprovedOfficeOrderByID, updateApprovedPendingOrderByID, updateApprovedStorageWithdrawalByID, updateCostingByID, updateOfficeNoteByID, updatePurchasedDateByID, updateReceivedByFactoryDateByID, updateSampleReceivedByID, updateSentDateByID } from "@/services/OrderedPartsService"
import { showBudgetApproveButton, showPendingOrderApproveButton, showOfficeOrderApproveButton, showOfficeOrderDenyButton, showPurchaseButton, showQuotationButton, showReceivedButton, showSampleReceivedButton, showSentButton, showReviseBudgetButton, showOfficeNoteButton, showApproveTakingFromStorageButton } from "@/services/ButtonVisibilityHelper"
import OrderedPartInfo from "./OrderedPartInfo"
import { convertUtcToBDTime } from "@/services/helper"
import { UpdateStatusByID } from "@/services/OrdersService"
import { Checkbox } from "../ui/checkbox"
import { useNavigate } from "react-router-dom"
import { InsertStatusTracker } from "@/services/StatusTrackerService"
import { Textarea } from "../ui/textarea"
import { fetchStoragePartQuantityByFactoryID, upsertStoragePart, addStoragePartQty } from "@/services/StorageService"
import { addMachinePartQty } from "@/services/MachinePartsService"
import { setMachineIsRunning } from "@/services/MachineServices"


interface OrderedPartRowProp{
    mode: 'view' | 'manage',
    orderedPartInfo: OrderedPart,
    current_status: Status,
    factory_id: number
    machine_id: number,
    order_type: string,
    onOrderedPartUpdate: () => void
}

export const OrderedPartRow:React.FC<OrderedPartRowProp> = ({mode, orderedPartInfo, current_status, factory_id, machine_id, order_type, onOrderedPartUpdate}) => {
  const [datePurchased, setDatePurchased] = useState<Date | undefined>(orderedPartInfo.part_purchased_date? new Date(orderedPartInfo.part_purchased_date): new Date())
  const [dateSent, setDateSent] = useState<Date | undefined>(orderedPartInfo.part_sent_by_office_date? new Date(orderedPartInfo.part_sent_by_office_date): new Date())
  const [dateReceived, setDateReceived] = useState<Date | undefined>(orderedPartInfo.part_received_by_factory_date? new Date(orderedPartInfo.part_received_by_factory_date): new Date())
  
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isApproveFromOfficeDialogOpen, setIsApproveFromOfficeDialogOpen] = useState(false);
  const [isApproveFromFactoryDialogOpen, setIsApproveFromFactoryDialogOpen] = useState(false);
  const [isApproveBudgetDialogOpen, setIsApproveBudgetDialogOpen] = useState(false);
  const [isSampleReceivedDialogOpen, setIsSampleReceivedDialogOpen] = useState(false);
  const [isPurchasedDialogOpen, setIsPurchasedDialogOpen] = useState(false);
  const [isSentDialogOpen, setIsSentDialogOpen] = useState(false);
  const [isReceivedDialogOpen, setIsReceivedDialogOpen] = useState(false);
  const [isCostingDialogOpen,setIsCostingDialogOpen] = useState(false);
  const [isReviseBudgetDialogOpen, setIsReviseBudgetDialogOpen] = useState(false);
  const [isOfficeNoteDialogOpen, setIsOfficeNoteDialogOpen] = useState(false);
  const [isTakeFromStorageDialogOpen, setIsTakeFromStorageDialogOpen] = useState(false);
  const [isDenyDialogOpen, setIsDenyDialogOpen] = useState(false);
  const [vendor, setVendor] = useState(orderedPartInfo.vendor || '');
  const [brand, setBrand] = useState(orderedPartInfo.brand || '')
  const [unitCost, setUnitCost] = useState(orderedPartInfo.unit_cost || '');
  const [costLoading, setCostLoading] = useState(false);
  const [lastUnitCost, setLastUnitCost] = useState<number | null>(null);
  const [lastPurchaseDate, setLastPurchaseDate] = useState<string | null>(null); // assuming date is string
  const [denyCost, setDenyCost] = useState(false);
  const [denyBrand, setDenyBrand] = useState(false);
  const [denyVendor, setDenyVendor] = useState(false);
  const [showDenyBudgetPopup, setShowDenyBudgetPopup] = useState(false);
  const [noteValue, setNoteValue] = useState<string>('');
  const navigate = useNavigate()
  const [disableTakeStorageRow, setDisableTakeStorageRow] = useState(false);
  const handleNavigation = () => {
    navigate('/orders'); 
  };
  // useEffect to fetch most recent cost and purchase date
  useEffect(() => {
      const fetchData = async () => {
          if (mode=="manage")
          {
            const disableRow = orderedPartInfo.in_storage && orderedPartInfo.approved_storage_withdrawal && (current_status.name!=="Parts Sent To Factory")
            setDisableTakeStorageRow(disableRow)
            if (order_type === "Machine")
            {
              const result = await fetchLastCostAndPurchaseDate(machine_id, orderedPartInfo.part_id);
              if (result) {
                setLastUnitCost(result.unit_cost);
                setLastPurchaseDate(result.part_purchase_date);
            }
            }
          }
      };

      fetchData(); // Trigger the fetch when component mounts or dependencies change
  }, [machine_id, orderedPartInfo.part_id]);

  const handleApproveFactory = () => {
    console.log("Factory Approve action triggered");
    const approvePartFromFactory = async() => {
      try {
        await updateApprovedPendingOrderByID(orderedPartInfo.id,true)
        toast.success("Ordered part has been approved!");
        onOrderedPartUpdate();
      } catch (error) {
        toast.error("Error occured could not complete action");
      }
    };
    approvePartFromFactory();
    setIsApproveFromFactoryDialogOpen(false);
    setIsActionMenuOpen(false);
    handleMachineIsRunningHelper(false);
  }

  const handleApproveTakingFromStorage = () => {
    // console.log(`Headoffice approves taking ${orderedPartInfo.qty} from storage`)
    const takeFromStorage = async() => {
      try {
        const storage_data = await fetchStoragePartQuantityByFactoryID(orderedPartInfo.part_id, factory_id)
        console.log(storage_data)
        if (storage_data)
        {
          if (storage_data.length>0)
          {
            const new_current_storage_quantity = storage_data[0].qty - orderedPartInfo.qty
            await upsertStoragePart(orderedPartInfo.part_id,factory_id,new_current_storage_quantity)
            console.log("updated storage qty")
            await updateSentDateByID(orderedPartInfo.id, new Date())
            console.log("updated sent date")
            await updateApprovedStorageWithdrawalByID(orderedPartInfo.id, true)
            console.log("approved taking from storage")
            onOrderedPartUpdate();
          }
          else {
            console.log(`no data found for partid ${orderedPartInfo.part_id} in factoryid ${factory_id}`)
            return null
          }
        }
      } catch (error) {
        toast.error("Error occured while fetching storage data")
      }
    };

    takeFromStorage()
    setDisableTakeStorageRow(true)
    setIsTakeFromStorageDialogOpen(false)
    setIsActionMenuOpen(false);
  }

  const handleApproveOffice = () => {
    console.log("Office Approve action triggered");
    const approvePartFromOffice = async() => {
      try {
        await updateApprovedOfficeOrderByID(orderedPartInfo.id,true)
        toast.success("Ordered part has been approved!");
        onOrderedPartUpdate();
      } catch (error) {
        toast.error("Error occured could  not complete action");
      }
    };
    approvePartFromOffice();
    setIsApproveFromOfficeDialogOpen(false);
    setIsActionMenuOpen(false);
  };

  const handleApproveBudget = () => {
    console.log("Approve Budget action triggered");
    const approveBudget = async() => {
      try {
        await updateApprovedBudgetByID(orderedPartInfo.id, true);
        toast.success("The budget for this part has been approved!");
        onOrderedPartUpdate();
      } catch (error) {
        toast.error("Error occured could not complete action");
      }
    };
    approveBudget();
    setIsApproveBudgetDialogOpen(false);
    setIsActionMenuOpen(false);
  };

  const handleAddOfficeNote = () => {
    console.log("adding office note");
    
    const addOfficeNote = async (updated_note: string) => {
      try {
        await updateOfficeNoteByID(orderedPartInfo.id, updated_note);
        toast.success("Your note has been added");
        onOrderedPartUpdate();
      } catch (error) {
        toast.error("Something went wrong when adding note");
      }
    };

    if (!(noteValue.trim().length>0)) {
      toast.error("Cannot submit empty message")
      return
    } 

    let updated_note: string = orderedPartInfo.office_note || '';
    if (orderedPartInfo.office_note === null) {
      updated_note = updated_note + "Name" + ": " + noteValue.trim(); 
    } else {
      updated_note = updated_note + "\n" + "Name" + ": " + noteValue.trim(); 
    }
    addOfficeNote(updated_note);
    setNoteValue(''); 
    setIsOfficeNoteDialogOpen(false)
    setIsActionMenuOpen(false);
  };


  const handleDenyPart = () => {
    console.log("Deny action triggered");
    const deletingPart = async() => {
      try {
        await deleteOrderedPartByID(orderedPartInfo.id)
        toast.success("Successfully removed this part from the order");
        onOrderedPartUpdate();
      } catch (error) {
        toast.error("Error occured could not complete action");
      }
    };
    deletingPart();
    setIsDenyDialogOpen(false)
    setIsActionMenuOpen(false);
  };

  const handleReviseBudget = () => {
    console.log("Denying budget");
    const revertingStatus = async() => {
      try {
        const prevStatus = (current_status.id-1)
        await UpdateStatusByID(orderedPartInfo.order_id, prevStatus)
        await InsertStatusTracker((new Date()), orderedPartInfo.order_id, 1, prevStatus)
        toast.success("Successfully reverted status")
        onOrderedPartUpdate();
      } catch (error) {
        toast.error("Error occured while reverting status")
      }
    };
   

    const updateCosting = async(brand: string | null, cost:number | null, vendor: string | null) => {
      try {
        setCostLoading(true);
        await updateCostingByID(orderedPartInfo.id, brand, cost, vendor )
        toast.success("Budget has been submitted for revision")
        onOrderedPartUpdate();
      } catch (error) {
        toast.error("Error occured could not complete action");
      }
      finally {
        setCostLoading(false);
      }
    }
    
    if(denyBrand || denyCost || denyVendor){
      const newBrand = denyBrand? null : brand;
      const currentCost = typeof unitCost === 'string' ? parseFloat(unitCost) : unitCost;
      const newCost = denyCost? null : currentCost
      const newVendor = denyVendor? null : vendor;
      
      updateCosting(newBrand,newCost,newVendor)
      revertingStatus();
      setIsReviseBudgetDialogOpen(false)
      setShowDenyBudgetPopup(true)
    }
    else{
      toast.error("You have not selected any category to deny.")
    }
  }

  const handleUpdateCosting = () => {
    const updateCosting = async(brand:string, cost:number, vendor: string) => {
      try {
        setCostLoading(true);
        await updateCostingByID(orderedPartInfo.id, brand.trim(), cost, vendor.trim() )
        toast.success("Costing for this part is submitted")
        onOrderedPartUpdate();
      } catch (error) {
        toast.error("Error occured could not complete action");
      }
      finally {
        setCostLoading(false);
      }
    }

    if (!(vendor.trim().length>0) || !unitCost || !(brand.trim().length>0)) {
      toast.error('Please fill in all information');
      return;
    }

    const numericUnitCost = typeof unitCost === 'string' ? parseFloat(unitCost) : unitCost;
    if (isNaN(numericUnitCost) || numericUnitCost < 0) {
      toast.error('Cost/Unit cannot be negative or invalid.');
      return;
    }
    
    updateCosting(brand,numericUnitCost,vendor)
    setBrand('')
    setVendor('');
    setUnitCost('');
    setIsCostingDialogOpen(false);
    setIsActionMenuOpen(false);
  };

  const handleUpdatePurchaseDate = () => {
    console.log("Updating purchase date" + datePurchased);
    const updatePurchaseDate = async() => {
      if (datePurchased){
        try {
          await updatePurchasedDateByID(orderedPartInfo.id, datePurchased)
          toast.success("Part purchased date set!")
          onOrderedPartUpdate();
        } catch (error) {
          toast.error("Error occured could not complete action");
        }
      }
      else{
        toast.error("Part purchase date was not found")
      }
    };

    updatePurchaseDate();
    setIsPurchasedDialogOpen(false);
    setIsActionMenuOpen(false);
  }

  const handleUpdateSentDate = () => {
    console.log("Updating sent date with" + dateSent);
    const updateSentDate = async() => {
      if(dateSent && datePurchased){
        if (dateSent.getDate()>=datePurchased.getDate()){
          try {
            await updateSentDateByID(orderedPartInfo.id, dateSent)
            toast.success("Part sent to office date set!")
            onOrderedPartUpdate();
          } catch (error) {
            toast.error("Error occured could not complete action");
          } 
        }
        else{
          toast.error("Date sent must be after date purchased")
        }
        
      }
      else{
        toast.error("Sent date was not found")
      } 

    }

    updateSentDate();
    setIsSentDialogOpen(false);
    setIsActionMenuOpen(false);
  }
  

  const handleUpdateReceivedDate = () => {
    console.log("Updating received date" + dateReceived);
    const updateReceivedDate = async() => {
      if(dateReceived && dateSent){
        if (dateReceived.getDate()>=dateSent.getDate()){
          try {
            await updateReceivedByFactoryDateByID(orderedPartInfo.id, dateReceived)
            //if order type storage
            toast.success("Part received by factory date set!")
            handleUpdateDatabase();
            onOrderedPartUpdate();
          } catch (error) {
            toast.error("Error occured could not complete action");
          } 
        }
        else{
          toast.error("Received date must be after sent date")
        }

      }
      else{
        toast.error("Received date was not found")
      }
    }
    updateReceivedDate();
    handleMachineIsRunningHelper(true);
    setIsReceivedDialogOpen(false);
    setIsActionMenuOpen(false);
  }


  const handleUpdateDatabase = () => {
    if (order_type=="Storage"){
      addStoragePartQty(orderedPartInfo.part_id,factory_id,orderedPartInfo.qty);
    }
    if (order_type == "Machine") {
      addMachinePartQty(machine_id, orderedPartInfo.part_id, orderedPartInfo.qty);
    }
  }

  const handleSampleReceived = () => {
    console.log("Sample received")
    const updateSampleReceived = async () => {
      try {
        await updateSampleReceivedByID(orderedPartInfo.id, true);
        toast.success("Updated sample received status")
        onOrderedPartUpdate();
      } catch (error) {
        toast.error("Error occured could not complete action");
      }
    };
    updateSampleReceived();
    setIsSampleReceivedDialogOpen(false);
    setIsActionMenuOpen(false);
  }

  const handleMachineIsRunningHelper = (flag:boolean) => {
    console.log("In handleMachineIsRunning");
    if(order_type==="Machine"){
      setMachineIsRunning(machine_id, flag);
    }
  }

  if(mode==='view'){
    return (
      <TableRow>
        <TableCell className="whitespace-nowrap"><a className="hover:underline" target="_blank" href={`/viewpart/${orderedPartInfo.part_id}`}>{orderedPartInfo.parts.name}</a></TableCell>
        <TableCell className="whitespace-nowrap">{orderedPartInfo.in_storage? "Yes" : "No"}</TableCell>
        <TableCell className="whitespace-nowrap">{orderedPartInfo.approved_storage_withdrawal? "Yes" : "No"}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.qty}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.brand || '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.vendor || '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.unit_cost || '-'}</TableCell>
        <TableCell className="hidden md:table-cell">
          {
            orderedPartInfo.note?
            (
              <Dialog>
                <DialogTrigger asChild>
                  <Notebook className="hover:cursor-pointer"/>
                </DialogTrigger>
                  <DialogContent>
                    <div>{orderedPartInfo.note}</div>    
                  </DialogContent>
              </Dialog>
            ) : '-'
          }
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {
            orderedPartInfo.office_note?
            ( <Dialog>
                <DialogTrigger asChild>
                  <NotebookPen className="hover:cursor-pointer"/>
                </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>Office Note</DialogTitle>
                    {orderedPartInfo.office_note.split('\n').map((line, index) => (
                    <p key={index}>
                      {line}
                    </p>
                   ))}
                  </DialogContent>
              </Dialog>
            ) : '-'
          }
        </TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.part_purchased_date? convertUtcToBDTime(orderedPartInfo.part_purchased_date) : '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.part_sent_by_office_date? convertUtcToBDTime(orderedPartInfo.part_sent_by_office_date) : '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.part_received_by_factory_date? convertUtcToBDTime(orderedPartInfo.part_received_by_factory_date) : '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.is_sample_sent_to_office? 'Yes': 'No'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.is_sample_received_by_office? 'Yes': 'No'}</TableCell>

        <TableCell className="md:hidden">
            <Dialog>
              <DialogTrigger asChild>
                <ExternalLink className="hover:cursor-pointer"/>
              </DialogTrigger>
                <DialogContent className="">
                  <OrderedPartInfo 
                    orderedPart={orderedPartInfo}                
                  />    
                </DialogContent>
            </Dialog>
        </TableCell>
    </TableRow>
    )
  }
  else if(mode==="manage"){
    return(
        <TableRow className={`${
          disableTakeStorageRow ? 'bg-gray-300 pointer-events-none' : ''
        } transition duration-200 ease-in-out`}>
        <TableCell className="whitespace-nowrap"><a className="hover:underline" target="_blank" href={`/viewpart/${orderedPartInfo.part_id}`}>{orderedPartInfo.parts.name}</a></TableCell>
        <TableCell className="whitespace-nowrap">{orderedPartInfo.in_storage? "Yes" : "No"}</TableCell>
        <TableCell className="whitespace-nowrap">{orderedPartInfo.approved_storage_withdrawal? "Yes" : "No"}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{lastUnitCost?`BDT ${lastUnitCost}` : '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{lastPurchaseDate? convertUtcToBDTime(lastPurchaseDate): '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.qty}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.brand || '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.vendor || '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.unit_cost || '-'}</TableCell>
        <TableCell className="hidden md:table-cell">
          {
            orderedPartInfo.note?
            (
              <Dialog>
                <DialogTrigger asChild>
                  <Notebook className="hover:cursor-pointer"/>
                </DialogTrigger>
                  <DialogContent>
                    <div>{orderedPartInfo.note}</div>    
                  </DialogContent>
              </Dialog>
            ) : '-'
          }
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {
            orderedPartInfo.office_note?
            ( <Dialog>
                <DialogTrigger asChild>
                  <NotebookPen className="hover:cursor-pointer"/>
                </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>Office Note</DialogTitle>
                    {orderedPartInfo.office_note.split('\n').map((line, index) => (
                    <p key={index}>
                      {line}
                    </p>
                   ))}
                  </DialogContent>
              </Dialog>
            ) : '-'
          }
        </TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.part_purchased_date? convertUtcToBDTime(orderedPartInfo.part_purchased_date) : '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.part_sent_by_office_date? convertUtcToBDTime(orderedPartInfo.part_sent_by_office_date) : '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.part_received_by_factory_date? convertUtcToBDTime(orderedPartInfo.part_received_by_factory_date) : '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.is_sample_sent_to_office? 'Yes': 'No'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.is_sample_received_by_office? 'Yes': 'No'}</TableCell>
        <TableCell className="md:hidden">
            <Dialog>
              <DialogTrigger asChild>
                <ExternalLink className="hover:cursor-pointer"/>
              </DialogTrigger>
                <DialogContent className="">
                  <OrderedPartInfo 
                    orderedPart={orderedPartInfo}                
                  />    
                </DialogContent>
            </Dialog>
        </TableCell>
          <TableCell>
          <DropdownMenu open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                aria-haspopup="true"
                size="icon"
                variant="ghost"
                onClick={()=>setIsActionMenuOpen(true)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="grid-cols-1"align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                { 
                  showOfficeOrderApproveButton(current_status.name, orderedPartInfo.approved_office_order) && (
                    <DropdownMenuItem onClick={() => setIsApproveFromOfficeDialogOpen(true)}>
                      <span className="hover:text-green-600">Approve from Office</span>
                    </DropdownMenuItem>
                )}
                { 
                  showPendingOrderApproveButton(current_status.name, orderedPartInfo.approved_pending_order) && (
                    <DropdownMenuItem onClick={() => setIsApproveFromFactoryDialogOpen(true)}>
                      <span className="hover:text-green-600">Approve from Factory</span>
                    </DropdownMenuItem>
                )}
                {
                  showApproveTakingFromStorageButton(current_status.name,orderedPartInfo.in_storage,orderedPartInfo.approved_storage_withdrawal) && (
                    <DropdownMenuItem onClick={()=>setIsTakeFromStorageDialogOpen(true)}>
                      <span className="hover:text-green-600">Take from storage</span>
                    </DropdownMenuItem>
                )}

                { 
                  showBudgetApproveButton(current_status.name, orderedPartInfo.approved_budget) && (
                    <DropdownMenuItem onClick={() => setIsApproveBudgetDialogOpen(true)}>
                      <span className="hover:text-green-600">Approve Budget</span>
                    </DropdownMenuItem>
                )}
                { 
                  showReviseBudgetButton(current_status.name, orderedPartInfo.approved_budget) && (
                    <DropdownMenuItem onClick={()=>setIsReviseBudgetDialogOpen(true)}  >
                      <span className="hover:text-red-600">Revise Budget</span>
                    </DropdownMenuItem>
                )}
                {
                  showOfficeOrderDenyButton(current_status.name) && (                
                    <DropdownMenuItem onClick={()=>setIsDenyDialogOpen(true)}>
                      <span className="hover:text-red-600">Deny Part</span>
                    </DropdownMenuItem>
                )}
                {
                  showOfficeNoteButton(current_status.name) && (
                    <DropdownMenuItem onClick={()=>setIsOfficeNoteDialogOpen(true)}>
                      <span>Add Office Note</span>
                    </DropdownMenuItem>
                )}
                {
                  showQuotationButton(current_status.name,orderedPartInfo.brand,orderedPartInfo.vendor,orderedPartInfo.unit_cost) && (                
                    <DropdownMenuItem onClick={()=>setIsCostingDialogOpen(true)}>
                      <span>Add Quotation</span>
                    </DropdownMenuItem>
                )}
                {
                  showPurchaseButton(current_status.name,orderedPartInfo.part_purchased_date) && (
                    <DropdownMenuItem onClick={()=>setIsPurchasedDialogOpen(true)}>
                      <span>Set Purchase Date</span>
                    </DropdownMenuItem>
                )}
                {
                  showSentButton(current_status.name, orderedPartInfo.part_sent_by_office_date) && (
                    <DropdownMenuItem onClick={()=> setIsSentDialogOpen(true)}>
                      <span>Set Sent Date</span>
                    </DropdownMenuItem>
                )}
                {
                  showReceivedButton(current_status.name, orderedPartInfo.part_received_by_factory_date) && (
                    <DropdownMenuItem onClick={() => setIsReceivedDialogOpen(true)}>
                      <span>Set Received Date</span>
                    </DropdownMenuItem>
                )}
                {
                  showSampleReceivedButton(orderedPartInfo.is_sample_sent_to_office,orderedPartInfo.is_sample_received_by_office) && (
                    <DropdownMenuItem onClick={() => setIsSampleReceivedDialogOpen(true)}>
                      <span>Receive Sample</span>
                    </DropdownMenuItem>
                )}

            </DropdownMenuContent>
          </DropdownMenu>
          </TableCell>
            <Dialog open={showDenyBudgetPopup} onOpenChange={handleNavigation}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-red-600">Budget has been sent back for revision</DialogTitle>
                  <DialogDescription>
                    <p>Order status is reverted.</p>
                    <p>You will be moved back to orders page.</p>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button onClick={handleNavigation}>OK</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isSampleReceivedDialogOpen} onOpenChange={setIsSampleReceivedDialogOpen}>
              <DialogContent>
                <DialogTitle>
                  Receive Sample
                </DialogTitle>
                <DialogDescription>
                  <p className="text-sm text-muted-foreground">
                    Confirming that the sample has been received at head office.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Is the sample received?
                  </p>
                </DialogDescription>
        
                <Button onClick={handleSampleReceived}>Confirm</Button>
              </DialogContent>
            </Dialog>
            <Dialog open={isReceivedDialogOpen} onOpenChange={setIsReceivedDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogTitle>Date when part was received at Factory</DialogTitle>
                <Calendar
                  mode="single"
                  selected={dateReceived}
                  onSelect={setDateReceived}
                  className="rounded-md border"
                />
                <Button onClick={handleUpdateReceivedDate}>Confirm</Button>
              </DialogContent>
            </Dialog>
            <Dialog open={isSentDialogOpen} onOpenChange={setIsSentDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                  <DialogTitle>
                    Date when part was sent to factory
                  </DialogTitle>
                  <Calendar
                    mode="single"
                    selected={dateSent}
                    onSelect={setDateSent}
                    className="rounded-md border"
                  />
                  <Button onClick={handleUpdateSentDate}>Confirm</Button>
              </DialogContent>
            </Dialog>
            <Dialog open={isPurchasedDialogOpen} onOpenChange={setIsPurchasedDialogOpen}>
                  <DialogContent className="sm:max-w-[425px]">
                      <DialogTitle>
                        Date when part was purchased
                      </DialogTitle>
                      <Calendar
                        mode="single"
                        selected={datePurchased}
                        onSelect={setDatePurchased}
                        className="rounded-md border"
                      />
                      <Button onClick={handleUpdatePurchaseDate}>Confirm</Button>
                  </DialogContent>
              </Dialog>
              <Dialog open={isCostingDialogOpen} onOpenChange={setIsCostingDialogOpen} >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogTitle>
                      Update Costing
                    </DialogTitle>
                    <fieldset className="grid gap-6 rounded-lg border p-4">
                      <div className="grid gap-3">
                        <Label htmlFor="brand">Brand</Label>
                        <Input 
                          id="brand" 
                          type="text" 
                          value={brand}
                          placeholder="Enter brand name"
                          onChange={(e) => setBrand(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor="vendor">Vendor</Label>
                        <Input 
                          id="vendor" 
                          type="text" 
                          value={vendor}
                          placeholder="Enter vendor name"
                          onChange={(e) => setVendor(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor="unit_cost">Cost/Unit</Label>
                        <Input 
                          id="unit_cost" 
                          type="number"
                          value={unitCost} 
                          placeholder="Enter the unit cost" 
                          onChange={(e) => setUnitCost(e.target.value)}
                          />
                    </div>
                    </fieldset>
                    <Button onClick={handleUpdateCosting} disabled={costLoading}>
                      {costLoading ? "Updating..." : "Confirm"}
                    </Button>
                </DialogContent>
              </Dialog>

              <Dialog open={isOfficeNoteDialogOpen} onOpenChange={setIsOfficeNoteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogTitle>
                    Office Note
                  </DialogTitle>
                  <div className="grid w-full gap-2">
                    <Label htmlFor="officeNote">Add you note here</Label>
                    <Textarea
                      placeholder="Type your note here."
                      id="officeNote"
                      value={noteValue} // Bind the text area value to the state
                      onChange={(e) => setNoteValue(e.target.value)} // Update state on text change
                    />
                    <p className="text-sm text-muted-foreground">
                      This note is only visible to head office
                    </p>
                  </div>
                  <Button onClick={handleAddOfficeNote}>Submit</Button>
                </DialogContent>
              </Dialog>

              <Dialog open={isDenyDialogOpen} onOpenChange={setIsDenyDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                        <DialogTitle className="text-red-600">Deny Part</DialogTitle>
                        <div>
                          Are you sure you want to deny this part?
                          <br />
                          It will be removed from this order.
                        </div>
                        <Button onClick={handleDenyPart}>Confirm</Button>
                </DialogContent>
              </Dialog>

              <Dialog open={isReviseBudgetDialogOpen} onOpenChange={setIsReviseBudgetDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogTitle className="text-red-600">Revise Budget</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                          Checking a box will deny that category
                        </p>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="checkDenyBrand"
                            checked={denyBrand}
                            onCheckedChange={(checked) => setDenyBrand(!!checked)} 
                          />
                          <label
                            htmlFor="checkDenyBrand"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Deny Brand
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="checkDenyVendor"
                            checked={denyVendor}
                            onCheckedChange={(checked) => setDenyVendor(!!checked)} 
                          />
                          <label
                            htmlFor="checkDenyVendor"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Deny Vendor
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="checkDenyCost"
                            checked={denyCost}
                            onCheckedChange={(checked) => setDenyCost(!!checked)}  
                          />
                          <label
                            htmlFor="checkDenyCost"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Deny Unit Cost
                          </label>
                          </div>
                        <Button onClick={handleReviseBudget}>Confirm</Button>
                </DialogContent>
              </Dialog>

              <Dialog open={isApproveBudgetDialogOpen} onOpenChange={setIsApproveBudgetDialogOpen}>
                <DialogContent>
                  <DialogTitle>
                    Budget Approval
                  </DialogTitle>
                  <DialogDescription>
                    <p className="text-sm text-muted-foreground">
                      Only approve if you are satisfied with the whole quotation.
                      Approving cannot be undone and the values will be permanently saved.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Do you Approve?
                    </p>
                  </DialogDescription>
          
                  <Button onClick={handleApproveBudget}>Approve</Button>
                </DialogContent>
              </Dialog>

              <Dialog open={isTakeFromStorageDialogOpen} onOpenChange={setIsTakeFromStorageDialogOpen}>
                <DialogContent>
                  <DialogTitle>
                    Take from storage Approval
                  </DialogTitle>
                  <DialogDescription>
                    <p className="text-sm text-muted-foreground">
                        This item exists in storage. Approving this action will adjust storage quantity and cannot be undone.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Do you Approve?
                    </p>
                  </DialogDescription>
                  <Button onClick={handleApproveTakingFromStorage}>Approve</Button>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isApproveFromFactoryDialogOpen} onOpenChange={setIsApproveFromFactoryDialogOpen}>
                <DialogContent>
                  <DialogTitle>
                    Approval From Factory
                  </DialogTitle>
                  <DialogDescription>
                    <p className="text-sm text-muted-foreground">
                      Are you sure you want to approve this part?
                    </p>
                  </DialogDescription>
                  <Button onClick={handleApproveFactory}>Approve</Button>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isApproveFromOfficeDialogOpen} onOpenChange={setIsApproveFromOfficeDialogOpen}>
                <DialogContent>
                  <DialogTitle>
                    Approval from Office
                  </DialogTitle>
                  <DialogDescription>
                    <p className="text-sm text-muted-foreground">
                      Are you sure you want to approve this part?
                    </p>
                  </DialogDescription>
          
                  <Button onClick={handleApproveOffice}>Approve</Button>
                </DialogContent>
              </Dialog>
        </TableRow>
        
    )
  }  
}
export default OrderedPartRow