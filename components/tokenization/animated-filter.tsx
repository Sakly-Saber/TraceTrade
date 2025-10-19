'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, Search, Plus, X } from 'lucide-react'
import { INDUSTRY_DATA, Industry, SubIndustry } from '@/lib/data/industry-filters'

interface AnimatedFilterProps {
  onSelectionChange: (industry: string, subIndustry: string, specificAsset: string) => void
  className?: string
}

interface FilterState {
  selectedIndustry: Industry | null
  selectedSubIndustry: SubIndustry | null
  selectedSpecificAsset: string
  customAsset: string
  showCustomInput: boolean
}

export const AnimatedThreeTierFilter: React.FC<AnimatedFilterProps> = ({
  onSelectionChange,
  className = ''
}) => {
  const [filterState, setFilterState] = useState<FilterState>({
    selectedIndustry: null,
    selectedSubIndustry: null,
    selectedSpecificAsset: '',
    customAsset: '',
    showCustomInput: false
  })

  const [searchTerms, setSearchTerms] = useState({
    industry: '',
    subIndustry: '',
    specificAsset: ''
  })

  const [openDropdowns, setOpenDropdowns] = useState({
    industry: false,
    subIndustry: false,
    specificAsset: false
  })

  // Filter industries based on search term
  const filteredIndustries = INDUSTRY_DATA.filter(industry =>
    industry.name.toLowerCase().includes(searchTerms.industry.toLowerCase())
  )

  // Filter sub-industries based on search term
  const filteredSubIndustries = filterState.selectedIndustry?.subIndustries.filter(subIndustry =>
    subIndustry.name.toLowerCase().includes(searchTerms.subIndustry.toLowerCase())
  ) || []

  // Filter specific assets based on search term
  const filteredSpecificAssets = filterState.selectedSubIndustry?.specificAssets.filter(asset =>
    asset.toLowerCase().includes(searchTerms.specificAsset.toLowerCase())
  ) || []

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.dropdown-container')) {
        setOpenDropdowns({ industry: false, subIndustry: false, specificAsset: false })
      }
    }

    if (openDropdowns.industry || openDropdowns.subIndustry || openDropdowns.specificAsset) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdowns])

  // Handle selection changes
  const handleIndustrySelect = (industry: Industry) => {
    console.log('Industry selected:', industry) // Debug log
    setFilterState(prev => ({
      ...prev,
      selectedIndustry: industry,
      selectedSubIndustry: null,
      selectedSpecificAsset: '',
      customAsset: '',
      showCustomInput: false
    }))
    setOpenDropdowns(prev => ({ ...prev, industry: false, subIndustry: true }))
    setSearchTerms(prev => ({ ...prev, subIndustry: '', specificAsset: '' }))
  }

  const handleSubIndustrySelect = (subIndustry: SubIndustry) => {
    setFilterState(prev => ({
      ...prev,
      selectedSubIndustry: subIndustry,
      selectedSpecificAsset: '',
      customAsset: '',
      showCustomInput: false
    }))
    setOpenDropdowns(prev => ({ ...prev, subIndustry: false, specificAsset: true }))
    setSearchTerms(prev => ({ ...prev, specificAsset: '' }))
  }

  const handleSpecificAssetSelect = (asset: string) => {
    setFilterState(prev => ({
      ...prev,
      selectedSpecificAsset: asset,
      customAsset: '',
      showCustomInput: false
    }))
    setOpenDropdowns(prev => ({ ...prev, specificAsset: false }))
  }

  const handleCustomAssetAdd = () => {
    if (filterState.customAsset.trim()) {
      setFilterState(prev => ({
        ...prev,
        selectedSpecificAsset: prev.customAsset,
        showCustomInput: false
      }))
      setOpenDropdowns(prev => ({ ...prev, specificAsset: false }))
    }
  }

  // Notify parent of selection changes
  useEffect(() => {
    if (filterState.selectedIndustry && filterState.selectedSubIndustry && filterState.selectedSpecificAsset) {
      onSelectionChange(
        filterState.selectedIndustry.id,
        filterState.selectedSubIndustry.id,
        filterState.selectedSpecificAsset
      )
    }
  }, [filterState.selectedIndustry, filterState.selectedSubIndustry, filterState.selectedSpecificAsset, onSelectionChange])

  const DropdownWrapper: React.FC<{ 
    children: React.ReactNode
    isOpen: boolean
    className?: string 
  }> = ({ children, isOpen, className = '' }) => (
    <div className={`
      relative transition-all duration-300 ease-in-out
      ${isOpen ? 'z-[9999]' : 'z-[1]'}
      ${className}
    `}>
      <div className={`
        absolute top-full left-0 right-0 mt-3
        bg-white border border-gray-200
        rounded-2xl shadow-2xl overflow-hidden
        min-w-[320px]
        transition-all duration-300 ease-out
        ${isOpen 
          ? 'opacity-100 translate-y-0 scale-100 visible' 
          : 'opacity-0 -translate-y-4 scale-95 invisible pointer-events-none'
        }
        z-[9999]
      `}>
        <div className="relative z-[9999] max-h-80 overflow-y-auto custom-scrollbar bg-white">
          {children}
        </div>
      </div>
    </div>
  )

  return (
    <div className={`w-full space-y-6 ${className}`}>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          margin: 8px 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          border-radius: 12px;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 50%, #ec4899 100%);
          transform: scale(1.1);
        }
      `}</style>

      {/* Filter Header */}
      <div className="text-center space-y-4 mb-8">
        <div className="relative">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Asset Classification System
          </h3>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        </div>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Select your asset category through our intelligent 3-tier filter system
        </p>
        
        {/* Progress Steps */}
        <div className="flex justify-center items-center gap-4 mt-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500
                ${(step === 1 && filterState.selectedIndustry) || 
                  (step === 2 && filterState.selectedSubIndustry) || 
                  (step === 3 && filterState.selectedSpecificAsset)
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-110' 
                  : step === 1 ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : step === 2 && filterState.selectedIndustry ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                  : step === 3 && filterState.selectedSubIndustry ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-500'
                }
              `}>
                {((step === 1 && filterState.selectedIndustry) || 
                  (step === 2 && filterState.selectedSubIndustry) || 
                  (step === 3 && filterState.selectedSpecificAsset)) ? '✓' : step}
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 mx-2 rounded-full transition-all duration-500 ${
                  (step === 1 && filterState.selectedIndustry) || 
                  (step === 2 && filterState.selectedSubIndustry)
                    ? 'bg-gradient-to-r from-green-400 to-green-500' 
                    : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* First Filter: Industry Type */}
        <div className="space-y-4 dropdown-container">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-3">
            <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              1
            </span>
            <span className="text-base">Industry Type</span>
          </label>
          
          <div className="relative">
            <button
              onClick={() => setOpenDropdowns(prev => ({ ...prev, industry: !prev.industry }))}
              className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl text-left flex items-center justify-between transition-all duration-300 hover:bg-white hover:shadow-xl hover:border-blue-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500/20 group relative overflow-hidden shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="relative z-10 flex items-center gap-4">
                {filterState.selectedIndustry ? (
                  <>
                    <span className="text-3xl transform group-hover:scale-110 transition-transform duration-300">
                      {filterState.selectedIndustry.icon}
                    </span>
                    <div>
                      <span className="font-semibold text-gray-800 text-lg">{filterState.selectedIndustry.name}</span>
                      <div className="text-sm text-gray-500">Industry selected</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">🏢</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Select Industry...</span>
                      <div className="text-sm text-gray-400">Choose your sector</div>
                    </div>
                  </>
                )}
              </span>
              <ChevronDown className={`w-6 h-6 text-gray-400 transition-all duration-300 ${openDropdowns.industry ? 'rotate-180 text-blue-500' : ''}`} />
            </button>

            <DropdownWrapper isOpen={openDropdowns.industry}>
              <div className="p-6 border-b border-white/10">
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search industries..."
                    value={searchTerms.industry}
                    onChange={(e) => setSearchTerms(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full pl-14 pr-6 py-4 bg-white/70 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all duration-200 text-gray-700 placeholder-gray-400 text-base font-medium"
                  />
                </div>
              </div>
              
              <div className="p-3 max-h-80 overflow-y-auto custom-scrollbar bg-white">
                {filteredIndustries.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerms.industry ? 'No industries found matching your search' : 'No industries available'}
                  </div>
                ) : (
                  filteredIndustries.map((industry) => (
                    <button
                      key={industry.id}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('Clicked industry:', industry.name)
                        handleIndustrySelect(industry)
                      }}
                      className="w-full px-3 py-3 text-left hover:bg-blue-50 rounded-xl transition-all duration-200 flex items-center gap-3 group hover:shadow-sm border border-transparent hover:border-blue-200 bg-white"
                    >
                      <span className="text-2xl flex-shrink-0 group-hover:scale-105 transition-all duration-200">
                        {industry.icon}
                      </span>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="font-semibold text-gray-800 text-sm group-hover:text-blue-700 transition-colors duration-200 whitespace-nowrap overflow-hidden text-ellipsis">
                          {industry.name}
                        </div>
                        <div className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors duration-200 whitespace-nowrap overflow-hidden text-ellipsis">
                          {industry.subIndustries.length} categories
                        </div>
                      </div>
                    <ChevronDown className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transform rotate-[-90deg] transition-all duration-200 flex-shrink-0" />
                    </button>
                  ))
                )}
                <div className="p-2 text-xs text-gray-400 border-t border-gray-100 mt-2">
                  {filteredIndustries.length} industries available
                </div>
              </div>
            </DropdownWrapper>
          </div>
        </div>

        {/* Second Filter: Sub-Industry */}
        <div className="space-y-4 dropdown-container">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-500 ${
              filterState.selectedIndustry 
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' 
                : 'bg-gray-200 text-gray-400'
            }`}>
              2
            </span>
            <span className="text-base">Sub-Category</span>
          </label>
          
          <div className="relative">
            <button
              onClick={() => filterState.selectedIndustry && setOpenDropdowns(prev => ({ ...prev, subIndustry: !prev.subIndustry }))}
              disabled={!filterState.selectedIndustry}
              className={`w-full px-6 py-4 border rounded-2xl text-left flex items-center justify-between
                         transition-all duration-300 relative overflow-hidden shadow-lg group
                         ${filterState.selectedIndustry 
                           ? 'bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-xl hover:border-purple-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500/20' 
                           : 'bg-gray-50/80 border-gray-100 cursor-not-allowed opacity-60'
                         }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="relative z-10 flex items-center gap-4">
                {filterState.selectedSubIndustry ? (
                  <>
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">📂</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800 text-lg">{filterState.selectedSubIndustry.name}</span>
                      <div className="text-sm text-gray-500">Sub-category selected</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      filterState.selectedIndustry 
                        ? 'bg-gradient-to-r from-purple-100 to-pink-100' 
                        : 'bg-gray-100'
                    }`}>
                      <span className="text-xl">📁</span>
                    </div>
                    <div>
                      <span className={`font-medium ${filterState.selectedIndustry ? "text-gray-500" : "text-gray-400"}`}>
                        {filterState.selectedIndustry ? "Select Sub-Category..." : "Select Industry First"}
                      </span>
                      <div className="text-sm text-gray-400">
                        {filterState.selectedIndustry ? "Choose your category" : "Step 1 required"}
                      </div>
                    </div>
                  </>
                )}
              </span>
              <ChevronDown className={`w-6 h-6 text-gray-400 transition-all duration-300 ${
                openDropdowns.subIndustry ? 'rotate-180 text-purple-500' : ''
              } ${!filterState.selectedIndustry ? 'opacity-30' : ''}`} />
            </button>

            {filterState.selectedIndustry && (
              <DropdownWrapper isOpen={openDropdowns.subIndustry}>
                <div className="p-6 border-b border-white/10">
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search sub-categories..."
                      value={searchTerms.subIndustry}
                      onChange={(e) => setSearchTerms(prev => ({ ...prev, subIndustry: e.target.value }))}
                      className="w-full pl-14 pr-6 py-4 bg-white/70 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:bg-white transition-all duration-200 text-gray-700 placeholder-gray-400 text-base font-medium"
                    />
                  </div>
                </div>
                
                <div className="p-3 max-h-80 overflow-y-auto custom-scrollbar bg-white">
                  {filteredSubIndustries.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchTerms.subIndustry ? 'No sub-categories found matching your search' : 'No sub-categories available'}
                    </div>
                  ) : (
                    filteredSubIndustries.map((subIndustry) => (
                      <button
                        key={subIndustry.id}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleSubIndustrySelect(subIndustry)
                        }}
                        className="w-full px-3 py-3 text-left hover:bg-purple-50 rounded-xl transition-all duration-200 group hover:shadow-sm border border-transparent hover:border-purple-200 bg-white"
                      >
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                            <span className="text-lg">📁</span>
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="font-semibold text-gray-800 text-sm group-hover:text-purple-700 transition-colors duration-200 whitespace-nowrap overflow-hidden text-ellipsis">
                              {subIndustry.name}
                            </div>
                            <div className="text-xs text-gray-500 group-hover:text-purple-500 transition-colors duration-200 whitespace-nowrap overflow-hidden text-ellipsis">
                              {subIndustry.specificAssets.length} assets
                            </div>
                          </div>
                        <ChevronDown className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transform rotate-[-90deg] transition-all duration-200 flex-shrink-0" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </DropdownWrapper>
            )}
          </div>
        </div>

        {/* Third Filter: Specific Asset */}
        <div className="space-y-4 dropdown-container">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-500 ${
              filterState.selectedSubIndustry 
                ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white' 
                : 'bg-gray-200 text-gray-400'
            }`}>
              3
            </span>
            <span className="text-base">Specific Asset</span>
          </label>
          
          <div className="relative">
            <button
              onClick={() => filterState.selectedSubIndustry && setOpenDropdowns(prev => ({ ...prev, specificAsset: !prev.specificAsset }))}
              disabled={!filterState.selectedSubIndustry}
              className={`w-full px-6 py-4 border rounded-2xl text-left flex items-center justify-between
                         transition-all duration-300 relative overflow-hidden shadow-lg group
                         ${filterState.selectedSubIndustry 
                           ? 'bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-xl hover:border-pink-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-pink-500/20' 
                           : 'bg-gray-50/80 border-gray-100 cursor-not-allowed opacity-60'
                         }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-red-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="relative z-10 flex items-center gap-4">
                {filterState.selectedSpecificAsset ? (
                  <>
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-100 to-red-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">💎</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800 text-lg">{filterState.selectedSpecificAsset}</span>
                      <div className="text-sm text-gray-500">Asset selected</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      filterState.selectedSubIndustry 
                        ? 'bg-gradient-to-r from-pink-100 to-red-100' 
                        : 'bg-gray-100'
                    }`}>
                      <span className="text-xl">📦</span>
                    </div>
                    <div>
                      <span className={`font-medium ${filterState.selectedSubIndustry ? "text-gray-500" : "text-gray-400"}`}>
                        {filterState.selectedSubIndustry ? "Select Specific Asset..." : "Select Sub-Category First"}
                      </span>
                      <div className="text-sm text-gray-400">
                        {filterState.selectedSubIndustry ? "Choose your asset" : "Step 2 required"}
                      </div>
                    </div>
                  </>
                )}
              </span>
              <ChevronDown className={`w-6 h-6 text-gray-400 transition-all duration-300 ${
                openDropdowns.specificAsset ? 'rotate-180 text-pink-500' : ''
              } ${!filterState.selectedSubIndustry ? 'opacity-30' : ''}`} />
            </button>

            {filterState.selectedSubIndustry && (
              <DropdownWrapper isOpen={openDropdowns.specificAsset}>
                <div className="p-6 border-b border-white/10">
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search assets..."
                      value={searchTerms.specificAsset}
                      onChange={(e) => setSearchTerms(prev => ({ ...prev, specificAsset: e.target.value }))}
                      className="w-full pl-14 pr-6 py-4 bg-white/70 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:bg-white transition-all duration-200 text-gray-700 placeholder-gray-400 text-base font-medium"
                    />
                  </div>
                </div>
                
                <div className="p-3 max-h-80 overflow-y-auto custom-scrollbar bg-white">
                  {filteredSpecificAssets.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchTerms.specificAsset ? 'No assets found matching your search' : 'No assets available'}
                    </div>
                  ) : (
                    filteredSpecificAssets.map((asset, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleSpecificAssetSelect(asset)
                        }}
                        className="w-full px-3 py-3 text-left hover:bg-pink-50 rounded-xl transition-all duration-200 group hover:shadow-sm border border-transparent hover:border-pink-200 bg-white"
                      >
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-pink-100 to-red-100 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                            <span className="text-lg">💎</span>
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="font-semibold text-gray-800 text-sm group-hover:text-pink-700 transition-colors duration-200 whitespace-nowrap overflow-hidden text-ellipsis">
                              {asset}
                            </div>
                            <div className="text-xs text-gray-500 group-hover:text-pink-500 transition-colors duration-200 whitespace-nowrap overflow-hidden text-ellipsis">
                              Ready for tokenization
                            </div>
                          </div>
                        <ChevronDown className="w-4 h-4 text-gray-300 group-hover:text-pink-500 transform rotate-[-90deg] transition-all duration-200 flex-shrink-0" />
                        </div>
                      </button>
                    ))
                  )}
                  
                  {/* Add Custom Asset Option */}
                  <div className="border-t border-white/20 mt-4 pt-4">
                    {!filterState.showCustomInput ? (
                      <button
                        onClick={() => setFilterState(prev => ({ ...prev, showCustomInput: true }))}
                        className="w-full px-4 py-4 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 flex items-center gap-3 text-blue-600 font-medium border-2 border-dashed border-blue-200 hover:border-blue-400 group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                          <Plus className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-base truncate">Add Custom Asset</div>
                          <div className="text-xs text-blue-500 truncate">Create your own asset type</div>
                        </div>
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="text"
                            placeholder="Enter custom asset name..."
                            value={filterState.customAsset}
                            onChange={(e) => setFilterState(prev => ({ ...prev, customAsset: e.target.value }))}
                            className="flex-1 min-w-0 px-5 py-4 bg-white/70 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all duration-200 text-gray-700 placeholder-gray-400 text-base font-medium"
                          />
                          <div className="flex gap-2 sm:flex-shrink-0">
                            <button
                              onClick={handleCustomAssetAdd}
                              disabled={!filterState.customAsset.trim()}
                              className="flex-1 sm:flex-none px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl min-w-[80px]"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => setFilterState(prev => ({ ...prev, showCustomInput: false, customAsset: '' }))}
                              className="px-4 py-4 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-all duration-200 flex-shrink-0"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </DropdownWrapper>
            )}
          </div>
        </div>
      </div>

      {/* Selection Summary */}
      {filterState.selectedIndustry && filterState.selectedSubIndustry && filterState.selectedSpecificAsset && (
        <div className="mt-12 p-8 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 border-2 border-green-200 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-blue-500/5 to-purple-500/5"></div>
          <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-lg">
                ✓
              </div>
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Selection Complete
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                    <div className="text-sm font-semibold text-gray-600 mb-1">Industry</div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{filterState.selectedIndustry.icon}</span>
                      <span className="font-bold text-gray-800">{filterState.selectedIndustry.name}</span>
                    </div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                    <div className="text-sm font-semibold text-gray-600 mb-1">Category</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📁</span>
                      <span className="font-bold text-gray-800">{filterState.selectedSubIndustry.name}</span>
                    </div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                    <div className="text-sm font-semibold text-gray-600 mb-1">Asset</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💎</span>
                      <span className="font-bold text-gray-800">{filterState.selectedSpecificAsset}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full text-sm font-medium shadow-lg">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Ready to proceed with tokenization
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}