export type Tag = 
    | "Capitalist" | "Populist" | "Pragmatist" | "Socialist" 
    | "Nationalist" | "Polarizing" | "Multicultural" | "Conservative" 
    | "Religious" | "Secular" | "Reformist" | "Machiavellian" 
    | "Clean" | "Decentralist" | "Centralist" | "Development" 
    | "Austerity" | "Labor" | "Unpopular";

export type ResponseModifiers = {
  demographics: {
    urban?: number; rural?: number; borneo?: number;
    b40?: number; m40?: number; youth?: number;
    nationalist?: number; reformist?: number; conservative?: number;
    minority?: number; // Added to handle Urban/Minority splits
    heartland?: number; // Added to handle Nationalist/Heartland
  };
  resources: { 
    funds?: number; 
    momentum?: number; 
    pcCostMultiplier?: number 
  };
  tags: Tag[];
};

export interface ManifestoItem {
  id: string;
  topic: string;
  category: "Economy" | "Identity" | "Institutional" | "Infrastructure" | "Labor";
  responses: {
    agree: ResponseModifiers;
    disagree: ResponseModifiers;
    neutral: ResponseModifiers;
  };
}

export const manifestoItems: ManifestoItem[] = [
  {
    id: "gst",
    topic: "Reintroduce GST",
    category: "Economy",
    responses: {
      agree: {
        demographics: { b40: -10, urban: 10 },
        resources: { momentum: 0 }, // Corporate Funds skip
        tags: ["Capitalist", "Unpopular"]
      },
      disagree: {
        demographics: { b40: 10 },
        resources: { momentum: 0 },
        tags: ["Populist"]
      },
      neutral: {
        demographics: {},
        resources: { momentum: -5 },
        tags: []
      }
    }
  },
  {
    id: "fuel_subsidies",
    topic: "Targeted Fuel Subsidies (Remove blanket RON95 subsidies)",
    category: "Economy",
    responses: {
      agree: {
        demographics: { m40: 10, urban: 10, rural: -15 },
        resources: {},
        tags: ["Pragmatist"]
      },
      disagree: {
        demographics: { rural: 15, m40: -10, urban: -10 },
        resources: {},
        tags: ["Populist"]
      },
      neutral: {
        demographics: {},
        resources: { momentum: -5 },
        tags: []
      }
    }
  },
  {
    id: "wealth_tax",
    topic: "Implement a Wealth & Inheritance Tax on the T20",
    category: "Economy",
    responses: {
      agree: {
        demographics: { b40: 20, youth: 20 },
        resources: {}, // Corporate Funds skip
        tags: ["Socialist", "Populist"]
      },
      disagree: {
        demographics: { b40: -10, youth: -10 },
        resources: {}, // Corporate Funds skip
        tags: ["Capitalist"]
      },
      neutral: {
        demographics: { m40: 5 },
        resources: { momentum: -5 },
        tags: []
      }
    }
  },
  {
    id: "vernacular_schools",
    topic: "Abolish Vernacular Schools (Single-Stream Education)",
    category: "Identity",
    responses: {
      agree: {
        demographics: { nationalist: 20, rural: 20, urban: -25, minority: -25 },
        resources: {},
        tags: ["Nationalist", "Polarizing"]
      },
      disagree: {
        demographics: { urban: 15, minority: 15, nationalist: -15 },
        resources: {},
        tags: ["Multicultural"]
      },
      neutral: {
        demographics: {},
        resources: { momentum: -10 },
        tags: []
      }
    }
  },
  {
    id: "ruu355",
    topic: "Expansion of Syariah Courts (RUU355)",
    category: "Identity",
    responses: {
      agree: {
        demographics: { conservative: 25, rural: 25, reformist: -20, urban: -20 },
        resources: {},
        tags: ["Conservative", "Religious"]
      },
      disagree: {
        demographics: { reformist: 20, urban: 20, conservative: -25, rural: -25 },
        resources: {},
        tags: ["Secular"]
      },
      neutral: {
        demographics: {},
        resources: { momentum: -5 },
        tags: []
      }
    }
  },
  {
    id: "bumi_quotas",
    topic: "Merit-Based University Admissions (Abolish Bumiputera Quotas)",
    category: "Identity",
    responses: {
      agree: {
        demographics: { reformist: 25, minority: 25, nationalist: -30, heartland: -30 },
        resources: {},
        tags: ["Reformist", "Polarizing"]
      },
      disagree: {
        demographics: { nationalist: 15, heartland: 15, reformist: -15 },
        resources: {},
        tags: ["Conservative"]
      },
      neutral: {
        demographics: {},
        resources: { momentum: -10 },
        tags: []
      }
    }
  },
  {
    id: "ag_prosecutor",
    topic: "Separate the Attorney General & Public Prosecutor",
    category: "Institutional",
    responses: {
      agree: {
        demographics: { reformist: 15 },
        resources: { pcCostMultiplier: 2 }, // Mechanic: "Black Hat" covert actions cost 2x PC
        tags: ["Reformist", "Clean"]
      },
      disagree: {
        demographics: { reformist: -15 },
        resources: { pcCostMultiplier: 0.5 }, // Mechanic: "Black Hat" actions cost -50% PC
        tags: ["Machiavellian"]
      },
      neutral: {
        demographics: {},
        resources: { momentum: -5 },
        tags: []
      }
    }
  },
  {
    id: "ma63",
    topic: "Full Implementation of MA63 (Borneo Autonomy & 35% Seat Quota)",
    category: "Institutional",
    responses: {
      agree: {
        demographics: { borneo: 35, nationalist: -10 }, // Peninsular Centralist encoded as Nationalist
        resources: {},
        tags: ["Decentralist"]
      },
      disagree: {
        demographics: { borneo: -40 },
        resources: {},
        tags: ["Centralist"]
      },
      neutral: {
        demographics: { borneo: -10 },
        resources: {},
        tags: []
      }
    }
  },
  {
    id: "hsr",
    topic: "Revive the KL-Singapore High-Speed Rail (HSR)",
    category: "Infrastructure",
    responses: {
      agree: {
        demographics: { urban: 20 }, // Southern (Johor) included in Urban/State check
        resources: {}, // Corporate Funds skip, Random Corruption Event handled in campaign
        tags: ["Capitalist", "Development"]
      },
      disagree: {
        demographics: { rural: 10 }, // Southern (Johor) -15 handled in State check
        resources: {},
        tags: ["Austerity"]
      },
      neutral: {
        demographics: {},
        resources: {}, // Corporate Funds skip
        tags: []
      }
    }
  },
  {
    id: "gig_unions",
    topic: "Mandate Unionization for Gig Economy Workers",
    category: "Labor",
    responses: {
      agree: {
        demographics: { youth: 25, b40: 25 },
        resources: {}, // Corporate Funds skip
        tags: ["Labor", "Socialist"]
      },
      disagree: {
        demographics: { youth: -20 },
        resources: {}, // Corporate Funds skip
        tags: ["Capitalist"]
      },
      neutral: {
        demographics: { youth: -5 },
        resources: {},
        tags: []
      }
    }
  }
];
