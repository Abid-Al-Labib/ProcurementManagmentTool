import { Card, CardContent } from "@/components/ui/card";

interface ManagementCardProps {
  icon: React.ReactNode;
  title: string;
  subtext: string;
  onClick: () => void;
}

const ManagementCard: React.FC<ManagementCardProps> = ({ icon, title, subtext, onClick }) => {
  return (
    <Card
      onClick={onClick}
      className="flex items-center p-4 space-x-4 w-full max-w-sm shadow-md border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition"
    >
      <div className="text-4xl">{icon}</div>
      <CardContent className="flex flex-col">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-gray-500">{subtext}</p>
      </CardContent>
    </Card>
  );
};

export default ManagementCard;
