import { FolderOpen } from "lucide-react";

/**
 * Dropdown that lists files fetched from the backend.
 */
export default function FileSelect({ files, value, onChange, placeholder = "Select a file..." }) {
  return (
    <select
      className="select mono"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Select a file"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {files
        .filter((f) => !f.isDirectory)
        .map((f) => (
          <option key={f.id || f.name} value={f.name}>
            {f.name}
          </option>
        ))}
    </select>
  );
}