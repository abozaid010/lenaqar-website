"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, MapPin, User, ChevronLeft, ChevronRight, Clock, UserPlus, ChevronDown, Loader2, Phone, Users } from 'lucide-react';
import { assignSalsePerson } from '@/components/services/serviceFetching';
import { useI18n } from "@/context/translate-api";
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const Schedule = ({data, dataSales}) => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openDropdown, setOpenDropdown] = useState(null);
  const [appointments, setAppointments] = useState(data || []);
  const [loading, setLoading] = useState(null);
  const [salesperson, setSalesperson] = useState(null);
  const {t}= useI18n()
  const isRTL = t.direction === "rtl";

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getNext7DaysValues = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };
  
  const filteredData = data?.filter((item) => {
    const itemDate = item.created_at.split('T')[0];
    return getNext7DaysValues().includes(itemDate);
  });

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    if (direction === 'next') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const getWeekRangeDisplay = () => {
    const dates = getNext7DaysValues();
    const firstDate = new Date(dates[0]);
    const lastDate = new Date(dates[dates.length - 1]);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    };

    return `${formatDate(firstDate)} - ${formatDate(lastDate)}`;
  };

  // Check if we can navigate to previous/next week
  const canNavigatePrev = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 7); // Only one week back allowed
    return currentDate > minDate;
  };

  const canNavigateNext = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7); // Only one week forward allowed
    return currentDate < maxDate;
  };

  const toggleDropdown = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  const assignSalesPerson = async (appointmentId, salesperson, index) => {
    try {
      setLoading(index);
      const response = await assignSalsePerson(appointmentId, salesperson);
      
      // Update appointments state with new data
      setAppointments(prevAppointments => 
        prevAppointments.map(appointment => 
          appointment.id === appointmentId 
            ? { ...appointment, assigned_sales: [...(appointment.assigned_sales || []), salesperson] }
            : appointment
        )
      );

      // Show success toast
      toast.success(t.schaduall.salesAssigned || "Salesperson assigned successfully");

      // Refresh data from server
      router.refresh();

      setOpenDropdown(null);
    } catch (error) {
      console.log(error);
      toast.error(t.schaduall.assignError || "Failed to assign salesperson");
    } finally {
      setLoading(null);
    }
  };
     
 console.log(filteredData)
  return (
    <div className='border border-red-50'>   
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 ">
        <div className="max-w-7xl mx-auto ">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-primary">
                 {t.Schedule}
              </h1>
            </div>
            
            {/* Week Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span className="text-lg font-semibold text-gray-800">
                    {getWeekRangeDisplay()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigateWeek('prev')}
                    disabled={!canNavigatePrev()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 border ${
                      canNavigatePrev() 
                        ? 'text-gray-600 hover:text-primary hover:bg-primary/10 border-gray-200 hover:border-violet-200'
                        : 'text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft className={`w-4 h-4  ${isRTL ? "rotate-180" : ""}`} />
                    {t.previous}
                  </button>
                  <button 
                    onClick={() => navigateWeek('next')}
                    disabled={!canNavigateNext()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 border ${
                      canNavigateNext() 
                        ? 'text-gray-600 hover:text-primary hover:bg-primary/10 border-gray-200 hover:border-violet-200'
                        : 'text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    {t.next}
                    <ChevronRight className={`w-4 h-4  ${isRTL ? "rotate-180" : ""}`} />   
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Appointments List */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-4">
              {filteredData?.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2"> {t.Noappointments} </h3>
                  <p className="text-gray-400"> {t.scheduleweek}</p>
                </div>
              ) : (
                filteredData?.map((appointment, index) => (
                  <div key={appointment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-800">
                              {appointment.comment || "user"}
                            </h3>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">{formatDate(appointment.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(appointment.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-4">
                          <div className='flex items-center gap-3 text-gray-600'>
                            <Phone className="w-5 h-5 text-primary" />
                            <span className="font-medium">{appointment.phone_number}</span>
                          </div>
                          <div className='flex items-center gap-3 text-gray-600'>
                            <Users className="w-5 h-5 text-primary" />
                            <span className="font-medium">{appointment.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-primary" />
                          <span className={`font-medium ${appointment.assigned_sales ? 'text-primary' : 'text-gray-500'}`}>
                            {appointment.assigned_sales ? (
                              <div className="flex items-center gap-2">
                                {appointment?.assigned_sales.map((e)=><span>{e.name}</span>)}
                              </div>
                            ) : t.Unassigned}
                          </span>
                        </div>
                      </div>

                      {!appointment.assigned_sales && (
                        <div className="pt-4 border-t border-gray-100">
                          <div className="relative">
                            <button
                              onClick={() => toggleDropdown(index)}
                              className="flex items-center justify-between w-full px-4 py-3 border border-gray-200 rounded-lg transition-all duration-200 group"
                              disabled={!dataSales?.length}
                            >
                              <div className="flex items-center gap-3">
                                <UserPlus className="w-5 h-5 text-primary" />
                                <span className="font-medium text-primary">
                                  {dataSales?.length ? t.schaduall.ChooseSalesperson : t.schaduall.noSale}
                                </span>
                              </div>
                              {dataSales?.length > 0 && (
                                <ChevronDown 
                                  className={`w-5 h-5 text-primary transition-transform duration-200 ${
                                    openDropdown === index ? 'rotate-180' : ''
                                  }`}
                                />
                              )}
                            </button>
                            
                            {openDropdown === index && dataSales?.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                <div className="max-h-60 overflow-y-auto">
                                  {dataSales.map((salesperson, index) => (
                                    <button
                                      key={index}
                                      onClick={() => assignSalesPerson(salesperson.id, appointment, index)}
                                      disabled={loading === index}
                                      className={`flex items-center gap-3 w-full p-4 text-left hover:bg-gradient-to-r hover:from-violet-50 hover:to-blue-50 transition-all duration-200 group ${
                                        index !== dataSales.length - 1 ? 'border-b border-gray-100' : ''
                                      } ${loading === index ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                      {console.log(salesperson)}
                                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm group-hover:scale-110 transition-transform duration-200 shadow-md">
                                        {loading === index ? (
                                          <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                          salesperson.name.split(' ').map(n => n[0]).join('')
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-800 group-hover:text-primary transition-colors">
                                          {salesperson.name}
                                        </div>
                                        <div className="text-xs text-gray-500 group-hover:text-primary transition-colors">
                                          {salesperson.role}
                                        </div>
                                      </div>
                                      <div className="w-2 h-2 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* All Sales Section */}
            <div className="col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  {t.AllSales}
                </h3>
                {dataSales?.length > 0 ? (
                  <div className="space-y-3">
                    {dataSales.map((salesperson, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {salesperson.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{salesperson.name}</div>
                          <div className="text-xs text-gray-500">{salesperson.role}</div>
                          <div className="mt-1 flex items-center gap-1">
                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium  ${
                              salesperson.tasks?.length > 0 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {salesperson.tasks?.length || 0} {t.Tasks  }
                            </div>
                            {salesperson.tasks?.length === 0 && (
                              <span className="text-xs text-gray-400">({t.schaduall.Available})</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserPlus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-600 mb-2  ">{t.schaduall.NoSalesAvailable || "nosales"}</h4>
                 
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;