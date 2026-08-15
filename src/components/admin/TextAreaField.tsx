import { Textarea } from "@/components/ui/textarea";

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TextAreaField({ label, value, onChange, placeholder, disabled }: TextAreaFieldProps) {
  return (
    <label className="grid gap-1.5 text-[12px] font-medium text-foreground">
      <span className="text-muted-foreground">{label}</span>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[80px] text-sm resize-y"
      />
    </label>
  );
}
