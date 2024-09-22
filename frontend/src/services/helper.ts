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
    // Create a Date object from the UTC timestamp
    const offset = 0
    const date = new Date(utcTimestamp);

    // Apply the offset in hours
    const localDate = new Date(date.getTime() + offset * 60 * 60 * 1000);

    // Format the local date and time
    return localDate.toLocaleString('en-GB', {
        year: 'numeric', // "2024"
        month: 'short', // "Aug"
        day: 'numeric', // "16"
        // below code commented out as we only need to display date for this system
        // hour: '2-digit', // "01"
        // minute: '2-digit', // "21"
        // hour12: true // Use 12-hour clock format
    });
};


export const isChangeStatusAllowed = (ordered_parts: OrderedPart[], current_status: string) => {
  // Filter parts that have in_storage === false and approved_storage_withdrawal === false
  const partsToCheck = ordered_parts.filter(part =>!(part.in_storage && part.approved_storage_withdrawal));
  // If there are no parts to check (i.e., all parts are either in storage or have approved storage withdrawal), allow the change
  
  
  switch (current_status) {
      case "Pending": {
        if (ordered_parts.every(part => part.approved_pending_order === true)) return 2
        break;
      }
      case "Order Sent To Head Office": {
        if (partsToCheck.length === 0 && ordered_parts.length!==0) return 7;  
        if (partsToCheck.every(part => part.approved_office_order === true)) return 3
        break;
      }
      case "Waiting For Quotation": {
        if (partsToCheck.every(part => part.vendor !== null && part.unit_cost !== null && part.brand !== null)) return 4
        break;
      }
      case "Budget Released": {
        if(partsToCheck.every(part => part.approved_budget === true)) return 5
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
        if(ordered_parts.every(part => part.part_received_by_factory_date !== null)) return 8
        break;
      }

      default:
        return -1; 
    }
};

export const managePermission = (status: string, role: string): boolean => {
    switch (status) {
      case "Pending":
        if (role === "xyz") {
          return true;
        } else if (role === "xyz") {
          return true;
        } else if (role === "xyz") {
          return true;
        }
        break;
  
      case "Order Sent To Head Office":
        if (role === "xyz") {
          return true;
        } else if (role === "xyz") {
          return true;
        } else if (role === "xyz") {
          return true;
        }
        break;
  
      case "Waiting For Quotation":
        if (role === "xyz") {
          return true;
        } else if (role === "xyz") {
          return true;
        } else if (role === "xyz") {
          return true;
        }
        break;
  
      case "Budget Released":
        if (role === "xyz") {
          return true;
        } else if (role === "xyz") {
          return true;
        } else if (role === "xyz") {
          return true;
        }
        break;
  
      case "Waiting For Purchase":
        if (role === "xyz") {
          return true;
        } else if (role === "xyz") {
          return true;
        } else if (role === "xyz") {
          return true;
        }
        break;
  
      case "Purchase Complete":
        if (role === "xyz") {
          return true;
        } else if (role === "xyz") {
          return true;
        } else if (role === "xyz") {
          return true;
        }
        break;
  
      case "Parts Sent To Factory":
        if (role === "xyz") {
          return true;
        } else if (role === "xyz") {
          return true;
        } else if (role === "xyz") {
          return true;
        }
        break;
  
      case "Parts Received":
        if (role === "xyz") {
          return true;
        } else if (role === "xyz") {
          return true;
        } else if (role === "xyz") {
          return true;
        }
        break;
  
      default:
        return false;
    }
  
    return false;
  };


