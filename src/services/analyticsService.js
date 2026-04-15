import axiosInstance from '../utils/axiosInstance';

export const getLossReductionData = () =>
  axiosInstance.get('/get_loss_reduction_data').then(r => r.data.data || []);

export const getLossReductionAggregate = () =>
  axiosInstance.get('/get_loss_reduction_aggregate').then(r => r.data.data || {});
