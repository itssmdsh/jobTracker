export interface AppSettings {
  channels: string[];
  frequency: string;
  daily_time: string;
  auto_mark: 'Yes' | 'No';
  setup_completed: 'true' | 'false';
  profile?: {
    name: string;
    email: string;
    college: string;
    degree: string;
    branch: string;
    yop: string;
    tech_stack: string;
    discovery: string;
    consent: boolean;
  };
}

export interface ScrapedLink {
  id: number;
  url: string;
  status: 'Pending' | 'Applied';
  created_at: string;
  source: string;
}
