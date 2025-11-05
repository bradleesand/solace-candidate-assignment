"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { InferSelectModel } from "drizzle-orm";
import { useDebounce } from "use-debounce";
import { advocates } from "../db/schema";

type Advocate = InferSelectModel<typeof advocates>;

const cellClasses = "border border-gray-300 px-4 py-2";
const headerCellClasses = `${cellClasses} text-left`;

export default function Home() {
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    console.log("fetching advocates...");
    const url = debouncedSearchTerm
      ? `/api/advocates?search=${encodeURIComponent(debouncedSearchTerm)}`
      : "/api/advocates";

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    fetch(url, { signal: abortController.signal })
      .then((response) => response.json())
      .then((jsonResponse) => {
        setAdvocates(jsonResponse.data);
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
        } else {
          console.error('Fetch error:', error);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [debouncedSearchTerm]);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const onClick = () => {
    setSearchTerm("");
  };

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Solace Advocates</h1>

      <div className="mb-8 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Search</label>
          <p className="text-sm text-gray-600 mb-2">
            Searching for: <span id="search-term" className="font-semibold">{debouncedSearchTerm}</span>
          </p>
          <div className="flex gap-2">
            <input
              className="border border-gray-300 rounded px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={onChange}
              placeholder="Search advocates..."
            />
            <button
              onClick={onClick}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              Reset Search
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className={headerCellClasses}>First Name</th>
              <th className={headerCellClasses}>Last Name</th>
              <th className={headerCellClasses}>City</th>
              <th className={headerCellClasses}>Degree</th>
              <th className={headerCellClasses}>Specialties</th>
              <th className={headerCellClasses}>Years of Experience</th>
              <th className={headerCellClasses}>Phone Number</th>
            </tr>
          </thead>
          <tbody>
            {advocates.map((advocate) => {
              return (
                <tr key={advocate.id} className="hover:bg-gray-50">
                  <td className={cellClasses}>{advocate.firstName}</td>
                  <td className={cellClasses}>{advocate.lastName}</td>
                  <td className={cellClasses}>{advocate.city}</td>
                  <td className={cellClasses}>{advocate.degree}</td>
                  <td className={cellClasses}>
                    {advocate.specialties.map((s, i) => (
                      <div key={i} className="text-sm">{s}</div>
                    ))}
                  </td>
                  <td className={cellClasses}>{advocate.yearsOfExperience}</td>
                  <td className={cellClasses}>{advocate.phoneNumber}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
