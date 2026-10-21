"use client";

import { MAJORS, COMMON_MAJORS, normalizeMajor } from "@/lib/majors";

export default function MajorSelect({ value, onChange, ...props }: {
  value: string; onChange: (value: string) => void; id?: string; className?: string; required?: boolean;
}) {
  const normalized = normalizeMajor(value);
  const legacy = normalized && !MAJORS.some(major => major === normalized);
  return <select {...props} value={normalized} onChange={event => onChange(event.target.value)}>
    <option value="" disabled>Select your major</option>
    <optgroup label="Common majors">{COMMON_MAJORS.map(major => <option key={major} value={major}>{major}</option>)}</optgroup>
    <optgroup label="More majors">{MAJORS.filter(major => !COMMON_MAJORS.some(common => common === major)).map(major => <option key={major} value={major}>{major}</option>)}</optgroup>
    {legacy ? <option value={normalized}>{normalized} (current response)</option> : null}
  </select>;
}
