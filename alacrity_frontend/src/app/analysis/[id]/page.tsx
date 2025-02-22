


"use client";

import { useState, useEffect } from "react";
import { use } from "react"; // Import React.use
import styles from "@/styles/Analysis.module.css";
import { fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";

// Define JSON types
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject {
  [key: string]: JsonValue;
}
interface JsonArray extends Array<JsonValue> {}

interface AnalysisPageProps {
  params: Promise<{ id: string }>; // params is now a Promise
}

export default function AnalysisPage({ params }: AnalysisPageProps) {
  // Unwrap params with React.use()
  const { id } = use(params); // This resolves the Promise and gives us the params object

  const [data, setData] = useState<JsonObject | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("");
  const [subCategory, setSubCategory] = useState<string>("");
  const [subSubCategory, setSubSubCategory] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      try {
        // const res = await fetchWithAuth(`/api/datasets/analysis/${id}`);
        const res = await fetchWithAuth(`${BACKEND_URL}datasets/correlation/${id}`);
        if (!res.ok) throw new Error(`Failed to fetch data for ID: ${id}`);
        const jsonData: JsonObject = await res.json();
        setData(jsonData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const categories: string[] = data ? Object.keys(data) : [];

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setSubCategory("");
    setSubSubCategory("");
  };

  const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSubCategory(e.target.value);
    setSubSubCategory("");
  };

  const renderSubCategories = () => {
    if (!category || !data || !data[category]) return null;
    const subKeys: string[] = Object.keys(data[category]);
    return (
      <select value={subCategory} onChange={handleSubCategoryChange}>
        <option value="">Select Subcategory</option>
        {subKeys.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
    );
  };

  const renderSubSubCategories = () => {
    if (!subCategory || !data || !data[category] || !data[category][subCategory]) return null;
    const subSubKeys: string[] = Object.keys(data[category][subCategory] as JsonObject);
    return (
      <select value={subSubCategory} onChange={(e) => setSubSubCategory(e.target.value)}>
        <option value="">Select Detail</option>
        {subSubKeys.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
    );
  };

  const renderContent = () => {
    if (!data || !category) return <p>Please select a category.</p>;
    let content: JsonValue = data[category];
    if (subCategory) content = (content as JsonObject)[subCategory];
    if (subSubCategory) content = (content as JsonObject)[subSubCategory];

    if (Array.isArray(content)) {
      const firstItem = content[0] as JsonObject | undefined;
      return (
        <table className={styles.table}>
          <thead>
            <tr>
              {firstItem ? Object.keys(firstItem).map((key) => <th key={key}>{key}</th>) : null}
            </tr>
          </thead>
          <tbody>
            {content.map((item, index) => (
              <tr key={index}>
                {Object.values(item as JsonObject).map((val, i) => (
                  <td key={i}>{typeof val === "object" && val !== null ? JSON.stringify(val) : String(val)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (typeof content === "object" && content !== null) {
      return Object.entries(content as JsonObject).map(([key, value]) => (
        <div key={key} className={styles.card}>
          <h3>{key}</h3>
          <pre>{JSON.stringify(value, null, 2)}</pre>
        </div>
      ));
    }
    return <pre>{JSON.stringify(content, null, 2)}</pre>;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Statistical Analysis Dashboard (ID: {id})</h1>
      <div className={styles.dropdowns}>
        <select value={category} onChange={handleCategoryChange}>
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {renderSubCategories()}
        {renderSubSubCategories()}
      </div>
      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
}