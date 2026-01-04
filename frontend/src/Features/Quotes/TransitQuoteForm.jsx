// TransitQuoteForm.jsx
import { useState, useEffect } from 'react';
import { Save, Plus, ArrowLeft, Trash2, FileDown } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BasicInfoSection from './components/BasicInfoSection';
import TransitRouteConfiguration from './components/TransitRouteConfiguration';
import EquipmentSection from './components/EquipmentSection';
import TransitChargesTable from './components/TransitChargesTable';
import TermsConditionsSection from './components/TermsConditionsSection';
import { generateQuoteNumber } from '../../utils/quoteUtils';
import { fetchQuoteById, updateQuote, createNewQuote } from '../../api/QuoteApi';
import TransitFreightChargesSection from './components/TransitFreightChargesSection';
import { generateTransitQuotePDF } from './utils/pdfGenerator';
import { fetchAccountAddress } from '../../api/AccountApi';

export default function TransitQuoteForm({ category, mode }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quoteId = searchParams.get('id');
  const isEditMode = searchParams.get('edit') === 'true';
  const isViewMode = quoteId && !isEditMode;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
  quoteNumber: '',
  createdDate: new Date().toISOString().split('T')[0],
  rateValidity: '',
  customer: '',
  pickupLocation: '',
  deliveryLocation: '',
  portOfLoading: '',
  portOfDischarge: '',
  routeOptions: [
    {
      routeName: 'Option 1',
      origin: '',
      destination: '',
      transits: [],
      carriers: [{ carrier: '', incoterm: '', currency: '', cargoType: '' }],
      // CHANGED: Freight charges now use horizontal table structure
      freightChargesTables: [
        {
          tableName: 'Default',
          charges: [
            {
              carrier: '',
              unitType: '',
              numberOfUnits: '',
              amount: '',
              currency: '',
              transitTime: '',
              numberOfRouting: '',
              surcharge: '', // Air only
              frequency: '', // Air only
              total: 0,
              remarks: ''
            }
          ]
        }
      ],
      // Keep vertical structure for these
      destinationChargesTables: [
        {
          tableName: 'Default',
          chargeNamePerLocation: {},
          unitTypePerLocation: {},
          unitsPerLocation: {},
          amountPerLocation: {},
          currencyPerLocation: {}
        }
      ],
      originHandlingTables: [
        {
          tableName: 'Default',
          chargeNamePerLocation: {},
          unitTypePerLocation: {},
          unitsPerLocation: {},
          amountPerLocation: {},
          currencyPerLocation: {}
        }
      ],
      destinationHandlingTables: [
        {
          tableName: 'Default',
          chargeNamePerLocation: {},
          unitTypePerLocation: {},
          unitsPerLocation: {},
          amountPerLocation: {},
          currencyPerLocation: {}
        }
      ]
    }
  ],
  equipment: { equipment: '', units: '', grossWeight: '', volume: '', chargeableWeight: '' },
  termsConditions: []
});

  useEffect(() => {
    if (quoteId) {
      loadQuoteData();
    } else {
      setFormData(prev => ({
        ...prev,
        quoteNumber: generateQuoteNumber()
      }));
    }
  }, [quoteId]);

   const dateFormatter =(dateTime)=>{
     if (!dateTime) return "";
    return dateTime.split("T")[0];
  };

  const loadQuoteData = async () => {
    try {
      setLoading(true);
      const data = await fetchQuoteById(quoteId);
      
      setFormData({
        quoteId: data[0].quoteId || '',
        quoteNumber: data[0].quoteNumber || '',
        createdDate: dateFormatter(data[0].createdDate) || '',
        rateValidity: dateFormatter(data[0].rateValidity) || '',
        customer: data[0].customer || '',
        pickupLocation: data[0].pickupLocation || '',
        deliveryLocation: data[0].deliveryLocation || '',
        portOfLoading: data[0].portOfLoading || '',
        portOfDischarge: data[0].portOfDischarge || '',
        routeOptions: data[0].transitRoutes ? JSON.parse(data[0].transitRoutes) : formData.routeOptions,
        equipment: data[0].equipment ? JSON.parse(data[0].equipment) : formData.equipment,
        termsConditions: data[0].termsConditions ? JSON.parse(data[0].termsConditions) : []
      });
    } catch (error) {
      console.error('Error loading quote:', error);
      alert('Failed to load quote data');
    } finally {
      setLoading(false);
    }
  };

  const addRouteOption = () => {
  if (isViewMode) return;
  
  setFormData(prev => ({
    ...prev,
    routeOptions: [
      ...prev.routeOptions,
      {
        routeName: `Option ${prev.routeOptions.length + 1}`,
        origin: '',
        destination: '',
        transits: [],
        carriers: [{ carrier: '', incoterm: '', currency: '', cargoType: '' }],
        freightChargesTables: [
          {
            tableName: 'Default',
            charges: [
              {
                carrier: '',
                unitType: '',
                numberOfUnits: '',
                amount: '',
                currency: '',
                transitTime: '',
                numberOfRouting: '',
                surcharge: '',
                frequency: '',
                total: 0,
                remarks: ''
              }
            ]
          }
        ],
        destinationChargesTables: [
          {
            tableName: 'Default',
            chargeNamePerLocation: {},
            unitTypePerLocation: {},
            unitsPerLocation: {},
            amountPerLocation: {},
            currencyPerLocation: {}
          }
        ],
        originHandlingTables: [
          {
            tableName: 'Default',
            chargeNamePerLocation: {},
            unitTypePerLocation: {},
            unitsPerLocation: {},
            amountPerLocation: {},
            currencyPerLocation: {}
          }
        ],
        destinationHandlingTables: [
          {
            tableName: 'Default',
            chargeNamePerLocation: {},
            unitTypePerLocation: {},
            unitsPerLocation: {},
            amountPerLocation: {},
            currencyPerLocation: {}
          }
        ]
      }
    ]
  }));
};

  const removeRouteOption = (routeIdx) => {
    if (isViewMode || formData.routeOptions.length === 1) return;
    
    setFormData(prev => ({
      ...prev,
      routeOptions: prev.routeOptions.filter((_, i) => i !== routeIdx)
    }));
  };

  // Add new charge table
 const addChargeTable = (routeIdx, tableType) => {
  if (isViewMode) return;
  
  const updated = [...formData.routeOptions];
  const tables = updated[routeIdx][tableType];
  const nextOptionNum = tables.length;
  
  let newTable;
  if (tableType === 'freightChargesTables') {
    // Horizontal table structure
    newTable = {
      tableName: `Option ${nextOptionNum}`,
      charges: [
        {
          carrier: '',
          unitType: '',
          numberOfUnits: '',
          amount: '',
          currency: '',
          transitTime: '',
          numberOfRouting: '',
          surcharge: '',
          frequency: '',
          total: 0,
          remarks: ''
        }
      ]
    };
  } else {
    // Vertical table structure (for other charges)
    newTable = {
      tableName: `Option ${nextOptionNum}`,
      chargeNamePerLocation: {},
      unitTypePerLocation: {},
      unitsPerLocation: {},
      amountPerLocation: {},
      currencyPerLocation: {}
    };
  }
  
  updated[routeIdx][tableType].push(newTable);
  setFormData(prev => ({ ...prev, routeOptions: updated }));
};
  // Remove charge table
  const removeChargeTable = (routeIdx, tableType, tableIdx) => {
    if (isViewMode || tableIdx === 0) return; // Can't remove default table
    
    const updated = [...formData.routeOptions];
    updated[routeIdx][tableType] = updated[routeIdx][tableType].filter((_, i) => i !== tableIdx);
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate customer
    if (!formData.customer || formData.customer.trim() === '') {
      alert('Customer is required. Please enter a customer name.');
      return;
    }
    
    const payload = {
      quoteNumber: formData.quoteNumber,
      freightCategory: category,
      freightMode: mode,
      freightType: 'transit',
      createdDate: formData.createdDate,
      rateValidity: formData.rateValidity,
      customer: formData.customer,
      pickupLocation: formData.pickupLocation,
      deliveryLocation: formData.deliveryLocation,
      portOfLoading: formData.portOfLoading,
      portOfDischarge: formData.portOfDischarge,
      transitRoutes: JSON.stringify(formData.routeOptions),
      equipment: JSON.stringify(formData.equipment),
      termsConditions: JSON.stringify(formData.termsConditions),
      status: 'draft',
      createdBy: 11,
      createdAt: new Date().toISOString()
    };

    // Add quoteId when updating
    if (quoteId) {
      payload.quoteId = quoteId;
    }

    try {
      if (quoteId) {
        await updateQuote(payload);
        alert('Quote updated successfully!');
      } else {
        await createNewQuote(payload);
        alert('Quote created successfully!');
      }
      navigate(-1);
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Failed to save quote');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {category?.toUpperCase()} - {mode?.toUpperCase()} (Transit)
            </h2>
            {isViewMode && (
              <span className="text-sm text-blue-600 font-medium">View Mode</span>
            )}
            {isEditMode && (
              <span className="text-sm text-green-600 font-medium">Edit Mode</span>
            )}
          </div>
          <div className="flex gap-2">
  {quoteId && (
    <button
      type="button"
      onClick={async () => {
        // Fetch customer address
                          let customerAddress = '';
                          if (formData.customer) {
                            try {
                              customerAddress = await fetchAccountAddress(formData.customer);
                              console.log("Customer Address:", customerAddress);
                            } catch (error) {
                              console.error("Error fetching customer address:", error);
                            }
                          }
        const pdfData = {
          quoteNumber: formData.quoteNumber,
          freightCategory: category,
          freightMode: mode,
          freightType: 'transit',
          createdDate: formData.createdDate,
          rateValidity: formData.rateValidity,
          customer: formData.customer,
          customerAddress: customerAddress,
          pickupLocation: formData.pickupLocation,
          deliveryLocation: formData.deliveryLocation,
          equipment: JSON.stringify(formData.equipment),
          transitRoutes: JSON.stringify(formData.routeOptions),
          termsConditions: JSON.stringify(formData.termsConditions)
        };
        generateTransitQuotePDF(pdfData);
      }}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
    >
      <FileDown size={18} />
      Download PDF
    </button>
  )}
  <button type="button" onClick={() => navigate(-1)}>Back</button>
</div>
        </div>

        {/* Basic Information */}
        <BasicInfoSection formData={formData} setFormData={setFormData} disabled={isViewMode} />

        {/* Route Options */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">Route Options</h3>
            {!isViewMode && (
              <button
                type="button"
                onClick={addRouteOption}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus size={18} />
                Add Option
              </button>
            )}
          </div>

          {formData.routeOptions.map((routeOption, routeIdx) => (
            <div key={routeIdx} className="border-2 border-teal-200 rounded-lg p-6 mb-6 bg-gradient-to-br from-teal-50 to-blue-50">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-teal-900">{routeOption.routeName}</h4>
                {formData.routeOptions.length > 1 && !isViewMode && (
                  <button
                    type="button"
                    onClick={() => removeRouteOption(routeIdx)}
                    className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    <Trash2 size={16} />
                    Remove Option
                  </button>
                )}
              </div>

              {/* Route Configuration */}
              <TransitRouteConfiguration
                routeOption={routeOption}
                routeIdx={routeIdx}
                formData={formData}
                setFormData={setFormData}
                category={category}
                disabled={isViewMode}
              />

              {/* Equipment Details */}
              <EquipmentSection 
                formData={formData} 
                setFormData={setFormData} 
                category={category} 
                disabled={isViewMode} 
              />

              {/* Freight Charges Tables */}
              <div className="mb-6">
  <div className="flex justify-between items-center mb-3">
    <h3 className="text-lg font-medium text-gray-700">Freight Charges</h3>
    {!isViewMode && (
      <button
        type="button"
        onClick={() => addChargeTable(routeIdx, 'freightChargesTables')}
        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
      >
        <Plus size={16} />
        Add Table
      </button>
    )}
  </div>

                {routeOption.freightChargesTables.map((table, tableIdx) => (
    <div key={tableIdx} className="mb-4">
      <TransitFreightChargesSection
        formData={formData}
        setFormData={setFormData}
        routeIdx={routeIdx}
        tableIdx={tableIdx}
        chargeData={table}
        tableName={table.tableName}
        category={category}
        disabled={isViewMode}
        onRemove={tableIdx > 0 ? () => removeChargeTable(routeIdx, 'freightChargesTables', tableIdx) : null}
      />
    </div>
  ))}
</div>

              {/* Destination Charges Tables */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-gray-700">Destination Charges (POD)</h3>
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={() => addChargeTable(routeIdx, 'destinationChargesTables')}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      <Plus size={16} />
                      Add Table
                    </button>
                  )}
                </div>

                {routeOption.destinationChargesTables.map((table, tableIdx) => (
                  <div key={tableIdx} className="mb-4">
                    <TransitChargesTable
                      title={`Destination Charges (${table.tableName})`}
                      chargeData={table}
                      routeOption={routeOption}
                      routeIdx={routeIdx}
                      tableIdx={tableIdx}
                      formData={formData}
                      setFormData={setFormData}
                      chargeType="destinationChargesTables"
                      showCarrier={false}
                      disabled={isViewMode}
                      category={category}
                      onRemove={tableIdx > 0 ? () => removeChargeTable(routeIdx, 'destinationChargesTables', tableIdx) : null}
                    />
                  </div>
                ))}
              </div>

              {/* Origin Handling Charges Tables */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-gray-700">Origin Handling Charges</h3>
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={() => addChargeTable(routeIdx, 'originHandlingTables')}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      <Plus size={16} />
                      Add Table
                    </button>
                  )}
                </div>

                {routeOption.originHandlingTables.map((table, tableIdx) => (
                  <div key={tableIdx} className="mb-4">
                    <TransitChargesTable
                      title={`Origin Handling Charges (${table.tableName})`}
                      chargeData={table}
                      routeOption={routeOption}
                      routeIdx={routeIdx}
                      tableIdx={tableIdx}
                      formData={formData}
                      setFormData={setFormData}
                      chargeType="originHandlingTables"
                      showCarrier={false}
                      disabled={isViewMode}
                      category={category}
                      onRemove={tableIdx > 0 ? () => removeChargeTable(routeIdx, 'originHandlingTables', tableIdx) : null}
                    />
                  </div>
                ))}
              </div>

              {/* Destination Handling Charges Tables */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-gray-700">Destination Handling Charges</h3>
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={() => addChargeTable(routeIdx, 'destinationHandlingTables')}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      <Plus size={16} />
                      Add Table
                    </button>
                  )}
                </div>

                {routeOption.destinationHandlingTables.map((table, tableIdx) => (
                  <div key={tableIdx} className="mb-4">
                    <TransitChargesTable
                      title={`Destination Handling Charges (${table.tableName})`}
                      chargeData={table}
                      routeOption={routeOption}
                      routeIdx={routeIdx}
                      tableIdx={tableIdx}
                      formData={formData}
                      setFormData={setFormData}
                      chargeType="destinationHandlingTables"
                      showCarrier={false}
                      disabled={isViewMode}
                      category={category}
                      onRemove={tableIdx > 0 ? () => removeChargeTable(routeIdx, 'destinationHandlingTables', tableIdx) : null}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Terms & Conditions */}
        <TermsConditionsSection formData={formData} setFormData={setFormData} disabled={isViewMode} />

        {!isViewMode && (
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save size={18} />
              {quoteId ? 'Update Quote' : 'Save Quote'}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}