import toast from "react-hot-toast";
import { supabase_client } from "./SupabaseClient";


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
    const { data, error } = await query;

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

    return filteredData;
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

export const updateMachinePartQty = async (machine_id: number, part_id: number, new_quantity: number) => {
    const { error } = await supabase_client
    .from('storage_parts')
    .update({ qty: new_quantity })
    .eq('part_id', part_id).eq('machine_id', machine_id)

    if (error){
        toast.error(error.message)
    }
}

export const addMachinePartQty = async (
    machine_id: number,
    part_id: number,
    new_quantity: number
) => {
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

    // Check if data is present and calculate the updated quantity
    const currentQty = currentData && currentData.length > 0 ? currentData[0].qty : 0;
    const updatedQuantity = currentQty + new_quantity;

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
    } else {
        toast.success("Machine part quantity updated successfully!");
    }
};

export const updateRequiredQuantity = async (partId: number, newQty: number) => {
    const { error } = await supabase_client
        .from('machine_parts')
        .update({ req_qty: newQty })
        .eq('id', partId);

    if (error) {
        toast.error('Error updating required quantity: ' + error.message);
        throw error; // Throw error to handle it in the component
    }

    toast.success('Required quantity updated successfully.');
};