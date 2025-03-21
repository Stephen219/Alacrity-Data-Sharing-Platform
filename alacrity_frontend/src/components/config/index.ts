
export const NAV_ITEMS = [

    {
      label: "Datasets",
      value: "datasets" as const,
      roles: ["organization_admin", "contributor"], 
      // roles: ["organisation", "contributor"],
      featured: [
        {
          name: "Upload Dataset",
          href: "/datasets/add",
          imageSrc: "/navbar/datasets/uploadDataset.png",
        },
        {
          name: "Manage Datasets",
          href: "#",
          imageSrc: "/navbar/datasets/manageDataset.png",
        },
        {
          name: "Dataset Usage Metrics",
          href: "#",
          imageSrc: "/navbar/datasets/metrics.png",
        },
      ],
    },
    {
      label: "Review",
      value: "review" as const,
      roles: ["organization_admin", "contributor"],
      featured: [
        {
          name: "Pending Requests",
          href: "/requests/pending",
          imageSrc: "/navbar/review/accessRequests.png",
        },
        {
          name: "Review Research",
          href: "#",
          imageSrc: "/navbar/review/reviewResearch.png",
        },
      ],
    },
  
    // Researcher navigation
    {
      label: "Browse Datasets",
      value: "browse-datasets",
      roles: ["researcher"],
      featured: [
      {
        name: "Explore Datasets",
        href: "/datasets/all",
        imageSrc: "/navbar/researcher/browseDatasets.png",
      },
      {
        name: "Bookmarks",
        href: "/datasets/bookmarks",
        imageSrc: "/navbar/researcher/browseDatasets.png",
      },
      {
        name: "My Datasets",
        href: "/researcher/datasetWithAccess",
        imageSrc: "/navbar/datasets/mydatasets.png",
      
        
      }
      ],
    },
    // {
    //   label: "Analysis Tools",
    //   value: "analysis-tools",
    //   roles: ["researcher"],
    //   featured: [
    //   {
    //     name: "Pre Analysis",
    //     href: "/analysis/pre-analysis",
    //     imageSrc: "/navbar/analysis/pre.png",
    //     },
    //   {
    //     name: "Descriptive Statistics",
    //     href: "/analysis/descriptive",
    //     imageSrc: "/navbar/analysis/descriptive.png",
    //     },
    //     {
    //     name: "Inferential Statistics",
    //     href: "/analysis/inferential",
    //     imageSrc: "/navbar/analysis/inferential.png",
    //     },
    //     {
    //     name: "Correlational Analysis",
    //     href: "/analysis/correlational",
    //     imageSrc: "/navbar/analysis/correlational.png",
    //     },
    //   ],
    // },
    {
      label: "Browse Research",
      value: "browse-research",
      roles: ["researcher"],
      featured: [
      {
        name: "Explore Research",
        href: "/researcher/allSubmissions",
        imageSrc: "/navbar/researcher/browseDatasets.png",
      },
      {
        name: "Bookmarks",
        href: "/researcher/bookmarks",
        imageSrc: "/navbar/researcher/browseDatasets.png",
      },
      ],
    },
    {
      label: "View Requests",
      value: "view-pending",
      roles: ["researcher"],
      featured: [
      {
        name: "Dataset Requests",
        href: "/requests/datasetRequests",
        imageSrc: "/navbar/researcher/pendingApprovals.png",
      },
      {
        name: "Research Requests",
        href: "/requests/researchRequests",
        imageSrc: "/navbar/researcher/reviewRequests.png",
      },
      ],
    },
    {
      label: "My Hub",
      value: "my-account",
      roles: ["researcher", "contributor"],
      featured: [
        {
          name: "Research Library",
          href: "/researcher/Submissions",
          imageSrc: "/navbar/account/library.png",
        },
        {
          name: "Drafts",
          href: "/researcher/drafts",
          imageSrc: "/navbar/account/purchases.png",
        },
        {
          name: "Purchase History",
          href: "#",
          imageSrc: "/navbar/account/billing.png",
        },
        {
          name: "Recently Deleted",
          href: "/researcher/delete",
          imageSrc: "/navbar/account/delete.png",
        },       
      ],
    },     
  ];










  