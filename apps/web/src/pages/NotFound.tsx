import { Link } from "wouter";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <CardContent className="space-y-4 py-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-900">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Page not found</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The route you followed doesn&apos;t exist. Head back to the overview.
            </p>
          </div>
          <Link to="/">
            <Button>Back to overview</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}