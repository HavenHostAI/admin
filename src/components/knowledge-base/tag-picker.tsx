import { useCallback, useId, useMemo, useState } from "react";
import { X, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface TagPickerProps {
  label?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
}

const normalise = (value: string) => value.trim();

export const TagPicker = ({
  label,
  value,
  onChange,
  placeholder = "Add tag",
  suggestions = [],
  className,
}: TagPickerProps) => {
  const [inputValue, setInputValue] = useState("");
  const inputId = useId();

  const lowercased = useMemo(
    () => new Set(value.map((tag) => tag.toLowerCase())),
    [value],
  );

  const commitTag = useCallback(
    (candidate: string) => {
      const formatted = normalise(candidate);
      if (!formatted) return;
      if (lowercased.has(formatted.toLowerCase())) {
        setInputValue("");
        return;
      }
      onChange([...value, formatted]);
      setInputValue("");
    },
    [lowercased, onChange, value],
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((existing) => existing !== tag));
    },
    [onChange, value],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" || event.key === ",") {
        event.preventDefault();
        commitTag(inputValue);
      } else if (event.key === "Backspace" && !inputValue) {
        onChange(value.slice(0, -1));
      }
    },
    [commitTag, inputValue, onChange, value],
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label ? (
        <label
          className="text-foreground/80 text-sm font-medium"
          htmlFor={inputId}
        >
          {label}
        </label>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1"
          >
            <span>{tag}</span>
            <button
              type="button"
              className="hover:bg-muted rounded-full p-0.5"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id={inputId}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="max-w-xs"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-1"
          onClick={() => commitTag(inputValue)}
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
      {suggestions.length > 0 ? (
        <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="border-border hover:bg-muted rounded-md border border-dashed px-2 py-1 transition"
              onClick={() => commitTag(suggestion)}
            >
              #{suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
