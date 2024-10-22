


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

export const showBudgetApproveButton = (status:string, isApproved:boolean): boolean =>{
    if (status === "Budget Released" && !isApproved) {
        return true;
    }
    return false;
}

export const showReviseBudgetButton = (status:string, isApproved:boolean): boolean =>{
    if (status === "Budget Released" && !isApproved) {
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

export const showSampleReceivedButton = (is_sample_sent_to_office: boolean, is_sample_received_by_office: boolean): boolean => {
    if (is_sample_sent_to_office && !is_sample_received_by_office){
        return true;
    }
    return false;
}