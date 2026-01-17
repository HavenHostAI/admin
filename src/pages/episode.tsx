import { Link, useParams } from "react-router-dom";
import { Film, ChevronLeft } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const EpisodePage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-1 flex-col gap-6 pb-8">
      <header className="flex flex-col gap-2 pt-2">
        <div className="text-muted-foreground flex items-center gap-2">
          <Film className="h-5 w-5" />
          <span className="text-sm font-medium tracking-wide uppercase">
            Episode
          </span>
        </div>
        <h1 className="text-2xl font-semibold">Episode details</h1>
        <p className="text-muted-foreground text-sm">
          Review the episode metadata and jump back to the home view when you’re
          done.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Episode ID</CardTitle>
          <CardDescription>
            This is the identifier used to open the episode detail view.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold">{id ?? "Unknown"}</div>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link to="/">
                <ChevronLeft className="h-4 w-4" />
                Back to home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EpisodePage;
