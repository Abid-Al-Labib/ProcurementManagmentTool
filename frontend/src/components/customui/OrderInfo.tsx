import { Order } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Separator } from "../ui/separator"
import { convertUtcToBDTime } from "@/services/helper"

interface OrderInfoProp {
    order: Order
}


const OrderInfo: React.FC<OrderInfoProp> = ({order}) => {
  return (
        <Card
        className="sm:col-span-2" x-chunk="dashboard-05-chunk-0"
    >
        <CardHeader className="pb-3">
        <CardTitle>Order Detail</CardTitle>
        </CardHeader>
        <Separator className="my-4" />
        <CardContent>
            <ul className="grid gap-3">
            <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">ID</span>
                <span>{order.id}</span>
            </li>
            <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Created at</span>
                <span>{convertUtcToBDTime(order.created_at)}</span>
            </li>
            <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Created by</span>
                <span>{order.profiles.name}</span>
            </li>
            <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Department</span>
                <span>{order.departments.name}</span>
            </li>
            <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">
                    {order.factory_sections?.name && order.machines?.name ? 'Machine' : 'Order for Storage'}
                </span>
                <span>
                    {order.factory_sections?.name && order.machines?.name
                        ? `${order.factories.abbreviation} - ${order.factory_sections.name} - ${order.machines.name}`
                        : `${order.factories.abbreviation}`}
                </span>
            </li>
            <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Current Status</span>
                <span>{order.statuses.name}</span>
            </li>
            </ul>
        <Separator className="my-2" />
        <span className="font-semibold text-muted-foreground">Note</span>
        <div className="max-w-xl text-balance leading-relaxed mt-2">{order.order_note}</div>
        </CardContent>
    </Card>
  )
}

export default OrderInfo