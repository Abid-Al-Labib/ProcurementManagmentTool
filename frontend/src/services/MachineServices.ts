import { Machine } from "@/types";
import { supabase_client } from "./SupabaseClient";
import toast from "react-hot-toast";

export const fetchMachines = async (factorySectionId: number) => {
    const { data, error } = await supabase_client
        .from('machines')
        .select('id, type, number')
        .eq('factory_section_id', factorySectionId);

    if (error) {
        console.error('Error fetching machines:', error.message);
        return [];
    }
    return data;
};

export const fetchMachineById = async (machineId: number) => {
    const { data, error } = await supabase_client
        .from('machines')
        .select('id, type, number, is_running, factory_section_id')
        .eq('id', machineId)
        .maybeSingle(); // .single() ensures that it only returns one record

    if (error) {
        console.error('Error fetching machine by ID:', error.message);
        return null;
    }

    return data as Machine;
};

export const setMachineIsRunning = async (machineId: number, isRunning: boolean) => {
    const { data, error } = await supabase_client
        .from('machines')
        .update({ is_running: isRunning })
        .eq('id', machineId)
        .select('id, type, number, is_running, factory_section_id')
        .maybeSingle(); // .maybeSingle() is used to ensure only one record is returned.

    if (error) {
        console.error('Error updating machine status:', error.message);
        toast.error('Failed to update machine status.'); // Optional: Show error message
        return null;
    }

    toast.success('Machine status updated successfully!'); // Optional: Show success message
    return data;
};