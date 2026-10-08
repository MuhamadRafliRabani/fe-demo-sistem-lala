"use client";

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, X, MapPin, Target, Clock, Globe, Navigation, Zap } from 'lucide-react';
import regionsService from '@/services/regions-service';
import { toast } from 'sonner';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const EditRegionSheet = ({ open, onOpenChange, region, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius: '',
    duration_mins: '',
    is_active: true,
  });

  useEffect(() => {
    if (region) {
      setFormData({
        name: region.name || '',
        latitude: region.latitude?.toString() || '',
        longitude: region.longitude?.toString() || '',
        radius: region.radius?.toString() || '',
        duration_mins: region.duration_mins?.toString() || '',
        is_active: region.is_active ?? true,
      });
    } else {
      // Reset form for new region
      setFormData({
        name: '',
        latitude: '',
        longitude: '',
        radius: '',
        duration_mins: '',
        is_active: true,
      });
    }
  }, [region, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseFloat(formData.radius),
        duration_mins: parseInt(formData.duration_mins),
        is_active: formData.is_active,
      };

      let response;
      if (region?.id) {
        response = await regionsService.updateRegion(region.id, payload);
        toast.success('Region updated successfully!');
      } else {
        response = await regionsService.createRegion(payload);
        toast.success('Region created successfully!');
      }

      onSuccess?.(response.data);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving region:', error);
      toast.error(error.response?.data?.message || 'Failed to save region');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          }));
          toast.success('Current location detected!');
        },
        (error) => {
          toast.error('Failed to get current location');
        }
      );
    } else {
      toast.error('Geolocation is not supported');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-gradient-to-br from-slate-50 to-white border-l-0">
        <SheetHeader className="pb-6 bg-gradient-to-r from-blue-500 to-blue-600 -mx-6 px-6 py-6 text-white">
          <SheetTitle className="flex items-center gap-3 text-xl">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <MapPin className="h-5 w-5" />
            </div>
            {region?.id ? 'Edit Survey Region' : 'Create New Region'}
          </SheetTitle>
          <SheetDescription className="text-blue-100 text-base">
            {region?.id 
              ? 'Update the geofencing region information below.' 
              : 'Define a new survey region with center coordinates and coverage radius.'
            }
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6 px-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={formData.is_active ? "default" : "secondary"} 
                className={`${formData.is_active 
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0" 
                  : "bg-gray-100 text-gray-600 border-gray-200"} px-3 py-1`}>
                {formData.is_active ? "Active Region" : "Inactive"}
              </Badge>
              {region?.id && (
                <span className="text-sm text-gray-500">ID: #{region.id}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active" className="text-sm font-medium">Active</Label>
            </div>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                Region Name
              </Label>
              <Input
                id="name"
                placeholder="e.g., Jakarta Selatan Coverage Area"
                className="h-11 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Coordinates */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Center Coordinates
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyCurrentLocation}
                className="text-xs bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
              >
                <Navigation className="h-3 w-3 mr-1" />
                Use My Location
              </Button>
            </div>
            
            <Card className="bg-gradient-to-br from-gray-50 to-white border-gray-200">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude" className="text-sm font-medium text-gray-700">
                      Latitude
                    </Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      placeholder="-6.2615"
                      className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 font-mono text-sm"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                      required
                      min="-90"
                      max="90"
                    />
                    <p className="text-xs text-gray-500">Range: -90 to 90</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="longitude" className="text-sm font-medium text-gray-700">
                      Longitude
                    </Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="0.000001"
                      placeholder="106.8106"
                      className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 font-mono text-sm"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                      required
                      min="-180"
                      max="180"
                    />
                    <p className="text-xs text-gray-500">Range: -180 to 180</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coverage Settings */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Coverage Settings
            </h3>
            
            <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="radius" className="text-sm font-medium text-gray-700">
                      Coverage Radius
                    </Label>
                    <div className="relative">
                      <Input
                        id="radius"
                        type="number"
                        step="0.1"
                        placeholder="10.0"
                        className="bg-white border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 pr-12"
                        value={formData.radius}
                        onChange={(e) => handleInputChange('radius', e.target.value)}
                        required
                        min="0.1"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                        KM
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Coverage distance from center</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration_mins" className="text-sm font-medium text-gray-700">
                      Estimation Time
                    </Label>
                    <div className="relative">
                      <Input
                        id="duration_mins"
                        type="number"
                        placeholder="60"
                        className="bg-white border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 pr-16"
                        value={formData.duration_mins}
                        onChange={(e) => handleInputChange('duration_mins', e.target.value)}
                        required
                        min="1"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                        MIN
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Survey duration estimate</p>
                  </div>
                </div>

                {/* Visual Coverage Preview */}
                {formData.radius && (
                  <div className="bg-gradient-to-r from-orange-100 to-yellow-50 p-3 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-orange-800">Coverage Preview</span>
                      <span className="text-lg font-bold text-orange-600">{formData.radius} KM</span>
                    </div>
                    <div className="mt-2 h-2 bg-orange-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-300"
                        style={{ width: `${Math.min((parseFloat(formData.radius) / 50) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-orange-600 mt-1">Approximately {Math.round(Math.PI * Math.pow(parseFloat(formData.radius), 2))} km² area</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t bg-gradient-to-r from-gray-50 to-white -mx-6 px-6 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="bg-white border-gray-300 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {region?.id ? 'Update Region' : 'Create Region'}
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EditRegionSheet;
