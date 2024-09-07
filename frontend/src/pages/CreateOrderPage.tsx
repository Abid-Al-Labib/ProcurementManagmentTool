import { Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import NavigationBar from "../components/customui/NavigationBar"
import { Button } from "../components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CirclePlus, CircleX, Loader2, CircleCheck} from "lucide-react"
import { useEffect, useState } from "react"
import { insertOrder } from "@/services/OrdersService";
import toast from 'react-hot-toast'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { fetchFactories, fetchFactorySections, fetchMachines } from '@/services/FactoriesService';
import { insertOrderedParts } from '@/services/OrderedPartsService';
import { fetchParts } from "@/services/PartsService"
import { Part } from "@/types"
import { InsertStatusTracker } from "@/services/StatusTrackerService"
import { Separator } from "@/components/ui/separator"

interface Factory {
    id: number;
    name: string;
}
interface FactorySection{
    id: number;	
    name: string;
    factory_id?: number;
}

interface Machine {
    id: number;
    number: number;
    type: string;
    factory_section_id?: number;
}

interface InputOrder {
    created_at: string;
    order_note: string;
    created_by_user_id: number;
    department_id: number;
    current_status_id: number;
}

interface InputOrderedPart {
    qty: number;
    order_id: number;
    part_id: number;
    factory_id: number;
    machine_id: number;
    factory_section_id: number;
    factory_section_name: string;
    machine_number: number;
    is_sample_sent_to_office: boolean,
    note?: string | null; 
}

const CreateOrderPage = () => {

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [factories, setFactories] = useState<Factory[]>([]);
    const [selectedFactoryId, setSelectedFactoryId] = useState<number>(-1); 
    const selectedFactoryName = factories.find(factory => factory.id === selectedFactoryId)?.name || "Select Factory";

    const [factorySections, setFactorySections] = useState<FactorySection[]>([]);
    const [selectedFactorySectionId, setSelectedFactorySectionId] = useState<number>(-1);
    const selectedFactorySectionName = factorySections.find(section => section.id === selectedFactorySectionId)?.name || "Select Section";
    
    const [machines, setMachines] = useState<Machine[]>([]);
    const [selectedMachineId, setSelectedMachineId] = useState<number>(-1);
    const selectedMachineNumber = Number(machines.find(machine => machine.id === selectedMachineId)?.number || "Select Machine");

    const departments = [
        { id: 1, name: "Electrical" },
        { id: 2, name: "Mechanical" }
    ];    
    const [departmentId, setDepartmentId] = useState<number>(-1); 
    const selectedDepartmentName = departmentId ? departments.find(dept => dept.id === departmentId)?.name : "Select Department";

    const [orderType, setOrderType] = useState('');
    const [description, setDescription] = useState(''); 
    const [note, setNote] = useState(''); 


    const [tempOrderDetails, setTempOrderDetails] = useState<InputOrder | null>(null);
    const [showPartForm, setShowPartForm] = useState(false); // To toggle part addition form visibility
    const isOrderFormComplete = selectedFactoryId !== -1 && departmentId !== -1 && orderType && description.trim();

    const [parts, setParts] = useState<Part[]>([]);
    useEffect(() => {
        const loadParts = async () => {
            const fetchedParts = await fetchParts();
            setParts(fetchedParts);
        };
    
        loadParts();
    }, []);

    const [orderedParts, setOrderedParts] = useState<InputOrderedPart[]>([]);

    


    // Order Parts
    const [qty, setQty] = useState<number>(-1);
    const [partId, setPartId] = useState<number>(-1);
    const [isSampleSentToOffice, setIsSampleSentToOffice] = useState<boolean>();

    const [forceRender, setForceRender] = useState<number>(0);
    const [forcePartRender, setForcePartRender] = useState<number>(0); 
    const [forceFactorySectionRender, setForceFactorySectionRender] = useState<number>(0);
    const [forceMachineRender, setForceMachineRender] = useState<number>(0);




    // Array to store all parts

    const isAddPartFormComplete =
        partId !== -1 &&
        qty > 0 &&
        (orderType !== "Machine" || (selectedFactorySectionId !== -1 && selectedMachineId !== -1)) &&
        isSampleSentToOffice !== null;
        
    const handleResetOrderParts = () => {
        setQty(-1);
        setPartId(-1);
        setSelectedFactorySectionId(-1);
        setSelectedMachineId(-1); 
        setIsSampleSentToOffice(false);
        setNote('');

        
        setForceRender(prev => prev + 1); 
        setForcePartRender(prev => prev + 1);
        setForceFactorySectionRender(prev => prev + 1);
        setForceMachineRender(prev => prev + 1); 
    };
    

    const handleCreateOrder = async () => {
        setIsSubmitting(true);
        try{
            if (!isOrderFormComplete) {
                toast.error("Please fill out all required fields");
                return;
            }

            if (selectedFactoryId==-1 || departmentId==-1 || !orderType || !description) {
                toast.error("Please fill out all the fields");
                return;
            }
            const createdById = 1; 
            const statusId = 1; 
            const orderData: InputOrder = {
                created_at: new Date().toISOString(), 
                order_note: description, 
                created_by_user_id: createdById,
                department_id: departmentId,
                current_status_id: statusId,
            }
            setTempOrderDetails(orderData);
            setShowPartForm(true);  
            toast.success("Order details are set. Please add parts.");
        } catch (error) {
            toast.error('Error preparing order: ' + error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleAddOrderParts = () => {
        const newOrderedPart = {
            qty: qty,
            order_id: 0, // Will be set when the order is created
            part_id: partId,
            factory_id: selectedFactoryId,
            machine_id: selectedMachineId,
            factory_section_id: selectedFactorySectionId,
            factory_section_name: selectedFactorySectionName,
            machine_number: selectedMachineNumber,
            is_sample_sent_to_office: isSampleSentToOffice ?? false,
            note: note.trim() || null, 
        };
        setOrderedParts(prevOrderedParts => [...prevOrderedParts, { ...newOrderedPart }]);
        handleResetOrderParts();
        
    };

    const handleFinalCreateOrder = async () => {
        setIsSubmitting(true);
        try {
            // Check if the temporary order details are set
            if (!tempOrderDetails) {
                toast.error("No order details to process.");
                return;
            }

            const orderResponse = await insertOrder(tempOrderDetails.created_at,tempOrderDetails.order_note,tempOrderDetails.created_by_user_id,tempOrderDetails.department_id,tempOrderDetails.current_status_id);
            if (orderResponse && orderResponse.length > 0) {
                const orderId = orderResponse[0].id; 
                // toast.success(`Order created with ID: ${orderId}, now adding parts...`);

                const partPromises = orderedParts.map(part =>
                    insertOrderedParts(
                        part.qty,
                        orderId,
                        part.part_id,
                        part.factory_id,
                        part.machine_id,
                        part.factory_section_id,
                        part.is_sample_sent_to_office,
                        part.note || null,
                    )
                );

                await Promise.all(partPromises);
                // toast.success("All parts added successfully!");

                setShowPartForm(false);
                setOrderedParts([]); 

                await InsertStatusTracker((new Date()), orderId, 1, 1);

            } else {
                toast.error("Failed to create order.");
            }
        } catch (error) {
            toast.error(`An error occurred: ${error}`);
        } finally {
            setIsSubmitting(false);
        }
};
    const handleCancelOrder = () => {

        setSelectedFactoryId(-1);
        setDepartmentId(-1);
        setOrderType('');
        setDescription('')
        setTempOrderDetails(null);
        // Navigate('/orders');  
    };

    // const handleResetOrderParts = () => {
    //     setQty(-1);  
    //     setPartId(-1); 
    //     setSelectedMachineId(-1); 
    //     setSelectedFactorySectionId(-1);
    //     setIsSampleSentToOffice(false);  
    //     setNote('');

    // };

    const handleRemovePart = (indexToRemove: number) => {
        setOrderedParts(prevParts => prevParts.filter((_, index) => index !== indexToRemove));
    };

    useEffect(() => {
        const loadFactories = async () => {
            const fetchedFactories = await fetchFactories();
            setFactories(fetchedFactories);
        };
    
        loadFactories();
    }, []);

    useEffect(() => {
        if (selectedFactoryId !== null) {
            const loadFactorySections = async () => {
                const sections = await fetchFactorySections(selectedFactoryId);
                setFactorySections(sections);
            };
    
            loadFactorySections();
        }
    }, [selectedFactoryId]);  

    useEffect(() => {
        const loadMachines = async () => {
            if (selectedFactorySectionId !== -1) {
                const fetchedMachines = await fetchMachines(selectedFactorySectionId);
                setMachines(fetchedMachines);
                setSelectedMachineId(-1); // Reset machine ID when the section changes
                setTimeout(() => setSelectedMachineId(-1), 0); // Clear and reset
            } else {
                setMachines([]);
                setSelectedMachineId(-1); // Reset if no section is selected
            }
        };

        loadMachines();
    }, [selectedFactorySectionId]);

    const handleSelectPart = (value: number) => {
        if (partId === value) {
            setPartId(-1); // Temporarily clear the selection
            setTimeout(() => {
                setPartId(value);
                setForcePartRender(prev => prev + 1); // Force re-render to reset the dropdown
            }, 0);
        } else {
            setPartId(value);
        }
    };

    const handleSelectFactorySection = (value: number) => {
        if (selectedFactorySectionId === value) {
            setSelectedFactorySectionId(-1); // Temporarily clear the selection
            setTimeout(() => {
                setSelectedFactorySectionId(value);
                setForceFactorySectionRender(prev => prev + 1); // Force re-render to reset the dropdown
            }, 0);
        } else {
            setSelectedFactorySectionId(value);
        }
    };

    const handleSelectMachine = (value: number) => {
        if (selectedMachineId === value) {
            setSelectedMachineId(-1); // Temporarily clear the selection
            setTimeout(() => {
                setSelectedMachineId(value);
                setForceMachineRender(prev => prev + 1); // Force re-render to reset the dropdown
            }, 0);
        } else {
            setSelectedMachineId(value);
        }
    };


    return (
        <>
            <NavigationBar/>
            <div className="grid flex-1 items-start gap-4 p-5 sm:px-6 sm:py-5 md:gap-8">
                <Card>
    
                    <CardHeader>
                        <CardTitle>Order Details</CardTitle>
                        <CardDescription>Start creating an order</CardDescription>
                    </CardHeader>
    
                    <CardContent>
                        <div className="grid gap-6">
                            {/* Factory */}
                            <Select onValueChange={(value) => setSelectedFactoryId(Number(value))}>
                                <Label htmlFor="factoryName">Factory Name</Label>
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue>{selectedFactoryName}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {factories.map((factory) => (
                                        <SelectItem key={factory.id} value={factory.id.toString()}>
                                            {factory.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* Department */}
                            <Select onValueChange={(value) => setDepartmentId(Number(value))}>
                                <Label htmlFor="department">Department</Label>
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue>{selectedDepartmentName || "Select Department"}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id.toString()}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* OrderType */}
                            <Select onValueChange={setOrderType}>
                                <Label htmlFor="orderType">Is this Order for Storage or a Machine?</Label>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue>{orderType || "Select an Option"}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Storage">Storage</SelectItem>
                                    <SelectItem value="Machine">Machine</SelectItem>
                                </SelectContent>
                            </Select>
                            {/* Order Description */}
                            <div className="grid gap-3">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    defaultValue=""
                                    className="min-h-32"
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>
                            {/* Buttons for Main Order*/}
                            <div className="flex flex-1 gap-4 py-5">
                                {isSubmitting ? (
                                    <div className="ml-auto flex items-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        Creating Order..."
                                    </div>
                                ) : (
                                    <>
                                        {!tempOrderDetails && (
                                        <Button 
                                            size="sm"
                                            className="ml-auto gap-2"
                                            onClick={handleCreateOrder}
                                            disabled={!isOrderFormComplete}  // Disable the button
                                        >
                                            <CirclePlus className="h-4 w-4" />Start Order
                                        </Button>
                                        )}
                                        <Link to="/orders">
                                            <Button 
                                                size="sm" 
                                                className="ml-auto gap-2"
                                                onClick={handleCancelOrder}
                                            >
                                                <CircleX className="h-4 w-4" />
                                                Cancel
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
    
                {/* PART SELECTION AND DETAILS CARD */}
                {showPartForm && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Parts</CardTitle>
                            <CardDescription>Start adding parts to your order</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                                {/* Left side: Part Selection */}
                                <div className="space-y-4">
                                    <div className="mt-2">
                                        <Select
                                            key={`part-${forcePartRender}`} // Key prop to force re-rendering
                                            onValueChange={(value) => handleSelectPart(Number(value))}
                                            >
                                            <Label htmlFor="partId">Select Part</Label>
                                            <SelectTrigger className="w-[220px]">
                                                <SelectValue>{partId !== -1 ? parts.find(p => p.id === partId)?.name : "Select Part"}</SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {parts.map((part) => (
                                                    <SelectItem key={part.id} value={part.id.toString()}>
                                                        {part.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {/* Selecting Part ID */}

    
                                    {/* Setting QTY */}
                                    <div className="flex flex-col space-y-2">
                                        <Label htmlFor="quantity" className="font-medium">Quantity</Label>
                                        <input
                                            id="quantity"
                                            type="number"
                                            value={qty >= 0 ? qty : ''}
                                            onChange={e => setQty(Number(e.target.value))}
                                            placeholder="Enter Quantity"
                                            className="input input-bordered w-[220px] max-w-xs p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    

                                    {orderType === "Machine" && (
                                        <>
                                            {/* Factory Section Id */}
                                            <div className="mt-2">
                                                <Select
                                                    key={`factory-section-${forceFactorySectionRender}`} // Key prop to force re-rendering
                                                    onValueChange={(value) => handleSelectFactorySection(Number(value))}
                                                    >
                                                    <Label htmlFor="factorySection">Factory Section</Label>
                                                    <SelectTrigger className="w-[220px]">
                                                        <SelectValue>{selectedFactorySectionId !== -1 ? factorySections.find(s => s.id === selectedFactorySectionId)?.name : "Select Section"}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {factorySections.map((section) => (
                                                            <SelectItem key={section.id} value={section.id.toString()}>
                                                                {section.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            
                                            {/* Machine Id */}
                                            <div className="mt-2">
                                                <Select
                                                    onValueChange={(value) => handleSelectMachine(Number(value))}
                                                    key={`machine-${forceMachineRender}`}
                                                >
                                                    <Label htmlFor="machine">Machine</Label>
                                                    <SelectTrigger className="w-[220px]">
                                                        <SelectValue>{selectedMachineId !== -1 ? machines.find(m => m.id === selectedMachineId)?.number.toString() : "Select Machine"}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {machines.map((machine) => (
                                                            <SelectItem key={machine.id} value={machine.id.toString()}>
                                                                {machine.number.toString()}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    )}
                                    

                                    {/* Sample Sent to Office */}
                                    <div className="flex items-center gap-2 leading-none">
                                        <label
                                            htmlFor="sampleSentToOffice"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Is Sample Sent to Office?
                                        </label>
                                        <Checkbox
                                            id="sampleSentToOffice"
                                            checked={isSampleSentToOffice}
                                            onCheckedChange={(checked) => setIsSampleSentToOffice(checked === true)}
                                            className="h-5 w-5 border-gray-300 rounded focus:ring-gray-500 checked:bg-gray-600 checked:border-transparent"
                                            />
                                        <p className="text-sm text-muted-foreground">
                                            {isSampleSentToOffice ? "Yes" : "No"}
                                        </p>
                                    </div>


                                    {/* Note */}
                                    <div className="flex flex-col space-y-2">
                                        <Label htmlFor="note" className="font-medium">Note (Optional)</Label>
                                        <Textarea
                                            id="note"
                                            value={note || ''}
                                            onChange={e => setNote(e.target.value)}
                                            placeholder="Enter any notes"
                                            className="min-h-24 w-3/4"  
                                        />
                                    </div>

                                    <div className="flex justify-start">
                                        <Button 
                                            size="sm"
                                            onClick={handleAddOrderParts}
                                            disabled={!isAddPartFormComplete}
                                        >
                                            <CirclePlus className="h-4 w-4" />
                                            Add Parts
                                        </Button>
                                    </div>
                                </div>
    
                                {/* Right side: List of Added Parts */}
                                <div className="space-y-4 p-3">
                                    <h4 className="font-bold mb-2">Added Parts</h4>
                                    <ul className="space-y-2">
                                        {orderedParts.map((part, index) => (
                                            <li key={index} className="relative p-4 border rounded-lg bg-gray-100">
                                                {/* <Button
                                                    onClick={() => handleRemovePart(index)}
                                                    className="absolute -top-3 -right-3 text-white rounded-full h-8 w-8 flex items-center justify-center hover:bg-red-700 focus:outline-none"
                                                >
                                                    ✖
                                                </Button> */}
                                                <CircleX
                                                    width = "28px"
                                                    height= "22px"
                                                    className="absolute -top-3 -right-3"
                                                    onClick={() => handleRemovePart(index)}
                                                >
                                                    {/* <CircleX className="h-4 w-4" /> */}
                                                    
                                                </CircleX>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p><strong>Part:</strong> {parts.find(p => p.id === part.part_id)?.name || "Unknown"}</p>
                                                        <p><strong>Quantity:</strong> {part.qty}</p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between">
                                                    <p><strong>Factory Section:</strong> {part.factory_section_name || "Unknown"}</p>
                                                    <p><strong>Machine:</strong> {part.machine_number || "Unknown"}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            {/* Buttons for adding parts and finalizing the order */}
                            <div className="flex justify-end mt-4">

                                <Link to="/orders">
                                    <Button
                                        size="sm"
                                        onClick={handleFinalCreateOrder}
                                        disabled={orderedParts.length === 0}
                                    >
                                        <CircleCheck className="h-4 w-4" />
                                        Finalize Order
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

export default CreateOrderPage