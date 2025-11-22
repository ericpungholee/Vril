import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-8">
      <div className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-muted rounded-full">
          <Package className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Welcome to Packify</h1>
        <p className="text-muted-foreground max-w-md text-lg">
          Design, visualize, and create custom packaging for your products in 3D.
        </p>
      </div>
      
      <div className="flex gap-4">
        <Link href="/product">
          <Button size="lg">
            Start Designing
          </Button>
        </Link>
      </div>
    </div>
  );
}
