import { OrderedPart } from "@/types";

export const showPendingOrderApproveButton = (status:string , isapproved:boolean): boolean =>{
    if (status === "Pending" && !isapproved) {
        return true;
    }
    return false;
}

export const showOfficeOrderApproveButton = (status:string, isapproved:boolean): boolean =>{
    if (status === "Order Sent To Head Office" && !isapproved) {
        return true;
    }
    return false;
}

export const showApproveTakingFromStorageButton = (status:string, in_storage: boolean ,isApproved:boolean): boolean =>{
    if (status === "Order Sent To Head Office" && in_storage && !isApproved) {
        return true;
    }
    return false;
}

export const showOfficeOrderDenyButton = (status:string): boolean =>{
    if (status === "Order Sent To Head Office") {
        return true;
    }
    return false;
}

export const showRemovePartButton = (status: string): boolean => {
    if (status === "Pending") {
        return true;
    }
    return false;
}

export const showAddPartButton = (status:string): boolean => {
    if (status === 'Pending'){
        return true;
    }
    else if (status === 'Order Sent To Head Office'){
        return true;
    }
    return false;
}

export const showUpdatePartQuantityButton = (status:string): boolean => {
    if (status === 'Pending'){
        return true;
    }
    else if (status === 'Order Sent To Head Office'){
        return true;
    }
    return false;
}

export const showOfficeOrderChangeQtyButton = (status:string): boolean =>{
    if (status === "Order Sent To Head Office") {
        return true;
    }
    return false;
}

export const showOfficeNoteButton = (status: string): boolean => {
    if (status === "Order Sent To Head Office" || status === "Waiting For Quotation" || status === "Budget Released") {
        return true;
    }
    return false;
}

export const showQuotationButton = (status: string, brand: string | null, vendor: string | null, unit_cost: number | null): boolean => {
  if ((status === "Waiting For Quotation") && (brand === null || vendor === null || unit_cost === null)) {
    return true;
  }
  return false;
}

export const showAllBudgetApproveButton = (status: string, ordered_parts: OrderedPart[] ) => {
    //here it is assumed that all 
    if (status === "Budget Released"){
        const partsToCheck = ordered_parts.filter(part =>!(part.in_storage && part.approved_storage_withdrawal && part.qty===0));
        if(partsToCheck.every(part => part.vendor !== null && part.unit_cost !== null && part.brand !== null)) return true
    }
    return false
}

export const showBudgetApproveButton = (status:string, isApproved:boolean, qty:number|null, vendor:string|null, brand:string|null): boolean =>{
    if (status === "Budget Released" && !isApproved && qty!==null && vendor !==null && brand!==null) {
        return true;
    }
    return false;
}

export const showReviseBudgetButton = (status:string, isApproved:boolean): boolean =>{
    if (status === "Budget Released" && !isApproved) {
        return true;
    }
    else if (status === "Waiting For Purchase") {
        return true;
    }
    return false;
}

export const showPurchaseButton = (status:string, PurchasedDate: string | null): boolean =>{
    if (status === "Waiting For Purchase" && PurchasedDate===null) {
        return true;
    }
    return false;
}

export const showSentButton = (status:string , sentDate: string | null): boolean =>{
    if (status === "Purchase Complete" && sentDate===null) {
        return true;
    }
    return false;
}

export const showReceivedButton = (status:string, receivedDate: string | null): boolean =>{
    if (status === "Parts Sent To Factory" && receivedDate===null) {
        return true;
    }
    return false;
}

export const showMrrButton = (status:string, mrr_number:string|null): boolean => {
    if ((status === "Parts Sent To Factory" || status === "Parts Received") && mrr_number===null)
    {
        return true
    }
    return false
}

export const showSampleReceivedButton = (is_sample_sent_to_office: boolean, is_sample_received_by_office: boolean): boolean => {
    if (is_sample_sent_to_office && !is_sample_received_by_office){
        return true;
    }
    return false;
}

export const showReturnButton = (status: string, ordered_part: OrderedPart): boolean => {
    console.log("return order part:",ordered_part)
    if (status === "Parts Received" && 
        ordered_part.brand!==null &&
        ordered_part.vendor!==null &&
        ordered_part.unit_cost!==null &&
        ordered_part.approved_budget===true &&
        ordered_part.part_purchased_date!==null && 
        ordered_part.part_received_by_factory_date!==null && 
        ordered_part.part_sent_by_office_date!==null)
        {
            return true
        }
        return false
}