export type ScheduleDto = {
  scheduleId: number;
  employeeId: number;
  employeeName: string;
  employeeType: string;
  task: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
};

export type ScheduleMeta = {
  currentPage: number;
  size: number;
  lastPage: number;
  totalElements: number;
};

export type SchedulesResponse = {
  code: number;
  status?: string;
  message?: string;
  data: ScheduleDto[];
  meta?: ScheduleMeta;
};

export type ScheduleFilter = {
  page: number;
  size: number;
};
