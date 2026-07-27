import axiosInstance from '../utils/axiosInstance';

export const getLossReductionData = () =>
  axiosInstance.get('/get_loss_reduction_data').then(r => r.data.data || []);

export const getLossReductionAggregate = () =>
  axiosInstance.get('/get_loss_reduction_aggregate').then(r => r.data.data || {});

export const getOperationalStats = (month = null) => {
  const params = month ? { month } : {};
  return axiosInstance.get('/get_operational_stats', { params }).then(r => r.data.data || {});
};

export const getAdjusterCategoryBreakdown = (adjusterName, month = null) => {
  const params = { adjuster_name: adjusterName, ...(month ? { month } : {}) };
  return axiosInstance.get('/get_adjuster_category_breakdown', { params }).then(r => r.data.data || []);
};
