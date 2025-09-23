import React from 'react';
import { Package, Clock, Users, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { formatPrice } from '../../lib/utils/formatters';
import type { ServicePackage } from '../../types/packages';

interface ServicePackageCardProps {
  package: ServicePackage;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onBook?: () => void;
}

export function ServicePackageCard({ 
  package: pkg, 
  isOwner = false, 
  onEdit, 
  onDelete, 
  onBook 
}: ServicePackageCardProps) {
  const pricePerSession = pkg.price / pkg.sessions_included;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-accent-text/10 overflow-hidden hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent-text/5 to-accent-text/10 p-6 border-b border-accent-text/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-accent-text/10 rounded-lg mr-3">
              <Package className="h-5 w-5 text-accent-text" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-content">{pkg.name}</h3>
              <p className="text-sm text-content/60">
                {pkg.sessions_included} sessions • {pkg.duration_weeks} weeks
              </p>
            </div>
          </div>
          
          {isOwner && (
            <div className="flex items-center space-x-2">
              <button
                onClick={onEdit}
                className="p-2 text-accent-text hover:bg-accent-text/10 rounded-full transition-colors"
                title="Edit package"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Delete package"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Description */}
        <p className="text-content/80 mb-4 leading-relaxed">
          {pkg.description}
        </p>

        {/* Features */}
        {pkg.features && pkg.features.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-content mb-3">What's included:</h4>
            <div className="space-y-2">
              {pkg.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  <span className="text-sm text-content/80">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Package Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-accent-base/5 rounded-lg p-3">
            <div className="flex items-center text-content/60 mb-1">
              <Users className="h-4 w-4 mr-1" />
              <span className="text-xs">Sessions</span>
            </div>
            <p className="font-semibold text-content">{pkg.sessions_included}</p>
          </div>
          
          <div className="bg-accent-base/5 rounded-lg p-3">
            <div className="flex items-center text-content/60 mb-1">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-xs">Duration</span>
            </div>
            <p className="font-semibold text-content">{pkg.duration_weeks} weeks</p>
          </div>
        </div>

        {/* Pricing */}
        <div className="border-t border-accent-text/10 pt-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-2xl font-bold text-accent-text">
                {formatPrice(pkg.price, pkg.currency)}
              </p>
              <p className="text-sm text-content/60">
                {formatPrice(pricePerSession, pkg.currency)} per session
              </p>
            </div>
            
            {!isOwner && (
              <button
                onClick={onBook}
                className="px-6 py-2 bg-accent-text text-white rounded-lg hover:bg-accent-text/90 transition-colors font-medium"
              >
                Book Package
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}