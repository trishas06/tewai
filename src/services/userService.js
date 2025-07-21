import axiosInstance from '../utils/axiosInstance';

const userService = {
  getUsers: async (token) => {
    const response = await axiosInstance.get('/get_users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  createUser: async (user, token) => {
    const response = await axiosInstance.post('/create_user', user, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  updateUser: async (user, token) => {
    const response = await axiosInstance.post('/update_user', user, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  deleteUser: async (user_ids, token) => {
    const response = await axiosInstance.post(
      '/delete_user',
      { user_ids },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
};

export default userService; 