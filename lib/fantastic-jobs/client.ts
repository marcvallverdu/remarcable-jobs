import axios, { AxiosInstance } from 'axios';

class FantasticJobsClient {
  private client: AxiosInstance;
  
  constructor() {
    if (!process.env.RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY environment variable is required');
    }
    
    if (!process.env.RAPIDAPI_HOST) {
      throw new Error('RAPIDAPI_HOST environment variable is required');
    }
    
    this.client = axios.create({
      baseURL: `https://${process.env.RAPIDAPI_HOST}`,
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });
    
    // Add retry logic
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        
        // Retry on network errors or 5xx errors
        if (
          config &&
          !config.__retryCount &&
          (error.code === 'ECONNABORTED' ||
            error.code === 'ETIMEDOUT' ||
            (error.response && error.response.status >= 500))
        ) {
          config.__retryCount = config.__retryCount || 0;
          
          if (config.__retryCount < 3) {
            config.__retryCount += 1;
            
            // Exponential backoff
            const delay = Math.pow(2, config.__retryCount) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
            
            return this.client(config);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  async searchJobs(params: Record<string, string | number | boolean | undefined>) {
    try {
      const response = await this.client.get('/jobs/search', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  }
  
  async getJob(id: string) {
    try {
      const response = await this.client.get(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching job ${id}:`, error);
      throw error;
    }
  }
}

export default FantasticJobsClient;