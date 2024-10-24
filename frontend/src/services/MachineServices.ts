import { Machine } from "@/types";
import { fetchFactories, fetchAllFactorySections } from '@/services/FactoriesService';
import { supabase_client } from "./SupabaseClient";
import toast from "react-hot-toast";

export const fetchMachines = async (
    factorySectionId: number | undefined,
    page: number = 1,
    limit: number = 10,
    sortOrder: 'asc' | 'desc' | null = null
) => {
    let queryBuilder = supabase_client
        .from('machines')
        .select('id, type, name, is_running, factory_section_id', { count: 'exact' }); // Request total count

    // Apply filter if factorySectionId is provided
    if (factorySectionId !== undefined && factorySectionId !== -1) {
        queryBuilder = queryBuilder.eq('factory_section_id', factorySectionId);
    }

    // Apply pagination
    queryBuilder = queryBuilder.range((page - 1) * limit, page * limit - 1);

    // Apply sorting by status if provided
    if (sortOrder) {
        queryBuilder = queryBuilder.order('is_running', { ascending: sortOrder === 'asc' });
    }

    const { data, error, count } = await queryBuilder;

    if (error) {
        console.error('Error fetching machines:', error.message);
        return { data: [], count: 0 };
    }
    return { data, count };
};

export const fetchEnrichedMachines = async (
    factoryId: number | undefined,
    factorySectionId: number | undefined,
    page: number = 1,
    limit: number = 10,
    sortOrder: 'asc' | 'desc' | null = null
) => {
    // Fetch base machine data
    let queryBuilder = supabase_client
        .from('machines')
        .select('id, type, name, is_running, factory_section_id', { count: 'exact' });

    // Apply filter if factorySectionId is provided
    if (factorySectionId !== undefined && factorySectionId !== -1) {
        queryBuilder = queryBuilder.eq('factory_section_id', factorySectionId);
    } else if (factoryId !== undefined && factoryId !== -1) {
        // Fetch all sections of the given factory
        const allSections = await fetchAllFactorySections();
        const factorySections = allSections.filter(section => section.factory_id === factoryId);
        const factorySectionIds = factorySections.map(section => section.id);
        queryBuilder = queryBuilder.in('factory_section_id', factorySectionIds);
    }

    // Apply pagination
    queryBuilder = queryBuilder.range((page - 1) * limit, page * limit - 1);

    // Apply sorting by status if provided
    if (sortOrder) {
        queryBuilder = queryBuilder.order('is_running', { ascending: sortOrder === 'asc' });
    }

    const { data: machines, error, count } = await queryBuilder;

    if (error) {
        console.error('Error fetching machines:', error.message);
        return { data: [], count: 0 };
    }

    // Fetch factories and factory sections
    const factories = await fetchFactories();
    const factorySections = await fetchAllFactorySections();

    // Enrich machine data with factory and section names
    const enrichedMachines = machines.map(machine => {
        const section = factorySections.find(s => s.id === machine.factory_section_id);
        const factoryName = section ? factories.find(f => f.id === section.factory_id)?.name || 'Unknown Factory' : 'Unknown Factory';
        const sectionName = section?.name || 'Unknown Section';

        return {
            ...machine,
            factory: factoryName,
            factory_section_name: sectionName,
        };
    });

    return { data: enrichedMachines, count };
};

export const fetchMachineById = async (machineId: number) => {
    const { data, error } = await supabase_client
        .from('machines')
        .select('id, type, name, is_running, factory_section_id')
        .eq('id', machineId)
        .maybeSingle(); // .single() ensures that it only returns one record

    if (error) {
        console.error('Error fetching machine by ID:', error.message);
        return null;
    }

    return data as Machine;
};

export const setMachineIsRunningById = async (machineId: number, isRunning: boolean) => {
    const { data, error } = await supabase_client
        .from('machines')
        .update({ is_running: isRunning })
        .eq('id', machineId)
        .select('id, type, name, is_running, factory_section_id')
        .maybeSingle(); // .maybeSingle() is used to ensure only one record is returned.

    if (error) {
        toast.error('Failed to update machine status.'); // Optional: Show error message
        return null;
    }
    // toast.success('Machine status updated successfully!'); // Optional: Show success message
    return data;
};

export const fetchMetricRunningMachines = async () => {
    const { count, error } = await supabase_client
        .from('machines')
        .select('*', { count: 'exact', head: true })
        .eq('is_running','true')

    if (error) {
        console.error('Error fetching metric for running machines', error.message);
        return null;
    }

    return count;
};

export const fetchMetricNotRunningMachines = async () => {
    const { count, error } = await supabase_client
        .from('machines')
        .select('*', { count: 'exact', head: true })
        .eq('is_running','false')

    if (error) {
        console.error('Error fetching metric for not running machines:', error.message);
        return null;
    }
    
    return count;
};