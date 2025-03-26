import toast from "react-hot-toast";
import { supabase_client } from "./SupabaseClient";
import { MachinePart } from "@/types";


export const fetchMachineParts = async (
    machineId?: number,
    partId?: number,
    partName?: string
) => {
    let query = supabase_client
        .from('machine_parts')
        .select(`
      id,
      qty,
      req_qty,
      machine_id,
      parts (*),
      machines(*)
    `);

    // Add machine ID filter if provided
    // console.log(partId);

    if (machineId !== undefined) {
        query = query.eq('machine_id', machineId);
    }

    // Add part ID filter if provided
    // console.log(partId);
    if (partId !== undefined) {
        query = query.eq('part_id', partId);
    }

    // Execute the query
    const { data, error } = await query.order('id',{ascending: true});

    // Handle any errors
    if (error) {
        toast.error('Error fetching machine parts: ' + error.message);
        return [];
    }

    // Additional filtering based on part name
    let filteredData = data;

    if (partName) {
        filteredData = filteredData.filter((record: any) =>
            record.parts && record.parts.name.toLowerCase().includes(partName.toLowerCase())
        );
    }

    return filteredData as unknown as MachinePart[];
};

export const upsertMachineParts = async ( part_id: number, machine_id: number, quantity: number) => {
    
    const { error } = await supabase_client
    .from('machine_parts')
    .upsert({ 
        machine_id:  machine_id,
        part_id: part_id,
        qty: quantity
    },{onConflict: 'part_id, machine_id'}
    )

    if (error) {
        toast.error(error.message)
    }
        
}

export const updateMachinePartQuantities = async (
    id: number, // Primary key ID
    quantity: number,
    req_qty: number
  ) => {
    const { error } = await supabase_client
      .from("machine_parts")
      .update({ qty: quantity, req_qty: req_qty })
      .eq("id", id);
  
    if (error) {
      toast.error("Error updating machine part quantities: " + error.message);
    } else {
      toast.success("Machine part quantities updated successfully.");
    }
  };


export const updateMachinePartQty = async (
    machine_id: number,
    part_id: number,
    new_quantity: number,
    direction: 'add' | 'subtract'
): Promise<number | void> => {
    // Fetch the current quantity for the given machine_id and part_id
    const { data: currentData, error: fetchError } = await supabase_client
        .from("machine_parts")
        .select("qty")
        .eq("part_id", part_id)
        .eq("machine_id", machine_id);

    // Handle error if the fetch fails
    if (fetchError) {
        toast.error(fetchError.message);
        return;
    }
    let returnFlag = 0
    let updatedQuantity = 0
    // Check if data is present and calculate the updated quantity
    const currentQty = currentData && currentData.length > 0 ? currentData[0].qty : 0;
    if(direction == 'subtract') {
        if (currentQty < new_quantity) {
            updatedQuantity = new_quantity;
            returnFlag = currentQty
            console.log("currentlt", currentQty, "new", updatedQuantity);
        }
        if (currentQty == 0){
            updatedQuantity = 0;
            returnFlag = 0;
        }
        else {
            updatedQuantity = currentQty - new_quantity;
            returnFlag = new_quantity;
        }
    } else { 
        //This is for adding new parts
        updatedQuantity = new_quantity + currentQty;
        // console.log("new_quantity",new_quantity, " current_quantity", currentQty, " updated quantity", updatedQuantity)
    }

    // Upsert the new quantity value into the database
    const { error: upsertError } = await supabase_client
        .from("machine_parts")
        .upsert(
            {
                part_id: part_id,
                machine_id: machine_id,
                qty: updatedQuantity,
            },
            { onConflict: "part_id, machine_id" } // Ensure conflict is managed correctly
        );

    // Handle upsert error if it occurs
    if (upsertError) {
        toast.error(upsertError.message);
    } 
    // else {
    //     toast.success("Machine part quantity updated successfully!");
    // }
    return returnFlag;
};

export const updateRequiredQuantity = async (partId: number, newCurQty: number, newReqQty: number) => {
    const { error } = await supabase_client
        .from('machine_parts')
        .update({ qty: newCurQty, req_qty: newReqQty })
        .eq('id', partId);

    if (error) {
        toast.error('Error updating required quantity: ' + error.message);
        throw error; // Throw error to handle it in the component
    }

    toast.success('Required quantity updated successfully.');
};

export const deleteMachinePart = async (machinePartId: number) => {
    const { error } = await supabase_client
        .from('machine_parts')
        .delete()
        .eq('id', machinePartId);

    if (error) {
        toast.error("Failed to delete machine part: " + error.message);
        return false;
    }

    toast.success("Machine part deleted successfully!");
    return true;
};
