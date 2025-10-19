export interface AssetSchema {
  id: string
  name: string
  fields: SchemaField[]
  requiredDocuments: string[]
  requiredImages: string[]
}

export interface SchemaField {
  id: string
  name: string
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'file' | 'textarea'
  required: boolean
  placeholder?: string
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface SubIndustry {
  id: string
  name: string
  specificAssets: string[]
  schema: AssetSchema
}

export interface Industry {
  id: string
  name: string
  icon: string
  subIndustries: SubIndustry[]
}

export const INDUSTRY_DATA: Industry[] = [
  {
    id: 'mining',
    name: 'Mining',
    icon: '⛏️',
    subIndustries: [
      {
        id: 'gold-mining',
        name: 'Gold Mining',
        specificAssets: [
          'Gold Mining Rights - Klondike Site',
          'Gold Mining Rights - Nevada Basin',
          'Gold Ore Reserves - 500kg',
          'Gold Processing Equipment',
          'Mining Concession License'
        ],
        schema: {
          id: 'gold-mining-schema',
          name: 'Gold Mining Asset',
          fields: [
            { id: 'asset-name', name: 'Asset Name', type: 'text', required: true, placeholder: 'Enter a descriptive name for your asset' },
            { id: 'asset-description', name: 'Asset Description', type: 'textarea', required: true, placeholder: 'Provide a detailed description of your asset, its value proposition, and key characteristics' },
            { id: 'price', name: 'Asset Price (USD)', type: 'number', required: true, placeholder: 'Enter the price of your asset in USD', validation: { min: 0 } },
            { id: 'country', name: 'Country', type: 'text', required: true, placeholder: 'Enter the country where the asset is located' },
            { id: 'site-location', name: 'Mining Site Location', type: 'text', required: true, placeholder: 'GPS coordinates or address' },
            { id: 'ore-grade', name: 'Ore Grade (g/t)', type: 'number', required: true, validation: { min: 0 } },
            { id: 'estimated-reserves', name: 'Estimated Reserves (kg)', type: 'number', required: true },
            { id: 'extraction-method', name: 'Extraction Method', type: 'select', required: true, options: ['Open Pit', 'Underground', 'Placer', 'Heap Leaching'] },
            { id: 'environmental-permits', name: 'Environmental Permits', type: 'multiselect', required: true, options: ['EIA Approved', 'Water Use Permit', 'Air Quality Permit', 'Waste Management Permit'] },
            { id: 'mining-license', name: 'Mining License Number', type: 'text', required: true },
            { id: 'license-expiry', name: 'License Expiry Date', type: 'date', required: true },
            { id: 'operational-status', name: 'Operational Status', type: 'select', required: true, options: ['Active', 'Under Development', 'Exploration Phase', 'Dormant'] }
          ],
          requiredDocuments: [
            'Mining License',
            'Environmental Impact Assessment',
            'Geological Survey Report',
            'Reserve Estimation Report',
            'Land Title/Lease Agreement',
            'Insurance Certificate'
          ],
          requiredImages: [
            'Site Overview Photo',
            'Mining Equipment Photos',
            'Ore Sample Photos',
            'Site Access Roads',
            'Safety Equipment Documentation'
          ]
        }
      },
      {
        id: 'copper-mining',
        name: 'Copper Mining',
        specificAssets: [
          'Copper Mining Rights - Chile Basin',
          'Copper Ore Reserves - 1000 tons',
          'Copper Processing Plant',
          'Mining Equipment Fleet'
        ],
        schema: {
          id: 'copper-mining-schema',
          name: 'Copper Mining Asset',
          fields: [
            { id: 'asset-name', name: 'Asset Name', type: 'text', required: true, placeholder: 'Enter a descriptive name for your asset' },
            { id: 'asset-description', name: 'Asset Description', type: 'textarea', required: true, placeholder: 'Provide a detailed description of your asset, its value proposition, and key characteristics' },
            { id: 'price', name: 'Asset Price (USD)', type: 'number', required: true, placeholder: 'Enter the price of your asset in USD', validation: { min: 0 } },
            { id: 'country', name: 'Country', type: 'text', required: true, placeholder: 'Enter the country where the asset is located' },
            { id: 'site-location', name: 'Mining Site Location', type: 'text', required: true },
            { id: 'copper-grade', name: 'Copper Grade (%)', type: 'number', required: true, validation: { min: 0, max: 100 } },
            { id: 'estimated-tonnage', name: 'Estimated Tonnage', type: 'number', required: true },
            { id: 'processing-capacity', name: 'Processing Capacity (tons/day)', type: 'number', required: false },
            { id: 'environmental-compliance', name: 'Environmental Compliance Status', type: 'select', required: true, options: ['Fully Compliant', 'In Progress', 'Pending Review'] }
          ],
          requiredDocuments: [
            'Mining Concession',
            'Environmental Permits',
            'Geological Reports',
            'Processing Plant License'
          ],
          requiredImages: [
            'Open Pit Photos',
            'Processing Equipment',
            'Ore Samples',
            'Site Infrastructure'
          ]
        }
      }
    ]
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    icon: '🏢',
    subIndustries: [
      {
        id: 'commercial-properties',
        name: 'Commercial Properties',
        specificAssets: [
          'Office Building - Downtown',
          'Shopping Mall Complex',
          'Industrial Warehouse',
          'Hotel Property',
          'Restaurant Space'
        ],
        schema: {
          id: 'commercial-real-estate-schema',
          name: 'Commercial Real Estate',
          fields: [
            { id: 'asset-name', name: 'Asset Name', type: 'text', required: true, placeholder: 'Enter a descriptive name for your property' },
            { id: 'asset-description', name: 'Asset Description', type: 'textarea', required: true, placeholder: 'Provide a detailed description of your property, its features, and investment potential' },
            { id: 'price', name: 'Property Price (USD)', type: 'number', required: true, placeholder: 'Enter the price of your property in USD', validation: { min: 0 } },
            { id: 'country', name: 'Country', type: 'text', required: true, placeholder: 'Enter the country where the property is located' },
            { id: 'property-address', name: 'Property Address', type: 'textarea', required: true },
            { id: 'total-area', name: 'Total Area (sq ft)', type: 'number', required: true },
            { id: 'rentable-area', name: 'Rentable Area (sq ft)', type: 'number', required: true },
            { id: 'property-type', name: 'Property Type', type: 'select', required: true, options: ['Office', 'Retail', 'Industrial', 'Hotel', 'Mixed Use'] },
            { id: 'construction-year', name: 'Year Built', type: 'number', required: true },
            { id: 'occupancy-rate', name: 'Current Occupancy Rate (%)', type: 'number', required: false, validation: { min: 0, max: 100 } },
            { id: 'monthly-income', name: 'Monthly Rental Income ($)', type: 'number', required: false },
            { id: 'zoning-classification', name: 'Zoning Classification', type: 'text', required: true },
            { id: 'parking-spaces', name: 'Number of Parking Spaces', type: 'number', required: false }
          ],
          requiredDocuments: [
            'Property Title Deed',
            'Zoning Certificate',
            'Building Permits',
            'Property Tax Records',
            'Insurance Policies',
            'Lease Agreements',
            'Property Appraisal Report'
          ],
          requiredImages: [
            'Building Exterior',
            'Interior Spaces',
            'Parking Areas',
            'Mechanical Systems',
            'Floor Plans'
          ]
        }
      },
      {
        id: 'residential-properties',
        name: 'Residential Properties',
        specificAssets: [
          'Apartment Complex - 50 Units',
          'Single Family Home',
          'Condominium Building',
          'Townhouse Development'
        ],
        schema: {
          id: 'residential-real-estate-schema',
          name: 'Residential Real Estate',
          fields: [
            { id: 'asset-name', name: 'Asset Name', type: 'text', required: true, placeholder: 'Enter a descriptive name for your property' },
            { id: 'asset-description', name: 'Asset Description', type: 'textarea', required: true, placeholder: 'Provide a detailed description of your property, its features, and investment potential' },
            { id: 'price', name: 'Property Price (USD)', type: 'number', required: true, placeholder: 'Enter the price of your property in USD', validation: { min: 0 } },
            { id: 'country', name: 'Country', type: 'text', required: true, placeholder: 'Enter the country where the property is located' },
            { id: 'property-address', name: 'Property Address', type: 'textarea', required: true },
            { id: 'total-units', name: 'Total Number of Units', type: 'number', required: true },
            { id: 'unit-types', name: 'Unit Types', type: 'multiselect', required: true, options: ['Studio', '1BR', '2BR', '3BR', '4BR+', 'Penthouse'] },
            { id: 'total-sqft', name: 'Total Square Footage', type: 'number', required: true },
            { id: 'lot-size', name: 'Lot Size (acres)', type: 'number', required: false },
            { id: 'construction-year', name: 'Year Built', type: 'number', required: true },
            { id: 'amenities', name: 'Amenities', type: 'multiselect', required: false, options: ['Pool', 'Gym', 'Parking', 'Laundry', 'Garden', 'Security', 'Elevator'] }
          ],
          requiredDocuments: [
            'Property Deed',
            'Building Permits',
            'HOA Documents',
            'Property Management Agreement',
            'Insurance Coverage'
          ],
          requiredImages: [
            'Building Exterior',
            'Sample Unit Interiors',
            'Common Areas',
            'Amenities'
          ]
        }
      }
    ]
  },
  {
    id: 'agriculture',
    name: 'Agriculture',
    icon: '🌾',
    subIndustries: [
      {
        id: 'crop-farming',
        name: 'Crop Farming',
        specificAssets: [
          'Wheat Farm - 500 acres',
          'Corn Harvest - 2024 Season',
          'Organic Vegetable Farm',
          'Coffee Plantation',
          'Cocoa Bean Harvest'
        ],
        schema: {
          id: 'crop-farming-schema',
          name: 'Crop Farming Asset',
          fields: [
            { id: 'asset-name', name: 'Asset Name', type: 'text', required: true, placeholder: 'Enter a descriptive name for your farm/crop' },
            { id: 'asset-description', name: 'Asset Description', type: 'textarea', required: true, placeholder: 'Provide a detailed description of your agricultural asset, its characteristics, and yield potential' },
            { id: 'price', name: 'Asset Price (USD)', type: 'number', required: true, placeholder: 'Enter the price of your asset in USD', validation: { min: 0 } },
            { id: 'country', name: 'Country', type: 'text', required: true, placeholder: 'Enter the country where the asset is located' },
            { id: 'farm-location', name: 'Farm Location', type: 'text', required: true },
            { id: 'total-acreage', name: 'Total Acreage', type: 'number', required: true },
            { id: 'crop-type', name: 'Primary Crop Type', type: 'select', required: true, options: ['Wheat', 'Corn', 'Soybeans', 'Rice', 'Cotton', 'Coffee', 'Cocoa', 'Vegetables', 'Fruits'] },
            { id: 'farming-method', name: 'Farming Method', type: 'select', required: true, options: ['Conventional', 'Organic', 'Sustainable', 'Hydroponic', 'Greenhouse'] },
            { id: 'soil-quality', name: 'Soil Quality Grade', type: 'select', required: true, options: ['Grade A', 'Grade B', 'Grade C', 'Needs Improvement'] },
            { id: 'irrigation-system', name: 'Irrigation System', type: 'select', required: true, options: ['Drip', 'Sprinkler', 'Flood', 'Rain-fed', 'Hybrid'] },
            { id: 'expected-yield', name: 'Expected Yield (tons/acre)', type: 'number', required: true },
            { id: 'harvest-season', name: 'Harvest Season', type: 'text', required: true },
            { id: 'certifications', name: 'Certifications', type: 'multiselect', required: false, options: ['Organic', 'Fair Trade', 'Rainforest Alliance', 'Non-GMO', 'USDA Certified'] }
          ],
          requiredDocuments: [
            'Land Ownership Certificate',
            'Soil Analysis Report',
            'Organic Certification (if applicable)',
            'Water Rights Documentation',
            'Insurance Policies',
            'Previous Yield Records'
          ],
          requiredImages: [
            'Aerial Farm View',
            'Crop Close-ups',
            'Irrigation Equipment',
            'Storage Facilities',
            'Farm Equipment'
          ]
        }
      }
    ]
  },
  {
    id: 'industrial',
    name: 'Industrial',
    icon: '🏭',
    subIndustries: [
      {
        id: 'manufacturing-equipment',
        name: 'Manufacturing Equipment',
        specificAssets: [
          'CNC Machine Center',
          'Industrial 3D Printer',
          'Assembly Line System',
          'Quality Control Equipment',
          'Packaging Machinery'
        ],
        schema: {
          id: 'manufacturing-equipment-schema',
          name: 'Manufacturing Equipment',
          fields: [
            { id: 'asset-name', name: 'Asset Name', type: 'text', required: true, placeholder: 'Enter a descriptive name for your equipment' },
            { id: 'asset-description', name: 'Asset Description', type: 'textarea', required: true, placeholder: 'Provide a detailed description of your equipment, its capabilities, and value proposition' },
            { id: 'price', name: 'Equipment Price (USD)', type: 'number', required: true, placeholder: 'Enter the price of your equipment in USD', validation: { min: 0 } },
            { id: 'country', name: 'Country', type: 'text', required: true, placeholder: 'Enter the country where the equipment is located' },
            { id: 'equipment-type', name: 'Equipment Type', type: 'text', required: true },
            { id: 'manufacturer', name: 'Manufacturer', type: 'text', required: true },
            { id: 'model-number', name: 'Model Number', type: 'text', required: true },
            { id: 'manufacturing-year', name: 'Manufacturing Year', type: 'number', required: true },
            { id: 'condition', name: 'Equipment Condition', type: 'select', required: true, options: ['New', 'Excellent', 'Good', 'Fair', 'Needs Repair'] },
            { id: 'operating-hours', name: 'Total Operating Hours', type: 'number', required: false },
            { id: 'capacity', name: 'Production Capacity', type: 'text', required: true, placeholder: 'e.g., 1000 units/day' },
            { id: 'power-requirements', name: 'Power Requirements', type: 'text', required: true, placeholder: 'e.g., 380V, 50Hz, 15kW' }
          ],
          requiredDocuments: [
            'Purchase Invoice',
            'Maintenance Records',
            'Warranty Documentation',
            'Safety Certificates',
            'Operating Manual'
          ],
          requiredImages: [
            'Equipment Overview',
            'Control Panel',
            'Safety Features',
            'Serial Number Plate'
          ]
        }
      }
    ]
  },
  {
    id: 'transportation',
    name: 'Transportation',
    icon: '🚛',
    subIndustries: [
      {
        id: 'commercial-vehicles',
        name: 'Commercial Vehicles',
        specificAssets: [
          'Fleet of 50 Delivery Trucks',
          'Cargo Ship - 10,000 TEU',
          'Freight Train Cars',
          'Commercial Aircraft',
          'Construction Equipment Fleet'
        ],
        schema: {
          id: 'commercial-vehicles-schema',
          name: 'Commercial Vehicle Fleet',
          fields: [
            { id: 'asset-name', name: 'Asset Name', type: 'text', required: true, placeholder: 'Enter a descriptive name for your vehicle fleet' },
            { id: 'asset-description', name: 'Asset Description', type: 'textarea', required: true, placeholder: 'Provide a detailed description of your vehicle fleet and its commercial value' },
            { id: 'price', name: 'Fleet Price (USD)', type: 'number', required: true, placeholder: 'Enter the price of your fleet in USD', validation: { min: 0 } },
            { id: 'country', name: 'Country', type: 'text', required: true, placeholder: 'Enter the country where the fleet is located' },
            { id: 'vehicle-type', name: 'Vehicle Type', type: 'select', required: true, options: ['Trucks', 'Vans', 'Buses', 'Ships', 'Aircraft', 'Rail Cars', 'Construction Equipment'] },
            { id: 'fleet-size', name: 'Number of Vehicles', type: 'number', required: true },
            { id: 'vehicle-make', name: 'Primary Make/Brand', type: 'text', required: true },
            { id: 'average-age', name: 'Average Fleet Age (years)', type: 'number', required: true },
            { id: 'total-mileage', name: 'Average Mileage per Vehicle', type: 'number', required: false },
            { id: 'fuel-type', name: 'Fuel Type', type: 'select', required: true, options: ['Diesel', 'Gasoline', 'Electric', 'Hybrid', 'Natural Gas', 'Marine Gas Oil'] },
            { id: 'maintenance-status', name: 'Maintenance Status', type: 'select', required: true, options: ['Up to Date', 'Due Soon', 'Overdue', 'Under Maintenance'] },
            { id: 'insurance-coverage', name: 'Insurance Coverage', type: 'select', required: true, options: ['Full Coverage', 'Liability Only', 'Commercial Coverage', 'Fleet Policy'] }
          ],
          requiredDocuments: [
            'Vehicle Registration',
            'Insurance Policies',
            'Maintenance Records',
            'Safety Inspection Certificates',
            'Commercial License',
            'Fleet Management Records'
          ],
          requiredImages: [
            'Vehicle Fleet Overview',
            'Individual Vehicle Photos',
            'Registration Documents',
            'Maintenance Bay'
          ]
        }
      }
    ]
  },
  {
    id: 'renewable-energy',
    name: 'Renewable Energy',
    icon: '⚡',
    subIndustries: [
      {
        id: 'solar-energy',
        name: 'Solar Energy',
        specificAssets: [
          'Solar Farm - 100 MW',
          'Rooftop Solar Installation',
          'Solar Panel Manufacturing Equipment',
          'Battery Storage System'
        ],
        schema: {
          id: 'solar-energy-schema',
          name: 'Solar Energy Asset',
          fields: [
            { id: 'asset-name', name: 'Asset Name', type: 'text', required: true, placeholder: 'Enter a descriptive name for your solar asset' },
            { id: 'asset-description', name: 'Asset Description', type: 'textarea', required: true, placeholder: 'Provide a detailed description of your solar energy asset and its benefits' },
            { id: 'price', name: 'Asset Price (USD)', type: 'number', required: true, placeholder: 'Enter the price of your asset in USD', validation: { min: 0 } },
            { id: 'country', name: 'Country', type: 'text', required: true, placeholder: 'Enter the country where the asset is located' },
            { id: 'installation-location', name: 'Installation Location', type: 'text', required: true },
            { id: 'total-capacity', name: 'Total Capacity (MW)', type: 'number', required: true },
            { id: 'panel-type', name: 'Panel Type', type: 'select', required: true, options: ['Monocrystalline', 'Polycrystalline', 'Thin Film', 'Bifacial'] },
            { id: 'installation-type', name: 'Installation Type', type: 'select', required: true, options: ['Ground Mount', 'Rooftop', 'Floating', 'Tracking System'] },
            { id: 'commissioning-date', name: 'Commissioning Date', type: 'date', required: true },
            { id: 'power-purchase-agreement', name: 'Power Purchase Agreement', type: 'select', required: false, options: ['Yes - Long Term', 'Yes - Short Term', 'No', 'Under Negotiation'] },
            { id: 'grid-connection', name: 'Grid Connection Status', type: 'select', required: true, options: ['Connected', 'Pending Connection', 'Off-Grid', 'Micro-Grid'] }
          ],
          requiredDocuments: [
            'Environmental Impact Assessment',
            'Grid Connection Agreement',
            'Power Purchase Agreement',
            'Installation Permits',
            'Performance Warranty',
            'Land Lease Agreement'
          ],
          requiredImages: [
            'Solar Farm Aerial View',
            'Panel Installation',
            'Inverter Stations',
            'Grid Connection Infrastructure'
          ]
        }
      }
    ]
  },
  {
    id: 'chemical',
    name: 'Chemical',
    icon: '🧪',
    subIndustries: [
      {
        id: 'specialty-chemicals',
        name: 'Specialty Chemicals',
        specificAssets: [
          'Chemical Processing Plant',
          'Specialty Chemical Inventory',
          'Laboratory Equipment',
          'Chemical Storage Facility'
        ],
        schema: {
          id: 'specialty-chemicals-schema',
          name: 'Chemical Processing Asset',
          fields: [
            { id: 'asset-name', name: 'Asset Name', type: 'text', required: true, placeholder: 'Enter a descriptive name for your chemical asset' },
            { id: 'asset-description', name: 'Asset Description', type: 'textarea', required: true, placeholder: 'Provide a detailed description of your chemical processing asset and its capabilities' },
            { id: 'price', name: 'Asset Price (USD)', type: 'number', required: true, placeholder: 'Enter the price of your asset in USD', validation: { min: 0 } },
            { id: 'country', name: 'Country', type: 'text', required: true, placeholder: 'Enter the country where the asset is located' },
            { id: 'facility-location', name: 'Facility Location', type: 'text', required: true },
            { id: 'chemical-products', name: 'Primary Chemical Products', type: 'textarea', required: true },
            { id: 'production-capacity', name: 'Production Capacity (tons/year)', type: 'number', required: true },
            { id: 'safety-certifications', name: 'Safety Certifications', type: 'multiselect', required: true, options: ['ISO 45001', 'OSHA Compliance', 'EPA Permits', 'REACH Compliance', 'GHS Classification'] },
            { id: 'environmental-permits', name: 'Environmental Permits', type: 'multiselect', required: true, options: ['Air Emissions Permit', 'Water Discharge Permit', 'Waste Management Permit', 'Chemical Storage Permit'] }
          ],
          requiredDocuments: [
            'Chemical Manufacturing License',
            'Safety Data Sheets',
            'Environmental Permits',
            'Safety Inspection Reports',
            'Insurance Certificates'
          ],
          requiredImages: [
            'Processing Equipment',
            'Safety Systems',
            'Storage Facilities',
            'Quality Control Lab'
          ]
        }
      }
    ]
  }
]

// Helper function to get all specific assets across all industries
export const getAllSpecificAssets = (): string[] => {
  const assets: string[] = []
  INDUSTRY_DATA.forEach(industry => {
    industry.subIndustries.forEach(subIndustry => {
      assets.push(...subIndustry.specificAssets)
    })
  })
  return assets
}

// Helper function to find schema by industry and sub-industry
export const getSchemaForAsset = (industryId: string, subIndustryId: string): AssetSchema | null => {
  const industry = INDUSTRY_DATA.find(i => i.id === industryId)
  if (!industry) return null
  
  const subIndustry = industry.subIndustries.find(s => s.id === subIndustryId)
  return subIndustry?.schema || null
}

// Helper function to search assets
export const searchAssets = (query: string): string[] => {
  const allAssets = getAllSpecificAssets()
  return allAssets.filter(asset => 
    asset.toLowerCase().includes(query.toLowerCase())
  )
}