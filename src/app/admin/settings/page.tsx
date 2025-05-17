// vendorax/src/app/admin/settings/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingButton } from "@/components/ui/loading-button";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function SettingsPage() {
  const [company, setCompany] = useState({ name: "", address: "", phone: "", email: "", logo_url: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cachedLogoFile = useRef<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setCompany(data);
        setPreviewUrl(data.logo_url); // ✅ Show logo on reload
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 2 * 1024 * 1024) {
      alert("File size exceeds 2MB.");
      return;
    }

    const blobUrl = URL.createObjectURL(selected);
    setPreviewUrl(blobUrl);
    cachedLogoFile.current = selected;
  };

  const uploadLogo = async (): Promise<string | null> => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user) {
      console.error("No auth user. Cannot upload.");
      return null;
    }

    if (!cachedLogoFile.current) return null;
    setUploading(true);

    const file = cachedLogoFile.current;
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("company-logos")
      .upload(fileName, file, { upsert: true });

    if (error) {
      console.error("Upload error:", error.message);
      setUploading(false);
      return null;
    }

    const { data } = supabase.storage.from("company-logos").getPublicUrl(fileName);
    setUploading(false);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);

    let logoUrl = company.logo_url;
    const previousLogoUrl = company.logo_url;

    // Upload new logo if selected
    if (cachedLogoFile.current) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
        logoUrl = uploadedUrl;
        setPreviewUrl(uploadedUrl);

        // Delete the old logo file if it exists and is different
        if (previousLogoUrl && previousLogoUrl !== uploadedUrl) {
            const pathParts = previousLogoUrl.split('/');
            const fileName = pathParts[pathParts.length - 1];

            await supabase.storage.from("company-logos").remove([fileName]);
        }
        }
    }

    const payload = {
        ...company,
        logo_url: logoUrl,
        user_uid: userId,
    };

    await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    cachedLogoFile.current = null;
    setSaving(false);
    };


  return (
    <div className="max-w-2xl mx-auto mt-10">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Company Settings</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Logo Preview</label>
            {previewUrl && <img src={previewUrl} alt="Logo" className="mb-2 h-20" />}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button onClick={handleBrowseClick} className="mb-4 bg-white border border-black text-black hover:bg-gray-100">
              Upload Logo
            </Button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Business Name</label>
            <Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <Input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <Input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} />
          </div>
          <LoadingButton onClick={handleSave} isLoading={saving || uploading} loadingText="Saving...">
            Save Settings
          </LoadingButton>
        </CardContent>
      </Card>
    </div>
  );
}
