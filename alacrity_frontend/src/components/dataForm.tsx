


/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";
import { useState, useEffect, useRef } from "react";
import type React from "react";

import LoadingSpinner from "./ui/Loader";
import UploadIcon from "./ui/Upload";
import { BACKEND_URL } from "@/config";
import { fetchWithAuth } from "@/libs/auth";
import MaxWidthWrapper from "./MaxWidthWrapper";
import {
  AlertCircle,
  Cloud,
  DropletIcon as Dropbox,
  FileUp,
  HardDrive,
  Info,
  Upload,
} from "lucide-react";

// Type definitions for global window object
declare global {
  interface Window {
    gapi: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
    Dropbox: {
      choose: (options: any) => void;
    };
    OneDrive: {
      open: (options: any) => void;
    };
  }
}

// Tooltip component
const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        className="inline-flex items-center"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
        <Info className="ml-1 h-4 w-4 text-gray-400 dark:text-gray-300 cursor-help" />
      </div>
      {isVisible && (
        <div className="absolute z-10 w-64 p-2 mt-2 text-sm text-white bg-gray-800 dark:bg-black rounded-md shadow-lg -left-1/2 transform -translate-x-1/4">
          {text}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-800 dark:border-b-black"></div>
        </div>
      )}
    </div>
  );
};

/**
 * This component is a form for adding a new dataset. It has fields for title, description, category, tags, and file upload.
 * It also has a checkbox for agreeing to the license terms.
 * @returns {JSX.Element}
 */
const DatasetForm = () => {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [cloudFileUrl, setCloudFileUrl] = useState("");
  const [cloudFileName, setCloudFileName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [price, setPrice] = useState<string>("");
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null); 

  // UI state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [serverMessage, setServerMessage] = useState("");
  const [visible, setVisible] = useState({ error: false, message: false });
  const [progress, setProgress] = useState({ error: 100, message: 100 });
  const [showOverlay, setShowOverlay] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);

  const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY; // DO NOT COMMIT THIS KEY   IT CAN USE MONEY
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const DROPBOX_APP_KEY = process.env.NEXT_PUBLIC_DROPBOX_APP_KEY;
  const ONEDRIVE_CLIENT_ID = process.env.NEXT_PUBLIC_ONEDRIVE_CLIENT_ID;

  useEffect(() => {
    if (serverError || serverMessage) {
      setVisible({ error: !!serverError, message: !!serverMessage });
      setProgress({ error: 100, message: 100 });
      const timer = setInterval(() => {
        setProgress((prev) => ({
          error: serverError ? Math.max(prev.error - 100 / 150, 0) : 0,
          message: serverMessage ? Math.max(prev.message - 100 / 150, 0) : 0,
        }));
      }, 100);
      const hideTimer = setTimeout(() => {
        setVisible({ error: false, message: false });
      }, 15000);
      return () => {
        clearInterval(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [serverError, serverMessage]);

  
  useEffect(() => {
    const loadScript = (src: string, attrs?: { [key: string]: string }): Promise<void> =>
      new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        if (attrs) Object.entries(attrs).forEach(([key, value]) => script.setAttribute(key, value));
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
      });

    const initializeCloudSDKs = async () => {
      try {
        await Promise.all([
          loadScript("https://www.dropbox.com/static/api/2/dropins.js", {
            id: "dropboxjs",
            "data-app-key": DROPBOX_APP_KEY || "",
          }),
          loadScript("https://js.live.net/v5.0/OneDrive.js"),
          loadScript("https://apis.google.com/js/api.js"),
          loadScript("https://accounts.google.com/gsi/client"),
        ]);

        window.gapi.load("client:picker", async () => {
          try {
            await window.gapi.client.init({
              apiKey: GOOGLE_API_KEY,
              discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
            });
            setGapiInited(true);
            console.log("Google API client initialized successfully");
          } catch (error) {
            console.error("Error initializing GAPI client:", error);
            setServerError("Failed to initialize Google Drive API.");
          }

          if (window.google && window.google.accounts && window.google.accounts.oauth2) {
            setGisInited(true);
            console.log("Google Identity Services initialized successfully");
          } else {
            setServerError("Google Drive integration failed to load properly.");
          }
        });
      } catch (error) {
        console.error("Error loading cloud SDKs:", error);
        setServerError("Failed to initialize file storage providers. Please refresh the page.");
      }
    };

    initializeCloudSDKs();

    return () => {
      const scripts = document.querySelectorAll(
        'script[src*="dropbox"], script[src*="onedrive"], script[src*="google"]',
      );
      scripts.forEach((script) => script.remove());
    };
  }, [DROPBOX_APP_KEY, GOOGLE_API_KEY, GOOGLE_CLIENT_ID]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!description.trim() || description.length < 100)
      newErrors.description = "Description is required and must be at least 100 characters";
    if (!category) newErrors.category = "Please select a category";
    if (tags.length === 0) newErrors.tags = "At least one tag is required";
    if (!file && !cloudFileUrl) newErrors.file = "Please select a file to upload";
    if (file && !["csv", "xlsx", "pdf"].includes(file.name.split(".").pop() ?? ""))
      newErrors.file = "Invalid file type. Only CSV and Excel files are allowed";
    if (!agreedToTerms) newErrors.agreedToTerms = "You must agree to the license terms";
    if (!price.trim()) newErrors.price = "Price is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setServerError("");
    setServerMessage("");
    setLoading(true);
    setShowOverlay(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("tags", tags.join(","));
    formData.append("price", price);
    if (cloudFileUrl) {
      formData.append("fileUrl", cloudFileUrl);
      formData.append("fileName", cloudFileName || "cloud_file");
      if (cloudFileUrl.includes("drive.google.com") && googleAccessToken) {
        formData.append("accessToken", googleAccessToken); // Append access token for Google Drive
      }
    } else {
      formData.append("fileUrl", "");
    }
    if (file) formData.append("file", file);

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}datasets/create_dataset/`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.error) {
          setServerError(data.error);
        } else {
          console.log(data);
          setServerError("An error occurred while uploading. Please try again.");
        }
        return;
      }
      setServerError("");

      if (data.message) {
        setServerMessage(data.message);
      } else {
        setServerMessage("Dataset uploaded successfully!");
      }
      setTitle("");
      setDescription("");
      setCategory("");
      setTags([]);
      setFile(null);
      setCloudFileUrl("");
      setCloudFileName("");
      setPrice("");
      setAgreedToTerms(false);
      setErrors({});
      setGoogleAccessToken(null); 
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
      setShowOverlay(false);
    }
  };

  const handleLocalFile = () => {
    setShowSourceModal(false);
    fileInputRef.current?.click();
  };

  const handleDropbox = () => {
    setShowSourceModal(false);
    if (window.Dropbox) {
      window.Dropbox.choose({
        success: (files: any) => {
          const selectedFile = files[0];
          setCloudFileUrl(selectedFile.link);
          setCloudFileName(selectedFile.name);
          setFile(null);
          console.log("Selected Dropbox file:", selectedFile);
        },
        cancel: () => console.log("Dropbox picker canceled"),
        linkType: "direct",
        multiselect: false,
        extensions: [".csv", ".xlsx", ".pdf"],
      });
    } else {
      setServerError("Dropbox integration not available. Please try again later.");
    }
  };

  const handleOneDrive = () => {
    setShowSourceModal(false);
    if (window.OneDrive) {
      window.OneDrive.open({
        clientId: ONEDRIVE_CLIENT_ID,
        action: "download",
        multiSelect: false,
        advanced: { filter: ".csv,.xlsx,.pdf" },
        success: (files: any) => {
          const selectedFile = files.value[0];
          setCloudFileUrl(selectedFile.webUrl);
          setCloudFileName(selectedFile.name);
          setFile(null);
          console.log("Selected OneDrive file:", selectedFile);
        },
        cancel: () => console.log("OneDrive picker canceled"),
        error: (e: any) => {
          console.error("OneDrive error:", e);
          setServerError("Failed to access OneDrive. Please try again.");
        },
      });
    } else {
      setServerError("OneDrive integration not available. Please try again later.");
    }
  };

  const handleGoogleDrive = () => {
    setShowSourceModal(false);
    if (!gapiInited || !gisInited) {
      setServerError("Google Drive is not ready. Please wait a moment and try again.");
      return;
    }

    console.log("Initiating Google Drive with API Key:", GOOGLE_API_KEY);
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      prompt: "select_account",
      include_granted_scopes: true,
      access_type: "online",
      enable_serial_consent: true,
      callback: (tokenResponse: any) => {
        console.log("OAuth callback triggered:", tokenResponse);
        if (tokenResponse && tokenResponse.access_token) {
          console.log("Access token received:", tokenResponse.access_token);
          setGoogleAccessToken(tokenResponse.access_token); // Store the token
          createGooglePicker(tokenResponse.access_token);
        } else {
          setServerError("Google Drive authentication failed.");
          console.error("Token response error:", tokenResponse);
        }
      },
      error_callback: (error: any) => {
        console.error("Google OAuth error:", error);
        setServerError("Failed to authenticate with Google Drive: " + (error?.message || "Unknown error"));
      },
    });

    console.log("Requesting access token...");
    tokenClient.requestAccessToken();
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
  
    // Prevents negative values
    if (value.startsWith("-")) return;
  
    // Allos only numbers and a single decimal point
    if (!/^\d*\.?\d{0,2}$/.test(value)) return;
  
    setPrice(value); // Allows natural typing without immediate formatting
  };

  const handlePriceBlur = () => {
    if (price === "" || isNaN(parseFloat(price))) {
      setPrice(""); // Resets empty or invalid input
    } else {
      setPrice(parseFloat(price).toFixed(2)); // Formats correctly when leaving the input
    }
  };

  const createGooglePicker = (accessToken: string) => {
    console.log("Loading Picker API with access token:", accessToken);
    window.gapi.load("picker", () => {
      try {
        console.log("Creating Picker with API Key:", GOOGLE_API_KEY);
        if (!GOOGLE_API_KEY) {
          throw new Error("API key is empty or undefined");
        }
        if (!accessToken) {
          throw new Error("Access token is missing");
        }
        const picker = new window.google.picker.PickerBuilder()
          .addView(window.google.picker.ViewId.DOCS)
          .addView(window.google.picker.ViewId.SPREADSHEETS)
          .addView(window.google.picker.ViewId.PDFS)
          .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
          .setOAuthToken(accessToken)
          .setDeveloperKey(GOOGLE_API_KEY)
          .setCallback((data: any) => {
            console.log("Picker callback triggered:", data);
            if (data.action === window.google.picker.Action.PICKED) {
              const doc = data.docs[0];
              window.gapi.client.drive.files
                .get({ fileId: doc.id, fields: "webContentLink,name" })
                .then((response: any) => {
                  const fileData = response.result;
                  setCloudFileUrl(fileData.webContentLink);
                  setCloudFileName(fileData.name);
                  setFile(null);
                  console.log("Selected file:", fileData);
                })
                .catch((error: any) => {
                  console.error("Error fetching file:", error);
                  setServerError("Failed to retrieve Google Drive file.");
                });
            }
          })
          .build();
        console.log("Picker built successfully");
        picker.setVisible(true);
      } catch (error) {
        console.error("Error creating Picker:", error);
        setServerError("Failed to initialize Google Picker: " + (error as Error).message);
      }
    });
  };

  return (
    <MaxWidthWrapper>
      <div className="min-h-screen bg-gradient-to-b from-white to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-[#f97316] bg-gradient-to-r from-[#f97316]/5 to-[#f97316]/10 dark:from-[#f97316]/10 dark:to-[#f97316]/20">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center text-center">
              <FileUp className="mr-2 h-7 w-7 text-[#f97316]" />
              Add New Dataset
            </h2>
          </div>
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {serverError && visible.error && (
              <div
                className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md relative overflow-hidden"
                role="alert"
              >
                <div className="flex justify-between items-center">
                  <p>{serverError}</p>
                  <button
                    onClick={() => setVisible((prev) => ({ ...prev, error: false }))}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M6.21967 7.28033C5.92678 6.98744 5.92678 6.51256 6.21967 6.21967C6.51256 5.92678 6.98744 5.92678 7.28033 6.21967L11.999 10.9384L16.7176 6.2198C17.0105 5.92691 17.4854 5.92691 17.7782 6.2198C18.0711 6.51269 18.0711 6.98757 17.7782 7.28046L13.0597 11.999L17.7782 16.7176C18.0711 17.0105 18.0711 17.4854 17.7782 17.7782C17.4854 18.0711 17.0105 18.0711 16.7176 17.7782L11.999 13.0597L7.28033 17.7784C6.98744 18.0713 6.51256 18.0713 6.21967 17.7784C5.92678 17.4855 5.92678 17.0106 6.21967 16.7177L10.9384 11.999L6.21967 7.28033Z"
                        fill="#343C54"
                      />
                    </svg>
                  </button>
                </div>
                <div
                  className="absolute bottom-0 left-0 h-1 bg-red-500 transition-all duration-100 ease-linear"
                  style={{ width: `${progress.error}%` }}
                />
              </div>
            )}
            {serverMessage && visible.message && (
              <div
                className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md relative overflow-hidden"
                role="alert"
              >
                <div className="flex justify-between items-center">
                  <p>{serverMessage}</p>
                  <button
                    onClick={() => setVisible((prev) => ({ ...prev, message: false }))}
                    className="text-green-500 hover:text-green-700"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M6.21967 7.28033C5.92678 6.98744 5.92678 6.51256 6.21967 6.21967C6.51256 5.92678 6.98744 5.92678 7.28033 6.21967L11.999 10.9384L16.7176 6.2198C17.0105 5.92691 17.4854 5.92691 17.7782 6.2198C18.0711 6.51269 18.0711 6.98757 17.7782 7.28046L13.0597 11.999L17.7782 16.7176C18.0711 17.0105 18.0711 17.4854 17.7782 17.7782C17.4854 18.0711 17.0105 18.0711 16.7176 17.7782L11.999 13.0597L7.28033 17.7784C6.98744 18.0713 6.51256 18.0713 6.21967 17.7784C5.92678 17.4855 5.92678 17.0106 6.21967 16.7177L10.9384 11.999L6.21967 7.28033Z"
                        fill="#343C54"
                      />
                    </svg>
                  </button>
                </div>
                <div
                  className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all duration-100 ease-linear"
                  style={{ width: `${progress.message}%` }}
                />
              </div>
            )}
          </div>
          <form className="p-7 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2 relative">
              <label htmlFor="title" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200">
                <Tooltip text="A clear, concise title that describes your dataset">
                  Title <span className="text-[#f97316] ml-1">*</span>
                </Tooltip>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-[#f97316] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] transition-colors dark:bg-gray-700 dark:text-white"
                placeholder="Enter dataset title"
              />
              {errors.title && (
                <p
                  className="text-red-500 text-xs flex items-center"
                  role="alert"
                  data-testid="title-error"
                  id="title-error"
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>

            <div className="space-y-2 relative">
              <label
                htmlFor="description"
                className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                <Tooltip text="Provide a detailed description of the dataset.">
                  Description <span className="text-[#f97316] ml-1">*</span>
                </Tooltip>
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-[#f97316] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] transition-colors dark:bg-gray-700 dark:text-white"
                placeholder="Enter dataset description (minimum 100 characters)"
              ></textarea>
              {errors.description && (
                <p className="text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.description}
                </p>
              )}
              <div className="text-xs text-gray-500 flex justify-between">
                <span>Minimum 100 characters</span>
                <span>{description.length} / 100</span>
              </div>
            </div>

            <div className="space-y-2 relative">
              <label htmlFor="tags" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200">
                <Tooltip text="Enter tags separated by commas (e.g., AI, Research, Data).">
                  Tags <span className="text-[#f97316] ml-1 dark:text-gray-100">*</span>
                </Tooltip>
              </label>
              <input
                type="text"
                id="tags"
                value={tags.join(",")}
                onChange={(e) => setTags(e.target.value.split(",").map((tag) => tag.trim()))}
                className="w-full px-3 py-2 border border-[#f97316] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] transition-colors dark:bg-gray-700 dark:text-white"
                placeholder="Comma-separated tags"
              />
              {errors.tags && (
                <p className="text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.tags}
                </p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 relative">
                <label
                  htmlFor="category"
                  className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  <Tooltip text="Select the most relevant category for your dataset.">
                    Category <span className="text-[#f97316] ml-1">*</span>
                  </Tooltip>
                </label>
                <div className="relative">
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-[#f97316] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] appearance-none transition-colors dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select category</option>
                    <option value="category1">Category 1</option>
                    <option value="category2">Category 2</option>
                    <option value="category3">Category 3</option>
                  </select>
                  <svg
                    className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none dark:text-gray-100"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                {errors.category && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.category}
                  </p>
                )}
              </div>

              <div className="space-y-2 relative">
                <label
                  htmlFor="file"
                  className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  <Tooltip text="Upload the dataset file in CSV, Excel, or PDF format.">
                    Select file <span className="text-[#f97316] ml-1">*</span>
                  </Tooltip>
                </label>
                <button
                  type="button"
                  onClick={() => setShowSourceModal(true)}
                  className="w-full px-4 py-3 border-2 border-[#f97316] rounded-md shadow-sm bg-white dark:bg-gray-700 text-[#f97316] hover:bg-[#f97316]/5 dark:hover:bg-[#f97316]/20 focus:outline-none focus:ring-2 focus:ring-[#f97316] transition-colors flex items-center justify-center group"
                >
                  <Upload className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Select Dataset File</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  data-testid="file-input"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0] || null;
                    setFile(selectedFile);
                    setCloudFileUrl("");
                    setCloudFileName("");
                    setGoogleAccessToken(null); 
                  }}
                  className="hidden"
                  accept=".csv,.xlsx,.pdf"
                />
                {(file || cloudFileUrl) && (
                  <div className="mt-2 text-sm bg-[#f97316]/5 dark:bg-[#f97316]/10 p-3 rounded-md border border-[#f97316] flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-[#f97316]/10 dark:bg-[#f97316]/20 rounded-full flex items-center justify-center mr-3">
                      <FileUp className="h-4 w-4 text-[#f97316]" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium text-gray-700 dark:text-gray-200 truncate">
                        {file ? file.name : cloudFileName || "Cloud file"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "From cloud storage"}
                      </p>
                    </div>
                  </div>
                )}
                {errors.file && (
                  <p className="text-red-500 text-xs flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.file}
                  </p>
                )}
              </div>
            </div>

            {showSourceModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                    <Cloud className="mr-2 h-5 w-5 text-[#f97316]" />
                    Select File Source
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleLocalFile}
                      className="p-4 bg-white dark:bg-gray-700 border-2 border-[#f97316] text-gray-700 dark:text-gray-200 rounded-md hover:bg-[#f97316]/5 dark:hover:bg-[#f97316]/20 hover:text-[#f97316] transition-colors flex flex-col items-center justify-center h-32"
                    >
                      <HardDrive className="h-10 w-10 mb-3" />
                      <span className="font-medium">Local File</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDropbox}
                      className="p-4 bg-white dark:bg-gray-700 border-2 border-[#f97316] text-gray-700 dark:text-gray-200 rounded-md hover:bg-[#f97316]/5 dark:hover:bg-[#f97316]/20 hover:text-[#f97316] transition-colors flex flex-col items-center justify-center h-32"
                    >
                      <Dropbox className="h-10 w-10 mb-3" />
                      <span className="font-medium">Dropbox</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOneDrive}
                      className="p-4 bg-white dark:bg-gray-700 border-2 border-[#f97316] text-gray-700 dark:text-gray-200 rounded-md hover:bg-[#f97316]/5 dark:hover:bg-[#f97316]/20 hover:text-[#f97316] transition-colors flex flex-col items-center justify-center h-32"
                    >
                      <Cloud className="h-10 w-10 mb-3" />
                      <span className="font-medium">OneDrive</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGoogleDrive}
                      className="p-4 bg-white dark:bg-gray-700 border-2 border-[#f97316] text-gray-700 dark:text-gray-200 rounded-md hover:bg-[#f97316]/5 dark:hover:bg-[#f97316]/20 hover:text-[#f97316] transition-colors flex flex-col items-center justify-center h-32"
                    >
                      <Cloud className="h-10 w-10 mb-3" />
                      <span className="font-medium">Google Drive</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSourceModal(false)}
                    className="w-full mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 relative">
              <label htmlFor="price" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200">
                <Tooltip text="Set a price for your dataset (enter 0 for free datasets)">
                  Price (£) <span className="text-[#f97316] ml-1">*</span>
                </Tooltip>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300">
                  £
                </span>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={handlePriceChange}
                  onBlur={handlePriceBlur}
                  className="w-full pl-8 pr-3 py-2 border border-[#f97316] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] transition-colors dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              {errors.price && (
                <p className="text-red-500 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.price}
                </p>
              )}
            </div>

            <div className="flex items-start space-x-2 bg-orange-50 dark:bg-[#f97316]/10 p-3 rounded-md border border-[#f97316]">
              <input
                type="checkbox"
                id="license"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="h-5 w-5 mt-0.5 text-[#f97316] border-[#f97316] rounded focus:ring-[#f97316]"
              />
              <div>
                <label htmlFor="license" className="text-sm text-gray-700 dark:text-gray-200">
                  I agree to the{" "}
                  <a href="#" className="text-[#f97316] underline hover:text-[#f97316]/80">
                    license terms
                  </a>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  By uploading this dataset, you confirm that you have the rights to distribute this data and agree to
                  our terms of service.
                </p>
                {errors.agreedToTerms && (
                  <p className="text-red-500 text-xs flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.agreedToTerms}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="submit-button"
              data-testid="submitting-button"
              className="w-full px-4 py-3 text-white bg-[#f97316] rounded-md hover:bg-[#f97316]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f97316] disabled:opacity-50 md:mb-6 md:mt-4 md:pb-4 md:pt-4 flex items-center justify-center dark:ring-offset-gray-800"
            >
              {loading ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Dataset
                </>
              )}
            </button>
          </form>
        </div>
        {showOverlay && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 xl:p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl flex flex-col items-center space-y-4">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white xl:mt-5 xl:text-5xl xl:mb-3">
                Alacrity
              </h1>
              <UploadIcon />
              <LoadingSpinner />
              <p className="mt-2 text-lg font-semibold text-gray-800 dark:text-gray-200 xl:pl-8 xl:pr-8 xl:m-6 xl:text-2xl">
                Uploading your Data...
              </p>
              <p className="mt-2 text-sm font-light text-gray-600 dark:text-gray-400 xl:mb-5 xl:text-xl">
                This shouldnt take that long
              </p>
            </div>
          </div>
        )}
      </div>
    </MaxWidthWrapper>
  );
};

export default DatasetForm;