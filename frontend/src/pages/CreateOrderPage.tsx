import { Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import NavigationBar from "../components/customui/NavigationBar"
import { Button } from "../components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CirclePlus, CircleX, Loader2, CircleCheck, X } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import ReactSelect from 'react-select'
import { fetchOrderByReqNumandFactory, insertOrder, insertOrderStorage } from "@/services/OrdersService";

import toast from 'react-hot-toast'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { fetchFactories, fetchFactorySections, fetchDepartments } from '@/services/FactoriesService';
import { fetchAllMachines, setMachineIsRunningById } from "@/services/MachineServices"
import { insertOrderedParts } from '@/services/OrderedPartsService';
import { fetchAllParts } from "@/services/PartsService"
import { Part } from "@/types"
import { InsertStatusTracker } from "@/services/StatusTrackerService"
import { fetchStoragePartQuantityByFactoryID } from "@/services/StorageService"
import { useAuth } from "@/context/AuthContext"
import { Input } from "@/components/ui/input"
import { fetchAppSettings } from "@/services/AppSettingsService"




interface Department {
    id: number;
    name: string;
}

interface Factory {
    id: number;
    name: string;
}
interface FactorySection {
    id: number;
    name: string;
    factory_id?: number;
}

interface Machine {
    id: number;
    name: string;
    factory_section_id?: number;
}

interface InputOrder {
    req_num: string,
    order_note: string,
    created_by_user_id: number,
    department_id: number,
    factory_id: number,
    factory_section_id: number,
    machine_id: number,
    machine_name: string,
    current_status_id: number,
    order_type: string,
}

interface InputOrderedPart {
    qty: number;
    unit: string | null;
    order_id: number;
    part_id: number;
    factory_id: number;
    machine_id: number;
    factory_section_id: number;
    factory_section_name: string;
    machine_name: string;
    is_sample_sent_to_office: boolean,
    note?: string | null;
    in_storage: boolean;
    approved_storage_withdrawal: boolean;
}

const CreateOrderPage = () => {

    const profile = useAuth().profile
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [factories, setFactories] = useState<Factory[]>([]);
    const [selectedFactoryId, setSelectedFactoryId] = useState<number>(-1);
    const selectedFactoryName = factories.find(factory => factory.id === selectedFactoryId)?.name || "Select Factory";

    const [factorySections, setFactorySections] = useState<FactorySection[]>([]);
    const [selectedFactorySectionId, setSelectedFactorySectionId] = useState<number>(-1);
    const selectedFactorySectionName = factorySections.find(section => section.id === selectedFactorySectionId)?.name || "Select Section";

    const [machines, setMachines] = useState<Machine[]>([]);
    const [selectedMachineId, setSelectedMachineId] = useState<number>(-1);
    const selectedMachineName = machines.find(machine => machine.id === selectedMachineId)?.name || '';
    const [departments, setDepartments] = useState<Department[]>([]);
    const [departmentId, setDepartmentId] = useState<number>(-1);
    const selectedDepartmentName = departmentId !== -1 ? departments.find(dept => dept.id === departmentId)?.name : "Select Department";

    const [orderType, setOrderType] = useState('');
    const [description, setDescription] = useState('');
    const [note, setNote] = useState('');

    const [searchQueryParts, setSearchQueryParts] = useState<string>('');
    const [isPartsSelectOpen, setIsPartsSelectOpen] = useState(false);

    const [reqNum, setReqNum] = useState('')

    const [tempOrderDetails, setTempOrderDetails] = useState<InputOrder | null>(null);
    const [showPartForm, setShowPartForm] = useState(false); // To toggle part addition form visibility
    const isOrderFormComplete =
        reqNum.trim() &&
        selectedFactoryId !== -1 &&
        departmentId !== -1 &&
        description.trim() &&
        (orderType !== 'Machine' || (selectedFactorySectionId !== -1 && selectedMachineId !== -1));
    const [isOrderStarted, setIsOrderStarted] = useState(false);


    const [parts, setParts] = useState<Part[]>([]);
    useEffect(() => {
        const loadParts = async () => {
            const fetchedParts = await fetchAllParts();
            setParts(fetchedParts);
        };

        loadParts();
    }, []);

    const [orderedParts, setOrderedParts] = useState<InputOrderedPart[]>([]);

    const partsSectionRef = useRef<HTMLDivElement | null>(null);

    const navigate = useNavigate()




    // Order Parts
    const [qty, setQty] = useState<number>(-1);
    const [partId, setPartId] = useState<number>(-1);
    const [isSampleSentToOffice, setIsSampleSentToOffice] = useState<boolean>();

    const [forceRender, setForceRender] = useState<number>(0);
    const [forcePartRender, setForcePartRender] = useState<number>(0);
    const [forceFactorySectionRender, setForceFactorySectionRender] = useState<number>(0);
    const [forceMachineRender, setForceMachineRender] = useState<number>(0);


    const [addPartEnabled, setaddPartEnabled] = useState<boolean>(false);

    // Array to store all parts

    const isAddPartFormComplete =
        partId !== -1 &&
        qty > 0 &&
        // (orderType !== "Machine" || (selectedFactorySectionId !== -1 && selectedMachineId !== -1)) &&
        isSampleSentToOffice !== null;

    const handleResetOrderParts = () => {
        setQty(-1);
        setPartId(-1);
        setIsSampleSentToOffice(false);
        setNote('');


        setForceRender(prev => prev + 1);
        setForcePartRender(prev => prev + 1);
        setForceFactorySectionRender(prev => prev + 1);
        setForceMachineRender(prev => prev + 1);
    };


    const handleCreateOrder = async () => {


        setIsSubmitting(true);
        try {
            if (!isOrderFormComplete) {
                toast.error("Please fill out all required fields");
                return;
            }

            if (!profile) {
                toast.error("No profile found")
                return
            }

            const fetchedReqNum = (await fetchOrderByReqNumandFactory(reqNum, selectedFactoryId)) ?? [];
            if (fetchedReqNum.length > 0) {
                toast.error("This Requisition Number has already been used in another order for this factory");
                setReqNum('');
                return;
            }

            setReqNum(reqNum.trim())
            const createdById = profile.id;
            const statusId = 1;
            const orderData: InputOrder = {
                req_num: reqNum,
                order_note: description,
                created_by_user_id: createdById,
                department_id: departmentId,
                factory_id: selectedFactoryId,
                factory_section_id: selectedFactorySectionId,
                machine_id: selectedMachineId,
                machine_name: selectedMachineName,
                current_status_id: statusId,
                order_type: orderType,
            };
            setTempOrderDetails(orderData);
            setShowPartForm(true); // This triggers the scroll due to useEffect
            setIsOrderStarted(true);
            toast.success("Order details are set. Please add parts.");




        } catch (error) {
            toast.error('Error preparing order: ' + error);
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleAddOrderParts = async () => {

        // console.log("Factory Section in second create order ", selectedFactorySectionId);

        // console.log("Machine in second create order ", selectedMachineId);

        const isPartAlreadyAdded = orderedParts.some(part => part.part_id === partId);

        if (isPartAlreadyAdded) {
            toast.error('This part has already been added.'); // Show an error message
            return; // Exit the function to prevent adding the same part
        }

        const storage_data = await fetchStoragePartQuantityByFactoryID(partId, selectedFactoryId)

        if (orderType === "Machine" && storage_data.length > 0 && storage_data[0].qty > 0) {

            const newOrderedPart: InputOrderedPart = {
                qty: qty,
                unit: "",
                order_id: 0, // Will be set when the order is created
                part_id: partId,
                factory_id: selectedFactoryId,
                machine_id: selectedMachineId,
                factory_section_id: selectedFactorySectionId,
                factory_section_name: selectedFactorySectionName,
                machine_name: selectedMachineName,
                is_sample_sent_to_office: isSampleSentToOffice ?? false,
                note: note.trim() || null,
                in_storage: true,
                approved_storage_withdrawal: false
            };
            setOrderedParts(prevOrderedParts => [...prevOrderedParts, { ...newOrderedPart }]);
            handleResetOrderParts();
        }
        else {
            const newOrderedPart = {
                qty: qty,
                unit: "",
                order_id: 0, // Will be set when the order is created
                part_id: partId,
                factory_id: selectedFactoryId,
                machine_id: selectedMachineId,
                factory_section_id: selectedFactorySectionId,
                factory_section_name: selectedFactorySectionName,
                machine_name: selectedMachineName,
                is_sample_sent_to_office: isSampleSentToOffice ?? false,
                note: note.trim() || null,
                in_storage: false,
                approved_storage_withdrawal: false
            };
            setOrderedParts(prevOrderedParts => [...prevOrderedParts, { ...newOrderedPart }]);
            handleResetOrderParts();
        }


    };

    const handleFinalCreateOrder = async () => {



        setIsSubmitting(true);
        try {
            // Check if the temporary order details are set
            if (!tempOrderDetails) {
                toast.error("No order details to process.");
                return;
            }
            if (!profile) {
                toast.error("No profile found")
                return
            }
            let orderResponse;


            if (orderType == "Machine") {
                orderResponse = await insertOrder(
                    tempOrderDetails.req_num,
                    tempOrderDetails.order_note,
                    tempOrderDetails.created_by_user_id,
                    tempOrderDetails.department_id,
                    tempOrderDetails.factory_id,
                    tempOrderDetails.factory_section_id,
                    tempOrderDetails.machine_id,
                    1, //Current Status
                    tempOrderDetails.order_type,
                );
            }
            else {
                orderResponse = await insertOrderStorage(
                    tempOrderDetails.req_num,
                    tempOrderDetails.order_note,
                    tempOrderDetails.created_by_user_id,
                    tempOrderDetails.department_id,
                    tempOrderDetails.factory_id,
                    1, //Current Status
                    tempOrderDetails.order_type,
                );
            }
            if (orderResponse.data && orderResponse.data.length > 0) {
                const orderId = orderResponse.data[0].id;
                // toast.success(`Order created with ID: ${orderId}, now adding parts...`);

                const partPromises = orderedParts.map(part =>
                    insertOrderedParts(
                        part.qty,
                        orderId,
                        part.part_id,
                        part.is_sample_sent_to_office,
                        part.note || null,
                        part.in_storage,
                        part.approved_storage_withdrawal
                    )
                );

                await Promise.all(partPromises);
                // toast.success("All parts added successfully!");

                setShowPartForm(false);
                setOrderedParts([]);

                await InsertStatusTracker((new Date()), orderId, 1, 1);
                if (orderType == "Machine") {
                    setMachineIsRunningById(selectedMachineId, false);
                }
            } else {
                toast.error("Failed to create order.");
                return;
            }
        } catch (error) {
            toast.error(`An error occurred: ${error}`);
        } finally {
            setIsSubmitting(false)
            navigate('/orders');
        }
    };
    const handleCancelOrder = () => {
        setSelectedFactoryId(-1);
        setDepartmentId(-1);
        setOrderType('');
        setDescription('')
        setTempOrderDetails(null);
    };



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
        const loadDepartments = async () => {
            try {
                const fetchedDepartments = await fetchDepartments();
                setDepartments(fetchedDepartments);
            } catch (error) {
                toast.error('Failed to load departments');
            }
        };

        loadDepartments();
    }, []);

    useEffect(() => {
        const loadAddPartSettings = async () => {
            try {
                const settings_data = await fetchAppSettings()
                if (settings_data) {
                    settings_data.forEach((setting) => {
                        if (setting.name === "Add Part") {
                            setaddPartEnabled(setting.enabled)
                        }
                    })
                }
            } catch (error) {
                toast.error("Could not load settings data")
                setaddPartEnabled(false)
            }
        }
        loadAddPartSettings();
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
                const fetchedMachines = await fetchAllMachines(selectedFactorySectionId);
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

    useEffect(() => {
        if (showPartForm && partsSectionRef.current) {
            partsSectionRef.current.scrollIntoView({ behavior: 'smooth' }); // Auto-scroll to the parts section
        }
    }, [showPartForm]); // Dependency on showPartForm to trigger the scroll


    useEffect(() => {
        if (isPartsSelectOpen) {
            const loadParts = async () => {
                const fetchedParts = await fetchAllParts();
                setParts(fetchedParts);
            };

            loadParts(); // Refetch parts when the dropdown is opened
        }
    }, [isPartsSelectOpen]); // Run when dropdown is opened

    const reloadParts = async () => {
        try {
            const fetchedParts = await fetchAllParts();
            setParts(fetchedParts);
        } catch (error) {
            console.error("Failed to reload parts:", error);
            toast.error("Error loading parts");
        }
    };

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
            <NavigationBar />
            <div className="grid flex-1 items-start gap-4 p-5 sm:px-6 sm:py-5 md:gap-8">
                <Card>

                    <CardHeader>
                        <CardTitle>Order Details</CardTitle>
                        <CardDescription>Start creating an order</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="grid gap-6">

                            {/*Req Num*/}
                            <div className="grid gap-3">
                                <Label htmlFor="req_num">Requisition Number</Label>
                                <Input
                                    id="req_num"
                                    value={reqNum} // Bind the input value to reqNum state
                                    className="w-[220px]"
                                    onChange={e => setReqNum(e.target.value)} // Update state on every keystroke
                                    onBlur={() => setReqNum(reqNum.replace(/\s+/g, ''))} // Remove all spaces on blur
                                    disabled={isOrderStarted}
                                />
                            </div>
                            {/* Factory */}
                            <Select onValueChange={(value) => setSelectedFactoryId(Number(value))} disabled={isOrderStarted}>
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
                            <Select onValueChange={(value) => setDepartmentId(Number(value))} disabled={isOrderStarted}>
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
                            <Select onValueChange={setOrderType} disabled={isOrderStarted}>
                                <Label htmlFor="orderType">Is this Order for Storage or a Machine?</Label>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue>{orderType || "Select an Option"}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Storage">Storage</SelectItem>
                                    <SelectItem value="Machine">Machine</SelectItem>
                                </SelectContent>
                            </Select>

                            {orderType !== "Storage" && (
                                <>
                                    {/* Factory Section Id */}
                                    <Select
                                        onValueChange={(value) => handleSelectFactorySection(Number(value))}
                                        disabled={isOrderStarted || selectedFactoryId === -1} // Disabled if no factory is selected
                                    >
                                        <Label htmlFor="factorySection">Factory Section</Label>
                                        <SelectTrigger className="w-[220px]">
                                            <SelectValue>
                                                {selectedFactorySectionId !== -1
                                                    ? factorySections.find(s => s.id === selectedFactorySectionId)?.name
                                                    : "Select Section"}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {factorySections.map((section) => (
                                                <SelectItem key={section.id} value={section.id.toString()}>
                                                    {section.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Machine Id */}
                                    <Select
                                        onValueChange={(value) => handleSelectMachine(Number(value))}
                                        disabled={isOrderStarted || selectedFactorySectionId === -1} // Disabled if no factory section is selected
                                    >
                                        <Label htmlFor="machine">Machine</Label>
                                        <SelectTrigger className="w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">

                                            <SelectValue>
                                                {selectedMachineId !== -1
                                                    ? machines.find(m => m.id === selectedMachineId)?.name // Show the selected machine name if available
                                                    : tempOrderDetails?.machine_name || "Select Machine" // Fall back to tempOrderDetails.machine_name or "Select Machine"
                                                }
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {machines
                                                .sort((a, b) => a.id - b.id) // Sorting machines by ID in ascending order
                                                .map((machine) => (
                                                    <SelectItem key={machine.id} value={machine.id.toString()}>
                                                        {machine.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </>
                            )}

                            {/* Order Description */}
                            <div className="grid gap-3">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    defaultValue=""
                                    className="min-h-32"
                                    onChange={e => setDescription(e.target.value)}
                                    disabled={isOrderStarted}
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
                    <div ref={partsSectionRef}>
                        <Card>
                            <CardHeader className="flex justify-between items-start w-full flex-row">
                                {/* Left Side */}
                                <div className="flex flex-col text-left w-1/2">
                                    <CardTitle className="text-lg font-bold">Add Parts</CardTitle>
                                    <CardDescription className="text-sm hidden sm:block">Start adding parts to your order</CardDescription>
                                </div>

                                {/* Right Side */}
                                <div className="flex flex-col text-left w-1/2">
                                    <CardTitle className="text-lg font-bold">{selectedFactoryName}</CardTitle>
                                    <CardDescription className="text-sm">{
                                        tempOrderDetails?.order_type === "Storage"
                                            ? "Storage"
                                            : `${factorySections.find(s => s.id === selectedFactorySectionId)?.name || ""} ${tempOrderDetails?.machine_name || "N/A"} `

                                    }</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                                    {/* Left side: Part Selection */}
                                    <div className="space-y-4">
                                        <div className="mt-2">
                                            <Label htmlFor="partId">Select Part</Label>
                                            <ReactSelect
                                                id="partId"
                                                options={parts
                                                    .filter((part) =>
                                                        part.name.toLowerCase().includes(searchQueryParts.toLowerCase())
                                                    )
                                                    .sort((a, b) => a.name.localeCompare(b.name)) // Sort parts alphabetically
                                                    .map((part) => ({
                                                        value: part.id,
                                                        label: `${part.name} (${part.unit || 'units'})`,
                                                        isDisabled: orderedParts.some((p) => p.part_id === part.id), // Disable parts already added
                                                    }))}
                                                onChange={(selectedOption) =>
                                                    handleSelectPart(Number(selectedOption?.value))

                                                }
                                                onMenuOpen={reloadParts}
                                                isSearchable
                                                placeholder="Search or Select a Part"
                                                value={partId > 0 ? { value: partId, label: parts.find(p => p.id === partId)?.name } : null}
                                                className="w-[260px]"

                                            />
                                            {/* Optional Create New Part Button */}
                                            {addPartEnabled && (
                                                <div className="mt-2">
                                                    <Button
                                                        size="sm"
                                                        className="w-[220px] bg-blue-950"
                                                        onClick={() => window.open('/addpart', '_blank')}
                                                    >
                                                        Create New Part
                                                    </Button>
                                                </div>
                                            )}
                                        </div>



                                        {/* Setting QTY */}
                                        <div className="flex flex-col space-y-2">
                                            <Label htmlFor="quantity" className="font-medium"> {`Quantity${partId !== -1 ? ` in ${parts.find((p) => p.id === partId)?.unit || ''}` : ''}`}</Label>
                                            <input
                                                id="quantity"
                                                type="number"
                                                value={qty >= 0 ? qty : ''}
                                                onChange={e => setQty(Number(e.target.value))}
                                                placeholder={
                                                    partId !== -1
                                                        ? `Enter quantity in ${parts.find((p) => p.id === partId)?.unit || 'units'}`
                                                        : 'Enter quantity'
                                                }
                                                className="input input-bordered w-[220px] max-w-xs p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>



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
                                                <li key={index} className="border rounded-lg bg-gray-100 ">
                                                    {/* Top right remove button */}


                                                    {/* Flex container to align Part and Quantity side by side */}
                                                    <div className="flex justify-between items-center ml-2 mr-2 mt-4 mb-4">
                                                        <p><strong>Part:</strong> {parts.find(p => p.id === part.part_id)?.name || "Unknown"}</p>
                                                        <div className="flex items-center ml-auto">
                                                            <p><strong>Quantity:</strong> {part.qty}</p>
                                                            <div
                                                                className="cursor-pointer bg-stone-300 hover:bg-orange-600 rounded-full w-5 h-5 border-1 border-black flex items-center justify-center ml-4 transition-colors duration-200"
                                                                onClick={() => handleRemovePart(index)}
                                                            >
                                                                <X className="text-black stroke-[2] h-4 w-4" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                {/* Buttons for adding parts and finalizing the order */}
                                <div className="flex justify-end mt-4">
                                    <Button
                                        size="sm"
                                        onClick={handleFinalCreateOrder}
                                        disabled={orderedParts.length === 0}
                                    >
                                        <CircleCheck className="h-4 w-4" />
                                        Finalize Order
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                )}
            </div>
        </>
    );
}

export default CreateOrderPage