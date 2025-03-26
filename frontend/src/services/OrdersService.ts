import { Order } from "@/types";
import { supabase_client } from "./SupabaseClient";
import { convertBDTimeToUtc, isManagebleOrder, managePermission } from "./helper.ts";
import toast from "react-hot-toast";
import { fetchFactoriesByIds, fetchFactorySectionsByIds } from "./FactoriesService.ts";


export const fetchOrders = async ({
    page = 1,
    limit = 10,
    showCompleted,
    filters = {}
}: {
    page: number;
    limit: number;
    showCompleted: boolean;
    filters?: {
        searchQuery?: string;
        reqNumQuery?: string;
        selectedDate?: Date;
        dateFilterType?: number;
        selectedStatusId?: number;
        selectedDepartmentId?: number;
        selectedFactoryId?: number;
        selectedFactorySectionId?: number;
        selectedMachineId?: number;
        selectedOrderType?: string;
    };
}) => {

    console.log(`Fetching orders with parameters: Page: ${page}, Limit: ${limit}, Filters:`, filters);
    console.log("ID   ", filters.searchQuery)

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let queryBuilder = supabase_client
        .from('orders')
        .select(
            `
            id,
            req_num,
            created_at,
            order_note,
            created_by_user_id,
            department_id,
            current_status_id,
            factory_id,
            machine_id,
            factory_section_id,
            order_type,
            departments(*),
            profiles(*),
            statuses(*),
            factory_sections(*),
            factories(*),
            machines(*)
            `,
            { count: 'exact' }
        )
        .range(from, to)
        .order('id', { ascending: false });

    if (filters.searchQuery) {
        console.log("ID SEARCH")
        console.log(queryBuilder)
        queryBuilder = queryBuilder.eq('id', filters.searchQuery);
    }

    if (filters.reqNumQuery) {
        queryBuilder = queryBuilder.eq('req_num', filters.reqNumQuery);
    }

    if (!showCompleted){
        queryBuilder = queryBuilder.neq('current_status_id', 8)
    }
    if (showCompleted){
        queryBuilder = queryBuilder.eq('current_status_id', 8)
    }

    if (filters.selectedDate && filters.dateFilterType) {
        const searchDateStr = filters.selectedDate.toISOString().split('T')[0];

        // Convert to Bangladesh time for start and end of the day
        const startOfDayUTC = convertBDTimeToUtc(`${searchDateStr}T00:00:00`);
        const endOfDayUTC = convertBDTimeToUtc(`${searchDateStr}T23:59:59`);

        // Apply date range based on the filter type
        if (filters.dateFilterType === 1) {
            // For "on" date, search within the specific day
            queryBuilder = queryBuilder.gte('created_at', startOfDayUTC)
                .lte('created_at', endOfDayUTC);
        } else if (filters.dateFilterType === 2) {
            // For "before" the date, search for all orders before the start of the day
            queryBuilder = queryBuilder.lte('created_at', startOfDayUTC);
        } else if (filters.dateFilterType === 3) {
            // For "after" the date, search for all orders after the end of the day
            queryBuilder = queryBuilder.gte('created_at', endOfDayUTC);
        }

        console.log('Fetching orders with filterType:', filters.dateFilterType, 'search date:', startOfDayUTC, 'to', endOfDayUTC);
    }

    if (filters.selectedStatusId) {
        queryBuilder = queryBuilder.eq('current_status_id', filters.selectedStatusId);
    }

    if (filters.selectedDepartmentId) {
        console.log('Fetching orders with deptID ', filters.selectedDepartmentId);
        queryBuilder = queryBuilder.eq('department_id', filters.selectedDepartmentId);
    }

    if (filters.selectedFactoryId) {
        console.log('Fetching orders with factoryID ', filters.selectedFactoryId);
        queryBuilder = queryBuilder.eq('factory_id', filters.selectedFactoryId);
    }

    if (filters.selectedFactorySectionId) {
        console.log('Fetching orders with factorySectionID ', filters.selectedFactorySectionId);
        queryBuilder = queryBuilder.eq('factory_section_id', filters.selectedFactorySectionId);
    }

    if (filters.selectedMachineId) {
        console.log('Fetching orders with machineID ', filters.selectedMachineId);
        queryBuilder = queryBuilder.eq('machine_id', filters.selectedMachineId);
    }

    if (filters.selectedOrderType && filters.selectedOrderType !== 'all') {
        console.log('Fetching orders with orderType', filters.selectedOrderType);
        queryBuilder = queryBuilder.eq('order_type', filters.selectedOrderType);
    }

    const { data, error, count } = await queryBuilder;

    if (error) {
        toast.error(error.message);
        return { data: [], count: 0 };
    }
    return { data: data as unknown as Order[], count };
};

export const fetchOrderByID = async (order_id:number) => {
    const {data,error} = await supabase_client.from('orders').
    select(
        `
            id,
            req_num,
            created_at,
            order_note,
            created_by_user_id,
            department_id,
            current_status_id,
            factory_id,
            machine_id,
            factory_section_id,
            order_type,
            departments(*),
            profiles(*),
            statuses(*),
            factory_sections(*),
            factories(*),
            machines(*)
        `
    ).eq('id',order_id).single()
    if (error){
        return null
    }
    console.log(data)
    return data as unknown as Order;
};

export const fetchOrderByReqNum = async (reqNum: string) => {
    
    const { data, error } = await supabase_client.from('orders').
        select(
            `
            id,
            req_num,
            created_at,
            order_note,
            created_by_user_id,
            department_id,
            current_status_id,
            factory_id,
            machine_id,
            factory_section_id,
            order_type,
            departments(*),
            profiles(*),
            statuses(*),
            factory_sections(*),
            factories(*),
            machines(*)
        `
    ).eq('req_num', reqNum)
    if (error) {
        return null
    }
    // console.log(data)
    return data ?? [];
};

export const fetchOrderByReqNumandFactory = async (reqNum: string, factoryId: number) => {

    const { data, error } = await supabase_client.from('orders').
        select(
            `
            id,
            req_num,
            created_at,
            order_note,
            created_by_user_id,
            department_id,
            current_status_id,
            factory_id,
            machine_id,
            factory_section_id,
            order_type,
            departments(*),
            profiles(*),
            statuses(*),
            factory_sections(*),
            factories(*),
            machines(*)
        `
        ).ilike('req_num', reqNum).eq('factory_id',factoryId)
    if (error) {
        return null
    }
    // console.log(data)
    return data ?? [];
    
};

export const UpdateStatusByID = async (orderid: number, status_id:number) => {
    
    const { error } = await supabase_client.from('orders')
    .update({ current_status_id: status_id })
    .eq('id', orderid)
    
    if (error){
        toast.error(error.message)
    }
}

export const deleteOrderByID = async (orderid:number) => {
    
    const { error } = await supabase_client
    .from('orders')
    .delete()
    .eq('id', orderid)
    
    if(error) {
        toast.error(error.message)
    }
}


export const insertOrder = async (
    req_num: string,
    order_note: string,
    created_by_user_id: number,
    department_id: number,
    factory_id: number,
    factory_section_id: number,
    machine_id: number,
    current_status_id: number,
    order_type: string, ) => {

    const { data, error } = await supabase_client.from('orders').insert([
        {
            "req_num": req_num,
            "order_note": order_note,
            "created_by_user_id": created_by_user_id,
            "department_id": department_id,
            "factory_id": factory_id,
            "factory_section_id": factory_section_id,
            "machine_id": machine_id,
            "current_status_id": current_status_id,
            "order_type": order_type,
            
        },
        ])
        .select()

    if (error) {
        toast.error("Failed to create order: " + error.message);
    }
    return { data: data as Order[], error };
};

export const insertOrderStorage = async (
    req_num: string,
    order_note: string,
    created_by_user_id: number,
    department_id: number,
    factory_id: number,
    current_status_id: number,
    order_type: string, ) => {

    const { data, error } = await supabase_client.from('orders').insert([
        {
            "req_num": req_num,
            "order_note": order_note,
            "created_by_user_id": created_by_user_id,
            "department_id": department_id,
            "factory_id": factory_id,
            "current_status_id": current_status_id,
            "order_type": order_type,
        },
    ])
        .select()

    if (error) {
        toast.error("Failed to create order: " + error.message);
    }
    return { data: data as Order[], error };
};

export const fetchRunningOrdersByMachineId = async (machine_id: number) => {
    const { data, error } = await supabase_client.from('orders').
        select(
            `
            id,
            req_num,
            created_at,
            order_note,
            created_by_user_id,
            department_id,
            current_status_id,
            factory_id,
            machine_id,
            factory_section_id,
            order_type,
            departments(*),
            profiles(*),
            statuses(*),
            factory_sections(*),
            factories(*),
            machines(*)
        `
    ).eq('machine_id', machine_id)
        .neq('current_status_id', 8)
    if (error) {
        toast.error(error.message)
    }
    console.log("Returned Current Orders of",machine_id, data)
    return data as unknown as Order[];
}


export const fetchMetricActiveOrders = async () => {
    const { count, error } = await supabase_client.from('orders').
        select('*',{ count: 'exact', head: true })
        .neq('current_status_id', 8)
    if (error) {
        toast.error(error.message)
    }
    return count
}


export const fetchManagableOrders = async (role:string) => {
    const { data, error } = await supabase_client.from('orders').
    select(
        `
            id,
            current_status_id,
            statuses(*)
        `
    )
    .neq('current_status_id', 8)
    
    if (error) {
        toast.error(error.message)
    }

    if (!data) {
        return 0;
    }

    // Filter through the orders and check if they are manageable
    const manageableOrders = data.filter((order: any) => {
        const statusName = order.statuses?.name;
        return isManagebleOrder(statusName, role); // Check permission for the current role and status
    });

    return manageableOrders.length;
}


export const fetchMetricsHighMaintenanceFactorySections = async () => {
    const { data, error } = await supabase_client
      .from('orders')
      .select(`factory_section_id, count: factory_section_id.count()`)
      .order('count', { ascending: false })
      .limit(10);
  
    if (error) {
      toast.error(error.message);
      return null;
    }
  
    // Filter out rows where factory_section_id is null
    const filteredData = data.filter((item) => item.factory_section_id !== null);
  
    // Extract section IDs from `filteredData` to maintain order
    const sectionIds = filteredData.map((item) => item.factory_section_id);
  
    // Fetch section details and create a Map by section ID
    const sectionData = await fetchFactorySectionsByIds(sectionIds);
    if (!sectionData) return null;
    const sectionMap = new Map(sectionData.map((section) => [section.id, section]));
  
    // Extract factory IDs from the sections
    const factoryIds = sectionData.map((section) => section.factory_id);
  
    // Fetch factory details and create a Map by factory ID
    const factoryData = await fetchFactoriesByIds(factoryIds);
    if (!factoryData) return null;
    const factoryMap = new Map(factoryData.map((factory) => [factory.id, factory]));
  
    // Build the result in the order of `filteredData`
    const result = filteredData.map((item) => {
      const section = sectionMap.get(item.factory_section_id);
      if (section) {
        const factory = factoryMap.get(section.factory_id);
        return factory ? `${factory.abbreviation} - ${section.name} - (${item.count})` : `Unknown Factory - ${section.name}`;
      }
      return `Unknown Section`;
    });
  
    return result as string[];
  };


  export const fetchMetricsHighMaintenanceFactorySectionsCurrentMonth = async () => {
    // Get the start and end dates for the current month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const startOfNextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();
  
    const { data, error } = await supabase_client
      .from('orders')
      .select(`factory_section_id, count: factory_section_id.count()`)
      .gte('created_at', startOfMonth)
      .lt('created_at', startOfNextMonth)
      .order('count', { ascending: false })
      .limit(10);
  
    if (error) {
      toast.error(error.message);
      return null;
    }
  
    // Filter out rows where factory_section_id is null
    const filteredData = data.filter((item) => item.factory_section_id !== null);
  
    // Extract section IDs from `filteredData` to maintain order
    const sectionIds = filteredData.map((item) => item.factory_section_id);
  
    // Fetch section details and create a Map by section ID
    const sectionData = await fetchFactorySectionsByIds(sectionIds);
    if (!sectionData) return null;
    const sectionMap = new Map(sectionData.map((section) => [section.id, section]));
  
    // Extract factory IDs from the sections
    const factoryIds = sectionData.map((section) => section.factory_id);
  
    // Fetch factory details and create a Map by factory ID
    const factoryData = await fetchFactoriesByIds(factoryIds);
    if (!factoryData) return null;
    const factoryMap = new Map(factoryData.map((factory) => [factory.id, factory]));
  
    // Build the result in the order of `filteredData`
    const result = filteredData.map((item) => {
      const section = sectionMap.get(item.factory_section_id);
      if (section) {
        const factory = factoryMap.get(section.factory_id);
        return factory ? `${factory.abbreviation} - ${section.name}` : `Unknown Factory - ${section.name}`;
      }
      return `Unknown Section`;
    });
  
    return result as string[];
  };
  