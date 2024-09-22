import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { fetchFactories, fetchFactorySections, fetchDepartments } from '@/services/FactoriesService';
import { fetchMachines } from '@/services/MachineServices';
import { fetchStatuses } from '@/services/StatusesService';

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
    number: number;
    type: string;
    factory_section_id?: number;
}

interface Status {
    id: number;
    name: string;
    comment: string;
}

interface FilterConfig {
    type: 'factory' | 'factorySection' | 'machine' | 'department' | 'status' | 'id' | 'date' | 'storageId' | 'partName' | 'partId' | 'orderType';
    label: string;
}

interface SearchAndFilterProps {
    filterConfig: FilterConfig[];
    onApplyFilters: (filters: any) => void;
    onResetFilters: () => void;
    hideDefaultIdDateSearch?: boolean;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
    filterConfig,
    onApplyFilters,
    onResetFilters,
    hideDefaultIdDateSearch = false, // Default value is false
}) => {
    const [factories, setFactories] = useState<Factory[]>([]);
    const [factorySections, setFactorySections] = useState<FactorySection[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [statuses, setStatuses] = useState<Status[]>([]);

    const [selectedFactoryId, setSelectedFactoryId] = useState<number>(-1);
    const [selectedFactorySectionId, setSelectedFactorySectionId] = useState<number>(-1);
    const [selectedMachineId, setSelectedMachineId] = useState<number>(-1);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number>(-1);
    const [selectedStatusId, setSelectedStatusId] = useState<number>(-1);
    const [searchType, setSearchType] = useState<'id' | 'date'>('id');
    const [searchQuery, setSearchQuery] = useState('');
    const [tempDate, setTempDate] = useState<Date | undefined>(undefined);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const [storageIdQuery, setStorageIdQuery] = useState('');
    const [partNameQuery, setPartNameQuery] = useState('');
    const [partIdQuery, setPartIdQuery] = useState('');

    const [selectedOrderType, setSelectedOrderType] = useState<'all' | 'Machine' | 'Storage'>('all');

    useEffect(() => {
        // Fetch all necessary data when component mounts
        const fetchData = async () => {
            const fetchedFactories = await fetchFactories();
            setFactories(fetchedFactories);

            const fetchedDepartments = await fetchDepartments();
            setDepartments(fetchedDepartments);

            const fetchedStatuses = await fetchStatuses();
            setStatuses(fetchedStatuses);
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (selectedFactoryId !== -1) {
            // Fetch factory sections when a factory is selected
            const fetchSections = async () => {
                const fetchedSections = await fetchFactorySections(selectedFactoryId);
                setFactorySections(fetchedSections);
                setSelectedFactorySectionId(-1); // Reset factory section and machine selections
                setSelectedMachineId(-1);
            };

            fetchSections();
        }
    }, [selectedFactoryId]);

    useEffect(() => {
        if (selectedFactorySectionId !== -1) {
            // Fetch machines when a factory section is selected
            const fetchMachinesData = async () => {
                const fetchedMachines = await fetchMachines(selectedFactorySectionId);
                setMachines(fetchedMachines);
                setSelectedMachineId(-1); // Reset machine selection
            };

            fetchMachinesData();
        }
    }, [selectedFactorySectionId]);

    const handleSearchTypeChange = (type: 'id' | 'date') => {
        setSearchType(type);
        if (type === 'date') {
            setIsCalendarOpen(true);
        } else {
            setIsCalendarOpen(false);
        }
    };

    const handleApplyFilters = () => {
        const filters = {
            searchType,
            searchQuery,
            selectedDate: tempDate,
            selectedFactoryId: selectedFactoryId === -1 ? undefined : selectedFactoryId,
            selectedFactorySectionId: selectedFactorySectionId === -1 ? undefined : selectedFactorySectionId,
            selectedMachineId: selectedMachineId === -1 ? undefined : selectedMachineId,
            selectedDepartmentId: selectedDepartmentId === -1 ? undefined : selectedDepartmentId,
            selectedStatusId: selectedStatusId === -1 ? undefined : selectedStatusId,
            storageIdQuery,
            partNameQuery,
            partIdQuery,
            selectedOrderType,
        };
        onApplyFilters(filters);
    };

    const handleResetFilters = () => {
        setSearchType('id');
        setSearchQuery('');
        setTempDate(undefined);
        setSelectedFactoryId(-1);
        setSelectedFactorySectionId(-1);
        setSelectedMachineId(-1);
        setSelectedDepartmentId(-1);
        setSelectedStatusId(-1);
        setStorageIdQuery('');
        setPartNameQuery('');
        setPartIdQuery('');
        setSelectedOrderType('all');
        onResetFilters();
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="default">Search & Filters</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:w-[540px] h-full sm:h-auto overflow-auto" side="right">
                <SheetHeader>
                    <SheetTitle>Search & Filter Orders</SheetTitle>
                    <SheetDescription>Use the filters below to search for orders.</SheetDescription>
                </SheetHeader>

                <div className="grid gap-4 py-4 px-2">
                    {/* Search by ID and Date Buttons */}
                    {!hideDefaultIdDateSearch && (
                        <>
                            {/* Search by ID and Date Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    variant={searchType === 'id' ? 'default' : 'outline'}
                                    onClick={() => handleSearchTypeChange('id')}
                                    className="w-full"
                                >
                                    Search by ID
                                </Button>
                                <Button
                                    variant={searchType === 'date' ? 'default' : 'outline'}
                                    onClick={() => handleSearchTypeChange('date')}
                                    className="w-full"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    Search by Date
                                </Button>
                            </div>

                            {/* Conditional Rendering based on Search Type */}
                            {searchType === 'id' && (
                                <div className="flex flex-col">
                                    <Label className="mb-2">Enter ID</Label>
                                    <Input
                                        type="search"
                                        placeholder="Search by ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            )}

                            {searchType === 'date' && isCalendarOpen && (
                                <div className="flex flex-col">
                                    <Label className="mb-2">Select Date</Label>
                                    <Calendar
                                        mode="single"
                                        selected={tempDate}
                                        onSelect={setTempDate}
                                        className="rounded-md border"
                                    />
                                    <Button
                                        onClick={() => setIsCalendarOpen(false)}
                                        className="bg-blue-950 text-white px-4 py-2 rounded-md mt-2 w-full"
                                    >
                                        Confirm
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Factory, Department, Status, etc. Filters */}
                    {filterConfig.map((filter) => {
                        switch (filter.type) {
                            case 'factory':
                                return (
                                    <div className="flex flex-col" key={filter.type}>
                                        <Label className="mb-2">{filter.label}</Label>
                                        <Select
                                            value={selectedFactoryId === -1 ? "all" : selectedFactoryId.toString()}
                                            onValueChange={(value) => {
                                                const factoryId = value === 'all' ? -1 : Number(value);
                                                setSelectedFactoryId(factoryId);
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue>
                                                    {selectedFactoryId === -1 ? "All Factories" : factories.find(f => f.id === selectedFactoryId)?.name}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Factories</SelectItem>
                                                {factories.map(factory => (
                                                    <SelectItem key={factory.id} value={factory.id.toString()}>
                                                        {factory.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                );
                            case 'factorySection':
                                return (
                                    <div className="flex flex-col" key={filter.type}>
                                        <Label className="mb-2">{filter.label}</Label>
                                        <Select
                                            value={selectedFactorySectionId === -1 ? "all" : selectedFactorySectionId.toString()}
                                            onValueChange={(value) => {
                                                const sectionId = value === 'all' ? -1 : Number(value);
                                                setSelectedFactorySectionId(sectionId);
                                            }}
                                            disabled={selectedFactoryId === -1}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue>
                                                    {selectedFactorySectionId === -1 ? "All Sections" : factorySections.find(s => s.id === selectedFactorySectionId)?.name}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Sections</SelectItem>
                                                {factorySections.map(section => (
                                                    <SelectItem key={section.id} value={section.id.toString()}>
                                                        {section.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                );
                            case 'machine':
                                return (
                                    <div className="flex flex-col" key={filter.type}>
                                        <Label className="mb-2">{filter.label}</Label>
                                        <Select
                                            value={selectedMachineId === -1 ? "all" : selectedMachineId.toString()}
                                            onValueChange={(value) => setSelectedMachineId(value === 'all' ? -1 : Number(value))}
                                            disabled={selectedFactorySectionId === -1}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue>
                                                    {selectedMachineId === -1 ? "All Machines" : machines.find(m => m.id === selectedMachineId)?.number}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Machines</SelectItem>
                                                {machines.map(machine => (
                                                    <SelectItem key={machine.id} value={machine.id.toString()}>
                                                        {machine.number}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                );
                            case 'department':
                                return (
                                    <div className="flex flex-col" key={filter.type}>
                                        <Label className="mb-2">{filter.label}</Label>
                                        <Select
                                            value={selectedDepartmentId === -1 ? "all" : selectedDepartmentId.toString()}
                                            onValueChange={(value) => setSelectedDepartmentId(value === 'all' ? -1 : Number(value))}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue>
                                                    {selectedDepartmentId === -1 ? "All Departments" : departments.find(d => d.id === selectedDepartmentId)?.name}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Departments</SelectItem>
                                                {departments.map(dept => (
                                                    <SelectItem key={dept.id} value={dept.id.toString()}>
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                );
                            case 'status':
                                return (
                                    <div className="flex flex-col" key={filter.type}>
                                        <Label className="mb-2">{filter.label}</Label>
                                        <Select
                                            value={selectedStatusId === -1 ? "all" : selectedStatusId.toString()}
                                            onValueChange={(value) => setSelectedStatusId(value === 'all' ? -1 : Number(value))}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue>
                                                    {selectedStatusId === -1 ? "All Statuses" : statuses.find(s => s.id === selectedStatusId)?.name}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                {statuses.map(status => (
                                                    <SelectItem key={status.id} value={status.id.toString()}>
                                                        {status.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                );

                            case 'storageId':
                                return (
                                    <div className="flex flex-col" key={filter.type}>
                                        <Label className="mb-2">{filter.label}</Label>
                                        <Input
                                            type="search"
                                            placeholder="Search by Storage ID..."
                                            value={storageIdQuery}
                                            onChange={(e) => setStorageIdQuery(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                );
                            case 'partName':
                                return (
                                    <div className="flex flex-col" key={filter.type}>
                                        <Label className="mb-2">{filter.label}</Label>
                                        <Input
                                            type="search"
                                            placeholder="Search by Part Name..."
                                            value={partNameQuery}
                                            onChange={(e) => setPartNameQuery(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                );
                            case 'partId':
                                return (
                                    <div className="flex flex-col" key={filter.type}>
                                        <Label className="mb-2">{filter.label}</Label>
                                        <Input
                                            type="search"
                                            placeholder="Search by Part ID..."
                                            value={partIdQuery}
                                            onChange={(e) => setPartIdQuery(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                );
                                
                            case 'orderType':
                                return (
                                    <div className="flex flex-col" key={filter.type}>
                                        <Label className="mb-2">{filter.label}</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                variant={selectedOrderType === 'all' ? 'default' : 'outline'}
                                                onClick={() => setSelectedOrderType('all')}
                                                className="w-full"
                                            >
                                                All
                                            </Button>
                                            <Button
                                                variant={selectedOrderType === 'Machine' ? 'default' : 'outline'}
                                                onClick={() => setSelectedOrderType('Machine')}
                                                className="w-full"
                                            >
                                                Machine
                                            </Button>
                                            <Button
                                                variant={selectedOrderType === 'Storage' ? 'default' : 'outline'}
                                                onClick={() => setSelectedOrderType('Storage')}
                                                className="w-full"
                                            >
                                                Storage
                                            </Button>
                                        </div>
                                    </div>
                                )

                            default:
                                return null;
                        }
                    })}
                </div>

                <SheetFooter className="flex flex-col gap-2 px-2 w-full">
                    <Button onClick={handleResetFilters} variant="outline" className="w-full">
                        Reset Filters
                    </Button>
                    <SheetClose asChild>
                        <Button onClick={handleApplyFilters} type="submit" className="bg-blue-950 text-white w-full">
                            Apply Filters
                        </Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default SearchAndFilter;
