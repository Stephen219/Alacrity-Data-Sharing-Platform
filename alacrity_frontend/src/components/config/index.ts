
export const NAV_ITEMS = [
    // Organisation navigation
    {
      label: "Datasets",
      value: "datasets" as const,
      roles: ["organisation"],
      featured: [
        {
          name: "Upload Dataset",
          href: "/datasets",
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
      roles: ["organisation"],
      featured: [
        {
          name: "Approve Access",
          href: "#",
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
          href: "#",
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
      roles: ["researcher", "organisation"],
      featured: [
        {
          name: "Edit Profile",
          href: "#",
          imageSrc: "/navbar/account/editProfile.png",
        },
        {
          name: "Security & Login",
          href: "#",
          imageSrc: "/navbar/account/login.png",
        },
        {
          name: "Account Preferences",
          href: "#",
          imageSrc: "/navbar/account/preferences.png",
        },
        {
          name: "Subscription & Billing",
          href: "#",
          imageSrc: "/navbar/account/billing.png",
        },
        {
          name: "Purchase History",
          href: "#",
          imageSrc: "/navbar/account/purchases.png",
        },
        {
          name: "Sign Out",
          href: "#",
          imageSrc: "/navbar/account/signout.png",
        },
      ],
    },
  ];
  