
export const NAV_ITEMS = [

   
    {
      label: "Dashboard",
      value: "dashboard" as const,
      roles: ["organization_admin", "contributor", "researcher"],
      featured: [
        {
          name: "View Dashboard",
          href: "/dashboard",
          imageSrc: "/navbar/account/viewDashboard.png",
        },
      ],
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
      ],
    },
    {
      label: "Analysis Tools",
      value: "analysis-tools",
      roles: ["researcher"],
      featured: [
      {
        name: "Pre Analysis",
        href: "/analysis/pre-analysis",
        imageSrc: "/navbar/analysis/pre.png",
        },
      {
        name: "Descriptive Statistics",
        href: "/analysis/descriptive",
        imageSrc: "/navbar/analysis/descriptive.png",
        },
        {
        name: "Inferential Statistics",
        href: "/analysis/inferential",
        imageSrc: "/navbar/analysis/inferential.png",
        },
        {
        name: "Correlational Analysis",
        href: "/analysis/correlational",
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
        href: "#",
        imageSrc: "/navbar/researcher/pendingApprovals.png",
      },
      {
        name: "Research Requests",
        href: "#",
        imageSrc: "/navbar/researcher/reviewRequests.png",
      },
      ],
    },
    {
      label: "My Account",
      value: "my-account",
      roles: ["researcher", "organization_admin", "contributor"],
      featured: [
        {
          name: "Edit Profile",
          href: "#",
          imageSrc: "/navbar/account/editProfile.png",
        },
        {
          name: "Account Preferences",
          href: "#",
          imageSrc: "/navbar/account/preferences.png",
        },      
      ],
    },    
    {
      label: "purchases",
      value: "purchases",
      roles: ["researcher"],
      featured: [
        {
          name: "Subscription & Billing",
          href: "#",
          imageSrc: "/navbar/account/billing.png",
        },
        {
          name: "Purchase History",
          href: "#",
          imageSrc: "/navbar/account/purchases.png",
        }
      ]
    }    
  ];










  