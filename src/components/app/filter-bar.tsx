"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "./native-select";

type SelectFilter = {
  param: string;
  label: string;
  options: { value: string; label: string }[];
  /** Text for the empty (default) choice. Defaults to "<label>: all". */
  allLabel?: string;
};

// Search box + dropdown filters stored in the URL (?q=...&priority=...), so filters survive
// reloads and can be linked to from other tabs.
export function FilterBar({ placeholder, selects = [] }: { placeholder: string; selects?: SelectFilter[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  // Wait until typing pauses before updating the URL.
  useEffect(() => {
    if (q === (searchParams.get("q") ?? "")) return;
    const timer = setTimeout(() => setParam("q", q.trim()), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Input
        type="search"
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-64"
        aria-label="Search"
      />
      {selects.map((s) => (
        <NativeSelect
          key={s.param}
          aria-label={s.label}
          value={searchParams.get(s.param) ?? ""}
          onChange={(e) => setParam(s.param, e.target.value)}
          className="w-auto"
        >
          <option value="">{s.allLabel ?? `${s.label}: all`}</option>
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
      ))}
    </div>
  );
}
