"use client";

import { useEffect, useState } from "react";
import { CompanyDetails } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

interface CompanyFormProps {
  onSave: (details: CompanyDetails) => void;
  initialData?: CompanyDetails | null;
}

export function CompanyForm({ onSave, initialData }: CompanyFormProps) {
  const [details, setDetails] = useState<CompanyDetails>({
    companyName: "",
    yourName: "",
    gstNumber: "",
    address: "",
  });

  useEffect(() => {
    if (initialData) {
      setDetails(initialData);
    } else {
      const stored = localStorage.getItem("voicecontract_company");
      if (stored) {
        setDetails(JSON.parse(stored));
      }
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetails((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("voicecontract_company", JSON.stringify(details));
    onSave(details);
  };

  return (
    <Card className="w-full max-w-md bg-card border-border">
      <CardHeader>
        <CardTitle className="text-xl">Your Company Profile</CardTitle>
        <CardDescription>We use this to generate your contracts.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              name="companyName"
              placeholder="e.g. JPN Studio"
              value={details.companyName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yourName">Your Name</Label>
            <Input
              id="yourName"
              name="yourName"
              placeholder="e.g. Pradip Lalpura"
              value={details.yourName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gstNumber">GST Number</Label>
            <Input
              id="gstNumber"
              name="gstNumber"
              placeholder="e.g. 24AAAAA0000A1Z5"
              value={details.gstNumber}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              placeholder="e.g. Ahmedabad, Gujarat"
              value={details.address}
              onChange={handleChange}
              required
            />
          </div>
          <Button type="submit" className="w-full mt-2 font-medium">
            Save & Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
