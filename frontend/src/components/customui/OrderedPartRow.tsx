import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { TableCell, TableRow } from "../ui/table"
import { Button } from "../ui/button"
import { ExternalLink, MoreHorizontal, Notebook, NotebookPen,  } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import React, { useEffect, useState } from "react"
import { Calendar } from "../ui/calendar"
import { OrderedPart, Status } from "@/types"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import toast from "react-hot-toast"
import { deleteOrderedPartByID, fetchLastChangeDate, fetchLastCostAndPurchaseDate, returnOrderedPartByID, updateApprovedBudgetByID, updateApprovedOfficeOrderByID, updateApprovedPendingOrderByID, updateApprovedStorageWithdrawalByID, updateCostingByID, updateMrrNumberByID, updateOfficeNoteByID, updateOrderedPartQtyByID, updatePurchasedDateByID, updateQtyTakenFromStorage, updateReceivedByFactoryDateByID, updateSampleReceivedByID, updateSentDateByID } from "@/services/OrderedPartsService"
import { showBudgetApproveButton, showPendingOrderApproveButton, showOfficeOrderApproveButton, showOfficeOrderDenyButton, showPurchaseButton, showQuotationButton, showReceivedButton, showSampleReceivedButton, showSentButton, showReviseBudgetButton, showOfficeNoteButton, showApproveTakingFromStorageButton, showMrrButton, showReturnButton, showRemovePartButton, showUpdatePartQuantityButton } from "@/services/ButtonVisibilityHelper"
import OrderedPartInfo from "./OrderedPartInfo"
import { convertUtcToBDTime} from "@/services/helper"
import { Checkbox } from "../ui/checkbox"
import { useNavigate } from "react-router-dom"
import { Textarea } from "../ui/textarea"
import { fetchStoragePartQuantityByFactoryID, upsertStoragePart, updateStoragePartQty } from "@/services/StorageService"
import { useAuth } from "@/context/AuthContext"
import { updateMachinePartQty } from "@/services/MachinePartsService"
import { Badge } from "../ui/badge"
import { addDamagePartQuantity } from "@/services/DamagedGoodsService"
import { Separator } from "../ui/separator"


interface OrderedPartRowProp{
    index: number
    mode: 'view' | 'manage' | 'invoice',
    orderedPartInfo: OrderedPart,
    current_status: Status,
    factory_id: number
    machine_id: number,
    order_type: string,
}

export const OrderedPartRow:React.FC<OrderedPartRowProp> = ({index, mode, orderedPartInfo, current_status, factory_id, machine_id, order_type}) => {
  const profile = useAuth().profile
  const [datePurchased, setDatePurchased] = useState<Date | undefined>(orderedPartInfo.part_purchased_date? new Date(orderedPartInfo.part_purchased_date): new Date())
  const [dateSent, setDateSent] = useState<Date | undefined>(orderedPartInfo.part_sent_by_office_date? new Date(orderedPartInfo.part_sent_by_office_date): new Date())
  const [dateReceived, setDateReceived] = useState<Date | undefined>(orderedPartInfo.part_received_by_factory_date? new Date(orderedPartInfo.part_received_by_factory_date): new Date())
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isApproveFromOfficeDialogOpen, setIsApproveFromOfficeDialogOpen] = useState(false);
  const [isRemovePartDialogOpen, setIsRemovePartDialogOpen] = useState(false);
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
  const [isMrrDialogOpen, setIsMrrDialogOpen] = useState(false)
  const [isDenyDialogOpen, setIsDenyDialogOpen] = useState(false);
  const [mrrLoading, setMrrLoading] = useState(false)
  const [mrrNumber, setMrrNumber] = useState(orderedPartInfo.mrr_number || '')
  const [vendor, setVendor] = useState(orderedPartInfo.vendor || '');
  const [brand, setBrand] = useState(orderedPartInfo.brand || '')
  const [unitCost, setUnitCost] = useState(orderedPartInfo.unit_cost || '');
  const [costLoading, setCostLoading] = useState(false);
  const [lastUnitCost, setLastUnitCost] = useState<number | null>(null);
  const [lastPurchaseDate, setLastPurchaseDate] = useState<string | null>(null); // assuming date is string
  const [lastVendor, setLastVendor] = useState<string|null>(null);
  const [newQuantity, setNewQuantity] = useState("")
  const [lastChangeDate, setLastChangeDate] = useState<string|null>(null)
  const [denyCost, setDenyCost] = useState(false);
  const [denyBrand, setDenyBrand] = useState(false);
  const [denyVendor, setDenyVendor] = useState(false);
  const [noteValue, setNoteValue] = useState<string>('');
  const [isUpdatePartQuantityDialogOpen, setIsUpdatePartQuantityDialogOpen] = useState(false);
  const navigate = useNavigate()
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [disableTakeStorageRow, setDisableTakeStorageRow] = useState(false);
  const [currentStorageQty,setCurrentStorageQty] = useState<number|null>(null)
  const [qtyTakenFromStorage, setQtyTakenFromStorage] = useState<number | null>(null)
  const handleNavigation = () => {
    navigate('/orders'); 
  };
  // useEffect to fetch most recent cost and purchase date
  useEffect(() => {
      const fetchData = async () => {
          if (mode=="manage")
          {
            const disableRow = orderedPartInfo.in_storage && orderedPartInfo.approved_storage_withdrawal && orderedPartInfo.qty===0
            setDisableTakeStorageRow(disableRow)
            if (order_type === "Machine")
            {
              const storage_data = await fetchStoragePartQuantityByFactoryID(orderedPartInfo.part_id,factory_id) 
              if (storage_data && storage_data.length>0) {
                setCurrentStorageQty(storage_data[0].qty)
              }
              else {
                console.log(`no storage data found for partid ${orderedPartInfo.part_id} in factoryid ${factory_id}`)
              }
            }
          }
          if(order_type == "Machine"){
            const past_purchase_result = await fetchLastCostAndPurchaseDate(orderedPartInfo.part_id);
            const last_change_result = await fetchLastChangeDate(machine_id,orderedPartInfo.part_id);
              if (past_purchase_result) {
              setLastUnitCost(past_purchase_result.unit_cost);
              setLastPurchaseDate(past_purchase_result.part_purchase_date);
              setLastVendor(past_purchase_result.vendor)
            }

            if (last_change_result) {
              setLastChangeDate(last_change_result)
            }
          }
          else{
            setLastUnitCost(null);
            setLastPurchaseDate(null);
            setLastVendor(null);
          }
      };

      fetchData(); // Trigger the fetch when component mounts or dependencies change
  }, [machine_id, orderedPartInfo.part_id]);

  const handleApproveFactory = () => {
    // console.log("Factory Approve action triggered");
    const approvePartFromFactory = async() => {
      try {
        await updateApprovedPendingOrderByID(orderedPartInfo.id,true)
        toast.success("Ordered part has been approved!");

        //Logic to update storage and machine part quantity
        if (order_type=="Machine"){
          await updateMachinePartQty(
            machine_id,
            orderedPartInfo.part_id,
            orderedPartInfo.qty,
            'subtract'
          )

          // Call addDamagePartQuantity only if parts were subtracted
          addDamagePartQuantity(factory_id, orderedPartInfo.part_id, orderedPartInfo.qty);
          
        }
      } catch (error) {
        toast.error("Error occured could not complete action");
      }
    };
    approvePartFromFactory();
    setIsApproveFromFactoryDialogOpen(false);
    setIsActionMenuOpen(false);
  }

  const handleApproveTakingFromStorage = () => {
    const takeFromStorage = async() => {
      try {
        if (currentStorageQty)
        {
            if (currentStorageQty>=orderedPartInfo.qty){
              //if there is enough quantity in storage 
              const new_storage_quantity = currentStorageQty - orderedPartInfo.qty
              await upsertStoragePart(orderedPartInfo.part_id,factory_id,new_storage_quantity)
              setCurrentStorageQty(new_storage_quantity)
              await updateOrderedPartQtyByID(orderedPartInfo.id,0)
              await updateMachinePartQty(machine_id, orderedPartInfo.part_id, orderedPartInfo.qty, 'add');
              await updateSentDateByID(orderedPartInfo.id, new Date())
              await updateReceivedByFactoryDateByID(orderedPartInfo.id,new Date())
              
              setDisableTakeStorageRow(true)
            }
            else{
              //if storage can't provide the requested quantity
              const new_orderedpart_qty = orderedPartInfo.qty - currentStorageQty
              await upsertStoragePart(orderedPartInfo.part_id,factory_id,0)
              setCurrentStorageQty(0)
              await updateOrderedPartQtyByID(orderedPartInfo.id,new_orderedpart_qty)
              await updateMachinePartQty(machine_id,orderedPartInfo.part_id,currentStorageQty,'add')
            }
            let takingFromStorageQty
            if(currentStorageQty <= orderedPartInfo.qty){
              takingFromStorageQty = currentStorageQty
            }
            else{
              takingFromStorageQty = orderedPartInfo.qty
            }
            await updateQtyTakenFromStorage(orderedPartInfo.id, takingFromStorageQty)
            setQtyTakenFromStorage(takingFromStorageQty)
            await updateApprovedStorageWithdrawalByID(orderedPartInfo.id, true)
          }
        } catch (error) {
        toast.error("Error occured while fetching storage data")
      }
    };

    takeFromStorage()
    setIsTakeFromStorageDialogOpen(false)
    setIsActionMenuOpen(false);
  }

  const handleApproveOffice = () => {
    const approvePartFromOffice = async() => {
      try {
        await updateApprovedOfficeOrderByID(orderedPartInfo.id,true)
        toast.success("Ordered part has been approved!");
      } catch (error) {
        toast.error("Error occured could  not complete action");
      }
    };
    approvePartFromOffice();
    setIsApproveFromOfficeDialogOpen(false);
    setIsActionMenuOpen(false);
  };

  const handleApproveBudget = () => {
    const approveBudget = async() => {
      try {
        await updateApprovedBudgetByID(orderedPartInfo.id, true);
        toast.success("The budget for this part has been approved!");

      } catch (error) {
        toast.error("Error occured could not complete action");
      }
    };
    approveBudget();
    setIsApproveBudgetDialogOpen(false);
    setIsActionMenuOpen(false);
  };

  const handleAddOfficeNote = () => {
    
    const addOfficeNote = async (updated_note: string) => {
      try {
        await updateOfficeNoteByID(orderedPartInfo.id, updated_note);
        toast.success("Your note has been added");
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
      updated_note = updated_note + profile?.name + ": " + noteValue.trim(); 
    } else {
      updated_note = updated_note + "\n" + profile?.name + ": " + noteValue.trim(); 
    }
    addOfficeNote(updated_note);
    setNoteValue(''); 
    setIsOfficeNoteDialogOpen(false)
    setIsActionMenuOpen(false);
  };


  const handleDenyPart = () => {
    const deletingPart = async() => {
      try {
        await deleteOrderedPartByID(orderedPartInfo.id)
        toast.success("Successfully removed this part from the order");
      } catch (error) {
        toast.error("Error occured could not complete action");
      }
    };
    deletingPart();
    setIsDenyDialogOpen(false)
    setIsActionMenuOpen(false);
  };

  const handleReviseBudget = () => {
    const updateCosting = async(brand: string | null, cost:number | null, vendor: string | null) => {
      try {
        setCostLoading(true);
        await updateCostingByID(orderedPartInfo.id, brand, cost, vendor )
        toast.success("Quotation updated")
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
      setIsReviseBudgetDialogOpen(false)
    }
    else{
      toast.error("You have not selected any category to deny.")
    }
  }

  const handleMRRinput = () => {
    const updateMrrNumber = async(mrr_number:string) => {
      try {
        setMrrLoading(true);
        await updateMrrNumberByID(orderedPartInfo.id, mrr_number.trim())
        toast.success("MRR Number has been set")
      } catch(error){
        toast.error("Error occured while setting MRR number")
      } finally {
        setMrrLoading(false);
      }
    } 

    if (!(mrrNumber.trim().length>0)) {
      toast.error('Please fill in all information');
      return;
    }

    updateMrrNumber(mrrNumber)
    setMrrNumber('')

  }

  const handleUpdatePartQty = async () => {
    if (newQuantity == ''){
      toast.error("Please enter a valid number")
      return
    }
    const qty = Number(newQuantity)
    try{
      if (qty == orderedPartInfo.qty) {
        toast.error("Quantity was not provided or was the same value of current quantity")
      }
      else if (qty<0) {
        toast.error("Negative number is not a valid input")
      }
      else if (qty===0){
        toast.error("Zero is not a valid input")
      }
      else{
        await updateOrderedPartQtyByID(orderedPartInfo.id, qty)

      }
    }catch{
      toast.error("Failed to update quantity")
    } finally {
      setNewQuantity("")
    }

  }

  const handleUpdateCosting = () => {
    const updateCosting = async(brand:string, cost:number, vendor: string) => {
      try {
        setCostLoading(true);
        await updateCostingByID(orderedPartInfo.id, brand.trim(), cost, vendor.trim() )
        toast.success("Costing for this part is submitted")
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
    const updatePurchaseDate = async() => {
      if (datePurchased){
        try {
          await updatePurchasedDateByID(orderedPartInfo.id, datePurchased)
          toast.success("Part purchased date set!")
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
    const updateSentDate = async() => {
      if(dateSent && datePurchased){
        if (dateSent.getDate()>=datePurchased.getDate()){
          try {
            await updateSentDateByID(orderedPartInfo.id, dateSent)
            toast.success("Part sent to office date set!")
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
    const updateReceivedDate = async() => {
      if(dateReceived && dateSent){
        if (dateReceived.getDate()>=dateSent.getDate()){
          try {
            await updateReceivedByFactoryDateByID(orderedPartInfo.id, dateReceived)
            //if order type storage
            toast.success("Part received by factory date set!")
            if (order_type=="Storage"){
              await updateStoragePartQty(orderedPartInfo.part_id,factory_id,orderedPartInfo.qty,'add');
            }
            if (order_type == "Machine") {
              await updateMachinePartQty(machine_id, orderedPartInfo.part_id, orderedPartInfo.qty,'add');
            }
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
    setIsReceivedDialogOpen(false);
    setIsActionMenuOpen(false);
  }


  const handleSampleReceived = () => {
    const updateSampleReceived = async () => {
      try {
        await updateSampleReceivedByID(orderedPartInfo.id, true);
        toast.success("Updated sample received status")
      } catch (error) {
        toast.error("Error occured could not complete action");
      }
    };
    updateSampleReceived();
    setIsSampleReceivedDialogOpen(false);
    setIsActionMenuOpen(false);
  }

  const handleReturnPart = () => {
    
    const returnOrderedPart = async () => {
      try {
        await returnOrderedPartByID(orderedPartInfo.id)
        if (order_type=="Storage"){
          await updateStoragePartQty(orderedPartInfo.part_id,factory_id,orderedPartInfo.qty,'subtract');
        }
        if (order_type == "Machine") {
          await updateMachinePartQty(machine_id, orderedPartInfo.part_id, orderedPartInfo.qty,'subtract');
        }
      } catch (error) {
        toast.error("Error returning Part")
      }
    }

    returnOrderedPart()
    setIsReturnDialogOpen(false)
    
  }

  if(mode==='view'){
    return (
      <TableRow>
        <TableCell>{index}.</TableCell>
        <TableCell className="whitespace-nowrap"><a className="hover:underline" target="_blank" href={`/viewpart/${orderedPartInfo.part_id}`}>{orderedPartInfo.parts.name}</a></TableCell>
        <TableCell className="whitespace-nowrap">
          <Badge
          className={orderedPartInfo.in_storage ? "bg-green-100" : "bg-red-100"}
          variant="secondary"
        >
          {orderedPartInfo.in_storage ? "Yes" : "No"}
         </Badge>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          <Badge
            className={orderedPartInfo.approved_storage_withdrawal ? "bg-green-100" : "bg-red-100"}
            variant="secondary"
          >
            {orderedPartInfo.approved_storage_withdrawal ? `${orderedPartInfo.qty_taken_from_storage}` : "No"}
          </Badge>
        </TableCell>
        {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableCell className="whitespace-nowrap">{lastUnitCost?`BDT ${lastUnitCost}` : '-'}</TableCell>}
        <TableCell className="whitespace-nowrap">{lastVendor? lastVendor: '-'}</TableCell>
        <TableCell className="whitespace-nowrap">{lastPurchaseDate? convertUtcToBDTime(lastPurchaseDate).split(',')[0]: '-'}</TableCell>
        <TableCell className="whitespace-nowrap">{lastChangeDate? convertUtcToBDTime(lastChangeDate).split(',')[0]: '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.qty}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.parts.unit}</TableCell>
        {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.brand || '-'}</TableCell>}
        {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.vendor || '-'}</TableCell>}
        {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.unit_cost || '-'}</TableCell>}
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
        {(profile?.permission === 'admin' || profile?.permission === 'finance') && <TableCell className="hidden md:table-cell">
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
        </TableCell>}
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.part_purchased_date? (convertUtcToBDTime(orderedPartInfo.part_purchased_date)).split(',')[0] : '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.part_sent_by_office_date ? (convertUtcToBDTime(orderedPartInfo.part_sent_by_office_date)).split(',')[0] : '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.part_received_by_factory_date ? (convertUtcToBDTime(orderedPartInfo.part_received_by_factory_date)).split(',')[0] : '-'}</TableCell>
        <TableCell className="whitespace-nowrap">{orderedPartInfo.mrr_number? orderedPartInfo.mrr_number: '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{`${orderedPartInfo.is_sample_sent_to_office? 'Yes': 'No'} / ${orderedPartInfo.is_sample_received_by_office? 'Yes': 'No'}`}</TableCell>

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
  else if(mode==='invoice'){
    return (
      <TableRow>
      <TableCell>{index}.</TableCell>
      <TableCell>
        <div className="flex-row gap-2">
          <a className="font-bold text-lg hover:underline" target="_blank" href={`/viewpart/${orderedPartInfo.part_id}`}>{orderedPartInfo.parts.name}</a>
          {(profile?.permission === 'admin' || profile?.permission=== 'finance') && 
          <div className="flex gap-2">
            <div className="whitespace-nowrap text-xs font-bold">MRR: {orderedPartInfo.mrr_number? orderedPartInfo.mrr_number : '-'}</div>
            <div className="text-xs">Received Date: {orderedPartInfo.part_received_by_factory_date? convertUtcToBDTime(orderedPartInfo.part_received_by_factory_date).split(',')[0]: '-'}</div>
          </div>}
          {(profile?.permission === 'admin' || profile?.permission=== 'finance') && 
          <div className="mt-1 text-xs">
            History:
          </div>}
          { (profile?.permission === 'admin' || profile?.permission=== 'finance') && 
          <div className="flex gap-2">
            <div className="whitespace-nowrap text-xs">Cost: {lastUnitCost?`BDT ${lastUnitCost}` : '-'}</div>
            <div className="text-xs">Vendor: {lastVendor? lastVendor: '-'}</div>
          </div>}
          { (profile?.permission === 'admin' || profile?.permission=== 'finance') && 
          <div className="flex gap-2">
            <div className="text-xs">LP Date: {lastPurchaseDate? convertUtcToBDTime(lastPurchaseDate).split(',')[0]: '-'}</div>
            <div className="text-xs">Change Date: {lastChangeDate? convertUtcToBDTime(lastChangeDate).split(',')[0]: '-'}</div>
          </div>}
        </div>
      </TableCell>
      {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableCell>{orderedPartInfo.brand || '-'}</TableCell>}
      {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableCell>{orderedPartInfo.vendor || '-'}</TableCell>}
      <TableCell className="whitespace-nowrap">{orderedPartInfo.qty}({orderedPartInfo.parts.unit})</TableCell>
      {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableCell className="whitespace-nowrap">{orderedPartInfo.unit_cost || '-'}</TableCell>}
      {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableCell className="whitespace-nowrap">{`${orderedPartInfo.unit_cost?orderedPartInfo.unit_cost*orderedPartInfo.qty: "-"}`}</TableCell>}

      </TableRow>
    )
  }
  else if(mode==="manage"){
    return(
        <TableRow className={`${
          disableTakeStorageRow ? 'bg-gray-300 pointer-events-none' : ''
        } transition duration-200 ease-in-out`}>
        <TableCell>{index}.</TableCell>
        <TableCell>
          <DropdownMenu open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                aria-haspopup="true"
                size="icon"
                variant="ghost"
                onClick={() => setIsActionMenuOpen(true)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="grid-cols-1" align="end">
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
                showRemovePartButton(current_status.name) && (
                  <DropdownMenuItem onClick={() => setIsRemovePartDialogOpen(true)}>
                    <span className="hover:text-red-600">Remove part</span>
                  </DropdownMenuItem>
                )}
              {
                showUpdatePartQuantityButton(current_status.name) && (
                  <DropdownMenuItem onClick={() => setIsUpdatePartQuantityDialogOpen(true)}>
                    <span className="hover:text-blue-600">Update Part Qty</span>
                  </DropdownMenuItem>
                )}
              {
                showApproveTakingFromStorageButton(current_status.name, orderedPartInfo.in_storage, orderedPartInfo.approved_storage_withdrawal) && (
                  <DropdownMenuItem onClick={() => setIsTakeFromStorageDialogOpen(true)}>
                    <span className="hover:text-green-600">Take from storage</span>
                  </DropdownMenuItem>
                )}
              {
                showOfficeNoteButton(current_status.name) && (
                  <DropdownMenuItem onClick={() => setIsOfficeNoteDialogOpen(true)}>
                    <span>Add Office Note</span>
                  </DropdownMenuItem>
                )}
              {
                showBudgetApproveButton(current_status.name, orderedPartInfo.approved_budget, orderedPartInfo.qty, orderedPartInfo.vendor, orderedPartInfo.brand) && (
                  <DropdownMenuItem onClick={() => setIsApproveBudgetDialogOpen(true)}>
                    <span className="hover:text-green-600">Approve Budget</span>
                  </DropdownMenuItem>
                )}
              {
                showReviseBudgetButton(current_status.name, orderedPartInfo.approved_budget) && (
                  <DropdownMenuItem onClick={() => setIsReviseBudgetDialogOpen(true)}  >
                    <span className="hover:text-red-600">Revise Budget</span>
                  </DropdownMenuItem>
                )}
              {
                showOfficeOrderDenyButton(current_status.name) && (
                  <DropdownMenuItem onClick={() => setIsDenyDialogOpen(true)}>
                    <span className="hover:text-red-600">Deny Part</span>
                  </DropdownMenuItem>
                )}
              {
                showQuotationButton(current_status.name, orderedPartInfo.brand, orderedPartInfo.vendor, orderedPartInfo.unit_cost) && (
                  <DropdownMenuItem onClick={() => setIsCostingDialogOpen(true)}>
                    <span>Add Quotation</span>
                  </DropdownMenuItem>
                )}
              {
                showPurchaseButton(current_status.name, orderedPartInfo.part_purchased_date) && (
                  <DropdownMenuItem onClick={() => setIsPurchasedDialogOpen(true)}>
                    <span>Set Purchase Date</span>
                  </DropdownMenuItem>
                )}
              {
                showSentButton(current_status.name, orderedPartInfo.part_sent_by_office_date) && (
                  <DropdownMenuItem onClick={() => setIsSentDialogOpen(true)}>
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
                showMrrButton(current_status.name, orderedPartInfo.mrr_number) && (
                  <DropdownMenuItem onClick={() => setIsMrrDialogOpen(true)}>
                    <span>Add MRR number</span>
                  </DropdownMenuItem>
                )}
              {
                showSampleReceivedButton(orderedPartInfo.is_sample_sent_to_office, orderedPartInfo.is_sample_received_by_office) && (
                  <DropdownMenuItem onClick={() => setIsSampleReceivedDialogOpen(true)}>
                    <span>Receive Sample</span>
                  </DropdownMenuItem>
                )}
              {
                showReturnButton(current_status.name, orderedPartInfo) && (
                  <DropdownMenuItem onClick={() => setIsReturnDialogOpen(true)}>
                    <span className="hover:text-red-600">Return Part</span>
                  </DropdownMenuItem>
                )}

            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
        <TableCell className="whitespace-nowrap"><a className="hover:underline" target="_blank" href={`/viewpart/${orderedPartInfo.part_id}`}>{orderedPartInfo.parts.name}</a></TableCell>
        <TableCell className="whitespace-nowrap">
          <Badge
          className={orderedPartInfo.in_storage ? "bg-green-100" : "bg-red-100"}
          variant="secondary"
        >
          {orderedPartInfo.in_storage ? "Yes" : "No"}
         </Badge>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          <Badge
            className={orderedPartInfo.approved_storage_withdrawal ? "bg-green-100" : "bg-red-100"}
            variant="secondary"
          >
            {orderedPartInfo.approved_storage_withdrawal ? `${orderedPartInfo.qty_taken_from_storage}` : "No"}
          </Badge>
        </TableCell>        
        <TableCell className="whitespace-nowrap">{currentStorageQty? currentStorageQty : "-"}</TableCell>
        {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableCell className="whitespace-nowrap">{lastUnitCost?`BDT ${lastUnitCost}` : '-'}</TableCell>}
        <TableCell className="whitespace-nowrap">{lastVendor? lastVendor: '-'}</TableCell>
        <TableCell className="whitespace-nowrap">{lastPurchaseDate? convertUtcToBDTime(lastPurchaseDate).split(',')[0]: '-'}</TableCell>
        <TableCell className="whitespace-nowrap">{lastChangeDate? convertUtcToBDTime(lastChangeDate).split(',')[0]: '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.qty}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.parts.unit}</TableCell>
        {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.brand || '-'}</TableCell>}
        {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.vendor || '-'}</TableCell>}
        {(profile?.permission === 'admin' || profile?.permission=== 'finance') && <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.unit_cost || '-'}</TableCell>}
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
        {(profile?.permission === 'admin' || profile?.permission=== 'finance') && 
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
        }
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.part_purchased_date ? (convertUtcToBDTime(orderedPartInfo.part_purchased_date)).split(',')[0] : '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.part_sent_by_office_date ? (convertUtcToBDTime(orderedPartInfo.part_sent_by_office_date)).split(',')[0] : '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{orderedPartInfo.part_received_by_factory_date ? (convertUtcToBDTime(orderedPartInfo.part_received_by_factory_date)).split(',')[0] : '-'}</TableCell>
        <TableCell className="whitespace-nowrap">{orderedPartInfo.mrr_number? orderedPartInfo.mrr_number: '-'}</TableCell>
        <TableCell className="whitespace-nowrap hidden md:table-cell">{`${orderedPartInfo.is_sample_sent_to_office? 'Yes': 'No'} / ${orderedPartInfo.is_sample_received_by_office? 'Yes': 'No'}`}</TableCell>
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


            <Dialog open={isRemovePartDialogOpen} onOpenChange={setIsRemovePartDialogOpen}>
              <DialogContent>
                <DialogTitle>
                  Remove part
                </DialogTitle>
                <DialogDescription>
                  <p className="text-sm text-muted-foreground">
                    You are about to remove part - {orderedPartInfo.parts.name} from the list
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please confirm.
                  </p>
                </DialogDescription>

                <Button onClick={handleDenyPart}>Confirm</Button>
              </DialogContent>
            </Dialog>

            <Dialog open={isUpdatePartQuantityDialogOpen} onOpenChange={setIsUpdatePartQuantityDialogOpen}>
              <DialogContent>
                <DialogTitle>
                  Update Quantity
                </DialogTitle>
                <DialogDescription>
                  <p className="text-sm text-muted-foreground">
                    Current Quantity ({orderedPartInfo.qty}) will be updated.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please enter the new quantity
                  </p>
                  <div className="grid gap-3">
                        <Label htmlFor="new_quantity">Quantity</Label>
                        <Input 
                          id="new_quantity" 
                          type="number"
                          // value={newQuantity} 
                          placeholder="Enter the new quantity" 
                          onChange={(e) => setNewQuantity(e.target.value)}
                          />
                    </div>
                </DialogDescription>

                <Button onClick={handleUpdatePartQty}>Confirm</Button>
              </DialogContent>
            </Dialog>

            <Dialog open={isMrrDialogOpen} onOpenChange={setIsMrrDialogOpen}>
                <DialogContent>
                  <DialogTitle>
                    Mrr Number - <span className="text-sm">{orderedPartInfo.parts.name}</span>
                  </DialogTitle>
                  <DialogDescription>
                    <p className="text-sm text-muted-foreground">
                      Please enter the MRR number for this ordered part
                    </p>
                    <div className="grid gap-3 mt-2">
                        <Label htmlFor="mrr">MRR Number:</Label>
                        <Input 
                          id="mrr" 
                          type="text" 
                          value={mrrNumber}
                          placeholder="Enter MRR number"
                          onChange={(e) => setMrrNumber(e.target.value)}
                        />
                      </div>
                  </DialogDescription>
                  <Button onClick={handleMRRinput} disabled={mrrLoading}>
                      {mrrLoading ? "Updating..." : "Confirm"}
                    </Button>
                </DialogContent>
              </Dialog>

            <Dialog open={isReceivedDialogOpen} onOpenChange={setIsReceivedDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogTitle>Date when part was received at Factory</DialogTitle>
                <DialogDescription><span className="text-sm">{orderedPartInfo.parts.name}</span></DialogDescription>
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
                  <DialogDescription><span className="text-sm">{orderedPartInfo.parts.name}</span></DialogDescription>
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
                      <DialogDescription><span className="text-sm">{orderedPartInfo.parts.name}</span></DialogDescription>
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
                      Quotation -  <span className="text-sm">{orderedPartInfo.parts.name}</span>
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
                    Office Note - <span className="text-sm">{orderedPartInfo.parts.name}</span>
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
                        <DialogTitle className="text-red-600">Deny Part - <span className="text-sm">{orderedPartInfo.parts.name}</span></DialogTitle>
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
                        <DialogTitle className="text-red-600">Revise Budget - <span className="text-sm">{orderedPartInfo.parts.name}</span></DialogTitle>
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
                    Budget Approval - <span className="text-sm">{orderedPartInfo.parts.name}</span>
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
                    Take from storage Approval - <span className="text-sm">{orderedPartInfo.parts.name}</span>
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
                    Approval From Factory - <span className="text-sm">{orderedPartInfo.parts.name}</span>
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
                    Approval from Office - <span className="text-sm">{orderedPartInfo.parts.name}</span>
                  </DialogTitle>
                  <DialogDescription>
                    <p className="text-sm text-muted-foreground">
                      Are you sure you want to approve this part?
                    </p>
                  </DialogDescription>
          
                  <Button onClick={handleApproveOffice}>Approve</Button>
                </DialogContent>
              </Dialog>

              <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
                <DialogContent>
                  <DialogTitle>
                    Returning Part - <span className="text-sm">{orderedPartInfo.parts.name}</span>
                  </DialogTitle>
                  <DialogDescription>
                    <p className="text-sm text-muted-foreground">
                      Are you sure you want to return this part?
                    </p>
                  </DialogDescription>
          
                  <Button onClick={handleReturnPart}>Approve</Button>
                </DialogContent>
              </Dialog>
        </TableRow>
        
    )
  }  
}
export default OrderedPartRow