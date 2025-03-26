import DamagedPartsRow from "@/components/customui/DamagedPartsRow";
import NavigationBar from "@/components/customui/NavigationBar";
import SearchAndFilter from "@/components/customui/SearchAndFilter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchDamagedPartsByFactoryID } from "@/services/DamagedGoodsService";
import { fetchFactories } from "@/services/FactoriesService";
import { DamagedPart, Factory } from "@/types";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const DamagedPartsPage = () => {
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(null);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [damagedParts, setDamagedParts] = useState<DamagedPart[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [factoryLoading, setFactoryLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<any>({});


  useEffect(() => {
    const loadFactories = async () => {
      try {
        setFactoryLoading(true);
        const factory_data = await fetchFactories();
        if (factory_data) {
          setFactories(factory_data);
        }
      } catch (error) {
        toast.error("Could not fetch Factories");
      } finally {
        setFactoryLoading(false);
      }
    };
    loadFactories(); // Call the function
  }, []);

  useEffect(() => {
    const filterDamagedParts = async () =>{
      if (selectedFactoryId)
        {
          setLoading(true)
          try {
            const damaged_parts_data = await fetchDamagedPartsByFactoryID(selectedFactoryId, filters.partNameQuery, filters.partIdQuery)
            setDamagedParts(damaged_parts_data)
          } catch (error) {
            toast.error("Could not filter")
          } finally {
            setLoading(false)
          }
        }
    }
    filterDamagedParts()
  }, [filters])

  const LoadDamagedPartsDataByFactoryID = async (factory_id: number, partName: string | null = null, partId: number | null = null) => {
    if (factory_id) {
      try {
        setLoading(true);
        const damaged_parts_data = await fetchDamagedPartsByFactoryID(factory_id, partName, partId);
        if (damaged_parts_data) {
          setDamagedParts(damaged_parts_data);
        }
      } catch (error) {
        toast.error("Could not fetch damaged parts data");
      } finally {
        setLoading(false);
      }
    }
  };

  const factorySelectionOnChange = (value: string) => {
    const factoryid = Number(value);
    setSelectedFactoryId(factoryid);
    LoadDamagedPartsDataByFactoryID(factoryid);
  };



  return (
    <>
      <NavigationBar />
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <div className="flex flex-col sm:gap-4 sm:py-4">
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="mb-4">
              <Label className="mb-2">Select Factory</Label>
              <Select
                value={selectedFactoryId ? selectedFactoryId.toString() : "Select a Factory"}
                onValueChange={factorySelectionOnChange}
              >
                <SelectTrigger className="w-[220px] mt-2">
                  <SelectValue>
                    {selectedFactoryId === null ? "Select a Factory" : factories.find(f => f.id === selectedFactoryId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {factories.map(factory => (
                    <SelectItem key={factory.id} value={factory.id.toString()}>
                      {factory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              {selectedFactoryId === null ? (
                <div className="text-center text-lg">Please select a factory to display data</div>
              ) : loading ? (
                <div className="text-center">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Card x-chunk="dashboard-06-chunk-0">
                    <CardHeader>
                      <CardTitle>Damaged Parts</CardTitle>
                      <CardDescription>A list of damaged parts for the selected factory</CardDescription>
                      <div className="ml-auto">   
                          <SearchAndFilter
                              filterConfig={[
                                  { type: 'partName', label: 'Part Name' },
                                  { type: 'partId', label: 'Part ID' },
                              ]}
                              onApplyFilters={setFilters}
                              onResetFilters={() => setFilters({})}
                              hideDefaultIdDateSearch={true}
                          />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Part ID</TableHead>
                            <TableHead>Part</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>
                              <span className="sr-only">Actions</span>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                        { damagedParts.length !== 0 &&  
                          damagedParts.map(damaged_part => (
                            <DamagedPartsRow
                              key={damaged_part.id} // Assuming each damaged part has a unique ID, use it as the key
                              damagedPart={damaged_part}
                            />
                          ))
                        }
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default DamagedPartsPage;
