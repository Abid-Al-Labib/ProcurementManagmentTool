import React, { useState } from 'react';
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

interface FilterConfig {
    type: 'factory' | 'factorySection' | 'machine' | 'department' | 'status' | 'id' | 'date';
    label: string;
}

interface SearchAndFilterProps {
    filterConfig: FilterConfig[];
    factories?: any[];
    factorySections?: any[];
    machines?: any[];
    departments?: any[];
    statuses?: any[];
    onApplyFilters: () => void;
    onResetFilters: () => void;
    selectedFactoryId?: number | undefined;
    setSelectedFactoryId?: (value: number | undefined) => void;
    selectedFactorySectionId?: number | undefined;
    setSelectedFactorySectionId?: (value: number | undefined) => void;
    selectedMachineId?: number | undefined;
    setSelectedMachineId?: (value: number | undefined) => void;
    selectedDepartmentId?: number | undefined;
    setSelectedDepartmentId?: (value: number | undefined) => void;
    selectedStatusId?: number | undefined;
    setSelectedStatusId?: (value: number | undefined) => void;
    searchType?: 'id' | 'date';
    setSearchType?: (value: 'id' | 'date') => void;
    searchQuery?: string;
    setSearchQuery?: (value: string) => void;
    tempDate?: Date | undefined;
    setTempDate?: (value: Date | undefined) => void;
    handleDateChange?: () => void;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
    filterConfig,
    factories = [],
    factorySections = [],
    machines = [],
    departments = [],
    statuses = [],
    onApplyFilters,
    onResetFilters,
    selectedFactoryId,
    setSelectedFactoryId,
    selectedFactorySectionId,
    setSelectedFactorySectionId,
    selectedMachineId,
    setSelectedMachineId,
    selectedDepartmentId,
    setSelectedDepartmentId,
    selectedStatusId,
    setSelectedStatusId,
    searchType,
    setSearchType,
    searchQuery,
    setSearchQuery,
    tempDate,
    setTempDate,
    handleDateChange
}) => {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const handleSearchTypeChange = (type: 'id' | 'date') => {
        if (setSearchType) {
            setSearchType(type);
             if (type === 'date') {
                setIsCalendarOpen(true);
            } else {
                setIsCalendarOpen(false);
            }
        }
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
                                onChange={(e) => setSearchQuery ? setSearchQuery(e.target.value) : undefined}
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
                                onClick={handleDateChange}  // Corrected date change handling
                                className="bg-blue-950 text-white px-4 py-2 rounded-md mt-2 w-full"
                            >
                                Confirm
                            </Button>
                        </div>
                    )}

                    {/* Factory, Department, Status, etc. Filters */}
                    {filterConfig.map((filter) => {
                        switch (filter.type) {
                            case 'factory':
                                return (
                                    <div className="flex flex-col" key={filter.type}>
                                        <Label className="mb-2">{filter.label}</Label>
                                        <Select
                                            value={selectedFactoryId === undefined ? "all" : selectedFactoryId.toString()}
                                            onValueChange={(value) => {
                                                const factoryId = value === 'all' ? undefined : Number(value);
                                                if (setSelectedFactoryId) {
                                                    setSelectedFactoryId(factoryId);
                                                }
                                                if (setSelectedFactorySectionId) {
                                                    setSelectedFactorySectionId(undefined); // Reset sections and machines when factory changes
                                                }
                                                if (setSelectedMachineId) {
                                                    setSelectedMachineId(undefined);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue>
                                                    {selectedFactoryId === undefined ? "All Factories" : factories.find(f => f.id === selectedFactoryId)?.name}
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
                                            value={selectedFactorySectionId === undefined ? "all" : selectedFactorySectionId.toString()}
                                            onValueChange={(value) => {
                                                const sectionId = value === 'all' ? undefined : Number(value);
                                                if (setSelectedFactorySectionId) {
                                                    setSelectedFactorySectionId(sectionId);
                                                }
                                                if (setSelectedMachineId) {
                                                    setSelectedMachineId(undefined);
                                                }
                                            }}
                                            disabled={!selectedFactoryId}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue>
                                                    {selectedFactorySectionId === undefined ? "All Sections" : factorySections.find(s => s.id === selectedFactorySectionId)?.name}
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
                                            value={selectedMachineId === undefined ? "all" : selectedMachineId.toString()}
                                            onValueChange={(value) => setSelectedMachineId ? setSelectedMachineId(value === 'all' ? undefined : Number(value)) : undefined}
                                            disabled={!selectedFactorySectionId}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue>
                                                    {selectedMachineId === undefined ? "All Machines" : machines.find(m => m.id === selectedMachineId)?.number}
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
                                            value={selectedDepartmentId === undefined ? "all" : selectedDepartmentId.toString()}
                                            onValueChange={(value) => setSelectedDepartmentId ? setSelectedDepartmentId(value === 'all' ? undefined : Number(value)) : undefined}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue>
                                                    {selectedDepartmentId === undefined ? "All Departments" : departments.find(d => d.id === selectedDepartmentId)?.name}
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
                                            value={selectedStatusId === undefined ? "all" : selectedStatusId.toString()}
                                            onValueChange={(value) => setSelectedStatusId ? setSelectedStatusId(value === 'all' ? undefined : Number(value)) : undefined}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue>
                                                    {selectedStatusId === undefined ? "All Statuses" : statuses.find(s => s.id === selectedStatusId)?.name}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                {statuses
                                                    .sort((a, b) => a.id - b.id)
                                                    .map((status) => (
                                                        <SelectItem key={status.id} value={status.id.toString()}>
                                                            {status.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                );
                            default:
                                return null;
                        }
                    })}
                </div>

                <SheetFooter className="flex flex-col gap-2 px-2 w-full">
                    <Button onClick={onResetFilters} variant="outline" className="w-full">
                        Reset Filters and Search
                    </Button>
                    <SheetClose asChild>
                        <Button onClick={onApplyFilters} type="submit" className="bg-blue-950 text-white w-full">
                            Apply Filters
                        </Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default SearchAndFilter;
