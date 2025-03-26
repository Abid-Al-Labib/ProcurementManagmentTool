import { Link, useNavigate, useParams,  } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import NavigationBar from "../components/customui/NavigationBar"
import { Button } from "../components/ui/button"
import { CirclePlus, CircleX, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { editPart, fetchPartByID } from "@/services/PartsService"
import toast from 'react-hot-toast'
import { Part } from "@/types"

const EditPartPage = () => {

    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setisSubmitting] = useState(false);
    const navigate = useNavigate();
    const [currentPart, setCurrentPart] =  useState<Part|null>(null)
    useEffect(()=>{
        const loadPart = async () => {

            if (!id || isNaN(parseInt(id))) {
                toast.error("Invalid part ID");
                navigate("/parts")
                return;
            }

            const part_id = parseInt(id);

            try {
                const data = await fetchPartByID(part_id);
                const currPart = data[0]
                setCurrentPart(currPart)

            } catch (error) {
                console.log(error)
                toast.error('Failed to fetch part');
            } finally {
                setLoading(false)
            }
        };
        loadPart();
    }, [])

    const handleEditPart = async () => {
        setisSubmitting(true);
        try{
            const nameInput = document.getElementById("name") as HTMLInputElement;
            const unitInput = document.getElementById("unit") as HTMLInputElement;
            const descriptionInput = document.getElementById("description") as HTMLTextAreaElement;

            const name = nameInput.value
            const unit = unitInput.value;
            const description = descriptionInput.value;
            
            if (!id || isNaN(parseInt(id))) {
                toast.error("Invalid part ID");
                navigate("/parts")
                return;
            }
            const part_id = parseInt(id);

            const response = await editPart(part_id,name,unit,description)
            if (response){
                toast.success("Part Updated")

                nameInput.value = "";
                unitInput.value ="";
                descriptionInput.value = currentPart?.description || "";
            }
        }catch(error) {
            toast.error('' + error)
        } finally {
            setisSubmitting(false)
            navigate('/parts')
        } 
    }
    return (
        <>
            <NavigationBar/>
            <div className="grid flex-1 items-start gap-4 p-5 sm:px-6 sm:py-5 md:gap-8">
                {
                    loading?(
                                <div className='flex flex-row justify-center'>
                                    <Loader2 className='h-8 w-8 animate-spin'/>
                                </div>
                    ): <Card x-chunk="dashboard-07-chunk-0">
                            <CardHeader>
                                <CardTitle>Edit Part</CardTitle>
                                <CardDescription>
                                Updates part with new information.
                                </CardDescription>
                                <CardDescription>
                                ID and creation date cannot be edited.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6">
                                    <div className="grid gap-3">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                        id="name"
                                        type="text"
                                        className="w-full"
                                        defaultValue={currentPart?.name || ""}
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="name">Unit</Label>
                                        <Input
                                        id="unit"
                                        type="text"
                                        className="w-full"
                                        defaultValue={currentPart?.unit || ""}
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                        id="description"
                                        defaultValue={currentPart?.description || ""}
                                        className="min-h-32"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-1 gap-4 py-5">
                                {isSubmitting ? (
                                    <div className="ml-auto flex items-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        Editing Part...
                                    </div>
                                ): 
                                    ( 
                                        <>
                                            <Button 
                                            size="sm"
                                            className="ml-auto gap-2"
                                            onClick={handleEditPart}
                                            >
                                            <CirclePlus className="h-4 w-4" />
                                            Update Part
                                            </Button>
                                            <Link to="/parts">
                                                <Button 
                                                    size="sm" 
                                                    className="ml-auto gap-2"
                                                >
                                                    <CircleX className="h-4 w-4" />
                                                    Back
                                                </Button>
                                            </Link>
                                        </>
                                        
                                    )
                                }
                                </div>
                            </CardContent>      
                        </Card>
                }
                
                
             </div>
        </>
  )
}

export default EditPartPage