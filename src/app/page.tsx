"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { InferSelectModel } from "drizzle-orm";
import { advocates } from "../db/schema";

type Advocate = InferSelectModel<typeof advocates>;

export default function Home() {
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [filteredAdvocates, setFilteredAdvocates] = useState<Advocate[]>([]);

  useEffect(() => {
    console.log("fetching advocates...");
    fetch("/api/advocates").then((response) => {
      response.json().then((jsonResponse) => {
        setAdvocates(jsonResponse.data);
        setFilteredAdvocates(jsonResponse.data);
      });
    });
  }, []);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;

    const searchTermElement = document.getElementById("search-term");
    if (searchTermElement) {
      searchTermElement.innerHTML = searchTerm;
    } else {
      console.warn("search-term element not found");
    }

    console.log("filtering advocates...");
    const filteredAdvocates = advocates.filter((advocate) => {
      return (
        advocate.firstName.includes(searchTerm) ||
        advocate.lastName.includes(searchTerm) ||
        advocate.city.includes(searchTerm) ||
        advocate.degree.includes(searchTerm) ||
        advocate.specialties.some(s => s.includes(searchTerm)) ||
        advocate.yearsOfExperience.toString() === searchTerm
      );
    });

    setFilteredAdvocates(filteredAdvocates);
  };

  const onClick = () => {
    console.log(advocates);
    setFilteredAdvocates(advocates);
  };

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Solace Advocates</h1>

      <div className="mb-8 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Search</label>
          <p className="text-sm text-gray-600 mb-2">
            Searching for: <span id="search-term" className="font-semibold"></span>
          </p>
          <div className="flex gap-2">
            <input
              className="border border-gray-300 rounded px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <th className="border border-gray-300 px-4 py-2 text-left">First Name</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Last Name</th>
              <th className="border border-gray-300 px-4 py-2 text-left">City</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Degree</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Specialties</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Years of Experience</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Phone Number</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdvocates.map((advocate) => {
              return (
                <tr key={advocate.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{advocate.firstName}</td>
                  <td className="border border-gray-300 px-4 py-2">{advocate.lastName}</td>
                  <td className="border border-gray-300 px-4 py-2">{advocate.city}</td>
                  <td className="border border-gray-300 px-4 py-2">{advocate.degree}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {advocate.specialties.map((s, i) => (
                      <div key={i} className="text-sm">{s}</div>
                    ))}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{advocate.yearsOfExperience}</td>
                  <td className="border border-gray-300 px-4 py-2">{advocate.phoneNumber}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
