import { useState, useRef, type ChangeEvent } from "react";
import { MediaType, type MediaItem } from "@/components/LandingPage";
import { uploadFile } from "@/components/LandingPage";
import { readFileAsDataUrl } from "@/components/LandingPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Video, Upload, Trash2 } from "lucide-react";

interface MediaEditorProps {
  title: string;
  media: MediaItem;
  onChange: (media: MediaItem) => void;
  onDelete?: () => void;
}

export function MediaEditor({ title, media, onChange, onDelete }: MediaEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const src = await uploadFile(file);
    onChange({
      ...media,
      src,
      alt: media.alt || file.name,
      type: file.type.startsWith("video") ? "video" : "image",
    });
    event.currentTarget.value = "";
  };

  const handleUrlChange = (value: string) => {
    onChange({ ...media, src: value });
  };

  const handleTypeChange = (value: string) => {
    onChange({ ...media, type: value as MediaType });
  };

  const handleAltChange = (value: string) => {
    onChange({ ...media, alt: value });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteClick = () => {
    onDelete?.();
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        {onDelete && (
          <Button variant="destructive" size="sm" onClick={handleDeleteClick}>
            <Trash2 size={14} className="mr-1" />
            Delete
          </Button>
        )}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Select
          value={media.type}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>

        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium text-foreground">Alt / Label</Label>
          <Input
            value={media.alt}
            onChange={(e) => handleAltChange(e.target.value)}
            placeholder="Alt text"
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div className="mt-3">
        <Label className="text-[12px] font-medium text-foreground">Source URL or Data URL</Label>
        <Textarea
          value={media.src}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="Paste image URL or data URL"
          className="min-h-[60px] text-sm resize-y mt-1"
        />
      </div>

      <div className="mt-3 flex gap-3">
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <Upload size={14} className="text-muted-foreground" />
          Upload file
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
        {media.src && (
          <Button variant="outline" size="sm" onClick={handleUploadClick}>
            <Upload size={14} className="mr-1" />
            Replace
          </Button>
        )}
      </div>

      {media.src && (
        <div className="mt-3 overflow-hidden rounded-lg border border-border bg-muted/50">
          {media.type === "video" ? (
            <video src={media.src} className="h-32 w-full object-cover" autoPlay muted loop playsInline />
          ) : (
            <img src={media.src} alt={media.alt} className="h-32 w-full object-cover" />
          )}
        </div>
      )}
    </div>
  );
}
