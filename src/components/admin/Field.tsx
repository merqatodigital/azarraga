import { Input } from "@/components/ui/input";

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}

export function Field({ label, value, onChange, placeholder, type = "text", disabled }: FieldProps) {
  return (
    <label className="grid gap-1.5 text-[12px] font-medium text-foreground">
      <span className="text-muted-foreground">{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
        className="h-9 text-sm"
      />
    </label>
  );
}
