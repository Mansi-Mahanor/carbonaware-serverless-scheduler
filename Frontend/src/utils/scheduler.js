/**
 * Utility functions for Carbon-Aware Serverless Workload Scheduling.
 */

// Helper to convert "HH:MM" string to total minutes from midnight
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

// Helper to convert total minutes back to "HH:MM" string
export const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Categorize carbon intensity level
 * @param {number} intensity - gCO2eq/kWh
 * @returns {'Low' | 'Medium' | 'High'}
 */
export const getCarbonIntensityStatus = (intensity) => {
  if (intensity <= 135) return 'Low';
  if (intensity <= 170) return 'Medium';
  return 'High';
};

/**
 * Main scheduling algorithm
 * Calculates best execution time slot based on carbon forecast and workload constraints.
 *
 * Conceptually:
 * bestSlot = argmin(carbonIntensity)
 * subject to: slot + runtime <= deadline
 *
 * @param {Object} job - Submitted workload form data
 * @param {Array} carbonForecast - Array of forecast objects [{ time, Mumbai, Singapore, Tokyo, 'US East' }, ...]
 * @returns {Object} Scheduling result including selectedTime, region, carbonIntensity, estimatedCO2, etc.
 */
export const scheduleWorkload = (job, carbonForecast = []) => {
  const estimatedRuntimeMinutes = parseInt(job.estimatedRuntime, 10) || 30;
  const deadlineMinutes = timeToMinutes(job.deadline || '18:00');
  const preferredRegion = job.preferredRegion || 'Mumbai (ap-south-1)';
  const allowRegionChange = Boolean(job.allowRegionChange);
  const carbonAware = job.carbonAware !== undefined ? Boolean(job.carbonAware) : true;

  // Region mapping helpers
  const regionKeyMap = {
    'Mumbai (ap-south-1)': 'Mumbai',
    'Singapore (ap-southeast-1)': 'Singapore',
    'Tokyo (ap-northeast-1)': 'Tokyo',
    'US East (us-east-1)': 'US East'
  };

  const regionFullNameMap = {
    'Mumbai': 'Mumbai (ap-south-1)',
    'Singapore': 'Singapore (ap-southeast-1)',
    'Tokyo': 'Tokyo (ap-northeast-1)',
    'US East': 'US East (us-east-1)'
  };

  const targetRegions = allowRegionChange
    ? ['Mumbai', 'Singapore', 'Tokyo', 'US East']
    : [regionKeyMap[preferredRegion] || 'Mumbai'];

  let feasibleSlots = [];
  let peakIntensityOverall = 0;

  // Evaluate candidate time slots from forecast
  carbonForecast.forEach((slotData) => {
    const slotMinutes = timeToMinutes(slotData.time);
    const completionTimeMinutes = slotMinutes + estimatedRuntimeMinutes;

    // Check constraint: completionTime <= deadline
    if (completionTimeMinutes <= deadlineMinutes) {
      targetRegions.forEach((regionKey) => {
        const intensity = slotData[regionKey];
        if (intensity !== undefined) {
          if (intensity > peakIntensityOverall) {
            peakIntensityOverall = intensity;
          }

          feasibleSlots.push({
            time: slotData.time,
            slotMinutes,
            regionKey,
            regionFullName: regionFullNameMap[regionKey] || regionKey,
            carbonIntensity: intensity,
            completionTime: minutesToTime(completionTimeMinutes)
          });
        }
      });
    }
  });

  // If no feasible slot was found before deadline, fallback to earliest forecast slot
  if (feasibleSlots.length === 0) {
    const fallbackSlot = carbonForecast[0] || { time: '10:00', Mumbai: 150 };
    const defaultRegionKey = regionKeyMap[preferredRegion] || 'Mumbai';
    const fallbackIntensity = fallbackSlot[defaultRegionKey] || 150;

    // Estimate energy & emissions
    const estimatedEnergyKWh = Number(((estimatedRuntimeMinutes / 60) * 1.5).toFixed(3));
    const estimatedCO2g = Number((estimatedEnergyKWh * fallbackIntensity).toFixed(1));

    return {
      selectedTime: fallbackSlot.time,
      selectedRegion: preferredRegion,
      carbonIntensity: fallbackIntensity,
      estimatedCO2: estimatedCO2g,
      estimatedEnergy: estimatedEnergyKWh,
      co2Saved: 0,
      estimatedRuntime: estimatedRuntimeMinutes,
      deadline: job.deadline || '18:00',
      status: 'Scheduled',
      isFallback: true,
      reason: 'No slot completed before deadline; assigned nearest slot.'
    };
  }

  // Choose slot
  let chosenSlot;
  if (carbonAware) {
    // Select slot with MINIMUM carbon intensity
    chosenSlot = feasibleSlots.reduce((prev, curr) => {
      return curr.carbonIntensity < prev.carbonIntensity ? curr : prev;
    }, feasibleSlots[0]);
  } else {
    // Non carbon-aware: pick earliest slot
    chosenSlot = feasibleSlots[0];
  }

  // Energy consumption (Assume 1.5 kW average cloud compute node draw)
  const estimatedEnergyKWh = Number(((estimatedRuntimeMinutes / 60) * 1.5).toFixed(3));

  // CO2 emissions in grams
  const estimatedCO2g = Number((estimatedEnergyKWh * chosenSlot.carbonIntensity).toFixed(1));

  // Calculated CO2 saved compared to worst peak slot
  const peakCO2 = estimatedEnergyKWh * (peakIntensityOverall || chosenSlot.carbonIntensity + 50);
  const co2Saved = Number(Math.max(0, peakCO2 - estimatedCO2g).toFixed(1));

  return {
    selectedTime: chosenSlot.time,
    selectedRegion: chosenSlot.regionFullName,
    carbonIntensity: chosenSlot.carbonIntensity,
    estimatedCO2: estimatedCO2g,
    estimatedEnergy: estimatedEnergyKWh,
    co2Saved,
    estimatedRuntime: estimatedRuntimeMinutes,
    deadline: job.deadline || '18:00',
    status: 'Scheduled'
  };
};
