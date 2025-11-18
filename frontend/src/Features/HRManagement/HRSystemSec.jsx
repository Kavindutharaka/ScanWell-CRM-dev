import React, { useState } from 'react';
import {
  Building2,
  Briefcase,
  Plus,
  Edit,
  Trash2,
  Search
} from 'lucide-react';

export default function HRSystemSec({ 
  modalOpen, 
  departments, 
  positions, 
  setSelectedItem, 
  activeTab, 
  setActiveTab,
  setDepartments,
  setPositions,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'positions', label: 'Positions', icon: Briefcase }
  ];

  const handleAdd = () => {
    setSelectedItem(null);
    modalOpen();
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    modalOpen();
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) {
      if (activeTab === 'departments') {
        setDepartments(departments.filter(d => d.id !== id));
      } else {
        setPositions(positions.filter(p => p.id !== id));
      }
    }
  };

  const getFilteredData = () => {
    const data = activeTab === 'departments' ? departments : positions;
    if(activeTab === 'departments'){
       return data.filter(item => 
      item.d_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    }else if(activeTab === 'positions'){
         return data.filter(item => 
      item.p_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    }
   
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">HR System Management</h1>
        <p className="text-slate-600">Manage departments and positions</p>
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add {activeTab.slice(0, -1)}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-6">
          <div className="space-y-3">
            {getFilteredData().map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {activeTab === 'departments' ? (
                    <Building2 className="w-5 h-5 text-slate-400" />
                  ) : (
                    <Briefcase className="w-5 h-5 text-slate-400" />
                  )}
                  <span className="text-slate-900 font-medium">{activeTab === 'departments' ?  item.d_name : item.p_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.sysID)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {getFilteredData().length === 0 && (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-2">
                  {activeTab === 'departments' ? (
                    <Building2 className="w-12 h-12 mx-auto" />
                  ) : (
                    <Briefcase className="w-12 h-12 mx-auto" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">
                  No {activeTab} found
                </h3>
                <p className="text-slate-500">
                  {searchTerm ? 'Try adjusting your search' : `Add your first ${activeTab.slice(0, -1)}`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}