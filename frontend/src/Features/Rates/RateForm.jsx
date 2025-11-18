import React, { useState, useEffect } from "react";
import {
  X,
  Plane,
  Ship,
  Plus,
  Save,
  Trash2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Container,
  MapPin,
  ArrowRight,
} from "lucide-react";
import * as RateAPI from '../../api/rateAPI';

export default function RateForm({ onClose, editRate, onSuccess }) {
  const [step, setStep] = useState(1);
  const [freightType, setFreightType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Base route information (shared across all routes)
  const [baseInfo, setBaseInfo] = useState({
    origin: '',
    destination: '',
  });

  // Multiple routes array - each route is a separate rate entry
  const [routes, setRoutes] = useState([
    {
      id: 1,
      airline: '',
      liner: '',
      route: '',
      surcharges: '',
      transitTime: '',
      transshipmentTime: '', // New for Air Freight
      frequency: '',
      routingType: 'DIRECT',
      validateDate: '',
      note: '', // Note field for all categories
      remark: '', // New for Air Freight
      // Air Freight rates
      rate45Minus: '',
      rate45MinusM: '', // New -45Kg(M)
      rate45Plus: '',
      rate100: '',
      rate300: '',
      rate500: '',
      rate1000: '',
      // Sea FCL rates
      rate20GP: '',
      rate40GP: '',
      rate40HQ: '',
      // Sea LCL rate
      lclRate: '',
    },
  ]);

  // Initialize form when editing
  useEffect(() => {
    if (editRate) {
      setFreightType(editRate.freightType || '');
      setStep(2);
      
      setBaseInfo({
        origin: editRate.origin || '',
        destination: editRate.destination || '',
      });

      // Load the single rate into the first route
      setRoutes([{
        id: 1,
        airline: editRate.airline || '',
        liner: editRate.liner || '',
        route: editRate.route || '',
        surcharges: editRate.surcharges || '',
        transitTime: editRate.transitTime || '',
        transshipmentTime: editRate.transshipmentTime || '',
        frequency: editRate.frequency || '',
        routingType: editRate.routingType || 'DIRECT',
        validateDate: editRate.validateDate || '',
        note: editRate.note || '',
        remark: editRate.remark || '',
        rate45Minus: editRate.rate45Minus || '',
        rate45MinusM: editRate.rate45MinusM || '',
        rate45Plus: editRate.rate45Plus || '',
        rate100: editRate.rate100 || '',
        rate300: editRate.rate300 || '',
        rate500: editRate.rate500 || '',
        rate1000: editRate.rate1000 || '',
        rate20GP: editRate.rate20GP || '',
        rate40GP: editRate.rate40GP || '',
        rate40HQ: editRate.rate40HQ || '',
        lclRate: editRate.lclRate || '',
      }]);
    }
  }, [editRate]);

  // Handle freight type selection
  const handleFreightTypeSelect = (type) => {
    setFreightType(type);
    setStep(2);
    // Reset routes to 3 default when changing freight type
    if (!editRate) {
      setRoutes([
        { id: 1, ...getEmptyRoute() },
        { id: 2, ...getEmptyRoute() },
        { id: 3, ...getEmptyRoute() },
      ]);
    }
  };

  // Get empty route object
  const getEmptyRoute = () => ({
    airline: '',
    liner: '',
    route: '',
    surcharges: '',
    transitTime: '',
    transshipmentTime: '',
    frequency: '',
    routingType: 'DIRECT',
    validateDate: '',
    note: '',
    remark: '',
    rate45Minus: '',
    rate45MinusM: '',
    rate45Plus: '',
    rate100: '',
    rate300: '',
    rate500: '',
    rate1000: '',
    rate20GP: '',
    rate40GP: '',
    rate40HQ: '',
    lclRate: '',
  });

  // Add new route
  const handleAddRoute = () => {
    const newId = Math.max(...routes.map(r => r.id)) + 1;
    setRoutes([...routes, { id: newId, ...getEmptyRoute() }]);
  };

  // Remove route
  const handleRemoveRoute = (id) => {
    if (routes.length > 1) {
      setRoutes(routes.filter(r => r.id !== id));
    }
  };

  // Handle base info change
  const handleBaseInfoChange = (e) => {
    const { name, value } = e.target;
    setBaseInfo(prev => ({ ...prev, [name]: value }));
  };

  // Handle route field change
  const handleRouteChange = (routeId, field, value) => {
    setRoutes(routes.map(route => 
      route.id === routeId ? { ...route, [field]: value } : route
    ));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!baseInfo.origin) newErrors.origin = 'Origin is required';
    if (!baseInfo.destination) newErrors.destination = 'Destination is required';

    // Validate at least one route has data
    const hasValidRoute = routes.some(route => 
      route.route || 
      route.airline || 
      route.liner ||
      (freightType.includes('air') && (route.rate45Plus || route.rate100)) ||
      (freightType.includes('fcl') && (route.rate20GP || route.rate40GP)) ||
      (freightType.includes('lcl') && route.lclRate)
    );

    if (!hasValidRoute) {
      newErrors.routes = 'At least one route must have data';
    }

    // Validate Note and Remark for each route with data
    routes.forEach((route, index) => {
      const hasRouteData = route.route || route.airline || route.liner ||
        (freightType.includes('air') && (route.rate45Plus || route.rate100)) ||
        (freightType.includes('fcl') && (route.rate20GP || route.rate40GP)) ||
        (freightType.includes('lcl') && route.lclRate);

      if (hasRouteData) {
        // Note is required for all routes with data
        if (!route.note || route.note.trim() === '') {
          newErrors[`route_${route.id}_note`] = 'Note is required';
        }

        // Remark is required for air freight routes with data
        if (freightType.includes('air') && (!route.remark || route.remark.trim() === '')) {
          newErrors[`route_${route.id}_remark`] = 'Remark is required for air freight';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission - Save routes individually
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // If editing, update the existing rate
      if (editRate) {
        const routeData = routes[0]; // Only one route when editing
        const ratePayload = {
          freightType,
          origin: baseInfo.origin,
          destination: baseInfo.destination,
          airline: routeData.airline || null,
          liner: routeData.liner || null,
          route: routeData.route || null,
          surcharges: routeData.surcharges || null,
          transitTime: routeData.transitTime || null,
          transshipmentTime: routeData.transshipmentTime || null,
          frequency: routeData.frequency || null,
          routingType: routeData.routingType || 'DIRECT',
          validateDate: routeData.validateDate || null,
          note: routeData.note || null,
          remark: routeData.remark || null,
          rateDataJson: JSON.stringify({
            rate45Minus: routeData.rate45Minus || null,
            rate45MinusM: routeData.rate45MinusM || null,
            rate45Plus: routeData.rate45Plus || null,
            rate100: routeData.rate100 || null,
            rate300: routeData.rate300 || null,
            rate500: routeData.rate500 || null,
            rate1000: routeData.rate1000 || null,
            rate20GP: routeData.rate20GP || null,
            rate40GP: routeData.rate40GP || null,
            rate40HQ: routeData.rate40HQ || null,
            lclRate: routeData.lclRate || null,
          })
        };

        await RateAPI.updateRate(editRate.id, ratePayload);
        onSuccess();
      } else {
        // Save each route individually
        const savePromises = routes
          .filter(route => 
            // Only save routes that have meaningful data
            route.route || 
            route.airline || 
            route.liner ||
            (freightType.includes('air') && (route.rate45Plus || route.rate100)) ||
            (freightType.includes('fcl') && (route.rate20GP || route.rate40GP)) ||
            (freightType.includes('lcl') && route.lclRate)
          )
          .map(route => {
            const ratePayload = {
              freightType,
              origin: baseInfo.origin,
              destination: baseInfo.destination,
              airline: route.airline || null,
              liner: route.liner || null,
              route: route.route || null,
              surcharges: route.surcharges || null,
              transitTime: route.transitTime || null,
              transshipmentTime: route.transshipmentTime || null,
              frequency: route.frequency || null,
              routingType: route.routingType || 'DIRECT',
              validateDate: route.validateDate || null,
              note: route.note || null,
              remark: route.remark || null,
              rateDataJson: JSON.stringify({
                rate45Minus: route.rate45Minus || null,
                rate45MinusM: route.rate45MinusM || null,
                rate45Plus: route.rate45Plus || null,
                rate100: route.rate100 || null,
                rate300: route.rate300 || null,
                rate500: route.rate500 || null,
                rate1000: route.rate1000 || null,
                rate20GP: route.rate20GP || null,
                rate40GP: route.rate40GP || null,
                rate40HQ: route.rate40HQ || null,
                lclRate: route.lclRate || null,
              })
            };
            console.log('Creating rate with payload:', ratePayload);
            return RateAPI.createRate(ratePayload);
          });

        await Promise.all(savePromises);
        onSuccess();
      }
    } catch (err) {
      console.error('Error saving rates:', err);
      setErrors({ submit: 'Failed to save rates. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render freight type selection
  const renderFreightTypeSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Select Freight Type</h3>
        <p className="text-slate-600">Choose the type of freight service for this rate</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Air Import */}
        <button
          onClick={() => handleFreightTypeSelect('air-import')}
          className="p-6 border-2 border-slate-200 rounded-xl hover:border-sky-500 hover:bg-sky-50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center group-hover:bg-sky-500 transition-colors">
              <Plane className="w-6 h-6 text-sky-600 group-hover:text-white" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-slate-800">Air Import</h4>
              <p className="text-sm text-slate-600">Inbound air freight rates</p>
            </div>
          </div>
        </button>

        {/* Air Export */}
        <button
          onClick={() => handleFreightTypeSelect('air-export')}
          className="p-6 border-2 border-slate-200 rounded-xl hover:border-sky-500 hover:bg-sky-50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center group-hover:bg-sky-500 transition-colors">
              <Plane className="w-6 h-6 text-sky-600 group-hover:text-white" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-slate-800">Air Export</h4>
              <p className="text-sm text-slate-600">Outbound air freight rates</p>
            </div>
          </div>
        </button>

        {/* Sea Import FCL */}
        <button
          onClick={() => handleFreightTypeSelect('sea-import-fcl')}
          className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
              <Ship className="w-6 h-6 text-blue-600 group-hover:text-white" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-slate-800">Sea Import FCL</h4>
              <p className="text-sm text-slate-600">Full container load import</p>
            </div>
          </div>
        </button>

        {/* Sea Import LCL */}
        <button
          onClick={() => handleFreightTypeSelect('sea-import-lcl')}
          className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
              <Container className="w-6 h-6 text-blue-600 group-hover:text-white" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-slate-800">Sea Import LCL</h4>
              <p className="text-sm text-slate-600">Less than container load import</p>
            </div>
          </div>
        </button>

        {/* Sea Export FCL */}
        <button
          onClick={() => handleFreightTypeSelect('sea-export-fcl')}
          className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
              <Ship className="w-6 h-6 text-blue-600 group-hover:text-white" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-slate-800">Sea Export FCL</h4>
              <p className="text-sm text-slate-600">Full container load export</p>
            </div>
          </div>
        </button>

        {/* Sea Export LCL */}
        <button
          onClick={() => handleFreightTypeSelect('sea-export-lcl')}
          className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
              <Container className="w-6 h-6 text-blue-600 group-hover:text-white" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-slate-800">Sea Export LCL</h4>
              <p className="text-sm text-slate-600">Less than container load export</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  // Render single route form
  const renderRouteForm = (route, index) => {
    const isAirFreight = freightType.includes('air');
    const isFCL = freightType.includes('fcl');
    const isLCL = freightType.includes('lcl');

    return (
      <div key={route.id} className="bg-slate-50 rounded-xl p-6 border-2 border-slate-200">
        {/* Route Header */}
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-indigo-600" />
            Route {index + 1}
          </h4>
          {routes.length > 1 && (
            <button
              type="button"
              onClick={() => handleRemoveRoute(route.id)}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
              title="Remove route"
            >
              <Trash2 className="w-5 h-5 text-slate-600 group-hover:text-red-600" />
            </button>
          )}
        </div>

        {/* Route Details */}
        <div className="space-y-6">
          {/* Carrier and Route Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isAirFreight && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Airline</label>
                <input
                  type="text"
                  value={route.airline}
                  onChange={(e) => handleRouteChange(route.id, 'airline', e.target.value)}
                  placeholder="Enter airline"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
            {!isAirFreight && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Liner</label>
                <input
                  type="text"
                  value={route.liner}
                  onChange={(e) => handleRouteChange(route.id, 'liner', e.target.value)}
                  placeholder="Enter liner"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Route</label>
              <input
                type="text"
                value={route.route}
                onChange={(e) => handleRouteChange(route.id, 'route', e.target.value)}
                placeholder="e.g., CMB-SIN-BKK"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Routing Type</label>
              <select
                value={route.routingType}
                onChange={(e) => handleRouteChange(route.id, 'routingType', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="DIRECT">Direct</option>
                <option value="TRANSSHIP">Transship</option>
              </select>
            </div>
          </div>

          {/* Transit and Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Transit Time</label>
              <input
                type="text"
                value={route.transitTime}
                onChange={(e) => handleRouteChange(route.id, 'transitTime', e.target.value)}
                placeholder="e.g., 5-7 days"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {isAirFreight && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Transshipment Time</label>
                <input
                  type="text"
                  value={route.transshipmentTime}
                  onChange={(e) => handleRouteChange(route.id, 'transshipmentTime', e.target.value)}
                  placeholder="e.g., 2-3 hours"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Frequency</label>
              <input
                type="text"
                value={route.frequency}
                onChange={(e) => handleRouteChange(route.id, 'frequency', e.target.value)}
                placeholder="e.g., Daily, 3x weekly"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Surcharges and Valid Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Surcharges</label>
              <input
                type="text"
                value={route.surcharges}
                onChange={(e) => handleRouteChange(route.id, 'surcharges', e.target.value)}
                placeholder="Enter applicable surcharges"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                Valid Until
              </label>
              <input
                type="date"
                value={route.validateDate}
                onChange={(e) => handleRouteChange(route.id, 'validateDate', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Air Freight Rates */}
          {isAirFreight && (
            <div className="space-y-4">
              <h5 className="font-medium text-slate-700 text-sm uppercase tracking-wide">Air Freight Rates (USD/KG)</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">-45 KG</label>
                  <input
                    type="number"
                    step="0.01"
                    value={route.rate45Minus}
                    onChange={(e) => handleRouteChange(route.id, 'rate45Minus', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">-45 KG (M)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={route.rate45MinusM}
                    onChange={(e) => handleRouteChange(route.id, 'rate45MinusM', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">+45 KG</label>
                  <input
                    type="number"
                    step="0.01"
                    value={route.rate45Plus}
                    onChange={(e) => handleRouteChange(route.id, 'rate45Plus', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">+100 KG</label>
                  <input
                    type="number"
                    step="0.01"
                    value={route.rate100}
                    onChange={(e) => handleRouteChange(route.id, 'rate100', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">+300 KG</label>
                  <input
                    type="number"
                    step="0.01"
                    value={route.rate300}
                    onChange={(e) => handleRouteChange(route.id, 'rate300', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">+500 KG</label>
                  <input
                    type="number"
                    step="0.01"
                    value={route.rate500}
                    onChange={(e) => handleRouteChange(route.id, 'rate500', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">+1000 KG</label>
                  <input
                    type="number"
                    step="0.01"
                    value={route.rate1000}
                    onChange={(e) => handleRouteChange(route.id, 'rate1000', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Air Freight Remark */}
          {isAirFreight && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Remark <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={route.remark}
                onChange={(e) => handleRouteChange(route.id, 'remark', e.target.value)}
                placeholder="Additional remarks for this rate"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors[`route_${route.id}_remark`] ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors[`route_${route.id}_remark`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`route_${route.id}_remark`]}</p>
              )}
            </div>
          )}

          {/* Sea FCL Rates */}
          {isFCL && (
            <div className="space-y-4">
              <h5 className="font-medium text-slate-700 text-sm uppercase tracking-wide">FCL Container Rates (USD)</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">20' GP</label>
                  <input
                    type="number"
                    step="0.01"
                    value={route.rate20GP}
                    onChange={(e) => handleRouteChange(route.id, 'rate20GP', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">40' GP</label>
                  <input
                    type="number"
                    step="0.01"
                    value={route.rate40GP}
                    onChange={(e) => handleRouteChange(route.id, 'rate40GP', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">40' HQ</label>
                  <input
                    type="number"
                    step="0.01"
                    value={route.rate40HQ}
                    onChange={(e) => handleRouteChange(route.id, 'rate40HQ', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sea LCL Rate */}
          {isLCL && (
            <div className="space-y-4">
              <h5 className="font-medium text-slate-700 text-sm uppercase tracking-wide">LCL Rate</h5>
              <div className="md:w-1/3">
                <label className="block text-sm font-medium text-slate-700 mb-2">LCL Rate (USD/CBM or W/M)</label>
                <input
                  type="number"
                  step="0.01"
                  value={route.lclRate}
                  onChange={(e) => handleRouteChange(route.id, 'lclRate', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Note Field - For All Categories */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Note <span className="text-red-500">*</span>
            </label>
            <textarea
              value={route.note}
              onChange={(e) => handleRouteChange(route.id, 'note', e.target.value)}
              placeholder="Additional notes for this rate..."
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                errors[`route_${route.id}_note`] ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors[`route_${route.id}_note`] && (
              <p className="text-red-500 text-xs mt-1">{errors[`route_${route.id}_note`]}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render rate creation form
  const renderRateForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Base Route Information */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-600" />
          Route Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Origin <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="origin"
              value={baseInfo.origin}
              onChange={handleBaseInfoChange}
              placeholder="e.g., CMB, Colombo"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.origin ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.origin && (
              <p className="text-red-500 text-xs mt-1">{errors.origin}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Destination <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="destination"
              value={baseInfo.destination}
              onChange={handleBaseInfoChange}
              placeholder="e.g., SIN, Singapore"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.destination ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.destination && (
              <p className="text-red-500 text-xs mt-1">{errors.destination}</p>
            )}
          </div>
        </div>
      </div>

      {/* Create New Rates Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            Create New Rate{routes.length > 1 ? 's' : ''}
            <span className="text-sm font-normal text-slate-600">
              ({routes.length} route{routes.length > 1 ? 's' : ''})
            </span>
          </h4>
          <button
            type="button"
            onClick={handleAddRoute}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Route
          </button>
        </div>

        {errors.routes && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-red-700 text-sm">{errors.routes}</p>
            </div>
          </div>
        )}

        {/* Render all routes */}
        {routes.map((route, index) => renderRouteForm(route, index))}
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-red-700 text-sm">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-all font-medium"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-all font-medium flex items-center gap-2 justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {editRate ? 'Updating...' : 'Saving Rates...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {editRate ? 'Update Rate' : `Save ${routes.length} Rate${routes.length > 1 ? 's' : ''}`}
            </>
          )}
        </button>
      </div>
    </form>
  );

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            {freightType.includes('air') ? (
              <Plane className="w-6 h-6 text-white" />
            ) : (
              <Ship className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {editRate ? 'Edit Rate' : 'Create New Rate'}
            </h2>
            {step === 2 && (
              <p className="text-indigo-100 text-sm mt-1">
                {freightType.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {step === 1 && renderFreightTypeSelection()}
        {step === 2 && renderRateForm()}
      </div>
    </div>
  );
}