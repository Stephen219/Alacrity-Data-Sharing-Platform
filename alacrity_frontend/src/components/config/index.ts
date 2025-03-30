//add side nav items 
export const NAV_ITEMS = [

  {
    label: "Dashboard",
    value: "dashboard" as const,
    roles: ["organization_admin", "contributor", "researcher"],
    featured: [
      {
        name: "Dashboard",
        href: "/dashboard",
        imageSrc: "/navbar/account/viewDashboard.png",  
      },],
    

  },


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
          href: "/organisation/admin/datasets",
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
          name: "All Requests",
          href: "/requests/all",
          imageSrc: "/navbar/review/all.png",
        },
        {
          name: "Review Research",
          href: "/requests/pendingSubmissions",
          imageSrc: "/navbar/review/reviewResearch.png",
        },
        {
          name: "chats",
          href: "/chat",
          imageSrc: "/navbar/chats/admin_chats.png",
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
        imageSrc: "/navbar/analysis/descriptive.png",
      },
      {
        name: "Bookmarks",
        href: "/datasets/bookmarks",
        imageSrc: "/navbar/analysis/correlational.png",
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
        name: "Liked Research",
        href: "/researcher/bookmarks",
        imageSrc: "/navbar/analysis/correlational.png",
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
      roles: ["researcher"],
      featured: [
        {
          name: "Chats",
          href: "/chat/users/chats",
          imageSrc: "/navbar/chats/user_chats.png",
        },
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
          href: "/researcher/purchaseHistory",
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










  