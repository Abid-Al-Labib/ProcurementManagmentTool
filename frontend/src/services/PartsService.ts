
import { Part } from "@/types";
import { supabase_client } from "./SupabaseClient";
import toast from "react-hot-toast";


export const fetchPageParts = async ({
    page = 1,
    partsPerPage = 10,
    filters = {}
}: {
    page: number;
    partsPerPage: number;
    filters?: {
        partIdQuery?: string;
        partNameQuery?: string;
    };
}) => {
    const from = (page - 1) * partsPerPage;
    const to = from + partsPerPage - 1;

    let queryBuilder = supabase_client
        .from("parts")
        .select("*", { count: "exact" })
        .range(from, to);

    // Apply filters dynamically
    if (filters.partIdQuery) {
        queryBuilder = queryBuilder.eq("id", filters.partIdQuery);
    }

    if (filters.partNameQuery) {
        queryBuilder = queryBuilder.ilike("name", `%${filters.partNameQuery}%`);
    }

    const { data, count, error } = await queryBuilder.order("name");

    if (error) {
        throw new Error(error.message);
    }

    return { data, count }; //  Returning data and count
};


export const fetchAllParts = async () => {
    const { data, error } = await supabase_client.from('parts').select('*');

    if (error) {
        throw new Error(error.message);
    }

    return data as unknown as Part[];  // Returning data and count directly
};


export const insertPart = async (name:string, unit:string, description: string) => {
    const { data, error } = await supabase_client.from('parts').insert([
    {   "name": name,
        "unit": unit,
        "description": description
         },
    ])
    .select()

    if (error) {
        toast.error(error.message)    
    }else{
        return data;
    }
    
};

export const editPart =  async(part_id:number,name:string,unit:string,description:string) => {
    
    const { data, error } = await supabase_client.from('parts').update(
        { 
            name: name,
            unit: unit,
            description: description
        }
    ).eq('id', part_id)
    .select()
    

    if (error) {
        toast.error(error.message)    
    }else{
        return data;
    }
}

export const fetchPartByID = async (part_id: number)=> {
    const { data, error } = await supabase_client.from('parts').select("*").eq(
        'id', part_id
    )

    if (error){
        toast.error(error.message)
    }
    console.log(data)
    return data as Part[]
}

export const fetchPartsByIDs = async (part_ids: number[])=> {
    const { data, error } = await supabase_client
    .from('parts')
    .select("*")
    .in('id', part_ids)

    if (error) {
        toast.error(error.message)
    }
    return data as Part[]
}
