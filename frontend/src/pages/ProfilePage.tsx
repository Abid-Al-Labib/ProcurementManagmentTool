import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import NavigationBar from "@/components/customui/NavigationBar"
import { useEffect, useState } from "react"
import { supabase_client } from "@/services/SupabaseClient"
import toast from "react-hot-toast"
import { useAuth } from "@/context/AuthContext"
import { Switch } from "@/components/ui/switch"
import { useNavigate } from "react-router-dom"
import { fetchAppSettings, updateEnabledSettings } from "@/services/AppSettingsService"

const ProfilePage = () => {
    const profile = useAuth().profile
    const [currentDisplay, setCurrentDisplay] = useState<"General" | "Reset Password" | "App Settings">("General")
    const navigate = useNavigate()
    const [enableAddPart, setEnableAddPart] = useState<boolean>(true)
    const [enableResetPassword, setEnableResetPassword] = useState<boolean>(true)
    const [newPassword, setNewPassword] = useState<string>("")

    const handleLogout = async () => {
        const { error } = await supabase_client.auth.signOut()
        if (error) {
            toast.error(error.message)
        }
        navigate('/login')
    }

    const handleAddPartToggle = async (checked: boolean) => {
        try {
            setEnableAddPart(checked)
            await updateEnabledSettings("Add Part", checked)
            toast.success("Updated Add Part settings")
        } catch (error) {
            toast.error("Failed to update app settings")
        }

    }

    const loadResetPasswordSettings = async () => {
        try {
            const settings_data = await fetchAppSettings()
            if (settings_data) {
                settings_data.forEach((setting) => {
                    if (setting.name === "Reset Password") {
                        setEnableResetPassword(setting.enabled)
                        return setting.enabled
                    }
                })
            }
        } catch (error) {
            toast.error("Could not load settings data")
            setEnableResetPassword(false)
            return false
        }
    }

    const handleResetPasswordToggle = async (checked: boolean) => {
        try {
            setEnableResetPassword(checked)
            await updateEnabledSettings("Reset Password", checked)
            toast.success("Updated Reset Password setting")
        } catch (error) {
            toast.error("Failed to update app settings")
        }
        

    }

    const handlePasswordReset = async () => {
        if (!newPassword) {
            toast.error("Please enter a new password.")
            return
        }
        const resetenabled = await loadResetPasswordSettings()
        if (resetenabled){
            const { error } = await supabase_client.auth.updateUser({ password: newPassword })
            if (error) {
                toast.error(`Error: ${error.message}`)
            } else {
                toast.success("Password has been updated successfully.")
                setNewPassword("") // Clear the input field
            }
        }
        else {
            toast.error("Reset Password is currently disabled")
            setNewPassword("") // Clear the input field
            setCurrentDisplay("General")
        }
        

    }

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings_data = await fetchAppSettings()
                if (settings_data) {
                    settings_data.forEach((setting) => {
                        if (setting.name === "Add Part") {
                            setEnableAddPart(setting.enabled)
                        }
                        if (setting.name === "Reset Password") {
                            setEnableResetPassword(setting.enabled)
                        }
                    })
                }
            } catch (error) {
                toast.error("Could not load settings data")
            }
        }
        loadSettings()
    }, [])

    return (
        <>
            <NavigationBar />
            <main className="mt-2 flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
                <div className="mx-auto grid w-full max-w-6xl gap-2">
                    <h1 className="text-3xl font-semibold">Profile</h1>
                </div>
                <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
                    {/* Sidebar */}
                    <div className="grid gap-2 text-sm">
                        <div
                            className={`p-2 pl-4 hover:font-semibold hover:shadow-md border-b-2 hover:shadow-blue-950 ${currentDisplay === "General" ? 'font-semibold' : ''}`}
                            onClick={() => setCurrentDisplay("General")}
                        >
                            General
                        </div>
                        { profile?.permission==='admin' &&
                            <div
                                className={`p-2 pl-4 hover:font-semibold hover:shadow-md border-b-2 hover:shadow-blue-950 ${currentDisplay === "App Settings" ? 'font-semibold' : ''}`}
                                onClick={() => setCurrentDisplay("App Settings")}
                            >
                                App Settings
                            </div>
                        
                        }
                        {enableResetPassword && <div
                            className={`p-2 pl-4 hover:font-semibold hover:shadow-md border-b-2 hover:shadow-blue-950 ${currentDisplay === "Reset Password" ? 'font-semibold' : ''}`}
                            onClick={() => setCurrentDisplay("Reset Password")}
                        >
                            Reset Password
                        </div>}
                        <div onClick={handleLogout} className="p-2 pl-4 hover:font-semibold hover:shadow-md border-b-2 hover:shadow-blue-950">Logout</div>
                    </div>
                    {/* Content */}
                    <div className="grid gap-6">
                        {/* General Card */}
                        {currentDisplay === "General" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>General</CardTitle>
                                    <CardDescription>Your account information.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul>
                                        <li><span className="text-blue-950 font-semibold text-lg">Name: </span><span>{profile?.name} </span></li>
                                        <li><span className="text-blue-950 font-semibold text-lg">Email: </span><span>{profile?.email} </span></li>
                                        <li><span className="text-blue-950 font-semibold text-lg">Role: </span><span>{profile?.position} </span></li>
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                        {/* App Settings Card */}
                        {currentDisplay === "App Settings" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>App Settings</CardTitle>
                                    <CardDescription>
                                        The following app settings will apply to the whole web app for all users.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div>
                                        <div className="space-y-4">
                                            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <label className="text-base">Add Part</label>
                                                    <p className="text-sm text-muted-foreground">Control if users can add part to the system</p>
                                                </div>
                                                <div>
                                                    <Switch checked={enableAddPart} onCheckedChange={handleAddPartToggle} />
                                                </div>
                                            </div>
                                            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <label className="text-base">Reset Password</label>
                                                    <p className="text-sm text-muted-foreground">Control if the users can reset their password</p>
                                                </div>
                                                <div>
                                                    <Switch checked={enableResetPassword} onCheckedChange={handleResetPasswordToggle} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {/* Reset Password Card */}
                        {currentDisplay === "Reset Password" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Reset Password</CardTitle>
                                    <CardDescription>Please type in your new password</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form className="flex flex-col gap-4">
                                        <Input
                                            placeholder="New Password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            type="password"
                                        />
                                    </form>
                                </CardContent>
                                <CardFooter className="border-t px-6 py-4">
                                    <Button onClick={handlePasswordReset}>Reset Password</Button>
                                </CardFooter>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </>
    )
}

export default ProfilePage
