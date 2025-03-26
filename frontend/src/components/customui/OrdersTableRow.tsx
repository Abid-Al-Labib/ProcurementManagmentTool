import React, { useEffect, useState } from 'react';
import { ExternalLink, MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { TableCell, TableRow } from "../ui/table";
import { Link } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { deleteOrderByID, fetchRunningOrdersByMachineId } from '@/services/OrdersService';
import toast from 'react-hot-toast';
import { Order, OrderedPart } from '@/types';
import { convertUtcToBDTime, isManagebleOrder, managePermission } from '@/services/helper';
import { Dialog, DialogTitle, DialogContent, DialogHeader, DialogDescription, DialogTrigger } from '../ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { OctagonAlert } from 'lucide-react';
import { setMachineIsRunningById } from '@/services/MachineServices';
import { fetchOrderedPartsByOrderID } from '@/services/OrderedPartsService';
import OrderedPartsPopup from './OrderedPartsPopup';



interface OrdersTableRowProps {
  order: Order
}

const OrdersTableRow: React.FC<OrdersTableRowProps> = ({ order }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const profile = useAuth().profile;
  const [orderedParts,setOrderedParts] = useState<OrderedPart[]|null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  
  const handleDeleteOrder = async () => {
    try {
      if (order.order_type == "Machine") {
          if(order.current_status_id === 1) {
            if ((await (fetchRunningOrdersByMachineId(order.machine_id))).length == 1) {
              setMachineIsRunningById(order.machine_id, true)
              toast.success("Machine is now running")
            }
          }
        }
        await deleteOrderByID(order.id)
        toast.success("Order successfully deleted")
    } catch (error) {
        toast.error("Failed to delete");
        
    }
    setIsDeleteDialogOpen(false)
  }

  const handleRowClick = (event: React.MouseEvent<HTMLTableRowElement>) => {
    // Get the clicked row's bounding rect
    const rowRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    //Get mouse click y coordinates
    const clickX = event.clientX;
    // Calculate the popup position
    const popupTop = rowRect.top + window.scrollY - 250; // Position above the row
    const popupLeft = clickX - 128; // Centered above the row

    setPopupPosition({
      top: popupTop,
      left: popupLeft,
    });

    setIsPopupOpen(true); // Show the popup
  };

  const loadOrderedParts = async () => {

    const order_id = order.id
    try {
      const ordered_parts = await fetchOrderedPartsByOrderID(order_id);
      if (ordered_parts) {
        setOrderedParts(ordered_parts);
      } else {
        console.log("Could not fetch ordered parts for this order id")
        setOrderedParts(null)
      }
      
    } catch (error) {
      console.log(`ERROR - ${error}`)
    }
  };
  
  useEffect(() => {
    loadOrderedParts();
  },[]);

  const permissionToManage = managePermission(order.statuses.name, profile?.permission ? profile.permission: "")
  const isHighlightedOrder = isManagebleOrder(order.statuses.name, profile?.permission ? profile.permission: "")
  return  (
    <>
  <TableRow onClick={handleRowClick} className={isHighlightedOrder? "bg-red-50": ""}>
      <TableCell className="font-medium">

        {order.id}
           
      </TableCell>
      <TableCell className="font-medium hidden md:table-cell">
        {order.req_num}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {order.factory_sections?.name && order.machines?.name
          ? `${order.factories.abbreviation} - ${order.factory_sections?.name} - ${order.machines?.name}`
          : `${order.factories.abbreviation} - Storage`}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {convertUtcToBDTime(order.created_at)}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {order.profiles.name}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {order.departments.name}
      </TableCell>
      <TableCell className="table-cell md:hidden">
        <Dialog>
          <DialogTrigger><ExternalLink className="hover:cursor-pointer"/></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Order information</DialogTitle>
              <DialogDescription>
              <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Req Number</span>
                <span> {order.req_num} </span>
              </li>    
              <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Order for Machine/Storage</span>
                <span> {order.factory_sections?.name && order.machines?.name
                    ? `${order.factories.abbreviation} - ${order.factory_sections?.name} - ${order.machines?.name}`
                    : `${order.factories.abbreviation} - Storage`}
                </span>
              </li>              
              <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Created At</span>
                <span> {convertUtcToBDTime(order.created_at)} </span>
              </li>              
              <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Created by</span>
                <span>{order.profiles.name}</span>
              </li>              
              <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Department</span>
                <span> {order.departments.name}</span>
              </li>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </TableCell>
      <TableCell>
      <Badge
        className={order.statuses.name === "Parts Received" ? "bg-green-100": order.statuses.name === "Pending" ? "bg-red-300": "bg-orange-100"}
        variant="secondary"
      >
        {order.statuses.name}
      </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {isHighlightedOrder ? (
              <Button
                // className="text-indigo-400" // Set static color of the button
                className="text-yellow-900" // Set static color of the button

                aria-haspopup="true"
                size="icon"
                variant="ghost">
                <OctagonAlert>
                  <span className="sr-only text-red-600 ">Toggle menu</span>
                </OctagonAlert>
              </Button>

            ):(
                <Button
                  aria-haspopup="true"
                  size="icon"
                  variant="ghost"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              )
            }
            
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <Link to={`/vieworder/${order.id}`}>
              <DropdownMenuItem>
                View
              </DropdownMenuItem>
            </Link>
            {permissionToManage &&
              <Link to={`/manageorder/${order.id}`}>
              <DropdownMenuItem>
                Manage
              </DropdownMenuItem>
              </Link>
            }
            {
              profile?.permission==='admin' && 
              <DropdownMenuItem onClick={()=>setIsDeleteDialogOpen(true)}>
                <span className='hover:text-red-600'>Delete</span>
              </DropdownMenuItem>
            }
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
                <DialogTitle className="text-red-600">Delete Order -  <span> ID: {order.id}</span></DialogTitle>
                <div>
                  You are about to permanently delete this order.
                  <br />
                  Are you sure you want to delete this order?
                </div>
                <Button onClick={handleDeleteOrder}>Delete</Button>
        </DialogContent>
      </Dialog>
    </TableRow>
    {isPopupOpen && (
      <OrderedPartsPopup
        orderedParts={orderedParts}
        onClose={() => setIsPopupOpen(false)}
        position={popupPosition}
      />
    )}
    </>
  );
};

export default OrdersTableRow;


