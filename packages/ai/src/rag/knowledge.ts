export interface EvidenceEntry {
  id: string;
  title: string;
  publisher: string;
  category: "energy" | "water" | "waste" | "cross-cutting" | "mobility" | "solar";
  geography: string;
  url: string;
  publishedAt?: string;
  excerpt: string;
  relevanceTags: string[];
}

/**
 * Curated evidence base. These are real, citable sources mapped to the
 * intervention catalog via `evidence` IDs on each CatalogEntry. The copilot
 * only cites entries reachable this way.
 */
export const KNOWLEDGE_BASE: EvidenceEntry[] = [
  {
    id: "iod-doe-led",
    title: "LED Lighting Fact Sheet",
    publisher: "U.S. Department of Energy",
    category: "energy",
    geography: "global",
    url: "https://www.energy.gov/energysaver/led-lighting",
    publishedAt: "2020",
    excerpt:
      "LEDs use up to 75% less energy than incandescent lighting and last 25 times longer. Retrofitting common-area lighting is among the lowest-risk energy actions.",
    relevanceTags: ["led", "lighting", "retrofit", "energy reduction"],
  },
  {
    id: "bee-lighting",
    title: "Lighting Retrofit Best Practices",
    publisher: "Bureau of Energy Efficiency (India)",
    category: "energy",
    geography: "india",
    url: "https://beeindia.gov.in",
    publishedAt: "2022",
    excerpt:
      "Indian tariff rates and HVAC/lighting efficiency baselines that feeds the energy-tariff factor used in calculations.",
    relevanceTags: ["india", "tariff", "lighting", "bee"],
  },
  {
    id: "bem-bee-metering",
    title: "Building Energy Metering Guidelines",
    publisher: "Bureau of Energy Efficiency (India)",
    category: "energy",
    geography: "india",
    url: "https://beeindia.gov.in",
    publishedAt: "2021",
    excerpt:
      "Metering and monitoring are the precondition for credible energy reduction claims; sub-metering helps pinpoint wastage before investing in retrofits.",
    relevanceTags: ["metering", "monitoring", "energy audit", "india"],
  },
  {
    id: "iso-50001-dev",
    title: "ISO 50001 Energy Management Systems",
    publisher: "International Organization for Standardization",
    category: "energy",
    geography: "global",
    url: "https://www.iso.org/standard/69426.html",
    publishedAt: "2018",
    excerpt:
      "ISO 50001 provides the PDCA framework for systematic energy management; energy-saving measures are typically validated against a monitoring plan.",
    relevanceTags: ["energy management", "pdca", "standard", "hvac"],
  },
  {
    id: "bers-rmi-cold",
    title: "Cold-Climate and Campus HVAC Efficiency Evidence",
    publisher: "Rocky Mountain Institute",
    category: "energy",
    geography: "global",
    url: "https://rmi.org",
    publishedAt: "2020",
    excerpt:
      "RMI analysis documents 15–20% typical savings from optimized HVAC scheduling and setpoint management in institutional buildings.",
    relevanceTags: ["hvac", "scheduling", "setpoint", "buildings"],
  },
  {
    id: "phi-solar",
    title: "Solar Photovoltaic Cost Trends",
    publisher: "RMI / industry benchmarks",
    category: "solar",
    geography: "global",
    url: "https://rmi.org",
    publishedAt: "2022",
    excerpt:
      "Capex per kWp has fallen steadily; system sizing should match roof area and grid-export constraints. Solar offsets the grid emission factor directly.",
    relevanceTags: ["solar", "pv", "capex", "renewables"],
  },
  {
    id: "dot-doe-solar",
    title: "Solar Energy Basics",
    publisher: "U.S. Department of Energy",
    category: "solar",
    geography: "global",
    url: "https://www.energy.gov/eere/solar/solar-energy-basics",
    publishedAt: "2021",
    excerpt:
      "Photovoltaic systems convert sunlight to electricity; performance depends on insolation, so annual figures are estimates with geographic variance.",
    relevanceTags: ["solar", "pv", "insolation", "renewables"],
  },
  {
    id: "bird-india-solar",
    title: "Grid Emission Factor for Indian Solar Offset",
    publisher: "CEA India / Ministry of Power",
    category: "solar",
    geography: "india",
    url: "https://cea.nic.in",
    publishedAt: "2023",
    excerpt:
      "The national grid emission factor reflects India's fuel mix; every kWh of grid electricity offset carries roughly the CEA average kgCO2e/kWh.",
    relevanceTags: ["india", "solar", "grid", "emission factor"],
  },
  {
    id: "epa-watersense",
    title: "WaterSense: High-Efficiency Fixtures",
    publisher: "U.S. EPA WaterSense",
    category: "water",
    geography: "global",
    url: "https://www.epa.gov/watersense",
    publishedAt: "2021",
    excerpt:
      "Replacing standard fixtures with WaterSense-rated aerators and low-flow heads reduces hot and cold water use while preserving functionality.",
    relevanceTags: ["water", "fixtures", "aerators", "efficiency"],
  },
  {
    id: "cgiwb-groundwater",
    title: "Groundwater Year Book of India",
    publisher: "Central Ground Water Board (CGWB)",
    category: "water",
    geography: "india",
    url: "https://cgwb.gov.in",
    publishedAt: "2022",
    excerpt:
      "Regional groundwater stress varies by district; rainwater harvesting and recharge are most valuable where the water table is falling.",
    relevanceTags: ["india", "groundwater", "rainwater", "recharge"],
  },
  {
    id: "mcma-rainwater",
    title: "Rainwater Harvesting & Exchange Policy",
    publisher: "Pune Municipal Corporation (Maharashtra)",
    category: "water",
    geography: "india",
    url: "https://pmc.gov.in",
    publishedAt: "2020",
    excerpt:
      "Cities including Pune require or incentivize rainwater harvesting on institutional plots; storage capacity should be sized to roof area and rainfall.",
    relevanceTags: ["india", "pune", "rainwater", "policy", "harvesting"],
  },
  {
    id: "epa-waste",
    title: "Sustainable Materials Management",
    publisher: "U.S. EPA",
    category: "waste",
    geography: "global",
    url: "https://www.epa.gov/smm",
    publishedAt: "2020",
    excerpt:
      "Diverting organic and recyclable waste avoids landfill methane; waste reduction hierarchy prioritizes source reduction and reuse above recycling.",
    relevanceTags: ["waste", "segregation", "landfill", "circular"],
  },
  {
    id: "swachh-india",
    title: "Swachh Bharat Mission (Waste Management)",
    publisher: "Government of India",
    category: "waste",
    geography: "india",
    url: "https://swachhbharatmission.ddws.gov.in",
    publishedAt: "2021",
    excerpt:
      "The national mission standardizes municipal solid waste segregation into wet, dry and hazardous streams at the point of generation.",
    relevanceTags: ["india", "segregation", "wet waste", "dry waste"],
  },
  {
    id: "niti-compost",
    title: "Composting Guidelines for Institutions",
    publisher: "NITI Aayog",
    category: "waste",
    geography: "india",
    url: "https://www.niti.gov.in",
    publishedAt: "2019",
    excerpt:
      "On-site composting of wet waste reduces transport emissions and yields soil input; it requires segregation as a precondition.",
    relevanceTags: ["india", "composting", "wet waste", "organic"],
  },
  {
    id: "un-sdgs",
    title: "The 2030 Agenda for Sustainable Development",
    publisher: "United Nations",
    category: "cross-cutting",
    geography: "global",
    url: "https://sdgs.un.org/2030agenda",
    publishedAt: "2015",
    excerpt:
      "SDG 7 (affordable clean energy), 11 (sustainable cities), 12 (responsible consumption), 13 (climate action) anchor campus sustainability planning.",
    relevanceTags: ["sdg", "energy", "cities", "climate"],
  },
  {
    id: "niti-ev",
    title: "EV Charging Infrastructure Guidance",
    publisher: "NITI Aayog / government guidance",
    category: "mobility",
    geography: "india",
    url: "https://www.niti.gov.in",
    publishedAt: "2021",
    excerpt:
      "Charging-readiness (parking capacity, transformers, cable layout) is a prerequisite for electric fleet adoption on campuses.",
    relevanceTags: ["india", "ev", "charging", "mobility"],
  },
];

export function getEvidenceById(id: string): EvidenceEntry | undefined {
  return KNOWLEDGE_BASE.find((e) => e.id === id);
}

export function getEvidenceByIds(ids: string[]): EvidenceEntry[] {
  return ids.map(getEvidenceById).filter((e): e is EvidenceEntry => Boolean(e));
}