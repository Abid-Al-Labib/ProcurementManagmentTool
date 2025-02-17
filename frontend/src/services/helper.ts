import { OrderedPart, Status, StatusTracker } from "@/types";


export function mergeStatusWithTracker(statuses: Status[],statusTracker: StatusTracker[])
{
  // Step 1: Sort the statusTracker items by status_id in ascending order
  console.log(statusTracker)
  const sortedStatusTracker = statusTracker.sort((a, b) => a.id - b.id);

  // Step 2: Map statusTracker items as completed
  const completedStatuses = sortedStatusTracker.map(trackerItem => ({
    status: trackerItem.statuses.name,  // Assuming trackerItem has the 'statuses' field populated
    action_at: trackerItem.action_at,
    action_by: trackerItem.profiles.name, // Assuming 'profiles' contains the user's name
    complete: true,
  }));

  // Step 3: Get the last status_id from the last statusTracker item (latest one)
  const lastStatusId = sortedStatusTracker.length > 0 
    ? sortedStatusTracker[sortedStatusTracker.length - 1].status_id
    : 0;

  // Step 4: Get all remaining statuses that are incomplete (id > lastStatusId)
  const incompleteStatuses = statuses
    .filter(status => status.id > lastStatusId)
    .map(status => ({
      status: status.name,
      action_at: null,
      action_by: null,
      complete: false,
    }));

  // Step 5: Combine completed and incomplete statuses
  return [...completedStatuses, ...incompleteStatuses];
}


export const convertUtcToBDTime = (utcTimestamp: string): string => {
  // Parse the UTC timestamp into a Date object
  const date = new Date(utcTimestamp);

  // Check if the Date object is valid
  if (isNaN(date.getTime())) {
    throw new Error('Invalid UTC timestamp');
  }

  // Bangladesh is UTC+6, so we add 6 hours to convert UTC to Bangladesh time
  const bdOffset = 6 * 60 * 60 * 1000;
  const bdDate = new Date(date.getTime() + bdOffset);

  // Extract the year, month, day, hours, and minutes
  const year = bdDate.getUTCFullYear();
  const month = bdDate.toLocaleString('en-GB', { month: 'short' }); // Get the month name in short format (e.g., 'Oct')
  const day = bdDate.getUTCDate().toString(); // Day of the month
  const hours = bdDate.getUTCHours().toString().padStart(2, '0'); // Hours in 24-hour format
  const minutes = bdDate.getUTCMinutes().toString().padStart(2, '0'); // Minutes with leading zero

  // Return the formatted date as '4 Oct 2024, hh:mm'
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};


export const convertBDTimeToUtc = (bdTimestamp: string): string => {
  // Parse the date parts manually
  const [datePart, timePart] = bdTimestamp.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);

  // Create a date object using the provided Bangladesh time parts
  const bdDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));

  // Bangladesh is UTC+6, so we subtract 6 hours
  const bdOffset = 6 * 60 * 60 * 1000;
  const utcDate = new Date(bdDate.getTime() - bdOffset);

  // Return the UTC time in ISO format
  return utcDate.toISOString();
};

export const isRevertStatusAllowed = (ordered_parts: OrderedPart[], current_status: string) => {
  const partsToCheck = ordered_parts.filter(part =>!(part.in_storage && part.approved_storage_withdrawal && part.qty===0));

  if (current_status==="Budget Released" || current_status==="Waiting For Purchase"){
    return partsToCheck.some(part => part.vendor === null || part.unit_cost === null || part.brand === null);
  }
  else if (current_status==="Parts Received"){
    return partsToCheck.some(part => (part.vendor === null || part.unit_cost === null || part.brand === null || part.approved_budget=== false || part.part_purchased_date===null || part.part_received_by_factory_date===null|| part.part_sent_by_office_date===null
    ));
  }

  return false
}

export const isChangeStatusAllowed = (ordered_parts: OrderedPart[], current_status: string) => {
  // Filter parts that have in_storage === false and approved_storage_withdrawal === false
  const partsToCheck = ordered_parts.filter(part =>!(part.in_storage && part.approved_storage_withdrawal && part.qty===0));
  // If there are no parts to check (i.e., all parts are either in storage or have approved storage withdrawal), allow the change
  
  
  switch (current_status) {
      case "Pending": {
        if (ordered_parts.every(part => part.approved_pending_order === true)) return 2
        break;
      }
      case "Order Sent To Head Office": {
        if (partsToCheck.length === 0 && ordered_parts.length!==0) return 8;  
        if (partsToCheck.every(part => part.approved_office_order === true)) return 3
        break;
      }
      case "Waiting For Quotation": {
        if (partsToCheck.every(part => part.vendor !== null && part.unit_cost !== null && part.brand !== null)) return 4
        break;
      }
      case "Budget Released": {
        if(partsToCheck.every(part => part.approved_budget === true && part.vendor !== null && part.unit_cost !== null && part.brand !== null)) return 5
        break;
      }
      case "Waiting For Purchase": {
        if(partsToCheck.every(part => part.part_purchased_date !== null)) return 6;
        break;
      }
      case "Purchase Complete": { 
        if(partsToCheck.every(part => part.part_sent_by_office_date !== null)) return 7
        break;
      }
      case "Parts Sent To Factory": {
        if(ordered_parts.every(part => part.part_received_by_factory_date !== null && part.mrr_number !== null)) return 8
        break;
      }

      default:
        return -1; 
    }
};

export const managePermission = (status: string, role: string): boolean => {
    switch (status) {
      case "Pending":
        if (role === "admin") {
          return true;
        } else if (role === "directorTechnical") {
          return true;
        } else if (role === "department") {
          return true;
        } else if (role === "finance") {
          return true;
        } 
        break;
  
      case "Order Sent To Head Office":
        if (role === "admin") {
          return true;
        }
        break;
  
      case "Waiting For Quotation":
        if (role === "finance") {
          return true;
        } else if (role === "admin") {
          return true;
        }
        break;
  
      case "Budget Released":
        if (role === "admin") {
          return true;
        } 
        break;
  
      case "Waiting For Purchase":
        if (role === "admin") {
          return true;
        } else if (role === "finance") {
          return true;
        }
        break;
  
      case "Purchase Complete":
        if (role === "admin") {
          return true;
        } else if (role === "finance") {
          return true;
        } 
        break;
  
      case "Parts Sent To Factory":
        if (role === "admin") {
          return true;
        } else if (role === "department") {
          return true;
        } else if (role === "directorTechnical") {
          return true;
        } else if (role === "finance") {
        return true;
        }
        break;
  
      case "Parts Received":
        if (role === "admin") {
          return true;
        } else if (role === "department") {
          return true;
        } else if (role === "directorTechnical") {
          return true;
        } else if (role === "finance") {
        return true;
        }
        break;
      
      default:
        return false;
    }
  
    return false;
  };


  export const isManagebleOrder = (status: string, role: string): boolean => {
    switch (status) {
      case "Pending":
         if (role === "directorTechnical") {
          return true;
        }
        break;
  
      case "Order Sent To Head Office":
        if (role === "admin") {
          return true;
        }
        break;
  
      case "Waiting For Quotation":
        if (role === "finance") {
          return true;
        } 
        break;
  
      case "Budget Released":
        if (role === "admin") {
          return true;
        } 
        break;
  
      case "Waiting For Purchase":
        if (role === "finance") {
          return true;
        }
        break;
  
      case "Purchase Complete":
        if (role === "finance") {
          return true;
        } 
        break;
  
      case "Parts Sent To Factory":
        if (role === "admin") {
          return true;
        } else if (role === "department") {
          return true;
        } else if (role === "directorTechnical") {
          return true;
        } else if (role === "finance") {
        return true;
        }
        break;
  
      case "Parts Received":
        return false
        break;
      


      default:
        return false;
    }
  
    return false;
  };


