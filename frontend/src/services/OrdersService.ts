import { Order } from "@/types";
import { supabase_client } from "./SupabaseClient";
import { convertBDTimeToUtc, managePermission } from "./helper.ts";
import toast from "react-hot-toast";
import { count } from "console";
import { Head } from "react-day-picker";


export const fetchOrders = async ({
    page = 1,
    limit = 10,
    query = '',
    searchDate,
    dateFilterType, // This is passed along with searchDate
    statusId,
    departmentId,
    factoryId,
    factorySectionId,
    machineId,
    orderType,
}: {
    page: number;
    limit: number;
    query?: string;
    searchDate?: Date;
    dateFilterType?: 'on' | 'before' | 'after'; // Define filterType for date filtering
    statusId?: number;
    departmentId?: number;
    factoryId?: number;
    factorySectionId?: number;
    machineId?: number;
    orderType?: string;
}) => {

    console.log(`Fetching orders with parameters: 
        Page: ${page}, 
        Limit: ${limit}, 
        Query: ${query}, 
        Search Date: ${searchDate}, 
        Status ID: ${statusId}, 
        Department ID: ${departmentId}, 
        Factory ID: ${factoryId},
        Factory Section ID: ${factorySectionId},
        Machine ID: ${machineId},
        OrderType: ${orderType}`
    );

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let queryBuilder = supabase_client
        .from('orders')
        .select(
            `
            id,
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

    if (query) {
        queryBuilder = queryBuilder.eq('id', query);
    }

    if (searchDate && dateFilterType) {
        const searchDateStr = searchDate.toISOString().split('T')[0];

        // Convert to Bangladesh time for start and end of the day
        const startOfDayUTC = convertBDTimeToUtc(`${searchDateStr}T00:00:00`);
        const endOfDayUTC = convertBDTimeToUtc(`${searchDateStr}T23:59:59`);

        // Apply date range based on the filter type
        if (dateFilterType === 'on') {
            // For "on" date, search within the specific day
            queryBuilder = queryBuilder.gte('created_at', startOfDayUTC)
                .lte('created_at', endOfDayUTC);
        } else if (dateFilterType === 'before') {
            // For "before" the date, search for all orders before the start of the day
            queryBuilder = queryBuilder.lte('created_at', startOfDayUTC);
        } else if (dateFilterType === 'after') {
            // For "after" the date, search for all orders after the end of the day
            queryBuilder = queryBuilder.gte('created_at', endOfDayUTC);
        }

        console.log('Fetching orders with filterType:', dateFilterType, 'search date:', startOfDayUTC, 'to', endOfDayUTC);
    }

    if (statusId) {
        queryBuilder = queryBuilder.eq('current_status_id', statusId);
    }

    if (departmentId) {
        console.log('Fetching orders with deptID ', departmentId);
        queryBuilder = queryBuilder.eq('department_id', departmentId);
    }

    if (factoryId) {
        console.log('Fetching orders with factoryID ', factoryId);
        queryBuilder = queryBuilder.eq('factory_id', factoryId);
    }

    if (factorySectionId) {
        console.log('Fetching orders with factorySectionID ', factorySectionId);
        queryBuilder = queryBuilder.eq('factory_section_id', factorySectionId);
    }

    if (machineId) {
        console.log('Fetching orders with machineID ', machineId);
        queryBuilder = queryBuilder.eq('machine_id', machineId);
    }

    if (orderType && orderType !== 'all') {
        console.log('Fetching orders with orderType', orderType);
        queryBuilder = queryBuilder.eq('order_type', orderType);
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
    order_note: string,
    created_by_user_id: number,
    department_id: number,
    factory_id: number,
    factory_section_id: number,
    machine_id: number,
    current_status_id: number,
    order_type: string) => {

    const { data, error } = await supabase_client.from('orders').insert([
        {
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
        return null; 
    }

    toast.success("Order successfully created");
    return data as unknown as Order[];
};

export const insertOrderStorage = async (
    order_note: string,
    created_by_user_id: number,
    department_id: number,
    factory_id: number,
    current_status_id: number,
    order_type: string) => {

    const { data, error } = await supabase_client.from('orders').insert([
        {
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
        return null;
    }

    toast.success("Order successfully created");
    return data as unknown as Order[];
};

export const fetchRunningOrdersByMachineId = async (machine_id: number) => {
    const { data, error } = await supabase_client.from('orders').
        select(
            `
            id,
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
        return managePermission(statusName, role); // Check permission for the current role and status
    });

    return manageableOrders.length;
}
