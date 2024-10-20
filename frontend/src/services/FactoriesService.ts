import { Factory } from "@/types";
import { supabase_client } from "./SupabaseClient";

// Function to fetch all factories
export const fetchFactories = async () => {
    const { data, error } = await supabase_client
        .from('factories')
        .select('id, name, abbreviation');  

    if (error) {
        console.error('Error fetching factories:', error.message);
        return [];
    }
    return data as unknown as Factory[];
};

export const fetchFactorySections = async (factoryId: number) => {
    const { data, error } = await supabase_client
        .from('factory_sections')
        .select('id, name, factory_id') 
        .eq('factory_id', factoryId);

    if (error) {
        console.error('Error fetching factory sections:', error.message);
        return [];
    }
    return data;
};

export const fetchAllFactorySections = async () => {
    const { data, error } = await supabase_client
        .from('factory_sections')
        .select('id, name, factory_id');

    if (error) {
        console.error('Error fetching all factory sections:', error.message);
        return [];
    }
    return data;
};

export const fetchDepartments = async () => {
    const { data, error } = await supabase_client
        .from('departments')
        .select('id, name');

    if (error) {
        console.error('Error fetching departments:', error.message);
        return [];
    }
    return data;
};

