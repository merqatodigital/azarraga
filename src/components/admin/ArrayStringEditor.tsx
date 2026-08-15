import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ArrayStringEditorProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
}

export function ArrayStringEditor({ label, items, onChange, addLabel }: ArrayStringEditorProps) {
  const handleAdd = () => {
    onChange([...items, ""]);
  };

  const handleChange = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{label}</p>
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {addLabel}
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="flex gap-2 items-start">
            <Input
              value={item}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={`Item ${index + 1}`}
              className="h-9 flex-1 text-sm"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-red-600 hover:bg-red-50"
              onClick={() => handleRemove(index)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
