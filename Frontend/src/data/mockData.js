// Mock data for Carbon-Aware Serverless Workload Scheduler

export const AWS_REGIONS = [
  { id: 'ap-south-1', name: 'Mumbai (ap-south-1)', shortName: 'Mumbai', defaultIntensity: 145 },
  { id: 'ap-southeast-1', name: 'Singapore (ap-southeast-1)', shortName: 'Singapore', defaultIntensity: 180 },
  { id: 'ap-northeast-1', name: 'Tokyo (ap-northeast-1)', shortName: 'Tokyo', defaultIntensity: 135 },
  { id: 'us-east-1', name: 'US East (us-east-1)', shortName: 'US East', defaultIntensity: 110 }
];

export const JOB_TYPES = [
  'CSV Processing',
  'Data Analysis',
  'Report Generation',
  'ML Prediction'
];

export const PRIORITY_OPTIONS = ['Low', 'Normal', 'High'];

export const INITIAL_CARBON_FORECAST = [
  { time: '08:00', Mumbai: 210, Singapore: 195, Tokyo: 160, 'US East': 140 },
  { time: '09:00', Mumbai: 195, Singapore: 190, Tokyo: 155, 'US East': 135 },
  { time: '10:00', Mumbai: 180, Singapore: 185, Tokyo: 150, 'US East': 130 },
  { time: '11:00', Mumbai: 165, Singapore: 175, Tokyo: 140, 'US East': 120 },
  { time: '12:00', Mumbai: 150, Singapore: 165, Tokyo: 135, 'US East': 115 },
  { time: '13:00', Mumbai: 130, Singapore: 155, Tokyo: 130, 'US East': 110 },
  { time: '14:00', Mumbai: 125, Singapore: 145, Tokyo: 125, 'US East': 105 },
  { time: '15:00', Mumbai: 135, Singapore: 150, Tokyo: 130, 'US East': 110 },
  { time: '16:00', Mumbai: 150, Singapore: 160, Tokyo: 140, 'US East': 120 },
  { time: '17:00', Mumbai: 170, Singapore: 175, Tokyo: 150, 'US East': 130 },
  { time: '18:00', Mumbai: 190, Singapore: 185, Tokyo: 165, 'US East': 145 },
  { time: '19:00', Mumbai: 205, Singapore: 195, Tokyo: 175, 'US East': 155 },
  { time: '20:00', Mumbai: 220, Singapore: 200, Tokyo: 180, 'US East': 160 },
  { time: '21:00', Mumbai: 200, Singapore: 190, Tokyo: 170, 'US East': 150 },
  { time: '22:00', Mumbai: 180, Singapore: 175, Tokyo: 155, 'US East': 135 }
];

export const INITIAL_JOBS = [
  {
    id: 'JOB-1001',
    name: 'Q3 Financial Risk Model',
    type: 'ML Prediction',
    estimatedRuntime: 45,
    actualRuntime: 42,
    deadline: '17:00',
    selectedTime: '14:00',
    region: 'Mumbai (ap-south-1)',
    carbonIntensity: 125,
    estimatedEnergy: 1.125, // kWh
    estimatedCO2: 140.6, // gCO2
    co2Saved: 95.6, // gCO2 saved vs peak slot
    status: 'Completed',
    priority: 'High',
    createdAt: '2026-09-11 09:15',
    completedAt: '2026-09-11 14:42'
  },
  {
    id: 'JOB-1002',
    name: 'Customer Transaction ETL',
    type: 'CSV Processing',
    estimatedRuntime: 30,
    actualRuntime: 28,
    deadline: '16:00',
    selectedTime: '13:00',
    region: 'Mumbai (ap-south-1)',
    carbonIntensity: 130,
    estimatedEnergy: 0.75,
    estimatedCO2: 97.5,
    co2Saved: 60.0,
    status: 'Completed',
    priority: 'Normal',
    createdAt: '2026-09-11 10:00',
    completedAt: '2026-09-11 13:28'
  },
  {
    id: 'JOB-1003',
    name: 'Weekly User Behavior Aggregation',
    type: 'Data Analysis',
    estimatedRuntime: 60,
    actualRuntime: null,
    deadline: '19:00',
    selectedTime: '14:00',
    region: 'Mumbai (ap-south-1)',
    carbonIntensity: 125,
    estimatedEnergy: 1.5,
    estimatedCO2: 187.5,
    co2Saved: 142.5,
    status: 'Scheduled',
    priority: 'Normal',
    createdAt: '2026-09-11 11:30',
    completedAt: null
  },
  {
    id: 'JOB-1004',
    name: 'Automated Invoice Generator',
    type: 'Report Generation',
    estimatedRuntime: 15,
    actualRuntime: 16,
    deadline: '12:00',
    selectedTime: '11:00',
    region: 'Tokyo (ap-northeast-1)',
    carbonIntensity: 140,
    estimatedEnergy: 0.375,
    estimatedCO2: 52.5,
    co2Saved: 22.5,
    status: 'Completed',
    priority: 'Low',
    createdAt: '2026-09-11 08:45',
    completedAt: '2026-09-11 11:16'
  },
  {
    id: 'JOB-1005',
    name: 'Real-time Demand Forecasting',
    type: 'ML Prediction',
    estimatedRuntime: 25,
    actualRuntime: null,
    deadline: '18:00',
    selectedTime: '14:30',
    region: 'US East (us-east-1)',
    carbonIntensity: 105,
    estimatedEnergy: 0.625,
    estimatedCO2: 65.6,
    co2Saved: 34.4,
    status: 'Running',
    priority: 'High',
    createdAt: '2026-09-11 12:10',
    completedAt: null
  },
  {
    id: 'JOB-1006',
    name: 'System Audit Logs Processing',
    type: 'CSV Processing',
    estimatedRuntime: 50,
    actualRuntime: null,
    deadline: '21:00',
    selectedTime: '14:00',
    region: 'Mumbai (ap-south-1)',
    carbonIntensity: 125,
    estimatedEnergy: 1.25,
    estimatedCO2: 156.2,
    co2Saved: 118.8,
    status: 'Pending',
    priority: 'Low',
    createdAt: '2026-09-11 13:00',
    completedAt: null
  },
  {
    id: 'JOB-1007',
    name: 'Legacy Database Sync Failure',
    type: 'Data Analysis',
    estimatedRuntime: 35,
    actualRuntime: null,
    deadline: '15:00',
    selectedTime: '09:00',
    region: 'Singapore (ap-southeast-1)',
    carbonIntensity: 190,
    estimatedEnergy: 0.875,
    estimatedCO2: 166.25,
    co2Saved: 0,
    status: 'Failed',
    priority: 'High',
    createdAt: '2026-09-11 08:00',
    completedAt: null
  }
];

export const INITIAL_SETTINGS = {
  defaultRegion: 'Mumbai (ap-south-1)',
  carbonAwareEnabled: true,
  runtimeSafetyMargin: '10%',
  apiStatus: 'Healthy (Live Mock Stream)',
  maxEmissionThreshold: 200,
  allowAutoRegionFallback: true
};
